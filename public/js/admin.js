const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");
const refreshButton = document.getElementById("refresh-button");
const contactList = document.getElementById("contact-list");
const emptyMessage = document.getElementById("empty-message");
const loadError = document.getElementById("load-error");
const template = document.getElementById("contact-card-template");
const statusFilters = document.getElementById("status-filters");

let currentStatus = "";

function showLogin() {
  loginSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  logoutButton.classList.add("hidden");
}

function showDashboard() {
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
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
    select.addEventListener("change", () => updateStatus(contact.id, select.value, select));

    contactList.appendChild(node);
  }
}

async function loadContacts() {
  loadError.classList.add("hidden");
  const query = currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : "";

  const response = await fetch(`/api/admin/contacts${query}`, { credentials: "include" });

  if (response.status === 401) {
    showLogin();
    return;
  }

  if (!response.ok) {
    loadError.textContent = "読み込みに失敗しました。時間をおいて再度お試しください。";
    loadError.classList.remove("hidden");
    return;
  }

  const result = await response.json();
  showDashboard();
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
      showLogin();
      return;
    }
    if (!response.ok) {
      alert("ステータスの更新に失敗しました。");
    }
  } finally {
    selectEl.disabled = false;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.classList.add("hidden");

  const password = document.getElementById("password").value;
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = await response.json();

    if (result.success) {
      loginForm.reset();
      await loadContacts();
    } else {
      loginError.textContent = result.message || "ログインに失敗しました。";
      loginError.classList.remove("hidden");
    }
  } catch {
    loginError.textContent = "通信に失敗しました。時間をおいて再度お試しください。";
    loginError.classList.remove("hidden");
  } finally {
    submitButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
  showLogin();
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

// 初期表示: すべて を選択状態にしてから一覧取得を試みる(未ログインならログイン画面へ)
statusFilters.querySelector('[data-status=""]').classList.add("is-active");
loadContacts();
