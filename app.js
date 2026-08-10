const STORAGE_KEY = "ai_assistant_chats_v1";
const THEME_KEY = "ai_assistant_theme_v1";

const state = {
  chats: [],
  activeChatId: null,
  generating: false
};

const $ = (id) => document.getElementById(id);

const chatList = $("chatList");
const messagesEl = $("messages");
const welcomeEl = $("welcome");
const input = $("messageInput");
const sendBtn = $("sendBtn");
const sidebar = $("sidebar");
const overlay = $("overlay");
const toastEl = $("toast");

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.chats));
}

function load() {
  try {
    state.chats = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    state.chats = [];
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") document.body.classList.add("dark");

  if (!state.chats.length) {
    createChat(false);
  } else {
    state.activeChatId = state.chats[0].id;
  }

  render();
}

function createChat(renderNow = true) {
  const chat = {
    id: uid("chat"),
    title: "New chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };

  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  save();

  if (renderNow) {
    render();
    input.focus();
    closeMobileSidebar();
  }
  return chat;
}

function getActiveChat() {
  return state.chats.find(chat => chat.id === state.activeChatId);
}

function render() {
  renderChatList();
  renderMessages();
}

function renderChatList() {
  chatList.innerHTML = "";

  state.chats.forEach(chat => {
    const item = document.createElement("div");
    item.className = `chat-item ${chat.id === state.activeChatId ? "active" : ""}`;

    const button = document.createElement("button");
    button.className = "chat-item";
    button.style.flex = "1";
    button.innerHTML = `<span class="chat-title">${escapeHtml(chat.title)}</span>`;
    button.addEventListener("click", () => {
      state.activeChatId = chat.id;
      render();
      closeMobileSidebar();
    });

    const menu = document.createElement("button");
    menu.className = "chat-menu";
    menu.title = "Delete chat";
    menu.textContent = "⋯";
    menu.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteChat(chat.id);
    });

    item.append(button, menu);
    chatList.appendChild(item);
  });
}

function renderMessages() {
  const chat = getActiveChat();
  messagesEl.innerHTML = "";

  if (!chat || !chat.messages.length) {
    welcomeEl.style.display = "block";
    return;
  }

  welcomeEl.style.display = "none";

  chat.messages.forEach((msg, index) => {
    messagesEl.appendChild(createMessageElement(msg, index));
  });

  scrollToBottom();
}

function createMessageElement(msg, index) {
  const row = document.createElement("div");
  row.className = `message-row ${msg.role}`;

  if (msg.role === "assistant") {
    row.innerHTML = `
      <div class="avatar">✦</div>
      <div class="message-wrap">
        <div class="message">${escapeHtml(msg.content)}</div>
        <div class="message-actions">
          <button class="message-action copy-action">Copy</button>
          <button class="message-action regen-action">Regenerate</button>
        </div>
      </div>
    `;

    row.querySelector(".copy-action").onclick = () => copyText(msg.content);
    row.querySelector(".regen-action").onclick = () => regenerate(index);
  } else {
    row.innerHTML = `
      <div class="message-wrap">
        <div class="message">${escapeHtml(msg.content)}</div>
        <div class="message-actions">
          <button class="message-action edit-action">Edit</button>
          <button class="message-action copy-action">Copy</button>
        </div>
      </div>
    `;

    row.querySelector(".edit-action").onclick = () => editMessage(index);
    row.querySelector(".copy-action").onclick = () => copyText(msg.content);
  }

  return row;
}

function addMessage(role, content) {
  const chat = getActiveChat();
  if (!chat) return;

  chat.messages.push({
    id: uid("msg"),
    role,
    content,
    createdAt: Date.now()
  });

  chat.updatedAt = Date.now();

  if (role === "user" && chat.title === "New chat") {
    chat.title = content.trim().replace(/\s+/g, " ").slice(0, 42) || "New chat";
  }

  save();
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "message-row assistant";
  row.id = "typingRow";
  row.innerHTML = `
    <div class="avatar">✦</div>
    <div class="message">
      <div class="typing">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>
  `;
  messagesEl.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  $("typingRow")?.remove();
}

async function sendMessage(text = input.value.trim()) {
  if (!text || state.generating) return;

  input.value = "";
  autoResize();
  state.generating = true;
  sendBtn.disabled = true;

  addMessage("user", text);
  render();
  showTyping();

  await delay(650 + Math.random() * 650);

  const chat = getActiveChat();
  const answer = generateLocalReply(chat.messages, text);

  removeTyping();
  addMessage("assistant", answer);

  state.generating = false;
  sendBtn.disabled = false;
  render();
  input.focus();
}

function generateLocalReply(messages, text) {
  const lower = text.toLowerCase().trim();

  if (/^(hi|hello|hey|hii|hola)\b/.test(lower)) {
    return "Hello! 👋 I'm your AI assistant. Ask me a question, give me a problem to solve, or tell me what you'd like to build.";
  }

  if (lower.includes("who are you") || lower.includes("what are you")) {
    return "I'm an AI assistant interface built for this project. In this first version, replies are generated locally in your browser. The next step is connecting a real AI model so the assistant can give much more capable answers.";
  }

  if (lower.includes("2+2") || lower.includes("2 + 2")) {
    return "2 + 2 = 4.";
  }

  if (lower.includes("html") && lower.includes("css")) {
    return "HTML defines the structure of a webpage, while CSS controls its appearance and layout. JavaScript adds behavior and interactivity.";
  }

  if (lower.includes("javascript") || lower.includes("js")) {
    return "JavaScript is a programming language commonly used to make websites interactive. It can handle buttons, forms, animations, data, APIs, and much more.";
  }

  if (lower.includes("python")) {
    return "Python is a general-purpose programming language known for readable syntax. It's widely used for automation, data analysis, AI, scientific computing, and web development.";
  }

  if (lower.includes("algebra")) {
    return "Sure. Send me the algebra problem exactly as it appears, and I'll break it down step by step.";
  }

  if (lower.includes("website") || lower.includes("web site")) {
    return "A solid website usually has three core layers: HTML for structure, CSS for design, and JavaScript for interaction. For a real AI website, we'd then add authentication, a secure backend, and an AI model API.";
  }

  if (lower.includes("thank")) {
    return "You're welcome! 😊";
  }

  if (text.endsWith("?")) {
    return "Good question. This demo assistant is currently running without a real language model, so its local knowledge is limited. Once we connect the AI backend, this same chat interface can handle much more detailed questions.";
  }

  return "I received your message. This is the first UI version, so I'm using a local demo response engine right now. The chat system, editing, regeneration, sharing, exporting, and deletion are ready. Next, we can connect a real AI model to make the responses genuinely intelligent.";
}

async function editMessage(index) {
  const chat = getActiveChat();
  const msg = chat?.messages[index];

  if (!msg || msg.role !== "user" || state.generating) return;

  const row = messagesEl.children[index];
  if (!row) return;

  const old = msg.content;

  row.innerHTML = `
    <div class="message-wrap edit-box">
      <textarea>${escapeHtml(old)}</textarea>
      <div class="edit-actions">
        <button class="small-btn cancel-edit">Cancel</button>
        <button class="small-btn primary save-edit">Save & regenerate</button>
      </div>
    </div>
  `;

  const textarea = row.querySelector("textarea");
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  row.querySelector(".cancel-edit").onclick = render;

  row.querySelector(".save-edit").onclick = async () => {
    const newText = textarea.value.trim();
    if (!newText) return;

    chat.messages = chat.messages.slice(0, index);
    chat.messages.push({
      id: uid("msg"),
      role: "user",
      content: newText,
      createdAt: Date.now()
    });

    chat.title = newText.replace(/\s+/g, " ").slice(0, 42);
    chat.updatedAt = Date.now();
    save();
    render();

    state.generating = true;
    sendBtn.disabled = true;
    showTyping();

    await delay(650 + Math.random() * 650);

    const answer = generateLocalReply(chat.messages, newText);
    removeTyping();
    addMessage("assistant", answer);

    state.generating = false;
    sendBtn.disabled = false;
    render();
  };
}

async function regenerate(index) {
  const chat = getActiveChat();
  if (!chat || state.generating) return;

  const assistant = chat.messages[index];
  if (!assistant || assistant.role !== "assistant") return;

  const previousUser = chat.messages[index - 1];
  if (!previousUser || previousUser.role !== "user") return;

  chat.messages.splice(index, 1);
  save();
  render();

  state.generating = true;
  sendBtn.disabled = true;
  showTyping();

  await delay(700 + Math.random() * 700);

  addMessage("assistant", generateLocalReply(chat.messages, previousUser.content));

  removeTyping();
  state.generating = false;
  sendBtn.disabled = false;
  render();
}

function deleteChat(id) {
  const chat = state.chats.find(c => c.id === id);
  if (!chat) return;

  if (!confirm(`Delete "${chat.title}"? This cannot be undone.`)) return;

  state.chats = state.chats.filter(c => c.id !== id);

  if (!state.chats.length) {
    createChat(false);
  } else if (state.activeChatId === id) {
    state.activeChatId = state.chats[0].id;
  }

  save();
  render();
  showToast("Chat deleted");
}

function deleteAllChats() {
  if (!state.chats.length) return;
  if (!confirm("Delete all chats? This cannot be undone.")) return;

  state.chats = [];
  createChat(false);
  save();
  render();
  showToast("All chats deleted");
}

function chatToText(chat) {
  let output = `${chat.title}\n${"=".repeat(Math.min(50, chat.title.length))}\n\n`;
  chat.messages.forEach(msg => {
    output += `${msg.role === "user" ? "You" : "AI"}:\n${msg.content}\n\n`;
  });
  return output.trim();
}

function exportChat() {
  const chat = getActiveChat();
  if (!chat) return;

  downloadFile(`${safeFilename(chat.title)}.txt`, chatToText(chat), "text/plain");
  showToast("Chat exported");
}

function exportAllChats() {
  if (!state.chats.length) return;

  const content = state.chats.map(chatToText).join("\n\n" + "#".repeat(60) + "\n\n");
  downloadFile("AI-all-chats.txt", content, "text/plain");
  showToast("All chats exported");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").slice(0, 60) || "chat";
}

async function shareChat() {
  const chat = getActiveChat();
  if (!chat) return;

  const text = chatToText(chat);

  if (navigator.share) {
    try {
      await navigator.share({
        title: chat.title,
        text
      });
      return;
    } catch {}
  }

  $("shareText").value = text;
  $("shareModal").classList.remove("hidden");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied");
  } catch {
    showToast("Copy is not available in this browser");
  }
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    const area = $("chatArea");
    area.scrollTop = area.scrollHeight;
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function autoResize() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
}

function openMobileSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("open");
}

function closeMobileSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("open");
}

$("newChatBtn").onclick = () => createChat();
$("sendBtn").onclick = () => sendMessage();
$("shareBtn").onclick = shareChat;
$("exportAllBtn").onclick = exportAllChats;
$("deleteAllBtn").onclick = deleteAllChats;

$("menuBtn").onclick = openMobileSidebar;
overlay.onclick = closeMobileSidebar;

$("themeBtn").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    THEME_KEY,
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};

$("copyShareBtn").onclick = () => copyText($("shareText").value);

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.onclick = () => $(btn.dataset.close).classList.add("hidden");
});

document.querySelectorAll(".suggestion").forEach(btn => {
  btn.onclick = () => {
    input.value = btn.textContent;
    autoResize();
    sendMessage();
  };
});

input.addEventListener("input", autoResize);

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) {
    load();
  }
});

load();
