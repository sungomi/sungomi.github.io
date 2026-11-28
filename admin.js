(() => {
  const STORAGE_CONFIG_KEY = "sungomi_arc_config_v3";
  const STORAGE_PROJECTS_KEY = "sungomi_arc_projects_v3";
  const SESSION_AUTH_KEY = "sungomi_admin_unlocked_v1";
  const EXPECTED_HASH = "c2aedfe4e480f615caa9055bbf823ab7d3b84b50a9f39b91744d582d4d5ee71c";

  const authGate = document.getElementById("authGate");
  const authForm = document.getElementById("authForm");
  const authInput = document.getElementById("authInput");
  const authError = document.getElementById("authError");
  const lockAdminBtn = document.getElementById("lockAdminBtn");

  async function sha256Hex(str) {
    const data = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function unlockAdmin() {
    sessionStorage.setItem(SESSION_AUTH_KEY, "1");
    document.body.classList.remove("admin-locked");
    if (authGate) authGate.hidden = true;
  }

  function lockAdmin() {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    document.body.classList.add("admin-locked");
    if (authGate) authGate.hidden = false;
    if (authInput) {
      authInput.value = "";
      authInput.focus();
    }
    if (authError) authError.hidden = true;
  }

  if (sessionStorage.getItem(SESSION_AUTH_KEY) === "1") {
    unlockAdmin();
  }

  if (authForm) {
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
        // non-secure context fallback
      }
      authError.hidden = false;
      authForm.classList.remove("shake");
      void authForm.offsetWidth;
      authForm.classList.add("shake");
      authInput.select();
    });
  }

  if (lockAdminBtn) {
    lockAdminBtn.addEventListener("click", lockAdmin);
  }

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  function loadStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  function isProjectHidden(p) {
    return Boolean(p && (p.hidden || p.status === "draft"));
  }

  let siteConfig = loadStored(STORAGE_CONFIG_KEY, window.SITE_CONFIG || {});
  let projects = loadStored(STORAGE_PROJECTS_KEY, window.PROJECTS || []);
  let selectedIndex = projects.length > 0 ? 0 : -1;
  let dragSrcIndex = null;
  let autosaveTimer = null;

  // KPI
  const kpiTotal = document.getElementById("kpiTotal");
  const kpiPublished = document.getElementById("kpiPublished");
  const kpiHidden = document.getElementById("kpiHidden");

  // 목록
  const listSearchInput = document.getElementById("listSearchInput");
  const listStatusFilter = document.getElementById("listStatusFilter");
  const listCategoryFilter = document.getElementById("listCategoryFilter");
  const postListEl = document.getElementById("postList");

  // 에디터 헤더
  const editorStatusPill = document.getElementById("editorStatusPill");
  const saveIndicator = document.getElementById("saveIndicator");
  const newPostBtn = document.getElementById("newPostBtn");
  const toggleHideBtn = document.getElementById("toggleHideBtn");
  const duplicatePostBtn = document.getElementById("duplicatePostBtn");
  const deletePostBtn = document.getElementById("deletePostBtn");
  const savePostBtn = document.getElementById("savePostBtn");

  // 폼 필드
  const fieldTitle = document.getElementById("fieldTitle");
  const fieldId = document.getElementById("fieldId");
  const fieldCategory = document.getElementById("fieldCategory");
  const fieldCategoryLabel = document.getElementById("fieldCategoryLabel");
  const fieldStatus = document.getElementById("fieldStatus");
  const fieldTagline = document.getElementById("fieldTagline");
  const fieldDescription = document.getElementById("fieldDescription");
  const descCharCount = document.getElementById("descCharCount");
  const mdPreviewBox = document.getElementById("mdPreviewBox");

  // 미디어
  const fieldImageUrl = document.getElementById("fieldImageUrl");
  const imageFileInput = document.getElementById("imageFileInput");
  const fieldVideoUrl = document.getElementById("fieldVideoUrl");
  const clearVideoBtn = document.getElementById("clearVideoBtn");
  const editorPreviewImage = document.getElementById("editorPreviewImage");
  const editorPreviewVideo = document.getElementById("editorPreviewVideo");
  const editorPreviewIframe = document.getElementById("editorPreviewIframe");
  const editorPreviewEmpty = document.getElementById("editorPreviewEmpty");

  // 태그 / 스펙 / 링크
  const tagChipsEl = document.getElementById("tagChips");
  const tagInput = document.getElementById("tagInput");
  const statsBuilder = document.getElementById("statsBuilder");
  const addStatBtn = document.getElementById("addStatBtn");
  const linksBuilder = document.getElementById("linksBuilder");
  const addLinkBtn = document.getElementById("addLinkBtn");

  // 상단 도구 & 설정 모달
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
    setTimeout(() => el.remove(), 2400);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSimpleMarkdown(text) {
    let html = escapeHtml(text || "");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    html = html.replace(/\n/g, "<br />");
    return html;
  }

  function getYoutubeEmbed(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&playlist=${m[1]}` : null;
  }

  function persistAll(showMsg = false) {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(siteConfig));
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    const time = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    saveIndicator.textContent = `저장됨 (${time})`;
    if (showMsg) showToast("저장되었습니다.");
    updateKPIs();
  }

  function scheduleAutosave() {
    saveIndicator.textContent = "저장 중...";
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      syncFormToProject();
      persistAll(false);
      renderPostList();
    }, 400);
  }

  function updateKPIs() {
    const hiddenCount = projects.filter(isProjectHidden).length;
    kpiTotal.textContent = projects.length;
    kpiPublished.textContent = projects.length - hiddenCount;
    kpiHidden.textContent = hiddenCount;
  }

  function setProjectHidden(idx, hidden) {
    const p = projects[idx];
    if (!p) return;
    p.hidden = hidden;
    p.status = hidden ? "draft" : "published";
    if (idx === selectedIndex) {
      fieldStatus.value = p.status;
      updateStatusUI();
    }
    persistAll(false);
    renderPostList();
    showToast(hidden ? `"${p.title}" 숨김 처리됨` : `"${p.title}" 공개 처리됨`);
  }

  // ===== 좌측 목록 =====
  function renderPostList() {
    const q = listSearchInput.value.trim().toLowerCase();
    const st = listStatusFilter.value;
    const cat = listCategoryFilter.value;

    postListEl.innerHTML = "";

    projects.forEach((p, idx) => {
      const hidden = isProjectHidden(p);
      if (st === "published" && hidden) return;
      if (st === "hidden" && !hidden) return;
      if (cat !== "all" && p.category !== cat) return;
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
      item.dataset.index = idx;

      item.innerHTML = `
        <img class="post-thumb" src="${escapeHtml(p.imageUrl || "")}" alt="" onerror="this.style.visibility='hidden'" />
        <div class="post-item-info">
          <div class="post-item-title">${escapeHtml(p.title || "(제목 없음)")}</div>
          <div class="post-item-meta">
            <span class="mini-badge ${hidden ? "hidden" : "pub"}">${hidden ? "숨김" : "공개"}</span>
            <span>${escapeHtml(p.categoryLabel || p.category)}</span>
          </div>
        </div>
        <div class="post-item-actions">
          <button type="button" class="row-icon-btn ${hidden ? "eye-hidden" : ""}" data-action="toggle-hide" title="${hidden ? "다시 보이기" : "숨기기"}">
            ${hidden ? "🙈" : "👁"}
          </button>
          <button type="button" class="row-icon-btn" data-move="-1" title="위로">▲</button>
          <button type="button" class="row-icon-btn" data-move="1" title="아래로">▼</button>
        </div>
      `;

      item.addEventListener("click", (e) => {
        if (e.target.closest(".row-icon-btn")) return;
        selectProject(idx);
      });

      item.querySelector('[data-action="toggle-hide"]').addEventListener("click", (e) => {
        e.stopPropagation();
        setProjectHidden(idx, !isProjectHidden(projects[idx]));
      });

      item.querySelectorAll("[data-move]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          moveProject(idx, idx + Number(btn.dataset.move));
        });
      });

      item.addEventListener("dragstart", () => {
        dragSrcIndex = idx;
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        dragSrcIndex = null;
      });
      item.addEventListener("dragover", (e) => e.preventDefault());
      item.addEventListener("drop", (e) => {
        e.preventDefault();
        if (dragSrcIndex !== null && dragSrcIndex !== idx) {
          moveProject(dragSrcIndex, idx);
        }
      });

      postListEl.appendChild(item);
    });
  }

  function moveProject(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= projects.length) return;
    const [moved] = projects.splice(fromIdx, 1);
    projects.splice(toIdx, 0, moved);
    if (selectedIndex === fromIdx) selectedIndex = toIdx;
    persistAll(false);
    renderPostList();
  }

  // ===== 에디터 로드 =====
  function selectProject(idx) {
    selectedIndex = idx;
    const p = projects[idx];
    if (!p) return;

    fieldTitle.value = p.title || "";
    fieldId.value = p.id || "";
    fieldCategory.value = p.category || "program";
    fieldCategoryLabel.value = p.categoryLabel || "PROGRAM";
    fieldStatus.value = isProjectHidden(p) ? "draft" : "published";
    fieldTagline.value = p.tagline || "";
    fieldDescription.value = p.description || "";
    fieldImageUrl.value = p.imageUrl || "";
    fieldVideoUrl.value = p.videoUrl || "";

    descCharCount.textContent = `${fieldDescription.value.length}자`;
    mdPreviewBox.innerHTML = renderSimpleMarkdown(fieldDescription.value);

    updateStatusUI();
    renderTagChips(p.tags || []);
    renderStatsBuilder(p.stats || []);
    renderLinksBuilder(p.links || []);
    renderPostList();
    updateMediaPreview();
  }

  function updateStatusUI() {
    const hidden = fieldStatus.value === "draft";
    editorStatusPill.textContent = hidden ? "숨김" : "공개 중";
    editorStatusPill.classList.toggle("hidden", hidden);
    toggleHideBtn.textContent = hidden ? "공개하기" : "숨기기";
  }

  function syncFormToProject() {
    const p = projects[selectedIndex];
    if (!p) return;
    p.title = fieldTitle.value.trim() || "제목 없음";
    p.id = fieldId.value.trim() || p.id || `item-${Date.now()}`;
    p.category = fieldCategory.value;
    p.categoryLabel = fieldCategoryLabel.value.trim() || p.category.toUpperCase();
    p.status = fieldStatus.value;
    p.hidden = p.status === "draft";
    p.tagline = fieldTagline.value;
    p.description = fieldDescription.value;
    p.imageUrl = fieldImageUrl.value.trim();
    p.videoUrl = fieldVideoUrl.value.trim();
    delete p.demoPreset;
    updateStatusUI();
  }

  // ===== 미디어 미리보기 (실제 이미지/영상만 표시) =====
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

  imageFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      fieldImageUrl.value = reader.result;
      syncFormToProject();
      updateMediaPreview();
      persistAll(false);
      renderPostList();
      showToast("이미지가 적용되었습니다.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  clearVideoBtn.addEventListener("click", () => {
    fieldVideoUrl.value = "";
    syncFormToProject();
    updateMediaPreview();
    persistAll(false);
    showToast("영상을 비웠습니다.");
  });

  // ===== 태그 · 스펙 · 링크 빌더 =====
  function renderTagChips(tags) {
    tagChipsEl.innerHTML = "";
    tags.forEach((tag, idx) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `${escapeHtml(tag)} <button type="button" aria-label="삭제">✕</button>`;
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
        <input type="text" class="adm-input" placeholder="항목 (예: 플랫폼)" value="${escapeHtml(s.label)}" />
        <input type="text" class="adm-input" placeholder="값 (예: macOS / Windows)" value="${escapeHtml(s.value)}" />
        <button type="button" class="adm-btn danger-ghost small">삭제</button>
      `;
      const [labelIn, valIn, delBtn] = row.children;
      labelIn.addEventListener("input", () => {
        projects[selectedIndex].stats[idx].label = labelIn.value;
        scheduleAutosave();
      });
      valIn.addEventListener("input", () => {
        projects[selectedIndex].stats[idx].value = valIn.value;
        scheduleAutosave();
      });
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
    p.stats.push({ label: "항목", value: "내용" });
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
        <label class="primary-check">
          <input type="checkbox" ${link.primary ? "checked" : ""} /> 강조
        </label>
        <button type="button" class="adm-btn danger-ghost small">삭제</button>
      `;
      const [labelIn, urlIn, checkWrap, delBtn] = row.children;
      const checkbox = checkWrap.querySelector("input");
      labelIn.addEventListener("input", () => {
        projects[selectedIndex].links[idx].label = labelIn.value;
        scheduleAutosave();
      });
      urlIn.addEventListener("input", () => {
        projects[selectedIndex].links[idx].url = urlIn.value;
        scheduleAutosave();
      });
      checkbox.addEventListener("change", () => {
        projects[selectedIndex].links[idx].primary = checkbox.checked;
        scheduleAutosave();
      });
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

  // ===== 마크다운 툴바 =====
  document.querySelectorAll(".md-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".md-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const isPreview = tab.dataset.mode === "preview";
      fieldDescription.hidden = isPreview;
      mdPreviewBox.hidden = !isPreview;
      if (isPreview) mdPreviewBox.innerHTML = renderSimpleMarkdown(fieldDescription.value);
    });
  });

  document.querySelectorAll(".md-tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const start = fieldDescription.selectionStart;
      const end = fieldDescription.selectionEnd;
      const val = fieldDescription.value;
      const selected = val.slice(start, end) || "텍스트";
      const inserted = btn.dataset.wrap
        ? `${btn.dataset.wrap}${selected}${btn.dataset.wrap}`
        : `[${selected}](https://)`;
      fieldDescription.value = val.slice(0, start) + inserted + val.slice(end);
      fieldDescription.focus();
      descCharCount.textContent = `${fieldDescription.value.length}자`;
      scheduleAutosave();
    });
  });

  // ===== 입력 이벤트 =====
  [
    fieldTitle,
    fieldId,
    fieldCategory,
    fieldCategoryLabel,
    fieldStatus,
    fieldTagline,
    fieldDescription,
    fieldImageUrl,
    fieldVideoUrl,
  ].forEach((el) => {
    el.addEventListener("input", () => {
      if (el === fieldDescription) {
        descCharCount.textContent = `${fieldDescription.value.length}자`;
      }
      if (el === fieldImageUrl || el === fieldVideoUrl) {
        syncFormToProject();
        updateMediaPreview();
      }
      scheduleAutosave();
    });
    el.addEventListener("change", () => {
      syncFormToProject();
      persistAll(false);
      renderPostList();
    });
  });

  // ===== 주요 액션 =====
  toggleHideBtn.addEventListener("click", () => {
    if (selectedIndex < 0) return;
    setProjectHidden(selectedIndex, !isProjectHidden(projects[selectedIndex]));
  });

  newPostBtn.addEventListener("click", () => {
    projects.unshift({
      id: `item-${Date.now()}`,
      title: "새 항목",
      category: "program",
      categoryLabel: "PROGRAM",
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
    persistAll(false);
    selectProject(0);
    fieldTitle.focus();
    fieldTitle.select();
    showToast("새 항목이 추가되었습니다.");
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
    persistAll(false);
    selectProject(selectedIndex + 1);
    showToast("숨김 상태로 복제되었습니다.");
  });

  deletePostBtn.addEventListener("click", () => {
    const p = projects[selectedIndex];
    if (!p) return;
    if (!confirm(`"${p.title}" 항목을 삭제할까요?`)) return;
    projects.splice(selectedIndex, 1);
    selectedIndex = Math.min(selectedIndex, projects.length - 1);
    persistAll(false);
    if (selectedIndex >= 0) selectProject(selectedIndex);
    else renderPostList();
    showToast("삭제되었습니다.");
  });

  savePostBtn.addEventListener("click", () => {
    syncFormToProject();
    persistAll(true);
    renderPostList();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      syncFormToProject();
      persistAll(true);
      renderPostList();
    }
  });

  // ===== 내보내기 / 백업 / 복원 / 초기화 =====
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
    showToast("projects.js 다운로드 완료");
  });

  exportJsonBtn.addEventListener("click", () => {
    syncFormToProject();
    downloadFile(
      "sungomi-backup.json",
      JSON.stringify({ siteConfig, projects, exportedAt: new Date().toISOString() }, null, 2),
      "application/json"
    );
    showToast("백업 파일 다운로드 완료");
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
        persistAll(false);
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
    if (!confirm("로컬 변경사항을 지우고 기본 projects.js 데이터로 되돌릴까요?")) return;
    localStorage.removeItem(STORAGE_CONFIG_KEY);
    localStorage.removeItem(STORAGE_PROJECTS_KEY);
    siteConfig = clone(window.SITE_CONFIG || {});
    projects = clone(window.PROJECTS || []);
    selectProject(0);
    updateKPIs();
    showToast("초기화되었습니다.");
  });

  // ===== 사이트 설정 모달 =====
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

  function closeSettings() {
    settingsBackdrop.classList.remove("open");
    settingsBackdrop.setAttribute("aria-hidden", "true");
  }

  closeSettingsBtn.addEventListener("click", closeSettings);
  settingsBackdrop.addEventListener("click", (e) => {
    if (e.target === settingsBackdrop) closeSettings();
  });

  saveSettingsBtn.addEventListener("click", () => {
    siteConfig.brandName = cfgBrandName.value.trim();
    siteConfig.heroTitle = cfgHeroTitle.value.trim();
    siteConfig.heroSubtitle = cfgHeroSubtitle.value.trim();
    persistAll(false);
    closeSettings();
    showToast("설정이 저장되었습니다.");
  });

  [listSearchInput, listStatusFilter, listCategoryFilter].forEach((el) => {
    el.addEventListener("input", renderPostList);
    el.addEventListener("change", renderPostList);
  });

  updateKPIs();
  if (selectedIndex >= 0) selectProject(selectedIndex);
  else renderPostList();
})();
