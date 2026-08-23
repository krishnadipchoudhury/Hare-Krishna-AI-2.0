// /api/chat.js
//
// Vercel Function (Node.js runtime — Edge Functions were deprecated
// by Vercel, so this runs as a standard Node.js function, which
// also gives us real filesystem access and native streaming).
//
// Handles every chat message that the client didn't already answer
// from its own local memory:
//   1. Tries the arithmetic solver (knowledge/math.js) first — pure
//      math questions get a guaranteed-correct, instant, fully
//      worked-out answer with no search or LLM call needed at all.
//   2. Checks knowledge.json — if the question matches an entry
//      there, that answer is treated as authoritative ground truth
//      and the web search is skipped entirely for this turn, so it
//      can never be overridden or contradicted by a live search.
//   3. Otherwise searches the web via Tavily (grounds the answer in
//      current info).
//   4. Sends the question + search results (or the knowledge.json /
//      math facts) + short memory/history context to Groq, with
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

import fs from "fs";
import path from "path";
import { trySolveMath, explainMathSolution } from "../knowledge/math.js";

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
// Local knowledge base — see /knowledge/knowledge.json.
// Any matching entry here is treated as ground truth and the
// web search is skipped for that turn, so this data can never
// get overridden or contradicted by a live search result.
// Read fresh from disk on every request (cheap — it's a small
// file) so edits to it go live on the next deploy with zero
// code changes needed.
// ---------------------------------------------------------

function loadKnowledgeBase() {
  try {
    const filePath = path.join(
      process.cwd(),
      "knowledge",
      "knowledge.json"
    );

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    return Array.isArray(data.entries) ? data.entries : [];

  } catch (err) {
    console.error("Failed to load knowledge.json:", err);
    return [];
  }
}

function findKnowledgeMatches(message, knowledgeEntries) {
  const lower = message.toLowerCase();

  return knowledgeEntries.filter(
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

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // ---------------------------------------------------------
  // 0. Pure arithmetic — answered instantly, no search or LLM
  //    call at all, guaranteed correct.
  // ---------------------------------------------------------

  const mathSolved = trySolveMath(message);

  if (mathSolved) {
    const mathStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "status", searching: false }) + "\n"
          )
        );

        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "sources", sources: [] }) + "\n"
          )
        );

        controller.enqueue(
          encoder.encode(explainMathSolution(mathSolved))
        );

        controller.close();
      }
    });

    return new Response(mathStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  }

  // Decided synchronously, before any network call, so the
  // "searching vs thinking" status can be sent to the client
  // immediately once the stream opens.
  const knowledgeEntries = loadKnowledgeBase();
  const knowledgeMatches = findKnowledgeMatches(message, knowledgeEntries);
  const usingLocalKnowledge = knowledgeMatches.length > 0;

  const stream = new ReadableStream({
    async start(controller) {

      // ---------------------------------------------------
      // 1. Status line FIRST — before any slow work — so the
      //    UI can show the right loading label right away.
      // ---------------------------------------------------

      controller.enqueue(
        encoder.encode(
          JSON.stringify({
            type: "status",
            searching: !usingLocalKnowledge
          }) + "\n"
        )
      );

      // ---------------------------------------------------
      // 2. Web search (Tavily) — skipped entirely when the
      //    question was already answered by knowledge.json.
      // ---------------------------------------------------

      let sources = [];
      let searchContext = "";

      if (!usingLocalKnowledge) {
        try {
          const tavilyRes = await fetch(
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
            }
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
          }
        } catch (err) {
          // Search failing shouldn't break the whole reply — just
          // answer without web context below.
          console.error("Tavily search error:", err);
        }
      }

      // ---------------------------------------------------
      // 3. Sources line — empty when answering from local
      //    knowledge, since nothing was actually searched.
      // ---------------------------------------------------

      controller.enqueue(
        encoder.encode(
          JSON.stringify({ type: "sources", sources }) + "\n"
        )
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
        groqRes = await fetch(
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
      } catch (err) {
        console.error("Groq fetch error:", err);
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

        // Headers are already committed once the stream is open,
        // so a failure here has to be sent as plain answer text
        // rather than an HTTP error status.
        controller.enqueue(
          encoder.encode(
            "Sorry, I couldn't generate a response just now. Please try again."
          )
        );

        controller.close();
        return;
      }

      // ---------------------------------------------------
      // 6. Relay Groq's SSE stream as plain text chunks.
      // ---------------------------------------------------

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
