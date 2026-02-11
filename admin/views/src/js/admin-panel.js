let activeCategory = null;
let currentItems = [];
let editingItemId = null;

const categoriesList = document.getElementById("categoriesList");
const itemsTableWrap = document.getElementById("itemsTableWrap");
const editorTitle = document.getElementById("editorTitle");
const addItemBtn = document.getElementById("addItemBtn");
const addAdBtn = document.getElementById("addAdBtn");

const itemModal = document.getElementById("itemModal");
const itemModalTitle = document.getElementById("itemModalTitle");
const fieldRows = document.getElementById("fieldRows");
const addFieldBtn = document.getElementById("addFieldBtn");
const itemSaveBtn = document.getElementById("itemSaveBtn");
const itemCancelBtn = document.getElementById("itemCancelBtn");

const adModal = document.getElementById("adModal");
const adSaveBtn = document.getElementById("adSaveBtn");
const adCancelBtn = document.getElementById("adCancelBtn");

const userSearchInput = document.getElementById("userSearchInput");
const userSearchBtn = document.getElementById("userSearchBtn");
const userSearchResults = document.getElementById("userSearchResults");

function notify(text) {
  // простой UI-feedback без внешних зависимостей
  console.log(text);
}

async function apiGet(url) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiJson(url, method, body) {
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function itemSummary(item) {
  if (!item || typeof item !== "object") return "";
  return (
    item.username ||
    item.title ||
    item.name ||
    item.theme ||
    item.usernameLink ||
    JSON.stringify(item).slice(0, 40)
  );
}

function inferType(value) {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

function createFieldRow(field = {}) {
  const row = document.createElement("div");
  row.className = "field-row";
  row.style.display = "grid";
  row.style.gridTemplateColumns = "1.2fr 0.7fr 1.7fr auto";
  row.style.gap = "8px";
  row.style.alignItems = "center";

  const keyInput = document.createElement("input");
  keyInput.className = "input";
  keyInput.placeholder = "Поле";
  keyInput.value = field.key || "";
  keyInput.dataset.role = "field-key";
  if (field.locked) keyInput.readOnly = true;

  const typeSelect = document.createElement("select");
  typeSelect.className = "select";
  typeSelect.dataset.role = "field-type";
  typeSelect.innerHTML = `
    <option value="string">string</option>
    <option value="number">number</option>
    <option value="boolean">boolean</option>
  `;
  typeSelect.value = field.type || "string";
  if (field.locked) typeSelect.disabled = true;

  const valueWrap = document.createElement("div");
  valueWrap.dataset.role = "value-wrap";

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn";
  removeBtn.type = "button";
  removeBtn.textContent = "Удалить";
  removeBtn.dataset.role = "field-remove";
  if (field.locked) removeBtn.disabled = true;

  function renderValueInput() {
    valueWrap.innerHTML = "";
    const type = typeSelect.value;
    if (type === "boolean") {
      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "8px";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.role = "field-value-bool";
      checkbox.checked = Boolean(field.value);
      checkbox.disabled = Boolean(field.locked);
      label.appendChild(checkbox);
      const text = document.createElement("span");
      text.className = "muted";
      text.textContent = "true / false";
      label.appendChild(text);
      valueWrap.appendChild(label);
    } else {
      const input = document.createElement("input");
      input.className = "input";
      input.type = type === "number" ? "number" : "text";
      input.dataset.role = "field-value";
      input.value = field.value == null ? "" : String(field.value);
      if (field.locked) input.readOnly = true;
      valueWrap.appendChild(input);
    }
  }

  typeSelect.addEventListener("change", renderValueInput);
  renderValueInput();

  row.appendChild(keyInput);
  row.appendChild(typeSelect);
  row.appendChild(valueWrap);
  row.appendChild(removeBtn);
  return row;
}

function fillFormFromItem(item) {
  fieldRows.innerHTML = "";
  Object.entries(item || {}).forEach(([key, value]) => {
    if (value && typeof value === "object") return;
    fieldRows.appendChild(
      createFieldRow({
        key,
        type: inferType(value),
        value,
        locked: key === "id" && editingItemId !== null,
      })
    );
  });
  if (!fieldRows.children.length) {
    fieldRows.appendChild(createFieldRow());
  }
}

function readItemFromForm() {
  const rows = Array.from(fieldRows.querySelectorAll(".field-row"));
  const result = {};
  for (const row of rows) {
    const key = row.querySelector('[data-role="field-key"]').value.trim();
    const type = row.querySelector('[data-role="field-type"]').value;
    if (!key) continue;

    if (type === "boolean") {
      const checked = row.querySelector('[data-role="field-value-bool"]').checked;
      result[key] = checked;
      continue;
    }

    const raw = row.querySelector('[data-role="field-value"]').value;
    if (type === "number") {
      result[key] = raw === "" ? 0 : Number(raw);
    } else {
      result[key] = raw;
    }
  }
  return result;
}

function renderItemsTable() {
  if (!activeCategory) {
    itemsTableWrap.innerHTML = `<p class="muted">Сначала выберите категорию.</p>`;
    return;
  }

  const rows = currentItems
    .map((item) => {
      const id = String(item.id ?? "");
      const summary = itemSummary(item);
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #262626;font-family:monospace;">${id}</td>
          <td style="padding:8px;border-bottom:1px solid #262626;">${summary}</td>
          <td style="padding:8px;border-bottom:1px solid #262626;white-space:nowrap;">
            <button class="btn" data-action="edit" data-id="${id}">Редактировать</button>
            <button class="btn" data-action="delete" data-id="${id}">Удалить</button>
          </td>
        </tr>
      `;
    })
    .join("");

  itemsTableWrap.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #262626;">ID</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #262626;">Кратко</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #262626;">Действия</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="3" style="padding:12px;" class="muted">Пусто</td></tr>`}</tbody>
    </table>
  `;
}

async function loadCategories() {
  const data = await apiGet("/admin/api/categories");
  const categories = data.categories || [];
  categoriesList.innerHTML = categories
    .map(
      (c) => `
      <button class="btn" data-category="${c.name}">
        ${c.name} (${c.count})
      </button>
    `
    )
    .join("");
}

async function loadCategoryItems(category) {
  activeCategory = category;
  editorTitle.textContent = `Категория: ${category}`;
  addAdBtn.style.display = category === "ads" ? "inline-block" : "none";
  const data = await apiGet(`/admin/api/categories/${encodeURIComponent(category)}/items`);
  currentItems = data.items || [];
  renderItemsTable();
}

function openItemModal(title, item) {
  itemModalTitle.textContent = title;
  fillFormFromItem(item || {});
  itemModal.showModal();
}

async function saveItemModal() {
  if (!activeCategory) return;
  const parsed = readItemFromForm();
  if (!parsed.id && editingItemId) {
    parsed.id = editingItemId;
  }
  if (!parsed.id && activeCategory !== "ads") {
    alert("Укажите поле id");
    return;
  }

  if (editingItemId) {
    await apiJson(
      `/admin/api/categories/${encodeURIComponent(activeCategory)}/items/${encodeURIComponent(editingItemId)}`,
      "PUT",
      { item: parsed }
    );
    notify("Элемент обновлен");
  } else {
    await apiJson(`/admin/api/categories/${encodeURIComponent(activeCategory)}/items`, "POST", {
      item: parsed,
    });
    notify("Элемент добавлен");
  }
  itemModal.close();
  editingItemId = null;
  await loadCategoryItems(activeCategory);
  await loadCategories();
}

async function deleteItem(id) {
  if (!activeCategory) return;
  if (!confirm("Удалить элемент?")) return;
  await apiJson(
    `/admin/api/categories/${encodeURIComponent(activeCategory)}/items/${encodeURIComponent(id)}`,
    "DELETE",
    {}
  );
  notify("Элемент удален");
  await loadCategoryItems(activeCategory);
  await loadCategories();
}

function openAddAdModal() {
  adModal.showModal();
}

function readManualAd() {
  const now = new Date().toISOString().slice(0, 10);
  return {
    adType: document.getElementById("adType").value || "post_in_channel",
    channelOrChatLink: document.getElementById("adChannelLink").value.trim(),
    imageUrl: null,
    verified: !!document.getElementById("adVerified").checked,
    username: document.getElementById("adUsername").value.trim(),
    price: Number(document.getElementById("adPrice").value || 0),
    pinned: !!document.getElementById("adPinned").checked,
    underGuarantee: !!document.getElementById("adGuarantee").checked,
    publishTime: document.getElementById("adPublishTime").value.trim() || "день",
    postDuration: document.getElementById("adPostDuration").value.trim() || "24 часа",
    paymentMethod: document.getElementById("adPayment").value || "crypto",
    theme: document.getElementById("adTheme").value.trim(),
    description: document.getElementById("adDescription").value.trim(),
    publishedAt: now,
  };
}

async function saveManualAd() {
  const ad = readManualAd();
  if (!ad.username || !ad.channelOrChatLink) {
    alert("Заполните минимум username и ссылку");
    return;
  }
  await apiJson(`/admin/api/categories/ads/items`, "POST", { item: ad });
  adModal.close();
  notify("Объявление добавлено");
  if (activeCategory === "ads") await loadCategoryItems("ads");
  await loadCategories();
}

async function doUserSearch() {
  const q = userSearchInput.value.trim();
  if (q.length < 2) {
    userSearchResults.innerHTML = `<p class="muted" style="margin:0;">Введите минимум 2 символа.</p>`;
    return;
  }
  const res = await apiGet(`/admin/api/search/users?q=${encodeURIComponent(q)}`);
  const rows = (res.results || [])
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #262626;">${r.category}</td>
        <td style="padding:8px;border-bottom:1px solid #262626;font-family:monospace;">${r.id ?? ""}</td>
        <td style="padding:8px;border-bottom:1px solid #262626;">${r.username || ""}</td>
        <td style="padding:8px;border-bottom:1px solid #262626;">${r.usernameLink || ""}</td>
      </tr>
    `
    )
    .join("");
  userSearchResults.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #262626;">Категория</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #262626;">ID</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #262626;">Username</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #262626;">Username link</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="4" style="padding:8px;" class="muted">Ничего не найдено</td></tr>`}</tbody>
    </table>
  `;
}

document.addEventListener("click", async (e) => {
  const catBtn = e.target.closest("[data-category]");
  if (catBtn) {
    await loadCategoryItems(catBtn.dataset.category);
    return;
  }

  const actionBtn = e.target.closest("[data-action]");
  if (actionBtn) {
    const id = actionBtn.dataset.id;
    if (actionBtn.dataset.action === "edit") {
      const item = currentItems.find((x) => String(x.id) === String(id));
      if (!item) return;
      editingItemId = id;
      openItemModal(`Редактирование ID: ${id}`, item);
    }
    if (actionBtn.dataset.action === "delete") {
      await deleteItem(id);
    }
  }
});

addItemBtn.addEventListener("click", () => {
  if (!activeCategory) return alert("Сначала выберите категорию");
  editingItemId = null;
  openItemModal("Новый элемент", { id: "" });
});
addAdBtn.addEventListener("click", openAddAdModal);
itemSaveBtn.addEventListener("click", saveItemModal);
itemCancelBtn.addEventListener("click", () => itemModal.close());
adSaveBtn.addEventListener("click", saveManualAd);
adCancelBtn.addEventListener("click", () => adModal.close());
addFieldBtn.addEventListener("click", () => fieldRows.appendChild(createFieldRow()));
fieldRows.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-role="field-remove"]');
  if (btn) {
    btn.closest(".field-row")?.remove();
    if (!fieldRows.children.length) fieldRows.appendChild(createFieldRow());
  }
});
userSearchBtn.addEventListener("click", doUserSearch);
userSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doUserSearch();
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
});
