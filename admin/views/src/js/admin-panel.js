let activeTab = "home";
let activeCategory = null;
let currentItems = [];
let editingItemId = null;
let editingItemDraft = null;
let isAdvancedAdsEdit = false;
let mainPageConfig = { hotOffers: { offers: [] }, news: { channelUrl: "" } };
let guarantConfig = { guarantor: {}, commissionTiers: [], aboutText: "" };
let editingHotOfferIndex = null;
const DEBUG_MODAL = true;

const CATEGORY_LABELS = {
  ads: "Продам рекламу",
  buyAds: "Куплю рекламу",
  buyChannels: "Куплю канал",
  sellChannels: "Продам канал",
  services: "Услуги",
  jobs: "Вакансии",
  other: "Прочее",
};

const tabButtons = Array.from(document.querySelectorAll("[data-tab-btn]"));
const tabViews = Array.from(document.querySelectorAll(".tab-view"));

const kpiUsersCount = document.getElementById("kpiUsersCount");
const kpiActiveAdsTotal = document.getElementById("kpiActiveAdsTotal");
const kpiUpdatedAt = document.getElementById("kpiUpdatedAt");
const refreshKpiBtn = document.getElementById("refreshKpiBtn");

const newsChannelUrlInput = document.getElementById("newsChannelUrlInput");
const saveMainPageBtn = document.getElementById("saveMainPageBtn");
const hotOffersTableWrap = document.getElementById("hotOffersTableWrap");
const addHotOfferBtn = document.getElementById("addHotOfferBtn");

const hotOfferModal = document.getElementById("hotOfferModal");
const hotOfferModalTitle = document.getElementById("hotOfferModalTitle");
const hotOfferTitleInput = document.getElementById("hotOfferTitleInput");
const hotOfferPriceInput = document.getElementById("hotOfferPriceInput");
const hotOfferSubtitleInput = document.getElementById("hotOfferSubtitleInput");
const hotOfferCancelBtn = document.getElementById("hotOfferCancelBtn");
const hotOfferSaveBtn = document.getElementById("hotOfferSaveBtn");

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
const toggleAdvancedEditBtn = document.getElementById("toggleAdvancedEditBtn");
const simpleAdEditor = document.getElementById("simpleAdEditor");
const advancedEditorSection = document.getElementById("advancedEditorSection");
const itemModalFallbackNote = document.getElementById("itemModalFallbackNote");

const simpleAdTheme = document.getElementById("simpleAdTheme");
const simpleAdPrice = document.getElementById("simpleAdPrice");
const simpleAdDescription = document.getElementById("simpleAdDescription");
const simpleAdUsername = document.getElementById("simpleAdUsername");
const simpleAdChannelLink = document.getElementById("simpleAdChannelLink");
const simpleAdType = document.getElementById("simpleAdType");
const simpleAdPayment = document.getElementById("simpleAdPayment");
const simpleAdPublishTime = document.getElementById("simpleAdPublishTime");
const simpleAdPostDuration = document.getElementById("simpleAdPostDuration");
const simpleAdVerified = document.getElementById("simpleAdVerified");
const simpleAdPinned = document.getElementById("simpleAdPinned");
const simpleAdUnderGuarantee = document.getElementById("simpleAdUnderGuarantee");

const adModal = document.getElementById("adModal");
const adSaveBtn = document.getElementById("adSaveBtn");
const adCancelBtn = document.getElementById("adCancelBtn");
const adModalFallbackNote = document.getElementById("adModalFallbackNote");

const userSearchInput = document.getElementById("userSearchInput");
const userSearchBtn = document.getElementById("userSearchBtn");
const userSearchResults = document.getElementById("userSearchResults");

const guarantProfileLinkInput = document.getElementById("guarantProfileLinkInput");
const guarantDisplayNameInput = document.getElementById("guarantDisplayNameInput");
const guarantUsernameInput = document.getElementById("guarantUsernameInput");
const guarantAboutTextInput = document.getElementById("guarantAboutTextInput");
const guarantConditionsInput = document.getElementById("guarantConditionsInput");
const saveGuarantBtn = document.getElementById("saveGuarantBtn");

function notify(text) {
  console.log(text);
}

function debugLog(scope, payload) {
  if (!DEBUG_MODAL) return;
  const timestamp = new Date().toISOString();
  console.log(`[admin-debug][${timestamp}][${scope}]`, payload);
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function isDialogSupported(dialogEl) {
  return Boolean(dialogEl && typeof dialogEl.showModal === "function" && typeof dialogEl.close === "function");
}

function ensureFallbackOverlay() {
  let overlay = document.getElementById("modalFallbackOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "modalFallbackOverlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.zIndex = "9998";
  overlay.style.display = "none";
  overlay.addEventListener("click", () => {
    debugLog("modalFallbackOverlay:click", { adModalOpen: Boolean(adModal?.open) });
    closeDialogSafe(adModal, adModalFallbackNote, { forceFallback: true });
  });
  document.body.appendChild(overlay);
  return overlay;
}

function toggleFallbackOverlay(show) {
  const overlay = ensureFallbackOverlay();
  overlay.style.display = show ? "block" : "none";
}

function isDialogActuallyVisible(dialogEl) {
  if (!dialogEl) return false;
  const rect = dialogEl.getBoundingClientRect();
  const styles = window.getComputedStyle(dialogEl);
  return (
    dialogEl.open &&
    styles.display !== "none" &&
    styles.visibility !== "hidden" &&
    Number(styles.opacity || "1") > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function applyForcedDialogVisibility(dialogEl, fallbackNoteEl) {
  if (!dialogEl) return;
  dialogEl.setAttribute("open", "");
  dialogEl.dataset.fallbackOpen = "1";
  dialogEl.style.position = "fixed";
  dialogEl.style.left = "50%";
  dialogEl.style.top = "50%";
  dialogEl.style.transform = "translate(-50%, -50%)";
  dialogEl.style.zIndex = "9999";
  dialogEl.style.display = "block";
  dialogEl.style.visibility = "visible";
  dialogEl.style.opacity = "1";
  dialogEl.style.pointerEvents = "auto";
  dialogEl.style.margin = "0";
  dialogEl.style.maxHeight = "90vh";
  dialogEl.style.overflow = "auto";
  if (fallbackNoteEl) fallbackNoteEl.style.display = "block";
  toggleFallbackOverlay(true);
}

function openDialogSafe(dialogEl, fallbackNoteEl, options = {}) {
  const forceFallback = Boolean(options.forceFallback);
  debugLog("openDialogSafe:start", {
    hasDialog: Boolean(dialogEl),
    dialogId: dialogEl?.id || null,
    currentlyOpen: Boolean(dialogEl?.open),
    hasFallbackNote: Boolean(fallbackNoteEl),
    supportsDialog: isDialogSupported(dialogEl),
    forceFallback,
  });
  if (!dialogEl) return;
  if (forceFallback) {
    applyForcedDialogVisibility(dialogEl, fallbackNoteEl);
    debugLog("openDialogSafe:forced-fallback-only", {
      dialogId: dialogEl.id,
      currentlyOpen: Boolean(dialogEl.open),
    });
    return;
  }

  if (isDialogSupported(dialogEl)) {
    try {
      // Reset any stale inline styles from previous fallback opens.
      dialogEl.style.display = "";
      dialogEl.style.visibility = "";
      dialogEl.style.opacity = "";
      dialogEl.style.pointerEvents = "";

      if (!dialogEl.open) dialogEl.showModal();
      if (fallbackNoteEl) fallbackNoteEl.style.display = "none";
      debugLog("openDialogSafe:showModal:success", {
        dialogId: dialogEl.id,
        currentlyOpen: Boolean(dialogEl.open),
      });

      // In some embedded/webview environments dialog reports "open"
      // but is not actually painted. Force fallback visibility if needed.
      if (!isDialogActuallyVisible(dialogEl)) {
        const rect = dialogEl.getBoundingClientRect();
        const styles = window.getComputedStyle(dialogEl);
        debugLog("openDialogSafe:showModal:not-visible", {
          dialogId: dialogEl.id,
          open: Boolean(dialogEl.open),
          rect: { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
          computed: {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            position: styles.position,
            zIndex: styles.zIndex,
          },
        });
        try {
          if (dialogEl.open) dialogEl.close();
        } catch (closeErr) {
          debugLog("openDialogSafe:showModal:not-visible:close-error", {
            dialogId: dialogEl.id,
            message: closeErr instanceof Error ? closeErr.message : String(closeErr),
          });
        }
        applyForcedDialogVisibility(dialogEl, fallbackNoteEl);
        debugLog("openDialogSafe:forced-visible:applied", {
          dialogId: dialogEl.id,
          open: Boolean(dialogEl.open),
        });
      }
      return;
    } catch (error) {
      console.error("showModal failed, fallback to non-modal open:", error);
      debugLog("openDialogSafe:showModal:error", {
        dialogId: dialogEl.id,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      });
      // Continue to fallback mode below.
    }
  }

  applyForcedDialogVisibility(dialogEl, fallbackNoteEl);
  debugLog("openDialogSafe:fallback:opened", {
    dialogId: dialogEl.id,
    currentlyOpen: Boolean(dialogEl.open),
    styleDisplay: dialogEl.style.display || null,
  });
}

function closeDialogSafe(dialogEl, fallbackNoteEl, options = {}) {
  const forceFallback = Boolean(options.forceFallback);
  debugLog("closeDialogSafe:start", {
    hasDialog: Boolean(dialogEl),
    dialogId: dialogEl?.id || null,
    currentlyOpen: Boolean(dialogEl?.open),
    supportsDialog: isDialogSupported(dialogEl),
    forceFallback,
  });
  if (!dialogEl) return;
  if (!forceFallback && isDialogSupported(dialogEl)) {
    try {
      if (dialogEl.open) dialogEl.close();
      if (fallbackNoteEl) fallbackNoteEl.style.display = "none";
      debugLog("closeDialogSafe:success", {
        dialogId: dialogEl.id,
        currentlyOpen: Boolean(dialogEl.open),
      });
      return;
    } catch (error) {
      console.error("dialog close failed, forcing fallback close:", error);
      debugLog("closeDialogSafe:error", {
        dialogId: dialogEl.id,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      });
      // Continue to fallback mode below.
    }
  }

  dialogEl.removeAttribute("open");
  delete dialogEl.dataset.fallbackOpen;
  dialogEl.style.display = "none";
  dialogEl.style.visibility = "";
  dialogEl.style.opacity = "";
  dialogEl.style.pointerEvents = "";
  dialogEl.style.margin = "";
  dialogEl.style.maxHeight = "";
  dialogEl.style.overflow = "";
  const hasFallbackDialogs = document.querySelector('dialog[data-fallback-open="1"]');
  if (!hasFallbackDialogs) toggleFallbackOverlay(false);
  if (fallbackNoteEl) fallbackNoteEl.style.display = "none";
  debugLog("closeDialogSafe:fallback:closed", {
    dialogId: dialogEl.id,
    currentlyOpen: Boolean(dialogEl.open),
    styleDisplay: dialogEl.style.display || null,
  });
}

async function loadDashboard() {
  const data = await apiGet("/admin/api/dashboard/main");
  kpiUsersCount.textContent = String(data.usersCount ?? 0);
  kpiActiveAdsTotal.textContent = String(data.activeAdsTotal ?? 0);
  kpiUpdatedAt.textContent = `Обновлено: ${new Date().toLocaleString("ru-RU")}`;
}

function renderHotOffersTable() {
  const offers = mainPageConfig?.hotOffers?.offers || [];
  const rows = offers
    .map(
      (offer, index) => `
      <tr>
        <td>${escapeHtml(offer.id || index + 1)}</td>
        <td>${escapeHtml(offer.title || "")}</td>
        <td>${escapeHtml(offer.price || "")}</td>
        <td>${escapeHtml(offer.subtitle || "")}</td>
        <td>
          <button class="btn" data-hot-action="edit" data-hot-index="${index}">Редактировать</button>
          <button class="btn" data-hot-action="delete" data-hot-index="${index}">Удалить</button>
        </td>
      </tr>
    `
    )
    .join("");

  hotOffersTableWrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Заголовок</th>
          <th>Цена</th>
          <th>Подзаголовок</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="5" class="muted">Пусто</td></tr>'}</tbody>
    </table>
  `;
}

async function loadMainPageConfig() {
  const data = await apiGet("/admin/api/config/main-page");
  mainPageConfig = data.payload || { hotOffers: { offers: [] }, news: { channelUrl: "" } };
  newsChannelUrlInput.value = mainPageConfig?.news?.channelUrl || "";
  renderHotOffersTable();
}

async function saveMainPageConfig() {
  const payload = {
    hotOffers: {
      offers: Array.isArray(mainPageConfig?.hotOffers?.offers) ? mainPageConfig.hotOffers.offers : [],
    },
    news: {
      channelUrl: newsChannelUrlInput.value.trim(),
    },
  };
  await apiJson("/admin/api/config/main-page", "PUT", { payload });
  notify("Главная страница обновлена");
  await loadMainPageConfig();
}

function openHotOfferModal(offer) {
  hotOfferModalTitle.textContent = editingHotOfferIndex == null ? "Новое горячее предложение" : "Редактирование предложения";
  hotOfferTitleInput.value = offer?.title || "";
  hotOfferPriceInput.value = offer?.price || "";
  hotOfferSubtitleInput.value = offer?.subtitle || "";
  openDialogSafe(hotOfferModal);
}

function saveHotOfferFromModal() {
  const title = hotOfferTitleInput.value.trim();
  const price = hotOfferPriceInput.value.trim();
  const subtitle = hotOfferSubtitleInput.value.trim();
  if (!title || !price) {
    alert("Заполните минимум заголовок и цену");
    return;
  }

  const offers = Array.isArray(mainPageConfig?.hotOffers?.offers) ? [...mainPageConfig.hotOffers.offers] : [];
  const record = {
    id: editingHotOfferIndex == null ? String(Date.now()) : String(offers[editingHotOfferIndex]?.id || Date.now()),
    title,
    price,
    subtitle,
  };

  if (editingHotOfferIndex == null) offers.push(record);
  else offers[editingHotOfferIndex] = record;

  mainPageConfig.hotOffers = { offers };
  closeDialogSafe(hotOfferModal);
  editingHotOfferIndex = null;
  renderHotOffersTable();
}

function deleteHotOffer(index) {
  if (!confirm("Удалить предложение?")) return;
  const offers = Array.isArray(mainPageConfig?.hotOffers?.offers) ? [...mainPageConfig.hotOffers.offers] : [];
  offers.splice(index, 1);
  mainPageConfig.hotOffers = { offers };
  renderHotOffersTable();
}

function itemSummary(item) {
  if (!item || typeof item !== "object") return "";
  return item.username || item.title || item.name || item.theme || item.usernameLink || JSON.stringify(item).slice(0, 40);
}

function inferType(value) {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

function fillSimpleAdForm(item) {
  const source = item || {};
  simpleAdTheme.value = source.theme || source.title || "";
  simpleAdPrice.value = source.price == null ? "" : String(source.price);
  simpleAdDescription.value = source.description || "";
  simpleAdUsername.value = source.username || "";
  simpleAdChannelLink.value = source.channelOrChatLink || "";
  simpleAdType.value = source.adType || "post_in_channel";
  simpleAdPayment.value = source.paymentMethod || "crypto";
  simpleAdPublishTime.value = source.publishTime || "";
  simpleAdPostDuration.value = source.postDuration || "";
  simpleAdVerified.checked = Boolean(source.verified);
  simpleAdPinned.checked = Boolean(source.pinned);
  simpleAdUnderGuarantee.checked = Boolean(source.underGuarantee);
}

function readSimpleAdForm(baseItem) {
  const base = { ...(baseItem || {}) };
  const value = {
    ...base,
    theme: simpleAdTheme.value.trim(),
    title: simpleAdTheme.value.trim(),
    price: Number(simpleAdPrice.value || 0),
    description: simpleAdDescription.value.trim(),
    username: simpleAdUsername.value.trim(),
    channelOrChatLink: simpleAdChannelLink.value.trim(),
    adType: simpleAdType.value || "post_in_channel",
    paymentMethod: simpleAdPayment.value || "crypto",
    publishTime: simpleAdPublishTime.value.trim(),
    postDuration: simpleAdPostDuration.value.trim(),
    verified: Boolean(simpleAdVerified.checked),
    pinned: Boolean(simpleAdPinned.checked),
    underGuarantee: Boolean(simpleAdUnderGuarantee.checked),
  };
  return value;
}

function setAdsEditMode(advanced) {
  isAdvancedAdsEdit = advanced;
  if (advanced) {
    simpleAdEditor.style.display = "none";
    advancedEditorSection.style.display = "";
    addFieldBtn.style.display = "";
    toggleAdvancedEditBtn.textContent = "Скрыть расширенное отображение";
    return;
  }
  simpleAdEditor.style.display = "";
  advancedEditorSection.style.display = "none";
  addFieldBtn.style.display = "none";
  toggleAdvancedEditBtn.textContent = "Показать расширенное отображение";
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
    fieldRows.appendChild(createFieldRow({ key, type: inferType(value), value, locked: key === "id" && editingItemId !== null }));
  });
  if (!fieldRows.children.length) fieldRows.appendChild(createFieldRow());
}

function readItemFromForm() {
  const rows = Array.from(fieldRows.querySelectorAll(".field-row"));
  const result = {};
  for (const row of rows) {
    const key = row.querySelector('[data-role="field-key"]').value.trim();
    const type = row.querySelector('[data-role="field-type"]').value;
    if (!key) continue;
    if (type === "boolean") {
      result[key] = row.querySelector('[data-role="field-value-bool"]').checked;
      continue;
    }
    const raw = row.querySelector('[data-role="field-value"]').value;
    result[key] = type === "number" ? (raw === "" ? 0 : Number(raw)) : raw;
  }
  return result;
}

function renderItemsTable() {
  if (!activeCategory) {
    itemsTableWrap.innerHTML = '<p class="muted">Сначала выберите категорию.</p>';
    return;
  }
  const rows = currentItems
    .map((item) => {
      const id = String(item.id ?? "");
      return `
        <tr>
          <td style="font-family:monospace;">${escapeHtml(id)}</td>
          <td>${escapeHtml(itemSummary(item))}</td>
          <td>
            <button class="btn" data-action="edit" data-id="${escapeHtml(id)}">Редактировать</button>
            <button class="btn" data-action="delete" data-id="${escapeHtml(id)}">Удалить</button>
          </td>
        </tr>
      `;
    })
    .join("");
  itemsTableWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>ID</th><th>Кратко</th><th>Действия</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="muted">Пусто</td></tr>'}</tbody>
    </table>
  `;
}

async function loadCategories() {
  const data = await apiGet("/admin/api/categories");
  const categories = data.categories || [];
  categoriesList.innerHTML = categories
    .map((c) => {
      const activeClass = c.name === activeCategory ? "btn-primary" : "";
      return `<button class="btn ${activeClass}" data-category="${c.name}">${getCategoryLabel(c.name)} (${c.count})</button>`;
    })
    .join("");
}

async function loadCategoryItems(category) {
  activeCategory = category;
  editorTitle.textContent = `Категория: ${getCategoryLabel(category)}`;
  addAdBtn.style.display = category === "ads" ? "inline-block" : "none";
  const data = await apiGet(`/admin/api/categories/${encodeURIComponent(category)}/items`);
  currentItems = data.items || [];
  await loadCategories();
  renderItemsTable();
}

function openItemModal(title, item) {
  itemModalTitle.textContent = title;
  editingItemDraft = { ...(item || {}) };
  const isAdsCategory = activeCategory === "ads";

  if (isAdsCategory) {
    toggleAdvancedEditBtn.style.display = "inline-block";
    fillSimpleAdForm(editingItemDraft);
    fillFormFromItem(editingItemDraft);
    setAdsEditMode(false);
  } else {
    toggleAdvancedEditBtn.style.display = "none";
    simpleAdEditor.style.display = "none";
    advancedEditorSection.style.display = "";
    addFieldBtn.style.display = "";
    fillFormFromItem(editingItemDraft);
  }

  openDialogSafe(itemModal, itemModalFallbackNote);
}

async function saveItemModal() {
  if (!activeCategory) return;
  const parsed =
    activeCategory === "ads" && !isAdvancedAdsEdit
      ? readSimpleAdForm(editingItemDraft || {})
      : readItemFromForm();
  if (!parsed.id && editingItemId) parsed.id = editingItemId;
  if (!parsed.id && activeCategory !== "ads") {
    alert("Укажите поле id");
    return;
  }
  if (editingItemId) {
    await apiJson(`/admin/api/categories/${encodeURIComponent(activeCategory)}/items/${encodeURIComponent(editingItemId)}`, "PUT", { item: parsed });
  } else {
    await apiJson(`/admin/api/categories/${encodeURIComponent(activeCategory)}/items`, "POST", { item: parsed });
  }
  closeDialogSafe(itemModal, itemModalFallbackNote);
  editingItemId = null;
  editingItemDraft = null;
  await loadCategoryItems(activeCategory);
  await loadCategories();
  await loadDashboard();
}

async function deleteItem(id) {
  if (!activeCategory || !confirm("Удалить элемент?")) return;
  await apiJson(`/admin/api/categories/${encodeURIComponent(activeCategory)}/items/${encodeURIComponent(id)}`, "DELETE", {});
  await loadCategoryItems(activeCategory);
  await loadCategories();
  await loadDashboard();
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
  await apiJson("/admin/api/categories/ads/items", "POST", { item: ad });
  closeDialogSafe(adModal, adModalFallbackNote, { forceFallback: true });
  if (activeCategory === "ads") await loadCategoryItems("ads");
  await loadCategories();
  await loadDashboard();
}

async function doUserSearch() {
  const q = userSearchInput.value.trim();
  if (q.length < 2) {
    userSearchResults.innerHTML = '<p class="muted" style="margin:0;">Введите минимум 2 символа.</p>';
    return;
  }
  const res = await apiGet(`/admin/api/search/users?q=${encodeURIComponent(q)}`);
  const rows = (res.results || [])
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.category)}</td>
        <td style="font-family:monospace;">${escapeHtml(r.id ?? "")}</td>
        <td>${escapeHtml(r.username || "")}</td>
        <td>${escapeHtml(r.usernameLink || "")}</td>
      </tr>
    `
    )
    .join("");
  userSearchResults.innerHTML = `
    <table class="table">
      <thead><tr><th>Категория</th><th>ID</th><th>Username</th><th>Username link</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" class="muted">Ничего не найдено</td></tr>'}</tbody>
    </table>
  `;
}

async function loadGuarantConfig() {
  const data = await apiGet("/admin/api/config/guarant");
  guarantConfig = data.payload || { guarantor: {}, commissionTiers: [], aboutText: "" };
  guarantProfileLinkInput.value = guarantConfig?.guarantor?.profileLink || "";
  guarantDisplayNameInput.value = guarantConfig?.guarantor?.displayName || "";
  guarantUsernameInput.value = guarantConfig?.guarantor?.username || "";
  guarantAboutTextInput.value = guarantConfig?.aboutText || "";
  guarantConditionsInput.value = (guarantConfig?.commissionTiers || []).join("\n");
}

async function saveGuarantConfig() {
  const payload = {
    guarantor: {
      profileLink: guarantProfileLinkInput.value.trim(),
      displayName: guarantDisplayNameInput.value.trim(),
      username: guarantUsernameInput.value.trim(),
    },
    aboutText: guarantAboutTextInput.value.trim(),
    commissionTiers: guarantConditionsInput.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
  await apiJson("/admin/api/config/guarant", "PUT", { payload });
  notify("Настройки гаранта обновлены");
  await loadGuarantConfig();
}

async function switchTab(tabId) {
  activeTab = tabId;
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tabBtn === tabId));
  tabViews.forEach((view) => {
    view.style.display = view.id === `tab-${tabId}` ? "" : "none";
  });

  if (tabId === "home") await loadDashboard();
  if (tabId === "main-edit") await loadMainPageConfig();
  if (tabId === "exchange") await loadCategories();
  if (tabId === "guarant") await loadGuarantConfig();
}

document.addEventListener("click", async (e) => {
  const tabBtn = e.target.closest("[data-tab-btn]");
  if (tabBtn) {
    await switchTab(tabBtn.dataset.tabBtn);
    return;
  }

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
    } else if (actionBtn.dataset.action === "delete") {
      await deleteItem(id);
    }
    return;
  }

  const hotActionBtn = e.target.closest("[data-hot-action]");
  if (hotActionBtn) {
    const index = Number(hotActionBtn.dataset.hotIndex);
    if (hotActionBtn.dataset.hotAction === "edit") {
      editingHotOfferIndex = index;
      openHotOfferModal(mainPageConfig?.hotOffers?.offers?.[index]);
    } else if (hotActionBtn.dataset.hotAction === "delete") {
      deleteHotOffer(index);
    }
  }
});

addItemBtn.addEventListener("click", () => {
  if (!activeCategory) return alert("Сначала выберите категорию");
  editingItemId = null;
  openItemModal("Новый элемент", { id: "" });
});
addAdBtn.addEventListener("click", (event) => {
  debugLog("addAdBtn:click", {
    activeTab,
    activeCategory,
    buttonExists: Boolean(addAdBtn),
    dialogExists: Boolean(adModal),
    dialogOpenBefore: Boolean(adModal?.open),
    eventType: event?.type || null,
  });
  openDialogSafe(adModal, adModalFallbackNote, { forceFallback: true });
  debugLog("addAdBtn:after-open-call", {
    dialogOpenAfter: Boolean(adModal?.open),
  });
});
itemSaveBtn.addEventListener("click", saveItemModal);
itemCancelBtn.addEventListener("click", () => {
  editingItemDraft = null;
  closeDialogSafe(itemModal, itemModalFallbackNote);
});
adSaveBtn.addEventListener("click", saveManualAd);
adCancelBtn.addEventListener("click", () => closeDialogSafe(adModal, adModalFallbackNote, { forceFallback: true }));
addFieldBtn.addEventListener("click", () => fieldRows.appendChild(createFieldRow()));
fieldRows.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-role="field-remove"]');
  if (btn) {
    btn.closest(".field-row")?.remove();
    if (!fieldRows.children.length) fieldRows.appendChild(createFieldRow());
  }
});
toggleAdvancedEditBtn.addEventListener("click", () => {
  if (activeCategory !== "ads") return;

  if (isAdvancedAdsEdit) {
    editingItemDraft = readItemFromForm();
    fillSimpleAdForm(editingItemDraft);
    setAdsEditMode(false);
    return;
  }

  editingItemDraft = readSimpleAdForm(editingItemDraft || {});
  fillFormFromItem(editingItemDraft);
  setAdsEditMode(true);
});
userSearchBtn.addEventListener("click", doUserSearch);
userSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doUserSearch();
});
refreshKpiBtn.addEventListener("click", loadDashboard);
saveMainPageBtn.addEventListener("click", saveMainPageConfig);
addHotOfferBtn.addEventListener("click", () => {
  editingHotOfferIndex = null;
  openHotOfferModal(null);
});
hotOfferCancelBtn.addEventListener("click", () => {
  editingHotOfferIndex = null;
  closeDialogSafe(hotOfferModal);
});
hotOfferSaveBtn.addEventListener("click", saveHotOfferFromModal);
saveGuarantBtn.addEventListener("click", saveGuarantConfig);

document.addEventListener("DOMContentLoaded", async () => {
  debugLog("DOMContentLoaded:init", {
    hasAddAdBtn: Boolean(addAdBtn),
    hasAdModal: Boolean(adModal),
    hasAdSaveBtn: Boolean(adSaveBtn),
    hasAdCancelBtn: Boolean(adCancelBtn),
    supportsDialog: isDialogSupported(adModal),
  });
  if (adModal) {
    adModal.addEventListener("close", () => {
      debugLog("adModal:event:close", {
        currentlyOpen: Boolean(adModal.open),
        returnValue: adModal.returnValue || null,
      });
    });
    adModal.addEventListener("cancel", (evt) => {
      debugLog("adModal:event:cancel", {
        currentlyOpen: Boolean(adModal.open),
        defaultPrevented: Boolean(evt.defaultPrevented),
      });
    });
  }
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && adModal?.dataset?.fallbackOpen === "1") {
      debugLog("keydown:escape:fallback-close", { dialogId: "adModal" });
      closeDialogSafe(adModal, adModalFallbackNote, { forceFallback: true });
    }
  });
  await switchTab("home");
});
