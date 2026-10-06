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
  new RegExp(
    "\\b(" +
      "pass(?:word|wd|code|phrase)s?|pin|otp|cvv|cvc|ssn|" +
      "api[ _-]?keys?|secret[ _-]?keys?|client[ _-]?secret|" +
      "(?:access|auth(?:orization)?|bearer|refresh|session|login)[ _-]?tokens?|tokens?|" +
      "credentials?|private[ _-]?keys?|seed[ _-]?phrase|" +
      "(?:recovery|backup|security|verification)[ _-]?(?:code|phrase|answer)s?|" +
      "2fa|mfa|credit[ _-]?card|debit[ _-]?card|card[ _-]?number|" +
      "account[ _-]?number|routing[ _-]?number|social[ _-]?security|" +
      "aadhaa?r|bank[ _-]?account|one[ -]?time[ -]?(?:code|password)" +
    ")\\b" +
    // long digit runs (card / account / phone / ID numbers)
    "|(?:\\d[ -]?){9,}" +
    // well-known API-key shapes, and long mixed letter+digit strings
    "|\\b(?:sk|pk|gsk|ghp|xox[abp]|AKIA)[-_A-Za-z0-9]{16,}" +
    "|\\b(?=[A-Za-z0-9_-]*\\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{24,}\\b",
    "i"
  );

function stripSecretFacts(facts) {
  return facts.filter(fact => !SECRET_PATTERN.test(fact));
}

// Drops every sentence that mentions a secret, keeps the rest, so a
// secret is never even sent on to the AI model.
function stripSecretSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?\n;])\s+|\n+/)
    .filter(part => part.trim() && !SECRET_PATTERN.test(part))
    .join(" ")
    .trim();
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

    // Secret-looking sentences are removed BEFORE the text goes to the
    // AI model. Only the first part of a long message is ever needed.
    const messageForModel =
      stripSecretSentences(message).slice(0, 1500);

    if (!messageForModel) {
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

    // openai/gpt-oss-20b is a REASONING model: its hidden "thinking"
    // tokens are counted against max_tokens. With a small budget the
    // model can run out while still thinking and return an EMPTY
    // answer — which would silently mean "no facts, ever". So the
    // thinking is kept short and the budget is generous.
    async function callGroq(extra) {
      return fetchWithTimeout(
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
              { role: "user", content: messageForModel }
            ],
            temperature: 0.1,
            max_tokens: 1200,
            ...extra
          })
        },
        12000
      );
    }

    let groqResponse =
      await callGroq({ reasoning_effort: "low" });

    // If the optional parameter is ever rejected, try the plain call.
    if (!groqResponse.ok) {
      groqResponse = await callGroq({});
    }

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

      // Be forgiving if the model wrapped the array in extra words.
      const arrayText =
        cleaned.startsWith("[")
          ? cleaned
          : (cleaned.match(/\[[\s\S]*\]/) || [""])[0];

      try {
        const parsed = JSON.parse(arrayText);

        if (Array.isArray(parsed)) {
          facts =
            parsed
              .filter(item => typeof item === "string")
              .map(item => item.replace(/\s+/g, " ").trim())
              .filter(item => item && item.length <= 140)
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
