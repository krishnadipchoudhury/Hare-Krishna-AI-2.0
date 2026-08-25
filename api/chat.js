// /api/chat.js
//
// Vercel Function — Node.js runtime.
//
// IMPORTANT: Node.js Functions on Vercel use the traditional
// (request, response) signature — response.write()/response.end() —
// NOT the Web-standard (request) => new Response(...) signature.
// That Web API style only works on Edge Functions. Since Edge
// Functions were deprecated by Vercel, this runs as a Node.js
// Function, so it has to use response.write()/.end() to actually
// send anything back. (An earlier version of this file used the
// Edge-style API by mistake — every request would hang for the
// full maxDuration with zero outgoing requests, because "return
// new Response(...)" doesn't mean anything to the Node runtime;
// nothing ever told the underlying connection a response was
// ready, so it just sat open until Vercel force-killed it.)
//
// Handles every chat message that the client didn't already answer
// from its own local memory:
//   1. Tries the arithmetic solver (knowledge/math.js) first — pure
//      math questions get a guaranteed-correct, instant, fully
//      worked-out answer with no search or LLM call needed at all.
//   2. Checks knowledge/knowledgeData.js — if the question matches
//      an entry there, that answer is treated as authoritative
//      ground truth and the web search is skipped entirely for this
//      turn, so it can never be overridden or contradicted by a
//      live search.
//   3. Otherwise searches the web via Tavily (grounds the answer in
//      current info).
//   4. Sends the question + search results (or the knowledge/math
//      facts) + short memory/history context to Groq, with
//      streaming enabled.
//   5. Re-streams the answer back to the browser as plain text,
//      preceded by two JSON lines:
//        - {"type":"status","searching":true|false}   sent first,
//          before any slow work, so the UI can show "Searching the
//          web" vs "Thinking" accurately.
//        - {"type":"sources","sources":[...]}          sent once
//          search — if any — has finished.
//
// Requires two environment variables set in Vercel:
//   TAVILY_API_KEY
//   GROQ_API_KEY
// Both stay server-side only — never sent to the browser.

import { trySolveMath, explainMathSolution } from "../knowledge/math.js";
import { knowledgeEntries } from "../knowledge/knowledgeData.js";

const SYSTEM_PROMPT =
  "You are Hare Krishna AI, a helpful, friendly assistant.\n\n" +

  "MATCH YOUR ANSWER TO THE QUESTION — this is important:\n" +
  "- Fill-in-the-blank question → fill in the blank(s), nothing more.\n" +
  "- One-word question → answer in one word.\n" +
  "- Very short-answer question → 1 short sentence.\n" +
  "- Short-answer question → a few sentences.\n" +
  "- Long-answer question → a full, detailed explanation.\n" +
  "- Very long-answer / \"explain in detail\" question → thorough, " +
  "well-organized, as long as it needs to be.\n" +
  "Never pad a simple question with headers, tables, or extra " +
  "sections it didn't ask for. A quick factual question deserves a " +
  "quick factual answer, not an essay. Only use tables, bullet " +
  "lists, or multiple headers when the content genuinely has " +
  "multiple comparable items or steps worth structuring that way.\n\n" +

  "FORMATTING: reply in Markdown (use **bold**, *italic*, proper " +
  "line breaks, lists, and tables) since it's rendered visually — " +
  "never use raw HTML tags like <br>.\n\n" +

  "WEB SEARCH: when web search results are provided below, use them " +
  "to give an accurate, current answer, and prefer them over your " +
  "own prior knowledge for anything time-sensitive. If the results " +
  "don't actually help answer the question, just answer normally " +
  "from what you know. Never make up facts about the user that " +
  "weren't given to you.";

const GROQ_MODEL = "openai/gpt-oss-20b";

// ---------------------------------------------------------
// Node's request object is a raw stream, not pre-parsed — this
// reads and JSON-parses the incoming POST body manually.
// ---------------------------------------------------------

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", chunk => {
      raw += chunk;
    });

    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });

    request.on("error", reject);
  });
}

// ---------------------------------------------------------
// Neither external API call had a timeout before — if Tavily
// or Groq ever hangs (no response, no error, nothing), the
// function just waits until Vercel force-kills the whole
// thing at maxDuration, producing an opaque 504 with zero
// diagnostic info. This wraps fetch with an explicit budget
// so a hang fails fast with a clear, catchable error instead.
// ---------------------------------------------------------

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });

  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------
// Local knowledge base — see /knowledge/knowledgeData.js.
// Any matching entry here is treated as ground truth and the
// web search is skipped for that turn, so this data can never
// get overridden or contradicted by a live search result.
// ---------------------------------------------------------

function findKnowledgeMatches(message, entries) {
  const lower = message.toLowerCase();

  return entries.filter(
    entry =>
      entry &&
      Array.isArray(entry.keywords) &&
      typeof entry.answer === "string" &&
      entry.keywords.some(
        keyword =>
          typeof keyword === "string" &&
          keyword.trim() &&
          lower.includes(keyword.trim().toLowerCase())
      )
  );
}

export default async function handler(request, response) {

  if (request.method !== "POST") {
    response.writeHead(405, { "Content-Type": "text/plain" });
    response.end("Method not allowed");
    return;
  }

  let body;

  try {
    body = await readJsonBody(request);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Invalid JSON body");
    return;
  }

  const message =
    body && typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message) {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("Missing 'message'");
    return;
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

  // If the client disconnects (closes the tab, navigates away),
  // stop doing work for a response nobody will see.
  let clientDisconnected = false;

  request.on("close", () => {
    clientDisconnected = true;
  });

  // ---------------------------------------------------------
  // 0. Pure arithmetic — answered instantly, no search or LLM
  //    call at all, guaranteed correct.
  // ---------------------------------------------------------

  const mathSolved = trySolveMath(message);

  if (mathSolved) {
    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    });

    response.write(
      JSON.stringify({ type: "status", searching: false }) + "\n"
    );

    response.write(
      JSON.stringify({ type: "sources", sources: [] }) + "\n"
    );

    response.write(explainMathSolution(mathSolved));

    response.end();
    return;
  }

  // Decided synchronously, before any network call, so the
  // "searching vs thinking" status can be sent to the client
  // immediately once the response opens.
  const knowledgeMatches = findKnowledgeMatches(message, knowledgeEntries);
  const usingLocalKnowledge = knowledgeMatches.length > 0;

  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache"
  });

  // ---------------------------------------------------
  // 1. Status line FIRST — before any slow work — so the
  //    UI can show the right loading label right away.
  // ---------------------------------------------------

  response.write(
    JSON.stringify({
      type: "status",
      searching: !usingLocalKnowledge
    }) + "\n"
  );

  // ---------------------------------------------------
  // 2. Web search (Tavily) — skipped entirely when the
  //    question was already answered by the knowledge base.
  // ---------------------------------------------------

  let sources = [];
  let searchContext = "";

  if (!usingLocalKnowledge && !clientDisconnected) {
    try {
      const tavilyRes = await fetchWithTimeout(
        "https://api.tavily.com/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: message,
            max_results: 5,
            search_depth: "basic"
          })
        },
        10000
      );

      if (tavilyRes.ok) {
        const data = await tavilyRes.json();
        const results =
          Array.isArray(data.results) ? data.results : [];

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

      } else {
        console.error(
          "Tavily returned non-OK status:",
          tavilyRes.status,
          await tavilyRes.text().catch(() => "")
        );
      }
    } catch (err) {
      // Search failing (including a timeout) shouldn't break
      // the whole reply — just answer without web context below.
      console.error(
        "Tavily search error:",
        err && err.name === "AbortError"
          ? "timed out after 10s"
          : err
      );
    }
  }

  if (clientDisconnected) {
    response.end();
    return;
  }

  // ---------------------------------------------------
  // 3. Sources line — empty when answering from local
  //    knowledge, since nothing was actually searched.
  // ---------------------------------------------------

  response.write(
    JSON.stringify({ type: "sources", sources }) + "\n"
  );

  // ---------------------------------------------------
  // 4. Build the prompt for Groq
  // ---------------------------------------------------

  let systemContent = SYSTEM_PROMPT;

  if (facts && Object.keys(facts).length) {
    systemContent +=
      "\n\nKnown facts about the user (only mention if relevant): " +
      JSON.stringify(facts);
  }

  if (usingLocalKnowledge) {
    systemContent +=
      "\n\nLOCAL KNOWLEDGE BASE (authoritative — this data was " +
      "provided directly by the app owner. Always use it exactly " +
      "as given and NEVER contradict, override, or second-guess " +
      "it with general knowledge, prior training, or anything " +
      "else — it is correct by definition):\n\n" +
      knowledgeMatches
        .map(entry => `- ${entry.answer}`)
        .join("\n");
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

  // ---------------------------------------------------
  // 5. Call Groq with streaming enabled
  // ---------------------------------------------------

  let groqRes;

  try {
    groqRes = await fetchWithTimeout(
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
      },
      15000
    );
  } catch (err) {
    console.error(
      "Groq fetch error:",
      err && err.name === "AbortError"
        ? "timed out after 15s"
        : err
    );
  }

  if (!groqRes || !groqRes.ok || !groqRes.body) {
    if (groqRes) {
      const errorText = await groqRes.text().catch(() => "");
      console.error(
        "Groq request failed:",
        groqRes.status,
        errorText
      );
    }

    // Headers are already committed once the response is open,
    // so a failure here has to be sent as plain answer text
    // rather than an HTTP error status.
    response.write(
      "Sorry, I couldn't generate a response just now. Please try again."
    );

    response.end();
    return;
  }

  // ---------------------------------------------------
  // 6. Relay Groq's SSE stream as plain text chunks.
  // ---------------------------------------------------

  const reader = groqRes.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  // If the connection to Groq succeeded but then the stream
  // goes silent mid-way (never sends [DONE], never errors),
  // this breaks the loop after 20s of no new data instead of
  // hanging until Vercel force-kills the whole function.
  const STREAM_STALL_MS = 20000;

  while (true) {
    if (clientDisconnected) break;

    let readResult;

    try {
      readResult = await Promise.race([
        reader.read(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("STREAM_STALLED")),
            STREAM_STALL_MS
          )
        )
      ]);

    } catch (stallErr) {
      console.error(
        "Groq stream stalled — no data for",
        STREAM_STALL_MS / 1000,
        "seconds, ending stream early."
      );

      break;
    }

    const { done, value } = readResult;

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
          response.write(delta);
        }
      } catch {
        // Ignore any malformed SSE chunk and keep streaming.
      }
    }
  }

  response.end();
}
