// /api/chat.js
//
// Vercel Edge Function. Handles every chat message:
//   1. Searches the web via Tavily (grounds the answer in current info)
//   2. Sends the question + search results + short memory/history
//      context to Groq (Llama/gpt-oss) with streaming enabled
//   3. Re-streams the answer back to the browser as plain text,
//      preceded by one JSON line describing the sources used
//
// Requires two environment variables set in Vercel:
//   TAVILY_API_KEY
//   GROQ_API_KEY
// Both stay server-side only — never sent to the browser.

export const config = {
  runtime: "edge"
};

const SYSTEM_PROMPT =
  "You are Hare Krishna AI, a helpful, friendly assistant. " +
  "Answer clearly and concisely. When web search results are provided " +
  "below, use them to give an accurate, up-to-date answer and prefer " +
  "them over your own prior knowledge for anything time-sensitive. " +
  "If the search results don't actually help answer the question, " +
  "just answer normally from what you know. Never make up facts about " +
  "the user that weren't given to you.";

const GROQ_MODEL = "openai/gpt-oss-20b";

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const message =
    body && typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message) {
    return new Response("Missing 'message'", { status: 400 });
  }

  // Recent conversation turns, trimmed to keep the prompt small.
  // Expected shape: [{ role: "user" | "assistant", content: "..." }, ...]
  const history =
    Array.isArray(body.history)
      ? body.history
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-10)
      : [];

  // Facts the app already knows about the user (from Settings → Memory
  // and/or past chat messages) — see getKnownFacts() in app.js.
  const facts =
    body.facts && typeof body.facts === "object" ? body.facts : null;

  // ---------------------------------------------------------
  // 1. Web search (Tavily)
  // ---------------------------------------------------------

  let sources = [];
  let searchContext = "";

  try {
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: message,
        max_results: 5,
        search_depth: "basic"
      })
    });

    if (tavilyRes.ok) {
      const data = await tavilyRes.json();
      const results = Array.isArray(data.results) ? data.results : [];

      sources = results.map(r => ({
        title: r.title || r.url,
        url: r.url
      }));

      searchContext = results
        .map(
          (r, i) =>
            `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`
        )
        .join("\n\n");
    }
  } catch (err) {
    // Search failing shouldn't break the whole reply — just answer
    // without web context below.
    console.error("Tavily search error:", err);
  }

  // ---------------------------------------------------------
  // 2. Build the prompt for Groq
  // ---------------------------------------------------------

  let systemContent = SYSTEM_PROMPT;

  if (facts && Object.keys(facts).length) {
    systemContent +=
      "\n\nKnown facts about the user (only mention if relevant): " +
      JSON.stringify(facts);
  }

  if (searchContext) {
    systemContent +=
      "\n\nWeb search results for the user's question:\n\n" +
      searchContext;
  }

  const messages = [
    { role: "system", content: systemContent },
    ...history,
    { role: "user", content: message }
  ];

  // ---------------------------------------------------------
  // 3. Call Groq with streaming enabled
  // ---------------------------------------------------------

  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        stream: true,
        temperature: 0.7
      })
    }
  );

  if (!groqRes.ok || !groqRes.body) {
    const errorText = await groqRes.text().catch(() => "");

    console.error("Groq request failed:", groqRes.status, errorText);

    return new Response("AI request failed", { status: 502 });
  }

  // ---------------------------------------------------------
  // 4. Re-stream to the browser.
  //
  // Protocol: first chunk is one JSON line describing sources,
  // everything after that is raw answer text as it's generated.
  // ---------------------------------------------------------

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {

      controller.enqueue(
        encoder.encode(
          JSON.stringify({ type: "sources", sources }) + "\n"
        )
      );

      const reader = groqRes.body.getReader();

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");

        // Last entry may be an incomplete line — keep it for next read.
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed.startsWith("data:")) continue;

          const payload = trimmed.slice(5).trim();

          if (!payload || payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload);
            const delta =
              json.choices &&
              json.choices[0] &&
              json.choices[0].delta &&
              json.choices[0].delta.content;

            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          } catch {
            // Ignore any malformed SSE chunk and keep streaming.
          }
        }
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}
