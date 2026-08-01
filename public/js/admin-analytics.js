const errorBox = document.getElementById("load-error");
const content = document.getElementById("analytics-content");

function renderRows(containerId, rows, labelKey) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (!rows.length) {
    container.textContent = "データはまだありません。";
    return;
  }
  for (const row of rows) {
    const item = document.createElement("div");
    item.className = "flex items-center justify-between gap-4 border-b border-slate-100 pb-2";
    const label = document.createElement("span");
    label.className = "truncate text-slate-600";
    label.textContent = row[labelKey];
    const count = document.createElement("strong");
    count.textContent = Number(row.count).toLocaleString("ja-JP");
    item.append(label, count);
    container.appendChild(item);
  }
}

async function loadAnalytics() {
  errorBox.classList.add("hidden");
  const response = await fetch("/api/admin/analytics", { credentials: "include" });
  if (response.status === 401) { window.location.href = "/admin/login"; return; }
  if (!response.ok) {
    errorBox.textContent = "アクセス解析を読み込めませんでした。";
    errorBox.classList.remove("hidden");
    return;
  }
  const result = await response.json();
  const totals = result.totals;
  document.getElementById("stat-page-views").textContent = totals.pageViews.toLocaleString("ja-JP");
  document.getElementById("stat-sessions").textContent = totals.sessions.toLocaleString("ja-JP");
  document.getElementById("stat-contact-clicks").textContent = totals.contactClicks.toLocaleString("ja-JP");
  document.getElementById("stat-click-rate").textContent = `${totals.clickRate}%`;
  document.getElementById("stat-contact-views").textContent = totals.contactViews.toLocaleString("ja-JP");
  document.getElementById("stat-contact-success").textContent = totals.contactSuccess.toLocaleString("ja-JP");
  renderRows("source-list", result.sources, "source");
  renderRows("page-list", result.pages, "path");
  content.classList.remove("hidden");
}

document.getElementById("refresh-button").addEventListener("click", loadAnalytics);
(async function init() { const user = await initAdminChrome(); if (user) await loadAnalytics(); })();
