const logoutButton = document.getElementById("logout-button");
const refreshButton = document.getElementById("refresh-button");
const contactList = document.getElementById("contact-list");
const emptyMessage = document.getElementById("empty-message");
const loadError = document.getElementById("load-error");
const template = document.getElementById("contact-card-template");
const statusFilters = document.getElementById("status-filters");
const currentUserLabel = document.getElementById("current-user");
const roleNotice = document.getElementById("role-notice");

let currentStatus = "";
let currentRole = null;

function redirectToLogin() {
  window.location.href = "/admin/login";
}

function formatDate(value) {
  try {
    return new Date(value.replace(" ", "T") + "Z").toLocaleString("ja-JP");
  } catch {
    return value;
  }
}

function renderContacts(contacts) {
  contactList.innerHTML = "";
  emptyMessage.classList.toggle("hidden", contacts.length > 0);

  for (const contact of contacts) {
    const node = template.content.cloneNode(true);
    const card = node.querySelector("[data-id]");
    card.dataset.id = contact.id;
    node.querySelector('[data-field="name"]').textContent = contact.name;
    node.querySelector('[data-field="company"]').textContent = contact.company || "(会社名・屋号未入力)";
    node.querySelector('[data-field="email"]').textContent = contact.email;
    node.querySelector('[data-field="created_at"]').textContent = formatDate(contact.created_at);
    node.querySelector('[data-field="message"]').textContent = contact.message;

    const select = node.querySelector('[data-field="status"]');
    select.value = contact.status;
    select.disabled = currentRole !== "admin";
    select.addEventListener("change", () => updateStatus(contact.id, select.value, select));

    contactList.appendChild(node);
  }
}

async function loadCurrentUser() {
  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (response.status === 401) {
    redirectToLogin();
    return false;
  }
  const result = await response.json();
  currentRole = result.user.role;
  currentUserLabel.textContent = `${result.user.email}(${result.user.role === "admin" ? "管理者" : "一般ユーザー"})`;
  roleNotice.classList.toggle("hidden", currentRole === "admin");
  return true;
}

async function loadContacts() {
  loadError.classList.add("hidden");
  const query = currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : "";

  const response = await fetch(`/api/admin/contacts${query}`, { credentials: "include" });

  if (response.status === 401) {
    redirectToLogin();
    return;
  }

  if (!response.ok) {
    loadError.textContent = "読み込みに失敗しました。時間をおいて再度お試しください。";
    loadError.classList.remove("hidden");
    return;
  }

  const result = await response.json();
  renderContacts(result.contacts || []);
}

async function updateStatus(id, status, selectEl) {
  selectEl.disabled = true;
  try {
    const response = await fetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.status === 401) {
      redirectToLogin();
      return;
    }
    if (response.status === 403) {
      alert("この操作には管理者権限が必要です。");
      return;
    }
    if (!response.ok) {
      alert("ステータスの更新に失敗しました。");
    }
  } finally {
    selectEl.disabled = currentRole !== "admin";
  }
}

logoutButton.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  redirectToLogin();
});

refreshButton.addEventListener("click", () => loadContacts());

statusFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");
  if (!button) return;

  currentStatus = button.dataset.status;
  statusFilters.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("is-active"));
  button.classList.add("is-active");
  loadContacts();
});

(async function init() {
  statusFilters.querySelector('[data-status=""]').classList.add("is-active");
  const ok = await loadCurrentUser();
  if (ok) {
    await loadContacts();
  }
})();
