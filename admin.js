(() => {
  const STORAGE_CONFIG_KEY = "sungomi_arc_config_v3";
  const STORAGE_PROJECTS_KEY = "sungomi_arc_projects_v3";
  const SESSION_AUTH_KEY = "sungomi_admin_unlocked_v1";
  const EXPECTED_HASH = "c2aedfe4e480f615caa9055bbf823ab7d3b84b50a9f39b91744d582d4d5ee71c";

  const CATEGORY_LABELS = { program: "APP", game: "GAME", webapp: "WEB" };
  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  // ===== PIN 인증 =====
  const authGate = document.getElementById("authGate");
  const authForm = document.getElementById("authForm");
  const authInput = document.getElementById("authInput");
  const authError = document.getElementById("authError");
  const lockAdminBtn = document.getElementById("lockAdminBtn");

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function unlockAdmin() {
    sessionStorage.setItem(SESSION_AUTH_KEY, "1");
    document.body.classList.remove("admin-locked");
    authGate.hidden = true;
  }

  function lockAdmin() {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    document.body.classList.add("admin-locked");
    authGate.hidden = false;
    authInput.value = "";
    authError.hidden = true;
    authInput.focus();
  }

  if (sessionStorage.getItem(SESSION_AUTH_KEY) === "1") unlockAdmin();

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const val = (authInput.value || "").trim();
    try {
      const digest = await sha256Hex(`sungomi_admin_${val}`);
      if (digest === EXPECTED_HASH) {
        authError.hidden = true;
        unlockAdmin();
        return;
      }
    } catch {
      // non-secure context
    }
    authError.hidden = false;
    authForm.classList.remove("shake");
    void authForm.offsetWidth;
    authForm.classList.add("shake");
    authInput.select();
  });

  lockAdminBtn.addEventListener("click", lockAdmin);

  // ===== 상태 =====
  function loadStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  function isHidden(p) {
    return Boolean(p && (p.hidden || p.status === "draft"));
  }

  let siteConfig = loadStored(STORAGE_CONFIG_KEY, window.SITE_CONFIG || {});
  let projects = loadStored(STORAGE_PROJECTS_KEY, window.PROJECTS || []);
  let selectedIndex = projects.length > 0 ? 0 : -1;
  let statusFilter = "all";
  let dragSrcIndex = null;
  let autosaveTimer = null;

  // DOM
  const sidebarCount = document.getElementById("sidebarCount");
  const listSearchInput = document.getElementById("listSearchInput");
  const statusTabs = Array.from(document.querySelectorAll(".status-tab"));
  const postListEl = document.getElementById("postList");

  const fieldVisibleToggle = document.getElementById("fieldVisibleToggle");
  const visibleLabel = document.getElementById("visibleLabel");
  const saveIndicator = document.getElementById("saveIndicator");
  const newPostBtn = document.getElementById("newPostBtn");
  const duplicatePostBtn = document.getElementById("duplicatePostBtn");
  const deletePostBtn = document.getElementById("deletePostBtn");

  const fieldTitle = document.getElementById("fieldTitle");
  const fieldCategory = document.getElementById("fieldCategory");
  const fieldTagline = document.getElementById("fieldTagline");
  const fieldDescription = document.getElementById("fieldDescription");
  const fieldImageUrl = document.getElementById("fieldImageUrl");
  const imageFileInput = document.getElementById("imageFileInput");
  const fieldVideoUrl = document.getElementById("fieldVideoUrl");
  const clearVideoBtn = document.getElementById("clearVideoBtn");

  const editorPreviewImage = document.getElementById("editorPreviewImage");
  const editorPreviewVideo = document.getElementById("editorPreviewVideo");
  const editorPreviewIframe = document.getElementById("editorPreviewIframe");
  const editorPreviewEmpty = document.getElementById("editorPreviewEmpty");

  const tagChipsEl = document.getElementById("tagChips");
  const tagInput = document.getElementById("tagInput");
  const statsBuilder = document.getElementById("statsBuilder");
  const addStatBtn = document.getElementById("addStatBtn");
  const linksBuilder = document.getElementById("linksBuilder");
  const addLinkBtn = document.getElementById("addLinkBtn");

  const exportJsBtn = document.getElementById("exportJsBtn");
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const importJsonInput = document.getElementById("importJsonInput");
  const resetDefaultBtn = document.getElementById("resetDefaultBtn");
  const siteSettingsBtn = document.getElementById("siteSettingsBtn");
  const settingsBackdrop = document.getElementById("settingsBackdrop");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const cfgBrandName = document.getElementById("cfgBrandName");
  const cfgHeroTitle = document.getElementById("cfgHeroTitle");
  const cfgHeroSubtitle = document.getElementById("cfgHeroSubtitle");
  const cfgLinksBuilder = document.getElementById("cfgLinksBuilder");
  const addCfgLinkBtn = document.getElementById("addCfgLinkBtn");
  const toastContainer = document.getElementById("toastContainer");

  function showToast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getYoutubeEmbed(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&playlist=${m[1]}` : null;
  }

  function persistAll() {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(siteConfig));
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    const time = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    saveIndicator.textContent = `자동 저장됨 · ${time}`;
    updateCount();
  }

  function scheduleAutosave() {
    saveIndicator.textContent = "저장 중...";
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      syncFormToProject();
      persistAll();
      renderPostList();
    }, 350);
  }

  function updateCount() {
    const hiddenCount = projects.filter(isHidden).length;
    sidebarCount.textContent = hiddenCount
      ? `전체 ${projects.length} · 숨김 ${hiddenCount}`
      : `전체 ${projects.length}`;
  }

  function setProjectHidden(idx, hidden) {
    const p = projects[idx];
    if (!p) return;
    p.hidden = hidden;
    p.status = hidden ? "draft" : "published";
    if (idx === selectedIndex) {
      fieldVisibleToggle.checked = !hidden;
      visibleLabel.textContent = hidden ? "숨김" : "공개 중";
    }
    persistAll();
    renderPostList();
    showToast(hidden ? `"${p.title}" 숨김` : `"${p.title}" 공개`);
  }

  // ===== 좌측 목록 =====
  function renderPostList() {
    const q = listSearchInput.value.trim().toLowerCase();
    postListEl.innerHTML = "";

    projects.forEach((p, idx) => {
      const hidden = isHidden(p);
      if (statusFilter === "published" && hidden) return;
      if (statusFilter === "hidden" && !hidden) return;
      if (
        q &&
        !(p.title || "").toLowerCase().includes(q) &&
        !(p.tags || []).some((t) => t.toLowerCase().includes(q))
      ) {
        return;
      }

      const item = document.createElement("div");
      item.className = `post-item ${idx === selectedIndex ? "active" : ""} ${hidden ? "is-hidden" : ""}`;
      item.draggable = true;
      item.dataset.index = String(idx);
      item.innerHTML = `
        <span class="drag-handle" title="드래그하여 순서 변경" aria-hidden="true">⋮⋮</span>
        <img class="post-thumb" src="${escapeHtml(p.imageUrl || "")}" alt="" draggable="false" onerror="this.style.visibility='hidden'" />
        <div class="post-info">
          <div class="post-title">${escapeHtml(p.title || "제목 없음")}</div>
          <div class="post-sub">${escapeHtml(CATEGORY_LABELS[p.category] || p.categoryLabel || "APP")}</div>
        </div>
        <div class="post-actions">
          <button type="button" class="vis-pill ${hidden ? "off" : "on"}" data-toggle="1">${hidden ? "숨김" : "공개"}</button>
          <div class="move-btns">
            <button type="button" class="move-btn" data-move="-1" title="위로">▲</button>
            <button type="button" class="move-btn" data-move="1" title="아래로">▼</button>
          </div>
        </div>
      `;

      item.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        selectProject(idx);
      });

      item.querySelector("[data-toggle]").addEventListener("click", (e) => {
        e.stopPropagation();
        setProjectHidden(idx, !isHidden(projects[idx]));
      });

      item.querySelectorAll("[data-move]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          moveProject(idx, idx + Number(btn.dataset.move));
        });
      });

      // 드래그 앤 드롭 순서 변경
      item.addEventListener("dragstart", (e) => {
        dragSrcIndex = idx;
        item.classList.add("dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(idx));
        }
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        postListEl.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
        dragSrcIndex = null;
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (dragSrcIndex === null || dragSrcIndex === idx) return;
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        item.classList.add("drag-over");
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");
        if (dragSrcIndex !== null && dragSrcIndex !== idx) {
          moveProject(dragSrcIndex, idx);
        }
      });

      postListEl.appendChild(item);
    });
  }

  function moveProject(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= projects.length || fromIdx === toIdx) return;
    const [moved] = projects.splice(fromIdx, 1);
    projects.splice(toIdx, 0, moved);
    if (selectedIndex === fromIdx) {
      selectedIndex = toIdx;
    } else if (fromIdx < selectedIndex && toIdx >= selectedIndex) {
      selectedIndex -= 1;
    } else if (fromIdx > selectedIndex && toIdx <= selectedIndex) {
      selectedIndex += 1;
    }
    persistAll();
    renderPostList();
  }

  // ===== 에디터 =====
  function selectProject(idx) {
    selectedIndex = idx;
    const p = projects[idx];
    if (!p) return;

    const hidden = isHidden(p);
    fieldVisibleToggle.checked = !hidden;
    visibleLabel.textContent = hidden ? "숨김" : "공개 중";

    fieldTitle.value = p.title || "";
    fieldCategory.value = p.category || "program";
    fieldTagline.value = p.tagline || "";
    fieldDescription.value = p.description || "";
    fieldImageUrl.value = p.imageUrl || "";
    fieldVideoUrl.value = p.videoUrl || "";

    renderTagChips(p.tags || []);
    renderStatsBuilder(p.stats || []);
    renderLinksBuilder(p.links || []);
    renderPostList();
    updateMediaPreview();
  }

  function syncFormToProject() {
    const p = projects[selectedIndex];
    if (!p) return;
    p.title = fieldTitle.value.trim() || "제목 없음";
    p.category = fieldCategory.value;
    p.categoryLabel = CATEGORY_LABELS[p.category] || "APP";
    p.hidden = !fieldVisibleToggle.checked;
    p.status = p.hidden ? "draft" : "published";
    p.tagline = fieldTagline.value;
    p.description = fieldDescription.value;
    p.imageUrl = fieldImageUrl.value.trim();
    p.videoUrl = fieldVideoUrl.value.trim();
  }

  function updateMediaPreview() {
    const p = projects[selectedIndex];
    if (!p) return;

    editorPreviewImage.hidden = true;
    editorPreviewVideo.hidden = true;
    editorPreviewIframe.hidden = true;
    editorPreviewEmpty.hidden = true;
    editorPreviewIframe.src = "";
    editorPreviewVideo.pause();
    editorPreviewVideo.removeAttribute("src");

    const vUrl = (p.videoUrl || "").trim();
    if (vUrl) {
      const yt = getYoutubeEmbed(vUrl);
      if (yt) {
        editorPreviewIframe.hidden = false;
        editorPreviewIframe.src = yt;
        return;
      }
      editorPreviewVideo.hidden = false;
      editorPreviewVideo.src = vUrl;
      editorPreviewVideo.play().catch(() => {});
      return;
    }

    const iUrl = (p.imageUrl || "").trim();
    if (iUrl) {
      editorPreviewImage.hidden = false;
      editorPreviewImage.src = iUrl;
      return;
    }

    editorPreviewEmpty.hidden = false;
  }

  fieldVisibleToggle.addEventListener("change", () => {
    if (selectedIndex < 0) return;
    setProjectHidden(selectedIndex, !fieldVisibleToggle.checked);
  });

  imageFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      fieldImageUrl.value = reader.result;
      syncFormToProject();
      updateMediaPreview();
      persistAll();
      renderPostList();
      showToast("이미지 적용 완료");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  clearVideoBtn.addEventListener("click", () => {
    fieldVideoUrl.value = "";
    syncFormToProject();
    updateMediaPreview();
    persistAll();
    showToast("영상을 비웠습니다");
  });

  // ===== 태그 · 스펙 · 링크 =====
  function renderTagChips(tags) {
    tagChipsEl.innerHTML = "";
    tags.forEach((tag, idx) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `${escapeHtml(tag)} <button type="button">✕</button>`;
      chip.querySelector("button").addEventListener("click", () => {
        projects[selectedIndex].tags.splice(idx, 1);
        renderTagChips(projects[selectedIndex].tags);
        scheduleAutosave();
      });
      tagChipsEl.appendChild(chip);
    });
  }

  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.value.replace(/,/g, "").trim();
      if (!val || selectedIndex < 0) return;
      projects[selectedIndex].tags = projects[selectedIndex].tags || [];
      if (!projects[selectedIndex].tags.includes(val)) {
        projects[selectedIndex].tags.push(val);
        renderTagChips(projects[selectedIndex].tags);
        scheduleAutosave();
      }
      tagInput.value = "";
    }
  });

  function renderStatsBuilder(stats) {
    statsBuilder.innerHTML = "";
    stats.forEach((s, idx) => {
      const row = document.createElement("div");
      row.className = "dynamic-row stat-row";
      row.innerHTML = `
        <input type="text" class="adm-input" placeholder="항목" value="${escapeHtml(s.label)}" />
        <input type="text" class="adm-input" placeholder="내용" value="${escapeHtml(s.value)}" />
        <button type="button" class="adm-btn danger-ghost small">삭제</button>
      `;
      const [labelIn, valIn, delBtn] = row.children;
      labelIn.addEventListener("input", () => { projects[selectedIndex].stats[idx].label = labelIn.value; scheduleAutosave(); });
      valIn.addEventListener("input", () => { projects[selectedIndex].stats[idx].value = valIn.value; scheduleAutosave(); });
      delBtn.addEventListener("click", () => {
        projects[selectedIndex].stats.splice(idx, 1);
        renderStatsBuilder(projects[selectedIndex].stats);
        scheduleAutosave();
      });
      statsBuilder.appendChild(row);
    });
  }

  addStatBtn.addEventListener("click", () => {
    const p = projects[selectedIndex];
    if (!p) return;
    p.stats = p.stats || [];
    p.stats.push({ label: "항목", value: "" });
    renderStatsBuilder(p.stats);
    scheduleAutosave();
  });

  function renderLinksBuilder(links) {
    linksBuilder.innerHTML = "";
    links.forEach((link, idx) => {
      const row = document.createElement("div");
      row.className = "dynamic-row link-row";
      row.innerHTML = `
        <input type="text" class="adm-input" placeholder="버튼명" value="${escapeHtml(link.label)}" />
        <input type="url" class="adm-input" placeholder="https://..." value="${escapeHtml(link.url)}" />
        <label class="primary-check"><input type="checkbox" ${link.primary ? "checked" : ""} /> 강조</label>
        <button type="button" class="adm-btn danger-ghost small">삭제</button>
      `;
      const [labelIn, urlIn, checkWrap, delBtn] = row.children;
      const checkbox = checkWrap.querySelector("input");
      labelIn.addEventListener("input", () => { projects[selectedIndex].links[idx].label = labelIn.value; scheduleAutosave(); });
      urlIn.addEventListener("input", () => { projects[selectedIndex].links[idx].url = urlIn.value; scheduleAutosave(); });
      checkbox.addEventListener("change", () => { projects[selectedIndex].links[idx].primary = checkbox.checked; scheduleAutosave(); });
      delBtn.addEventListener("click", () => {
        projects[selectedIndex].links.splice(idx, 1);
        renderLinksBuilder(projects[selectedIndex].links);
        scheduleAutosave();
      });
      linksBuilder.appendChild(row);
    });
  }

  addLinkBtn.addEventListener("click", () => {
    const p = projects[selectedIndex];
    if (!p) return;
    p.links = p.links || [];
    p.links.push({ label: "다운로드", url: "https://", primary: p.links.length === 0 });
    renderLinksBuilder(p.links);
    scheduleAutosave();
  });

  // ===== 입력 이벤트 =====
  [fieldTitle, fieldCategory, fieldTagline, fieldDescription, fieldImageUrl, fieldVideoUrl].forEach((el) => {
    el.addEventListener("input", () => {
      if (el === fieldImageUrl || el === fieldVideoUrl) {
        syncFormToProject();
        updateMediaPreview();
      }
      scheduleAutosave();
    });
    el.addEventListener("change", () => {
      syncFormToProject();
      persistAll();
      renderPostList();
    });
  });

  statusTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      statusFilter = tab.dataset.status;
      statusTabs.forEach((t) => t.classList.toggle("active", t === tab));
      renderPostList();
    });
  });

  listSearchInput.addEventListener("input", renderPostList);

  // ===== 항목 추가 / 복제 / 삭제 =====
  newPostBtn.addEventListener("click", () => {
    projects.unshift({
      id: `item-${Date.now()}`,
      title: "새 항목",
      category: "program",
      categoryLabel: "APP",
      status: "published",
      hidden: false,
      tagline: "",
      description: "",
      tags: [],
      imageUrl: "",
      videoUrl: "",
      stats: [{ label: "플랫폼", value: "macOS / Windows" }],
      links: [{ label: "다운로드", url: "https://", primary: true }],
    });
    persistAll();
    selectProject(0);
    fieldTitle.focus();
    fieldTitle.select();
    showToast("새 항목 추가됨");
  });

  duplicatePostBtn.addEventListener("click", () => {
    const p = projects[selectedIndex];
    if (!p) return;
    const copy = clone(p);
    copy.id = `${p.id}-copy-${Date.now().toString().slice(-4)}`;
    copy.title = `${p.title} (복사본)`;
    copy.status = "draft";
    copy.hidden = true;
    projects.splice(selectedIndex + 1, 0, copy);
    persistAll();
    selectProject(selectedIndex + 1);
    showToast("숨김 상태로 복제됨");
  });

  deletePostBtn.addEventListener("click", () => {
    const p = projects[selectedIndex];
    if (!p) return;
    if (!confirm(`"${p.title}" 항목을 삭제할까요?`)) return;
    projects.splice(selectedIndex, 1);
    selectedIndex = Math.min(selectedIndex, projects.length - 1);
    persistAll();
    if (selectedIndex >= 0) selectProject(selectedIndex);
    else renderPostList();
    showToast("삭제됨");
  });

  // ===== 배포 파일 저장 / 백업 / 복원 / 초기화 =====
  function downloadFile(filename, content, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportJsBtn.addEventListener("click", () => {
    syncFormToProject();
    const jsContent = `window.SITE_CONFIG = ${JSON.stringify(siteConfig, null, 2)};\n\nwindow.PROJECTS = ${JSON.stringify(projects, null, 2)};\n`;
    downloadFile("projects.js", jsContent, "application/javascript");
    showToast("projects.js 저장 완료");
  });

  exportJsonBtn.addEventListener("click", () => {
    syncFormToProject();
    downloadFile("sungomi-backup.json", JSON.stringify({ siteConfig, projects }, null, 2), "application/json");
    showToast("백업 완료");
  });

  importJsonInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.siteConfig) siteConfig = data.siteConfig;
        if (Array.isArray(data.projects)) projects = data.projects;
        persistAll();
        selectProject(0);
        showToast("복원 완료");
      } catch {
        showToast("올바른 JSON 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  resetDefaultBtn.addEventListener("click", () => {
    if (!confirm("임시 수정 내역을 지우고 GitHub 원본 상태로 되돌릴까요?")) return;
    localStorage.removeItem(STORAGE_CONFIG_KEY);
    localStorage.removeItem(STORAGE_PROJECTS_KEY);
    siteConfig = clone(window.SITE_CONFIG || {});
    projects = clone(window.PROJECTS || []);
    selectProject(0);
    updateCount();
    closeSettings();
    showToast("원본 상태로 초기화됨");
  });

  // ===== 설정 모달 =====
  function renderCfgLinks() {
    cfgLinksBuilder.innerHTML = "";
    const links = (siteConfig.creator && siteConfig.creator.links) || [];
    links.forEach((link, idx) => {
      const row = document.createElement("div");
      row.className = "dynamic-row stat-row";
      row.innerHTML = `
        <input type="text" class="adm-input" placeholder="이름" value="${escapeHtml(link.label)}" />
        <input type="url" class="adm-input" placeholder="https://..." value="${escapeHtml(link.url)}" />
        <button type="button" class="adm-btn danger-ghost small">삭제</button>
      `;
      const [labelIn, urlIn, delBtn] = row.children;
      labelIn.addEventListener("input", () => (links[idx].label = labelIn.value));
      urlIn.addEventListener("input", () => (links[idx].url = urlIn.value));
      delBtn.addEventListener("click", () => {
        links.splice(idx, 1);
        renderCfgLinks();
      });
      cfgLinksBuilder.appendChild(row);
    });
  }

  function closeSettings() {
    settingsBackdrop.classList.remove("open");
    settingsBackdrop.setAttribute("aria-hidden", "true");
  }

  siteSettingsBtn.addEventListener("click", () => {
    cfgBrandName.value = siteConfig.brandName || "";
    cfgHeroTitle.value = siteConfig.heroTitle || "";
    cfgHeroSubtitle.value = siteConfig.heroSubtitle || "";
    siteConfig.creator = siteConfig.creator || { name: "sungomi", links: [] };
    renderCfgLinks();
    settingsBackdrop.classList.add("open");
    settingsBackdrop.setAttribute("aria-hidden", "false");
  });

  addCfgLinkBtn.addEventListener("click", () => {
    siteConfig.creator = siteConfig.creator || { name: "sungomi", links: [] };
    siteConfig.creator.links.push({ label: "링크", url: "https://" });
    renderCfgLinks();
  });

  closeSettingsBtn.addEventListener("click", closeSettings);
  settingsBackdrop.addEventListener("click", (e) => {
    if (e.target === settingsBackdrop) closeSettings();
  });

  saveSettingsBtn.addEventListener("click", () => {
    siteConfig.brandName = cfgBrandName.value.trim();
    siteConfig.heroTitle = cfgHeroTitle.value.trim();
    siteConfig.heroSubtitle = cfgHeroSubtitle.value.trim();
    persistAll();
    closeSettings();
    showToast("설정 저장됨");
  });

  updateCount();
  if (selectedIndex >= 0) selectProject(selectedIndex);
  else renderPostList();
})();
