// api/extract-memory.js
//
// Looks at a single user chat message and pulls out durable,
// worth-remembering facts about the user (age, grade/class, school,
// location, plans, preferences, habits, opinions, etc.) using Groq.
//
// This is a SEPARATE, small, non-streaming endpoint from
// /api/chat.js on purpose — chat.js streams the raw answer text
// straight to the browser, so there's no clean way to smuggle
// structured JSON metadata through that same stream without
// corrupting the visible reply. This endpoint is effectively
// fire-and-forget from the client: if it's slow, errors, or returns
// nothing, the chat itself is completely unaffected (the client
// always treats a failure here as "no new memories this turn").
//
// SAFETY: this must never learn or store secrets. The prompt below
// explicitly forbids passwords, PINs, OTPs, API keys and similar,
// and the response is filtered again server-side as a second layer
// in case the model ever slips.

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  let body = "";

  for await (const chunk of request) {
    body += chunk.toString();
  }

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// SECOND-LAYER SECRET FILTER
// ============================================================
// The model is instructed never to extract these, but this regex
// pass is a cheap, deterministic backstop in case it ever does.
// Any fact touching one of these topics is dropped entirely rather
// than saved in any form (even redacted).

const SECRET_PATTERN =
  /\b(password|passwd|pin\s*(code|number)?|otp|one[- ]time\s*(code|password)|api[- ]?key|access\s*token|auth(?:orization)?\s*token|secret\s*key|credit\s*card|debit\s*card|card\s*number|cvv|cvc|ssn|social\s*security|bank\s*account|routing\s*number)\b/i;

function stripSecretFacts(facts) {
  return facts.filter(fact => !SECRET_PATTERN.test(fact));
}

// ============================================================
// HANDLER
// ============================================================

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(request);

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      response.status(200).json({ facts: [] });
      return;
    }

    if (!process.env.GROQ_API_KEY) {
      // Fail soft — memory extraction is a nice-to-have, never a
      // reason to break or slow down the actual chat.
      response.status(200).json({ facts: [] });
      return;
    }

    const systemPrompt = `
You extract durable, worth-remembering facts about a user from a
single chat message, for a personal-memory feature.

Extract things like: age, grade/class, school or college, city or
location, occupation, relationships, plans, trips, preferences,
likes, dislikes, habits, opinions, goals — anything that would
genuinely help personalize a future conversation with this same
person.

Do NOT extract:
- Greetings, small talk, questions, or requests with no personal
  fact in them ("hi", "what's the weather", "can you help me with
  math").
- One-off, temporary statements with no lasting value ("I'm bored
  right now", "wait a sec").
- Passwords, PINs, OTPs, one-time codes, API keys, access/auth
  tokens, secret keys, credit/debit card numbers, CVV/CVC codes,
  bank account or routing numbers, SSNs, or any other credential or
  secret. If the message contains anything like this, exclude it
  completely — do not reference it even indirectly.

Rewrite each fact as a short, standalone, third-person statement
(e.g. "Is in class 12", "Age is 18", "Studies at Delhi Public
School", "Planning a beach trip", "Prefers concise answers"). Keep
each fact under 12 words.

Respond with ONLY a raw JSON array of strings, nothing else — no
markdown, no code fences, no explanation. If there is nothing worth
remembering, respond with exactly: []
`;

    const groqResponse = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.1,
          max_tokens: 300
        })
      },
      12000
    );

    if (!groqResponse.ok) {
      response.status(200).json({ facts: [] });
      return;
    }

    const data = await groqResponse.json();

    const raw =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    let facts = [];

    if (typeof raw === "string") {
      const cleaned =
        raw
          .trim()
          .replace(/^```(json)?/i, "")
          .replace(/```$/, "")
          .trim();

      try {
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed)) {
          facts =
            parsed
              .filter(item => typeof item === "string")
              .map(item => item.trim())
              .filter(Boolean)
              .slice(0, 8);
        }
      } catch {
        facts = [];
      }
    }

    facts = stripSecretFacts(facts);

    response.status(200).json({ facts });

  } catch (error) {
    console.error("Memory extraction error:", error);

    // Never let extraction failures affect the chat experience.
    response.status(200).json({ facts: [] });
  }
}
