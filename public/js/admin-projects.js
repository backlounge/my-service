const searchInput = document.getElementById("search-input");
const newProjectButton = document.getElementById("new-project-button");
const statusFilters = document.getElementById("status-filters");
const roleNotice = document.getElementById("role-notice");
const createForm = document.getElementById("create-form");
const cancelCreateButton = document.getElementById("cancel-create-button");
const createError = document.getElementById("create-error");
const loadError = document.getElementById("load-error");
const emptyMessage = document.getElementById("empty-message");
const projectList = document.getElementById("project-list");
const cardTemplate = document.getElementById("project-card-template");

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

function renderProjects(projects) {
  projectList.innerHTML = "";
  emptyMessage.classList.toggle("hidden", projects.length > 0);

  for (const project of projects) {
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector("[data-id]");
    card.dataset.id = project.id;

    const titleLink = node.querySelector('[data-field="title"]');
    titleLink.textContent = project.title;
    titleLink.href = `/admin/project-detail?id=${project.id}`;

    node.querySelector('[data-field="customer"]').textContent =
      project.customer_name + (project.customer_email ? ` ・ ${project.customer_email}` : "");
    node.querySelector('[data-field="updated"]').textContent = `更新: ${formatDateTime(project.updated_at)}`;

    const statusSelect = node.querySelector('[data-field="status"]');
    statusSelect.value = project.status;
    statusSelect.disabled = currentRole !== "admin";
    statusSelect.addEventListener("change", () => updateStatus(project.id, statusSelect.value, statusSelect));

    const deleteButton = node.querySelector('[data-field="delete-button"]');
    if (currentRole === "admin") {
      deleteButton.classList.remove("hidden");
      deleteButton.addEventListener("click", () => deleteProject(project.id, card));
    }

    projectList.appendChild(node);
  }
}

async function loadProjects() {
  loadError.classList.add("hidden");

  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (currentStatus) params.set("status", currentStatus);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`/api/admin/projects${qs}`, { credentials: "include" });

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
  renderProjects(result.projects);
}

async function updateStatus(id, status, selectEl) {
  selectEl.disabled = true;
  try {
    const response = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!response.ok) {
      alert("ステータスの更新に失敗しました。");
    }
  } finally {
    selectEl.disabled = currentRole !== "admin";
  }
}

async function deleteProject(id, cardEl) {
  if (!confirm("この案件を削除しますか?添付ファイルもすべて削除され、取り消せません。")) return;

  const response = await fetch(`/api/admin/projects/${id}`, {
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

newProjectButton.addEventListener("click", () => {
  createForm.classList.toggle("hidden");
});

cancelCreateButton.addEventListener("click", () => {
  createForm.reset();
  createError.classList.add("hidden");
  createForm.classList.add("hidden");
});

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  createError.classList.add("hidden");

  const formData = new FormData(createForm);
  const body = {
    title: formData.get("title"),
    customer_name: formData.get("customer_name"),
    customer_email: formData.get("customer_email"),
    status: formData.get("status"),
    memo: formData.get("memo"),
  };

  const submitButton = createForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/admin/projects", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const result = await response.json();
    if (result.success) {
      createForm.reset();
      createForm.classList.add("hidden");
      await loadProjects();
    } else {
      createError.textContent = result.message || "作成に失敗しました。";
      createError.classList.remove("hidden");
    }
  } catch {
    createError.textContent = "通信に失敗しました。時間をおいて再度お試しください。";
    createError.classList.remove("hidden");
  } finally {
    submitButton.disabled = false;
  }
});

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => loadProjects(), 300);
});

statusFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");
  if (!button) return;

  currentStatus = button.dataset.status;
  statusFilters.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("is-active"));
  button.classList.add("is-active");
  loadProjects();
});

(async function init() {
  statusFilters.querySelector('[data-status=""]').classList.add("is-active");

  const user = await initAdminChrome();
  if (!user) return;

  currentRole = user.role;
  roleNotice.classList.toggle("hidden", currentRole === "admin");
  newProjectButton.classList.toggle("hidden", currentRole !== "admin");

  await loadProjects();
})();
