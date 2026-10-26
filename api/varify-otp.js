// POST /api/verify-otp   { email, code, token }  ->  { ok:true }  or  { ok:false, reason }

import { checkChallenge, isConfigured } from "../lib/otp.js";

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
    if (!isConfigured()) {
      response.status(503).json({ error: "otp_not_configured" });
      return;
    }

    const body = await readBody(request);

    const result =
      checkChallenge(body.token, body.email, body.code);

    if (!result.ok) {
      response.status(400).json({ ok: false, reason: result.reason });
      return;
    }

    response.status(200).json({ ok: true });

  } catch (error) {
    console.error("verify-otp failed:", error.message);

    response.status(500).json({ ok: false, reason: "server_error" });
  }
}
