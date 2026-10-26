// lib/otp.js — shared helpers for the email one-time-code (OTP) endpoints.
//
// How it works (no database needed):
//   1. /api/send-otp makes a random 6-digit code and emails it.
//      It also returns a signed "challenge" token to the browser. The token
//      holds the email + an expiry time + a signature that covers the CODE,
//      but the code itself is NOT inside it.
//   2. /api/verify-otp gets {email, code, token}. It recomputes the
//      signature with the code that was typed. Only the right code matches,
//      and nobody can work the code out from the token without the secret.
//
// Needed environment variables (Vercel -> Project -> Settings -> Environment Variables):
//   OTP_SECRET       a long random string (32+ characters) — keep it private
//   RESEND_API_KEY   API key from https://resend.com  (any email provider
//                    works; sendOtpEmail() below is the only place to change)
//   OTP_FROM_EMAIL   e.g.  Hare Krishna AI <login@yourdomain.com>
//                    (the domain must be verified in Resend)

import crypto from "node:crypto";

export const OTP_LENGTH = 6;
export const OTP_LIFETIME_MS = 10 * 60 * 1000;      // a code works for 10 minutes
export const RESEND_COOLDOWN_MS = 30 * 1000;        // one new code per 30 seconds
export const MAX_SENDS_PER_EMAIL_PER_HOUR = 5;
export const MAX_SENDS_PER_IP_PER_HOUR = 20;
export const MAX_WRONG_TRIES = 5;

// ---- email format ---------------------------------------------------

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return false;

  const [local, domain] = email.split("@");

  if (local.length > 64) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;

  // the last part (.com, .in, .co.uk ...) must be letters, at least 2
  const tld = domain.split(".").pop();

  return /^[a-z]{2,24}$/.test(tld);
}

// ---- signing --------------------------------------------------------

function getSecret() {
  const secret = process.env.OTP_SECRET;

  if (!secret || secret.length < 16) return null;

  return secret;
}

export function isConfigured() {
  return !!(
    getSecret() &&
    process.env.RESEND_API_KEY &&
    process.env.OTP_FROM_EMAIL
  );
}

const b64 = value => Buffer.from(value).toString("base64url");

function sign(payloadText, code) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payloadText + "." + code)
    .digest("base64url");
}

export function makeCode() {
  return String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export function makeChallenge(email, code, now = Date.now()) {
  const payload = b64(
    JSON.stringify({
      e: normalizeEmail(email),
      x: now + OTP_LIFETIME_MS,
      n: crypto.randomBytes(9).toString("base64url")
    })
  );

  return payload + "." + sign(payload, code);
}

// Returns { ok:true } or { ok:false, reason }, reason is one of:
//   "bad_token" | "expired" | "wrong_email" | "wrong_code" | "too_many_tries"
const wrongTries = new Map();   // best-effort, per server instance

export function checkChallenge(token, email, code, now = Date.now()) {
  if (typeof token !== "string" || !/^[\w-]+\.[\w-]+$/.test(token)) {
    return { ok: false, reason: "bad_token" };
  }

  const [payload, signature] = token.split(".");

  let data;

  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_token" };
  }

  if (!data || typeof data.e !== "string" || typeof data.x !== "number") {
    return { ok: false, reason: "bad_token" };
  }

  if (now > data.x) return { ok: false, reason: "expired" };

  if (data.e !== normalizeEmail(email)) {
    return { ok: false, reason: "wrong_email" };
  }

  const tries = wrongTries.get(payload) || 0;

  if (tries >= MAX_WRONG_TRIES) {
    return { ok: false, reason: "too_many_tries" };
  }

  const cleanCode = String(code || "").replace(/\D/g, "");

  if (cleanCode.length !== OTP_LENGTH) {
    return { ok: false, reason: "wrong_code" };
  }

  const expected = Buffer.from(sign(payload, cleanCode));
  const given = Buffer.from(signature);

  const matches =
    expected.length === given.length &&
    crypto.timingSafeEqual(expected, given);

  if (!matches) {
    wrongTries.set(payload, tries + 1);

    // keep the map small
    if (wrongTries.size > 5000) wrongTries.clear();

    return { ok: false, reason: "wrong_code" };
  }

  wrongTries.delete(payload);

  return { ok: true, email: data.e };
}

// ---- rate limits (best effort: counted per running server instance) ---

const sendLog = new Map();   // key -> [timestamps]

export function tooManySends(key, limit, windowMs, now = Date.now()) {
  const recent =
    (sendLog.get(key) || []).filter(t => now - t < windowMs);

  if (recent.length >= limit) {
    sendLog.set(key, recent);

    return true;
  }

  return false;
}

export function noteSend(key, now = Date.now()) {
  const list = sendLog.get(key) || [];

  list.push(now);

  sendLog.set(key, list);

  if (sendLog.size > 5000) sendLog.clear();
}

export function lastSendAt(key) {
  const list = sendLog.get(key) || [];

  return list.length ? list[list.length - 1] : 0;
}

// ---- sending the email ----------------------------------------------

export async function sendOtpEmail(to, code) {
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#17191c">
  <h2 style="margin:0 0 8px">Verify your email</h2>
  <p style="margin:0 0 20px;color:#555">Use this code to finish creating your Hare Krishna AI account:</p>
  <div style="font-size:34px;letter-spacing:10px;font-weight:700;background:#f1f0ff;border-radius:12px;padding:16px 0;text-align:center">${code}</div>
  <p style="margin:20px 0 0;color:#777;font-size:13px">This code expires in 10 minutes. If you didn't ask for it, you can ignore this email — nobody can use it without your password.</p>
</div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.RESEND_API_KEY
    },
    body: JSON.stringify({
      from: process.env.OTP_FROM_EMAIL,
      to: [to],
      subject: code + " is your Hare Krishna AI verification code",
      html,
      text:
        "Your Hare Krishna AI verification code is " + code +
        ". It expires in 10 minutes."
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");

    throw new Error("Email provider error " + response.status + ": " + detail.slice(0, 200));
  }
}
