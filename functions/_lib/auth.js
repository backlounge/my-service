const COOKIE_NAME = "session";
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

function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

function readCookie(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

// user: { id, role }
export async function createSessionCookie(env, user, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const payload = JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + maxAgeSeconds * 1000 });
  const encodedPayload = base64UrlEncode(payload);
  const signature = await hmacHex(env.SESSION_SECRET, encodedPayload);
  const token = `${encodedPayload}.${signature}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// 戻り値: { id, role } または未ログイン/無効なセッションの場合は null
export async function getSessionUser(request, env) {
  if (!env.SESSION_SECRET) return null;

  const raw = readCookie(request);
  if (!raw) return null;

  const [encodedPayload, signature] = decodeURIComponent(raw).split(".");
  if (!encodedPayload || !signature) return null;

  const expected = await hmacHex(env.SESSION_SECRET, encodedPayload);
  if (expected !== signature) return null;

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return null;
  }

  if (!payload.exp || payload.exp < Date.now()) return null;
  if (!payload.sub || !payload.role) return null;

  return { id: payload.sub, role: payload.role };
}
