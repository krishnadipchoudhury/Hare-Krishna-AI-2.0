// api/chat.js

import {
  trySolveMath,
  explainMathSolution
} from "../knowledge/math.js";

// FIX: knowledgeData.js exports a NAMED export
// (export const knowledgeEntries = [...]), not a default
// export. The previous line here was:
//
//   import knowledgeEntries from "../knowledge/knowledgeData.js";
//
// That's a default import against a module with no default
// export — Node throws "does not provide an export named
// 'default'" the instant this file is loaded, which crashes
// the ENTIRE function before it can do anything at all. That's
// why nothing worked — not just local knowledge matching, but
// Tavily and Groq too, since the whole file failed to load.
//
// Fixed to work regardless of which export style the file
// ends up using (named OR default), so this can't silently
// break again if knowledgeData.js is edited later.
import * as knowledgeDataModule from "../knowledge/knowledgeData.js";

const knowledgeEntries =
  Array.isArray(knowledgeDataModule.default)
    ? knowledgeDataModule.default
    : Array.isArray(knowledgeDataModule.knowledgeEntries)
      ? knowledgeDataModule.knowledgeEntries
      : [];

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
// FIX: "jina-embeddings-v5-text-small" is not a real Jina Embeddings
// API model — Jina's actual lineup is jina-embeddings-v2-*,
// jina-embeddings-v3, and jina-embeddings-v4 (v3/v4 are the ones
// that support the retrieval.query / retrieval.passage task
// adapters this code already uses). Every embedding call has been
// hitting Jina's API with an unknown model id, getting a 400 back,
// and getting silently swallowed by the try/catch around
// findKnowledgeMatch() — so knowledgeData.js has NEVER actually been
// matched against a single message. That's why identity questions
// ("who is your developer", "what is your name") never hit your
// local "creator"/"name" entries and fell straight through to Groq's
// raw model, which — since it's OpenAI's own open-weight
// "gpt-oss-20b" — defaults to introducing itself as ChatGPT by
// OpenAI when nothing overrides it.
const JINA_MODEL = "jina-embeddings-v3";
const KNOWLEDGE_MATCH_THRESHOLD = 0.78;

// ============================================================
// READ JSON BODY
// ============================================================

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

// ============================================================
// FETCH WITH TIMEOUT
// ============================================================

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 15000
) {
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
// BUILD KNOWLEDGE TEXT
// ============================================================

function buildKnowledgeText(entry) {
  const question =
    typeof entry.question === "string"
      ? entry.question
      : "";

  const keywords =
    Array.isArray(entry.keywords)
      ? entry.keywords.join(", ")
      : "";

  const answer =
    typeof entry.answer === "string"
      ? entry.answer
      : "";

  return [question, keywords, answer]
    .filter(Boolean)
    .join("\n");
}

// ============================================================
// COSINE SIMILARITY
// ============================================================

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return 0;
  }

  const length = Math.min(a.length, b.length);

  if (length === 0) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < length; i++) {
    const x = Number(a[i]) || 0;
    const y = Number(b[i]) || 0;

    dot += x * y;
    magnitudeA += x * x;
    magnitudeB += y * y;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  );
}

// ============================================================
// GET JINA EMBEDDINGS
// ============================================================

async function getJinaEmbeddings(input, task) {
  if (!process.env.JINA_API_KEY) {
    throw new Error("JINA_API_KEY is not configured");
  }

  const response = await fetchWithTimeout(
    JINA_API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: JINA_MODEL,
        task,
        dimensions: 512,
        input
      })
    },
    15000
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Jina API error ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.data)) {
    throw new Error("Invalid response from Jina");
  }

  return data.data.map(item => item.embedding);
}

// ============================================================
// JINA SEMANTIC KNOWLEDGE SEARCH
// ============================================================
//
// FIX: this used to call getJinaEmbeddings() on the FULL knowledge
// base on every single incoming message — two Jina calls per
// message (one for the query, one re-embedding every document in
// knowledge/knowledgeData.js from scratch), even for messages that
// had nothing to do with local knowledge. That burns through Jina's
// rate limit fast and adds a full extra network round-trip (with
// its own 15s timeout) in front of Tavily/Groq on every request,
// which was very likely a contributor to the intermittent failures
// that fell back to the local demo engine.
//
// The knowledge base only changes on deploy, so its embeddings are
// computed ONCE per warm server instance and cached in module scope
// below. Every request after the first reuses the cached vectors —
// only the (tiny) per-message query embedding is still computed
// fresh each time.

let cachedDocumentEmbeddings = null;
let cachedDocumentEntries = null;

async function getDocumentEmbeddings(entries) {
  if (
    cachedDocumentEmbeddings &&
    cachedDocumentEntries === entries
  ) {
    return cachedDocumentEmbeddings;
  }

  const documents =
    entries
      .map(buildKnowledgeText)
      .filter(Boolean);

  if (documents.length === 0) {
    cachedDocumentEmbeddings = [];
    cachedDocumentEntries = entries;
    return cachedDocumentEmbeddings;
  }

  const embeddings =
    await getJinaEmbeddings(documents, "retrieval.passage");

  cachedDocumentEmbeddings = embeddings;
  cachedDocumentEntries = entries;

  return embeddings;
}

async function findKnowledgeMatch(message, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const documentEmbeddings =
    await getDocumentEmbeddings(entries);

  if (documentEmbeddings.length === 0) {
    return null;
  }

  // STEP 1 — embed user's question (the only embedding call that
  // still has to happen fresh on every request)
  const [queryEmbedding] =
    await getJinaEmbeddings([message], "retrieval.query");

  // STEP 2 — find highest similarity against the cached document
  // embeddings
  let bestMatch = null;

  for (let i = 0; i < documentEmbeddings.length; i++) {
    const similarity = cosineSimilarity(
      queryEmbedding,
      documentEmbeddings[i]
    );

    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = {
        entry: entries[i],
        similarity
      };
    }
  }

  // STEP 3 — apply threshold
  if (!bestMatch || bestMatch.similarity < KNOWLEDGE_MATCH_THRESHOLD) {
    return null;
  }

  return bestMatch;
}

// ============================================================
// TAVILY WEB SEARCH
// ============================================================

async function searchWeb(message) {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not configured");
  }

  console.log("WEB SEARCH STARTED:", message);

  const response = await fetchWithTimeout(
    "https://api.tavily.com/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: message,
        max_results: 5,
        search_depth: "basic"
      })
    },
    10000
  );

  console.log("TAVILY STATUS:", response.status);

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Tavily API error ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  const results =
    Array.isArray(data.results) ? data.results : [];

  const sources =
    results.map(result => ({
      title: result.title || result.url,
      url: result.url
    }));

  return { results, sources };
}

// ============================================================
// MAIN API HANDLER
// ============================================================

export default async function handler(request, response) {

  if (request.method !== "POST") {
    response.status(405).json({
      error: "Method not allowed"
    });
    return;
  }

  let clientDisconnected = false;

  request.on("close", () => {
    clientDisconnected = true;
  });

  try {

    // ==========================================================
    // READ REQUEST
    // ==========================================================

    const body = await readJsonBody(request);

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const history =
      Array.isArray(body.history)
        ? body.history
            .filter(item =>
              item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string"
            )
            .slice(-10)
        : [];

    const facts =
      body.facts && typeof body.facts === "object"
        ? body.facts
        : {};

    if (!message) {
      response.status(400).json({
        error: "Message is required"
      });
      return;
    }

    // ==========================================================
    // MATH
    // ==========================================================

    const mathSolved = trySolveMath(message);

    if (mathSolved !== null) {
      response.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
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

    // ==========================================================
    // DETERMINISTIC IDENTITY MATCH
    // ==========================================================
    //
    // FIX: identity ("who is your developer" / "what is your name")
    // was going through the same 0.78-similarity Jina embedding
    // threshold as everything else, which meant it was inherently a
    // coin flip — some phrasings scored just above the threshold and
    // got the right knowledgeData.js answer, others scored just
    // below and fell through to Tavily/Groq, where the underlying
    // model (OpenAI's own open-weight gpt-oss-20b) would introduce
    // itself as ChatGPT. That's the flip-flopping you saw — it was
    // never web search overwriting knowledgeData.js (nothing in this
    // codebase ever mutates that file at runtime), it was local
    // knowledge simply failing to match on some turns.
    //
    // Identity is the one thing that should never be probabilistic,
    // so it's checked directly against the "creator" and
    // "app-identity" entries' own keyword lists first, before any
    // embedding call happens at all. A match here is 100%
    // deterministic — same answer every time, no sources shown
    // (exactly like any other local-knowledge match), and Tavily is
    // never even called for these questions.

    const IDENTITY_ENTRY_IDS = ["creator", "app-identity"];

    function normalizeForMatch(text) {
      return String(text || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function findIdentityKeywordMatch(userMessage, entries) {
      const normalizedMessage = normalizeForMatch(userMessage);

      if (!normalizedMessage) {
        return null;
      }

      for (const entry of entries) {
        if (!IDENTITY_ENTRY_IDS.includes(entry.id)) continue;
        if (!Array.isArray(entry.keywords)) continue;

        for (const keyword of entry.keywords) {
          const normalizedKeyword = normalizeForMatch(keyword);

          // Skip single-word keywords like "name" — too generic to
          // safely match as a substring against arbitrary messages
          // ("my name is Raj" shouldn't trigger the identity answer).
          if (!normalizedKeyword || !normalizedKeyword.includes(" ")) {
            continue;
          }

          if (
            normalizedMessage === normalizedKeyword ||
            normalizedMessage.includes(normalizedKeyword)
          ) {
            return entry;
          }
        }
      }

      return null;
    }

    // ==========================================================
    // START STREAMING RESPONSE
    // ==========================================================

    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked"
    });

    const identityEntry =
      findIdentityKeywordMatch(message, knowledgeEntries);

    let knowledgeMatch =
      identityEntry ? { entry: identityEntry, similarity: 1 } : null;

    let usingLocalKnowledge = !!knowledgeMatch;

    if (knowledgeMatch) {
      console.log("IDENTITY KEYWORD MATCH:", knowledgeMatch.entry.id);
    } else {

      // ==========================================================
      // JINA SEMANTIC SEARCH
      // ==========================================================

      try {
        console.log("JINA SEARCH STARTED:", message);

        knowledgeMatch = await findKnowledgeMatch(message, knowledgeEntries);

        if (knowledgeMatch) {
          usingLocalKnowledge = true;

          console.log("LOCAL KNOWLEDGE MATCH:", knowledgeMatch.similarity);
        } else {
          console.log("NO LOCAL KNOWLEDGE MATCH");
        }

      } catch (error) {
        console.error("Jina semantic search failed:", error.message);

        // Jina failure does not crash the chatbot — continue to Tavily.
        knowledgeMatch = null;
      }
    }

    // ==========================================================
    // SEND SEARCH STATUS
    // ==========================================================

    response.write(
      JSON.stringify({
        type: "status",
        searching: !usingLocalKnowledge
      }) + "\n"
    );

    // ==========================================================
    // SEARCH CONTEXT
    // ==========================================================

    let searchContext = "";
    let sources = [];

    if (knowledgeMatch) {

      const entry = knowledgeMatch.entry;

      searchContext = `
LOCAL KNOWLEDGE MATCH
Similarity: ${knowledgeMatch.similarity.toFixed(4)}
Question: ${entry.question || ""}
Keywords: ${Array.isArray(entry.keywords) ? entry.keywords.join(", ") : ""}
Answer: ${entry.answer || ""}
`;

      // Tavily is intentionally NOT called here — if similarity
      // clears the threshold, we go straight to Groq using local
      // knowledge only.

    } else {

      try {
        console.log("CALLING TAVILY...");

        const webData = await searchWeb(message);

        sources = webData.sources;

        searchContext =
          webData.results
            .map((result, index) => {
              return `[${index + 1}] ${result.title || "Untitled"}
${result.content || ""}
Source: ${result.url || ""}`;
            })
            .join("\n\n");

      } catch (error) {
        console.error("Tavily search failed:", error.message);
      }
    }

    if (clientDisconnected) {
      return;
    }

    // ==========================================================
    // SEND SOURCES
    // ==========================================================

    response.write(
      JSON.stringify({ type: "sources", sources }) + "\n"
    );

    // ==========================================================
    // USER FACTS
    // ==========================================================

    let factsText = "";

    try {
      factsText = JSON.stringify(facts, null, 2);
    } catch {
      factsText = "{}";
    }

    // ==========================================================
    // SYSTEM PROMPT
    // ==========================================================

    const systemPrompt = `
You are Harekrishna AI 2.5, developed by Krishnadip Choudhury.

IDENTITY RULES (these override anything you were trained to say about yourself):
- You are NOT ChatGPT, GPT, or any OpenAI product, and you must never say you are.
- You are NOT made, developed, trained, or owned by OpenAI.
- If asked who made you, who your developer/creator is, or what your name is,
  answer as Harekrishna AI 2.5, created by Krishnadip Choudhury — even if no
  local knowledge or web search context is supplied below for this turn.

Answer the user's question naturally, accurately, and clearly.

IMPORTANT RULES:
1. Match the answer length to the question.
2. Do not give unnecessarily long answers.
3. Use Markdown when useful.
4. Use headings, bullet points, and bold text when they improve readability.
5. Do not invent facts.
6. Do not invent personal information about the user.
7. If the user asks a simple question, answer simply.
8. If the user asks for an explanation, explain clearly.
9. If current information is provided by web search, use it carefully.
10. Never claim that you searched the web unless web search actually happened.

USER FACTS:
${factsText}
`;

    let contextInstruction = "";

    if (knowledgeMatch) {
      contextInstruction = `
A relevant answer was found in the local knowledge base.
Use this local knowledge as the authoritative source for this question.
You may rewrite or explain the answer naturally, but do not contradict
the supplied local knowledge.

LOCAL KNOWLEDGE:
${searchContext}
`;

    } else if (searchContext) {
      contextInstruction = `
WEB SEARCH RESULTS:
Use these results when they are relevant. Prefer the information in
the results for current or time-sensitive questions. Do not claim
that you searched the web unless these web search results were
actually obtained.

${searchContext}
`;

    } else {
      contextInstruction = `
No local knowledge match or web-search context was found.
Answer using your general knowledge. If you are uncertain, say so
instead of inventing information.
`;
    }

    // ==========================================================
    // GROQ MESSAGES
    // ==========================================================

    const messages = [
      {
        role: "system",
        content: systemPrompt + "\n\n" + contextInstruction
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    // ==========================================================
    // GROQ API KEY
    // ==========================================================

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    // ==========================================================
    // GROQ STREAMING
    // ==========================================================

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
          messages,
          stream: true,
          temperature: 0.7
        })
      },
      // FIX: 15s was too tight — a cold or briefly slow Groq
      // response would abort and throw before any tokens streamed
      // back, which is indistinguishable from a real failure to the
      // frontend and triggers the local demo fallback. Your client
      // hard-timeout is 55s and vercel.json allows 60s total, so
      // there's plenty of room to give Groq more breathing space.
      40000
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();

      throw new Error(
        `Groq API error ${groqResponse.status}: ${errorText}`
      );
    }

    if (!groqResponse.body) {
      throw new Error("Groq returned no response body");
    }

    // ==========================================================
    // READ GROQ SSE STREAM
    // ==========================================================

    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    const STREAM_STALL_MS = 20000;

    while (true) {

      if (clientDisconnected) {
        try {
          await reader.cancel();
        } catch {
          // ignore — connection already gone
        }
        return;
      }

      let readResult;

      try {
        readResult = await Promise.race([
          reader.read(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Groq stream stalled")),
              STREAM_STALL_MS
            )
          )
        ]);

      } catch (stallError) {
        console.error(
          "Groq stream stalled — no data for",
          STREAM_STALL_MS / 1000,
          "seconds, ending stream early."
        );
        break;
      }

      const { value, done } = readResult;

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");

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
          // ignore malformed SSE chunk, keep streaming
        }
      }
    }

    response.end();

  } catch (error) {

    console.error("Chat handler error:", error);

    if (!response.headersSent) {
      response.status(500).json({
        error: error.message || "Internal server error"
      });
      return;
    }

    // Headers already sent (mid-stream) — the only way left to
    // signal failure is to write it as plain text and close.
    try {
      response.write(
        "\n\nSorry, something went wrong while generating the response."
      );
    } catch {
      // ignore — connection may already be closed
    }

    response.end();
  }
}