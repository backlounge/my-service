import { json } from "../../_lib/response.js";

const TREND_DAYS = 30;

function lastNDates(n) {
  const dates = [];
  const today = new Date();
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(utcToday - i * 86400000);
    dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
  }
  return dates;
}

async function getBuildInfo(request, env) {
  try {
    const url = new URL(request.url);
    const buildInfoUrl = new URL("/build-info.json", url.origin);
    const response = await env.ASSETS.fetch(new Request(buildInfoUrl));
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;

  if (!env.DB) {
    return json({
      success: true,
      dbStatus: "error",
      totals: { total: 0, new: 0, doing: 0, done: 0 },
      today: 0,
      thisMonth: 0,
      latest: [],
      dailyTrend: lastNDates(TREND_DAYS).map((date) => ({ date, count: 0 })),
      projects: { total: 0, inProgress: 0, contracted: 0, completed: 0 },
      system: { commitSha: null, branch: null, builtAt: null, dbStatus: "error" },
    });
  }

  let dbStatus = "ok";
  let totals = { total: 0, new: 0, doing: 0, done: 0 };
  let today = 0;
  let thisMonth = 0;
  let latest = [];
  let dailyTrend = lastNDates(TREND_DAYS).map((date) => ({ date, count: 0 }));
  let projectStats = { total: 0, inProgress: 0, contracted: 0, completed: 0 };

  try {
    const [statusRows, todayRow, monthRow, latestRows, trendRows, projectRow] = await Promise.all([
      env.DB.prepare("SELECT status, COUNT(*) as count FROM contacts GROUP BY status").all(),
      env.DB.prepare("SELECT COUNT(*) as count FROM contacts WHERE date(created_at) = date('now')").first(),
      env.DB.prepare(
        "SELECT COUNT(*) as count FROM contacts WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
      ).first(),
      env.DB.prepare(
        "SELECT id, name, email, company, status, created_at FROM contacts ORDER BY created_at DESC LIMIT 5"
      ).all(),
      env.DB.prepare(
        `SELECT date(created_at) as day, COUNT(*) as count FROM contacts
         WHERE created_at > datetime('now', '-${TREND_DAYS} days')
         GROUP BY day`
      ).all(),
      env.DB.prepare(
        `SELECT
           COUNT(*) as total,
           COALESCE(SUM(CASE WHEN status NOT IN ('completed', 'cancel') THEN 1 ELSE 0 END), 0) as inProgress,
           COALESCE(SUM(CASE WHEN status IN ('contract', 'development', 'completed') THEN 1 ELSE 0 END), 0) as contracted,
           COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed
         FROM projects`
      ).first(),
    ]);

    for (const row of statusRows.results) {
      totals.total += row.count;
      if (row.status === "new") totals.new = row.count;
      if (row.status === "doing") totals.doing = row.count;
      if (row.status === "done") totals.done = row.count;
    }

    today = todayRow?.count || 0;
    thisMonth = monthRow?.count || 0;
    latest = latestRows.results;

    const countByDay = Object.fromEntries(trendRows.results.map((r) => [r.day, r.count]));
    dailyTrend = dailyTrend.map(({ date }) => ({ date, count: countByDay[date] || 0 }));

    projectStats = {
      total: projectRow?.total || 0,
      inProgress: projectRow?.inProgress || 0,
      contracted: projectRow?.contracted || 0,
      completed: projectRow?.completed || 0,
    };
  } catch (error) {
    console.error(`[admin/stats] D1取得に失敗しました: ${error.message}`);
    dbStatus = "error";
  }

  const buildInfo = await getBuildInfo(request, env);

  return json({
    success: true,
    totals,
    today,
    thisMonth,
    latest,
    dailyTrend,
    projects: projectStats,
    system: {
      commitSha: buildInfo?.commitSha || null,
      branch: buildInfo?.branch || null,
      builtAt: buildInfo?.builtAt || null,
      dbStatus,
    },
  });
}
