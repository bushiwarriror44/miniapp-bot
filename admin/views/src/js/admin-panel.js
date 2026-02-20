const adminRole = typeof window.ADMIN_ROLE !== "undefined" ? window.ADMIN_ROLE : "admin";
let activeTab = "home";
let activeCategory = null;
let moderatorsList = [];
let selectedModeratorId = null;
let currentItems = [];
let editingItemId = null;
let editingItemDraft = null;
let isAdvancedAdsEdit = false;
let mainPageConfig = { hotOffers: { offers: [] }, news: { channelUrl: "" } };
let bannersConfig = { banners: [] };
let guarantConfig = { guarantor: {}, commissionTiers: [], aboutText: "" };
let editingHotOfferIndex = null;
let attachAdCurrentItems = [];
let faqItems = [];
let editingFaqId = null;
let adminUsers = [];
let selectedAdminUserId = null;
let allLabels = [];
let ratingUsers = [];
let selectedRatingUserId = null;
let botConfig = { welcomeMessage: "", welcomePhotoUrl: null, supportLink: "" };
let moderationRequests = [];
let selectedModerationRequestId = null;
const DEBUG_MODAL = true;

const CATEGORY_LABELS = {
  ads: "Продам рекламу",
  buyAds: "Куплю рекламу",
  buyChannels: "Куплю канал",
  sellChannels: "Продам канал",
  services: "Услуги",
  jobs: "Вакансии",
  currency: "Обмен валют",
  other: "Прочее",
};

/** Backend category name -> frontend exchange section id (for hot offer deep link) */
const BACKEND_TO_FRONTEND_SECTION = {
  ads: "sell-ads",
  buyAds: "buy-ads",
  jobs: "jobs",
  services: "designers",
  currency: "currency",
  sellChannels: "sell-channel",
  buyChannels: "buy-channel",
  other: "other",
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

const attachAdToHotOfferBtn = document.getElementById("attachAdToHotOfferBtn");
const attachAdHotOfferModal = document.getElementById("attachAdHotOfferModal");
const attachAdCategorySelect = document.getElementById("attachAdCategorySelect");
const attachAdItemsListWrap = document.getElementById("attachAdItemsListWrap");
const attachAdHotOfferCloseBtn = document.getElementById("attachAdHotOfferCloseBtn");

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

const adminUsersSearchInput = document.getElementById("adminUsersSearchInput");
const adminUsersSearchBtn = document.getElementById("adminUsersSearchBtn");
const adminUsersTableWrap = document.getElementById("adminUsersTableWrap");
const adminUserDetailsWrap = document.getElementById("adminUserDetailsWrap");

const ratingUsersSearchInput = document.getElementById("ratingUsersSearchInput");
const ratingUsersRefreshBtn = document.getElementById("ratingUsersRefreshBtn");
const ratingUsersTableWrap = document.getElementById("ratingUsersTableWrap");
const ratingEditModal = document.getElementById("ratingEditModal");
const ratingManualDeltaInput = document.getElementById("ratingManualDeltaInput");
const ratingInfoText = document.getElementById("ratingInfoText");
const ratingEditCancelBtn = document.getElementById("ratingEditCancelBtn");
const ratingEditSaveBtn = document.getElementById("ratingEditSaveBtn");
const moderationStatusFilter = document.getElementById("moderationStatusFilter");
const moderationRefreshBtn = document.getElementById("moderationRefreshBtn");
const moderationRequestsTableWrap = document.getElementById("moderationRequestsTableWrap");
const moderationRequestDetailsWrap = document.getElementById("moderationRequestDetailsWrap");

const faqTableWrap = document.getElementById("faqTableWrap");
const addFaqBtn = document.getElementById("addFaqBtn");
const faqIdInput = document.getElementById("faqIdInput");
const faqTitleInput = document.getElementById("faqTitleInput");
const faqTextInput = document.getElementById("faqTextInput");
const faqResetBtn = document.getElementById("faqResetBtn");
const saveFaqBtn = document.getElementById("saveFaqBtn");
const botWelcomeMessageInput = document.getElementById("botWelcomeMessageInput");
const botWelcomePhotoInput = document.getElementById("botWelcomePhotoInput");
const botWelcomePhotoPreviewWrap = document.getElementById("botWelcomePhotoPreviewWrap");
const uploadBotPhotoBtn = document.getElementById("uploadBotPhotoBtn");
const saveBotConfigBtn = document.getElementById("saveBotConfigBtn");
const botSupportLinkInput = document.getElementById("botSupportLinkInput");
const botMessageTelegramIdInput = document.getElementById("botMessageTelegramIdInput");
const botMessageSendAllInput = document.getElementById("botMessageSendAllInput");
const botMessageTextInput = document.getElementById("botMessageTextInput");
const botMessagePhotoInput = document.getElementById("botMessagePhotoInput");
const botMessagePhotoDropZone = document.getElementById("botMessagePhotoDropZone");
const botMessagePhotoPreviewWrap = document.getElementById("botMessagePhotoPreviewWrap");
const botMessagePhotoPreviewImg = document.getElementById("botMessagePhotoPreviewImg");
const botMessagePhotoRemoveBtn = document.getElementById("botMessagePhotoRemoveBtn");
const sendBotMessageBtn = document.getElementById("sendBotMessageBtn");
const botMessageResult = document.getElementById("botMessageResult");
let botMessagePhotoFile = null;
const newModeratorPasswordInput = document.getElementById("newModeratorPasswordInput");
const newModeratorLabelInput = document.getElementById("newModeratorLabelInput");
const createModeratorBtn = document.getElementById("createModeratorBtn");
const moderatorsTableWrap = document.getElementById("moderatorsTableWrap");
const editModeratorWrap = document.getElementById("editModeratorWrap");
const editModeratorFormWrap = document.getElementById("editModeratorFormWrap");
const editModeratorIdInput = document.getElementById("editModeratorIdInput");
const editModeratorPasswordInput = document.getElementById("editModeratorPasswordInput");
const editModeratorLabelInput = document.getElementById("editModeratorLabelInput");
const saveModeratorBtn = document.getElementById("saveModeratorBtn");
const cancelEditModeratorBtn = document.getElementById("cancelEditModeratorBtn");
const logTableWrap = document.getElementById("logTableWrap");
const supportRequestsTableWrap = document.getElementById("supportRequestsTableWrap");
const refreshSupportBtn = document.getElementById("refreshSupportBtn");
const refreshLogBtn = document.getElementById("refreshLogBtn");
const jobTypesTableWrap = document.getElementById("jobTypesTableWrap");
const currenciesTableWrap = document.getElementById("currenciesTableWrap");
const addJobTypeBtn = document.getElementById("addJobTypeBtn");
const addCurrencyBtn = document.getElementById("addCurrencyBtn");
const saveExchangeOptionsBtn = document.getElementById("saveExchangeOptionsBtn");

let exchangeOptions = { jobTypes: [], currencies: [] };

function applyModeratorLayout() {
  document.querySelectorAll(".sidebar [data-admin-only]").forEach((el) => {
    el.style.display = "none";
  });
  document.querySelectorAll(".tab-view[data-admin-only]").forEach((el) => {
    el.style.display = "none";
  });
}

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
      (offer, index) => {
        const typeCell =
          offer.type === "ad"
            ? `<span title="${escapeHtml(offer.category || "")} / ${escapeHtml(String(offer.itemId || ""))}">Объявление</span>`
            : "—";
        return `
      <tr>
        <td>${escapeHtml(offer.id || index + 1)}</td>
        <td>${typeCell}</td>
        <td>${escapeHtml(offer.title || "")}</td>
        <td>${escapeHtml(offer.price || "")}</td>
        <td>${escapeHtml(offer.subtitle || "")}</td>
        <td>
          <button class="btn" data-hot-action="edit" data-hot-index="${index}">Редактировать</button>
          <button class="btn" data-hot-action="delete" data-hot-index="${index}">Удалить</button>
        </td>
      </tr>
    `;
      }
    )
    .join("");

  hotOffersTableWrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Тип</th>
          <th>Заголовок</th>
          <th>Цена</th>
          <th>Подзаголовок</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6" class="muted">Пусто</td></tr>'}</tbody>
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

async function loadBannersConfig() {
  const data = await apiGet("/admin/api/config/banners");
  bannersConfig = data.payload && Array.isArray(data.payload.banners) ? { banners: data.payload.banners } : { banners: [] };
  renderBannersList();
}

function renderBannersList() {
  const wrap = document.getElementById("bannersListWrap");
  if (!wrap) return;
  const list = (bannersConfig.banners || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (list.length === 0) {
    wrap.innerHTML = "<p class=\"muted\" style=\"margin:0;font-size:13px;\">Нет баннеров. Загрузите изображение ниже.</p>";
    return;
  }
  wrap.innerHTML = list
    .map(
      (b, index) => {
        const isRelative = (b.imageUrl || "").startsWith("/") && !(b.imageUrl || "").startsWith("//");
        const base = typeof window.MINIAPP_BASE_URL === "string" ? window.MINIAPP_BASE_URL.replace(/\/$/, "") : "";
        const imgSrc = isRelative ? base + (b.imageUrl || "") : (b.imageUrl || "");
        const previewHtml = imgSrc
          ? `<img src="${escapeHtml(imgSrc)}" alt="" style="width:80px;height:50px;object-fit:cover;border-radius:6px;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><span style="display:none;font-size:12px;color:var(--color-text-muted);">Превью</span>`
          : `<span class="muted" style="font-size:12px;">${escapeHtml(b.imageUrl || "Баннер")}</span>`;
        return `<div class="stack" style="flex-direction:row;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-color,#eee);">
  <div style="width:80px;height:50px;flex-shrink:0;background:var(--surface,#f5f5f5);border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;">${previewHtml}</div>
  <span style="font-size:13px;">#${index + 1}</span>
  <div style="flex:1;min-width:0;">
    <span class="muted" style="font-size:12px;word-break:break-all;">${escapeHtml(b.imageUrl || "")}</span>
  </div>
  <div style="display:flex;gap:4px;">
    <button type="button" class="btn" data-banner-action="up" data-banner-index="${index}" ${index === 0 ? "disabled" : ""}>Вверх</button>
    <button type="button" class="btn" data-banner-action="down" data-banner-index="${index}" ${index === list.length - 1 ? "disabled" : ""}>Вниз</button>
    <button type="button" class="btn" data-banner-action="delete" data-banner-index="${index}">Удалить</button>
  </div>
</div>`;
      }
    )
    .join("");
}

async function saveBannersConfig() {
  const list = (bannersConfig.banners || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const payload = { banners: list.map((b, i) => ({ ...b, order: i })) };
  await apiJson("/admin/api/config/banners", "PUT", { payload });
  notify("Баннеры сохранены");
  await loadBannersConfig();
}

function bannerMoveUp(index) {
  const list = (bannersConfig.banners || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (index <= 0) return;
  [list[index - 1], list[index]] = [list[index], list[index - 1]];
  bannersConfig.banners = list.map((b, i) => ({ ...b, order: i }));
  saveBannersConfig();
}

function bannerMoveDown(index) {
  const list = (bannersConfig.banners || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (index >= list.length - 1) return;
  [list[index], list[index + 1]] = [list[index + 1], list[index]];
  bannersConfig.banners = list.map((b, i) => ({ ...b, order: i }));
  saveBannersConfig();
}

function bannerDelete(index) {
  if (!confirm("Удалить этот баннер?")) return;
  const list = (bannersConfig.banners || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  list.splice(index, 1);
  bannersConfig.banners = list.map((b, i) => ({ ...b, order: i }));
  saveBannersConfig();
}

async function uploadBanner() {
  const input = document.getElementById("bannerFileInput");
  if (!input || !input.files || !input.files[0]) {
    alert("Выберите файл изображения");
    return;
  }
  const file = input.files[0];
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/admin/api/banners/upload", { method: "POST", credentials: "same-origin", body: form });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const url = data.url;
  if (!url) throw new Error("Нет url в ответе");
  const list = (bannersConfig.banners || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const maxOrder = list.length === 0 ? -1 : Math.max(...list.map((b) => b.order ?? 0));
  list.push({ id: `banner-${Date.now()}`, imageUrl: url, order: maxOrder + 1 });
  bannersConfig.banners = list;
  await saveBannersConfig();
  input.value = "";
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
  const existing = editingHotOfferIndex != null ? offers[editingHotOfferIndex] : null;
  const record = {
    id: editingHotOfferIndex == null ? String(Date.now()) : String(existing?.id || Date.now()),
    title,
    price,
    subtitle,
  };
  if (existing?.type === "ad") {
    record.type = "ad";
    record.category = existing.category;
    record.itemId = existing.itemId;
  }

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

/** Build title, price, subtitle for a hot offer from an exchange item (by backend category). */
function buildHotOfferFieldsFromItem(item, backendCategory) {
  const o = item || {};
  const title = o.theme || o.title || o.name || o.work || o.username || String(o.id || "");
  let price = "";
  let subtitle = "";
  switch (backendCategory) {
    case "ads":
      price = o.price != null ? String(o.price) + " ₽" : "";
      subtitle = o.username || o.channelOrChatLink || "";
      break;
    case "buyAds":
      if (o.priceMin != null || o.priceMax != null) {
        price = (o.priceMin != null ? o.priceMin : "?") + " – " + (o.priceMax != null ? o.priceMax : "?") + " ₽";
      }
      subtitle = o.username || "";
      break;
    case "jobs":
      price = [o.paymentAmount, o.paymentCurrency].filter(Boolean).join(" ") || "";
      subtitle = o.theme || (o.description || "").slice(0, 60);
      break;
    case "services":
      price = o.price != null ? String(o.price) + " ₽" : "";
      subtitle = o.theme || o.username || "";
      break;
    case "currency":
      price = o.rate != null && String(o.rate).trim() ? String(o.rate).trim() : o.price != null ? String(o.price) : "";
      subtitle = o.subtitle || (o.description || "").slice(0, 60) || "";
      break;
    case "sellChannels":
      price = o.subscribers != null ? String(o.subscribers) : "";
      subtitle = o.username || "";
      break;
    case "buyChannels":
      subtitle = o.username || "";
      break;
    case "other":
      price = o.price != null ? String(o.price) + " ₽" : "";
      subtitle = (o.description || "").slice(0, 60);
      break;
    default:
      price = o.price != null ? String(o.price) : "";
      subtitle = o.username || o.description || "";
  }
  return { title, price, subtitle };
}

function attachAdItemDisplayLabel(item) {
  if (!item || typeof item !== "object") return "";
  return item.theme || item.title || item.name || item.work || item.username || item.usernameLink || String(item.id || "");
}

async function loadAttachAdItems(backendCategory) {
  if (!attachAdItemsListWrap) return;
  attachAdItemsListWrap.innerHTML = "<p class=\"muted\" style=\"margin:0;font-size:13px;\">Загрузка…</p>";
  try {
    const data = await apiGet(`/admin/api/categories/${encodeURIComponent(backendCategory)}/items`);
    const items = data.items || [];
    attachAdCurrentItems = items;
    if (items.length === 0) {
      attachAdItemsListWrap.innerHTML = "<p class=\"muted\" style=\"margin:0;font-size:13px;\">В этой категории пока нет объявлений.</p>";
      return;
    }
    attachAdItemsListWrap.innerHTML = items
      .map(
        (item) => {
          const label = escapeHtml(attachAdItemDisplayLabel(item));
          const id = escapeHtml(String(item.id ?? ""));
          const description = escapeHtml((item.description || "").slice(0, 120));
          const descriptionHtml = description
            ? `<p class="muted" style="margin:2px 0 0 0;font-size:12px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${description}</p>`
            : "";
          return `<div class="stack" style="flex-direction:row;align-items:flex-start;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-color, #eee);">
  <div style="flex:1;min-width:0;">
    <span style="font-size:13px;font-weight:500;display:block;">${label}</span>
    ${descriptionHtml}
  </div>
  <button type="button" class="btn btn-primary attach-ad-add-btn" data-attach-ad-id="${id}" data-attach-ad-category="${escapeHtml(backendCategory)}" style="flex-shrink:0;">Добавить</button>
</div>`;
        }
      )
      .join("");
  } catch (e) {
    attachAdItemsListWrap.innerHTML = "<p class=\"muted\" style=\"margin:0;font-size:13px;color:#c00;\">Ошибка загрузки: " + escapeHtml(String(e.message || e)) + "</p>";
  }
}

async function addHotOfferFromAd(item, backendCategory) {
  const frontendSection = BACKEND_TO_FRONTEND_SECTION[backendCategory];
  if (!frontendSection) return;
  const { title, price, subtitle } = buildHotOfferFieldsFromItem(item, backendCategory);
  const offers = Array.isArray(mainPageConfig?.hotOffers?.offers) ? [...mainPageConfig.hotOffers.offers] : [];
  const record = {
    type: "ad",
    id: String(Date.now()),
    category: frontendSection,
    itemId: String(item.id ?? ""),
    title: title || "Объявление",
    price: price || "—",
    subtitle: subtitle || "",
  };
  offers.push(record);
  mainPageConfig.hotOffers = { offers };
  closeDialogSafe(attachAdHotOfferModal);
  renderHotOffersTable();
  try {
    await saveMainPageConfig();
    notify("Объявление добавлено в горячие предложения и сохранено.");
  } catch (e) {
    notify("Объявление добавлено, но ошибка сохранения: " + String(e.message || e));
  }
}

function openAttachAdHotOfferModal() {
  const category = attachAdCategorySelect?.value || "ads";
  openDialogSafe(attachAdHotOfferModal);
  loadAttachAdItems(category);
}

function itemSummary(item) {
  if (!item || typeof item !== "object") return "";
  return item.username || item.title || item.name || item.theme || item.usernameLink || JSON.stringify(item).slice(0, 40);
}

function inferType(value) {
  if (value && typeof value === "object") return "json";
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
    <option value="json">json</option>
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
    } else if (type === "json") {
      const textarea = document.createElement("textarea");
      textarea.className = "textarea";
      textarea.rows = 4;
      textarea.dataset.role = "field-value";
      textarea.value = field.value == null ? "" : String(field.value);
      textarea.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
      if (field.locked) textarea.readOnly = true;
      valueWrap.appendChild(textarea);
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
    const type = inferType(value);
    const displayValue = type === "json" ? JSON.stringify(value, null, 2) : value;
    fieldRows.appendChild(
      createFieldRow({
        key,
        type,
        value: displayValue,
        locked: key === "id" && editingItemId !== null,
      })
    );
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
    if (type === "number") {
      result[key] = raw === "" ? 0 : Number(raw);
      continue;
    }
    if (type === "json") {
      const trimmed = String(raw || "").trim();
      if (!trimmed) {
        result[key] = null;
        continue;
      }
      try {
        result[key] = JSON.parse(trimmed);
      } catch (e) {
        alert(`Поле "${key}": некорректный JSON`);
        throw e;
      }
      continue;
    }
    result[key] = raw;
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

function formatMaybeRating(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return String(Math.round(value * 10) / 10);
}

function renderAdminUsersTable() {
  const rows = adminUsers
    .map(
      (user) => `
      <tr>
        <td style="font-family:monospace;">${escapeHtml(user.telegramId || "")}</td>
        <td>${escapeHtml(user.username || "-")}</td>
        <td>${escapeHtml(formatMaybeRating(user.ratingTotal))}</td>
        <td>${user.verified ? "Да" : "Нет"}</td>
        <td>${user.isScam ? "SCAM!" : "-"}</td>
        <td>${user.isBlocked ? "Заблокирован" : "-"}</td>
        <td><button class="btn" data-user-select-id="${escapeHtml(user.id)}">Открыть</button></td>
      </tr>
    `
    )
    .join("");
  adminUsersTableWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>Telegram ID</th><th>Username</th><th>Рейтинг</th><th>Верификация</th><th>SCAM</th><th>Блок</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" class="muted">Нет пользователей</td></tr>'}</tbody>
    </table>
  `;
}

function renderAdminUserDetails(user, statistics) {
  if (!user) {
    adminUserDetailsWrap.innerHTML = '<p class="muted" style="margin:0;">Пользователь не найден.</p>';
    return;
  }
  const rating = user.rating || {};
  const stats = statistics || user.statistics || {};
  adminUserDetailsWrap.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div>
        <p style="margin:0 0 6px 0;"><strong>Username:</strong> ${escapeHtml(user.username || "-")}</p>
        <p style="margin:0 0 6px 0;"><strong>Telegram ID:</strong> <span style="font-family:monospace;">${escapeHtml(user.telegramId || "")}</span></p>
        <p style="margin:0 0 6px 0;"><strong>Рейтинг auto:</strong> ${escapeHtml(formatMaybeRating(rating.auto))}</p>
        <p style="margin:0 0 6px 0;"><strong>Рейтинг total:</strong> ${escapeHtml(formatMaybeRating(rating.total))}</p>
      </div>
      <div>
        <label class="muted" style="display:block;margin-bottom:4px;">Ручная корректировка рейтинга</label>
        <input id="adminUserRatingDeltaInput" class="input" type="number" step="0.1" value="${escapeHtml(String(rating.manualDelta ?? 0))}" />
        <button id="adminUserSaveRatingBtn" class="btn btn-primary" style="margin-top:8px;">Сохранить рейтинг</button>
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px;">
          <input id="adminUserVerifiedInput" type="checkbox" ${user.verified ? "checked" : ""} />
          Верифицирован
        </label>
        <button id="adminUserSaveVerifiedBtn" class="btn" style="margin-top:8px;">Сохранить верификацию</button>
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px;">
          <input id="adminUserScamInput" type="checkbox" ${user.isScam ? "checked" : ""} />
          SCAM!
        </label>
        <button id="adminUserSaveScamBtn" class="btn" style="margin-top:8px;">Сохранить метку SCAM</button>
        <label style="display:flex;gap:8px;align-items:center;margin-top:12px;">
          <input id="adminUserBlockedInput" type="checkbox" ${user.isBlocked ? "checked" : ""} />
          Заблокирован
        </label>
        <button id="adminUserSaveBlockedBtn" class="btn" style="margin-top:8px;">Сохранить блокировку</button>
      </div>
    </div>
    <hr style="margin:12px 0;border:none;border-top:1px solid var(--color-border);" />
    <h3 style="margin:12px 0 8px 0;font-size:14px;">Кастомные метки</h3>
    <div id="adminUserLabelsWrap"></div>
    <p class="muted" style="margin:12px 0 6px 0;font-size:12px;">Добавить метку пользователю</p>
    <div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
      <select id="adminUserAddLabelSelect" class="input" style="flex:1;min-width:0;">
        <option value="">Выберите метку...</option>
      </select>
      <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
        <input id="adminUserLabelColorInput" type="color" value="#0070f3" style="width:44px;height:36px;padding:2px;border:1px solid var(--color-border);border-radius:6px;cursor:pointer;background:#0070f3;" title="Цвет метки" />
        <span id="adminUserLabelColorPreview" style="display:inline-block;width:28px;height:28px;border-radius:4px;border:1px solid var(--color-border);background:#0070f3;" title="Выбранный цвет"></span>
      </div>
      <button id="adminUserAddLabelBtn" class="btn">Добавить</button>
    </div>
    <p id="adminUserAddLabelHint" class="muted" style="margin:6px 0 0 0;font-size:11px;display:none;"></p>
    <hr style="margin:12px 0;border:none;border-top:1px solid var(--color-border);" />
    <h3 style="margin:0 0 8px 0;font-size:14px;">Статистика активности</h3>
    <div style="display:grid;grid-template-columns:repeat(2, minmax(0,1fr));gap:8px;">
      <div class="card" style="padding:8px;">
        <p class="muted" style="margin:0 0 4px 0;">Объявления</p>
        <p style="margin:0;">active: <strong>${stats?.ads?.active ?? 0}</strong>, completed: <strong>${stats?.ads?.completed ?? 0}</strong>, hidden: <strong>${stats?.ads?.hidden ?? 0}</strong></p>
      </div>
      <div class="card" style="padding:8px;">
        <p class="muted" style="margin:0 0 4px 0;">Сделки</p>
        <p style="margin:0;">total: <strong>${stats?.deals?.total ?? 0}</strong>, successful: <strong>${stats?.deals?.successful ?? 0}</strong>, disputed: <strong>${stats?.deals?.disputed ?? 0}</strong></p>
      </div>
      <div class="card" style="padding:8px;grid-column:1/-1;">
        <p class="muted" style="margin:0 0 4px 0;">Просмотры профиля</p>
        <p style="margin:0;">week: <strong>${stats?.profileViews?.week ?? 0}</strong>, month: <strong>${stats?.profileViews?.month ?? 0}</strong></p>
      </div>
    </div>
  `;
}

async function loadAdminUsers() {
  const q = adminUsersSearchInput?.value?.trim() || "";
  const data = await apiGet(`/admin/api/users?q=${encodeURIComponent(q)}`);
  adminUsers = data.users || [];
  renderAdminUsersTable();
  if (selectedAdminUserId) {
    const stillExists = adminUsers.find((u) => u.id === selectedAdminUserId);
    if (!stillExists) {
      selectedAdminUserId = null;
      adminUserDetailsWrap.innerHTML = '<p class="muted" style="margin:0;">Выберите пользователя в таблице выше.</p>';
    }
  }
}

async function openAdminUserCard(userId) {
  selectedAdminUserId = userId;
  const [userData, statisticsData, labelsData] = await Promise.all([
    apiGet(`/admin/api/users/${encodeURIComponent(userId)}`),
    apiGet(`/admin/api/users/${encodeURIComponent(userId)}/statistics`),
    apiGet(`/admin/api/users/${encodeURIComponent(userId)}/labels`).catch(() => ({ labels: [] })),
  ]);
  renderAdminUserDetails(userData.user, statisticsData.statistics);
  await loadAllLabels();
  renderUserLabels(userId, labelsData.labels || []);
  const colorInput = document.getElementById("adminUserLabelColorInput");
  if (colorInput && !colorInput.value) {
    colorInput.value = "#0070f3";
  }
  updateAdminUserLabelColorPreview();
}

function updateAdminUserLabelColorPreview() {
  const colorInput = document.getElementById("adminUserLabelColorInput");
  const preview = document.getElementById("adminUserLabelColorPreview");
  if (colorInput && preview) {
    const hex = colorInput.value || "#0070f3";
    preview.style.backgroundColor = hex;
    colorInput.style.background = hex;
  }
}

async function loadAllLabels() {
  try {
    const data = await apiGet("/admin/api/labels");
    allLabels = data.labels || [];
    const select = document.getElementById("adminUserAddLabelSelect");
    const colorInput = document.getElementById("adminUserLabelColorInput");
    if (select) {
      select.innerHTML = '<option value="">Выберите метку...</option>' + allLabels.map((label) => `<option value="${escapeHtml(label.id)}" data-color="${escapeHtml(label.defaultColor)}">${escapeHtml(label.name)}</option>`).join("");
      const hint = document.getElementById("adminUserAddLabelHint");
      if (hint) {
        hint.textContent = allLabels.length === 0 ? "Сначала создайте метки во вкладке «Метки»." : "";
        hint.style.display = allLabels.length === 0 ? "block" : "none";
      }
    }
    if (colorInput && !colorInput.value) {
      colorInput.value = "#0070f3";
    }
    updateAdminUserLabelColorPreview();
  } catch (e) {
    console.error("[admin] Failed to load labels", e);
    allLabels = [];
  }
}

function renderUserLabels(userId, userLabels) {
  const wrap = document.getElementById("adminUserLabelsWrap");
  if (!wrap) return;
  if (userLabels.length === 0) {
    wrap.innerHTML = '<p class="muted" style="margin:0;font-size:12px;">У пользователя нет кастомных меток.</p>';
    return;
  }
  const rows = userLabels
    .map(
      (ul) => {
        const label = allLabels.find((l) => l.id === ul.labelId);
        const labelName = label ? label.name : ul.labelName || "Неизвестная метка";
        const displayColor = ul.color || (label ? label.defaultColor : "#0070f3");
        return `
      <div style="display:flex;align-items:center;gap:8px;padding:6px;border:1px solid var(--color-border);border-radius:4px;margin-bottom:4px;font-size:12px;">
        <span style="display:inline-block;width:16px;height:16px;border-radius:3px;background-color:${escapeHtml(displayColor)};border:1px solid var(--color-border);"></span>
        <span style="flex:1;">${escapeHtml(labelName)}</span>
        <button class="btn" data-user-label-remove-id="${escapeHtml(ul.labelId)}" style="font-size:11px;padding:2px 6px;">Удалить</button>
      </div>
    `;
      }
    )
    .join("");
  wrap.innerHTML = rows;
}

async function addLabelToUser(userId, labelId, color) {
  if (!labelId) {
    alert("Выберите метку");
    return;
  }
  try {
    const payload = { labelId };
    if (color && color !== "#0070f3") {
      const selectedLabel = allLabels.find((l) => l.id === labelId);
      if (selectedLabel && color !== selectedLabel.defaultColor) {
        payload.customColor = color;
      }
    }
    await apiJson(`/admin/api/users/${encodeURIComponent(userId)}/labels`, "POST", payload);
    await openAdminUserCard(userId);
  } catch (e) {
    console.error("[admin] Failed to add label to user", e);
    alert("Ошибка добавления метки: " + (e.message || String(e)));
  }
}

async function removeLabelFromUser(userId, labelId) {
  try {
    await apiJson(`/admin/api/users/${encodeURIComponent(userId)}/labels/${encodeURIComponent(labelId)}`, "DELETE", {});
    await openAdminUserCard(userId);
  } catch (e) {
    console.error("[admin] Failed to remove label from user", e);
    alert("Ошибка удаления метки: " + (e.message || String(e)));
  }
}

async function saveAdminUserRating() {
  if (!selectedAdminUserId) return;
  const input = document.getElementById("adminUserRatingDeltaInput");
  const value = Number(input?.value ?? 0);
  await apiJson(`/admin/api/users/${encodeURIComponent(selectedAdminUserId)}/rating-manual`, "PATCH", {
    ratingManualDelta: Number.isNaN(value) ? 0 : value,
  });
  await loadAdminUsers();
  await openAdminUserCard(selectedAdminUserId);
}

async function saveAdminUserVerified() {
  if (!selectedAdminUserId) return;
  const input = document.getElementById("adminUserVerifiedInput");
  const verified = Boolean(input?.checked);
  await apiJson(`/admin/api/users/${encodeURIComponent(selectedAdminUserId)}/verified`, "PATCH", {
    verified,
  });
  await loadAdminUsers();
  await openAdminUserCard(selectedAdminUserId);
}

async function saveAdminUserScam() {
  if (!selectedAdminUserId) return;
  const input = document.getElementById("adminUserScamInput");
  const isScam = Boolean(input?.checked);
  await apiJson(`/admin/api/users/${encodeURIComponent(selectedAdminUserId)}/scam`, "PATCH", {
    isScam,
  });
  await loadAdminUsers();
  await openAdminUserCard(selectedAdminUserId);
}

async function saveAdminUserBlocked() {
  if (!selectedAdminUserId) return;
  const input = document.getElementById("adminUserBlockedInput");
  const isBlocked = Boolean(input?.checked);
  await apiJson(`/admin/api/users/${encodeURIComponent(selectedAdminUserId)}/blocked`, "PATCH", {
    isBlocked,
  });
  await loadAdminUsers();
  await openAdminUserCard(selectedAdminUserId);
}

async function loadLabels() {
  try {
    const data = await apiGet("/admin/api/labels");
    allLabels = data.labels || [];
    renderLabelsList();
  } catch (e) {
    console.error("[admin] Failed to load labels", e);
    allLabels = [];
    renderLabelsList();
  }
}

function renderLabelsList() {
  const wrap = document.getElementById("adminLabelsListWrap");
  if (!wrap) return;
  if (allLabels.length === 0) {
    wrap.innerHTML = '<p class="muted" style="margin:0;">Нет меток. Создайте первую метку ниже.</p>';
    return;
  }
  const rows = allLabels
    .map(
      (label) => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--color-border);border-radius:4px;margin-bottom:8px;">
      <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background-color:${escapeHtml(label.defaultColor)};border:1px solid var(--color-border);"></span>
      <span style="flex:1;font-weight:500;">${escapeHtml(label.name)}</span>
      <button class="btn" data-label-edit-id="${escapeHtml(label.id)}" style="font-size:12px;padding:4px 8px;">Изменить</button>
      <button class="btn" data-label-delete-id="${escapeHtml(label.id)}" style="font-size:12px;padding:4px 8px;">Удалить</button>
    </div>
  `
    )
    .join("");
  wrap.innerHTML = rows;
}

async function createLabel() {
  const nameInput = document.getElementById("adminNewLabelNameInput");
  const colorInput = document.getElementById("adminNewLabelColorInput");
  const name = nameInput?.value?.trim();
  if (!name) {
    alert("Введите название метки");
    return;
  }
  try {
    await apiJson("/admin/api/labels", "POST", {
      name,
      defaultColor: colorInput?.value || undefined,
    });
    nameInput.value = "";
    if (colorInput) colorInput.value = "#0070f3";
    await loadLabels();
  } catch (e) {
    console.error("[admin] Failed to create label", e);
    alert("Ошибка создания метки: " + (e.message || String(e)));
  }
}

async function updateLabel(labelId) {
  const name = prompt("Введите новое название метки:");
  if (!name) return;
  const color = prompt("Введите новый цвет (HEX, например #0070f3):");
  try {
    const payload = { name };
    if (color) payload.defaultColor = color;
    await apiJson(`/admin/api/labels/${encodeURIComponent(labelId)}`, "PATCH", payload);
    await loadLabels();
  } catch (e) {
    console.error("[admin] Failed to update label", e);
    alert("Ошибка обновления метки: " + (e.message || String(e)));
  }
}

async function deleteLabel(labelId) {
  if (!confirm("Удалить метку? Это также удалит её у всех пользователей.")) return;
  try {
    await apiJson(`/admin/api/labels/${encodeURIComponent(labelId)}`, "DELETE", {});
    await loadLabels();
  } catch (e) {
    console.error("[admin] Failed to delete label", e);
    alert("Ошибка удаления метки: " + (e.message || String(e)));
  }
}

async function loadRatingUsers() {
  const q = ratingUsersSearchInput?.value?.trim() || "";
  try {
    const data = await apiGet(`/admin/api/users?q=${encodeURIComponent(q)}`);
    ratingUsers = (data.users || []).sort((a, b) => (b.ratingTotal || 0) - (a.ratingTotal || 0));
    renderRatingUsersTable();
  } catch (e) {
    console.error("[admin] Failed to load rating users", e);
    ratingUsers = [];
    renderRatingUsersTable();
  }
}

function renderRatingUsersTable() {
  const rows = ratingUsers
    .map(
      (user) => {
        const ratingTotal = typeof user.ratingTotal === "number" ? user.ratingTotal.toFixed(1) : "0.0";
        const ratingAuto = typeof user.ratingAuto === "number" ? user.ratingAuto.toFixed(1) : "0.0";
        const ratingManualDelta = typeof user.ratingManualDelta === "number" ? user.ratingManualDelta.toFixed(1) : "0.0";
        return `
      <tr>
        <td style="font-family:monospace;font-size:12px;">${escapeHtml(user.id || "")}</td>
        <td>${escapeHtml(user.username || "-")}</td>
        <td style="font-family:monospace;font-size:12px;">${escapeHtml(String(user.telegramId || ""))}</td>
        <td style="font-weight:600;">${escapeHtml(ratingTotal)}</td>
        <td>${escapeHtml(ratingAuto)}</td>
        <td>${escapeHtml(ratingManualDelta)}</td>
        <td>
          <button class="btn" data-rating-edit-user-id="${escapeHtml(user.id || "")}">Изменить рейтинг</button>
        </td>
      </tr>
    `;
      }
    )
    .join("");

  ratingUsersTableWrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Telegram ID</th>
          <th>Рейтинг (total)</th>
          <th>Авто-рейтинг</th>
          <th>Ручная корректировка</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="7" class="muted">Пользователей не найдено</td></tr>'}</tbody>
    </table>
  `;
}

async function openRatingEditModal(userId) {
  selectedRatingUserId = userId;
  const user = ratingUsers.find((u) => u.id === userId);
  if (!user) {
    alert("Пользователь не найден");
    return;
  }
  const ratingAuto = typeof user.ratingAuto === "number" ? user.ratingAuto : 0;
  const ratingManualDelta = typeof user.ratingManualDelta === "number" ? user.ratingManualDelta : 0;
  const ratingTotal = ratingAuto + ratingManualDelta;
  ratingManualDeltaInput.value = String(ratingManualDelta);
  ratingInfoText.textContent = `Авто-рейтинг: ${ratingAuto.toFixed(1)}, Итоговый: ${ratingTotal.toFixed(1)}`;
  openDialogSafe(ratingEditModal);
}

async function saveRatingEdit() {
  if (!selectedRatingUserId) return;
  const value = Number(ratingManualDeltaInput?.value ?? 0);
  if (Number.isNaN(value)) {
    alert("Введите корректное число");
    return;
  }
  try {
    await apiJson(`/admin/api/users/${encodeURIComponent(selectedRatingUserId)}/rating-manual`, "PATCH", {
      ratingManualDelta: value,
    });
    notify("Рейтинг обновлен");
    closeDialogSafe(ratingEditModal);
    selectedRatingUserId = null;
    await loadRatingUsers();
  } catch (e) {
    alert("Ошибка сохранения: " + String(e.message || e));
  }
}

function renderModerationRequestsTable() {
  const rows = moderationRequests
    .map(
      (req) => `
      <tr>
        <td style="font-family:monospace;">${escapeHtml(req.id || "")}</td>
        <td>${escapeHtml(req.section || "")}</td>
        <td>${escapeHtml(req.telegramId || "")}</td>
        <td>${escapeHtml(req.status || "")}</td>
        <td>${escapeHtml(req.createdAt ? new Date(req.createdAt).toLocaleString("ru-RU") : "-")}</td>
        <td><button class="btn" data-mod-request-id="${escapeHtml(req.id || "")}">Открыть</button></td>
      </tr>
    `
    )
    .join("");
  moderationRequestsTableWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>ID</th><th>Раздел</th><th>Telegram ID</th><th>Статус</th><th>Создано</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="muted">Нет заявок</td></tr>'}</tbody>
    </table>
  `;
}

function renderModerationRequestDetails(requestItem) {
  if (!requestItem) {
    moderationRequestDetailsWrap.innerHTML = '<p class="muted" style="margin:0;">Заявка не найдена.</p>';
    return;
  }
  const formData = requestItem.formData || {};
  const fieldsHtml = Object.entries(formData)
    .map(
      ([key, value]) => `
      <div style="display:grid;grid-template-columns:220px 1fr;gap:8px;align-items:center;">
        <label class="muted">${escapeHtml(key)}</label>
        <input class="input" data-mod-field="${escapeHtml(key)}" value="${escapeHtml(value == null ? "" : String(value))}" />
      </div>
    `
    )
    .join("");

  moderationRequestDetailsWrap.innerHTML = `
    <div class="stack">
      <p style="margin:0;"><strong>ID:</strong> <span style="font-family:monospace;">${escapeHtml(requestItem.id || "")}</span></p>
      <p style="margin:0;"><strong>Раздел:</strong> ${escapeHtml(requestItem.section || "-")}</p>
      <p style="margin:0;"><strong>Статус:</strong> ${escapeHtml(requestItem.status || "-")}</p>
      <label class="muted">Комментарий администратора</label>
      <textarea id="moderationAdminNoteInput" class="textarea" style="min-height:90px;">${escapeHtml(requestItem.adminNote || "")}</textarea>
      <h3 style="margin:6px 0 0 0;font-size:14px;">Поля заявки</h3>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${fieldsHtml || '<p class="muted" style="margin:0;">Нет полей для редактирования</p>'}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px;">
        <button id="moderationSaveBtn" class="btn">Сохранить изменения</button>
        <button id="moderationRejectBtn" class="btn">Отклонить</button>
        <button id="moderationApproveBtn" class="btn btn-primary">Принять и опубликовать</button>
      </div>
      <div id="moderationActionResult" class="muted"></div>
    </div>
  `;
}

function collectModerationFormData(baseFormData) {
  const result = { ...(baseFormData || {}) };
  const inputs = moderationRequestDetailsWrap.querySelectorAll("[data-mod-field]");
  inputs.forEach((input) => {
    const key = input.getAttribute("data-mod-field");
    if (!key) return;
    result[key] = input.value;
  });
  return result;
}

async function loadModerationRequests() {
  const status = moderationStatusFilter?.value || "pending";
  const data = await apiGet(`/admin/api/moderation/requests?status=${encodeURIComponent(status)}`);
  moderationRequests = data.requests || [];
  renderModerationRequestsTable();
}

async function openModerationRequest(requestId) {
  selectedModerationRequestId = requestId;
  const data = await apiGet(`/admin/api/moderation/requests/${encodeURIComponent(requestId)}`);
  renderModerationRequestDetails(data.request);
}

async function saveModerationRequest() {
  if (!selectedModerationRequestId) return;
  const selected = moderationRequests.find((x) => x.id === selectedModerationRequestId);
  const formData = collectModerationFormData(selected?.formData || {});
  const adminNote = document.getElementById("moderationAdminNoteInput")?.value || "";
  await apiJson(`/admin/api/moderation/requests/${encodeURIComponent(selectedModerationRequestId)}`, "PATCH", {
    formData,
    adminNote,
  });
  const result = document.getElementById("moderationActionResult");
  if (result) result.textContent = "Изменения сохранены.";
  await loadModerationRequests();
  await openModerationRequest(selectedModerationRequestId);
}

async function rejectModerationRequest() {
  if (!selectedModerationRequestId) return;
  const adminNote = document.getElementById("moderationAdminNoteInput")?.value || "";
  await apiJson(`/admin/api/moderation/requests/${encodeURIComponent(selectedModerationRequestId)}/reject`, "PATCH", {
    adminNote,
  });
  const result = document.getElementById("moderationActionResult");
  if (result) result.textContent = "Заявка отклонена.";
  await loadModerationRequests();
  await openModerationRequest(selectedModerationRequestId);
}

async function approveModerationRequest() {
  if (!selectedModerationRequestId) return;
  const selected = moderationRequests.find((x) => x.id === selectedModerationRequestId);
  const formData = collectModerationFormData(selected?.formData || {});
  const adminNote = document.getElementById("moderationAdminNoteInput")?.value || "";
  await apiJson(`/admin/api/moderation/requests/${encodeURIComponent(selectedModerationRequestId)}/approve`, "PATCH", {
    formData,
    adminNote,
  });
  const result = document.getElementById("moderationActionResult");
  if (result) result.textContent = "Заявка принята и опубликована.";
  await loadModerationRequests();
  await openModerationRequest(selectedModerationRequestId);
}

async function loadModerators() {
  if (!moderatorsTableWrap) return;
  try {
    const data = await apiGet("/admin/api/moderators");
    moderatorsList = data.moderators || [];
    renderModeratorsTable();
  } catch (err) {
    moderatorsTableWrap.innerHTML = `<p class="muted">Ошибка загрузки: ${escapeHtml(err instanceof Error ? err.message : String(err))}</p>`;
  }
}

function renderModeratorsTable() {
  if (!moderatorsTableWrap) return;
  const rows = moderatorsList
    .map(
      (m) => `
      <tr>
        <td>${escapeHtml(m.label || "")}</td>
        <td class="muted" style="font-size:13px;">${m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</td>
        <td>
          <button class="btn" data-moderator-edit-id="${m.id}">Изменить</button>
          <button class="btn" data-moderator-delete-id="${m.id}">Удалить</button>
        </td>
      </tr>
    `
    )
    .join("");
  moderatorsTableWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>Подпись</th><th>Создан</th><th>Действия</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="muted">Нет модераторов</td></tr>'}</tbody>
    </table>
  `;
}

async function loadLog() {
  if (!logTableWrap) return;
  try {
    const data = await apiGet("/admin/api/log");
    const entries = data.entries || [];
    const rows = entries
      .map(
        (e) => `
      <tr>
        <td class="muted" style="font-size:13px;">${e.createdAt ? new Date(e.createdAt).toLocaleString() : ""}</td>
        <td>${escapeHtml(e.moderatorLabel || "")}</td>
        <td>${escapeHtml(e.actionType || "")}</td>
        <td style="font-family:monospace;">${escapeHtml(e.requestId || "")}</td>
        <td class="muted" style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(e.details || "")}</td>
      </tr>
    `
      )
      .join("");
    logTableWrap.innerHTML = `
      <table class="table">
        <thead><tr><th>Дата</th><th>Модератор</th><th>Действие</th><th>ID заявки</th><th>Детали</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="muted">Записей нет</td></tr>'}</tbody>
      </table>
    `;
  } catch (err) {
    logTableWrap.innerHTML = `<p class="muted">Ошибка загрузки: ${escapeHtml(err instanceof Error ? err.message : String(err))}</p>`;
  }
}

async function loadSupportRequests() {
  if (!supportRequestsTableWrap) return;
  try {
    const data = await apiGet("/admin/api/support-requests");
    const requests = data.requests || [];
    const rows = requests
      .map(
        (r) => {
          const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString() : "";
          const username = r.username ? escapeHtml(r.username) : "—";
          const profileLink = r.username
            ? `<a href="https://t.me/${escapeHtml(r.username)}" target="_blank" rel="noopener">@${escapeHtml(r.username)}</a>`
            : escapeHtml(String(r.telegramId || ""));
          const message = escapeHtml(r.message || "");
          return `
      <tr>
        <td class="muted" style="font-size:13px;">${dateStr}</td>
        <td>${username}</td>
        <td>${profileLink}</td>
        <td style="font-size:13px;max-width:300px;word-break:break-word;">${message}</td>
      </tr>
    `;
        }
      )
      .join("");
    supportRequestsTableWrap.innerHTML = `
      <table class="table">
        <thead><tr><th>Дата и время</th><th>Юзернейм</th><th>Ссылка на профиль</th><th>Текст обращения</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="muted">Обращений нет</td></tr>'}</tbody>
      </table>
    `;
  } catch (err) {
    supportRequestsTableWrap.innerHTML = `<p class="muted">Ошибка загрузки: ${escapeHtml(err instanceof Error ? err.message : String(err))}</p>`;
  }
}

function resetFaqEditor() {
  editingFaqId = null;
  faqIdInput.value = "";
  faqTitleInput.value = "";
  faqTextInput.value = "";
}

function renderFaqTable() {
  const rows = faqItems
    .map(
      (item) => `
      <tr>
        <td style="font-family:monospace;">${escapeHtml(item.id || "")}</td>
        <td>${escapeHtml(item.title || "")}</td>
        <td>
          <button class="btn" data-faq-action="edit" data-faq-id="${escapeHtml(item.id || "")}">Редактировать</button>
          <button class="btn" data-faq-action="delete" data-faq-id="${escapeHtml(item.id || "")}">Удалить</button>
        </td>
      </tr>
    `
    )
    .join("");
  faqTableWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>ID</th><th>Вопрос</th><th>Действия</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="muted">FAQ пуст</td></tr>'}</tbody>
    </table>
  `;
}

async function loadFaqConfig() {
  const data = await apiGet("/admin/api/config/faq");
  faqItems = data?.payload?.items || [];
  renderFaqTable();
}

async function saveFaqConfig() {
  const item = {
    id: faqIdInput.value.trim(),
    title: faqTitleInput.value.trim(),
    text: faqTextInput.value.trim(),
  };
  if (!item.id || !item.title || !item.text) {
    alert("Заполните id, заголовок и текст");
    return;
  }
  const idx = faqItems.findIndex((it) => String(it.id) === String(editingFaqId || item.id));
  if (idx >= 0) faqItems[idx] = item;
  else faqItems.push(item);
  await apiJson("/admin/api/config/faq", "PUT", { payload: { items: faqItems } });
  resetFaqEditor();
  await loadFaqConfig();
}

function renderBotPhotoPreview() {
  if (!botWelcomePhotoPreviewWrap) return;
  const url = botConfig?.welcomePhotoUrl;
  if (!url) {
    botWelcomePhotoPreviewWrap.innerHTML = '<p class="muted" style="margin:0;">Фото не загружено.</p>';
    return;
  }
  botWelcomePhotoPreviewWrap.innerHTML = `
    <img src="${escapeHtml(url)}" alt="welcome photo" style="max-width:220px;border-radius:8px;border:1px solid var(--color-border);" />
    <p class="muted" style="margin:6px 0 0 0;word-break:break-all;">${escapeHtml(url)}</p>
  `;
}

async function loadBotConfig() {
  const data = await apiGet("/admin/api/config/bot");
  botConfig = data?.payload || { welcomeMessage: "", welcomePhotoUrl: null, supportLink: "" };
  if (botWelcomeMessageInput) botWelcomeMessageInput.value = botConfig.welcomeMessage || "";
  if (botSupportLinkInput) botSupportLinkInput.value = botConfig.supportLink || "";
  renderBotPhotoPreview();
}

async function uploadBotPhoto() {
  const file = botWelcomePhotoInput?.files?.[0];
  if (!file) {
    alert("Сначала выберите фото");
    return;
  }
  const formData = new FormData();
  formData.append("photo", file);
  const res = await fetch("/admin/api/config/bot/upload-photo", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const data = await res.json();
  botConfig.welcomePhotoUrl = data.url;
  renderBotPhotoPreview();
  notify("Фото загружено");
}

async function saveBotConfig() {
  const payload = {
    welcomeMessage: (botWelcomeMessageInput?.value || "").trim(),
    welcomePhotoUrl: botConfig?.welcomePhotoUrl || null,
    supportLink: (botSupportLinkInput?.value || "").trim() || null,
  };
  await apiJson("/admin/api/config/bot", "PUT", { payload });
  notify("Настройки бота сохранены");
  await loadBotConfig();
}

function renderBotMessagePhotoPreview(file) {
  if (!botMessagePhotoPreviewWrap || !botMessagePhotoPreviewImg) return;
  if (!file) {
    botMessagePhotoPreviewWrap.style.display = "none";
    if (botMessagePhotoPreviewImg.src) {
      URL.revokeObjectURL(botMessagePhotoPreviewImg.src);
      botMessagePhotoPreviewImg.src = "";
    }
    return;
  }
  const objectUrl = URL.createObjectURL(file);
  botMessagePhotoPreviewImg.src = objectUrl;
  botMessagePhotoPreviewWrap.style.display = "block";
}

function handleBotMessagePhotoFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Выберите файл изображения");
    return;
  }
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("Размер файла не должен превышать 10 МБ");
    return;
  }
  botMessagePhotoFile = file;
  renderBotMessagePhotoPreview(file);
}

function clearBotMessagePhoto() {
  botMessagePhotoFile = null;
  if (botMessagePhotoInput) botMessagePhotoInput.value = "";
  renderBotMessagePhotoPreview(null);
}

async function sendBotMessage() {
  const telegramId = (botMessageTelegramIdInput?.value || "").trim();
  const sendToAll = Boolean(botMessageSendAllInput?.checked);
  const message = (botMessageTextInput?.value || "").trim();

  if (!message && !botMessagePhotoFile) {
    alert("Введите текст сообщения или прикрепите изображение");
    return;
  }

  let result;
  if (botMessagePhotoFile) {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("photo", botMessagePhotoFile);
    formData.append("telegramId", telegramId);
    formData.append("sendToAll", sendToAll ? "true" : "false");
    const res = await fetch("/admin/api/bot/send-message", {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    result = await res.json();
  } else {
    const payload = {
      telegramId,
      sendToAll,
      message,
    };
    result = await apiJson("/admin/api/bot/send-message", "POST", payload);
  }
  const failedCount = Array.isArray(result.failed) ? result.failed.length : 0;
  botMessageResult.innerHTML = `Отправлено: <strong>${result.sent || 0}</strong> из <strong>${result.total || 0}</strong>${
    failedCount ? `, ошибок: <strong>${failedCount}</strong>` : ""
  }`;
  clearBotMessagePhoto();
}

async function loadExchangeOptionsConfig() {
  try {
    const data = await apiGet("/admin/api/config/exchange-options");
    const payload = data?.payload || { jobTypes: [], currencies: [] };
    exchangeOptions = {
      jobTypes: Array.isArray(payload.jobTypes) ? payload.jobTypes : [],
      currencies: Array.isArray(payload.currencies) ? payload.currencies : [],
    };
  } catch (err) {
    exchangeOptions = { jobTypes: [], currencies: [] };
  }
  renderJobTypesTable();
  renderCurrenciesTable();
}

function renderJobTypesTable() {
  if (!jobTypesTableWrap) return;
  const rows = exchangeOptions.jobTypes
    .map(
      (item, i) => `
    <tr>
      <td><input type="text" class="input" data-extra-input="jobType-value" data-extra-index="${i}" value="${escapeHtml(item.value || "")}" placeholder="value" style="width:100%;" /></td>
      <td><input type="text" class="input" data-extra-input="jobType-label" data-extra-index="${i}" value="${escapeHtml(item.label || "")}" placeholder="подпись" style="width:100%;" /></td>
      <td><button type="button" class="btn" data-extra-delete="jobType" data-extra-index="${i}">Удалить</button></td>
    </tr>
  `
    )
    .join("");
  jobTypesTableWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>Значение (value)</th><th>Подпись</th><th>Действия</th></tr></thead>
      <tbody>${rows || "<tr><td colspan=\"3\" class=\"muted\">Нет пунктов</td></tr>"}</tbody>
    </table>
  `;
}

function renderCurrenciesTable() {
  if (!currenciesTableWrap) return;
  const rows = exchangeOptions.currencies
    .map(
      (item, i) => `
    <tr>
      <td><input type="text" class="input" data-extra-input="currency-value" data-extra-index="${i}" value="${escapeHtml(item.value || "")}" placeholder="value" style="width:100%;" /></td>
      <td><input type="text" class="input" data-extra-input="currency-label" data-extra-index="${i}" value="${escapeHtml(item.label || "")}" placeholder="подпись" style="width:100%;" /></td>
      <td><button type="button" class="btn" data-extra-delete="currency" data-extra-index="${i}">Удалить</button></td>
    </tr>
  `
    )
    .join("");
  currenciesTableWrap.innerHTML = `
    <table class="table">
      <thead><tr><th>Значение (value)</th><th>Подпись</th><th>Действия</th></tr></thead>
      <tbody>${rows || "<tr><td colspan=\"3\" class=\"muted\">Нет пунктов</td></tr>"}</tbody>
    </table>
  `;
}

document.addEventListener("input", (e) => {
  const el = e.target.closest("[data-extra-input]");
  if (!el) return;
  const kind = el.dataset.extraInput;
  const i = parseInt(el.dataset.extraIndex, 10);
  if (Number.isNaN(i) || i < 0) return;
  if (kind === "jobType-value" && exchangeOptions.jobTypes[i]) exchangeOptions.jobTypes[i].value = el.value || "";
  if (kind === "jobType-label" && exchangeOptions.jobTypes[i]) exchangeOptions.jobTypes[i].label = el.value || "";
  if (kind === "currency-value" && exchangeOptions.currencies[i]) exchangeOptions.currencies[i].value = el.value || "";
  if (kind === "currency-label" && exchangeOptions.currencies[i]) exchangeOptions.currencies[i].label = el.value || "";
});

async function saveExchangeOptions() {
  const jobTypes = exchangeOptions.jobTypes.map((o) => ({ value: (o.value || "").trim(), label: (o.label || "").trim() })).filter((o) => o.value && o.label);
  const currencies = exchangeOptions.currencies.map((o) => ({ value: (o.value || "").trim(), label: (o.label || "").trim() })).filter((o) => o.value && o.label);
  if (jobTypes.length === 0) {
    alert("Добавьте хотя бы один тип вакансии (value и подпись не пустые)");
    return;
  }
  if (currencies.length === 0) {
    alert("Добавьте хотя бы одну валюту (value и подпись не пустые)");
    return;
  }
  await apiJson("/admin/api/config/exchange-options", "PUT", { payload: { jobTypes, currencies } });
  notify("Сохранено");
  exchangeOptions = { jobTypes, currencies };
  renderJobTypesTable();
  renderCurrenciesTable();
}

async function switchTab(tabId) {
  activeTab = tabId;
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tabBtn === tabId));
  tabViews.forEach((view) => {
    view.style.display = view.id === `tab-${tabId}` ? "" : "none";
  });

  if (tabId === "home") await loadDashboard();
  if (tabId === "main-edit") await loadMainPageConfig();
  if (tabId === "banners") await loadBannersConfig();
  if (tabId === "exchange") await loadCategories();
  if (tabId === "guarant") await loadGuarantConfig();
  if (tabId === "users") await loadAdminUsers();
  if (tabId === "labels") await loadLabels();
  if (tabId === "rating") await loadRatingUsers();
  if (tabId === "moderation") await loadModerationRequests();
  if (tabId === "moderators") await loadModerators();
  if (tabId === "log") await loadLog();
  if (tabId === "support") await loadSupportRequests();
  if (tabId === "faq") await loadFaqConfig();
  if (tabId === "extra") await loadExchangeOptionsConfig();
  if (tabId === "bot") await loadBotConfig();
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

  const bannerActionBtn = e.target.closest("[data-banner-action]");
  if (bannerActionBtn) {
    const index = Number(bannerActionBtn.dataset.bannerIndex);
    if (bannerActionBtn.dataset.bannerAction === "up") bannerMoveUp(index);
    else if (bannerActionBtn.dataset.bannerAction === "down") bannerMoveDown(index);
    else if (bannerActionBtn.dataset.bannerAction === "delete") bannerDelete(index);
  }

  const userSelectBtn = e.target.closest("[data-user-select-id]");
  if (userSelectBtn) {
    await openAdminUserCard(userSelectBtn.dataset.userSelectId);
    return;
  }

  const faqActionBtn = e.target.closest("[data-faq-action]");
  if (faqActionBtn) {
    const faqId = faqActionBtn.dataset.faqId;
    const idx = faqItems.findIndex((item) => String(item.id) === String(faqId));
    if (idx < 0) return;
    if (faqActionBtn.dataset.faqAction === "edit") {
      const item = faqItems[idx];
      editingFaqId = item.id;
      faqIdInput.value = item.id || "";
      faqTitleInput.value = item.title || "";
      faqTextInput.value = item.text || "";
      return;
    }
    if (faqActionBtn.dataset.faqAction === "delete") {
      if (!confirm("Удалить FAQ?")) return;
      faqItems.splice(idx, 1);
      await apiJson("/admin/api/config/faq", "PUT", { payload: { items: faqItems } });
      if (editingFaqId && String(editingFaqId) === String(faqId)) {
        resetFaqEditor();
      }
      await loadFaqConfig();
      return;
    }
  }

  const extraDeleteBtn = e.target.closest("[data-extra-delete]");
  if (extraDeleteBtn) {
    const kind = extraDeleteBtn.dataset.extraDelete;
    const i = parseInt(extraDeleteBtn.dataset.extraIndex, 10);
    if (Number.isNaN(i) || i < 0) return;
    if (kind === "jobType") {
      exchangeOptions.jobTypes.splice(i, 1);
      renderJobTypesTable();
    } else if (kind === "currency") {
      exchangeOptions.currencies.splice(i, 1);
      renderCurrenciesTable();
    }
    return;
  }

  const moderationRequestBtn = e.target.closest("[data-mod-request-id]");
  if (moderationRequestBtn) {
    await openModerationRequest(moderationRequestBtn.dataset.modRequestId);
    return;
  }

  const modEditBtn = e.target.closest("[data-moderator-edit-id]");
  if (modEditBtn) {
    const id = modEditBtn.dataset.moderatorEditId;
    const m = moderatorsList.find((x) => String(x.id) === String(id));
    if (!m || !editModeratorFormWrap || !editModeratorIdInput) return;
    selectedModeratorId = id;
    if (editModeratorIdInput) editModeratorIdInput.value = id;
    if (editModeratorLabelInput) editModeratorLabelInput.value = m.label || "";
    if (editModeratorPasswordInput) editModeratorPasswordInput.value = "";
    if (editModeratorWrap) editModeratorWrap.style.display = "none";
    if (editModeratorFormWrap) editModeratorFormWrap.style.display = "block";
    return;
  }

  const modDeleteBtn = e.target.closest("[data-moderator-delete-id]");
  if (modDeleteBtn) {
    const id = modDeleteBtn.dataset.moderatorDeleteId;
    if (!confirm("Удалить этого модератора? Пароль перестанет действовать.")) return;
    try {
      await apiJson(`/admin/api/moderators/${id}`, "DELETE", {});
      await loadModerators();
      if (editModeratorFormWrap && selectedModeratorId === id) {
        editModeratorFormWrap.style.display = "none";
        if (editModeratorWrap) editModeratorWrap.style.display = "";
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
    return;
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
document.getElementById("bannerUploadBtn")?.addEventListener("click", () => uploadBanner().catch((err) => notify("Ошибка загрузки: " + (err.message || err))));
addHotOfferBtn.addEventListener("click", () => {
  editingHotOfferIndex = null;
  openHotOfferModal(null);
});
hotOfferCancelBtn.addEventListener("click", () => {
  editingHotOfferIndex = null;
  closeDialogSafe(hotOfferModal);
});
hotOfferSaveBtn.addEventListener("click", saveHotOfferFromModal);
attachAdToHotOfferBtn?.addEventListener("click", openAttachAdHotOfferModal);
attachAdCategorySelect?.addEventListener("change", () => loadAttachAdItems(attachAdCategorySelect.value));
attachAdHotOfferCloseBtn?.addEventListener("click", () => closeDialogSafe(attachAdHotOfferModal));
attachAdItemsListWrap?.addEventListener("click", (e) => {
  const btn = e.target.closest(".attach-ad-add-btn");
  if (!btn) return;
  const id = btn.getAttribute("data-attach-ad-id");
  const item = attachAdCurrentItems.find((it) => String(it.id) === id);
  if (item) addHotOfferFromAd(item, attachAdCategorySelect?.value || "ads");
});
saveGuarantBtn.addEventListener("click", saveGuarantConfig);
adminUsersSearchBtn?.addEventListener("click", loadAdminUsers);
adminUsersSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadAdminUsers();
});
ratingUsersRefreshBtn?.addEventListener("click", loadRatingUsers);
ratingUsersSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadRatingUsers();
});
ratingEditCancelBtn?.addEventListener("click", () => {
  selectedRatingUserId = null;
  closeDialogSafe(ratingEditModal);
});
ratingEditSaveBtn?.addEventListener("click", saveRatingEdit);
ratingUsersTableWrap?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-rating-edit-user-id]");
  if (btn) {
    const userId = btn.getAttribute("data-rating-edit-user-id");
    if (userId) await openRatingEditModal(userId);
  }
});
addFaqBtn?.addEventListener("click", resetFaqEditor);
faqResetBtn?.addEventListener("click", resetFaqEditor);
saveFaqBtn?.addEventListener("click", saveFaqConfig);
addJobTypeBtn?.addEventListener("click", () => {
  exchangeOptions.jobTypes.push({ value: "", label: "" });
  renderJobTypesTable();
});
addCurrencyBtn?.addEventListener("click", () => {
  exchangeOptions.currencies.push({ value: "", label: "" });
  renderCurrenciesTable();
});
saveExchangeOptionsBtn?.addEventListener("click", saveExchangeOptions);
moderationRefreshBtn?.addEventListener("click", loadModerationRequests);
moderationStatusFilter?.addEventListener("change", loadModerationRequests);
uploadBotPhotoBtn?.addEventListener("click", async () => {
  try {
    await uploadBotPhoto();
  } catch (error) {
    alert(error instanceof Error ? error.message : String(error));
  }
});
saveBotConfigBtn?.addEventListener("click", async () => {
  try {
    await saveBotConfig();
  } catch (error) {
    alert(error instanceof Error ? error.message : String(error));
  }
});
sendBotMessageBtn?.addEventListener("click", async () => {
  try {
    await sendBotMessage();
  } catch (error) {
    botMessageResult.textContent = `Ошибка отправки: ${error instanceof Error ? error.message : String(error)}`;
  }
});

botMessagePhotoInput?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) handleBotMessagePhotoFile(file);
});

botMessagePhotoDropZone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  botMessagePhotoDropZone.style.backgroundColor = "var(--color-surface, #f5f5f5)";
  botMessagePhotoDropZone.style.borderColor = "var(--color-accent, #007bff)";
});

botMessagePhotoDropZone?.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  botMessagePhotoDropZone.style.backgroundColor = "";
  botMessagePhotoDropZone.style.borderColor = "var(--border-color, #ddd)";
});

botMessagePhotoDropZone?.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  botMessagePhotoDropZone.style.backgroundColor = "";
  botMessagePhotoDropZone.style.borderColor = "var(--border-color, #ddd)";
  const file = e.dataTransfer.files?.[0];
  if (file) handleBotMessagePhotoFile(file);
});

botMessagePhotoDropZone?.addEventListener("click", () => {
  botMessagePhotoInput?.click();
});

botMessagePhotoRemoveBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  clearBotMessagePhoto();
});

createModeratorBtn?.addEventListener("click", async () => {
  const password = newModeratorPasswordInput?.value?.trim();
  if (!password) {
    alert("Введите пароль");
    return;
  }
  const label = newModeratorLabelInput?.value?.trim() || "";
  try {
    await apiJson("/admin/api/moderators", "POST", { password, label });
    if (newModeratorPasswordInput) newModeratorPasswordInput.value = "";
    if (newModeratorLabelInput) newModeratorLabelInput.value = "";
    await loadModerators();
  } catch (err) {
    alert(err instanceof Error ? err.message : String(err));
  }
});

saveModeratorBtn?.addEventListener("click", async () => {
  const id = editModeratorIdInput?.value;
  if (!id) return;
  const label = editModeratorLabelInput?.value?.trim() || "";
  const password = editModeratorPasswordInput?.value?.trim() || null;
  const payload = { label };
  if (password) payload.password = password;
  try {
    await apiJson(`/admin/api/moderators/${id}`, "PATCH", payload);
    editModeratorFormWrap.style.display = "none";
    if (editModeratorWrap) editModeratorWrap.style.display = "";
    if (editModeratorPasswordInput) editModeratorPasswordInput.value = "";
    await loadModerators();
  } catch (err) {
    alert(err instanceof Error ? err.message : String(err));
  }
});

cancelEditModeratorBtn?.addEventListener("click", () => {
  if (editModeratorFormWrap) editModeratorFormWrap.style.display = "none";
  if (editModeratorWrap) editModeratorWrap.style.display = "";
  selectedModeratorId = null;
});

refreshLogBtn?.addEventListener("click", loadLog);
refreshSupportBtn?.addEventListener("click", loadSupportRequests);

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
  document.body.addEventListener("change", (evt) => {
    if (evt.target?.id === "adminUserAddLabelSelect") {
      const select = evt.target;
      const colorInput = document.getElementById("adminUserLabelColorInput");
      if (select && colorInput) {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.value) {
          const defaultColor = selectedOption.dataset.color || "#0070f3";
          colorInput.value = defaultColor;
          colorInput.style.background = defaultColor;
        } else {
          colorInput.value = "#0070f3";
          colorInput.style.background = "#0070f3";
        }
        updateAdminUserLabelColorPreview();
      }
    }
    if (evt.target?.id === "adminUserLabelColorInput") {
      updateAdminUserLabelColorPreview();
    }
  });
  document.body.addEventListener("input", (evt) => {
    if (evt.target?.id === "adminUserLabelColorInput") {
      updateAdminUserLabelColorPreview();
    }
  });
  document.body.addEventListener("click", async (evt) => {
    if (evt.target?.id === "adminUserSaveRatingBtn") {
      await saveAdminUserRating();
    }
    if (evt.target?.id === "adminUserSaveVerifiedBtn") {
      await saveAdminUserVerified();
    }
    if (evt.target?.id === "adminUserSaveScamBtn") {
      await saveAdminUserScam();
    }
    if (evt.target?.id === "adminUserSaveBlockedBtn") {
      await saveAdminUserBlocked();
    }
    if (evt.target?.id === "adminCreateLabelBtn") {
      await createLabel();
    }
    const labelEditBtn = evt.target?.closest("[data-label-edit-id]");
    if (labelEditBtn) {
      await updateLabel(labelEditBtn.dataset.labelEditId);
    }
    const labelDeleteBtn = evt.target?.closest("[data-label-delete-id]");
    if (labelDeleteBtn) {
      await deleteLabel(labelDeleteBtn.dataset.labelDeleteId);
    }
    if (evt.target?.id === "adminUserAddLabelBtn" && selectedAdminUserId) {
      const select = document.getElementById("adminUserAddLabelSelect");
      const colorInput = document.getElementById("adminUserLabelColorInput");
      const labelId = select?.value || "";
      const color = colorInput?.value || "";
      if (!labelId) {
        alert("Выберите метку для добавления");
        return;
      }
      await addLabelToUser(selectedAdminUserId, labelId, color);
      if (select) select.value = "";
      if (colorInput) colorInput.value = "#0070f3";
    }
    const userLabelRemoveBtn = evt.target?.closest("[data-user-label-remove-id]");
    if (userLabelRemoveBtn && selectedAdminUserId) {
      await removeLabelFromUser(selectedAdminUserId, userLabelRemoveBtn.dataset.userLabelRemoveId);
    }
    if (evt.target?.id === "moderationSaveBtn") {
      await saveModerationRequest();
    }
    if (evt.target?.id === "moderationRejectBtn") {
      await rejectModerationRequest();
    }
    if (evt.target?.id === "moderationApproveBtn") {
      await approveModerationRequest();
    }
  });
  if (adminRole === "moderator") {
    applyModeratorLayout();
    await switchTab("moderation");
  } else {
    await switchTab("home");
  }
});
