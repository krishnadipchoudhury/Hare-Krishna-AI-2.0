# Hare Krishna AI 2.5

Hare Krishna AI is a personal AI assistant web app with a modern chat UI, Google/email sign-in, cloud-synced chat history, and a hybrid answer engine that blends a hand-curated knowledge base, live web search, and an LLM — so you always know whether an answer came from a trusted local source or the open web.

**Live app:** https://hare-krishna-ai-2-0-j62n-nsj0ibn1z.vercel.app/

---

## ✨ Features

- **Hybrid answer engine** — every question is checked against a local knowledge base first, then falls back to live web search, then to the LLM's general knowledge. Sources are only ever shown when an answer actually came from a web search.
- **Deterministic identity answers** — questions like "who made you" or "what's your name" are matched directly against the knowledge base's own keywords before any AI call, so identity answers are always consistent.
- **Semantic search** — knowledge-base lookups use vector embeddings (Jina AI) rather than plain keyword matching, so paraphrased questions still find the right answer.
- **Live web search** — powered by Tavily, with cited sources shown inline whenever an answer draws on the open web.
- **Streaming replies with a typing animation** — answers stream in token-by-token with a blinking cursor, like a real conversation.
- **Math solver** — arithmetic and algebra questions are solved directly, without needing a web search or an LLM call.
- **Google, email/password, and guest sign-in** — full accounts sync chats to the cloud via Firestore; guest mode keeps everything local to the device.
- **Chat management** — rename, export, and delete chats, with a "recently deleted" bin for chats you can still restore.
- **Memory toggle** — control whether the assistant remembers things about you across chats.
- **Delete account** — permanently erases your account, every chat, your deleted-chats bin, and your saved memory — with no recovery afterward.
- **Light / dark / system theme**, synced live with your device.

---

## 🧠 How an answer gets made

```
User message
     │
     ▼
Deterministic identity check ──▶ match found ──▶ answer from knowledge base (no sources)
     │ no match
     ▼
Math solver ──▶ math question ──▶ solved directly
     │ not math
     ▼
Semantic knowledge search (Jina) ──▶ match found ──▶ answer from knowledge base (no sources)
     │ no match
     ▼
Web search (Tavily) ──▶ results found ──▶ answer grounded in web results (sources shown)
     │ no results
     ▼
LLM general knowledge (Groq) ──▶ answer from the model's own training
```

---

## 🏗️ Tech stack

| Layer          | Technology                                  |
|----------------|----------------------------------------------|
| Frontend       | Vanilla JavaScript, HTML, CSS                |
| Hosting/API    | Vercel (serverless functions)                |
| LLM            | Groq (`openai/gpt-oss-20b`)                  |
| Web search     | Tavily                                       |
| Embeddings     | Jina AI (`jina-embeddings-v3`)               |
| Auth & storage | Firebase Authentication + Firestore          |

---

## 📁 Project structure

```
.
├── api/
│   └── chat.js            # Serverless backend: knowledge search, web search, LLM streaming
├── knowledge/
│   ├── knowledgeData.js   # Local knowledge base (identity, facts, etc.)
│   └── math.js            # Built-in math solver
├── app.js                 # Frontend app logic
├── index.html              # App shell / markup
├── style.css               # Styling
├── privacy.html / terms.html
├── vercel.json             # Vercel function config
└── package.json
```

---

## 🚀 Getting started

### 1. Clone the repo

```bash
git clone https://github.com/krishnadipchoudhury/Hare-Krishna-AI-2.0.git
cd Hare-Krishna-AI-2.0
```

### 2. Set environment variables

The backend (`api/chat.js`) needs these set in your Vercel project (or a local `.env` when developing):

| Variable          | Used for                     |
|--------------------|-------------------------------|
| `GROQ_API_KEY`      | LLM responses                 |
| `TAVILY_API_KEY`    | Live web search                |
| `JINA_API_KEY`      | Knowledge-base embeddings      |

> Remember to add these under **both** the Production and Preview environments in Vercel, or preview deployments will fail to reach these services.

Firebase configuration lives directly in `app.js` (`firebaseConfig`) since Firebase's client-side web keys are safe to expose publicly — access is controlled by your Firestore security rules, not by hiding the key.

### 3. Deploy

The project is set up for zero-config deployment on [Vercel](https://vercel.com) — connect the repo and it picks up `api/chat.js` and `vercel.json` automatically.

---

## 📄 License

Released under the [MIT License](./LICENSE).

## 🙏 Author

Built by **Krishnadip Choudhury**.
