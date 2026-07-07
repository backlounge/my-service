const SVG_NS = "http://www.w3.org/2000/svg";

const refreshButton = document.getElementById("refresh-button");
const loadError = document.getElementById("load-error");
const dashboardContent = document.getElementById("dashboard-content");
const latestList = document.getElementById("latest-list");
const latestEmpty = document.getElementById("latest-empty");
const latestTemplate = document.getElementById("latest-item-template");
const trendChart = document.getElementById("trend-chart");
const chartTooltip = document.getElementById("chart-tooltip");

const BRAND_600 = "#4f46e5";
const BRAND_TINT = "#eef2ff"; // brand-50, area/track tint
const GRID_COLOR = "#e2e8f0"; // slate-200, recessive gridline
const AXIS_TEXT_COLOR = "#64748b"; // slate-500

function formatDateShort(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatDateTime(isoString) {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleString("ja-JP");
  } catch {
    return isoString;
  }
}

function formatCreatedAt(value) {
  try {
    return new Date(value.replace(" ", "T") + "Z").toLocaleDateString("ja-JP");
  } catch {
    return value;
  }
}

// 見やすいY軸最大値(0, 1, 2, 5, 10, 20, 50, 100 ...)に切り上げる
function niceMax(value) {
  if (value <= 0) return 1;
  const steps = [1, 2, 5, 10];
  let scale = 1;
  while (true) {
    for (const step of steps) {
      const candidate = step * scale;
      if (candidate >= value) return candidate;
    }
    scale *= 10;
  }
}

function clearSvg() {
  while (trendChart.firstChild) trendChart.removeChild(trendChart.firstChild);
}

function renderTrendChart(dailyTrend) {
  clearSvg();

  const width = 800;
  const height = 220;
  const paddingLeft = 32;
  const paddingBottom = 24;
  const paddingTop = 12;
  const plotWidth = width - paddingLeft - 8;
  const plotHeight = height - paddingTop - paddingBottom;

  const max = niceMax(Math.max(...dailyTrend.map((d) => d.count)));
  const ticks = [0, max / 2, max];

  // 横方向のグリッドライン+Y軸ラベル
  for (const tick of ticks) {
    const y = paddingTop + plotHeight - (tick / max) * plotHeight;

    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", paddingLeft);
    line.setAttribute("x2", width - 8);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", GRID_COLOR);
    line.setAttribute("stroke-width", "1");
    trendChart.appendChild(line);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", paddingLeft - 6);
    label.setAttribute("y", y + 3);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", AXIS_TEXT_COLOR);
    label.textContent = Math.round(tick).toLocaleString("ja-JP");
    trendChart.appendChild(label);
  }

  const n = dailyTrend.length;
  const slotWidth = plotWidth / n;
  const barWidth = Math.min(24, slotWidth - 2);
  const radius = 4;

  dailyTrend.forEach((entry, index) => {
    const slotX = paddingLeft + index * slotWidth;
    const barHeight = (entry.count / max) * plotHeight;
    const barX = slotX + (slotWidth - barWidth) / 2;
    const barY = paddingTop + plotHeight - barHeight;
    const baseline = paddingTop + plotHeight;

    // ホバー用のヒット領域(値が0の日も反応するよう常にスロット全体を確保)
    const hitRect = document.createElementNS(SVG_NS, "rect");
    hitRect.setAttribute("x", slotX);
    hitRect.setAttribute("y", paddingTop);
    hitRect.setAttribute("width", slotWidth);
    hitRect.setAttribute("height", plotHeight);
    hitRect.setAttribute("fill", "transparent");
    hitRect.style.cursor = "pointer";

    hitRect.addEventListener("pointerenter", () => {
      visibleBar?.setAttribute("fill", "#4338ca"); // brand-700, lift on hover
    });
    hitRect.addEventListener("pointerleave", () => {
      visibleBar?.setAttribute("fill", BRAND_600);
      chartTooltip.classList.add("hidden");
    });
    hitRect.addEventListener("pointermove", (event) => {
      const containerRect = trendChart.parentElement.getBoundingClientRect();
      chartTooltip.style.left = `${event.clientX - containerRect.left + 12}px`;
      chartTooltip.style.top = `${event.clientY - containerRect.top - 36}px`;
      chartTooltip.textContent = `${entry.date}: ${entry.count}件`;
      chartTooltip.classList.remove("hidden");
    });

    let visibleBar = null;
    if (entry.count > 0) {
      const path = document.createElementNS(SVG_NS, "path");
      const r = Math.min(radius, barHeight);
      const d = `
        M ${barX},${barY + r}
        Q ${barX},${barY} ${barX + r},${barY}
        L ${barX + barWidth - r},${barY}
        Q ${barX + barWidth},${barY} ${barX + barWidth},${barY + r}
        L ${barX + barWidth},${baseline}
        L ${barX},${baseline}
        Z
      `;
      path.setAttribute("d", d);
      path.setAttribute("fill", BRAND_600);
      trendChart.appendChild(path);
      visibleBar = path;
    }

    trendChart.appendChild(hitRect);

    // X軸ラベルは詰まりすぎないよう間引く(最初/最後/約5日おき)
    if (index === 0 || index === n - 1 || index % 5 === 0) {
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", slotX + slotWidth / 2);
      label.setAttribute("y", height - 6);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "9");
      label.setAttribute("fill", AXIS_TEXT_COLOR);
      label.textContent = formatDateShort(entry.date);
      trendChart.appendChild(label);
    }
  });
}

function renderLatest(latest) {
  latestList.innerHTML = "";
  latestEmpty.classList.toggle("hidden", latest.length > 0);

  for (const contact of latest) {
    const node = latestTemplate.content.cloneNode(true);
    node.querySelector('[data-field="name"]').textContent = contact.name;
    node.querySelector('[data-field="email"]').textContent = contact.email;
    node.querySelector('[data-field="status"]').textContent = contact.status;
    node.querySelector('[data-field="created_at"]').textContent = formatCreatedAt(contact.created_at);
    latestList.appendChild(node);
  }
}

function renderSystemInfo(system) {
  document.getElementById("system-commit").textContent = system.commitSha
    ? system.commitSha.slice(0, 7)
    : "不明";
  document.getElementById("system-built-at").textContent = formatDateTime(system.builtAt);

  const dot = document.getElementById("system-db-dot");
  const statusLabel = document.getElementById("system-db-status");
  if (system.dbStatus === "ok") {
    dot.className = "h-2.5 w-2.5 rounded-full bg-emerald-500";
    statusLabel.textContent = "接続OK";
  } else {
    dot.className = "h-2.5 w-2.5 rounded-full bg-red-500";
    statusLabel.textContent = "接続エラー";
  }
}

async function loadStats() {
  loadError.classList.add("hidden");

  const response = await fetch("/api/admin/stats", { credentials: "include" });

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }
  if (!response.ok) {
    loadError.textContent = "読み込みに失敗しました。時間をおいて再度お試しください。";
    loadError.classList.remove("hidden");
    return;
  }

  const result = await response.json();

  document.getElementById("stat-total").textContent = result.totals.total.toLocaleString("ja-JP");
  document.getElementById("stat-new").textContent = result.totals.new.toLocaleString("ja-JP");
  document.getElementById("stat-doing").textContent = result.totals.doing.toLocaleString("ja-JP");
  document.getElementById("stat-done").textContent = result.totals.done.toLocaleString("ja-JP");
  document.getElementById("stat-today").textContent = result.today.toLocaleString("ja-JP");
  document.getElementById("stat-month").textContent = result.thisMonth.toLocaleString("ja-JP");

  renderTrendChart(result.dailyTrend);
  renderLatest(result.latest);
  renderSystemInfo(result.system);

  dashboardContent.classList.remove("hidden");
}

refreshButton.addEventListener("click", () => loadStats());

(async function init() {
  const user = await initAdminChrome();
  if (user) {
    await loadStats();
  }
})();
