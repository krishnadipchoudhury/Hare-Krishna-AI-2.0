/* =========================================================
   HARE KRISHNA AI
   COMPLETE APP.JS
   Firebase Authentication + Firestore
   ========================================================= */


/* =========================================================
   0. ON-SCREEN ERROR BANNER (diagnostic — no devtools needed)
   =========================================================
   Placed at the very top so it's active before anything else
   runs. If any JS error occurs anywhere in this file (or a
   promise rejects without being caught), a red banner shows
   the exact message/line right on the page. Safe to leave in
   permanently — it stays invisible unless something breaks.
   ========================================================= */

(function () {
  function showErrorBanner(text) {
    try {
      var existing =
        document.getElementById("jsErrorBanner");

      if (existing) {
        existing.textContent += "\n\n" + text;
        return;
      }

      var banner =
        document.createElement("div");

      banner.id = "jsErrorBanner";

      banner.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:999999;" +
        "background:#e5484d;color:#fff;padding:12px 14px;" +
        "font:12px/1.5 monospace;white-space:pre-wrap;" +
        "max-height:45vh;overflow:auto;";

      banner.textContent = text;

      document.body.appendChild(banner);

    } catch (bannerError) {
      // If even this fails, there's nothing more we can do —
      // fall through silently rather than throwing again.
    }
  }

  window.addEventListener("error", function (event) {
    var message =
      "JS ERROR: " +
      (event.message || "unknown error") +
      "\nFile: " +
      (event.filename || "?") +
      ":" +
      (event.lineno || "?") +
      ":" +
      (event.colno || "?");

    console.error(message, event.error);

    showErrorBanner(message);
  });

  window.addEventListener(
    "unhandledrejection",
    function (event) {
      var reason =
        event && event.reason
          ? (event.reason.stack || event.reason.message || event.reason)
          : "unknown rejection";

      var message =
        "UNHANDLED PROMISE REJECTION: " + reason;

      console.error(message);

      showErrorBanner(message);
    }
  );
})();


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

/* ---------------------------------------------------------
   GOOGLE SIGN-IN ON PHONES — OPTIONAL BUT RECOMMENDED FIX
   ---------------------------------------------------------
   Modern mobile browsers (Safari/iOS, Chrome) block the hidden
   storage that Firebase uses to finish Google sign-in when the
   login page lives on a different domain than your website
   ("my-ai-69dc8.firebaseapp.com" vs your Vercel site). The
   symptom: you pick your Google account, come back, and are
   NOT signed in.

   The fix is to let Firebase use YOUR OWN domain. The proxy is
   already set up in vercel.json. To switch it on:
     1. Put your site's domain below, WITHOUT https://
        (example: "my-ai.vercel.app" or "chat.example.com").
     2. In Google Cloud Console -> APIs & Services -> Credentials
        -> your "Web client" -> Authorized redirect URIs, add:
        https://YOUR-DOMAIN/__/auth/handler
     3. In Firebase Console -> Authentication -> Settings ->
        Authorized domains, make sure YOUR-DOMAIN is listed.
   Leave it "" to keep the old behaviour.
   --------------------------------------------------------- */

const CUSTOM_AUTH_DOMAIN = "";

const FIREBASE_AUTH_DOMAIN = "my-ai-69dc8.firebaseapp.com";

// Only used on the exact site it was set for, so localhost and
// Vercel preview URLs keep working the old way.
const usingCustomAuthDomain =
  !!CUSTOM_AUTH_DOMAIN &&
  window.location.host === CUSTOM_AUTH_DOMAIN;

const firebaseConfig = {
apiKey: "AIzaSyDnXgAC-flp3Th0hxkz3TfH5Hm6DUy-zE0",
authDomain: usingCustomAuthDomain ? CUSTOM_AUTH_DOMAIN : FIREBASE_AUTH_DOMAIN,
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

    // Explicit LOCAL persistence — survives closing the browser
    // entirely, not just the current tab/session. Relying on
    // Firebase's implicit default has been unreliable in some
    // mobile browser/WebView environments, causing sign-in to
    // silently not survive reopening the app.
    auth
      .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch(error => {
        console.error(
          "Auth persistence setup error:",
          error
        );
      });

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

// Generation is tracked PER CHAT (not with one global flag). A reply
// that is still being generated in one chat must never disable the
// Send button, or block sending, in any other chat — so this is a Set
// of the chat ids that currently have a reply in flight.
const generatingChatIds = new Set();

// The live "assistant is replying" row of each in-flight chat, keyed by
// chat id. If the person switches to another chat mid-reply (or a
// Firestore snapshot re-renders the thread), the row is put back when
// they return, instead of the reply vanishing until it finishes.
const pendingReplyRows = new Map();

function isChatGenerating(chatId) {
  const id = chatId === undefined ? currentChatId : chatId;

  return !!id && generatingChatIds.has(id);
}

// Send is disabled only while the chat you are LOOKING AT is busy.
function updateSendButtonState() {
  const button = document.getElementById("sendBtn");

  if (!button) return;

  button.disabled = isChatGenerating();
}

// Chats are always looked up by id at the moment they're needed.
// (The Firestore listener rebuilds the whole `chats` array — new
// objects — after every save, so a chat object captured earlier in a
// long-running reply would be stale by the time the reply finishes.)
function findChatById(chatId) {
  if (!chatId) return null;

  if (incognitoChat && incognitoChat.id === chatId) {
    return incognitoChat;
  }

  return chats.find(chat => chat.id === chatId) || null;
}

let incognitoMode = false;
let incognitoChat = null;
let chatIdBeforeIncognito = null;

let unsubscribeChats = null;

let toastTimer = null;

let memoryEnabled = true;
let memoryItems = [];

let deletedChats = [];

const BIN_RETENTION_DAYS = 14;
const BIN_RETENTION_MS = BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const SUPPORT_EMAIL = "krishnadipchoudhury51@gmail.com";


/* =========================================================
   SHARED LEARNED-ANSWER CACHE
   =========================================================
   When a question actually needs a real web search + AI call
   (the expensive path), the resulting answer gets saved here —
   in a top-level Firestore collection shared by every user of
   the app, not scoped to one account. Next time anyone asks a
   question that normalizes to the same text, the saved answer
   is reused instantly instead of searching again.

   This is exact-match learning (after lowercasing/punctuation
   stripping/whitespace collapsing) — it will not recognize a
   totally different phrasing of the same question as "the same"
   one. True paraphrase-matching would need a vector/embedding
   search, which is out of scope for this vanilla JS + Firestore
   setup. Worth knowing so expectations match what this can
   actually do.

   Requires a Firestore security rule allowing read/write on the
   "sharedKnowledge" collection — see the notes sent with this
   update for the rule to add.
   ========================================================= */

const LEARNED_CACHE_COLLECTION = "sharedKnowledge";

// FIX: a wrong answer ("I was created by OpenAI") got cached here
// before the identity/knowledge-base fix existed, and since this
// cache is checked BEFORE the (now-fixed) /api/chat logic ever runs,
// that stale answer kept getting served forever for the exact phrase
// that produced it — no amount of fixing chat.js/knowledgeData.js
// could ever reach it. Stamping every cache write with a version and
// rejecting reads whose version doesn't match makes every old entry
// (this bad one included) a miss exactly once, so it gets regenerated
// fresh from the current, correct logic and re-cached with the new
// version. Bump this number again in the future any time a fix should
// invalidate previously-learned answers.
// v3: math answers are now written in LaTeX and rendered with KaTeX, so
// answers learned earlier (plain-text math, or the old "this app can't
// render LaTeX" disclaimer) are retired once and regenerated.
const LEARNED_CACHE_VERSION = 3;

function normalizeQuestionForCache(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[?.!,;:'"]/g, "")
    .replace(/\s+/g, " ");
}

function hashToId(str) {
  // Small deterministic string hash (djb2 variant) — good enough
  // for a stable, Firestore-doc-ID-safe key. Not cryptographic,
  // just needs to be consistent for the same input every time.
  let hash = 5381;

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }

  return "q" + Math.abs(hash).toString(36);
}

function getLearnedCacheDocId(question) {
  return hashToId(
    normalizeQuestionForCache(question)
  );
}

async function checkLearnedAnswer(question) {
  if (!db) return null;

  try {
    const docId =
      getLearnedCacheDocId(question);

    const doc =
      await db
        .collection(LEARNED_CACHE_COLLECTION)
        .doc(docId)
        .get();

    if (!doc.exists) return null;

    const data = doc.data();

    if (
      !data ||
      typeof data.answer !== "string" ||
      !data.answer.trim()
    ) {
      return null;
    }

    if (data.cacheVersion !== LEARNED_CACHE_VERSION) {
      return null;
    }

    return {
      text: data.answer,
      sources:
        Array.isArray(data.sources) ? data.sources : []
    };

  } catch (error) {
    console.error(
      "Learned cache read error:",
      error
    );

    return null;
  }
}

async function saveLearnedAnswer(question, answer, sources) {
  if (!db) return;
  if (!question || !answer) return;

  try {
    const docId =
      getLearnedCacheDocId(question);

    const payload = {
      question: question,
      normalizedQuestion:
        normalizeQuestionForCache(question),
      answer: answer,
      sources: Array.isArray(sources) ? sources : [],
      cacheVersion: LEARNED_CACHE_VERSION
    };

    if (firebaseReady && typeof firebase !== "undefined") {
      payload.updatedAt =
        firebase.firestore.FieldValue.serverTimestamp();

      payload.askedCount =
        firebase.firestore.FieldValue.increment(1);
    }

    await db
      .collection(LEARNED_CACHE_COLLECTION)
      .doc(docId)
      .set(payload, { merge: true });

  } catch (error) {
    // Non-fatal — the answer was already shown to the person,
    // this just means it won't be reused next time.
    console.error(
      "Learned cache save error:",
      error
    );
  }
}


/* =========================================================
   ICON LIBRARY (outline SVGs, no emoji)
   ========================================================= */

const ICONS = {

  // pin / unpin share ONE geometry (the slash version is the same pin
  // with its outline cut where the strike-through crosses it), so the
  // two icons always look like a matching pair at every size.
  pin:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round' aria-hidden='true' focusable='false'>" +
    "<path d='M12 17v5'></path>" +
    "<path d='M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'></path>" +
    "</svg>",

  unpin:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round' aria-hidden='true' focusable='false'>" +
    "<path d='M12 17v5'></path>" +
    "<path d='M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89'></path>" +
    "<path d='M2 2l20 20'></path>" +
    "<path d='M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11'></path>" +
    "</svg>",

  pencil:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<path d='M12 20h9'></path>" +
    "<path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'></path>" +
    "</svg>",

  trash:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<path d='M3 6h18'></path>" +
    "<path d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path>" +
    "<path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'></path>" +
    "<line x1='10' y1='11' x2='10' y2='17'></line>" +
    "<line x1='14' y1='11' x2='14' y2='17'></line>" +
    "</svg>",

  thumbsUp:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<path d='M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7" +
    "l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3'>" +
    "</path>" +
    "</svg>",

  thumbsDown:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<path d='M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7" +
    "l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3'>" +
    "</path>" +
    "</svg>",

  selectText:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<polyline points='4 7 4 4 20 4 20 7'></polyline>" +
    "<line x1='9' y1='20' x2='15' y2='20'></line>" +
    "<line x1='12' y1='4' x2='12' y2='20'></line>" +
    "</svg>",

  regenerate:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<polyline points='23 4 23 10 17 10'></polyline>" +
    "<polyline points='1 20 1 14 7 14'></polyline>" +
    "<path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36" +
    "A9 9 0 0 0 20.49 15'></path>" +
    "</svg>",

  moreDots:
    "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<circle cx='5' cy='12' r='1.5'></circle>" +
    "<circle cx='12' cy='12' r='1.5'></circle>" +
    "<circle cx='19' cy='12' r='1.5'></circle>" +
    "</svg>",

  globe:
    "<svg viewBox='0 0 24 24' width='14' height='14' fill='none' " +
    "stroke='currentColor' stroke-width='1.6' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<circle cx='12' cy='12' r='9'></circle>" +
    "<ellipse cx='12' cy='12' rx='4' ry='9'></ellipse>" +
    "<line x1='3' y1='12' x2='21' y2='12'></line>" +
    "<path d='M4.5 7.5h15'></path>" +
    "<path d='M4.5 16.5h15'></path>" +
    "</svg>",

  codeCopy:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<rect x='9' y='9' width='12' height='12' rx='2'></rect>" +
    "<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path>" +
    "</svg>",

  codeFullscreen:
    "<svg viewBox='0 0 24 24' width='15' height='15' fill='none' " +
    "stroke='currentColor' stroke-width='2' stroke-linecap='round' " +
    "stroke-linejoin='round'>" +
    "<polyline points='15 3 21 3 21 9'></polyline>" +
    "<polyline points='9 21 3 21 3 15'></polyline>" +
    "<line x1='21' y1='3' x2='14' y2='10'></line>" +
    "<line x1='3' y1='21' x2='10' y2='14'></line>" +
    "</svg>"

};


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
const pinnedList = $("pinnedList");
const pinnedSection = $("pinnedSection");

const incognitoBtn = $("incognitoBtn");
const incognitoBanner = $("incognitoBanner");

const selectTextModal = $("selectTextModal");
const selectTextArea = $("selectTextArea");

const codeFullscreenModal = $("codeFullscreenModal");
const codeFullscreenContent = $("codeFullscreenContent");
const codeFullscreenBackBtn = $("codeFullscreenBackBtn");
const codeFullscreenCopyBtn = $("codeFullscreenCopyBtn");
const newChatBtn = $("newChatBtn");

const messages = $("messages");
const welcome = $("welcome");

const messageInput = $("messageInput");
const sendBtn = $("sendBtn");

const shareBtn = $("shareBtn");
const themeSettingsBtn = $("themeSettingsBtn");
const themeSettingsValue = $("themeSettingsValue");
const themeModal = $("themeModal");

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

const settingsBtn = $("settingsBtn");
const settingsModal = $("settingsModal");

const settingsAvatar = $("settingsAvatar");
const settingsName = $("settingsName");
const settingsEmail = $("settingsEmail");

const manageAccountBtn = $("manageAccountBtn");
const settingsSignOutBtn = $("settingsSignOutBtn");

const deleteAccountBtn = $("deleteAccountBtn");
const deleteAccountConfirmModal = $("deleteAccountConfirmModal");
const deleteAccountCancelBtn = $("deleteAccountCancelBtn");
const deleteAccountConfirmBtn = $("deleteAccountConfirmBtn");

const memoryToggle = $("memoryToggle");
const manageMemoryBtn = $("manageMemoryBtn");
const memoryModal = $("memoryModal");
const memoryList = $("memoryList");
const deleteAllConfirmModal = $("deleteAllConfirmModal");
const deleteAllCancelBtn = $("deleteAllCancelBtn");
const deleteAllConfirmBtn = $("deleteAllConfirmBtn");
const clearMemoryBtn = $("clearMemoryBtn");

const openBinBtn = $("openBinBtn");
const binModal = $("binModal");
const binList = $("binList");

const customerServiceBtn = $("customerServiceBtn");

const termsBtn = $("termsBtn");
const privacyBtn = $("privacyBtn");
const licenseBtn = $("licenseBtn");
const legalModal = $("legalModal");
const legalTitle = $("legalTitle");
const legalContent = $("legalContent");


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

function showToast(message, duration = 2600) {
  if (!toast) return;

  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
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

    case "auth/requires-recent-login":
      return "For your security, please sign in again before deleting your account.";

    case "auth/unauthorized-domain":
      return "This website's domain is not allowed for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.";

    case "auth/web-storage-unsupported":
    case "auth/operation-not-supported-in-this-environment":
      return "This browser is blocking sign-in storage. Turn off private/incognito mode or 'Prevent cross-site tracking', or open the site in Chrome or Safari.";

    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";

    case "auth/internal-error":
      return "Sign-in could not be completed. Please try again.";

    default:
      return (
        (error.message || "Authentication failed.") +
        (code ? " (" + code + ")" : "")
      );
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

    // Defensive: clear any leftover guest flag from a previous
    // session before attempting a real sign-in, so it can never
    // interfere with how the result gets handled.
    localStorage.removeItem(
      "hareKrishnaGuest"
    );

    googleLoginBtn.disabled = true;

    // Google refuses sign-in inside the in-app browsers of Instagram,
    // Facebook, Snapchat, LINE, WeChat etc. (error 403
    // "disallowed_useragent") — tell the person instead of failing.
    if (
      /FBAN|FBAV|Instagram|Snapchat|Line\/|MicroMessenger|; wv\)/i
        .test(navigator.userAgent || "")
    ) {
      setAuthMessage(
        "Google sign-in does not work inside this app's built-in browser. " +
        "Tap ⋮ / Share and choose 'Open in Chrome' or 'Open in Safari', " +
        "or sign in with email.",
        "error"
      );

      return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    const isMobile =
      /android|iphone|ipad|ipod|mobile/i
        .test(navigator.userAgent || "");

    // On phones a popup is the least reliable method. Once the site's
    // own auth domain is set up (see CUSTOM_AUTH_DOMAIN), a full-page
    // redirect is used there instead — that is the dependable way.
    if (isMobile && usingCustomAuthDomain) {
      await auth.signInWithRedirect(provider);
      return;
    }

    try {
      await auth.signInWithPopup(provider);
    } catch (popupError) {

      /*
       * Popups can be blocked or unsupported (some mobile browsers,
       * home-screen apps). Redirect is used as the fallback.
       */

      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/cancelled-popup-request" ||
        popupError.code === "auth/operation-not-supported-in-this-environment"
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

    // Defensive: clear any leftover guest flag from a previous
    // session before attempting a real sign-in.
    localStorage.removeItem(
      "hareKrishnaGuest"
    );

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

    // Defensive: clear any leftover guest flag from a previous
    // session before creating a real account.
    localStorage.removeItem(
      "hareKrishnaGuest"
    );

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

  loadGuestDeletedChats();
  purgeExpiredDeletedChats();

  loadMemoryLocal();

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
  updateSettingsPanel();

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
   17b. MODAL HELPERS
   ========================================================= */

function openModal(modal) {
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.add("hidden");
  }
}

// FIX: licenseBtn's click handler called openLegalModal("license"),
// but that function was never defined anywhere in this file — every
// click threw "Uncaught ReferenceError: openLegalModal is not
// defined" and the legalModal (#legalTitle/#legalContent) was never
// populated or shown. This defines it so the License entry in
// Support & Legal actually opens the modal with the project's MIT
// license text.
const LEGAL_TEXTS = {
  license: {
    title: "License",
    paragraphs: [
      "MIT License",
      "Copyright (c) 2026 Krishnadip Choudhury",
      "Permission is hereby granted, free of charge, to any " +
        "person obtaining a copy of this software and associated " +
        "documentation files (the \"Software\"), to deal in the " +
        "Software without restriction, including without " +
        "limitation the rights to use, copy, modify, merge, " +
        "publish, distribute, sublicense, and/or sell copies of " +
        "the Software, and to permit persons to whom the Software " +
        "is furnished to do so, subject to the following " +
        "conditions:",
      "The above copyright notice and this permission notice " +
        "shall be included in all copies or substantial portions " +
        "of the Software.",
      "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF " +
        "ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED " +
        "TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A " +
        "PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT " +
        "SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY " +
        "CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION " +
        "OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR " +
        "IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER " +
        "DEALINGS IN THE SOFTWARE."
    ]
  }
};

function openLegalModal(type) {
  if (!legalModal || !legalTitle || !legalContent) {
    return;
  }

  const entry = LEGAL_TEXTS[type];

  if (!entry) {
    return;
  }

  legalTitle.textContent = entry.title;

  legalContent.innerHTML = "";

  entry.paragraphs.forEach(paragraphText => {
    const p = document.createElement("p");

    p.textContent = paragraphText;

    legalContent.appendChild(p);
  });

  openModal(legalModal);
}


/* =========================================================
   17c. SETTINGS PANEL
   ========================================================= */

function updateSettingsPanel() {
  if (
    !settingsAvatar ||
    !settingsName ||
    !settingsEmail
  ) {
    return;
  }

  if (isGuest || !currentUser) {
    settingsName.textContent = "Guest";
    settingsEmail.textContent = "Not signed in";

    settingsAvatar.innerHTML = "?";

    if (manageAccountBtn) {
      manageAccountBtn.style.display = "none";
    }

    return;
  }

  const name =
    currentUser.displayName ||
    (
      currentUser.email
        ? currentUser.email.split("@")[0]
        : "User"
    );

  settingsName.textContent = name;

  settingsEmail.textContent =
    currentUser.email || "";

  if (currentUser.photoURL) {
    settingsAvatar.innerHTML = "";

    const img =
      document.createElement("img");

    img.src = currentUser.photoURL;
    img.alt = "";

    settingsAvatar.appendChild(img);

  } else {
    settingsAvatar.textContent =
      name.charAt(0).toUpperCase();
  }

  const isGoogleUser =
    Array.isArray(currentUser.providerData) &&
    currentUser.providerData.some(
      provider => provider.providerId === "google.com"
    );

  if (manageAccountBtn) {
    manageAccountBtn.style.display =
      isGoogleUser ? "flex" : "none";
  }
}

function openSettingsModal() {
  updateSettingsPanel();

  if (memoryToggle) {
    memoryToggle.checked = memoryEnabled;
  }

  openModal(settingsModal);
}

function openManageGoogleAccount() {
  window.open(
    "https://myaccount.google.com/",
    "_blank",
    "noopener"
  );
}


/* =========================================================
   17d. CUSTOMER SERVICE
   ========================================================= */

function openCustomerSupport() {
  const subject =
    encodeURIComponent("Support Request - Hare Krishna AI");

  const body =
    encodeURIComponent(
      "Hi, I need help with...\n\n" +
      "(Please describe your issue above. " +
      "Include your account email if relevant.)"
    );

  const mailtoUrl =
    `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

  // Using a real <a> element and clicking it is more reliable than
  // window.location.href on mobile browsers/webviews, and reliably
  // pre-fills the "To" field with the support address below.
  const link =
    document.createElement("a");

  link.href = mailtoUrl;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}



/* =========================================================
   17e. MEMORY (guest = localStorage, account = Firestore)
   ========================================================= */

function loadMemoryLocal() {
  try {
    const saved =
      localStorage.getItem("hareKrishnaGuestMemory");

    if (saved) {
      const parsed = JSON.parse(saved);

      memoryItems =
        Array.isArray(parsed.items) ? parsed.items : [];

      memoryEnabled =
        parsed.enabled !== false;

    } else {
      memoryItems = [];
      memoryEnabled = true;
    }

  } catch (error) {
    console.error("Memory load error:", error);

    memoryItems = [];
    memoryEnabled = true;
  }
}

function saveMemoryLocal() {
  try {
    localStorage.setItem(
      "hareKrishnaGuestMemory",
      JSON.stringify({
        items: memoryItems,
        enabled: memoryEnabled
      })
    );

  } catch (error) {
    console.error("Memory save error:", error);
  }
}

async function loadMemoryFromFirestore() {
  if (!db || !currentUser) return;

  try {
    const doc =
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("settings")
        .doc("memory")
        .get();

    if (doc.exists) {
      const data = doc.data();

      memoryItems =
        Array.isArray(data.items) ? data.items : [];

      memoryEnabled =
        data.enabled !== false;

    } else {
      memoryItems = [];
      memoryEnabled = true;
    }

  } catch (error) {
    console.error("Memory load error:", error);
  }
}

async function saveMemoryToFirestore() {
  if (!db || !currentUser) return;

  try {
    await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("settings")
      .doc("memory")
      .set(
        {
          items: memoryItems,
          enabled: memoryEnabled,
          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

  } catch (error) {
    console.error("Memory save error:", error);
  }
}

function persistMemory() {
  if (!isGuest && currentUser) {
    saveMemoryToFirestore();
  } else {
    saveMemoryLocal();
  }
}

function renderMemoryList(highlightIds) {
  if (!memoryList) return;

  const highlight =
    new Set(
      Array.isArray(highlightIds) ? highlightIds : []
    );

  let firstHighlighted = null;

  memoryList.innerHTML = "";

  if (!memoryItems.length) {
    const empty =
      document.createElement("div");

    empty.className = "memory-empty";
    empty.textContent = "Nothing saved yet.";

    memoryList.appendChild(empty);
    return;
  }

  memoryItems.forEach(entry => {

    const item =
      document.createElement("div");

    item.className = "memory-item";

    if (highlight.has(entry.id)) {
      item.classList.add("memory-item-new");

      if (!firstHighlighted) firstHighlighted = item;
    }

    const text =
      document.createElement("div");

    text.className = "memory-item-text";
    text.textContent = entry.text;

    if (entry.auto) {
      const badge =
        document.createElement("span");

      badge.className = "memory-item-badge";
      badge.textContent = "Saved by AI";

      text.appendChild(badge);
    }

    const del =
      document.createElement("button");

    del.className = "memory-item-delete";
    del.type = "button";
    del.textContent = "×";
    del.title = "Delete this memory";

    del.addEventListener(
      "click",
      () => deleteMemoryEntry(entry.id)
    );

    item.appendChild(text);
    item.appendChild(del);

    memoryList.appendChild(item);
  });

  if (firstHighlighted) {
    setTimeout(() => {
      if (firstHighlighted.scrollIntoView) {
        firstHighlighted.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    }, 120);
  }
}

// Opens Settings -> Memory (the saved-memory panel), with the facts
// the AI just saved lit up.
function openMemoryPanel(highlightIds) {
  renderMemoryList(highlightIds);

  openModal(memoryModal);
}

function addMemoryEntry(rawText) {
  const clean = String(rawText || "").trim();

  if (!clean) return;

  memoryItems.unshift({
    id: generateId(),
    text: clean,
    createdAt: Date.now()
  });

  persistMemory();
  renderMemoryList();

  showToast("Memory saved");
}

/* =========================================================
   17f. AUTOMATIC MEMORY (learn from what the person says)
   =========================================================
   After every message, /api/extract-memory (Groq) picks out
   lasting facts — age, class, school, city, plans, likes… —
   and they are added to Settings -> Memory. A permanent
   "Saved to memory" bar then appears inside the AI's answer;
   clicking it opens the saved-memory panel.
   Everything here is best-effort and runs in the background:
   if the request fails, is slow, or finds nothing, the chat
   is completely unaffected.
   ========================================================= */

const MEMORY_MAX_ITEMS = 100;

// A message only goes to the extractor if it talks about the
// person (English + common Hinglish), which skips most
// pure questions / maths and saves server calls.
const PERSONAL_HINT_REGEX =
  /\b(i|i'm|im|i've|ive|i'll|ill|i'd|my|mine|myself|me|we|our|mera|meri|mere|main|mujhe|hum|hamara|hamari|hamare|favou?rite|going to|planning to)\b/i;

// Anything that looks like a credential or financial/ID secret.
// A sentence matching this is NEVER sent to the extractor and NEVER
// saved (api/extract-memory.js applies the same rules again).
const SECRET_HINT_REGEX =
  new RegExp(
    "\\b(" +
      "pass(?:word|wd|code|phrase)s?|pin|otp|cvv|cvc|ssn|" +
      "api[ _-]?keys?|secret[ _-]?keys?|client[ _-]?secret|" +
      "(?:access|auth(?:orization)?|bearer|refresh|session|login)[ _-]?tokens?|tokens?|" +
      "credentials?|private[ _-]?keys?|seed[ _-]?phrase|" +
      "(?:recovery|backup|security|verification)[ _-]?(?:code|phrase|answer)s?|" +
      "2fa|mfa|credit[ _-]?card|debit[ _-]?card|card[ _-]?number|" +
      "account[ _-]?number|routing[ _-]?number|social[ _-]?security|" +
      "aadhaa?r|bank[ _-]?account" +
    ")\\b" +
    "|(?:\\d[ -]?){9,}" +
    "|\\b(?:sk|pk|gsk|ghp|xox[abp]|AKIA)[-_A-Za-z0-9]{16,}" +
    "|\\b(?=[A-Za-z0-9_-]*\\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{24,}\\b",
    "i"
  );

// Removes every sentence that mentions a secret, keeps the rest:
// "My favorite color is red. My password is abc" -> "My favorite
// color is red."  Returns "" if nothing safe is left.
function stripSecretSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?\n;])\s+|\n+/)
    .filter(part => part.trim() && !SECRET_HINT_REGEX.test(part))
    .join(" ")
    .trim();
}

function normalizeMemoryText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isDuplicateMemory(text) {
  const wanted = normalizeMemoryText(text);

  if (!wanted) return true;

  return memoryItems.some(entry => {
    const have = normalizeMemoryText(entry.text);

    return (
      have === wanted ||
      (have.length > 12 && wanted.includes(have)) ||
      (wanted.length > 12 && have.includes(wanted))
    );
  });
}

// What the AI is shown on every request (newest first).
function getMemoryForApi() {
  if (!memoryEnabled) return [];

  return memoryItems
    .slice(0, 40)
    .map(entry =>
      String(entry.text || "").slice(0, 200)
    )
    .filter(Boolean);
}

// True when this person's own facts/memory are part of a request.
function hasPersonalContext() {
  if (getMemoryForApi().length) return true;

  try {
    return Object.keys(getKnownFacts()).length > 0;
  } catch {
    return false;
  }
}

function buildMemorySavedBar(facts, ids) {
  const list =
    Array.isArray(facts) ? facts : [];

  const bar =
    document.createElement("div");

  bar.className = "memory-saved-bar";

  bar.setAttribute("role", "button");
  bar.tabIndex = 0;

  bar.title =
    "Saved to memory:\n• " +
    list.join("\n• ") +
    "\n\nClick to open your saved memory";

  const icon =
    document.createElement("span");

  icon.className = "memory-saved-icon";

  // brain-style "memory" mark
  icon.innerHTML =
    "<svg viewBox='0 0 24 24' width='16' height='16' " +
    "fill='none' stroke='currentColor' stroke-width='2' " +
    "stroke-linecap='round' stroke-linejoin='round' " +
    "aria-hidden='true' focusable='false'>" +
    "<path d='M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z'></path>" +
    "<path d='M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z'></path>" +
    "<path d='M12 5v13'></path></svg>";

  const label =
    document.createElement("span");

  label.className = "memory-saved-label";

  const title =
    document.createElement("strong");

  title.textContent = "Saved to memory";

  const detail =
    document.createElement("span");

  detail.className = "memory-saved-detail";

  detail.textContent =
    list.join(" · ");

  label.appendChild(title);
  label.appendChild(detail);

  const arrow =
    document.createElement("span");

  arrow.className = "memory-saved-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "›";

  bar.appendChild(icon);
  bar.appendChild(label);
  bar.appendChild(arrow);

  // The whole bar — logo included — opens the saved-memory panel.
  const open = () => openMemoryPanel(ids);

  bar.addEventListener("click", open);

  bar.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      open();
    }
  });

  return bar;
}

// If the AI's answer is already on screen when the facts finish
// saving, the bar slides in under it. (If the answer is still being
// written, it simply appears when the answer is finished — the
// facts are stored on the message, and renderMessage reads them.)
function showMemorySavedBar(chatId, createdAt, facts, ids) {
  if (chatId !== currentChatId || !messages) return;

  const userRow =
    messages.querySelector(
      '.message-row.user[data-created="' + createdAt + '"]'
    );

  if (!userRow) return;

  const answerRow =
    userRow.nextElementSibling;

  if (
    !answerRow ||
    !answerRow.classList.contains("assistant") ||
    answerRow.id === "assistantRevealTemp"
  ) {
    return;
  }

  const wrapper =
    answerRow.querySelector(".message-wrapper");

  if (!wrapper) return;

  const old =
    wrapper.querySelector(".memory-saved-bar");

  if (old) old.remove();

  const bar =
    buildMemorySavedBar(facts, ids);

  const actions =
    wrapper.querySelector(".message-actions");

  if (actions) {
    wrapper.insertBefore(bar, actions);
  } else {
    wrapper.appendChild(bar);
  }

  scrollToBottomIfFollowing();
}

async function learnFromUserMessage(text, chatId, createdAt) {
  try {
    if (!memoryEnabled) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return;
    }

    const chat = findChatById(chatId);

    // Incognito chats never write to Memory.
    if (!chat || chat.incognito) return;

    // Sentences that look like secrets are removed BEFORE anything
    // leaves the browser — the rest of the message is still used.
    const clean = stripSecretSentences(text);

    if (clean.length < 8 || clean.length > 1500) return;

    if (!PERSONAL_HINT_REGEX.test(clean)) return;

    const controller =
      typeof AbortController !== "undefined"
        ? new AbortController()
        : null;

    const timer =
      setTimeout(
        () => controller && controller.abort(),
        15000
      );

    let response;

    try {
      response =
        await fetch("/api/extract-memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: clean }),
          signal: controller ? controller.signal : undefined
        });
    } finally {
      clearTimeout(timer);
    }

    if (!response || !response.ok) return;

    const data = await response.json();

    const found =
      Array.isArray(data && data.facts)
        ? data.facts
        : [];

    const added = [];

    const addedIds = [];

    found.forEach(fact => {
      const factText =
        String(fact || "").replace(/\s+/g, " ").trim();

      if (
        !factText ||
        factText.length > 140 ||
        SECRET_HINT_REGEX.test(factText) ||
        isDuplicateMemory(factText)
      ) {
        return;
      }

      const entry = {
        id: generateId(),
        text: factText,
        createdAt: Date.now(),
        auto: true
      };

      memoryItems.unshift(entry);

      added.push(factText);

      addedIds.push(entry.id);
    });

    if (!added.length) return;

    // Keep the list bounded: oldest automatic entries go first.
    while (memoryItems.length > MEMORY_MAX_ITEMS) {
      let index = -1;

      for (let i = memoryItems.length - 1; i >= 0; i--) {
        if (memoryItems[i].auto) {
          index = i;
          break;
        }
      }

      memoryItems.splice(
        index === -1 ? memoryItems.length - 1 : index,
        1
      );
    }

    persistMemory();

    renderMemoryList();

    // Remember on the message itself that it taught us something,
    // so the chip is still there when the chat is reopened.
    const latest = findChatById(chatId);

    const target =
      latest &&
      createdAt &&
      latest.messages.find(
        m => m.role === "user" && m.createdAt === createdAt
      );

    if (target) {
      target.memorySaved = added;

      target.memorySavedIds = addedIds;

      saveGuestChats();

      if (!isGuest && currentUser && !latest.incognito) {
        saveChatToFirestore(latest);
      }

      showMemorySavedBar(chatId, createdAt, added, addedIds);

    } else {
      showToast("Saved to memory");
    }

  } catch (error) {
    // Silent on purpose — see the section note above.
    console.warn("Memory extraction skipped:", error);
  }
}


function deleteMemoryEntry(id) {
  memoryItems =
    memoryItems.filter(entry => entry.id !== id);

  persistMemory();
  renderMemoryList();
}

function clearAllMemory() {
  if (!memoryItems.length) return;

  const confirmed =
    window.confirm(
      "Delete all saved memory? This cannot be undone."
    );

  if (!confirmed) return;

  memoryItems = [];

  persistMemory();
  renderMemoryList();

  showToast("Memory cleared");
}


/* =========================================================
   17f. RECENTLY DELETED (BIN) — 14 day soft delete
   ========================================================= */

function saveGuestDeletedChats() {
  if (!isGuest) return;

  try {
    localStorage.setItem(
      "hareKrishnaGuestBin",
      JSON.stringify(deletedChats)
    );

  } catch (error) {
    console.error("Bin storage error:", error);
  }
}

function loadGuestDeletedChats() {
  try {
    const saved =
      localStorage.getItem("hareKrishnaGuestBin");

    const parsed =
      saved ? JSON.parse(saved) : [];

    deletedChats =
      Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.error("Bin load error:", error);

    deletedChats = [];
  }
}

async function saveDeletedChatToFirestore(chat) {
  if (!db || !currentUser || !chat) return;

  try {
    await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("deletedChats")
      .doc(chat.id)
      .set(
        {
          id: chat.id,
          title: chat.title || "New chat",
          messages: chat.messages || [],
          createdAt: chat.createdAt || Date.now(),
          deletedAt: chat.deletedAt || Date.now()
        },
        { merge: true }
      );

  } catch (error) {
    console.error("Bin save error:", error);
  }
}

async function loadDeletedChatsFromFirestore() {
  if (!db || !currentUser) return;

  try {
    const snapshot =
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("deletedChats")
        .orderBy("deletedAt", "desc")
        .get();

    deletedChats =
      snapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: data.id || doc.id,
          title: data.title || "New chat",
          messages:
            Array.isArray(data.messages) ? data.messages : [],
          createdAt: data.createdAt || Date.now(),
          deletedAt: data.deletedAt || Date.now()
        };
      });

  } catch (error) {
    console.error("Bin load error:", error);
  }
}

function daysRemainingLabel(deletedAt) {
  const msLeft =
    BIN_RETENTION_MS - (Date.now() - (deletedAt || 0));

  const daysLeft =
    Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

  if (daysLeft <= 0) return "Deleting soon";
  if (daysLeft === 1) return "Deletes today";

  return `Deletes in ${daysLeft} days`;
}

function renderBinList() {
  if (!binList) return;

  binList.innerHTML = "";

  if (!deletedChats.length) {
    const empty =
      document.createElement("div");

    empty.className = "bin-empty";
    empty.textContent = "Nothing here.";

    binList.appendChild(empty);
    return;
  }

  deletedChats.forEach(chat => {

    const item =
      document.createElement("div");

    item.className = "bin-item";

    const text =
      document.createElement("div");

    text.className = "bin-item-text";

    const title =
      document.createElement("div");

    title.className = "bin-item-title";
    title.textContent = chat.title || "New chat";

    const sub =
      document.createElement("div");

    sub.className = "bin-item-sub";
    sub.textContent = daysRemainingLabel(chat.deletedAt);

    text.appendChild(title);
    text.appendChild(sub);

    const actions =
      document.createElement("div");

    actions.className = "bin-item-actions";

    const restoreBtn =
      document.createElement("button");

    restoreBtn.type = "button";
    restoreBtn.className = "bin-restore-btn";
    restoreBtn.textContent = "Restore";

    restoreBtn.addEventListener(
      "click",
      () => restoreChat(chat.id)
    );

    const deleteBtn =
      document.createElement("button");

    deleteBtn.type = "button";
    deleteBtn.className = "bin-delete-btn";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener(
      "click",
      () => permanentlyDeleteChat(chat.id)
    );

    actions.appendChild(restoreBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(text);
    item.appendChild(actions);

    binList.appendChild(item);
  });
}

async function restoreChat(chatId) {
  const chat =
    deletedChats.find(item => item.id === chatId);

  if (!chat) return;

  deletedChats =
    deletedChats.filter(item => item.id !== chatId);

  const restored = {
    id: chat.id,
    title: chat.title,
    messages: chat.messages,
    createdAt: chat.createdAt,
    updatedAt: Date.now()
  };

  chats.unshift(restored);
  currentChatId = restored.id;

  saveGuestChats();
  saveGuestDeletedChats();

  renderChatList();
  renderCurrentChat();
  renderBinList();

  if (!isGuest && currentUser && db) {
    try {
      await saveChatToFirestore(restored);

      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("deletedChats")
        .doc(chatId)
        .delete();

    } catch (error) {
      console.error("Restore chat error:", error);
    }
  }

  showToast("Chat restored");
}

async function permanentlyDeleteChat(chatId) {
  const confirmed =
    window.confirm(
      "Permanently delete this chat? This cannot be undone."
    );

  if (!confirmed) return;

  deletedChats =
    deletedChats.filter(item => item.id !== chatId);

  saveGuestDeletedChats();
  renderBinList();

  if (!isGuest && currentUser && db) {
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("deletedChats")
        .doc(chatId)
        .delete();

    } catch (error) {
      console.error("Permanent delete error:", error);
    }
  }

  showToast("Chat permanently deleted");
}

function purgeExpiredDeletedChats() {
  if (!deletedChats.length) return;

  const now = Date.now();

  const expired =
    deletedChats.filter(
      item => now - (item.deletedAt || 0) > BIN_RETENTION_MS
    );

  if (!expired.length) return;

  deletedChats =
    deletedChats.filter(
      item => now - (item.deletedAt || 0) <= BIN_RETENTION_MS
    );

  saveGuestDeletedChats();

  if (!isGuest && currentUser && db) {
    expired.forEach(item => {
      db.collection("users")
        .doc(currentUser.uid)
        .collection("deletedChats")
        .doc(item.id)
        .delete()
        .catch(() => {});
    });
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

        await loadDeletedChatsFromFirestore();
        purgeExpiredDeletedChats();

        await loadMemoryFromFirestore();

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

          loadGuestDeletedChats();
          purgeExpiredDeletedChats();

          loadMemoryLocal();

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
    const result = await auth.getRedirectResult();

    if (result && result.user) {
      console.log("Signed in after redirect.");
    }
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

const MAX_CHATS = 50;

function createNewChat(showMessage = true) {

  if (incognitoMode) {
    incognitoChat = {
      id: "incognito-" + generateId(),
      title: "Incognito chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      incognito: true
    };

    renderCurrentChat();

    closeMobileSidebar();

    return;
  }

  if (chats.length >= MAX_CHATS) {
    showToast(
      `You reached the maximum chat creating limit by ${MAX_CHATS}, ` +
      "delete your old chats and create a new chat",
      5000
    );

    return;
  }

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
   20b. INCOGNITO MODE
   =========================================================
   An incognito chat lives only in memory — it's never added
   to the `chats` array, never written to localStorage or
   Firestore. getCurrentChat() returns it directly whenever
   incognitoMode is on, so the rest of the app (sending
   messages, rendering, etc.) works with it completely
   normally without needing any other changes.
   ========================================================= */

function toggleIncognitoMode() {
  if (incognitoMode) {
    exitIncognitoMode();
  } else {
    enterIncognitoMode();
  }
}

function enterIncognitoMode() {
  if (incognitoMode) return;

  chatIdBeforeIncognito = currentChatId;

  incognitoChat = {
    id: "incognito-" + generateId(),
    title: "Incognito chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false,
    incognito: true
  };

  incognitoMode = true;

  currentChatId = incognitoChat.id;

  if (incognitoBtn) {
    incognitoBtn.classList.add("active");
  }

  if (incognitoBanner) {
    incognitoBanner.classList.remove("hidden");
  }

  renderChatList();
  renderCurrentChat();

  closeMobileSidebar();

  showToast("Incognito mode on — this chat won't be saved");
}

function exitIncognitoMode() {
  if (!incognitoMode) return;

  incognitoMode = false;
  incognitoChat = null;

  currentChatId = chatIdBeforeIncognito;

  if (incognitoBtn) {
    incognitoBtn.classList.remove("active");
  }

  if (incognitoBanner) {
    incognitoBanner.classList.add("hidden");
  }

  renderChatList();
  renderCurrentChat();

  showToast("Incognito mode off");
}


/* =========================================================
   22. GET CURRENT CHAT
   ========================================================= */

function getCurrentChat() {
  if (incognitoMode && incognitoChat) {
    return incognitoChat;
  }

  return chats.find(
    chat => chat.id === currentChatId
  ) || null;
}


/* =========================================================
   23. RENDER CHAT LIST
   ========================================================= */

function buildChatItem(chat) {

  const item =
    document.createElement("div");

  item.className =
    "chat-item" +
    (
      chat.id === currentChatId
        ? " active"
        : ""
    );

  item.dataset.chatId = chat.id;

  if (chat.pinned) {
    const pinIcon =
      document.createElement("span");

    pinIcon.className = "chat-pin-icon";
    pinIcon.title = "Pinned";

    pinIcon.innerHTML =
      ICONS.pin.replace(
        "width='15' height='15'",
        "width='13' height='13'"
      );

    item.appendChild(pinIcon);
  }

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

      toggleChatMenu(chat.id, item, menu);
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

  return item;
}

function renderChatList() {
  if (!chatList) return;

  chatList.innerHTML = "";

  if (pinnedList) {
    pinnedList.innerHTML = "";
  }

  if (!chats.length) {
    const empty =
      document.createElement("div");

    empty.style.padding = "12px 8px";
    empty.style.color = "var(--muted)";
    empty.style.fontSize = "13px";

    empty.textContent =
      "No chats yet.";

    chatList.appendChild(empty);

    if (pinnedSection) {
      pinnedSection.classList.add("hidden");
    }

    return;
  }

  const pinnedChats =
    chats.filter(chat => chat.pinned);

  const recentChats =
    chats.filter(chat => !chat.pinned);

  if (pinnedSection && pinnedList) {
    if (pinnedChats.length) {
      pinnedSection.classList.remove("hidden");

      pinnedChats.forEach(chat => {
        pinnedList.appendChild(
          buildChatItem(chat)
        );
      });

    } else {
      pinnedSection.classList.add("hidden");
    }
  }

  if (!recentChats.length) {
    const empty =
      document.createElement("div");

    empty.style.padding = "12px 8px";
    empty.style.color = "var(--muted)";
    empty.style.fontSize = "13px";

    empty.textContent =
      pinnedChats.length
        ? "No other chats."
        : "No chats yet.";

    chatList.appendChild(empty);

    return;
  }

  recentChats.forEach(chat => {
    chatList.appendChild(
      buildChatItem(chat)
    );
  });
}


/* =========================================================
   24. CHAT DROPDOWN MENU (Rename / Delete)
   ========================================================= */

function closeAllChatMenus() {
  document
    .querySelectorAll(".chat-menu-popup")
    .forEach(popup => popup.remove());

  document
    .querySelectorAll(".chat-menu.open")
    .forEach(button => button.classList.remove("open"));
}

function toggleChatMenu(chatId, item, menuButton) {
  const alreadyOpen =
    menuButton.classList.contains("open");

  closeAllChatMenus();

  if (alreadyOpen) return;

  const chat =
    chats.find(entry => entry.id === chatId);

  if (!chat) return;

  menuButton.classList.add("open");

  const popup =
    document.createElement("div");

  popup.className = "chat-menu-popup";

  const pinBtn =
    document.createElement("button");

  pinBtn.type = "button";

  pinBtn.innerHTML =
    chat.pinned
      ? "<span class='menu-icon'>" + ICONS.unpin + "</span><span>Unpin</span>"
      : "<span class='menu-icon'>" + ICONS.pin + "</span><span>Pin</span>";

  pinBtn.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      closeAllChatMenus();

      toggleChatPinned(chatId);
    }
  );

  const renameBtn =
    document.createElement("button");

  renameBtn.type = "button";

  renameBtn.innerHTML =
    "<span class='menu-icon'>" + ICONS.pencil + "</span><span>Rename</span>";

  renameBtn.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      closeAllChatMenus();

      startRenameChat(chatId, item);
    }
  );

  const deleteBtn =
    document.createElement("button");

  deleteBtn.type = "button";

  deleteBtn.className = "danger";

  deleteBtn.innerHTML =
    "<span class='menu-icon'>" + ICONS.trash + "</span><span>Delete</span>";

  deleteBtn.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      closeAllChatMenus();

      deleteChat(chatId);
    }
  );

  popup.appendChild(pinBtn);
  popup.appendChild(renameBtn);
  popup.appendChild(deleteBtn);

  item.appendChild(popup);
}

/* Click anywhere outside an open chat menu closes it. */
document.addEventListener("click", closeAllChatMenus);


/* =========================================================
   23b. PIN / UNPIN CHAT
   ========================================================= */

function toggleChatPinned(chatId) {
  const chat =
    chats.find(entry => entry.id === chatId);

  if (!chat) return;

  chat.pinned = !chat.pinned;

  chat.updatedAt = Date.now();

  saveGuestChats();

  renderChatList();

  if (!isGuest && currentUser) {
    saveChatToFirestore(chat);
  }

  showToast(
    chat.pinned ? "Chat pinned" : "Chat unpinned"
  );
}


/* =========================================================
   24b. RENAME CHAT (inline input, replaces window.prompt)
   ========================================================= */

function startRenameChat(chatId, item) {
  const chat =
    chats.find(entry => entry.id === chatId);

  if (!chat || !item) return;

  const titleSpan =
    item.querySelector(".chat-title");

  const menuButton =
    item.querySelector(".chat-menu");

  if (!titleSpan) return;

  const input =
    document.createElement("input");

  input.type = "text";
  input.className = "chat-title-input";
  input.value = chat.title || "New chat";
  input.maxLength = 80;

  titleSpan.replaceWith(input);

  if (menuButton) {
    menuButton.style.display = "none";
  }

  input.focus();
  input.select();

  const commit = () => {
    const newTitle = input.value.trim();

    if (newTitle) {
      chat.title = newTitle;
      chat.updatedAt = Date.now();

      saveGuestChats();

      if (!isGuest && currentUser) {
        saveChatToFirestore(chat);
      }
    }

    renderChatList();
  };

  input.addEventListener(
    "click",
    event => event.stopPropagation()
  );

  input.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        renderChatList();
      }
    }
  );

  input.addEventListener("blur", commit);
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
      "Delete this chat? You can restore it from " +
      "Settings → Recently deleted within 14 days."
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

  const deletedChat = {
    id: chat.id,
    title: chat.title,
    messages: chat.messages,
    createdAt: chat.createdAt,
    deletedAt: Date.now()
  };

  deletedChats.unshift(deletedChat);

  saveGuestChats();
  saveGuestDeletedChats();

  renderChatList();

  renderCurrentChat();

  renderBinList();

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

      await saveDeletedChatToFirestore(deletedChat);

    } catch (error) {
      console.error(
        "Delete chat error:",
        error
      );
    }
  }

  showToast("Chat moved to Recently deleted");
}


/* =========================================================
   26. RENDER CURRENT CHAT
   ========================================================= */

function renderCurrentChat() {
  if (!messages) return;

  messages.innerHTML = "";

  // The Send button always reflects the chat now on screen: a reply
  // still generating in ANOTHER chat must not leave it disabled here.
  updateSendButtonState();

  const chat =
    getCurrentChat();

  // A reply that is still being generated for this chat (the person
  // switched away and came back, or a Firestore snapshot re-rendered
  // the thread) — its live row is put back below the messages.
  const pending =
    chat
      ? pendingReplyRows.get(chat.id)
      : null;

  if (
    !chat ||
    (!chat.messages.length && !pending)
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

  if (pending && pending.row) {
    messages.appendChild(pending.row);
  }

  scrollToBottom();
}


/* =========================================================
   26b. RENDER SOURCES (web search links under an AI answer)
   ========================================================= */

function renderSourcesList(container, sources) {
  if (!container || !Array.isArray(sources) || !sources.length) {
    return;
  }

  const list =
    document.createElement("div");

  list.className = "message-sources";

  const label =
    document.createElement("div");

  label.className = "message-sources-label";
  label.textContent = "Sources";

  list.appendChild(label);

  sources.slice(0, 5).forEach(source => {
    if (!source || !source.url) return;

    const link =
      document.createElement("a");

    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "message-source-link";
    link.title = source.url;

    // textContent only — these titles/URLs come from an external
    // API response, never treat them as trusted HTML.
    link.textContent =
      source.title || source.url;

    list.appendChild(link);
  });

  container.appendChild(list);
}


/* =========================================================
   26c. MARKDOWN + LATEX RENDERING (assistant replies only)
   =========================================================
   The AI's answers come back as Markdown (bold, tables,
   headers, lists, line breaks). marked.js turns that into
   HTML; DOMPurify sanitizes it before it ever touches the
   page, since this text is AI-generated and not something
   we should trust blindly. User messages are never run
   through this — they stay as plain escaped text.
   ========================================================= */

/* ---------- LaTeX (KaTeX) ----------
   The AI writes math as $...$ (inline) and $$...$$ (display).
   marked.js would happily mangle that (it treats _ and * and \ as
   Markdown), so math is cut out of the text BEFORE Markdown runs,
   replaced with an invisible placeholder, and put back — rendered
   by KaTeX — AFTER Markdown + DOMPurify are done. KaTeX's own
   output is trusted (trust:false blocks \href / \url etc.), which
   is why it is inserted after sanitizing rather than being run
   through DOMPurify (which would strip its MathML).

   Also understood, because AI models mix these styles up:
     \[ ... \]      \( ... \)
     \begin{align} ... \end{align}  (and equation / gather / cases / matrices)
     lines written as  [ \frac{a}{b} ]
   Math inside `code` and ``` fenced blocks is never touched.
   ------------------------------------------------------------ */

const MATH_OPEN = "\uE000";
const MATH_CLOSE = "\uE001";
const CODE_OPEN = "\uE002";
const CODE_CLOSE = "\uE003";

const KATEX_MACROS = {
  "\\R": "\\mathbb{R}",
  "\\N": "\\mathbb{N}",
  "\\Z": "\\mathbb{Z}",
  "\\Q": "\\mathbb{Q}",
  "\\C": "\\mathbb{C}"
};

const mathHtmlCache = new Map();

function escapeHtmlText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTexToHtml(tex, display) {
  const key = (display ? "D:" : "I:") + tex;

  if (mathHtmlCache.has(key)) {
    return mathHtmlCache.get(key);
  }

  if (
    window.katex &&
    typeof window.katex.renderToString === "function"
  ) {
    try {
      const html =
        window.katex.renderToString(tex, {
          displayMode: display,
          throwOnError: false,
          strict: "ignore",
          trust: false,
          output: "htmlAndMathml",
          // KaTeX writes \newcommand definitions back into this
          // object, so every call gets its own fresh copy.
          macros: Object.assign({}, KATEX_MACROS)
        });

      // The same formula is re-rendered many times while a reply is
      // typing out — caching keeps that instant.
      if (mathHtmlCache.size > 600) {
        mathHtmlCache.clear();
      }

      mathHtmlCache.set(key, html);

      return html;

    } catch (error) {
      console.error("KaTeX error:", error);
    }
  }

  // KaTeX didn't load (offline / CDN blocked) or threw: show the
  // formula's source rather than losing it. Not cached, so it
  // upgrades to real math as soon as KaTeX is available.
  return (
    '<span class="math-fallback' +
    (display ? " math-fallback-display" : "") +
    '">' +
    escapeHtmlText(tex) +
    "</span>"
  );
}

function protectCode(text, stash) {
  const keep = match => {
    stash.push(match);

    return CODE_OPEN + (stash.length - 1) + CODE_CLOSE;
  };

  return String(text)
    // fenced blocks (an unclosed fence — mid-stream — runs to the end)
    .replace(/(```|~~~)[\s\S]*?(?:\1|$)/g, keep)
    // inline code
    .replace(/`[^`\n]+`/g, keep);
}

function restoreCode(text, stash) {
  return String(text).replace(
    /\uE002(\d+)\uE003/g,
    (match, index) =>
      stash[Number(index)] !== undefined
        ? stash[Number(index)]
        : ""
  );
}

function extractMath(source, stash) {
  let text = String(source);

  // Stores one formula and returns what takes its place in the text.
  // Display math that sits on its own line(s) becomes its own
  // paragraph so Markdown can't glue it into the sentence around it.
  function put(tex, display, matchText, offset, whole) {
    const index = stash.length;

    stash.push({ tex: tex.trim(), display });

    const token = MATH_OPEN + index + MATH_CLOSE;

    if (!display) return token;

    const before = whole.slice(0, offset);
    const after = whole.slice(offset + matchText.length);

    const ownLine =
      /(^|\n)[ \t]*$/.test(before) &&
      /^[ \t]*(\n|$)/.test(after);

    return ownLine
      ? "\n\n" + token + "\n\n"
      : token;
  }

  // 1. $$ ... $$
  text = text.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (match, body, offset, whole) =>
      put(body, true, match, offset, whole)
  );

  // 2. \[ ... \]   (not the "\\[2pt]" spacing inside a matrix)
  text = text.replace(
    /(^|[^\\])\\\[([\s\S]+?)\\\]/g,
    (match, prefix, body, offset, whole) =>
      prefix +
      put(
        body,
        true,
        match.slice(prefix.length),
        offset + prefix.length,
        whole
      )
  );

  // 3. environments written without any $ around them
  text = text.replace(
    /\\begin\{(equation\*?|align\*?|alignat\*?|gather\*?|eqnarray\*?|multline\*?|flalign\*?|split|aligned|gathered|cases|array|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|smallmatrix)\}([\s\S]*?)\\end\{\1\}/g,
    (match, env, body, offset, whole) => {
      let tex = match
        .replace(/\\label\{[^}]*\}/g, "")
        .replace(/\\nonumber/g, "");

      // KaTeX has no eqnarray / multline / flalign.
      if (/^eqnarray|^flalign/.test(env)) {
        tex = tex
          .replace(/\\begin\{(eqnarray|flalign)\*?\}/, "\\begin{align*}")
          .replace(/\\end\{(eqnarray|flalign)\*?\}/, "\\end{align*}");
      } else if (/^multline/.test(env)) {
        tex = tex
          .replace(/\\begin\{multline\*?\}/, "\\begin{gather*}")
          .replace(/\\end\{multline\*?\}/, "\\end{gather*}");
      }

      return put(tex, true, match, offset, whole);
    }
  );

  // 4. \( ... \)
  text = text.replace(
    /(^|[^\\])\\\(([\s\S]+?)\\\)/g,
    (match, prefix, body, offset, whole) =>
      prefix +
      put(
        body,
        false,
        match.slice(prefix.length),
        offset + prefix.length,
        whole
      )
  );

  // 5a. a lone line like   [ \frac{a}{b} ]   (some models write
  //     display math this way instead of using \[ \])
  text = text.replace(
    /(^|\n)[ \t]*\[[ \t]+([^\n]*?\\[a-zA-Z][^\n]*?)[ \t]+\][ \t]*(?=\n|$)/g,
    (match, prefix, body) => {
      const index = stash.length;

      stash.push({ tex: body.trim(), display: true });

      return (
        prefix +
        "\n\n" + MATH_OPEN + index + MATH_CLOSE + "\n\n"
      );
    }
  );

  // 5b. the same, with the brackets on their own lines
  text = text.replace(
    /(^|\n)[ \t]*\[[ \t]*\n([\s\S]{0,500}?\\[a-zA-Z][\s\S]{0,500}?)\n[ \t]*\][ \t]*(?=\n|$)/g,
    (match, prefix, body) => {
      const index = stash.length;

      stash.push({ tex: body.trim(), display: true });

      return (
        prefix +
        "\n\n" + MATH_OPEN + index + MATH_CLOSE + "\n\n"
      );
    }
  );

  // 6. $ ... $  — with the usual guard rails so money isn't math:
  //    no space just inside the dollar signs, and the closing $ must
  //    not be followed by a letter/digit ("$5 and $10" stays text).
  text = text.replace(
    /(^|[^\\$\w])\$(?!\s)([^\n$]*?[^\s\\$])\$(?![\w$])/g,
    (match, prefix, body) => {
      const index = stash.length;

      stash.push({ tex: body, display: false });

      return prefix + MATH_OPEN + index + MATH_CLOSE;
    }
  );

  return text;
}

function restoreMath(html, stash) {
  return String(html).replace(
    /\uE000(\d+)\uE001/g,
    (match, index) => {
      const entry = stash[Number(index)];

      return entry
        ? renderTexToHtml(entry.tex, entry.display)
        : "";
    }
  );
}

/* While a reply is still typing out, a half-written formula
   ("$$ x = \frac{1" with no closing $$ yet) would flash as raw
   LaTeX for a moment. This hides only the unfinished tail; it
   appears, fully rendered, the instant its closing delimiter
   arrives. Only ever used for the in-progress view. */
function dropUnclosedMath(text) {
  let t = text;

  if ((t.split("$$").length - 1) % 2 === 1) {
    t = t.slice(0, t.lastIndexOf("$$"));
  }

  [["\\[", "\\]"], ["\\(", "\\)"]].forEach(([open, close]) => {
    const openAt = t.lastIndexOf(open);

    if (openAt > -1 && openAt > t.lastIndexOf(close)) {
      t = t.slice(0, openAt);
    }
  });

  const beginAt = t.lastIndexOf("\\begin{");

  if (beginAt > -1 && beginAt > t.lastIndexOf("\\end{")) {
    t = t.slice(0, beginAt);
  }

  // an open single $ on the line being typed (but never "$5")
  const lineStart = t.lastIndexOf("\n") + 1;

  for (let i = t.length - 1; i >= lineStart; i--) {
    if (
      t[i] === "$" &&
      t[i - 1] !== "\\" &&
      t[i - 1] !== "$" &&
      t[i + 1] !== "$"
    ) {
      const line = t.slice(lineStart);

      const singles =
        (line.match(/(^|[^\\$])\$(?!\$)/g) || []).length;

      if (singles % 2 === 1) {
        const next = t[i + 1];

        if (next && !/[\s\d]/.test(next)) {
          t = t.slice(0, i);
        }
      }

      break;
    }
  }

  return t;
}

/* Unclosed **bold** or `code` while typing would show stray
   asterisks / backticks for a moment — close them for display. */
function autoCloseMarkdown(text) {
  const stripped = text
    .replace(/(```|~~~)[\s\S]*?(?:\1|$)/g, "")
    .replace(/`[^`\n]+`/g, "");

  let t = text;

  if (((stripped.match(/\*\*/g) || []).length) % 2 === 1) {
    t = t.replace(/[ \t]+$/, "") + "**";
  }

  if (((stripped.match(/`/g) || []).length) % 2 === 1) {
    t = t + "`";
  }

  return t;
}

function renderMarkdownSafe(rawText, options) {
  const streaming = !!(options && options.streaming);

  let text = String(rawText || "");

  if (!text) return "";

  if (
    typeof window.marked === "undefined" ||
    typeof window.DOMPurify === "undefined"
  ) {
    // CDN scripts didn't load (offline, blocked, etc.) — fall
    // back to plain escaped text rather than breaking the page.
    const escaped =
      document.createElement("div");

    escaped.textContent = text;

    return escaped.innerHTML.replace(/\n/g, "<br>");
  }

  // 1. hide code, 2. cut the math out, 3. put the code back
  const codeStash = [];
  const mathStash = [];

  text = protectCode(text, codeStash);

  if (streaming) {
    text = dropUnclosedMath(text);
  }

  text = extractMath(text, mathStash);

  mathStash.forEach(entry => {
    entry.tex = restoreCode(entry.tex, codeStash);
  });

  text = restoreCode(text, codeStash);

  if (streaming) {
    text = autoCloseMarkdown(text);
  }

  // 4. Markdown -> sanitized HTML -> 5. math back in as KaTeX
  const html =
    window.marked.parse(text, {
      breaks: true,
      gfm: true
    });

  return restoreMath(
    window.DOMPurify.sanitize(html),
    mathStash
  );
}


/* =========================================================
   26c-2. TYPEWRITER (the typing animation)
   =========================================================
   Network chunks arrive in uneven bursts (and on Vercel they are
   often batched together), so writing each chunk straight to the
   screen looks like text popping in, not typing. The typewriter
   decouples the two: chunks only update a TARGET text, and a timer
   reveals it at a steady pace that speeds up when it falls behind
   (so it never lags far behind the real answer) and finishes
   quickly once the stream has ended. Every frame is rendered as
   proper Markdown + LaTeX, with the blinking cursor at the end.
   ========================================================= */

function placeTypingCursor(bubble) {
  const cursor =
    document.createElement("span");

  cursor.className = "typing-cursor";

  // Put the cursor at the end of the LAST line of text — inside
  // the final paragraph / list item — instead of on a line of its own.
  let host = bubble;

  while (host.lastElementChild) {
    const last = host.lastElementChild;

    if (
      last.matches(
        "pre, table, hr, img, svg, br, code, .katex, .katex-display, .math-fallback"
      )
    ) {
      break;
    }

    host = last;
  }

  host.appendChild(cursor);
}

function createTypewriter(bubble) {
  const state = {
    target: "",
    shown: 0,
    done: false,
    timer: null,
    lastTick: 0,
    lastPaint: 0,
    finishing: null
  };

  function paint(force) {
    const now = performance.now();

    // ~22 frames/sec is plenty for text and keeps long answers smooth.
    if (!force && now - state.lastPaint < 45) return;

    state.lastPaint = now;

    bubble.innerHTML =
      renderMarkdownSafe(
        state.target.slice(0, state.shown),
        { streaming: true }
      );

    placeTypingCursor(bubble);

    if (bubble.isConnected) {
      scrollToBottomIfFollowing();
    }
  }

  function schedule() {
    if (state.timer === null) {
      state.timer = setTimeout(tick, 30);
    }
  }

  function complete() {
    if (state.finishing) {
      const resolve = state.finishing;

      state.finishing = null;

      resolve();
    }
  }

  function tick() {
    state.timer = null;

    const now = performance.now();

    const dt =
      Math.min((now - state.lastTick) / 1000, 0.1);

    state.lastTick = now;

    const backlog =
      state.target.length - state.shown;

    if (backlog <= 0) {
      if (state.done) {
        // make sure the very last frame was actually painted
        if (state.shown > 0 && bubble.isConnected) {
          paint(true);
        }

        complete();
      } else {
        schedule();
      }

      return;
    }

    // Nobody is looking (another chat is open, or the tab is in the
    // background where timers are throttled): skip the animation
    // instead of dragging it out.
    if (!bubble.isConnected || document.hidden) {
      state.shown = state.target.length;

      if (state.done) {
        complete();
      } else {
        schedule();
      }

      return;
    }

    // Steady pace, faster when behind, quicker still once the
    // stream has ended (the whole tail lands in under ~2 seconds).
    let charsPerSecond =
      Math.min(2000, Math.max(100, backlog * 4));

    if (state.done) {
      charsPerSecond =
        Math.max(charsPerSecond, backlog / 1.8);
    }

    const step =
      Math.max(1, Math.round(charsPerSecond * dt));

    state.shown =
      Math.min(state.target.length, state.shown + step);

    // never stop between the two halves of an emoji / symbol
    const lastCode =
      state.target.charCodeAt(state.shown - 1);

    if (
      lastCode >= 0xd800 &&
      lastCode <= 0xdbff &&
      state.shown < state.target.length
    ) {
      state.shown++;
    }

    paint(false);

    if (
      state.done &&
      state.shown >= state.target.length
    ) {
      paint(true);

      complete();
    } else {
      schedule();
    }
  }

  return {
    // Called with the FULL text received so far, every time more arrives.
    update(fullText) {
      state.target = String(fullText || "");

      if (!state.lastTick) {
        state.lastTick = performance.now();
      }

      schedule();
    },

    // No more text is coming — resolves once everything is on screen.
    finish() {
      state.done = true;

      return new Promise(resolve => {
        state.finishing = resolve;

        schedule();

        // Safety net: never let a stuck timer hold a chat busy.
        setTimeout(() => {
          state.shown = state.target.length;

          complete();
        }, 10000);
      });
    },

    stop() {
      if (state.timer !== null) {
        clearTimeout(state.timer);

        state.timer = null;
      }

      complete();
    }
  };
}

// Follow the new text down the screen — but if the person has
// scrolled up to read something, leave them where they are.
function scrollToBottomIfFollowing() {
  const chatArea = $("chatArea");

  if (!chatArea) return;

  const distanceFromBottom =
    chatArea.scrollHeight -
    chatArea.scrollTop -
    chatArea.clientHeight;

  if (distanceFromBottom < 160) {
    scrollToBottom();
  }
}


/* =========================================================
   26d. CODE BLOCK TOOLBAR (Copy / Fullscreen)
   =========================================================
   Runs after markdown is rendered into a bubble — wraps every
   fenced code block with a small toolbar (Copy, Fullscreen),
   both SVG-only, matching the app's icon style elsewhere.
   ========================================================= */

function enhanceCodeBlocks(bubble) {
  if (!bubble) return;

  const blocks =
    bubble.querySelectorAll("pre");

  blocks.forEach(pre => {
    if (pre.dataset.enhanced === "true") return;

    pre.dataset.enhanced = "true";

    const codeEl = pre.querySelector("code");

    const codeText =
      codeEl ? codeEl.textContent : pre.textContent;

    const wrapper =
      document.createElement("div");

    wrapper.className = "code-block-wrapper";

    pre.parentNode.insertBefore(wrapper, pre);

    const toolbar =
      document.createElement("div");

    toolbar.className = "code-block-toolbar";

    const copyBtn =
      document.createElement("button");

    copyBtn.type = "button";
    copyBtn.className = "code-tool-btn";
    copyBtn.title = "Copy code";
    copyBtn.setAttribute("aria-label", "Copy code");
    copyBtn.innerHTML = ICONS.codeCopy;

    copyBtn.addEventListener("click", () => {
      copyText(codeText);
      showToast("Code copied");
    });

    const fullscreenBtn =
      document.createElement("button");

    fullscreenBtn.type = "button";
    fullscreenBtn.className = "code-tool-btn";
    fullscreenBtn.title = "Full window";
    fullscreenBtn.setAttribute("aria-label", "Full window");
    fullscreenBtn.innerHTML = ICONS.codeFullscreen;

    fullscreenBtn.addEventListener("click", () => {
      openCodeFullscreen(codeText);
    });

    toolbar.appendChild(copyBtn);
    toolbar.appendChild(fullscreenBtn);

    wrapper.appendChild(toolbar);
    wrapper.appendChild(pre);
  });
}

function openCodeFullscreen(codeText) {
  if (!codeFullscreenModal || !codeFullscreenContent) return;

  codeFullscreenContent.textContent = codeText || "";

  codeFullscreenModal.dataset.codeText = codeText || "";

  openModal(codeFullscreenModal);
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

  // Lets the "Saved in memory" chip find its message later.
  if (message.createdAt) {
    row.dataset.created = String(message.createdAt);
  }

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

  if (message.role === "assistant") {
    bubble.innerHTML =
      renderMarkdownSafe(message.content);

    enhanceCodeBlocks(bubble);

  } else {
    bubble.textContent =
      message.content || "";
  }

  wrapper.appendChild(bubble);

  renderSourcesList(
    wrapper,
    message.sources
  );

  // "Saved to memory" bar: shown inside the AI answer that replies
  // to a message which taught the AI something lasting. It is read
  // from the saved chat data, so it is permanent (survives reload,
  // regenerate and re-opening the chat).
  if (message.role === "assistant") {
    const ownerChat =
      getCurrentChat();

    const askedMessage =
      ownerChat && index > 0
        ? ownerChat.messages[index - 1]
        : null;

    if (
      askedMessage &&
      askedMessage.role === "user" &&
      Array.isArray(askedMessage.memorySaved) &&
      askedMessage.memorySaved.length
    ) {
      wrapper.appendChild(
        buildMemorySavedBar(
          askedMessage.memorySaved,
          askedMessage.memorySavedIds
        )
      );
    }
  }

  if (
    message.role ===
    "assistant"
  ) {
    const actions =
      document.createElement("div");

    actions.className =
      "message-actions";

    const likeButton =
      document.createElement("button");

    likeButton.type = "button";

    likeButton.className =
      "message-action message-feedback-inline" +
      (
        message.feedback === "like"
          ? " active-like"
          : ""
      );

    likeButton.title = "Like";
    likeButton.setAttribute("aria-label", "Like");
    likeButton.innerHTML = ICONS.thumbsUp;

    likeButton.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        setMessageFeedback(index, "like");
      }
    );

    actions.appendChild(likeButton);

    const dislikeButton =
      document.createElement("button");

    dislikeButton.type = "button";

    dislikeButton.className =
      "message-action message-feedback-inline" +
      (
        message.feedback === "dislike"
          ? " active-dislike"
          : ""
      );

    dislikeButton.title = "Dislike";
    dislikeButton.setAttribute("aria-label", "Dislike");
    dislikeButton.innerHTML = ICONS.thumbsDown;

    dislikeButton.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        setMessageFeedback(index, "dislike");
      }
    );

    actions.appendChild(dislikeButton);

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

    const moreButton =
      document.createElement("button");

    moreButton.className =
      "message-action message-more-btn";

    moreButton.type = "button";
    moreButton.title = "More options";
    moreButton.setAttribute(
      "aria-label",
      "More options"
    );

    moreButton.innerHTML =
      ICONS.moreDots;

    moreButton.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        toggleMessageMenu(
          index,
          message,
          bubble,
          actions,
          moreButton
        );
      }
    );

    actions.appendChild(
      moreButton
    );

    wrapper.appendChild(
      actions
    );

  } else if (
    isLastUserMessageIndex(getCurrentChat(), index)
  ) {

    const actions =
      document.createElement("div");

    actions.className =
      "message-actions";

    const editButton =
      document.createElement("button");

    editButton.className =
      "message-action";

    editButton.type = "button";

    editButton.innerHTML =
      "<span class='menu-icon'>" +
      ICONS.pencil +
      "</span><span>Edit</span>";

    editButton.addEventListener(
      "click",
      () => {
        startEditUserMessage(
          index,
          row,
          bubble,
          actions
        );
      }
    );

    actions.appendChild(
      editButton
    );

    wrapper.appendChild(
      actions
    );
  }

  row.appendChild(wrapper);

  messages.appendChild(row);
}


/* =========================================================
   27a. ONLY THE LAST MESSAGE CAN BE EDITED / REGENERATED
   =========================================================
   Editing or regenerating something in the middle of a chat
   would silently throw away every message after it, so both
   are limited to the end of the conversation:
     • Edit        -> the person's LAST message only
     • Regenerate  -> the AI's LAST reply only
   The buttons are hidden everywhere else, and the functions
   themselves refuse too (so it holds even if a stale button
   is somehow still on screen).
   ========================================================= */

function isLastUserMessageIndex(chat, index) {
  if (!chat || !chat.messages[index]) return false;

  if (chat.messages[index].role !== "user") return false;

  return !chat.messages
    .slice(index + 1)
    .some(m => m.role === "user");
}

function isLastReplyIndex(chat, index) {
  return (
    !!chat &&
    index === chat.messages.length - 1 &&
    !!chat.messages[index] &&
    chat.messages[index].role === "assistant"
  );
}

// After a new message arrives, older user messages lose their
// Edit button (only the newest keeps it).
function refreshMessageActionAvailability() {
  if (!messages) return;

  const userRows =
    messages.querySelectorAll(".message-row.user");

  userRows.forEach((userRow, position) => {
    if (position < userRows.length - 1) {
      const actions =
        userRow.querySelector(".message-actions");

      if (actions) actions.remove();
    }
  });

  closeAllMessageMenus();
}


/* =========================================================
   27b. ASSISTANT MESSAGE MENU
   =========================================================  
   The "⋯" button below an AI reply — Like / Dislike / Select
   text / Regenerate.
   ========================================================= */

function closeAllMessageMenus() {
  document
    .querySelectorAll(".message-menu-popup")
    .forEach(popup => popup.remove());

  document
    .querySelectorAll(".message-more-btn.open")
    .forEach(button => button.classList.remove("open"));
}

document.addEventListener("click", closeAllMessageMenus);

function toggleMessageMenu(
  index,
  message,
  bubble,
  actionsContainer,
  menuButton
) {
  const alreadyOpen =
    menuButton.classList.contains("open");

  closeAllMessageMenus();

  if (alreadyOpen) return;

  menuButton.classList.add("open");

  const popup =
    document.createElement("div");

  popup.className = "message-menu-popup";

  // --- Select text ---

  const selectBtn =
    document.createElement("button");

  selectBtn.type = "button";

  selectBtn.innerHTML =
    "<span class='menu-icon'>" +
    ICONS.selectText +
    "</span><span>Select text</span>";

  selectBtn.addEventListener(
    "click",
    event => {
      event.stopPropagation();

      closeAllMessageMenus();

      openSelectTextModal(message.content);
    }
  );

  popup.appendChild(selectBtn);

  // --- Regenerate (last reply only) ---

  if (isLastReplyIndex(getCurrentChat(), index)) {

    const regenerateBtn =
      document.createElement("button");

    regenerateBtn.type = "button";

    regenerateBtn.innerHTML =
      "<span class='menu-icon'>" +
      ICONS.regenerate +
      "</span><span>Regenerate</span>";

    regenerateBtn.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        closeAllMessageMenus();

        regenerateResponse(index);
      }
    );

    popup.appendChild(regenerateBtn);
  }

  actionsContainer.appendChild(popup);
}

function setMessageFeedback(index, value) {
  const chat =
    getCurrentChat();

  if (!chat) return;

  const message =
    chat.messages[index];

  if (!message) return;

  // Tapping the same feedback again clears it (toggle).
  message.feedback =
    message.feedback === value
      ? null
      : value;

  chat.updatedAt = Date.now();

  saveGuestChats();

  if (!isGuest && currentUser) {
    saveChatToFirestore(chat);
  }

  renderCurrentChat();

  showToast(
    message.feedback === "like"
      ? "Marked as liked"
      : message.feedback === "dislike"
        ? "Marked as disliked"
        : "Feedback removed"
  );
}

function openSelectTextModal(content) {
  if (!selectTextModal || !selectTextArea) return;

  selectTextArea.value = content || "";

  openModal(selectTextModal);

  // Auto-select all on open so a single tap on the copy
  // gesture (or Ctrl/Cmd+A on a hooked-up keyboard) works
  // immediately without an extra manual selection step.
  setTimeout(() => {
    selectTextArea.focus();
    selectTextArea.setSelectionRange(
      0,
      selectTextArea.value.length
    );
  }, 50);
}

async function regenerateResponse(index) {
  if (isChatGenerating()) return;

  const chat =
    getCurrentChat();

  if (!chat) return;

  // Only the AI's last reply can be regenerated.
  if (!isLastReplyIndex(chat, index)) return;

  // Find the user message this reply was answering.
  let userText = null;

  for (let i = index - 1; i >= 0; i--) {
    if (chat.messages[i].role === "user") {
      userText = chat.messages[i].content;
      break;
    }
  }

  if (userText === null) return;

  // Drop this reply and anything after it — a fresh one takes
  // its place, same as editing a user message further up.
  chat.messages =
    chat.messages.slice(0, index);

  chat.updatedAt = Date.now();

  saveGuestChats();

  renderChatList();
  renderCurrentChat();

  await generateAndAppendAssistantReply(
    userText,
    { skipCache: true, chatId: chat.id }
  );
}


/* =========================================================
   27c. EDIT USER MESSAGE
   ========================================================= */

function startEditUserMessage(
  index,
  row,
  bubble,
  actions
) {
  if (isChatGenerating()) return;

  const chat =
    getCurrentChat();

  if (!chat) return;

  const message =
    chat.messages[index];

  if (!message) return;

  // Only the person's last message can be edited.
  if (!isLastUserMessageIndex(chat, index)) return;

  const wrapper =
    row.querySelector(".message-wrapper");

  if (!wrapper) return;

  const editBox =
    document.createElement("div");

  editBox.className = "edit-box";

  const textarea =
    document.createElement("textarea");

  textarea.value = message.content || "";

  const editActions =
    document.createElement("div");

  editActions.className = "edit-actions";

  const cancelBtn =
    document.createElement("button");

  cancelBtn.type = "button";
  cancelBtn.className = "small-btn";
  cancelBtn.textContent = "Cancel";

  cancelBtn.addEventListener(
    "click",
    () => {
      editBox.remove();

      bubble.style.display = "";
      actions.style.display = "";
    }
  );

  const saveBtn =
    document.createElement("button");

  saveBtn.type = "button";
  saveBtn.className = "small-btn primary";
  saveBtn.textContent = "Save & Submit";

  saveBtn.addEventListener(
    "click",
    () => {
      const newText =
        textarea.value.trim();

      if (!newText) return;

      submitEditedMessage(index, newText);
    }
  );

  editActions.appendChild(cancelBtn);
  editActions.appendChild(saveBtn);

  editBox.appendChild(textarea);
  editBox.appendChild(editActions);

  bubble.style.display = "none";
  actions.style.display = "none";

  wrapper.insertBefore(
    editBox,
    actions
  );

  textarea.focus();

  textarea.selectionStart =
    textarea.value.length;

  textarea.style.height = "auto";
  textarea.style.height =
    textarea.scrollHeight + "px";
}

async function submitEditedMessage(index, newText) {
  if (isChatGenerating()) return;

  const chat =
    getCurrentChat();

  if (!chat) return;

  // Only the person's last message can be edited.
  if (!isLastUserMessageIndex(chat, index)) return;

  // Editing a message replaces the conversation from this point
  // on — this message plus anything after it (including the old
  // AI reply) is dropped, then re-sent as if freshly typed.
  chat.messages =
    chat.messages.slice(0, index);

  chat.updatedAt = Date.now();

  saveGuestChats();

  renderChatList();
  renderCurrentChat();

  messageInput.value = newText;

  autoResizeTextarea();

  await sendMessage();
}


/* =========================================================
   28. ADD MESSAGE
   ========================================================= */

async function addMessage(
  role,
  content,
  sources,
  chatId
) {
  // A reply is always filed under the chat it was ASKED in (looked up
  // by id right now) — not whichever chat happens to be open when the
  // answer finally arrives.
  const chat =
    chatId
      ? findChatById(chatId)
      : getCurrentChat();

  // Chat was deleted / account switched while the reply was being
  // generated — drop the reply instead of resurrecting the chat.
  if (!chat) return;

  const message = {
    role,
    content,
    sources: Array.isArray(sources) ? sources : [],
    createdAt: Date.now()
  };

  chat.messages.push(message);

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

  // Only touch the screen if this chat is the one being looked at.
  // (Otherwise the message is simply there when the person opens it.)
  if (chat.id === currentChatId) {
    appendMessageIncremental(
      message,
      chat.messages.length - 1
    );
  }

  // Cloud save runs in the background and is deliberately NOT
  // awaited: Firestore only resolves a write once the server confirms
  // it, so on a slow or dropped connection awaiting it here would
  // keep the chat "busy" (Send disabled) until the network came back.
  // Firestore queues the write and retries on its own.
  if (
    !isGuest &&
    currentUser &&
    !chat.incognito
  ) {
    saveChatToFirestore(
      chat
    );
  }
}


/* =========================================================
   28b. APPEND MESSAGE INCREMENTALLY
   =========================================================
   Adds just the one new message to the DOM instead of wiping
   and re-rendering the whole thread on every send — keeps
   long chats and big messages (code/poems/stories) fast and
   avoids any flash/rebuild jank. Also removes the temporary
   typewriter-reveal row for assistant replies so the final
   persisted message replaces it cleanly instead of stacking.
   ========================================================= */

function appendMessageIncremental(message, index) {
  if (!messages) return;

  if (welcome) {
    welcome.classList.add("hidden");
  }

  const tempReveal =
    document.getElementById("assistantRevealTemp");

  if (tempReveal) {
    tempReveal.remove();
  }

  renderMessage(message, index);

  // A newer message now exists: older ones lose their Edit button.
  refreshMessageActionAvailability();

  scrollToBottom();
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
  // Only blocks when THIS chat is still replying — another chat's
  // slow answer never stops you from sending here.
  if (isChatGenerating()) return;

  const text =
    messageInput.value.trim();

  if (!text) return;

  if (!getCurrentChat()) {
    createNewChat(false);
  }

  const chat =
    getCurrentChat();

  // Couldn't create one (e.g. the chat limit) — keep the typed text.
  if (!chat) return;

  const chatId = chat.id;

  messageInput.value = "";

  autoResizeTextarea();

  await addMessage(
    "user",
    text,
    [],
    chatId
  );

  // Runs in the background, alongside the AI reply: pulls lasting
  // facts out of this message and saves them to Memory.
  const savedMessage =
    findChatById(chatId)?.messages.at(-1);

  learnFromUserMessage(
    text,
    chatId,
    savedMessage ? savedMessage.createdAt : null
  );

  await generateAndAppendAssistantReply(
    text,
    { chatId }
  );
}


/* =========================================================
   30a. GENERATE + APPEND ASSISTANT REPLY
   =========================================================
   Shared by sendMessage() and Regenerate — runs the real AI
   (search + streaming), falls back to the local demo engine
   if the backend is unreachable, and persists the result.
   ========================================================= */

async function generateAndAppendAssistantReply(
  userText,
  options
) {
  const skipCache =
    !!(options && options.skipCache);

  const originChat =
    (options && options.chatId
      ? findChatById(options.chatId)
      : null) || getCurrentChat();

  if (!originChat) return;

  // Everything below is tied to THIS chat's id, so the reply lands
  // in the right place even if the person opens another chat (or
  // starts a new one) while it is still being generated.
  const chatId = originChat.id;

  if (generatingChatIds.has(chatId)) return;

  generatingChatIds.add(chatId);

  updateSendButtonState();

  try {

    let result = null;

    // --- 1. Shared learned-answer cache (skipped on Regenerate,
    //        so a fresh real answer can be generated and relearned) ---

    if (!skipCache) {
      const cached =
        await checkLearnedAnswer(userText);

      if (cached) {
        result =
          await revealCachedAnswer(cached, chatId);
      }
    }

    // --- 2. Real AI: math / knowledge.json / web search + Groq,
    //        via /api/chat, streamed live ---

    if (!result) {

      try {
        result =
          await streamAssistantMessage(
            userText,
            chatId
          );

        // Only the genuinely web-searched answers are worth
        // caching — math and knowledge.json answers are already
        // instant and local, re-caching them adds nothing.
        // The cache is shared by EVERY user, so an answer that was
        // written while the person's own memory/facts were in play
        // (it may mention them) is never stored there.
        if (result.usedSearch && !hasPersonalContext()) {
          saveLearnedAnswer(
            userText,
            result.text,
            result.sources
          );
        }

      } catch (apiError) {

        console.error(
          "AI backend error:",
          apiError
        );

        if (apiError && apiError.isOffline) {

          result = {
            text:
              "📶 No internet connection. Please check your " +
              "connection and try again.",
            sources: [],
            usedSearch: false
          };

        } else {

          // Backend hiccup (not a connectivity issue) — fall
          // back to the local demo engine rather than a dead
          // end. The temp reveal row from streamAssistantMessage
          // (if any) gets replaced cleanly by addMessage()'s
          // incremental append either way.
          const fallbackText =
            await generateLocalResponse(
              userText
            );

          result = {
            text: fallbackText,
            sources: [],
            usedSearch: false
          };
        }
      }
    }

    await addMessage(
      "assistant",
      result.text,
      result.sources,
      chatId
    );

  } catch (error) {

    console.error(
      "AI response error:",
      error
    );

    const errorMessage =
      "Sorry, something went wrong while generating the response.";

    await addMessage(
      "assistant",
      errorMessage,
      [],
      chatId
    );

  } finally {

    // If the chat was deleted, the reply was dropped and the live
    // row may still be on screen — clear it.
    const leftover =
      pendingReplyRows.get(chatId);

    if (leftover && leftover.row && leftover.row.isConnected) {
      leftover.row.remove();
    }

    pendingReplyRows.delete(chatId);

    generatingChatIds.delete(chatId);

    // Re-enables Send only if the chat on screen is not busy.
    updateSendButtonState();

    // Don't pop the keyboard up in a different chat.
    if (currentChatId === chatId && messageInput) {
      messageInput.focus();
    }
  }
}


/* =========================================================
   30a2. REVEAL A CACHED (already-learned) ANSWER
   =========================================================
   Shows the same pending row as a real request, briefly in
   "Thinking" state (since nothing is actually being searched —
   this is a local/cached answer), then reveals the saved
   answer and its original sources.
   ========================================================= */

async function revealCachedAnswer(cached, chatId) {
  const elements =
    createAssistantRow(chatId);

  setAssistantRowStatus(
    elements,
    "Thinking"
  );

  await delay(450);

  activateAssistantRowAvatar(elements);

  elements.bubble.className = "message";

  elements.bubble.textContent = "";

  // Learned answers are typed out exactly like live ones.
  const typewriter =
    createTypewriter(elements.bubble);

  typewriter.update(cached.text);

  await typewriter.finish();

  elements.bubble.innerHTML =
    renderMarkdownSafe(cached.text);

  enhanceCodeBlocks(elements.bubble);

  renderSourcesList(
    elements.wrapper,
    cached.sources
  );

  if (elements.row.isConnected) {
    scrollToBottomIfFollowing();
  }

  return {
    text: cached.text,
    sources: cached.sources,
    usedSearch: false
  };
}


/* =========================================================
   30b. MEMORY-AWARE RESPONSE HELPERS
   =========================================================
   Instead of dumping every saved memory item into every
   reply, this extracts specific facts ("name", "favorite
   food", "favorite song", etc.) from BOTH explicit Memory
   entries AND the user's own past chat messages, then only
   answers with a fact when the question actually asks for
   that specific thing.
   ========================================================= */

const FAVORITE_FACT_REGEX =
  /my\s+favou?rite\s+([a-z][a-z\s]{0,25}?)\s+is\s+([^.,!?\n]{1,60})/gi;

const NAME_FACT_REGEX =
  /(?:my name is|call me|i'm|i am)\s+([a-zA-Z]+)/i;

function extractFactsFromText(rawText) {
  const facts = {};

  const text = String(rawText || "");

  if (!text) return facts;

  const nameMatch =
    text.match(NAME_FACT_REGEX);

  if (nameMatch && nameMatch[1]) {
    facts.name =
      nameMatch[1].charAt(0).toUpperCase() +
      nameMatch[1].slice(1).toLowerCase();
  }

  // Reset lastIndex since this is a shared global-flag regex.
  FAVORITE_FACT_REGEX.lastIndex = 0;

  let match;

  while (
    (match = FAVORITE_FACT_REGEX.exec(text)) !== null
  ) {
    const key =
      match[1]
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    const value =
      match[2]
        .trim()
        .replace(/\s+/g, " ");

    if (key && value) {
      facts[`favorite:${key}`] = value;
    }
  }

  return facts;
}

function getKnownFacts() {
  const facts = {};

  // 1) Facts mentioned anywhere in the user's own past chat
  //    messages, oldest first, so a more recent mention of
  //    the same fact naturally overrides an older one.
  const userMessages = [];

  chats.forEach(chat => {
    (chat.messages || []).forEach(message => {
      if (message.role === "user") {
        userMessages.push(message);
      }
    });
  });

  userMessages
    .sort(
      (a, b) =>
        (a.createdAt || 0) - (b.createdAt || 0)
    )
    .forEach(message => {
      Object.assign(
        facts,
        extractFactsFromText(message.content)
      );
    });

  // 2) Explicit Settings → Memory entries are the most
  //    deliberate signal, so they're applied last and win
  //    over anything only inferred from casual chat.
  if (memoryEnabled) {
    memoryItems
      .slice()
      .sort(
        (a, b) =>
          (a.createdAt || 0) - (b.createdAt || 0)
      )
      .forEach(entry => {
        Object.assign(
          facts,
          extractFactsFromText(entry.text)
        );
      });
  }

  return facts;
}

function findFavoriteQuestionKey(text) {
  const cleaned =
    text.trim().replace(/[?!.]+$/, "");

  const match =
    cleaned.match(
      /what(?:'s| is|s)?\s+my\s+favou?rite\s+([a-z][a-z\s]*)/i
    );

  if (!match || !match[1]) return null;

  return (
    match[1]
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
  );
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

  const facts =
    getKnownFacts();

  // --- Specific "what is my favorite X" questions ---
  // Only answers when the exact attribute asked about is
  // actually known — never surfaces unrelated saved facts.

  const favoriteKey =
    findFavoriteQuestionKey(input);

  if (favoriteKey) {
    const value =
      facts[`favorite:${favoriteKey}`];

    if (value) {
      return `Your favourite ${favoriteKey} is ${value}.`;
    }

    return (
      `You haven't told me your favourite ${favoriteKey} yet. ` +
      "Mention it in a message, or add it in Settings → Manage memory, " +
      "and I'll remember it from then on."
    );
  }

  // --- "What do you remember about me?" — full recall ---

  if (
    text.includes("remember about me") ||
    text.includes("what do you know about me") ||
    text.includes("what do you remember") ||
    text.includes("do you remember")
  ) {
    const savedLines =
      memoryEnabled && memoryItems.length
        ? memoryItems.map(entry => `• ${entry.text}`)
        : [];

    const learnedLines =
      Object.keys(facts)
        .filter(key => key.startsWith("favorite:"))
        .map(
          key =>
            `• Your favourite ${key.replace("favorite:", "")} is ${facts[key]}`
        );

    if (!savedLines.length && !learnedLines.length) {
      return (
        "I don't have anything saved about you yet. " +
        "Add something in Settings → Manage memory, or just mention it in chat " +
        "(e.g. \"my favourite food is paneer\") and I'll remember it."
      );
    }

    let reply = "";

    if (savedLines.length) {
      reply +=
        "From Settings → Memory:\n" +
        savedLines.join("\n");
    }

    if (learnedLines.length) {
      if (reply) reply += "\n\n";

      reply +=
        "From our conversations:\n" +
        learnedLines.join("\n");
    }

    return reply;
  }

  const rememberedName =
    facts.name || null;

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return (
      `Hello${rememberedName ? ", " + rememberedName : ""}! 👋\n\n` +
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
      "I'm Hare Krishna AI 2.5 — your personal AI assistant interface.\n\n" +
      "I use GROQ as AI provider and TAVILY as Serch provider to perform websearches, " +
      "The Firebase part handles authentication and saving your chats. When you're logged in. "
    );
  }

  return (
    "I received your message:\n\n" +
    `"${input}"\n\n` +
    "GROQ and TAVILY our search and AI providers are not responding or it is any tacnicall bug, try again and if the problem continues try consomer service. "
  );
}


/* =========================================================
   31b. STREAMING AI RESPONSE (/api/chat — Tavily + Groq)
   =========================================================
   Creates the assistant's message row, then streams the real
   answer into it token-by-token as it arrives from the
   serverless function. Returns { text, sources } once the
   stream ends, so sendMessage() can persist the final result
   via addMessage() — appendMessageIncremental() then swaps
   this temporary row out for the persisted one automatically
   (matched by the "assistantRevealTemp" id).
   ========================================================= */

function getRecentHistoryForApi(chatId) {
  const chat =
    chatId
      ? findChatById(chatId)
      : getCurrentChat();

  if (!chat || !Array.isArray(chat.messages)) {
    return [];
  }

  return chat.messages
    .slice(-10)
    .map(m => ({
      role: m.role,
      content: m.content
    }));
}


/* =========================================================
   31c. UNIFIED ASSISTANT ROW
   =========================================================
   One row handles the whole lifecycle of a reply: it starts
   showing just a status label ("Searching the web" / "Thinking")
   with no avatar, then once real content is ready to show, the
   avatar appears and the bubble switches over to it. This avoids
   the old two-row swap (separate typing indicator + separate
   reveal row) in favor of one continuous element.
   ========================================================= */

function createAssistantRow(chatId) {
  const ownerChatId =
    chatId || currentChatId;

  const row =
    document.createElement("div");

  row.id = "assistantRevealTemp";

  row.className = "message-row assistant no-avatar";

  const avatar =
    document.createElement("div");

  avatar.className = "avatar";
  avatar.textContent = "✦";

  const wrapper =
    document.createElement("div");

  wrapper.className = "message-wrapper";

  const bubble =
    document.createElement("div");

  bubble.className = "message status-message";

  wrapper.appendChild(bubble);

  row.appendChild(avatar);
  row.appendChild(wrapper);

  const elements = { row, wrapper, bubble };

  // Remembered per chat, so the row can be put back if the thread
  // is re-rendered or the person returns to this chat mid-reply.
  if (ownerChatId) {
    pendingReplyRows.set(ownerChatId, elements);
  }

  // Only shown on screen if that chat is the one being looked at.
  if (ownerChatId === currentChatId) {
    if (welcome) {
      welcome.classList.add("hidden");
    }

    messages.appendChild(row);

    scrollToBottom();
  }

  return elements;
}

function setAssistantRowStatus(elements, label) {
  const { bubble } = elements;

  bubble.className = "message status-message";

  bubble.innerHTML = "";

  if (label === "Searching the web") {
    const globe =
      document.createElement("span");

    globe.className = "status-globe-icon";
    globe.innerHTML = ICONS.globe;

    bubble.appendChild(globe);
  }

  const labelSpan =
    document.createElement("span");

  labelSpan.className = "typing-label";
  labelSpan.textContent = label;

  const dots =
    document.createElement("span");

  dots.className = "typing-dots";

  dots.innerHTML =
    "<span class='dot'></span>" +
    "<span class='dot'></span>" +
    "<span class='dot'></span>";

  bubble.appendChild(labelSpan);
  bubble.appendChild(dots);
}

function activateAssistantRowAvatar(elements) {
  elements.row.classList.remove("no-avatar");
}


/* =========================================================
   31d. LOCAL Q&A LEARNING CACHE
   =========================================================
   Every time the AI answers a question via a real web search,
   the finished answer is saved here, keyed by the (normalized)
   question. Next time anyone asks the same thing, the app
   serves this saved answer instantly — no web search needed.
   Regenerate always bypasses this and re-learns a fresh answer.
   ========================================================= */

let qaCache = {};

function normalizeQuestionKey(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/g, "")
    .replace(/\s+/g, " ");
}

function getCachedAnswer(userText) {
  const key = normalizeQuestionKey(userText);

  if (!key) return null;

  return qaCache[key] || null;
}

function saveCachedAnswer(userText, result) {
  const key = normalizeQuestionKey(userText);

  if (!key || !result || !result.text) return;

  qaCache[key] = {
    answer: result.text,
    sources: Array.isArray(result.sources) ? result.sources : [],
    savedAt: Date.now()
  };

  persistQACache();
}

function persistQACache() {
  if (!isGuest && currentUser) {
    saveQACacheToFirestore();
  } else {
    saveQACacheLocal();
  }
}

function saveQACacheLocal() {
  try {
    localStorage.setItem(
      "hareKrishnaQACache",
      JSON.stringify(qaCache)
    );

  } catch (error) {
    console.error("QA cache save error:", error);
  }
}

function loadQACacheLocal() {
  try {
    const saved =
      localStorage.getItem("hareKrishnaQACache");

    qaCache =
      saved ? JSON.parse(saved) : {};

  } catch (error) {
    console.error("QA cache load error:", error);
    qaCache = {};
  }
}

async function saveQACacheToFirestore() {
  if (!db || !currentUser) return;

  try {
    await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("settings")
      .doc("qaCache")
      .set(
        {
          entries: qaCache,
          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

  } catch (error) {
    console.error("QA cache save error:", error);
  }
}

async function loadQACacheFromFirestore() {
  if (!db || !currentUser) return;

  try {
    const doc =
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("settings")
        .doc("qaCache")
        .get();

    qaCache =
      doc.exists && doc.data().entries
        ? doc.data().entries
        : {};

  } catch (error) {
    console.error("QA cache load error:", error);
  }
}

async function serveCachedAnswer(cached) {
  const elements = createAssistantRow();

  setAssistantRowStatus(elements, "Thinking");

  // A short, deliberate pause — this is an instant local lookup,
  // but appearing completely instant reads as broken rather than
  // fast, so it briefly shows the "Thinking" state first.
  await delay(500);

  activateAssistantRowAvatar(elements);

  elements.bubble.className = "message";

  elements.bubble.innerHTML =
    renderMarkdownSafe(cached.answer);

  enhanceCodeBlocks(elements.bubble);

  renderSourcesList(elements.wrapper, cached.sources);

  scrollToBottom();

  return {
    text: cached.answer,
    sources: cached.sources || []
  };
}

function isLikelyOffline() {
  return (
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  );
}

function makeOfflineError() {
  const error =
    new Error("No internet connection");

  error.isOffline = true;

  return error;
}

const SLOW_RESPONSE_MS = 9000;

async function streamAssistantMessage(userText, chatId) {
  if (!messages) {
    return { text: "", sources: [], usedSearch: false };
  }

  const elements = createAssistantRow(chatId);

  // Reasonable default until the server tells us which is
  // actually true — flipped to "Thinking" below if the server
  // answers from knowledge.json/math instead of a real search.
  setAssistantRowStatus(elements, "Searching the web");

  if (isLikelyOffline()) {
    setAssistantRowStatus(elements, "No internet connection");

    throw makeOfflineError();
  }

  // Reassures the person instead of leaving a stuck-looking
  // "Searching the web..." on screen if this is taking a while.
  let watchdogFired = false;

  const watchdogTimer =
    setTimeout(() => {
      watchdogFired = true;

      setAssistantRowStatus(
        elements,
        "Taking longer than usual, trying again shortly"
      );
    }, SLOW_RESPONSE_MS);

  // Hard safety limit — just under the server function's own
  // 60s maxDuration (see vercel.json). Without this, a hung
  // request (dropped connection, server killed mid-stream, etc.)
  // would never resolve OR reject, leaving the chat stuck "busy"
  // true forever and silently blocking every future send/edit/
  // regenerate action app-wide. This guarantees the request
  // always eventually settles one way or another.
  const HARD_TIMEOUT_MS = 55000;

  const abortController =
    typeof AbortController !== "undefined"
      ? new AbortController()
      : null;

  const hardTimeoutTimer =
    abortController
      ? setTimeout(
          () => abortController.abort(),
          HARD_TIMEOUT_MS
        )
      : null;

  function clearAllTimers() {
    clearTimeout(watchdogTimer);

    if (hardTimeoutTimer) {
      clearTimeout(hardTimeoutTimer);
    }
  }

  let response;

  try {
    response =
      await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userText,
          history: getRecentHistoryForApi(chatId),
          facts: getKnownFacts(),
          memory: getMemoryForApi()
        }),
        signal:
          abortController
            ? abortController.signal
            : undefined
      });

  } catch (networkError) {
    clearAllTimers();

    if (
      networkError &&
      networkError.name === "AbortError"
    ) {
      setAssistantRowStatus(
        elements,
        "Taking longer than usual, trying again shortly"
      );

      throw new Error(
        "Request timed out after " +
        (HARD_TIMEOUT_MS / 1000) +
        "s"
      );
    }

    if (isLikelyOffline()) {
      setAssistantRowStatus(elements, "No internet connection");

      throw makeOfflineError();
    }

    throw networkError;
  }

  if (!response.ok || !response.body) {
    clearAllTimers();

    // FIX: previously this discarded the server's actual error
    // message and threw only the HTTP status code, so the browser
    // console never showed *why* the call failed (Groq timeout,
    // missing API key, Tavily error, etc.) — the only place that
    // reason existed was the Vercel server logs. Reading the JSON
    // error body here (when the server sent one) surfaces the real
    // reason in the console, right next to "AI backend error:",
    // without changing what the user sees (they still get the
    // local fallback reply either way).
    let detail = "";

    try {
      const errorBody = await response.json();

      if (errorBody && errorBody.error) {
        detail = " — " + errorBody.error;
      }
    } catch {
      // Response wasn't JSON (e.g. a mid-stream plain-text failure)
      // — fall back to just the status code, no detail to add.
    }

    throw new Error(
      "AI request failed with status " + response.status + detail
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  // The stream starts with two JSON meta lines — "status" then
  // "sources" — before any actual answer text.
  const EXPECTED_META_LINES = 2;

  let buffer = "";
  let metaLinesConsumed = 0;
  let fullText = "";
  let sources = [];
  let usedSearch = false;
  let firstChunkArrived = false;
  let typewriter = null;

  try {

    while (true) {
      const { done, value } =
        await reader.read();

      if (done) break;

      buffer +=
        decoder.decode(value, { stream: true });

      while (
        metaLinesConsumed < EXPECTED_META_LINES
      ) {
        const newlineIndex =
          buffer.indexOf("\n");

        if (newlineIndex === -1) break;

        const metaLine =
          buffer.slice(0, newlineIndex);

        buffer =
          buffer.slice(newlineIndex + 1);

        metaLinesConsumed++;

        try {
          const meta =
            JSON.parse(metaLine);

          if (meta && meta.type === "status") {
            usedSearch = !!meta.searching;

            // Don't stomp on the watchdog's reassurance message
            // if it already fired while we were waiting.
            if (!watchdogFired) {
              setAssistantRowStatus(
                elements,
                usedSearch ? "Searching the web" : "Thinking"
              );
            }
          }

          if (meta && meta.type === "sources") {
            sources = meta.sources || [];
          }

        } catch {
          // Ignore a malformed meta line and keep going.
        }
      }

      if (
        metaLinesConsumed >= EXPECTED_META_LINES &&
        buffer
      ) {
        fullText += buffer;

        buffer = "";

        if (!firstChunkArrived) {
          firstChunkArrived = true;

          clearAllTimers();

          activateAssistantRowAvatar(elements);

          elements.bubble.className = "message";
          elements.bubble.textContent = "";

          typewriter =
            createTypewriter(elements.bubble);
        }

        // The network delivers text in uneven bursts; the typewriter
        // reveals it at a steady, natural pace (see 26c-2).
        typewriter.update(fullText);
      }
    }

  } catch (streamError) {

    clearAllTimers();

    if (typewriter) {
      typewriter.stop();
    }

    if (
      streamError &&
      streamError.name === "AbortError"
    ) {
      setAssistantRowStatus(
        elements,
        "Taking longer than usual, trying again shortly"
      );

      throw new Error(
        "Request timed out after " +
        (HARD_TIMEOUT_MS / 1000) +
        "s"
      );
    }

    if (isLikelyOffline()) {
      setAssistantRowStatus(elements, "No internet connection");

      throw makeOfflineError();
    }

    throw streamError;

  } finally {
    clearAllTimers();
  }

  // Let the typing animation catch up with everything received.
  if (typewriter) {
    typewriter.update(fullText);

    await typewriter.finish();
  }

  if (!firstChunkArrived) {
    activateAssistantRowAvatar(elements);
    elements.bubble.className = "message";
  }

  if (!fullText.trim()) {
    fullText =
      "Sorry, I couldn't generate a response just now. Please try again.";
  }

  // Plain text while streaming (fast, no flicker on partial
  // markdown like an unclosed "**"); switch to fully rendered
  // markdown now that the complete answer is in.
  elements.bubble.innerHTML =
    renderMarkdownSafe(fullText);

  enhanceCodeBlocks(elements.bubble);

  renderSourcesList(elements.wrapper, sources);

  if (elements.row.isConnected) {
    scrollToBottomIfFollowing();
  }

  return { text: fullText, sources, usedSearch };
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

  const now = Date.now();

  const toDelete = chats.slice();

  toDelete.forEach(chat => {
    deletedChats.unshift({
      id: chat.id,
      title: chat.title,
      messages: chat.messages,
      createdAt: chat.createdAt,
      deletedAt: now
    });
  });

  chats = [];
  currentChatId = null;

  saveGuestChats();
  saveGuestDeletedChats();

  renderChatList();
  renderCurrentChat();
  renderBinList();

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

      await Promise.all(
        toDelete.map(chat =>
          saveDeletedChatToFirestore({
            id: chat.id,
            title: chat.title,
            messages: chat.messages,
            createdAt: chat.createdAt,
            deletedAt: now
          })
        )
      );

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

    // This was the actual bug: signing out never cleared the
    // guest flag, so if someone had ever used Guest mode before,
    // that stale flag could stick around and interfere with a
    // later real sign-in.
    localStorage.removeItem(
      "hareKrishnaGuest"
    );

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
   42a. DELETE ACCOUNT (permanent, Firebase Auth + Firestore)
   =========================================================
   Wipes the signed-in user's data out of Firestore (chats,
   deletedChats/bin, settings/memory, the users/{uid} doc
   itself), then deletes the Firebase Auth account. Firebase
   requires a "recent" login for this — if the session is
   stale, auth.currentUser.delete() throws
   "auth/requires-recent-login" and we ask the person to sign
   in again before retrying, rather than silently failing.
   ========================================================= */

async function deleteUserFirestoreData(uid) {
  if (!db || !uid) return;

  const userRef = db
    .collection("users")
    .doc(uid);

  const subcollections = [
    "chats",
    "deletedChats"
  ];

  for (const name of subcollections) {
    const snapshot =
      await userRef
        .collection(name)
        .get();

    const batchDeletes = snapshot.docs.map(
      doc => doc.ref.delete()
    );

    await Promise.all(batchDeletes);
  }

  await userRef
    .collection("settings")
    .doc("memory")
    .delete()
    .catch(() => {});

  await userRef.delete();
}

async function deleteAccountPermanently() {
  if (!firebaseReady || !auth) {
    showToast("Firebase is not configured.");
    return;
  }

  if (isGuest || !currentUser) {
    showToast("You're not logged in.");
    return;
  }

  const uid = currentUser.uid;

  if (deleteAccountConfirmBtn) {
    deleteAccountConfirmBtn.disabled = true;
  }

  try {
    if (unsubscribeChats) {
      unsubscribeChats();
      unsubscribeChats = null;
    }

    await deleteUserFirestoreData(uid);

    await auth.currentUser.delete();

    currentUser = null;
    isGuest = false;

    localStorage.removeItem("hareKrishnaGuest");

    chats = [];
    currentChatId = null;
    deletedChats = [];
    memoryItems = [];
    memoryEnabled = true;

    showAuthScreen();

    setAuthMessage("");

    showToast("Your account has been permanently deleted");

  } catch (error) {

    console.error(
      "Delete account error:",
      error
    );

    showToast(
      getAuthErrorMessage(error)
    );

    if (error && error.code === "auth/requires-recent-login") {
      await logout();
    }

  } finally {
    if (deleteAccountConfirmBtn) {
      deleteAccountConfirmBtn.disabled = false;
    }
  }
}


/* =========================================================
   43. THEME
   =========================================================
   Three modes: "system" (follows the device's own light/dark
   setting and updates live if it changes), "light", "dark".
   ========================================================= */

let currentThemeMode = "system";

const systemDarkQuery =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

function applyThemeMode(mode) {
  const effectiveDark =
    mode === "dark" ||
    (
      mode === "system" &&
      systemDarkQuery &&
      systemDarkQuery.matches
    );

  document.body.classList.toggle(
    "dark",
    effectiveDark
  );
}

function loadTheme() {
  const saved =
    localStorage.getItem("hareKrishnaThemeMode");

  currentThemeMode =
    (saved === "light" || saved === "dark" || saved === "system")
      ? saved
      : "system";

  applyThemeMode(currentThemeMode);

  updateThemeSettingsUI();

  if (systemDarkQuery && systemDarkQuery.addEventListener) {
    systemDarkQuery.addEventListener("change", () => {
      if (currentThemeMode === "system") {
        applyThemeMode("system");
      }
    });
  }
}

function setThemeMode(mode) {
  if (
    mode !== "system" &&
    mode !== "light" &&
    mode !== "dark"
  ) {
    return;
  }

  currentThemeMode = mode;

  localStorage.setItem(
    "hareKrishnaThemeMode",
    mode
  );

  applyThemeMode(mode);

  updateThemeSettingsUI();
}

function updateThemeSettingsUI() {
  const labels = {
    system: "System Default",
    light: "Light mode",
    dark: "Dark mode"
  };

  if (themeSettingsValue) {
    themeSettingsValue.textContent =
      labels[currentThemeMode] || "System Default";
  }

  [
    ["themeOptionSystem", "system"],
    ["themeOptionLight", "light"],
    ["themeOptionDark", "dark"]
  ].forEach(([id, mode]) => {
    const el = $(id);

    if (el) {
      el.classList.toggle(
        "selected",
        currentThemeMode === mode
      );
    }
  });
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

          sendMessage();
        }
      );

    }
  );
}


/* =========================================================
   49. KEYBOARD
   ========================================================= */

// Enter always behaves as a plain newline here — exactly like any
// normal textarea — on every device and browser/webview. Sending
// only ever happens via the Send button tap.
//
// This app is mobile-first, and trying to special-case "Enter to
// send" (via keydown + preventDefault, or via pointer/touch
// detection) turned out to be unreliable across different mobile
// browsers/webviews: some of them insert the newline into the
// textarea BEFORE our JS gets a chance to stop it, so a message
// like "Hi" typed with an Enter in between could get sent as
// "H\ni" — rendering as two broken lines instead of one message.
//
// Removing all custom Enter interception removes that entire class
// of bug: the browser's native newline insertion is 100% reliable,
// and the message that gets sent is always exactly what's visibly
// in the box when Send is tapped — no race conditions possible.
function setupKeyboard() {
  if (!messageInput) return;

  messageInput.addEventListener(
    "input",
    autoResizeTextarea
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

  if (themeSettingsBtn) {
    themeSettingsBtn.addEventListener(
      "click",
      () => {
        closeModal(settingsModal);

        openModal(themeModal);
      }
    );
  }

  [
    ["themeOptionSystem", "system"],
    ["themeOptionLight", "light"],
    ["themeOptionDark", "dark"]
  ].forEach(([id, mode]) => {
    const el = $(id);

    if (el) {
      el.addEventListener(
        "click",
        () => {
          setThemeMode(mode);

          closeModal(themeModal);

          openModal(settingsModal);
        }
      );
    }
  });

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
      () => {
        if (!chats.length) {
          showToast("There are no chats to delete.");
          return;
        }

        closeModal(settingsModal);

        openModal(deleteAllConfirmModal);
      }
    );
  }

  if (deleteAllCancelBtn) {
    deleteAllCancelBtn.addEventListener(
      "click",
      () => {
        closeModal(deleteAllConfirmModal);

        openModal(settingsModal);
      }
    );
  }

  if (deleteAllConfirmBtn) {
    deleteAllConfirmBtn.addEventListener(
      "click",
      async () => {
        closeModal(deleteAllConfirmModal);

        await deleteAllChats();
      }
    );
  }

  if (logoutBtn) {
    logoutBtn.addEventListener(
      "click",
      logout
    );
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener(
      "click",
      () => {
        closeModal(settingsModal);

        openModal(deleteAccountConfirmModal);
      }
    );
  }

  if (deleteAccountCancelBtn) {
    deleteAccountCancelBtn.addEventListener(
      "click",
      () => {
        closeModal(deleteAccountConfirmModal);

        openModal(settingsModal);
      }
    );
  }

  if (deleteAccountConfirmBtn) {
    deleteAccountConfirmBtn.addEventListener(
      "click",
      async () => {
        closeModal(deleteAccountConfirmModal);

        await deleteAccountPermanently();
      }
    );
  }

  if (incognitoBtn) {
    incognitoBtn.addEventListener(
      "click",
      toggleIncognitoMode
    );
  }

  if (incognitoBanner) {
    incognitoBanner.addEventListener(
      "click",
      exitIncognitoMode
    );
  }

  if (codeFullscreenBackBtn) {
    codeFullscreenBackBtn.addEventListener(
      "click",
      () => closeModal(codeFullscreenModal)
    );
  }

  if (codeFullscreenCopyBtn) {
    codeFullscreenCopyBtn.addEventListener(
      "click",
      () => {
        const text =
          (codeFullscreenModal &&
            codeFullscreenModal.dataset.codeText) ||
          "";

        copyText(text);

        showToast("Code copied");
      }
    );
  }

  if (settingsBtn) {
    settingsBtn.addEventListener(
      "click",
      openSettingsModal
    );
  }

  if (manageAccountBtn) {
    manageAccountBtn.addEventListener(
      "click",
      openManageGoogleAccount
    );
  }

  if (settingsSignOutBtn) {
    settingsSignOutBtn.addEventListener(
      "click",
      () => {
        closeModal(settingsModal);
        logout();
      }
    );
  }

  if (memoryToggle) {
    memoryToggle.addEventListener(
      "change",
      () => {
        memoryEnabled = memoryToggle.checked;

        persistMemory();

        showToast(
          memoryEnabled
            ? "Memory turned on"
            : "Memory turned off"
        );
      }
    );
  }

  if (manageMemoryBtn) {
    manageMemoryBtn.addEventListener(
      "click",
      () => {
        closeModal(settingsModal);

        renderMemoryList();

        openModal(memoryModal);
      }
    );
  }

  if (clearMemoryBtn) {
    clearMemoryBtn.addEventListener(
      "click",
      clearAllMemory
    );
  }

  if (openBinBtn) {
    openBinBtn.addEventListener(
      "click",
      () => {
        closeModal(settingsModal);

        renderBinList();

        openModal(binModal);
      }
    );
  }

  if (customerServiceBtn) {
    customerServiceBtn.addEventListener(
      "click",
      openCustomerSupport
    );
  }

  if (termsBtn) {
    termsBtn.addEventListener(
      "click",
      () => {
        window.location.href =
          "/terms.html";
      }
    );
  }

  if (privacyBtn) {
    privacyBtn.addEventListener(
      "click",
      () => {
        window.location.href =
          "/privacy.html";
      }
    );
  }

  if (licenseBtn) {
    licenseBtn.addEventListener(
      "click",
      () => openLegalModal("license")
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

        closeAllChatMenus();

        closeModal(shareModal);
        closeModal(settingsModal);
        closeModal(themeModal);
        closeModal(memoryModal);
        closeModal(binModal);
        closeModal(legalModal);
        closeModal(selectTextModal);
        closeModal(codeFullscreenModal);
        closeModal(deleteAllConfirmModal);
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

  // If we got here via the "← Back to app" link on the standalone
  // privacy/terms pages, reopen Settings instead of dropping the
  // person on the login/chat screen with no context.
  if (
    window.location.search.includes("openSettings=1")
  ) {
    setTimeout(() => {
      openSettingsModal();

      const cleanUrl =
        window.location.pathname;

      window.history.replaceState(
        {},
        "",
        cleanUrl
      );
    }, 400);
  }
}


/* =========================================================
   52. START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  startApp
);