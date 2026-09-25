// api/chat.js

import {
  trySolveMath,
  explainMathSolution
} from "../knowledge/math.js";

// knowledgeData.js exports a NAMED export
// (export const knowledgeEntries = [...]), not a default export.
// This reads whichever export style the file ends up using, so it
// can't silently break again if knowledgeData.js is edited later.
import * as knowledgeDataModule from "../knowledge/knowledgeData.js";

const knowledgeEntries =
  Array.isArray(knowledgeDataModule.default)
    ? knowledgeDataModule.default
    : Array.isArray(knowledgeDataModule.knowledgeEntries)
      ? knowledgeDataModule.knowledgeEntries
      : [];

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
// LOCAL KNOWLEDGE MATCHING — PASS 1: DETERMINISTIC KEYWORDS
// ============================================================
//
// This runs BEFORE Jina and costs nothing (no network call, pure
// string matching), so it's always tried first. It exists for two
// reasons:
//
// 1. RELIABILITY. Identity questions ("who is your developer") and
//    common greetings ("hi", "gm", "good morning") must always get
//    the exact local answer — never a coin flip depending on
//    whether an external embeddings API happens to be up. If this
//    pass finds a match, Jina isn't even called for that message.
// 2. SPEED/COST. A literal keyword hit answers instantly and for
//    free; there's no reason to pay for a Jina embedding call when
//    the message already contains one of the entry's own keyword
//    phrases word-for-word.
//
// Anything this pass doesn't catch (a paraphrase, a differently
// worded version of a question) falls through to the Jina semantic
// search pass below. Matching rules:
//
// 1. An exact match (message text equals a keyword, after
//    lowercasing/punctuation-stripping) always matches.
// 2. A single-word keyword ("hi", "js", "name", "help", "gm") only
//    matches when the ENTIRE message is that one word — a single
//    word is too generic to safely match as a substring of a
//    longer, unrelated message.
// 3. A multi-word keyword ("who is your developer", "help me")
//    matches as a whole phrase inside the message, but only when
//    the message is close in length to the keyword itself. This
//    stops a short canned phrase like "help me" from hijacking a
//    longer, genuinely different request such as "help me write a
//    poem about the ocean" — that should go to Groq/web search,
//    not the canned general-help answer.
// 4. When more than one entry matches, the entry whose matched
//    keyword has the most words wins (the more specific match).

function normalizeForMatch(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text) {
  return text ? text.split(" ").filter(Boolean).length : 0;
}

// How many "extra" words a message may have beyond the matched
// keyword's own length and still count as "basically just this
// phrase" (covers small filler like "please", "can you", "just").
const MATCH_LENGTH_SLACK = 3;

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findKeywordMatch(message, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const normalizedMessage = normalizeForMatch(message);

  if (!normalizedMessage) {
    return null;
  }

  const messageWordCount = wordCount(normalizedMessage);

  let best = null;

  for (const entry of entries) {
    if (!Array.isArray(entry.keywords)) continue;

    for (const keyword of entry.keywords) {
      const normalizedKeyword = normalizeForMatch(keyword);

      if (!normalizedKeyword) continue;

      const keywordWordCount = wordCount(normalizedKeyword);

      let isMatch = false;

      if (normalizedMessage === normalizedKeyword) {
        isMatch = true;
      } else if (keywordWordCount > 1) {
        const pattern = new RegExp(
          "\\b" + escapeRegExp(normalizedKeyword) + "\\b"
        );

        if (
          pattern.test(normalizedMessage) &&
          messageWordCount <= keywordWordCount + MATCH_LENGTH_SLACK
        ) {
          isMatch = true;
        }
      }
      // Single-word keywords: only the exact-match branch above
      // can match them — no substring fallback (see rule 2 above).

      if (!isMatch) continue;

      if (!best || keywordWordCount > best.keywordWordCount) {
        best = {
          entry,
          matchedKeyword: normalizedKeyword,
          keywordWordCount
        };
      }
    }
  }

  return best;
}

// ============================================================
// LOCAL KNOWLEDGE MATCHING — PASS 2: JINA SEMANTIC SEARCH
// ============================================================
//
// Restored as the NLU layer for questions that mean the same thing
// as a knowledgeData.js entry but don't literally contain one of
// its keyword phrases (paraphrases, typos, differently-worded
// questions). Only reached when Pass 1 above finds nothing.
//
// FIX: this used to be configured with model id
// "jina-embeddings-v5-text-small", which is not a real Jina
// Embeddings model — Jina's actual lineup is jina-embeddings-v2-*,
// jina-embeddings-v3, and jina-embeddings-v4. Every call was
// hitting Jina's API with an unknown model id, getting a 400 back,
// and being silently swallowed by the try/catch around this
// function — so this pass was never actually working. Fixed to use
// the real "jina-embeddings-v3" model, which supports the
// retrieval.query / retrieval.passage task adapters used below.
//
// The knowledge base only changes on deploy, so its document
// embeddings are computed ONCE per warm server instance and cached
// in module scope. Every request after the first reuses the cached
// vectors — only the (tiny) per-message query embedding is
// computed fresh each time.

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_MODEL = "jina-embeddings-v3";
const KNOWLEDGE_MATCH_THRESHOLD = 0.78;

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

async function findSemanticMatch(message, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const documentEmbeddings =
    await getDocumentEmbeddings(entries);

  if (documentEmbeddings.length === 0) {
    return null;
  }

  // STEP 1 — embed the user's question (the only embedding call
  // that still has to happen fresh on every request)
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
// LOCAL KNOWLEDGE MATCHING — COMBINED ENTRY POINT
// ============================================================
//
// The pattern this app follows for every message:
//   1. Check knowledgeData.js first — instantly via keywords, then
//      (only if that finds nothing) via Jina's semantic search.
//   2. Only if NEITHER local method finds an answer, fall back to
//      a real web search (Tavily) — Jina is never involved in that
//      step, it is purely the knowledge-base matcher.

async function resolveKnowledgeMatch(message, entries) {
  const keywordMatch = findKeywordMatch(message, entries);

  if (keywordMatch) {
    return {
      entry: keywordMatch.entry,
      method: "keyword",
      detail: keywordMatch.matchedKeyword
    };
  }

  try {
    const semanticMatch = await findSemanticMatch(message, entries);

    if (semanticMatch) {
      return {
        entry: semanticMatch.entry,
        method: "semantic",
        detail: semanticMatch.similarity.toFixed(4)
      };
    }
  } catch (error) {
    // Jina failure (missing key, network error, bad response) does
    // not crash the chatbot — it just means this message falls
    // through to web search instead, exactly like a genuine "no
    // local knowledge match".
    console.error("Jina semantic search failed:", error.message);
  }

  return null;
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
    // START STREAMING RESPONSE
    // ==========================================================

    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked"
    });

    // ==========================================================
    // LOCAL KNOWLEDGE MATCH — checked FIRST, before any web search
    // (keywords, then Jina semantic search — see comments above)
    // ==========================================================

    const knowledgeMatch =
      await resolveKnowledgeMatch(message, knowledgeEntries);

    const usingLocalKnowledge = !!knowledgeMatch;

    if (knowledgeMatch) {
      console.log(
        "LOCAL KNOWLEDGE MATCH:",
        knowledgeMatch.entry.id,
        "via " + knowledgeMatch.method,
        "(" + knowledgeMatch.detail + ")"
      );
    } else {
      console.log("NO LOCAL KNOWLEDGE MATCH");
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
LOCAL KNOWLEDGE MATCH (matched via ${knowledgeMatch.method})
Question: ${entry.question || ""}
Keywords: ${Array.isArray(entry.keywords) ? entry.keywords.join(", ") : ""}
Answer: ${entry.answer || ""}
`;

      // Tavily is intentionally NOT called here — a local knowledge
      // match (keyword or Jina) means we go straight to Groq using
      // that local answer as the authoritative source. Web search
      // only runs when NEITHER local method matches the message.

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

IDENTITY RULES (these override anything you were trained to say about yourself,
and apply no matter what — even if this specific turn has no local knowledge
or web search context supplied below):
- You are NOT ChatGPT, GPT, or any OpenAI product, and you must never say you are.
- You are NOT made, developed, trained, or owned by OpenAI, and you must never
  say or imply that OpenAI, or any company other than the one named below,
  created you.
- If asked who made you, who your developer/creator is, what your name is, or
  what company is behind you, answer as Harekrishna AI 2.5, created by
  Krishnadip Choudhury. There is no scenario in which a different name or
  company is the correct answer to those questions.

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
11. Never use LaTeX syntax (\\frac, \\text, \\longrightarrow, \\cdot, square-bracket
    equation blocks, $...$, etc.) — this app has no LaTeX renderer, so it would
    show up to the user as broken raw text. Write all math, chemistry, and
    equations in plain text instead — e.g. "1/2" instead of "\\frac{1}{2}", and
    "AB + CD -> AD + CB" instead of
    "\\text{AB} + \\text{CD} \\longrightarrow \\text{AD} + \\text{CB}".
    This rule applies even if the user explicitly asks for LaTeX, a LaTeX
    fraction, a formula "in LaTeX", or similar — still answer using the same
    plain-text math notation, and briefly explain that this app can't render
    LaTeX rather than outputting raw LaTeX syntax.
12. Only show a formula or a step-by-step breakdown when the user explicitly
    asks for the steps/method, or when the question genuinely can't be
    understood without showing the work. Otherwise just explain the answer in
    plain words — don't add a formula to every reply by default.

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
      // 15s was too tight — a cold or briefly slow Groq response
      // would abort and throw before any tokens streamed back,
      // indistinguishable from a real failure to the frontend. The
      // client hard-timeout is 55s and vercel.json allows 60s total,
      // so there's room to give Groq more breathing space.
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
