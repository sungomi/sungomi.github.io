(() => {
  const STORAGE_CONFIG_KEY = "sungomi_arc_config_v1";
  const STORAGE_PROJECTS_KEY = "sungomi_arc_projects_v1";

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  function loadStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  let siteConfig = loadStored(STORAGE_CONFIG_KEY, window.SITE_CONFIG || {});
  let projects = loadStored(STORAGE_PROJECTS_KEY, window.PROJECTS || []);
  let selectedIndex = projects.length > 0 ? 0 : -1;
  let dragSrcIndex = null;
  let previewCleanup = null;
  let autosaveTimer = null;

  // DOM 요소
  const kpiTotal = document.getElementById("kpiTotal");
  const kpiPublished = document.getElementById("kpiPublished");
  const kpiDraft = document.getElementById("kpiDraft");
  const kpiVideos = document.getElementById("kpiVideos");

  const listSearchInput = document.getElementById("listSearchInput");
  const listStatusFilter = document.getElementById("listStatusFilter");
  const listCategoryFilter = document.getElementById("listCategoryFilter");
  const postListEl = document.getElementById("postList");

  const editorStatusPill = document.getElementById("editorStatusPill");
  const saveIndicator = document.getElementById("saveIndicator");
  const newPostBtn = document.getElementById("newPostBtn");
  const savePostBtn = document.getElementById("savePostBtn");
  const duplicatePostBtn = document.getElementById("duplicatePostBtn");
  const deletePostBtn = document.getElementById("deletePostBtn");

  // 폼 필드
  const fieldTitle = document.getElementById("fieldTitle");
  const fieldId = document.getElementById("fieldId");
  const fieldCategory = document.getElementById("fieldCategory");
  const fieldCategoryLabel = document.getElementById("fieldCategoryLabel");
  const fieldStatus = document.getElementById("fieldStatus");
  const fieldAccentColor = document.getElementById("fieldAccentColor");
  const fieldFeatured = document.getElementById("fieldFeatured");
  const fieldTagline = document.getElementById("fieldTagline");
  const fieldDescription = document.getElementById("fieldDescription");
  const descCharCount = document.getElementById("descCharCount");
  const mdPreviewBox = document.getElementById("mdPreviewBox");

  // 미디어 필드
  const mediaModeTabs = Array.from(document.querySelectorAll(".media-tab"));
  const panelPreset = document.getElementById("panelPreset");
  const panelUrl = document.getElementById("panelUrl");
  const panelLocal = document.getElementById("panelLocal");
  const fieldDemoPreset = document.getElementById("fieldDemoPreset");
  const fieldVideoUrl = document.getElementById("fieldVideoUrl");
  const videoDropzone = document.getElementById("videoDropzone");
  const videoFileInput = document.getElementById("videoFileInput");
  const localVideoInfo = document.getElementById("localVideoInfo");
  const localVideoName = document.getElementById("localVideoName");
  const removeLocalVideoBtn = document.getElementById("removeLocalVideoBtn");
  const editorPreviewVideo = document.getElementById("editorPreviewVideo");
  const editorPreviewIframe = document.getElementById("editorPreviewIframe");

  // 태그 / 스탯 / 링크 빌더
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
  const cfgHeroBadge = document.getElementById("cfgHeroBadge");
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
    setTimeout(() => el.remove(), 2800);
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

  function persistAll(showMsg = false) {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(siteConfig));
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    const time = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    saveIndicator.textContent = `자동 저장됨 (${time})`;
    if (showMsg) showToast("변경사항이 저장되었습니다.");
    updateKPIs();
  }

  function scheduleAutosave() {
    saveIndicator.textContent = "저장 중...";
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      syncFormToProject();
      persistAll(false);
      renderPostList();
    }, 500);
  }

  async function updateKPIs() {
    const pubCount = projects.filter((p) => p.status !== "draft").length;
    const draftCount = projects.length - pubCount;
    kpiTotal.textContent = projects.length;
    kpiPublished.textContent = pubCount;
    kpiDraft.textContent = draftCount;

    if (window.MediaStore) {
      try {
        const videos = await window.MediaStore.listVideos();
        kpiVideos.textContent = videos.length;
      } catch {
        kpiVideos.textContent = "0";
      }
    }
  }

  // ===== 좌측 글 목록 렌더링 & 드래그 순서 변경 =====
  function renderPostList() {
    const q = listSearchInput.value.trim().toLowerCase();
    const st = listStatusFilter.value;
    const cat = listCategoryFilter.value;

    postListEl.innerHTML = "";

    projects.forEach((p, idx) => {
      const isDraft = p.status === "draft";
      if (st === "published" && isDraft) return;
      if (st === "draft" && !isDraft) return;
      if (cat !== "all" && p.category !== cat) return;
      if (
        q &&
        !(p.title || "").toLowerCase().includes(q) &&
        !(p.tags || []).some((t) => t.toLowerCase().includes(q))
      ) {
        return;
      }

      const item = document.createElement("div");
      item.className = `post-item ${idx === selectedIndex ? "active" : ""}`;
      item.draggable = true;
      item.dataset.index = idx;

      item.innerHTML = `
        <div class="post-item-top">
          <span class="post-item-title">${p.featured ? "★ " : ""}${escapeHtml(p.title || "(제목 없음)")}</span>
          <div class="post-item-badges">
            <span class="mini-badge ${isDraft ? "draft" : "pub"}">${isDraft ? "임시" : "발행"}</span>
          </div>
        </div>
        <div class="post-item-bottom">
          <span>${escapeHtml(p.categoryLabel || p.category)} · ${p.videoSourceType === "local" ? "로컬영상" : p.videoUrl ? "URL영상" : "데모"}</span>
          <div class="order-btns">
            <button type="button" class="order-btn" data-move="-1" title="위로">▲</button>
            <button type="button" class="order-btn" data-move="1" title="아래로">▼</button>
          </div>
        </div>
      `;

      item.addEventListener("click", (e) => {
        if (e.target.closest(".order-btn")) return;
        selectProject(idx);
      });

      item.querySelectorAll(".order-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const delta = Number(btn.dataset.move);
          moveProject(idx, idx + delta);
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

  // ===== 에디터에 선택된 글 로드 =====
  function selectProject(idx) {
    selectedIndex = idx;
    const p = projects[idx];
    if (!p) return;

    fieldTitle.value = p.title || "";
    fieldId.value = p.id || "";
    fieldCategory.value = p.category || "game";
    fieldCategoryLabel.value = p.categoryLabel || "GAME";
    fieldStatus.value = p.status === "draft" ? "draft" : "published";
    fieldAccentColor.value = p.accentColor || "#00f0ff";
    fieldFeatured.checked = Boolean(p.featured);
    fieldTagline.value = p.tagline || "";
    fieldDescription.value = p.description || "";
    descCharCount.textContent = `${fieldDescription.value.length}자`;
    mdPreviewBox.innerHTML = renderSimpleMarkdown(fieldDescription.value);

    updateStatusPill();

    // 미디어 모드 결정
    const mode = p.videoSourceType || (p.videoUrl ? "url" : "preset");
    fieldDemoPreset.value = p.demoPreset || "cyber";
    fieldVideoUrl.value = p.videoUrl || "";
    switchMediaTab(mode, false);

    renderTagChips(p.tags || []);
    renderStatsBuilder(p.stats || []);
    renderLinksBuilder(p.links || []);
    renderPostList();
    updateEditorVideoPreview();
  }

  function updateStatusPill() {
    const isDraft = fieldStatus.value === "draft";
    editorStatusPill.textContent = isDraft ? "임시저장 (비공개)" : "발행됨 (노출 중)";
    editorStatusPill.classList.toggle("draft", isDraft);
  }

  function syncFormToProject() {
    const p = projects[selectedIndex];
    if (!p) return;
    p.title = fieldTitle.value.trim() || "제목 없는 작품";
    p.id = fieldId.value.trim() || p.id || `post-${Date.now()}`;
    p.category = fieldCategory.value;
    p.categoryLabel = fieldCategoryLabel.value.trim() || p.category.toUpperCase();
    p.status = fieldStatus.value;
    p.accentColor = fieldAccentColor.value;
    p.featured = fieldFeatured.checked;
    p.tagline = fieldTagline.value;
    p.description = fieldDescription.value;
    p.demoPreset = fieldDemoPreset.value;
    p.videoUrl = fieldVideoUrl.value.trim();
    updateStatusPill();
  }

  // ===== 태그, 스탯, 링크 빌더 =====
  function renderTagChips(tags) {
    tagChipsEl.innerHTML = "";
    tags.forEach((tag, idx) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `${escapeHtml(tag)} <button type="button" aria-label="태그 삭제">✕</button>`;
      chip.querySelector("button").addEventListener("click", () => {
        const p = projects[selectedIndex];
        p.tags.splice(idx, 1);
        renderTagChips(p.tags);
        scheduleAutosave();
      });
      tagChipsEl.appendChild(chip);
    });
  }

  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.value.replace(/,/g, "").trim();
      const p = projects[selectedIndex];
      if (val && p) {
        p.tags = p.tags || [];
        if (!p.tags.includes(val)) {
          p.tags.push(val);
          renderTagChips(p.tags);
          scheduleAutosave();
        }
      }
      tagInput.value = "";
    } else if (e.key === "Backspace" && tagInput.value === "") {
      const p = projects[selectedIndex];
      if (p && p.tags && p.tags.length > 0) {
        p.tags.pop();
        renderTagChips(p.tags);
        scheduleAutosave();
      }
    }
  });

  function renderStatsBuilder(stats) {
    statsBuilder.innerHTML = "";
    stats.forEach((stat, idx) => {
      const row = document.createElement("div");
      row.className = "dynamic-row stat-row";
      row.innerHTML = `
        <input type="text" class="adm-input" placeholder="항목 (예: 장르)" value="${escapeHtml(stat.label)}" />
        <input type="text" class="adm-input" placeholder="내용 (예: 로그라이트)" value="${escapeHtml(stat.value)}" />
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
    p.stats.push({ label: "버전", value: "v1.0" });
    renderStatsBuilder(p.stats);
    scheduleAutosave();
  });

  function renderLinksBuilder(links) {
    linksBuilder.innerHTML = "";
    links.forEach((link, idx) => {
      const row = document.createElement("div");
      row.className = "dynamic-row link-row";
      row.innerHTML = `
        <input type="text" class="adm-input" placeholder="버튼명 (예: 다운로드)" value="${escapeHtml(link.label)}" />
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
    p.links.push({ label: "바로가기", url: "https://", primary: p.links.length === 0 });
    renderLinksBuilder(p.links);
    scheduleAutosave();
  });

  // ===== 미디어 스튜디오 & 실시간 프리뷰 =====
  function switchMediaTab(mode, save = true) {
    mediaModeTabs.forEach((t) => t.classList.toggle("active", t.dataset.source === mode));
    panelPreset.hidden = mode !== "preset";
    panelUrl.hidden = mode !== "url";
    panelLocal.hidden = mode !== "local";

    const p = projects[selectedIndex];
    if (p && save) {
      p.videoSourceType = mode;
      scheduleAutosave();
      updateEditorVideoPreview();
    }
  }

  mediaModeTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchMediaTab(tab.dataset.source, true));
  });

  function getYoutubeEmbed(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&playlist=${m[1]}` : null;
  }

  function startProceduralPreview(videoEl, preset, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    let rafId = 0;
    let t = 0;

    function loop() {
      t += 0.03;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = color || "#2563eb";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const r = 36 + i * 24 + Math.sin(t + i) * 8;
        ctx.arc(canvas.width / 2 + Math.cos(t * 0.7 + i) * 48, canvas.height / 2 + Math.sin(t + i) * 24, r, 0, Math.PI * 2);
        ctx.globalAlpha = 0.28 - i * 0.04;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0f172a";
      ctx.font = "600 14px Pretendard, sans-serif";
      ctx.fillText(`PREVIEW PRESET: ${String(preset || "cyber").toUpperCase()}`, 24, canvas.height - 24);

      rafId = requestAnimationFrame(loop);
    }
    loop();
    if (canvas.captureStream) {
      videoEl.srcObject = canvas.captureStream(30);
      videoEl.play().catch(() => {});
    }
    return () => {
      cancelAnimationFrame(rafId);
      if (videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach((tr) => tr.stop());
        videoEl.srcObject = null;
      }
    };
  }

  async function updateEditorVideoPreview() {
    if (previewCleanup) {
      previewCleanup();
      previewCleanup = null;
    }

    const p = projects[selectedIndex];
    if (!p) return;

    const mode = p.videoSourceType || (p.videoUrl ? "url" : "preset");
    localVideoInfo.hidden = true;

    if (mode === "local" && window.MediaStore) {
      const rec = await window.MediaStore.getVideo(p.localVideoId || p.id);
      if (rec && rec.blob) {
        localVideoInfo.hidden = false;
        const sizeMb = (rec.size / (1024 * 1024)).toFixed(1);
        localVideoName.textContent = `${rec.name} (${sizeMb} MB)`;
        const blobUrl = URL.createObjectURL(rec.blob);
        editorPreviewIframe.hidden = true;
        editorPreviewIframe.src = "";
        editorPreviewVideo.hidden = false;
        editorPreviewVideo.srcObject = null;
        editorPreviewVideo.src = blobUrl;
        editorPreviewVideo.play().catch(() => {});
        previewCleanup = () => URL.revokeObjectURL(blobUrl);
        return;
      }
    }

    if (mode === "url" && p.videoUrl) {
      const yt = getYoutubeEmbed(p.videoUrl);
      if (yt) {
        editorPreviewVideo.hidden = true;
        editorPreviewIframe.hidden = false;
        editorPreviewIframe.src = yt;
        return;
      }
      editorPreviewIframe.hidden = true;
      editorPreviewIframe.src = "";
      editorPreviewVideo.hidden = false;
      editorPreviewVideo.srcObject = null;
      editorPreviewVideo.src = p.videoUrl;
      editorPreviewVideo.play().catch(() => {});
      return;
    }

    editorPreviewIframe.hidden = true;
    editorPreviewIframe.src = "";
    editorPreviewVideo.hidden = false;
    editorPreviewVideo.removeAttribute("src");
    previewCleanup = startProceduralPreview(editorPreviewVideo, p.demoPreset, p.accentColor);
  }

  async function handleVideoUpload(file) {
    if (!file || !file.type.startsWith("video/")) {
      showToast("MP4, WebM, MOV 동영상 파일만 업로드할 수 있습니다.");
      return;
    }
    const p = projects[selectedIndex];
    if (!p) return;
    const vidId = p.id || `vid-${Date.now()}`;
    p.localVideoId = vidId;
    p.videoSourceType = "local";
    await window.MediaStore.saveVideo(vidId, file);
    persistAll(false);
    updateEditorVideoPreview();
    renderPostList();
    showToast(`"${file.name}" 영상이 저장되었습니다.`);
  }

  videoDropzone.addEventListener("click", () => videoFileInput.click());
  videoFileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) handleVideoUpload(e.target.files[0]);
  });
  videoDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    videoDropzone.classList.add("dragover");
  });
  videoDropzone.addEventListener("dragleave", () => videoDropzone.classList.remove("dragover"));
  videoDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    videoDropzone.classList.remove("dragover");
    if (e.dataTransfer.files[0]) handleVideoUpload(e.dataTransfer.files[0]);
  });

  removeLocalVideoBtn.addEventListener("click", async () => {
    const p = projects[selectedIndex];
    if (!p) return;
    await window.MediaStore.deleteVideo(p.localVideoId || p.id);
    p.videoSourceType = "preset";
    switchMediaTab("preset", true);
    updateKPIs();
    showToast("업로드된 로컬 영상을 삭제했습니다.");
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
      let inserted = selected;
      if (btn.dataset.wrap) {
        inserted = `${btn.dataset.wrap}${selected}${btn.dataset.wrap}`;
      } else if (btn.dataset.link) {
        inserted = `[${selected}](https://)`;
      }
      fieldDescription.value = val.slice(0, start) + inserted + val.slice(end);
      fieldDescription.focus();
      descCharCount.textContent = `${fieldDescription.value.length}자`;
      scheduleAutosave();
    });
  });

  // ===== 폼 입력 이벤트 바인딩 =====
  [
    fieldTitle,
    fieldId,
    fieldCategory,
    fieldCategoryLabel,
    fieldStatus,
    fieldAccentColor,
    fieldFeatured,
    fieldTagline,
    fieldDescription,
    fieldDemoPreset,
    fieldVideoUrl,
  ].forEach((el) => {
    el.addEventListener("input", () => {
      if (el === fieldDescription) {
        descCharCount.textContent = `${fieldDescription.value.length}자`;
      }
      if (el === fieldDemoPreset || el === fieldVideoUrl || el === fieldAccentColor) {
        syncFormToProject();
        updateEditorVideoPreview();
      }
      scheduleAutosave();
    });
    el.addEventListener("change", () => {
      syncFormToProject();
      scheduleAutosave();
    });
  });

  document.querySelectorAll(".color-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      fieldAccentColor.value = dot.dataset.color;
      syncFormToProject();
      updateEditorVideoPreview();
      scheduleAutosave();
    });
  });

  // ===== 새 글 / 복제 / 삭제 / 저장 =====
  newPostBtn.addEventListener("click", () => {
    const newItem = {
      id: `project-${Date.now()}`,
      title: "새 게임 / 프로그램",
      category: "game",
      categoryLabel: "GAME",
      status: "published",
      featured: false,
      tagline: "한 줄 소개를 입력하세요.",
      description: "작품에 대한 자세한 설명을 작성해보세요.",
      tags: ["Indie"],
      accentColor: "#00f0ff",
      videoSourceType: "preset",
      videoUrl: "",
      demoPreset: "cyber",
      stats: [{ label: "장르", value: "인디 게임" }],
      links: [{ label: "다운로드 / 실행", url: "https://", primary: true }],
    };
    projects.unshift(newItem);
    persistAll(false);
    selectProject(0);
    fieldTitle.focus();
    fieldTitle.select();
    showToast("새 글이 추가되었습니다.");
  });

  duplicatePostBtn.addEventListener("click", () => {
    const p = projects[selectedIndex];
    if (!p) return;
    const copy = clone(p);
    copy.id = `${p.id}-copy-${Date.now().toString().slice(-4)}`;
    copy.title = `${p.title} (복사본)`;
    copy.status = "draft";
    projects.splice(selectedIndex + 1, 0, copy);
    persistAll(false);
    selectProject(selectedIndex + 1);
    showToast("글을 임시저장으로 복제했습니다.");
  });

  deletePostBtn.addEventListener("click", async () => {
    const p = projects[selectedIndex];
    if (!p) return;
    if (!confirm(`"${p.title}" 글을 정말 삭제하시겠습니까?`)) return;
    if (window.MediaStore && p.localVideoId) {
      await window.MediaStore.deleteVideo(p.localVideoId);
    }
    projects.splice(selectedIndex, 1);
    selectedIndex = Math.min(selectedIndex, projects.length - 1);
    persistAll(false);
    if (selectedIndex >= 0) selectProject(selectedIndex);
    else renderPostList();
    showToast("글이 삭제되었습니다.");
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

  // ===== 내보내기 / 가져오기 / 초기화 =====
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
    showToast("projects.js 파일을 내보냈습니다!");
  });

  exportJsonBtn.addEventListener("click", () => {
    syncFormToProject();
    const payload = { siteConfig, projects, exportedAt: new Date().toISOString() };
    downloadFile("sungomi-arc-backup.json", JSON.stringify(payload, null, 2), "application/json");
    showToast("JSON 백업 파일을 다운로드했습니다.");
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
        showToast("JSON 백업을 성공적으로 복원했습니다.");
      } catch {
        showToast("올바른 JSON 백업 파일이 아닙니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  resetDefaultBtn.addEventListener("click", () => {
    if (!confirm("저장된 수정 내역을 초기화하고 기본 GitHub 프로젝트 목록으로 되돌릴까요?")) return;
    localStorage.removeItem(STORAGE_CONFIG_KEY);
    localStorage.removeItem(STORAGE_PROJECTS_KEY);
    siteConfig = clone(window.SITE_CONFIG || {});
    projects = clone(window.PROJECTS || []);
    selectProject(0);
    updateKPIs();
    showToast("기본 데이터로 초기화했습니다.");
  });

  // ===== 사이트 전역 설정 모달 =====
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
    cfgHeroBadge.value = siteConfig.heroBadge || "";
    cfgHeroTitle.value = siteConfig.heroTitle || "";
    cfgHeroSubtitle.value = siteConfig.heroSubtitle || "";
    siteConfig.creator = siteConfig.creator || { name: "sungomi", links: [] };
    renderCfgLinks();
    settingsBackdrop.classList.add("open");
    settingsBackdrop.setAttribute("aria-hidden", "false");
  });

  addCfgLinkBtn.addEventListener("click", () => {
    siteConfig.creator = siteConfig.creator || { name: "sungomi", links: [] };
    siteConfig.creator.links.push({ label: "새 링크", url: "https://" });
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
    siteConfig.heroBadge = cfgHeroBadge.value.trim();
    siteConfig.heroTitle = cfgHeroTitle.value.trim();
    siteConfig.heroSubtitle = cfgHeroSubtitle.value.trim();
    persistAll(false);
    closeSettings();
    showToast("사이트 전역 설정이 저장되었습니다.");
  });

  [listSearchInput, listStatusFilter, listCategoryFilter].forEach((el) => {
    el.addEventListener("input", renderPostList);
    el.addEventListener("change", renderPostList);
  });

  // 초기화 실행
  updateKPIs();
  if (selectedIndex >= 0) selectProject(selectedIndex);
  else renderPostList();
})();
