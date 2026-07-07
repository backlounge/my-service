const COOKIE_NAME = "admin_session";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 8; // 8時間

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionCookie(env, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const signature = await hmacHex(env.ADMIN_PASSWORD, String(expiresAt));
  const token = encodeURIComponent(`${expiresAt}.${signature}`);
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function isAuthenticated(request, env) {
  if (!env.ADMIN_PASSWORD) return false;

  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [expiresStr, signature] = decodeURIComponent(match[1]).split(".");
  if (!expiresStr || !signature) return false;
  if (Number(expiresStr) < Date.now()) return false;

  const expected = await hmacHex(env.ADMIN_PASSWORD, expiresStr);
  return expected === signature;
}
