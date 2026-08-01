import { json } from "../../_lib/response.js";

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
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return json({ success: false, message: "DB unavailable" }, 503);

  try {
    await ensureTable(env.DB);
    const [totals, sources, pages] = await Promise.all([
      env.DB.prepare(`SELECT
        SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS pageViews,
        COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id END) AS sessions,
        SUM(CASE WHEN event_name = 'contact_click' THEN 1 ELSE 0 END) AS contactClicks,
        SUM(CASE WHEN event_name = 'contact_view' THEN 1 ELSE 0 END) AS contactViews,
        SUM(CASE WHEN event_name = 'contact_success' THEN 1 ELSE 0 END) AS contactSuccess
        FROM site_events WHERE created_at >= datetime('now', '-30 days')`).first(),
      env.DB.prepare(`SELECT CASE WHEN utm_source <> '' THEN utm_source WHEN referrer_host <> '' THEN referrer_host ELSE 'direct' END AS source,
        COUNT(*) AS count FROM site_events WHERE event_name = 'page_view' AND created_at >= datetime('now', '-30 days')
        GROUP BY source ORDER BY count DESC LIMIT 8`).all(),
      env.DB.prepare(`SELECT path, COUNT(*) AS count FROM site_events
        WHERE event_name = 'page_view' AND created_at >= datetime('now', '-30 days')
        GROUP BY path ORDER BY count DESC LIMIT 10`).all(),
    ]);
    const pageViews = totals?.pageViews || 0;
    const contactClicks = totals?.contactClicks || 0;
    return json({ success: true, periodDays: 30, totals: {
      pageViews, sessions: totals?.sessions || 0, contactClicks,
      contactViews: totals?.contactViews || 0, contactSuccess: totals?.contactSuccess || 0,
      clickRate: pageViews ? Math.round((contactClicks / pageViews) * 1000) / 10 : 0,
    }, sources: sources.results, pages: pages.results });
  } catch (error) {
    console.error(`[admin/analytics] ${error.message}`);
    return json({ success: false, message: "Analytics query failed" }, 500);
  }
}
