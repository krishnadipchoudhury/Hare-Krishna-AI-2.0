// api/chat.js

import {
  trySolveMath,
  explainMathSolution
} from "../knowledge/math.js";

import knowledgeEntries from "../knowledge/knowledgeData.js";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_MODEL = "jina-embeddings-v5-text-small";

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

  return [
    question,
    keywords,
    answer
  ]
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

  const length = Math.min(
    a.length,
    b.length
  );

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

  if (
    magnitudeA === 0 ||
    magnitudeB === 0
  ) {
    return 0;
  }

  return (
    dot /
    (
      Math.sqrt(magnitudeA) *
      Math.sqrt(magnitudeB)
    )
  );
}


// ============================================================
// GET JINA EMBEDDINGS
// ============================================================

async function getJinaEmbeddings(
  input,
  task
) {
  if (!process.env.JINA_API_KEY) {
    throw new Error(
      "JINA_API_KEY is not configured"
    );
  }

  const response =
    await fetchWithTimeout(
      JINA_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${process.env.JINA_API_KEY}`
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
    const errorText =
      await response.text();

    throw new Error(
      `Jina API error ${response.status}: ${errorText}`
    );
  }

  const data =
    await response.json();

  if (
    !data ||
    !Array.isArray(data.data)
  ) {
    throw new Error(
      "Invalid response from Jina"
    );
  }

  return data.data.map(
    item => item.embedding
  );
}


// ============================================================
// JINA SEMANTIC KNOWLEDGE SEARCH
// ============================================================

async function findKnowledgeMatch(
  message,
  entries
) {
  if (
    !Array.isArray(entries) ||
    entries.length === 0
  ) {
    return null;
  }

  const documents =
    entries
      .map(buildKnowledgeText)
      .filter(Boolean);

  if (documents.length === 0) {
    return null;
  }


  // ----------------------------------------------------------
  // STEP 1
  // Embed user's question
  // ----------------------------------------------------------

  const [queryEmbedding] =
    await getJinaEmbeddings(
      [message],
      "retrieval.query"
    );


  // ----------------------------------------------------------
  // STEP 2
  // Embed local knowledge
  // ----------------------------------------------------------

  const documentEmbeddings =
    await getJinaEmbeddings(
      documents,
      "retrieval.passage"
    );


  // ----------------------------------------------------------
  // STEP 3
  // Find highest similarity
  // ----------------------------------------------------------

  let bestMatch = null;

  for (
    let i = 0;
    i < documentEmbeddings.length;
    i++
  ) {
    const similarity =
      cosineSimilarity(
        queryEmbedding,
        documentEmbeddings[i]
      );

    if (
      !bestMatch ||
      similarity >
        bestMatch.similarity
    ) {
      bestMatch = {
        entry: entries[i],
        similarity
      };
    }
  }


  // ----------------------------------------------------------
  // STEP 4
  // Apply 0.78 threshold
  // ----------------------------------------------------------

  if (
    !bestMatch ||
    bestMatch.similarity <
      KNOWLEDGE_MATCH_THRESHOLD
  ) {
    return null;
  }

  return bestMatch;
}


// ============================================================
// TAVILY WEB SEARCH
// ============================================================

async function searchWeb(message) {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error(
      "TAVILY_API_KEY is not configured"
    );
  }

  console.log(
    "WEB SEARCH STARTED:",
    message
  );

  const response =
    await fetchWithTimeout(
      "https://api.tavily.com/search",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          api_key:
            process.env.TAVILY_API_KEY,

          query: message,

          max_results: 5,

          search_depth: "basic"
        })
      },

      10000
    );


  console.log(
    "TAVILY STATUS:",
    response.status
  );


  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Tavily API error ${response.status}: ${errorText}`
    );
  }

  const data =
    await response.json();

  const results =
    Array.isArray(data.results)
      ? data.results
      : [];

  const sources =
    results.map(result => ({
      title:
        result.title ||
        result.url,

      url:
        result.url
    }));

  return {
    results,
    sources
  };
}


// ============================================================
// MAIN API HANDLER
// ============================================================

export default async function handler(
  request,
  response
) {
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

    // ========================================================
    // READ REQUEST
    // ========================================================

    const body =
      await readJsonBody(request);

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";


    const history =
      Array.isArray(body.history)
        ? body.history
            .filter(item =>
              item &&
              (
                item.role === "user" ||
                item.role === "assistant"
              ) &&
              typeof item.content === "string"
            )
            .slice(-10)
        : [];


    const facts =
      body.facts &&
      typeof body.facts === "object"
        ? body.facts
        : {};


    if (!message) {
      response.status(400).json({
        error: "Message is required"
      });

      return;
    }


    // ========================================================
    // MATH
    // ========================================================

    const mathSolved =
      trySolveMath(message);

    if (mathSolved !== null) {

      response.writeHead(200, {
        "Content-Type":
          "text/plain; charset=utf-8",

        "Cache-Control":
          "no-cache",

        "Connection":
          "keep-alive"
      });


      response.write(
        JSON.stringify({
          type: "status",
          searching: false
        }) + "\n"
      );


      response.write(
        JSON.stringify({
          type: "sources",
          sources: []
        }) + "\n"
      );


      response.write(
        explainMathSolution(
          mathSolved
        )
      );

      response.end();

      return;
    }


    // ========================================================
    // START STREAMING RESPONSE
    // ========================================================

    response.writeHead(200, {
      "Content-Type":
        "text/plain; charset=utf-8",

      "Cache-Control":
        "no-cache",

      "Connection":
        "keep-alive",

      "Transfer-Encoding":
        "chunked"
    });


    // ========================================================
    // JINA SEMANTIC SEARCH
    // ========================================================

    let knowledgeMatch = null;

    let usingLocalKnowledge = false;


    try {

      console.log(
        "JINA SEARCH STARTED:",
        message
      );


      knowledgeMatch =
        await findKnowledgeMatch(
          message,
          knowledgeEntries
        );


      if (knowledgeMatch) {

        usingLocalKnowledge = true;


        console.log(
          "LOCAL KNOWLEDGE MATCH:",
          knowledgeMatch.similarity
        );

      } else {

        console.log(
          "NO LOCAL KNOWLEDGE MATCH"
        );

      }

    } catch (error) {

      console.error(
        "Jina semantic search failed:",
        error.message
      );

      // Jina failure does not crash
      // the chatbot.
      //
      // We continue to Tavily.


      knowledgeMatch = null;
    }


    // ========================================================
    // SEND SEARCH STATUS
    // ========================================================

    response.write(
      JSON.stringify({
        type: "status",

        searching:
          !usingLocalKnowledge
      }) + "\n"
    );


    // ========================================================
    // SEARCH CONTEXT
    // ========================================================

    let searchContext = "";

    let sources = [];


    // ========================================================
    // YES → LOCAL KNOWLEDGE
    // ========================================================

    if (knowledgeMatch) {

      const entry =
        knowledgeMatch.entry;


      searchContext = `
LOCAL KNOWLEDGE MATCH

Similarity:
${knowledgeMatch.similarity.toFixed(4)}

Question:
${entry.question || ""}

Keywords:
${
  Array.isArray(entry.keywords)
    ? entry.keywords.join(", ")
    : ""
}

Answer:
${entry.answer || ""}
`;


    // ========================================================
    // IMPORTANT:
    //
    // TAVILY IS NOT CALLED HERE.
    //
    // If similarity >= 0.78,
    // the request goes directly
    // to Groq using local knowledge.
    // ========================================================


    } else {

      // ======================================================
      // NO LOCAL MATCH → TAVILY
      // ======================================================

      try {

        console.log(
          "CALLING TAVILY..."
        );


        const webData =
          await searchWeb(
            message
          );


        sources =
          webData.sources;


        searchContext =
          webData.results
            .map(
              (result, index) => {

                return `[${index + 1}] ${
                  result.title ||
                  "Untitled"
                }

${result.content || ""}

Source: ${
  result.url || ""
}`;
              }
            )
            .join("\n\n");


      } catch (error) {

        console.error(
          "Tavily search failed:",
          error.message
        );

      }
    }


    if (clientDisconnected) {
      return;
    }


    // ========================================================
    // SEND SOURCES
    // ========================================================

    response.write(
      JSON.stringify({
        type: "sources",
        sources
      }) + "\n"
    );


    // ========================================================
    // USER FACTS
    // ========================================================

    let factsText = "";

    try {

      factsText =
        JSON.stringify(
          facts,
          null,
          2
        );

    } catch {

      factsText = "{}";

    }


    // ========================================================
    // SYSTEM PROMPT
    // ========================================================

    const systemPrompt = `
You are Harekrishna AI 2.5.

Answer the user's question naturally,
accurately, and clearly.

IMPORTANT RULES:

1. Match the answer length to the question.
2. Do not give unnecessarily long answers.
3. Use Markdown when useful.
4. Use headings, bullet points, and bold text
   when they improve readability.
5. Do not invent facts.
6. Do not invent personal information about the user.
7. If the user asks a simple question, answer simply.
8. If the user asks for an explanation, explain clearly.
9. If current information is provided by web search,
   use it carefully.
10. Never claim that you searched the web unless
    web search actually happened.

USER FACTS:
${factsText}
`;

    let contextInstruction = "";


    // ========================================================
    // LOCAL KNOWLEDGE CONTEXT
    // ========================================================

    if (knowledgeMatch) {

      contextInstruction = `
A relevant answer was found in the local
knowledge base.

Use this local knowledge as the authoritative
source for this question.

You may rewrite or explain the answer naturally,
but do not contradict the supplied local knowledge.

LOCAL KNOWLEDGE:

${searchContext}
`;


    // ========================================================
    // WEB SEARCH CONTEXT
    // ========================================================

    } else if (searchContext) {

      contextInstruction = `
WEB SEARCH RESULTS:

Use these results when they are relevant.

Prefer the information in the results for current
or time-sensitive questions.

Do not claim that you searched the web unless
these web search results were actually obtained.

${searchContext}
`;


    // ========================================================
    // NO SEARCH RESULTS
    // ========================================================

    } else {

      contextInstruction = `
No local knowledge match or web-search context
was found.

Answer using your general knowledge.

If you are uncertain, say so instead of
inventing information.
`;

    }


    // ========================================================
    // GROQ MESSAGES
    // ========================================================

    const messages = [

      {
        role: "system",

        content:
          systemPrompt +
          "\n\n" +
          contextInstruction
      },

      ...history,

      {
        role: "user",

        content: message
      }

    ];


    // ========================================================
    // GROQ API KEY
    // ========================================================

    if (!process.env.GROQ_API_KEY) {

      throw new Error(
        "GROQ_API_KEY is not configured"
      );

    }


    // ========================================================
    // GROQ STREAMING
    // ========================================================

    const groqResponse =
      await fetchWithTimeout(
        "https://api.groq.com/openai/v1/chat/completions",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${process.env.GROQ_API_KEY}`
          },

          body: JSON.stringify({
            model:
              "openai/gpt-oss-20b",

            messages,

            stream: true,

            temperature: 0.7
          })
        },

        15000
      );


    if (!groqResponse.ok) {

      const errorText =
        await groqResponse.text();

      throw new Error(
        `Groq API error ${groqResponse.status}: ${errorText}`
      );

    }


    if (!groqResponse.body) {

      throw new Error(
        "Groq returned no response body"
      );

    }
    // ========================================================
    // READ GROQ SSE STREAM
    // ========================================================

    const reader =
      groqResponse.body.getReader();


    const decoder =
      new TextDecoder();


    let buffer = "";


    let lastDataTime =
      Date.now();


    while (true) {

      // ------------------------------------------------------
      // Client disconnected
      // ------------------------------------------------------

      if (clientDisconnected) {

        try {
          await reader.cancel();
        } catch {}

        return;
      }


      // ------------------------------------------------------
      // Read next chunk
      // ------------------------------------------------------

      const readPromise =
        reader.read();


      const stallPromise =
        new Promise((_, reject) => {

          setTimeout(() => {

            reject(
              new Error(
                "Groq stream stalled"
              )
            );

          }, 20000);

        });


      const {
        value,
        done
      } =
        await Promise.race([
          readPromise,
          stallPromise
        ]);


      if (done) {
        break;
      }


      lastDataTime =
        Date.now();


      buffer +=
        decoder.decode(
          value,
          {
            stream: true
          }
        );


      // ------------------------------------------------------
      // Split SSE lines
      // ------------------------------------------------------

      const lines =
        buffer.split("\n");


      buffer =
        lines.pop() || "";


      // ------------------------------------------------------
      // Process every line
      // ------------------------------------------------------

      for (const line of lines) {

        const trimmed =
          line.trim();


        if (!trimmed) {
          continue;
        }


        if (
          !trimmed.startsWith(
            "data:"
          )
        ) {
          continue;
        }


        const data =
          trimmed
            .slice(5)
            .trim();


        if (
          data === "[DONE]"
        ) {
          continue;
        }


        try {

          const parsed =
            JSON.parse(data);


          const content =
            parsed
              ?.choices?.[0]
              ?.delta?.content;


          if (
            typeof content === "string" &&
            content.length > 0 &&
            !clientDisconnected
          ) {

            response.write(
              content
            );

          }

        } catch {

          // Ignore malformed
          // SSE chunks.

        }
      }


      // ------------------------------------------------------
      // Stream timeout
      // ------------------------------------------------------

      if (
        Date.now() -
          lastDataTime >
        20000
      ) {

        throw new Error(
          "Groq stream timeout"
        );

      }

    }


    // ========================================================
    // FINISH RESPONSE
    // ========================================================

    response.end();


  } catch (error) {

    // ========================================================
    // GLOBAL ERROR HANDLER
    // ========================================================

    console.error(
      "Chat API error:",
      error
    );


    if (!response.headersSent) {

      response.status(500).json({

        error:
          error?.message ||
          "Something went wrong"

      });

      return;
    }


    if (!clientDisconnected) {

      try {

        response.write(
          "\n\nSorry, something went wrong while generating the response."
        );

        response.end();

      } catch {}

    }

  }

}