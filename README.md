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
├── api/                       # Serverless functions (each file = one /api/... URL)
│   ├── chat.js                # Answers: knowledge search, web search, LLM streaming
│   ├── extract-memory.js      # Picks lasting facts out of a message for "Saved to memory"
│   ├── send-otp.js            # Emails a 6-digit verification code
│   └── verify-otp.js          # Checks the code the person typed
├── lib/
│   └── otp.js                 # Shared code for the two OTP endpoints (signing, limits, email sending)
├── knowledge/
│   ├── knowledgeData.js       # Local knowledge base (identity, facts, etc.)
│   └── math.js                # Built-in math solver
├── app.js                     # Frontend app logic
├── index.html                 # App shell / markup (login, OTP, onboarding, chat, settings)
├── style.css                  # Styling
├── terms.html / privacy.html  # Legal pages (also shown inside the app in a viewer)
├── firestore.rules            # Firestore security rules — publish these in the Firebase Console
├── .env.example               # The environment variables the backend needs
├── vercel.json                # Vercel function settings + Firebase sign-in proxy
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
| `OTP_SECRET`        | Signs email-verification codes (any long random string, 32+ characters) |
| `RESEND_API_KEY`    | Sends the verification email (from [resend.com](https://resend.com)) |
| `OTP_FROM_EMAIL`    | The "from" address, e.g. `Hare Krishna AI <login@yourdomain.com>` |

> Remember to add these under **both** the Production and Preview environments in Vercel, or preview deployments will fail to reach these services.

Firebase configuration lives directly in `app.js` (`firebaseConfig`) since Firebase's client-side web keys are safe to expose publicly — access is controlled by your Firestore security rules, not by hiding the key.

### 3. Email verification (OTP) setup

New email accounts must type a 6-digit code that is emailed to them.

1. Create a free account at [resend.com](https://resend.com) → **API Keys** → create a key → this is `RESEND_API_KEY`.
2. Resend → **Domains** → add and verify your own domain (add the DNS records it shows). Then set `OTP_FROM_EMAIL` to an address on that domain, e.g. `Hare Krishna AI <login@yourdomain.com>`.
   *Without a verified domain Resend only delivers to your own email address — fine for a first test, not for real users.*
3. Make up a long random string for `OTP_SECRET` (for example, run `openssl rand -hex 32`).
4. In Vercel → **Settings → Environment Variables**, add all three (Production **and** Preview), then **redeploy**.

To turn the step off, set `REQUIRE_EMAIL_OTP = false` near the top of the account section in `app.js`.

If creating an account says *"Email verification isn't available right now"*, one of the three variables is missing or the project has not been redeployed since adding them. The exact reason is in Vercel → **Logs** (search for `send-otp`).

### 4. Firestore security rules

Open `firestore.rules`, copy it all, and paste it in **Firebase Console → Firestore Database → Rules → Publish**. This is what keeps each person's name, email, date of birth and chats private to them.

### 5. Deploy

The project is set up for zero-config deployment on [Vercel](https://vercel.com) — connect the repo and it picks up `api/chat.js` and `vercel.json` automatically.

---

## 📄 License

Released under the [MIT License](./LICENSE).

## 🙏 Author

Built by **Krishnadip Choudhury**.
