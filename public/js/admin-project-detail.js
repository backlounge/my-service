const projectId = new URLSearchParams(window.location.search).get("id");

const loadError = document.getElementById("load-error");
const detailContent = document.getElementById("detail-content");
const editForm = document.getElementById("edit-form");
const saveButton = document.getElementById("save-button");
const saveStatus = document.getElementById("save-status");
const deleteButton = document.getElementById("delete-button");

const uploadSection = document.getElementById("upload-section");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadStatus = document.getElementById("upload-status");
const filesEmpty = document.getElementById("files-empty");
const fileGrid = document.getElementById("file-grid");
const fileCardTemplate = document.getElementById("file-card-template");

let currentRole = null;

function setFormDisabled(disabled) {
  for (const el of editForm.elements) {
    el.disabled = disabled;
  }
}

function renderFiles(files) {
  fileGrid.innerHTML = "";
  filesEmpty.classList.toggle("hidden", files.length > 0);

  for (const file of files) {
    const node = fileCardTemplate.content.cloneNode(true);
    const card = node.querySelector("[data-id]");
    card.dataset.id = file.id;

    const isImage = file.mime_type.startsWith("image/");
    const isPdf = file.mime_type === "application/pdf";

    if (isImage) {
      const img = node.querySelector('[data-field="thumb-img"]');
      img.src = file.url;
      img.alt = file.original_name;
      img.classList.remove("hidden");
    } else if (isPdf) {
      node.querySelector('[data-field="icon-pdf"]').classList.remove("hidden");
    } else {
      node.querySelector('[data-field="icon-file"]').classList.remove("hidden");
    }

    node.querySelector('[data-field="name"]').textContent = file.original_name;

    const openLink = node.querySelector('[data-field="open-link"]');
    openLink.href = file.url;

    const copyButton = node.querySelector('[data-field="copy-button"]');
    copyButton.addEventListener("click", () => copyUrl(file.url, copyButton));

    const fileDeleteButton = node.querySelector('[data-field="delete-button"]');
    if (currentRole === "admin") {
      fileDeleteButton.classList.remove("hidden");
      fileDeleteButton.addEventListener("click", () => deleteFile(file.id, card));
    }

    fileGrid.appendChild(node);
  }
}

async function copyUrl(relativeUrl, button) {
  const absoluteUrl = new URL(relativeUrl, window.location.origin).toString();
  try {
    await navigator.clipboard.writeText(absoluteUrl);
    const original = button.textContent;
    button.textContent = "コピーしました";
    setTimeout(() => {
      button.textContent = original;
    }, 1500);
  } catch {
    alert(`コピーに失敗しました。手動でコピーしてください:\n${absoluteUrl}`);
  }
}

async function deleteFile(fileId, cardEl) {
  if (!confirm("この添付ファイルを削除しますか?")) return;

  const response = await fetch(`/api/admin/files/${fileId}`, {
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

async function uploadFile(file) {
  if (!file) return;

  uploadStatus.classList.remove("hidden");
  uploadStatus.className = "mt-3 text-sm text-slate-500";
  uploadStatus.textContent = `アップロード中: ${file.name}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("project_id", projectId);

  try {
    const response = await fetch("/api/admin/files", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const result = await response.json();

    if (result.success) {
      uploadStatus.className = "mt-3 text-sm text-brand-700";
      uploadStatus.textContent = `アップロードしました: ${file.name}`;
      await loadProject();
    } else {
      uploadStatus.className = "mt-3 text-sm text-red-600";
      uploadStatus.textContent = result.message || "アップロードに失敗しました。";
    }
  } catch {
    uploadStatus.className = "mt-3 text-sm text-red-600";
    uploadStatus.textContent = "通信に失敗しました。時間をおいて再度お試しください。";
  }
}

async function loadProject() {
  loadError.classList.add("hidden");

  const response = await fetch(`/api/admin/projects/${projectId}`, { credentials: "include" });

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    loadError.textContent = result.message || "読み込みに失敗しました。";
    loadError.classList.remove("hidden");
    return;
  }

  const result = await response.json();
  const project = result.project;

  editForm.elements.title.value = project.title;
  editForm.elements.customer_name.value = project.customer_name;
  editForm.elements.customer_email.value = project.customer_email || "";
  editForm.elements.status.value = project.status;
  editForm.elements.memo.value = project.memo || "";

  renderFiles(result.files);
  detailContent.classList.remove("hidden");
}

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveStatus.classList.add("hidden");
  saveButton.disabled = true;

  const body = {
    title: editForm.elements.title.value,
    customer_name: editForm.elements.customer_name.value,
    customer_email: editForm.elements.customer_email.value,
    status: editForm.elements.status.value,
    memo: editForm.elements.memo.value,
  };

  try {
    const response = await fetch(`/api/admin/projects/${projectId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const result = await response.json();
    saveStatus.classList.remove("hidden");
    if (result.success) {
      saveStatus.className = "text-sm text-brand-700";
      saveStatus.textContent = "保存しました。";
    } else {
      saveStatus.className = "text-sm text-red-600";
      saveStatus.textContent = result.message || "保存に失敗しました。";
    }
  } catch {
    saveStatus.classList.remove("hidden");
    saveStatus.className = "text-sm text-red-600";
    saveStatus.textContent = "通信に失敗しました。時間をおいて再度お試しください。";
  } finally {
    saveButton.disabled = false;
  }
});

deleteButton.addEventListener("click", async () => {
  if (!confirm("この案件を削除しますか?添付ファイルもすべて削除され、取り消せません。")) return;

  const response = await fetch(`/api/admin/projects/${projectId}`, {
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

  window.location.href = "/admin/projects";
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  uploadFile(file);
  fileInput.value = "";
});

["dragover", "dragenter"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("border-brand-400", "bg-brand-50");
  });
});

["dragleave", "dragend"].forEach((eventName) => {
  dropZone.addEventListener(eventName, () => {
    dropZone.classList.remove("border-brand-400", "bg-brand-50");
  });
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("border-brand-400", "bg-brand-50");
  const file = event.dataTransfer.files[0];
  uploadFile(file);
});

(async function init() {
  if (!projectId) {
    loadError.textContent = "案件IDが指定されていません。";
    loadError.classList.remove("hidden");
    return;
  }

  const user = await initAdminChrome();
  if (!user) return;

  currentRole = user.role;
  setFormDisabled(currentRole !== "admin");
  saveButton.classList.toggle("hidden", currentRole !== "admin");
  deleteButton.classList.toggle("hidden", currentRole !== "admin");
  uploadSection.classList.toggle("hidden", currentRole !== "admin");

  await loadProject();
})();
