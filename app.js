/* =========================================================
   HARE KRISHNA AI
   COMPLETE APP.JS
   Firebase Authentication + Firestore
   ========================================================= */


/* =========================================================
   1. FIREBASE CONFIGURATION
   =========================================================
   
   Firebase Console:
   Project settings
   → Your apps
   → Web app
   → SDK setup and configuration
   → Config

   Replace the values below with YOUR Firebase config.
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDnXgAC-flp3Th0hxkz3TfH5Hm6DUy-zE0",
  authDomain: "my-ai-69dc8.firebaseapp.com",
  projectId: "my-ai-69dc8",
  storageBucket: "my-ai-69dc8.firebasestorage.app",
  messagingSenderId: "90216546592",
  appId: "1:90216546592:web:66534456efb20451671745"
};


/* =========================================================
   2. INITIALIZE FIREBASE
   ========================================================= */

let firebaseReady = false;
let auth = null;
let db = null;

try {
  if (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    typeof firebase !== "undefined"
  ) {
    firebase.initializeApp(firebaseConfig);

    auth = firebase.auth();
    db = firebase.firestore();

    firebaseReady = true;
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}


/* =========================================================
   3. GLOBAL STATE
   ========================================================= */

let currentUser = null;
let isGuest = false;

let chats = [];
let currentChatId = null;

let isGenerating = false;

let unsubscribeChats = null;

let toastTimer = null;


/* =========================================================
   4. DOM HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const authScreen = $("authScreen");
const appScreen = $("appScreen");

const googleLoginBtn = $("googleLoginBtn");
const signInBtn = $("signInBtn");
const createAccountBtn = $("createAccountBtn");
const forgotPasswordBtn = $("forgotPasswordBtn");
const guestBtn = $("guestBtn");

const emailInput = $("emailInput");
const passwordInput = $("passwordInput");
const authMessage = $("authMessage");

const sidebar = $("sidebar");
const overlay = $("overlay");

const chatList = $("chatList");
const newChatBtn = $("newChatBtn");

const messages = $("messages");
const welcome = $("welcome");

const messageInput = $("messageInput");
const sendBtn = $("sendBtn");

const shareBtn = $("shareBtn");
const themeBtn = $("themeBtn");

const shareModal = $("shareModal");
const shareText = $("shareText");
const copyShareBtn = $("copyShareBtn");

const exportAllBtn = $("exportAllBtn");
const deleteAllBtn = $("deleteAllBtn");
const logoutBtn = $("logoutBtn");

const userAvatar = $("userAvatar");
const userName = $("userName");
const userEmail = $("userEmail");

const toast = $("toast");


/* =========================================================
   5. BASIC SAFETY CHECK
   ========================================================= */

function elementExists(element, name) {
  if (!element) {
    console.warn(`${name} element was not found.`);
    return false;
  }

  return true;
}


/* =========================================================
   6. TOAST
   ========================================================= */

function showToast(message) {
  if (!toast) return;

  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


/* =========================================================
   7. AUTH MESSAGE
   ========================================================= */

function setAuthMessage(message, type = "") {
  if (!authMessage) return;

  authMessage.textContent = message;
  authMessage.className = "auth-message";

  if (type) {
    authMessage.classList.add(type);
  }
}


/* =========================================================
   8. FIREBASE ERROR TRANSLATION
   ========================================================= */

function getAuthErrorMessage(error) {
  if (!error) {
    return "Something went wrong.";
  }

  const code = error.code || "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/user-not-found":
      return "No account was found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/email-already-in-use":
      return "An account already exists with this email.";

    case "auth/weak-password":
      return "Password should be at least 6 characters.";

    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";

    case "auth/popup-blocked":
      return "The Google sign-in popup was blocked.";

    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    default:
      return error.message || "Authentication failed.";
  }
}


/* =========================================================
   9. SHOW AUTH SCREEN
   ========================================================= */

function showAuthScreen() {
  if (authScreen) {
    authScreen.classList.remove("hidden");
  }

  if (appScreen) {
    appScreen.classList.add("hidden");
  }
}


/* =========================================================
   10. SHOW APP SCREEN
   ========================================================= */

function showAppScreen() {
  if (authScreen) {
    authScreen.classList.add("hidden");
  }

  if (appScreen) {
    appScreen.classList.remove("hidden");
  }
}


/* =========================================================
   11. GOOGLE LOGIN
   ========================================================= */

async function signInWithGoogle() {
  if (!firebaseReady) {
    setAuthMessage(
      "Firebase is not configured. Add your Firebase config to app.js.",
      "error"
    );
    return;
  }

  try {
    setAuthMessage("Opening Google sign-in...");

    googleLoginBtn.disabled = true;

    const provider = new firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      await auth.signInWithPopup(provider);
    } catch (popupError) {

      /*
       * On some mobile browsers popup authentication
       * can be blocked. Redirect is used as fallback.
       */

      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/cancelled-popup-request"
      ) {
        await auth.signInWithRedirect(provider);
        return;
      }

      throw popupError;
    }

  } catch (error) {
    console.error("Google login error:", error);

    setAuthMessage(
      getAuthErrorMessage(error),
      "error"
    );

  } finally {
    googleLoginBtn.disabled = false;
  }
}


/* =========================================================
   12. EMAIL SIGN IN
   ========================================================= */

async function signInWithEmail() {
  if (!firebaseReady) {
    setAuthMessage(
      "Firebase is not configured. Add your Firebase config to app.js.",
      "error"
    );
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    setAuthMessage("Please enter your email address.", "error");
    emailInput.focus();
    return;
  }

  if (!password) {
    setAuthMessage("Please enter your password.", "error");
    passwordInput.focus();
    return;
  }

  try {
    signInBtn.disabled = true;

    setAuthMessage("Signing in...");

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

  } catch (error) {
    console.error("Email sign-in error:", error);

    setAuthMessage(
      getAuthErrorMessage(error),
      "error"
    );

  } finally {
    signInBtn.disabled = false;
  }
}


/* =========================================================
   13. CREATE ACCOUNT
   ========================================================= */

async function createAccount() {
  if (!firebaseReady) {
    setAuthMessage(
      "Firebase is not configured. Add your Firebase config to app.js.",
      "error"
    );
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    setAuthMessage("Enter an email address first.", "error");
    emailInput.focus();
    return;
  }

  if (!password) {
    setAuthMessage("Create a password first.", "error");
    passwordInput.focus();
    return;
  }

  if (password.length < 6) {
    setAuthMessage(
      "Password must be at least 6 characters.",
      "error"
    );
    return;
  }

  try {
    createAccountBtn.disabled = true;

    setAuthMessage("Creating your account...");

    const result =
      await auth.createUserWithEmailAndPassword(
        email,
        password
      );

    const user = result.user;

    if (user) {
      await createUserDocument(user);
    }

    setAuthMessage(
      "Account created successfully!",
      "success"
    );

  } catch (error) {
    console.error("Create account error:", error);

    setAuthMessage(
      getAuthErrorMessage(error),
      "error"
    );

  } finally {
    createAccountBtn.disabled = false;
  }
}


/* =========================================================
   14. FORGOT PASSWORD
   ========================================================= */

async function resetPassword() {
  if (!firebaseReady) {
    setAuthMessage(
      "Firebase is not configured.",
      "error"
    );
    return;
  }

  const email = emailInput.value.trim();

  if (!email) {
    setAuthMessage(
      "Enter your email address first.",
      "error"
    );
    emailInput.focus();
    return;
  }

  try {
    forgotPasswordBtn.disabled = true;

    setAuthMessage("Sending password reset email...");

    await auth.sendPasswordResetEmail(email);

    setAuthMessage(
      "Password reset email sent. Check your inbox.",
      "success"
    );

  } catch (error) {
    console.error("Password reset error:", error);

    setAuthMessage(
      getAuthErrorMessage(error),
      "error"
    );

  } finally {
    forgotPasswordBtn.disabled = false;
  }
}


/* =========================================================
   15. GUEST MODE
   ========================================================= */

function continueAsGuest() {
  isGuest = true;
  currentUser = null;

  localStorage.setItem(
    "hareKrishnaGuest",
    "true"
  );

  loadGuestChats();

  updateUserPanel();

  showAppScreen();

  showToast("Continuing without login");

  createNewChat(false);
}


/* =========================================================
   16. CREATE USER DOCUMENT
   ========================================================= */

async function createUserDocument(user) {
  if (!db || !user) return;

  try {
    const userRef = db
      .collection("users")
      .doc(user.uid);

    const existing =
      await userRef.get();

    if (!existing.exists) {
      await userRef.set({
        uid: user.uid,
        email: user.email || "",
        displayName:
          user.displayName ||
          (user.email
            ? user.email.split("@")[0]
            : "User"),
        photoURL: user.photoURL || "",
        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await userRef.set(
        {
          email: user.email || "",
          displayName:
            user.displayName ||
            (user.email
              ? user.email.split("@")[0]
              : "User"),
          photoURL: user.photoURL || "",
          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    }

  } catch (error) {
    console.error(
      "User document error:",
      error
    );
  }
}


/* =========================================================
   17. UPDATE USER PANEL
   ========================================================= */

function updateUserPanel() {
  if (!userAvatar || !userName || !userEmail) {
    return;
  }

  if (isGuest || !currentUser) {
    userName.textContent = "Guest";
    userEmail.textContent = "Not signed in";

    userAvatar.innerHTML = "?";

    return;
  }

  const name =
    currentUser.displayName ||
    (
      currentUser.email
        ? currentUser.email.split("@")[0]
        : "User"
    );

  userName.textContent = name;

  userEmail.textContent =
    currentUser.email || "";

  if (currentUser.photoURL) {
    userAvatar.innerHTML = "";

    const img =
      document.createElement("img");

    img.src = currentUser.photoURL;
    img.alt = "";

    userAvatar.appendChild(img);

  } else {
    userAvatar.textContent =
      name.charAt(0).toUpperCase();
  }
}


/* =========================================================
   18. AUTH STATE
   ========================================================= */

function setupAuthListener() {
  if (!firebaseReady || !auth) {
    console.warn(
      "Firebase not configured."
    );

    showAuthScreen();

    return;
  }

  auth.onAuthStateChanged(
    async (user) => {

      if (user) {

        currentUser = user;
        isGuest = false;

        localStorage.removeItem(
          "hareKrishnaGuest"
        );

        await createUserDocument(user);

        updateUserPanel();

        showAppScreen();

        await loadChatsFromFirestore();

        if (!currentChatId) {
          createNewChat(false);
        }

      } else {

        currentUser = null;

        const guest =
          localStorage.getItem(
            "hareKrishnaGuest"
          ) === "true";

        if (guest) {

          isGuest = true;

          loadGuestChats();

          updateUserPanel();

          showAppScreen();

          if (!currentChatId) {
            createNewChat(false);
          }

        } else {

          isGuest = false;

          showAuthScreen();
        }
      }
    }
  );
}


/* =========================================================
   19. FIREBASE REDIRECT RESULT
   ========================================================= */

async function checkRedirectLogin() {
  if (!firebaseReady || !auth) {
    return;
  }

  try {
    await auth.getRedirectResult();
  } catch (error) {
    console.error(
      "Redirect login error:",
      error
    );

    setAuthMessage(
      getAuthErrorMessage(error),
      "error"
    );
  }
}


/* =========================================================
   20. CHAT ID
   ========================================================= */

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2)
  );
}


/* =========================================================
   21. CREATE NEW CHAT
   ========================================================= */

function createNewChat(showMessage = true) {
  const chat = {
    id: generateId(),

    title: "New chat",

    messages: [],

    createdAt: Date.now(),

    updatedAt: Date.now()
  };

  chats.unshift(chat);

  currentChatId = chat.id;

  saveGuestChats();

  renderChatList();

  renderCurrentChat();

  closeMobileSidebar();

  if (showMessage) {
    showToast("New chat created");
  }

  if (!isGuest && currentUser) {
    saveChatToFirestore(chat);
  }
}


/* =========================================================
   22. GET CURRENT CHAT
   ========================================================= */

function getCurrentChat() {
  return chats.find(
    chat => chat.id === currentChatId
  ) || null;
}


/* =========================================================
   23. RENDER CHAT LIST
   ========================================================= */

function renderChatList() {
  if (!chatList) return;

  chatList.innerHTML = "";

  if (!chats.length) {
    const empty =
      document.createElement("div");

    empty.style.padding = "12px 8px";
    empty.style.color = "var(--muted)";
    empty.style.fontSize = "13px";

    empty.textContent =
      "No chats yet.";

    chatList.appendChild(empty);

    return;
  }

  chats.forEach(chat => {

    const item =
      document.createElement("div");

    item.className =
      "chat-item" +
      (
        chat.id === currentChatId
          ? " active"
          : ""
      );

    const title =
      document.createElement("span");

    title.className = "chat-title";

    title.textContent =
      chat.title || "New chat";

    const menu =
      document.createElement("button");

    menu.className = "chat-menu";

    menu.type = "button";

    menu.textContent = "⋯";

    menu.title = "Chat options";

    menu.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        showChatMenu(chat.id);
      }
    );

    item.appendChild(title);
    item.appendChild(menu);

    item.addEventListener(
      "click",
      () => {
        currentChatId = chat.id;

        renderChatList();
        renderCurrentChat();

        closeMobileSidebar();
      }
    );

    chatList.appendChild(item);
  });
}


/* =========================================================
   24. CHAT MENU
   ========================================================= */

function showChatMenu(chatId) {
  const chat =
    chats.find(
      item => item.id === chatId
    );

  if (!chat) return;

  const action =
    window.prompt(
      "Type: rename or delete",
      "rename"
    );

  if (!action) return;

  if (
    action.toLowerCase() ===
    "delete"
  ) {
    deleteChat(chatId);
    return;
  }

  if (
    action.toLowerCase() ===
    "rename"
  ) {
    const title =
      window.prompt(
        "Enter new chat name:",
        chat.title
      );

    if (
      title &&
      title.trim()
    ) {
      chat.title =
        title.trim();

      chat.updatedAt =
        Date.now();

      saveGuestChats();

      renderChatList();

      if (
        !isGuest &&
        currentUser
      ) {
        saveChatToFirestore(chat);
      }
    }
  }
}


/* =========================================================
   25. DELETE CHAT
   ========================================================= */

async function deleteChat(chatId) {
  const chat =
    chats.find(
      item => item.id === chatId
    );

  if (!chat) return;

  const confirmed =
    window.confirm(
      "Delete this chat?"
    );

  if (!confirmed) return;

  chats =
    chats.filter(
      item => item.id !== chatId
    );

  if (
    currentChatId === chatId
  ) {
    currentChatId =
      chats.length
        ? chats[0].id
        : null;
  }

  saveGuestChats();

  renderChatList();

  renderCurrentChat();

  if (
    !isGuest &&
    currentUser &&
    db
  ) {
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("chats")
        .doc(chatId)
        .delete();

    } catch (error) {
      console.error(
        "Delete chat error:",
        error
      );
    }
  }

  showToast("Chat deleted");
}


/* =========================================================
   26. RENDER CURRENT CHAT
   ========================================================= */

function renderCurrentChat() {
  if (!messages) return;

  messages.innerHTML = "";

  const chat =
    getCurrentChat();

  if (
    !chat ||
    !chat.messages.length
  ) {
    if (welcome) {
      welcome.classList.remove(
        "hidden"
      );
    }

    return;
  }

  if (welcome) {
    welcome.classList.add(
      "hidden"
    );
  }

  chat.messages.forEach(
    (message, index) => {
      renderMessage(
        message,
        index
      );
    }
  );

  scrollToBottom();
}


/* =========================================================
   27. RENDER MESSAGE
   ========================================================= */

function renderMessage(
  message,
  index
) {
  if (!messages) return;

  const row =
    document.createElement("div");

  row.className =
    "message-row " +
    (
      message.role === "user"
        ? "user"
        : "assistant"
    );

  if (
    message.role ===
    "assistant"
  ) {
    const avatar =
      document.createElement("div");

    avatar.className =
      "avatar";

    avatar.textContent = "✦";

    row.appendChild(avatar);
  }

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message-wrapper";

  const bubble =
    document.createElement("div");

  bubble.className =
    "message";

  bubble.textContent =
    message.content || "";

  wrapper.appendChild(bubble);

  if (
    message.role ===
    "assistant"
  ) {
    const actions =
      document.createElement("div");

    actions.className =
      "message-actions";

    const copyButton =
      document.createElement("button");

    copyButton.className =
      "message-action";

    copyButton.type =
      "button";

    copyButton.textContent =
      "Copy";

    copyButton.addEventListener(
      "click",
      () => {
        copyText(
          message.content || ""
        );

        showToast(
          "Message copied"
        );
      }
    );

    actions.appendChild(
      copyButton
    );

    wrapper.appendChild(
      actions
    );
  }

  row.appendChild(wrapper);

  messages.appendChild(row);
}


/* =========================================================
   28. ADD MESSAGE
   ========================================================= */

async function addMessage(
  role,
  content
) {
  const chat =
    getCurrentChat();

  if (!chat) return;

  chat.messages.push({
    role,
    content,
    createdAt: Date.now()
  });

  chat.updatedAt =
    Date.now();

  if (
    role === "user" &&
    chat.title === "New chat"
  ) {
    chat.title =
      createChatTitle(content);
  }

  saveGuestChats();

  renderChatList();

  renderCurrentChat();

  if (
    !isGuest &&
    currentUser
  ) {
    await saveChatToFirestore(
      chat
    );
  }
}


/* =========================================================
   29. CHAT TITLE
   ========================================================= */

function createChatTitle(text) {
  const clean =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();

  if (!clean) {
    return "New chat";
  }

  if (clean.length <= 35) {
    return clean;
  }

  return (
    clean.substring(0, 35) +
    "..."
  );
}


/* =========================================================
   30. SEND MESSAGE
   ========================================================= */

async function sendMessage() {
  if (isGenerating) return;

  const text =
    messageInput.value.trim();

  if (!text) return;

  if (!currentChatId) {
    createNewChat(false);
  }

  messageInput.value = "";

  autoResizeTextarea();

  await addMessage(
    "user",
    text
  );

  isGenerating = true;

  sendBtn.disabled = true;

  showTypingIndicator();

  try {

    /*
     * This is a LOCAL demo response.
     *
     * Later we can replace this function
     * with your real AI backend/API.
     */

    const response =
      await generateLocalResponse(
        text
      );

    removeTypingIndicator();

    await addMessage(
      "assistant",
      response
    );

  } catch (error) {

    console.error(
      "AI response error:",
      error
    );

    removeTypingIndicator();

    await addMessage(
      "assistant",
      "Sorry, something went wrong while generating the response."
    );

  } finally {
    isGenerating = false;
    sendBtn.disabled = false;

    messageInput.focus();
  }
}


/* =========================================================
   31. LOCAL AI DEMO
   ========================================================= */

async function generateLocalResponse(
  input
) {
  await delay(650);

  const text =
    input.toLowerCase();

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return (
      "Hello! 👋\n\n" +
      "I'm Hare Krishna AI. " +
      "I'm ready to help you learn, code, solve problems, or brainstorm ideas."
    );
  }

  if (
    text.includes("photosynthesis")
  ) {
    return (
      "Photosynthesis is the process plants use to make their own food. 🌱\n\n" +
      "Plants use:\n" +
      "• sunlight\n" +
      "• carbon dioxide\n" +
      "• water\n\n" +
      "They produce glucose (food) and release oxygen."
    );
  }

  if (
    text.includes("algebra")
  ) {
    return (
      "Sure! Send me the algebra problem and I'll explain it step by step.\n\n" +
      "For example:\n" +
      "2x + 5 = 15\n\n" +
      "Subtract 5 from both sides:\n" +
      "2x = 10\n\n" +
      "Divide by 2:\n" +
      "x = 5"
    );
  }

  if (
    text.includes("website") ||
    text.includes("html") ||
    text.includes("css") ||
    text.includes("javascript")
  ) {
    return (
      "Absolutely! 💻\n\n" +
      "I can help you build websites using HTML, CSS and JavaScript.\n\n" +
      "Tell me what you want to build and we can create it step by step."
    );
  }

  if (
    text.includes("who are you") ||
    text.includes("what are you")
  ) {
    return (
      "I'm Hare Krishna AI — your personal AI assistant interface.\n\n" +
      "This version is currently using local demo responses. " +
      "The Firebase part handles authentication and saving your chats."
    );
  }

  return (
    "I received your message:\n\n" +
    `"${input}"\n\n` +
    "This version of Hare Krishna AI is currently using a local demo response engine. " +
    "Your Firebase authentication and chat storage can work independently.\n\n" +
    "When you're ready, we can connect a real AI model to this interface."
  );
}


/* =========================================================
   32. TYPING INDICATOR
   ========================================================= */

function showTypingIndicator() {
  if (!messages) return;

  removeTypingIndicator();

  const row =
    document.createElement("div");

  row.id =
    "typingIndicator";

  row.className =
    "message-row assistant";

  const avatar =
    document.createElement("div");

  avatar.className =
    "avatar";

  avatar.textContent = "✦";

  const typing =
    document.createElement("div");

  typing.className =
    "typing";

  typing.innerHTML =
    "<span class='dot'></span>" +
    "<span class='dot'></span>" +
    "<span class='dot'></span>";

  row.appendChild(avatar);
  row.appendChild(typing);

  messages.appendChild(row);

  scrollToBottom();
}


function removeTypingIndicator() {
  const typing =
    document.getElementById(
      "typingIndicator"
    );

  if (typing) {
    typing.remove();
  }
}


/* =========================================================
   33. FIRESTORE CHAT SAVE
   ========================================================= */

async function saveChatToFirestore(
  chat
) {
  if (
    !db ||
    !currentUser ||
    !chat
  ) {
    return;
  }

  try {
    await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("chats")
      .doc(chat.id)
      .set(
        {
          id: chat.id,

          title:
            chat.title ||
            "New chat",

          messages:
            chat.messages || [],

          createdAt:
            chat.createdAt || Date.now(),

          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

  } catch (error) {
    console.error(
      "Firestore save error:",
      error
    );

    showToast(
      "Couldn't save chat to cloud"
    );
  }
}


/* =========================================================
   34. LOAD FIRESTORE CHATS
   ========================================================= */

async function loadChatsFromFirestore() {
  if (
    !db ||
    !currentUser
  ) {
    return;
  }

  try {

    if (unsubscribeChats) {
      unsubscribeChats();
      unsubscribeChats = null;
    }

    unsubscribeChats =
      db
        .collection("users")
        .doc(currentUser.uid)
        .collection("chats")
        .orderBy(
          "updatedAt",
          "desc"
        )
        .onSnapshot(
          snapshot => {

            chats =
              snapshot.docs.map(
                doc => {

                  const data =
                    doc.data();

                  return {
                    id:
                      data.id ||
                      doc.id,

                    title:
                      data.title ||
                      "New chat",

                    messages:
                      Array.isArray(
                        data.messages
                      )
                        ? data.messages
                        : [],

                    createdAt:
                      data.createdAt ||
                      Date.now(),

                    updatedAt:
                      Date.now()
                  };
                }
              );

            if (
              currentChatId &&
              chats.some(
                chat =>
                  chat.id ===
                  currentChatId
              )
            ) {
              renderChatList();
              renderCurrentChat();
              return;
            }

            currentChatId =
              chats.length
                ? chats[0].id
                : null;

            renderChatList();

            renderCurrentChat();

          },
          error => {
            console.error(
              "Firestore listener error:",
              error
            );
          }
        );

  } catch (error) {
    console.error(
      "Load chats error:",
      error
    );
  }
}


/* =========================================================
   35. GUEST CHAT STORAGE
   ========================================================= */

function saveGuestChats() {
  if (!isGuest) return;

  try {
    localStorage.setItem(
      "hareKrishnaGuestChats",
      JSON.stringify(chats)
    );

  } catch (error) {
    console.error(
      "Guest storage error:",
      error
    );
  }
}


function loadGuestChats() {
  try {

    const saved =
      localStorage.getItem(
        "hareKrishnaGuestChats"
      );

    if (saved) {
      const parsed =
        JSON.parse(saved);

      chats =
        Array.isArray(parsed)
          ? parsed
          : [];
    } else {
      chats = [];
    }

    currentChatId =
      chats.length
        ? chats[0].id
        : null;

    renderChatList();
    renderCurrentChat();

  } catch (error) {

    console.error(
      "Guest load error:",
      error
    );

    chats = [];
    currentChatId = null;
  }
}


/* =========================================================
   36. DELETE ALL CHATS
   ========================================================= */

async function deleteAllChats() {
  if (!chats.length) {
    showToast("There are no chats to delete.");
    return;
  }

  const confirmed =
    window.confirm(
      "Delete ALL your chats? This cannot be undone."
    );

  if (!confirmed) return;

  if (
    !isGuest &&
    currentUser &&
    db
  ) {

    try {

      const snapshot =
        await db
          .collection("users")
          .doc(currentUser.uid)
          .collection("chats")
          .get();

      const batch =
        db.batch();

      snapshot.docs.forEach(
        doc => {
          batch.delete(doc.ref);
        }
      );

      await batch.commit();

    } catch (error) {

      console.error(
        "Delete all chats error:",
        error
      );

      showToast(
        "Couldn't delete all cloud chats"
      );

      return;
    }
  }

  chats = [];

  currentChatId = null;

  if (isGuest) {
    localStorage.removeItem(
      "hareKrishnaGuestChats"
    );
  }

  renderChatList();
  renderCurrentChat();

  showToast(
    "All chats deleted"
  );

  createNewChat(false);
}


/* =========================================================
   37. EXPORT CURRENT CHAT
   ========================================================= */

function createChatText(chat) {
  if (!chat) {
    return "No chat selected.";
  }

  let output =
    `Hare Krishna AI\n` +
    `Chat: ${chat.title || "New chat"}\n` +
    `${"=".repeat(40)}\n\n`;

  chat.messages.forEach(
    message => {

      const role =
        message.role === "user"
          ? "You"
          : "Hare Krishna AI";

      output +=
        `${role}:\n` +
        `${message.content}\n\n`;
    }
  );

  return output;
}


/* =========================================================
   38. SHARE CHAT
   ========================================================= */

function openShareModal() {
  const chat =
    getCurrentChat();

  if (!chat) {
    showToast(
      "No chat selected."
    );
    return;
  }

  shareText.value =
    createChatText(chat);

  shareModal.classList.remove(
    "hidden"
  );
}


function closeShareModal() {
  shareModal.classList.add(
    "hidden"
  );
}


/* =========================================================
   39. COPY TEXT
   ========================================================= */

async function copyText(text) {
  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        text
      );

      return true;
    }

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value = text;

    textarea.style.position =
      "fixed";

    textarea.style.opacity = "0";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    return true;

  } catch (error) {

    console.error(
      "Copy error:",
      error
    );

    return false;
  }
}


/* =========================================================
   40. EXPORT ALL CHATS
   ========================================================= */

function exportAllChats() {
  if (!chats.length) {
    showToast(
      "There are no chats to export."
    );
    return;
  }

  let output =
    "Hare Krishna AI - All Chats\n\n";

  chats.forEach(
    (chat, index) => {

      output +=
        `CHAT ${index + 1}\n`;

      output +=
        createChatText(chat);

      output +=
        "\n\n" +
        "=".repeat(60) +
        "\n\n";
    }
  );

  downloadTextFile(
    "hare-krishna-ai-chats.txt",
    output
  );

  showToast(
    "Chats exported"
  );
}


/* =========================================================
   41. DOWNLOAD TEXT FILE
   ========================================================= */

function downloadTextFile(
  filename,
  content
) {
  const blob =
    new Blob(
      [content],
      {
        type: "text/plain;charset=utf-8"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;
  link.download = filename;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );
}


/* =========================================================
   42. LOGOUT
   ========================================================= */

async function logout() {
  try {

    if (unsubscribeChats) {
      unsubscribeChats();
      unsubscribeChats = null;
    }

    if (auth && currentUser) {
      await auth.signOut();
    }

    currentUser = null;
    isGuest = false;

    chats = [];
    currentChatId = null;

    showAuthScreen();

    setAuthMessage("");

    showToast(
      "Signed out successfully"
    );

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    showToast(
      "Could not sign out"
    );
  }
}


/* =========================================================
   43. THEME
   ========================================================= */

function loadTheme() {
  const saved =
    localStorage.getItem(
      "hareKrishnaTheme"
    );

  if (saved === "dark") {
    document.body.classList.add(
      "dark"
    );
  } else {
    document.body.classList.remove(
      "dark"
    );
  }

  updateThemeButton();
}


function toggleTheme() {
  document.body.classList.toggle(
    "dark"
  );

  const dark =
    document.body.classList.contains(
      "dark"
    );

  localStorage.setItem(
    "hareKrishnaTheme",
    dark ? "dark" : "light"
  );

  updateThemeButton();
}


function updateThemeButton() {
  if (!themeBtn) return;

  const dark =
    document.body.classList.contains(
      "dark"
    );

  themeBtn.textContent =
    dark ? "☀" : "☾";

  themeBtn.title =
    dark
      ? "Switch to light theme"
      : "Switch to dark theme";
}


/* =========================================================
   44. MOBILE SIDEBAR
   ========================================================= */

function openMobileSidebar() {
  sidebar.classList.add(
    "open"
  );

  overlay.classList.add(
    "open"
  );
}


function closeMobileSidebar() {
  sidebar.classList.remove(
    "open"
  );

  overlay.classList.remove(
    "open"
  );
}


/* =========================================================
   45. AUTO RESIZE MESSAGE BOX
   ========================================================= */

function autoResizeTextarea() {
  if (!messageInput) return;

  messageInput.style.height =
    "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      180
    ) + "px";
}


/* =========================================================
   46. SCROLL
   ========================================================= */

function scrollToBottom() {
  const chatArea =
    $("chatArea");

  if (!chatArea) return;

  requestAnimationFrame(() => {

    chatArea.scrollTop =
      chatArea.scrollHeight;

  });
}


/* =========================================================
   47. DELAY
   ========================================================= */

function delay(ms) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}


/* =========================================================
   48. SUGGESTIONS
   ========================================================= */

function setupSuggestions() {
  const suggestions =
    document.querySelectorAll(
      ".suggestion"
    );

  suggestions.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          messageInput.value =
            button.textContent.trim();

          autoResizeTextarea();

          messageInput.focus();
        }
      );

    }
  );
}


/* =========================================================
   49. KEYBOARD
   ========================================================= */

function setupKeyboard() {
  if (!messageInput) return;

  messageInput.addEventListener(
    "input",
    autoResizeTextarea
  );

  messageInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }

    }
  );
}


/* =========================================================
   50. EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener(
      "click",
      signInWithGoogle
    );
  }

  if (signInBtn) {
    signInBtn.addEventListener(
      "click",
      signInWithEmail
    );
  }

  if (createAccountBtn) {
    createAccountBtn.addEventListener(
      "click",
      createAccount
    );
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener(
      "click",
      resetPassword
    );
  }

  if (guestBtn) {
    guestBtn.addEventListener(
      "click",
      continueAsGuest
    );
  }

  if (newChatBtn) {
    newChatBtn.addEventListener(
      "click",
      () => createNewChat(true)
    );
  }

  if (sendBtn) {
    sendBtn.addEventListener(
      "click",
      sendMessage
    );
  }

  if (themeBtn) {
    themeBtn.addEventListener(
      "click",
      toggleTheme
    );
  }

  if (shareBtn) {
    shareBtn.addEventListener(
      "click",
      openShareModal
    );
  }

  if (copyShareBtn) {
    copyShareBtn.addEventListener(
      "click",
      async () => {

        const success =
          await copyText(
            shareText.value
          );

        if (success) {
          showToast(
            "Chat copied"
          );
        } else {
          showToast(
            "Could not copy chat"
          );
        }
      }
    );
  }

  if (exportAllBtn) {
    exportAllBtn.addEventListener(
      "click",
      exportAllChats
    );
  }

  if (deleteAllBtn) {
    deleteAllBtn.addEventListener(
      "click",
      deleteAllChats
    );
  }

  if (logoutBtn) {
    logoutBtn.addEventListener(
      "click",
      logout
    );
  }

  if ($("menuBtn")) {
    $("menuBtn").addEventListener(
      "click",
      openMobileSidebar
    );
  }

  if (overlay) {
    overlay.addEventListener(
      "click",
      closeMobileSidebar
    );
  }

  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.close;

          const element =
            $(id);

          if (element) {
            element.classList.add(
              "hidden"
            );
          }

        }
      );

    });

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeMobileSidebar();

        if (shareModal) {
          shareModal.classList.add(
            "hidden"
          );
        }
      }

    }
  );

  if (emailInput) {
    emailInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {
          signInWithEmail();
        }

      }
    );
  }

  if (passwordInput) {
    passwordInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {
          signInWithEmail();
        }

      }
    );
  }
}


/* =========================================================
   51. START APPLICATION
   ========================================================= */

async function startApp() {

  console.log(
    "Hare Krishna AI starting..."
  );

  loadTheme();

  setupEventListeners();

  setupSuggestions();

  setupKeyboard();

  renderChatList();

  renderCurrentChat();

  if (!firebaseReady) {

    console.warn(
      "Firebase is not configured."
    );

    showAuthScreen();

    setAuthMessage(
      "Firebase configuration is missing. Add your Firebase config to app.js.",
      "error"
    );

    return;
  }

  await checkRedirectLogin();

  setupAuthListener();
}


/* =========================================================
   52. START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  startApp
);