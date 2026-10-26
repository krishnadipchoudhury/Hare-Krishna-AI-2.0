// POST /api/send-otp   { email }  ->  { ok, token, expiresIn, resendAfter }
//
// Emails a 6-digit code. The code is never returned to the browser.

import {
  isValidEmail,
  normalizeEmail,
  isConfigured,
  makeCode,
  makeChallenge,
  sendOtpEmail,
  tooManySends,
  noteSend,
  lastSendAt,
  OTP_LIFETIME_MS,
  RESEND_COOLDOWN_MS,
  MAX_SENDS_PER_EMAIL_PER_HOUR,
  MAX_SENDS_PER_IP_PER_HOUR
} from "../lib/otp.js";

const HOUR = 60 * 60 * 1000;

async function readBody(request) {
  if (request.body && typeof request.body === "object") return request.body;

  let text = "";

  for await (const chunk of request) text += chunk.toString();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const body = await readBody(request);

    const email = normalizeEmail(body.email);

    if (!isValidEmail(email)) {
      response.status(400).json({ error: "invalid_email" });
      return;
    }

    if (!isConfigured()) {
      console.error(
        "OTP is not configured: set OTP_SECRET, RESEND_API_KEY and OTP_FROM_EMAIL."
      );

      response.status(503).json({ error: "otp_not_configured" });
      return;
    }

    const ip =
      String(
        (request.headers && request.headers["x-forwarded-for"]) || ""
      ).split(",")[0].trim() || "unknown";

    const emailKey = "e:" + email;
    const ipKey = "i:" + ip;

    const sinceLast = Date.now() - lastSendAt(emailKey);

    if (sinceLast < RESEND_COOLDOWN_MS) {
      response.status(429).json({
        error: "too_soon",
        retryAfter: Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000)
      });
      return;
    }

    if (
      tooManySends(emailKey, MAX_SENDS_PER_EMAIL_PER_HOUR, HOUR) ||
      tooManySends(ipKey, MAX_SENDS_PER_IP_PER_HOUR, HOUR)
    ) {
      response.status(429).json({ error: "too_many", retryAfter: 600 });
      return;
    }

    const code = makeCode();

    // Counted before sending, so failing attempts can't be used to hammer
    // the email provider.
    noteSend(ipKey);

    await sendOtpEmail(email, code);

    noteSend(emailKey);

    response.status(200).json({
      ok: true,
      token: makeChallenge(email, code),
      expiresIn: Math.round(OTP_LIFETIME_MS / 1000),
      resendAfter: Math.round(RESEND_COOLDOWN_MS / 1000)
    });

  } catch (error) {
    console.error("send-otp failed:", error.message);

    response.status(502).json({ error: "send_failed" });
  }
}
