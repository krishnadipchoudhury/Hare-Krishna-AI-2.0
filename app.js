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

let memoryEnabled = true;
let memoryItems = [];

let deletedChats = [];

const BIN_RETENTION_DAYS = 14;
const BIN_RETENTION_MS = BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const SUPPORT_EMAIL = "krishnadipchoudhury51@gmail.com";


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

const settingsBtn = $("settingsBtn");
const settingsModal = $("settingsModal");

const settingsAvatar = $("settingsAvatar");
const settingsName = $("settingsName");
const settingsEmail = $("settingsEmail");

const manageAccountBtn = $("manageAccountBtn");
const settingsSignOutBtn = $("settingsSignOutBtn");

const memoryToggle = $("memoryToggle");
const manageMemoryBtn = $("manageMemoryBtn");
const memoryModal = $("memoryModal");
const memoryList = $("memoryList");
const memoryInput = $("memoryInput");
const addMemoryBtn = $("addMemoryBtn");
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
   17e. LEGAL CONTENT (Terms / Privacy / License)
   =========================================================
   NOTE: This is placeholder text. Review and replace with
   your own finalized Terms, Privacy Policy, and License
   before publishing the app.
   ========================================================= */

const LEGAL_CONTENT = {

  terms: {
    title: "Terms & Conditions",
    html:
      "<h3>1. Acceptance of terms</h3>" +
      "<p>By using this app, you agree to these terms. If you do not agree, please do not use the app.</p>" +
      "<h3>2. Use of the service</h3>" +
      "<p>You agree to use this app only for lawful purposes and not to misuse the AI responses or attempt to disrupt the service.</p>" +
      "<h3>3. Account responsibility</h3>" +
      "<p>You are responsible for keeping your login credentials secure and for all activity under your account.</p>" +
      "<h3>4. Changes to these terms</h3>" +
      "<p>These terms may be updated from time to time. Continued use of the app after changes means you accept the updated terms.</p>" +
      "<p style='color:var(--muted);font-size:12px;margin-top:16px;'>This is placeholder text — replace with your reviewed Terms & Conditions before publishing.</p>"
  },

  privacy: {
    title: "Privacy Policy",
    html:
      "<h3>Information we collect</h3>" +
      "<p>When you sign in, we store your email address, display name, and profile photo (if provided) to identify your account.</p>" +
      "<h3>Your chats</h3>" +
      "<p>Chat messages are stored securely with your account so you can access them across sessions. Guest chats are stored only on your device.</p>" +
      "<h3>Memory</h3>" +
      "<p>Anything you save to Memory is stored with your account and used only to personalize your experience within this app.</p>" +
      "<h3>Sharing</h3>" +
      "<p>We do not sell your personal data. Chats shared via link are visible to anyone who has that link.</p>" +
      "<p style='color:var(--muted);font-size:12px;margin-top:16px;'>This is placeholder text — replace with your reviewed Privacy Policy before publishing.</p>"
  },

  license: {
    title: "License",
    html:
      "<h3>MIT License</h3>" +
      "<p>Copyright (c) 2026 Krishnadip Choudhury</p>" +
      "<p>Permission is hereby granted, free of charge, to any person obtaining a copy " +
      "of this software and associated documentation files (the \"Software\"), to deal " +
      "in the Software without restriction, including without limitation the rights " +
      "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell " +
      "copies of the Software, and to permit persons to whom the Software is " +
      "furnished to do so, subject to the following conditions:</p>" +
      "<p>The above copyright notice and this permission notice shall be included in all " +
      "copies or substantial portions of the Software.</p>" +
      "<p>THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR " +
      "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, " +
      "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE " +
      "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER " +
      "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, " +
      "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE " +
      "SOFTWARE.</p>" +
      "<h3>Third-party services</h3>" +
      "<p>This app uses Firebase (Google) for authentication and data storage, subject to Google's own terms of service.</p>"
  }

};

function openLegalModal(key) {
  const data = LEGAL_CONTENT[key];

  if (
    !data ||
    !legalModal ||
    !legalTitle ||
    !legalContent
  ) {
    return;
  }

  legalTitle.textContent = data.title;
  legalContent.innerHTML = data.html;

  openModal(legalModal);
}


/* =========================================================
   17f. MEMORY (guest = localStorage, account = Firestore)
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

function renderMemoryList() {
  if (!memoryList) return;

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

    const text =
      document.createElement("div");

    text.className = "memory-item-text";
    text.textContent = entry.text;

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
   17g. RECENTLY DELETED (BIN) — 14 day soft delete
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

const MAX_CHATS = 50;

function createNewChat(showMessage = true) {

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

    item.dataset.chatId = chat.id;

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

    chatList.appendChild(item);
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

  const renameBtn =
    document.createElement("button");

  renameBtn.type = "button";

  renameBtn.innerHTML =
    "<span class='menu-icon'>✎</span><span>Rename</span>";

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
    "<span class='menu-icon'>🗑</span><span>Delete</span>";

  deleteBtn.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      closeAllChatMenus();

      deleteChat(chatId);
    }
  );

  popup.appendChild(renameBtn);
  popup.appendChild(deleteBtn);

  item.appendChild(popup);
}

/* Click anywhere outside an open chat menu closes it. */
document.addEventListener("click", closeAllChatMenus);


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

  renderSourcesList(
    wrapper,
    message.sources
  );

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
  content,
  sources
) {
  const chat =
    getCurrentChat();

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

  appendMessageIncremental(message);

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
   28b. APPEND MESSAGE INCREMENTALLY
   =========================================================
   Adds just the one new message to the DOM instead of wiping
   and re-rendering the whole thread on every send — keeps
   long chats and big messages (code/poems/stories) fast and
   avoids any flash/rebuild jank. Also removes the temporary
   typewriter-reveal row for assistant replies so the final
   persisted message replaces it cleanly instead of stacking.
   ========================================================= */

function appendMessageIncremental(message) {
  if (!messages) return;

  if (welcome) {
    welcome.classList.add("hidden");
  }

  const tempReveal =
    document.getElementById("assistantRevealTemp");

  if (tempReveal) {
    tempReveal.remove();
  }

  renderMessage(message);

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

    let result;

    try {
      // Real AI: web search (Tavily) + streamed answer (Groq),
      // via the /api/chat serverless function.
      result =
        await streamAssistantMessage(
          text
        );

    } catch (apiError) {

      console.error(
        "AI backend unreachable, falling back to local demo:",
        apiError
      );

      // Backend hiccup / offline — fall back to the local demo
      // engine rather than showing a dead end. The temp reveal
      // row from streamAssistantMessage (if any) gets replaced
      // cleanly by addMessage()'s incremental append either way.
      const fallbackText =
        await generateLocalResponse(
          text
        );

      removeTypingIndicator();

      result = {
        text: fallbackText,
        sources: []
      };
    }

    await addMessage(
      "assistant",
      result.text,
      result.sources
    );

  } catch (error) {

    console.error(
      "AI response error:",
      error
    );

    removeTypingIndicator();

    const errorMessage =
      "Sorry, something went wrong while generating the response.";

    await addMessage(
      "assistant",
      errorMessage
    );

  } finally {
    isGenerating = false;
    sendBtn.disabled = false;

    messageInput.focus();
  }
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
      "I'm Hare Krishna AI — your personal AI assistant interface.\n\n" +
      "This version is currently using local demo responses. " +
      "The Firebase part handles authentication and saving your chats."
    );
  }

  return (
    "I received your message:\n\n" +
    `"${input}"\n\n` +
    "This version of Hare Krishna AI is currently using a local demo response engine. " +
    "Your Firebase authentication and chat storage can work independently."
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

function getRecentHistoryForApi() {
  const chat = getCurrentChat();

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

async function streamAssistantMessage(userText) {
  if (!messages) {
    return { text: "", sources: [] };
  }

  if (welcome) {
    welcome.classList.add("hidden");
  }

  const row =
    document.createElement("div");

  row.id = "assistantRevealTemp";

  row.className = "message-row assistant";

  const avatar =
    document.createElement("div");

  avatar.className = "avatar";
  avatar.textContent = "✦";

  const wrapper =
    document.createElement("div");

  wrapper.className = "message-wrapper";

  const bubble =
    document.createElement("div");

  bubble.className = "message";

  const cursor =
    document.createElement("span");

  cursor.className = "typing-cursor";

  wrapper.appendChild(bubble);
  wrapper.appendChild(cursor);

  row.appendChild(avatar);
  row.appendChild(wrapper);

  messages.appendChild(row);

  scrollToBottom();

  const response =
    await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userText,
        history: getRecentHistoryForApi(),
        facts: getKnownFacts()
      })
    });

  if (!response.ok || !response.body) {
    throw new Error(
      "AI request failed with status " + response.status
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";
  let metaConsumed = false;
  let fullText = "";
  let sources = [];
  let firstChunkArrived = false;

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) break;

    buffer +=
      decoder.decode(value, { stream: true });

    // First line of the stream is a JSON "sources" descriptor —
    // wait until we actually have a full line before parsing it.
    if (!metaConsumed) {
      const newlineIndex =
        buffer.indexOf("\n");

      if (newlineIndex === -1) continue;

      const metaLine =
        buffer.slice(0, newlineIndex);

      buffer =
        buffer.slice(newlineIndex + 1);

      metaConsumed = true;

      try {
        const meta =
          JSON.parse(metaLine);

        if (meta && meta.type === "sources") {
          sources = meta.sources || [];
        }

      } catch {
        // Ignore a malformed meta line — just proceed without sources.
      }
    }

    if (metaConsumed && buffer) {
      fullText += buffer;

      buffer = "";

      if (!firstChunkArrived) {
        firstChunkArrived = true;

        removeTypingIndicator();
      }

      bubble.textContent = fullText;

      scrollToBottom();
    }
  }

  cursor.remove();

  if (!fullText.trim()) {
    fullText =
      "Sorry, I couldn't generate a response just now. Please try again.";

    bubble.textContent = fullText;
  }

  renderSourcesList(wrapper, sources);

  scrollToBottom();

  return { text: fullText, sources };
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

  if (addMemoryBtn) {
    addMemoryBtn.addEventListener(
      "click",
      () => {
        addMemoryEntry(memoryInput.value);

        memoryInput.value = "";

        memoryInput.focus();
      }
    );
  }

  if (memoryInput) {
    memoryInput.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          event.preventDefault();

          addMemoryEntry(memoryInput.value);

          memoryInput.value = "";
        }
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
      () => openLegalModal("terms")
    );
  }

  if (privacyBtn) {
    privacyBtn.addEventListener(
      "click",
      () => openLegalModal("privacy")
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
        closeModal(memoryModal);
        closeModal(binModal);
        closeModal(legalModal);
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