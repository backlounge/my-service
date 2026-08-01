import { json } from "../_lib/response.js";

const ALLOWED_EVENTS = new Set(["page_view", "contact_click", "contact_view", "contact_success"]);

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

async function ensureTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS site_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    path TEXT NOT NULL,
    referrer_host TEXT NOT NULL DEFAULT '',
    utm_source TEXT NOT NULL DEFAULT '',
    utm_medium TEXT NOT NULL DEFAULT '',
    utm_campaign TEXT NOT NULL DEFAULT '',
    session_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_site_events_created_at ON site_events(created_at)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_site_events_name ON site_events(event_name)").run();
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) return json({ success: false }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false }, 400);
  }

  const eventName = clean(body.event, 32);
  const path = clean(body.path, 240);
  if (!ALLOWED_EVENTS.has(eventName) || !path.startsWith("/")) return json({ success: false }, 400);

  try {
    await ensureTable(env.DB);
    await env.DB.prepare(`INSERT INTO site_events
      (event_name, path, referrer_host, utm_source, utm_medium, utm_campaign, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(eventName, path, clean(body.referrerHost, 160), clean(body.utmSource, 80),
        clean(body.utmMedium, 80), clean(body.utmCampaign, 120), clean(body.sessionId, 80))
      .run();
    return json({ success: true });
  } catch (error) {
    console.error(`[analytics] ${error.message}`);
    return json({ success: false }, 500);
  }
}
