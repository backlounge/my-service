const STATUS_LABELS = { draft: "下書き", sent: "送付済み", accepted: "受注", rejected: "却下" };

const searchInput = document.getElementById("search-input");
const statusFilters = document.getElementById("status-filters");
const roleNotice = document.getElementById("role-notice");
const loadError = document.getElementById("load-error");
const emptyMessage = document.getElementById("empty-message");
const quoteList = document.getElementById("quote-list");
const cardTemplate = document.getElementById("quote-card-template");

let currentRole = null;
let currentStatus = "";
let searchDebounceTimer = null;

function formatDateTime(value) {
  try {
    return new Date(value.replace(" ", "T") + "Z").toLocaleString("ja-JP");
  } catch {
    return value;
  }
}

function formatYen(amount) {
  return `¥${Number(amount).toLocaleString("ja-JP")}`;
}

function renderQuotes(quotes) {
  quoteList.innerHTML = "";
  emptyMessage.classList.toggle("hidden", quotes.length > 0);

  for (const quote of quotes) {
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector("[data-id]");
    card.dataset.id = quote.id;

    const link = node.querySelector('[data-field="quote-number"]');
    link.textContent = quote.quote_number;
    link.href = `/admin/quote-detail?id=${quote.id}`;

    node.querySelector('[data-field="project"]').textContent = `案件: ${quote.project_title}`;
    node.querySelector('[data-field="customer"]').textContent =
      quote.customer_name + (quote.customer_email ? ` ・ ${quote.customer_email}` : "");
    node.querySelector('[data-field="status"]').textContent = STATUS_LABELS[quote.status] || quote.status;
    node.querySelector('[data-field="total"]').textContent = `${formatYen(quote.total)}-`;
    node.querySelector('[data-field="updated"]').textContent = `更新: ${formatDateTime(quote.updated_at)}`;

    const deleteButton = node.querySelector('[data-field="delete-button"]');
    if (currentRole === "admin") {
      deleteButton.classList.remove("hidden");
      deleteButton.addEventListener("click", () => deleteQuote(quote.id, card));
    }

    quoteList.appendChild(node);
  }
}

async function loadQuotes() {
  loadError.classList.add("hidden");

  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (currentStatus) params.set("status", currentStatus);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`/api/admin/quotes${qs}`, { credentials: "include" });

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
  renderQuotes(result.quotes);
}

async function deleteQuote(id, cardEl) {
  if (!confirm("この見積を削除しますか?添付ファイルもすべて削除され、取り消せません。")) return;

  const response = await fetch(`/api/admin/quotes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }
  if (!response.ok) {
    alert("削除に失敗しました。");
    return;
  }

  cardEl.remove();
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => loadQuotes(), 300);
});

statusFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");
  if (!button) return;

  currentStatus = button.dataset.status;
  statusFilters.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("is-active"));
  button.classList.add("is-active");
  loadQuotes();
});

(async function init() {
  statusFilters.querySelector('[data-status=""]').classList.add("is-active");

  const user = await initAdminChrome();
  if (!user) return;

  currentRole = user.role;
  roleNotice.classList.toggle("hidden", currentRole === "admin");

  await loadQuotes();
})();
