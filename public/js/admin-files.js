const roleNotice = document.getElementById("role-notice");
const uploadSection = document.getElementById("upload-section");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadStatus = document.getElementById("upload-status");
const searchInput = document.getElementById("search-input");
const loadError = document.getElementById("load-error");
const emptyMessage = document.getElementById("empty-message");
const fileGrid = document.getElementById("file-grid");
const cardTemplate = document.getElementById("file-card-template");

let currentRole = null;
let searchDebounceTimer = null;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value) {
  try {
    return new Date(value.replace(" ", "T") + "Z").toLocaleDateString("ja-JP");
  } catch {
    return value;
  }
}

function renderFiles(files) {
  fileGrid.innerHTML = "";
  emptyMessage.classList.toggle("hidden", files.length > 0);

  for (const file of files) {
    const node = cardTemplate.content.cloneNode(true);
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
    const uploader = file.uploaded_by_email ? ` ・ ${file.uploaded_by_email}` : "";
    node.querySelector('[data-field="meta"]').textContent =
      `${formatSize(file.size)} ・ ${formatDate(file.created_at)}${uploader}`;

    const openLink = node.querySelector('[data-field="open-link"]');
    openLink.href = file.url;

    const copyButton = node.querySelector('[data-field="copy-button"]');
    copyButton.addEventListener("click", () => copyUrl(file.url, copyButton));

    const deleteButton = node.querySelector('[data-field="delete-button"]');
    if (currentRole === "admin") {
      deleteButton.classList.remove("hidden");
      deleteButton.addEventListener("click", () => deleteFile(file.id, card));
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

async function deleteFile(id, cardEl) {
  if (!confirm("このファイルを削除しますか?この操作は取り消せません。")) return;

  const response = await fetch(`/api/admin/files/${id}`, {
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

async function loadFiles(query = "") {
  loadError.classList.add("hidden");
  const q = query ? `?q=${encodeURIComponent(query)}` : "";

  const response = await fetch(`/api/admin/files${q}`, { credentials: "include" });

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
  renderFiles(result.files);
}

async function uploadFile(file) {
  if (!file) return;

  uploadStatus.classList.remove("hidden");
  uploadStatus.className = "mt-3 text-sm text-slate-500";
  uploadStatus.textContent = `アップロード中: ${file.name}`;

  const formData = new FormData();
  formData.append("file", file);

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
      await loadFiles(searchInput.value.trim());
    } else {
      uploadStatus.className = "mt-3 text-sm text-red-600";
      uploadStatus.textContent = result.message || "アップロードに失敗しました。";
    }
  } catch {
    uploadStatus.className = "mt-3 text-sm text-red-600";
    uploadStatus.textContent = "通信に失敗しました。時間をおいて再度お試しください。";
  }
}

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

searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadFiles(searchInput.value.trim());
  }, 300);
});

(async function init() {
  const user = await initAdminChrome();
  if (!user) return;

  currentRole = user.role;
  roleNotice.classList.toggle("hidden", currentRole === "admin");
  uploadSection.classList.toggle("hidden", currentRole !== "admin");

  await loadFiles();
})();
