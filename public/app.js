const state = {
  file: null,
  previewUrl: "",
  skills: [],
  selected: new Set(),
  results: new Map(),
  running: false,
  activeGenerations: 0,
  runFailed: false,
  apiConfigured: false,
  activeFlowStep: "upload",
};

const elements = {
  apiState: document.querySelector("#apiState"),
  hero: document.querySelector("#hero"),
  meta: document.querySelector("#meta"),
  narrative: document.querySelector("#narrative"),
  uploadZone: document.querySelector("#uploadZone"),
  uploadEmpty: document.querySelector("#uploadEmpty"),
  sourcePreview: document.querySelector("#sourcePreview"),
  imageInput: document.querySelector("#imageInput"),
  sourceFile: document.querySelector("#sourceFile span"),
  sizeSelect: document.querySelector("#sizeSelect"),
  noteInput: document.querySelector("#noteInput"),
  skillGrid: document.querySelector("#skillGrid"),
  toggleAll: document.querySelector("#toggleAll"),
  selectionCount: document.querySelector("#selectionCount"),
  generateButton: document.querySelector("#generateButton"),
  resultsEmpty: document.querySelector("#resultsEmpty"),
  resultsGrid: document.querySelector("#resultsGrid"),
  clearResults: document.querySelector("#clearResults"),
  openInstall: document.querySelector("#openInstall"),
  installDialog: document.querySelector("#installDialog"),
  packageInput: document.querySelector("#packageInput"),
  packageName: document.querySelector("#packageName"),
  installButton: document.querySelector("#installButton"),
  toast: document.querySelector("#toast"),
  systemModel: document.querySelector("#systemModel"),
  systemMode: document.querySelector("#systemMode"),
  systemCount: document.querySelector("#systemCount"),
  generateCount: document.querySelector("#generateCount"),
  runState: document.querySelector("#runState"),
  heroStatus: document.querySelector("#heroStatus"),
  sectionStatus: document.querySelector("#sectionStatus"),
  generateLabel: document.querySelector("#generateLabel"),
  flowNav: document.querySelector(".flow-nav"),
  flowSteps: [...document.querySelectorAll("[data-step-target]")],
  flowStages: [...document.querySelectorAll("[data-flow-step]")],
  continueToSkills: document.querySelector("#continueToSkills"),
  backToUpload: document.querySelector("#backToUpload"),
  continueToGenerate: document.querySelector("#continueToGenerate"),
  backToSkills: document.querySelector("#backToSkills"),
  skillsStage: document.querySelector("#skillsStage"),
};

const resultStatusLabels = {
  loading: "PROCESSING",
  success: "READY",
  error: "FAILED",
};

const staticSkillCatalog = [
  {
    id: "gc-minimal-zine-poster-v0-3",
    name: "Minimal Zine",
    description: "大面积纸张留白、小型照片事件和单一高饱和色的独立杂志海报。",
    version: "0.3.1",
    accent: "#2157d5",
    preservation: "high",
    defaultSize: "1024x1792",
  },
  {
    id: "photo-abstract-editorial",
    name: "Photo Abstract",
    description: "忠实照片与无纹理象牙色抽象记忆面板组成的干净编辑作品。",
    version: "1.0.0",
    accent: "#557689",
    preservation: "high",
    defaultSize: "1024x1792",
  },
  {
    id: "photo-relic-editorial",
    name: "Photo Relic",
    description: "保留真实照片，并在下方生成来源于照片的现代版画记忆遗迹。",
    version: "1.0.0",
    accent: "#a45a32",
    preservation: "high",
    defaultSize: "1024x1792",
  },
  {
    id: "scenes-gathered-zine-v1-3",
    name: "Gathered Scenes",
    description: "真实照片锚点、手撕纤维边缘与大块源生抽象场景共同组成的纸感海报。",
    version: "1.3.0",
    accent: "#d6402f",
    preservation: "high",
    defaultSize: "1024x1792",
  },
];

// The narrative layout may omit legacy status controls; detached fallbacks keep
// the data flow alive without making those controls mandatory.
elements.selectionCount ||= document.createElement("span");
elements.toggleAll ||= document.createElement("button");
elements.generateButton ||= document.createElement("button");

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function showToast(message) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { elements.toast.hidden = true; }, 3600);
}

function formatCount(value) {
  return String(value).padStart(2, "0");
}

function setRunState(status) {
  const stateValue = status.toLowerCase();
  for (const node of [elements.runState, elements.heroStatus, elements.sectionStatus]) {
    if (!node) continue;
    node.textContent = status;
    node.dataset.state = stateValue;
  }
  for (const node of [elements.hero, elements.meta, elements.narrative]) {
    if (node) node.dataset.runState = stateValue;
  }
}

function isCompactFlow() {
  return window.matchMedia?.("(max-width: 760px)").matches ?? false;
}

function showFlowStep(step, { scroll = true } = {}) {
  const validSteps = new Set(["upload", "skills", "generate"]);
  if (!validSteps.has(step)) return;
  state.activeFlowStep = step;
  for (const button of elements.flowSteps) {
    const active = button.dataset.stepTarget === step;
    button.classList.toggle("is-active", active);
    button.toggleAttribute("aria-current", active);
    if (!active) button.removeAttribute("aria-current");
  }
  for (const stage of elements.flowStages) {
    stage.hidden = isCompactFlow() && stage.dataset.flowStep !== step;
  }
  if (scroll && isCompactFlow()) {
    const targetStage = elements.flowStages.find((stage) => stage.dataset.flowStep === step);
    targetStage?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  refreshIcons();
}

function syncFlowLayout() {
  showFlowStep(state.activeFlowStep, { scroll: false });
}

let selectionGesture = null;

function selectionAreaPoint(event, area) {
  const bounds = area.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function updateSelectionBox(event) {
  if (!selectionGesture || event.pointerId !== selectionGesture.pointerId) return;
  const point = selectionAreaPoint(event, selectionGesture.area);
  const left = Math.min(selectionGesture.start.x, point.x);
  const top = Math.min(selectionGesture.start.y, point.y);
  const width = Math.abs(point.x - selectionGesture.start.x);
  const height = Math.abs(point.y - selectionGesture.start.y);
  selectionGesture.moved ||= width > 8 || height > 8;
  Object.assign(selectionGesture.box.style, {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
}

function finishSelectionBox(event) {
  if (!selectionGesture || event.pointerId !== selectionGesture.pointerId) return;
  const gesture = selectionGesture;
  updateSelectionBox(event);
  if (gesture.moved) {
    const box = gesture.box.getBoundingClientRect();
    const selected = new Set();
    for (const card of elements.skillGrid?.querySelectorAll(".skill-card") || []) {
      const cardRect = card.getBoundingClientRect();
      const overlaps = cardRect.left < box.right && cardRect.right > box.left
        && cardRect.top < box.bottom && cardRect.bottom > box.top;
      if (overlaps) selected.add(card.dataset.skillId);
    }
    state.selected = selected;
    renderSkills();
  }
  try { gesture.area.releasePointerCapture(event.pointerId); } catch { /* pointer already released */ }
  gesture.box.remove();
  selectionGesture = null;
}

function beginSelectionBox(event) {
  if (event.pointerType === "touch" || event.button !== 0 || selectionGesture) return;
  if (event.target.closest?.("button, a, input, select, textarea, .skill-card")) return;
  const area = elements.skillsStage;
  if (!area) return;
  const point = selectionAreaPoint(event, area);
  const box = document.createElement("div");
  box.className = "skill-selection-box";
  area.append(box);
  selectionGesture = { area, box, pointerId: event.pointerId, start: point, moved: false };
  area.setPointerCapture(event.pointerId);
  event.preventDefault();
}

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `请求失败（HTTP ${response.status}）`);
  return payload;
}

async function loadHealth() {
  try {
    const payload = await readJson(await fetch("/api/health"));
    state.apiConfigured = Boolean(payload.configured);
    if (elements.systemModel) elements.systemModel.textContent = payload.model || "IMAGE";
    if (elements.apiState) elements.apiState.className = `api-state ${payload.configured ? "ready" : "error"}`;
    const apiMessage = elements.apiState?.querySelector("span:last-child");
    if (apiMessage) apiMessage.textContent = payload.configured
      ? `${payload.model} · ${payload.upstream}`
      : "接口未配置";
  } catch {
    state.apiConfigured = false;
    if (!elements.apiState) return;
    if (elements.apiState) elements.apiState.className = "api-state error";
    if (!elements.apiState.querySelector("span:last-child")) return;
    elements.apiState.querySelector("span:last-child").textContent = "后端未连接";
  }
  updateSelectionUi();
}

async function loadSkills({ preserveSelection = false } = {}) {
  const previous = new Set(state.selected);
  try {
    const payload = await readJson(await fetch("/api/skills"));
    if (!Array.isArray(payload.skills)) throw new Error("Skill 目录响应无效。");
    state.skills = payload.skills;
  } catch {
    state.skills = staticSkillCatalog;
  }
  state.selected = new Set(
    preserveSelection
      ? state.skills.filter((skill) => previous.has(skill.id)).map((skill) => skill.id)
      : state.skills.map((skill) => skill.id),
  );
  renderSkills();
}

function renderSkills() {
  if (!elements.skillGrid) return;
  elements.skillGrid.replaceChildren();
  for (const [index, skill] of state.skills.entries()) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `skill-card${state.selected.has(skill.id) ? " selected" : ""}`;
    // CSP-safe hook for static accent rules in the narrative stylesheet.
    card.dataset.skillAccent = String(skill.accent || "").replace(/^#/, "").toLowerCase();
    card.setAttribute("aria-pressed", String(state.selected.has(skill.id)));
    card.dataset.skillId = skill.id;
    card.innerHTML = `
      <span class="skill-card-top">
        <span class="skill-index" aria-hidden="true"></span>
        <span class="check-mark"><i data-lucide="check" aria-hidden="true"></i></span>
      </span>
      <h3></h3>
      <p></p>
      <span class="skill-meta"><span></span><span></span></span>`;
    card.querySelector(".skill-index").textContent = formatCount(index + 1);
    card.querySelector("h3").textContent = skill.name;
    card.querySelector("p").textContent = skill.description;
    const meta = card.querySelectorAll(".skill-meta span");
    meta[0].textContent = `v${skill.version}`;
    meta[1].textContent = `${skill.preservation} preservation`;
    card.addEventListener("click", () => toggleSkill(skill.id));
    elements.skillGrid.append(card);
  }
  updateSelectionUi();
  refreshIcons();
}

function toggleSkill(id) {
  if (state.running) return;
  if (state.selected.has(id)) state.selected.delete(id);
  else state.selected.add(id);
  renderSkills();
}

function updateSelectionUi() {
  const count = state.selected.size;
  const formattedCount = `${formatCount(count)} / ${formatCount(state.skills.length)}`;
  elements.selectionCount.textContent = `${count} 个 Skill`;
  if (elements.systemCount) elements.systemCount.textContent = formattedCount;
  if (elements.generateCount) elements.generateCount.textContent = formattedCount;
  if (elements.sectionStatus && !elements.runState && !state.running) {
    elements.sectionStatus.textContent = `${formattedCount} SELECTED`;
  }
  if (elements.generateLabel) {
    const label = count ? `GENERATE / ${formatCount(count)} EDITIONS` : "GENERATE";
    const hasBrackets = Boolean(elements.generateLabel.parentElement?.querySelector(".button-bracket"));
    elements.generateLabel.textContent = hasBrackets ? label : `[ ${label} ]`;
  }
  elements.toggleAll.textContent = count === state.skills.length ? "取消全选" : "全部选择";
  elements.generateButton.disabled = !state.file || count === 0 || state.running || !state.apiConfigured;
  if (elements.continueToSkills) elements.continueToSkills.disabled = !state.file;
  if (elements.continueToGenerate) elements.continueToGenerate.disabled = !state.file || count === 0;
}

function setFile(file) {
  if (!file) return;
  elements.sourcePreview ||= document.createElement("img");
  elements.uploadEmpty ||= document.createElement("span");
  elements.sourceFile ||= document.createElement("span");
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return showToast("请选择 JPG、PNG 或 WebP 图片。");
  if (file.size > 15 * 1024 * 1024) return showToast("图片不能超过 15 MB。");
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.file = file;
  state.previewUrl = URL.createObjectURL(file);
  elements.sourcePreview.src = state.previewUrl;
  elements.sourcePreview.hidden = false;
  elements.uploadEmpty.hidden = true;
  elements.sourceFile.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  updateSelectionUi();
  showFlowStep("skills");
}

function createResultCard(skill, status, payload = {}) {
  const card = document.createElement("article");
  const visibleStatus = resultStatusLabels[status] || String(status).toUpperCase();
  card.className = `result-card result-card-${status}`;
  card.dataset.skillId = skill.id;
  card.dataset.status = visibleStatus.toLowerCase();
  const media = document.createElement("div");
  media.className = "result-media";

  if (status === "loading") {
    media.innerHTML = `<div class="result-loading"><span class="spinner"></span><span>正在生成 ${skill.name}</span></div>`;
  } else if (status === "error") {
    media.innerHTML = `<div class="result-error"><i data-lucide="circle-alert" aria-hidden="true"></i><span></span></div>`;
    media.querySelector("span").textContent = payload.error;
  } else {
    const image = document.createElement("img");
    image.src = payload.url;
    image.alt = `${skill.name} 生成结果`;
    media.append(image);
  }

  const footer = document.createElement("footer");
  footer.className = "result-footer";
  footer.innerHTML = `
    <div class="result-title"><strong></strong><span></span></div>
    <div class="result-actions"></div>`;
  footer.querySelector("strong").textContent = skill.name;
  footer.querySelector("span").textContent = visibleStatus;
  const actions = footer.querySelector(".result-actions");

  if (status === "success") {
    const download = document.createElement("a");
    download.className = "icon-button";
    download.href = payload.url;
    download.download = payload.filename;
    download.title = "下载图片";
    download.setAttribute("aria-label", "下载图片");
    download.innerHTML = `<i data-lucide="download" aria-hidden="true"></i>`;
    actions.append(download);
  }
  if (status !== "loading") {
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "icon-button";
    retry.title = "重新生成";
    retry.setAttribute("aria-label", "重新生成");
    retry.innerHTML = `<i data-lucide="refresh-cw" aria-hidden="true"></i>`;
    retry.addEventListener("click", () => generateOne(skill));
    actions.append(retry);
  }
  card.append(media, footer);
  return card;
}

function renderResults() {
  elements.resultsGrid ||= document.createElement("div");
  elements.resultsEmpty ||= document.createElement("div");
  elements.clearResults ||= document.createElement("button");
  elements.resultsGrid.replaceChildren();
  for (const [skillId, result] of state.results) {
    const skill = state.skills.find((item) => item.id === skillId);
    if (skill) elements.resultsGrid.append(createResultCard(skill, result.status, result));
  }
  const hasResults = state.results.size > 0;
  elements.resultsEmpty.hidden = hasResults;
  elements.clearResults.hidden = !hasResults || state.running;
  refreshIcons();
}

async function generateOne(skill) {
  if (!state.file) return showToast("请先选择一张照片。");
  if (state.activeGenerations === 0) state.runFailed = false;
  state.activeGenerations += 1;
  setRunState("PROCESSING");
  state.results.set(skill.id, { status: "loading" });
  renderResults();
  const form = new FormData();
  form.append("image", state.file);
  form.append("skillId", skill.id);
  form.append("size", elements.sizeSelect?.value || "1024x1792");
  form.append("note", elements.noteInput?.value.trim() || "");

  try {
    const payload = await readJson(await fetch("/api/generate", { method: "POST", body: form }));
    state.results.set(skill.id, { status: "success", ...payload.result });
  } catch (error) {
    state.results.set(skill.id, { status: "error", error: error.message });
  }
  if (state.results.get(skill.id)?.status === "error") state.runFailed = true;
  state.activeGenerations -= 1;
  if (state.activeGenerations === 0) setRunState(state.runFailed ? "FAILED" : "READY");
  renderResults();
}

async function generateSelected() {
  if (!state.file || state.running) return;
  elements.generateButton ||= document.createElement("button");
  elements.toggleAll ||= document.createElement("button");
  elements.clearResults ||= document.createElement("button");
  const skills = state.skills.filter((skill) => state.selected.has(skill.id));
  state.running = true;
  elements.generateButton.disabled = true;
  elements.toggleAll.disabled = true;
  elements.clearResults.hidden = true;
  await Promise.allSettled(skills.map((skill) => generateOne(skill)));
  state.running = false;
  elements.toggleAll.disabled = false;
  updateSelectionUi();
  renderResults();
}

async function installPackage() {
  const file = elements.packageInput?.files[0];
  if (!file) return;
  if (!elements.installButton) return;
  elements.installButton.disabled = true;
  elements.installButton.innerHTML = `<span class="spinner"></span><span>安装中…</span>`;
  const form = new FormData();
  form.append("package", file);
  try {
    const payload = await readJson(await fetch("/api/skills/install", { method: "POST", body: form }));
    await loadSkills({ preserveSelection: true });
    state.selected.add(payload.skill.id);
    renderSkills();
    elements.installDialog?.close();
    showToast(`已安装 ${payload.skill.name}`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.installButton.innerHTML = `<i data-lucide="download" aria-hidden="true"></i><span>安装</span>`;
    elements.installButton.disabled = false;
    refreshIcons();
  }
}

elements.uploadZone?.addEventListener("click", () => elements.imageInput?.click());
elements.imageInput?.addEventListener("change", () => setFile(elements.imageInput.files[0]));
for (const type of ["dragenter", "dragover"]) {
  elements.uploadZone?.addEventListener(type, (event) => {
    event.preventDefault();
    elements.uploadZone.classList.add("dragging");
  });
}
for (const type of ["dragleave", "drop"]) {
  elements.uploadZone?.addEventListener(type, (event) => {
    event.preventDefault();
    elements.uploadZone.classList.remove("dragging");
  });
}
elements.uploadZone?.addEventListener("drop", (event) => setFile(event.dataTransfer.files[0]));
elements.toggleAll?.addEventListener("click", () => {
  if (state.running) return;
  state.selected = state.selected.size === state.skills.length
    ? new Set()
    : new Set(state.skills.map((skill) => skill.id));
  renderSkills();
});
elements.generateButton?.addEventListener("click", generateSelected);
elements.clearResults?.addEventListener("click", () => {
  state.results.clear();
  renderResults();
});
elements.openInstall?.addEventListener("click", () => elements.installDialog?.showModal());
elements.packageInput?.addEventListener("change", () => {
  const file = elements.packageInput.files[0];
  elements.packageName.textContent = file?.name || "选择 ZIP 安装包";
  elements.installButton.disabled = !file;
});
elements.installButton?.addEventListener("click", installPackage);

function navigateFlowStep(step) {
  if (step === "skills" && !state.file) return showToast("请先上传一张照片。");
  if (step === "generate" && (!state.file || state.selected.size === 0)) {
    return showToast(state.file ? "至少选择一个 Skill。" : "请先上传一张照片。");
  }
  showFlowStep(step);
}

for (const button of elements.flowSteps) {
  button.addEventListener("click", () => navigateFlowStep(button.dataset.stepTarget));
}
elements.continueToSkills?.addEventListener("click", () => navigateFlowStep("skills"));
elements.backToUpload?.addEventListener("click", () => showFlowStep("upload"));
elements.continueToGenerate?.addEventListener("click", () => navigateFlowStep("generate"));
elements.backToSkills?.addEventListener("click", () => showFlowStep("skills"));
elements.skillsStage?.addEventListener("pointerdown", beginSelectionBox);
elements.skillsStage?.addEventListener("pointermove", updateSelectionBox);
elements.skillsStage?.addEventListener("pointerup", finishSelectionBox);
elements.skillsStage?.addEventListener("pointercancel", finishSelectionBox);
window.addEventListener("resize", syncFlowLayout, { passive: true });

if (elements.systemMode) elements.systemMode.textContent = "PARALLEL";
setRunState("READY");
syncFlowLayout();

Promise.all([loadHealth(), loadSkills()])
  .catch((error) => showToast(error.message))
  .finally(refreshIcons);
