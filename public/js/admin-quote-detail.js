const quoteId = new URLSearchParams(window.location.search).get("id");

const loadError = document.getElementById("load-error");
const detailContent = document.getElementById("detail-content");

const quoteNumberHeading = document.getElementById("quote-number-heading");
const quoteProjectLine = document.getElementById("quote-project-line");
const pdfViewLink = document.getElementById("pdf-view-link");
const pdfDownloadLink = document.getElementById("pdf-download-link");
const duplicateButton = document.getElementById("duplicate-button");
const deleteButton = document.getElementById("delete-button");

const fieldStatus = document.getElementById("field-status");
const fieldQuoteDate = document.getElementById("field-quote-date");
const fieldValidUntil = document.getElementById("field-valid-until");
const fieldAssignee = document.getElementById("field-assignee");

const addItemButton = document.getElementById("add-item-button");
const itemRows = document.getElementById("item-rows");
const itemRowTemplate = document.getElementById("item-row-template");
const calcSubtotal = document.getElementById("calc-subtotal");
const calcTax = document.getElementById("calc-tax");
const calcTotal = document.getElementById("calc-total");
const saveButton = document.getElementById("save-button");
const saveStatus = document.getElementById("save-status");

const uploadSection = document.getElementById("upload-section");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadStatus = document.getElementById("upload-status");
const filesEmpty = document.getElementById("files-empty");
const fileGrid = document.getElementById("file-grid");
const fileCardTemplate = document.getElementById("file-card-template");

const versionList = document.getElementById("version-list");
const versionItemTemplate = document.getElementById("version-item-template");

let currentRole = null;
let items = [];

function formatYen(amount) {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function calculateLineAmount(item) {
  return Math.round((Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount) || 0));
}

function calculateTotals() {
  let subtotal = 0;
  const byRate = new Map();
  for (const item of items) {
    const amount = calculateLineAmount(item);
    subtotal += amount;
    const rate = Number(item.tax_rate) || 0;
    byRate.set(rate, (byRate.get(rate) || 0) + amount);
  }
  let tax = 0;
  for (const [rate, groupSubtotal] of byRate) {
    tax += Math.round(groupSubtotal * (rate / 100));
  }
  return { subtotal, tax, total: subtotal + tax };
}

function updateCalcDisplay() {
  const totals = calculateTotals();
  calcSubtotal.textContent = formatYen(totals.subtotal);
  calcTax.textContent = formatYen(totals.tax);
  calcTotal.textContent = formatYen(totals.total);
}

function renderItemRows() {
  itemRows.innerHTML = "";

  items.forEach((item, index) => {
    const node = itemRowTemplate.content.cloneNode(true);
    const row = node.querySelector("tr");

    for (const key of ["product_name", "quantity", "unit", "unit_price", "discount", "tax_rate", "note"]) {
      const input = row.querySelector(`[data-field="${key}"]`);
      input.value = item[key] ?? "";
      input.disabled = currentRole !== "admin";
      input.addEventListener("input", () => {
        item[key] = input.value;
        row.querySelector('[data-field="amount"]').textContent = formatYen(calculateLineAmount(item));
        updateCalcDisplay();
      });
    }

    row.querySelector('[data-field="amount"]').textContent = formatYen(calculateLineAmount(item));

    const upButton = row.querySelector('[data-action="move-up"]');
    const downButton = row.querySelector('[data-action="move-down"]');
    const removeButton = row.querySelector('[data-action="remove"]');

    if (currentRole === "admin") {
      upButton.addEventListener("click", () => {
        if (index === 0) return;
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
        renderItemRows();
        updateCalcDisplay();
      });
      downButton.addEventListener("click", () => {
        if (index === items.length - 1) return;
        [items[index + 1], items[index]] = [items[index], items[index + 1]];
        renderItemRows();
        updateCalcDisplay();
      });
      removeButton.addEventListener("click", () => {
        items.splice(index, 1);
        renderItemRows();
        updateCalcDisplay();
      });
    } else {
      upButton.classList.add("hidden");
      downButton.classList.add("hidden");
      removeButton.classList.add("hidden");
    }

    itemRows.appendChild(node);
  });
}

async function loadQuote() {
  loadError.classList.add("hidden");

  const response = await fetch(`/api/admin/quotes/${quoteId}`, { credentials: "include" });

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
  const quote = result.quote;

  quoteNumberHeading.textContent = quote.quote_number;
  quoteProjectLine.textContent = `案件: ${quote.project_title} ・ 顧客: ${quote.customer_name}`;
  pdfViewLink.href = `/api/admin/quotes/${quoteId}/pdf`;
  pdfDownloadLink.href = `/api/admin/quotes/${quoteId}/pdf?download=1`;

  fieldStatus.value = quote.status;
  fieldQuoteDate.value = quote.quote_date || "";
  fieldValidUntil.value = quote.valid_until || "";
  fieldAssignee.value = quote.assignee || "";

  items = result.items.map((item) => ({ ...item }));
  renderItemRows();
  updateCalcDisplay();

  detailContent.classList.remove("hidden");
}

async function loadVersions() {
  const response = await fetch(`/api/admin/quotes/${quoteId}/versions`, { credentials: "include" });
  if (!response.ok) return;

  const result = await response.json();
  versionList.innerHTML = "";

  for (const version of result.versions) {
    const node = versionItemTemplate.content.cloneNode(true);
    node.querySelector('[data-field="label"]').textContent = `version ${version.version_number}`;
    const date = new Date(version.created_at.replace(" ", "T") + "Z").toLocaleString("ja-JP");
    node.querySelector('[data-field="meta"]').textContent =
      `${date}${version.created_by_email ? " ・ " + version.created_by_email : ""}`;

    const restoreButton = node.querySelector('[data-field="restore-button"]');
    if (currentRole === "admin") {
      restoreButton.classList.remove("hidden");
      restoreButton.addEventListener("click", () => restoreVersion(version.version_number));
    }

    versionList.appendChild(node);
  }
}

async function restoreVersion(versionNumber) {
  if (!confirm(`version ${versionNumber} の内容に復元しますか?現在の内容は新しいバージョンとして履歴に残ります。`)) return;

  const response = await fetch(`/api/admin/quotes/${quoteId}/versions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version_number: versionNumber }),
  });

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }
  if (!response.ok) {
    alert("復元に失敗しました。");
    return;
  }

  await loadQuote();
  await loadVersions();
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

async function loadFiles() {
  const response = await fetch(`/api/admin/files?quote_id=${quoteId}`, { credentials: "include" });
  if (!response.ok) return;
  const result = await response.json();
  renderFiles(result.files);
}

async function deleteFile(fileId, cardEl) {
  if (!confirm("この添付ファイルを削除しますか?")) return;

  const response = await fetch(`/api/admin/files/${fileId}`, { method: "DELETE", credentials: "include" });
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
  formData.append("quote_id", quoteId);

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
      await loadFiles();
    } else {
      uploadStatus.className = "mt-3 text-sm text-red-600";
      uploadStatus.textContent = result.message || "アップロードに失敗しました。";
    }
  } catch {
    uploadStatus.className = "mt-3 text-sm text-red-600";
    uploadStatus.textContent = "通信に失敗しました。時間をおいて再度お試しください。";
  }
}

addItemButton.addEventListener("click", () => {
  items.push({ product_name: "", quantity: 1, unit: "式", unit_price: 0, discount: 0, tax_rate: 10, note: "" });
  renderItemRows();
  updateCalcDisplay();
});

saveButton.addEventListener("click", async () => {
  saveStatus.classList.add("hidden");
  saveButton.disabled = true;

  const body = {
    status: fieldStatus.value,
    quote_date: fieldQuoteDate.value,
    valid_until: fieldValidUntil.value,
    assignee: fieldAssignee.value,
    items,
  };

  try {
    const response = await fetch(`/api/admin/quotes/${quoteId}`, {
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
      items = result.items.map((item) => ({ ...item }));
      renderItemRows();
      updateCalcDisplay();
      await loadVersions();
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

duplicateButton.addEventListener("click", async () => {
  duplicateButton.disabled = true;
  try {
    const response = await fetch(`/api/admin/quotes/${quoteId}/duplicate`, {
      method: "POST",
      credentials: "include",
    });
    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const result = await response.json();
    if (result.success) {
      window.location.href = `/admin/quote-detail?id=${result.quote.id}`;
    } else {
      alert(result.message || "複製に失敗しました。");
    }
  } finally {
    duplicateButton.disabled = false;
  }
});

deleteButton.addEventListener("click", async () => {
  if (!confirm("この見積を削除しますか?添付ファイルもすべて削除され、取り消せません。")) return;

  const response = await fetch(`/api/admin/quotes/${quoteId}`, { method: "DELETE", credentials: "include" });
  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }
  if (!response.ok) {
    alert("削除に失敗しました。");
    return;
  }
  window.location.href = "/admin/quotes";
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
  if (!quoteId) {
    loadError.textContent = "見積IDが指定されていません。";
    loadError.classList.remove("hidden");
    return;
  }

  const user = await initAdminChrome();
  if (!user) return;

  currentRole = user.role;
  fieldStatus.disabled = currentRole !== "admin";
  fieldQuoteDate.disabled = currentRole !== "admin";
  fieldValidUntil.disabled = currentRole !== "admin";
  fieldAssignee.disabled = currentRole !== "admin";
  addItemButton.classList.toggle("hidden", currentRole !== "admin");
  saveButton.classList.toggle("hidden", currentRole !== "admin");
  duplicateButton.classList.toggle("hidden", currentRole !== "admin");
  deleteButton.classList.toggle("hidden", currentRole !== "admin");
  uploadSection.classList.toggle("hidden", currentRole !== "admin");

  await loadQuote();
  await loadVersions();
  await loadFiles();
})();
