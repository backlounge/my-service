const form = document.getElementById("settings-form");
const forbiddenMessage = document.getElementById("forbidden-message");
const loadError = document.getElementById("load-error");
const saveStatus = document.getElementById("save-status");
const groupTemplate = document.getElementById("field-group-template");
const textTemplate = document.getElementById("field-text-template");
const textareaTemplate = document.getElementById("field-textarea-template");

function buildForm(fields, values) {
  form.innerHTML = "";

  const groups = new Map();
  for (const field of fields) {
    if (!groups.has(field.group)) groups.set(field.group, []);
    groups.get(field.group).push(field);
  }

  for (const [groupName, groupFields] of groups) {
    const groupNode = groupTemplate.content.cloneNode(true);
    groupNode.querySelector('[data-field="group-title"]').textContent = groupName;
    const container = groupNode.querySelector('[data-field="fields"]');

    for (const field of groupFields) {
      const template = field.type === "textarea" ? textareaTemplate : textTemplate;
      const fieldNode = template.content.cloneNode(true);
      fieldNode.querySelector('[data-field="label"]').textContent = field.label;
      const input = fieldNode.querySelector('[data-field="input"]');
      input.name = field.key;
      input.maxLength = field.maxLength || 500;
      input.value = values[field.key] || "";
      container.appendChild(fieldNode);
    }

    form.appendChild(groupNode);
  }

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "btn-primary";
  submitButton.textContent = "保存する";
  form.appendChild(submitButton);

  form.classList.remove("hidden");
}

async function loadSettings() {
  const response = await fetch("/api/admin/settings", { credentials: "include" });

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return;
  }
  if (response.status === 403) {
    forbiddenMessage.classList.remove("hidden");
    return;
  }
  if (!response.ok) {
    loadError.textContent = "読み込みに失敗しました。時間をおいて再度お試しください。";
    loadError.classList.remove("hidden");
    return;
  }

  const result = await response.json();
  buildForm(result.fields, result.values);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveStatus.classList.add("hidden");

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const values = {};
  form.querySelectorAll("[name]").forEach((input) => {
    values[input.name] = input.value;
  });

  try {
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });

    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const result = await response.json();
    if (result.success) {
      saveStatus.textContent = "保存しました。トップページに反映されています。";
      saveStatus.className = "mt-4 text-sm text-brand-700";
    } else {
      saveStatus.textContent = result.message || "保存に失敗しました。";
      saveStatus.className = "mt-4 text-sm text-red-600";
    }
  } catch {
    saveStatus.textContent = "通信に失敗しました。時間をおいて再度お試しください。";
    saveStatus.className = "mt-4 text-sm text-red-600";
  } finally {
    saveStatus.classList.remove("hidden");
    submitButton.disabled = false;
  }
});

(async function init() {
  const user = await initAdminChrome();
  if (user) {
    await loadSettings();
  }
})();
