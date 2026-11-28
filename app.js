(() => {
  const STORAGE_CONFIG_KEY = "sungomi_arc_config_v3";
  const STORAGE_PROJECTS_KEY = "sungomi_arc_projects_v3";

  const PLATFORM_ICONS = {
    macos: {
      title: "macOS",
      svg: `<svg class="os-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.32c.67-.81 1.12-1.94 1-3.07-.96.04-2.13.64-2.82 1.45-.61.7-.114 1.85-1 2.96 1.07.08 2.16-.54 2.82-1.34z"/></svg>`,
    },
    windows: {
      title: "Windows",
      svg: `<svg class="os-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5.55 10.35 4.5v7.1H3V5.55zm0 12.9 7.35 1.05v-7.05H3v6zm8.25 1.18L21 21v-8.55h-9.75v7.18zm0-15.26v7.23H21V3l-9.75 1.37z"/></svg>`,
    },
    ios: {
      title: "iPhone / iOS",
      svg: `<svg class="os-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 5.5h3"/><circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none"/></svg>`,
    },
    web: {
      title: "Web",
      svg: `<svg class="os-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a13.5 13.5 0 0 0 0 18M12 3a13.5 13.5 0 0 1 0 18"/></svg>`,
    },
  };

  function detectPlatforms(project) {
    if (Array.isArray(project.platforms) && project.platforms.length) {
      return project.platforms;
    }
    const text = [
      ...(project.tags || []),
      ...(project.stats || []).map((s) => s.value),
    ]
      .join(" ")
      .toLowerCase();
    const list = [];
    if (/\bios\b|iphone/.test(text)) list.push("ios");
    if (/mac|macos/.test(text)) list.push("macos");
    if (/win|windows/.test(text)) list.push("windows");
    if (/웹|web|browser/.test(text)) list.push("web");
    return list;
  }

  function renderPlatformIcons(platforms) {
    return platforms
      .filter((k) => PLATFORM_ICONS[k])
      .map(
        (k) =>
          `<span class="os-badge" title="${PLATFORM_ICONS[k].title}" aria-label="${PLATFORM_ICONS[k].title}">${PLATFORM_ICONS[k].svg}</span>`
      )
      .join("");
  }

  function renderTagHtml(tag) {
    const low = String(tag || "").toLowerCase();
    if (low === "macos" || low === "mac") {
      return `<span class="tag tag-os" title="macOS">${PLATFORM_ICONS.macos.svg}</span>`;
    }
    if (low === "windows" || low === "win") {
      return `<span class="tag tag-os" title="Windows">${PLATFORM_ICONS.windows.svg}</span>`;
    }
    if (low === "ios" || low === "iphone") {
      return `<span class="tag tag-os" title="iPhone / iOS">${PLATFORM_ICONS.ios.svg}</span>`;
    }
    return `<span class="tag">${escapeHtml(tag)}</span>`;
  }

  function renderLinkLabel(label) {
    const low = String(label || "").toLowerCase();
    if (low.includes("mac")) {
      return `${PLATFORM_ICONS.macos.svg}<span>${escapeHtml(label)}</span>`;
    }
    if (low.includes("win")) {
      return `${PLATFORM_ICONS.windows.svg}<span>${escapeHtml(label)}</span>`;
    }
    if (low.includes("ios") || low.includes("iphone")) {
      return `${PLATFORM_ICONS.ios.svg}<span>${escapeHtml(label)}</span>`;
    }
    return `<span>${escapeHtml(label)}</span>`;
  }

  function loadStoredJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed || fallback;
    } catch {
      return fallback;
    }
  }

  const config = loadStoredJson(STORAGE_CONFIG_KEY, window.SITE_CONFIG || {});
  const allProjects = loadStoredJson(STORAGE_PROJECTS_KEY, window.PROJECTS || []);
  const projects = allProjects.filter((p) => !p.hidden && p.status !== "draft");

  // DOM 요소
  const brandNameEl = document.getElementById("brandName");
  const creatorLinksEl = document.getElementById("creatorLinks");
  const heroTitleEl = document.getElementById("heroTitle");
  const heroSubtitleEl = document.getElementById("heroSubtitle");
  const projectsGrid = document.getElementById("projectsGrid");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const resetFilterBtn = document.getElementById("resetFilterBtn");
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
  const filterIndicator = document.getElementById("filterIndicator");

  // 모달 요소
  const modalBackdrop = document.getElementById("modalBackdrop");
  const liquidModal = document.getElementById("liquidModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalImage = document.getElementById("modalImage");
  const modalVideo = document.getElementById("modalVideo");
  const modalIframe = document.getElementById("modalIframe");
  const videoOverlayControls = document.getElementById("videoOverlayControls");
  const muteToggleBtn = document.getElementById("muteToggleBtn");
  const iconMuted = document.getElementById("iconMuted");
  const iconUnmuted = document.getElementById("iconUnmuted");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const modalCategory = document.getElementById("modalCategory");
  const modalTags = document.getElementById("modalTags");
  const modalTitle = document.getElementById("modalTitle");
  const modalTagline = document.getElementById("modalTagline");
  const modalDescription = document.getElementById("modalDescription");
  const modalStats = document.getElementById("modalStats");
  const modalLinks = document.getElementById("modalLinks");

  let activeCategory = "all";
  let searchQuery = "";
  let activeModalCleanup = null;
  const cardCleanups = [];

  function initSiteConfig() {
    if (config.brandName) {
      const textEl = brandNameEl.querySelector(".brand-text");
      if (textEl) textEl.textContent = config.brandName;
    }
    if (config.heroTitle) heroTitleEl.innerHTML = config.heroTitle;
    if (config.heroSubtitle) heroSubtitleEl.textContent = config.heroSubtitle;

    if (config.creator && Array.isArray(config.creator.links)) {
      creatorLinksEl.innerHTML = config.creator.links
        .map(
          (link) =>
            `<a class="header-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
        )
        .join("");
    }
  }

  function escapeHtml(str) {
    return String(str)
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

  function getYoutubeEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (!match) return null;
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&playsinline=1`;
  }

  async function bindCardMedia(mediaWrap, project, cleanups) {
    const imgEl = mediaWrap.querySelector(".card-image");
    const videoEl = mediaWrap.querySelector(".card-video");

    if (project.videoSourceType === "local" && window.MediaStore) {
      try {
        const record = await window.MediaStore.getVideo(project.localVideoId || project.id);
        if (record && record.blob) {
          const blobUrl = URL.createObjectURL(record.blob);
          imgEl.hidden = true;
          videoEl.hidden = false;
          videoEl.src = blobUrl;
          videoEl.play().catch(() => {});
          cleanups.push(() => URL.revokeObjectURL(blobUrl));
          return;
        }
      } catch {
        // fallback to image
      }
    }

    const ytEmbed = getYoutubeEmbedUrl(project.videoUrl);
    if (project.videoUrl && !ytEmbed) {
      imgEl.hidden = true;
      videoEl.hidden = false;
      videoEl.src = project.videoUrl;
      videoEl.play().catch(() => {});
      return;
    }

    videoEl.hidden = true;
    imgEl.hidden = false;
    imgEl.src = project.imageUrl || "";
    imgEl.alt = project.title || "";
  }

  function updateCategoryCounts() {
    const counts = { all: projects.length, game: 0, program: 0, webapp: 0 };
    projects.forEach((p) => {
      if (counts[p.category] !== undefined) counts[p.category]++;
    });
    Object.keys(counts).forEach((key) => {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = counts[key];
    });
  }

  function updateFilterIndicator() {
    const activeBtn = filterButtons.find((btn) => btn.dataset.category === activeCategory);
    if (!activeBtn || !filterIndicator) return;
    const dockRect = activeBtn.parentElement.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const offsetLeft = btnRect.left - dockRect.left - 4;
    filterIndicator.style.width = `${btnRect.width}px`;
    filterIndicator.style.transform = `translateX(${offsetLeft}px)`;
  }

  function renderProjects() {
    while (cardCleanups.length) {
      const cleanup = cardCleanups.pop();
      cleanup();
    }

    const q = searchQuery.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      const matchesCat = activeCategory === "all" || p.category === activeCategory;
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });

    projectsGrid.innerHTML = "";
    emptyState.hidden = filtered.length > 0;

    filtered.forEach((project) => {
      const card = document.createElement("article");
      card.className = "project-card";
      card.style.setProperty("--accent", project.accentColor || "#2563eb");
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${project.title} 상세 보기`);

      const platforms = detectPlatforms(project);
      const nonOsTags = (project.tags || []).filter(
        (t) => !/^(macos|mac|windows|win|ios|iphone)$/i.test(String(t).trim())
      );

      card.innerHTML = `
        <div class="card-media">
          <img class="card-image" loading="lazy" alt="" />
          <video class="card-video" autoplay muted loop playsinline hidden></video>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">${escapeHtml(project.title)}</h3>
            <span class="category-chip">${escapeHtml(project.categoryLabel || project.category)}</span>
          </div>
          <p class="card-tagline">${escapeHtml(project.tagline)}</p>
          <div class="card-tags">
            ${nonOsTags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="card-footer">
            <div class="card-platforms">${renderPlatformIcons(platforms)}</div>
            <span class="card-cta-label">보기 →</span>
          </div>
        </div>
      `;

      bindCardMedia(card.querySelector(".card-media"), project, cardCleanups);

      card.addEventListener("click", () => openModal(project));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(project);
        }
      });

      projectsGrid.appendChild(card);
    });
  }

  async function openModal(project) {
    if (activeModalCleanup) {
      activeModalCleanup();
      activeModalCleanup = null;
    }

    modalCategory.textContent = project.categoryLabel || project.category.toUpperCase();
    modalTitle.textContent = project.title;
    modalTagline.textContent = project.tagline;
    modalDescription.innerHTML = renderSimpleMarkdown(project.description);

    modalTags.innerHTML = (project.tags || [])
      .map((t) => renderTagHtml(t))
      .join("");

    modalStats.innerHTML = (project.stats || [])
      .map((s) => {
        const isPlat = s.label === "플랫폼";
        const valHtml = isPlat
          ? `<div class="stat-value stat-platforms">${renderPlatformIcons(detectPlatforms(project))}</div>`
          : `<div class="stat-value">${escapeHtml(s.value)}</div>`;
        return `
        <div class="stat-box">
          <div class="stat-label">${escapeHtml(s.label)}</div>
          ${valHtml}
        </div>
      `;
      })
      .join("");

    modalLinks.innerHTML = (project.links || [])
      .map(
        (link) => `
        <a
          class="modal-link-btn ${link.primary ? "primary" : "secondary"}"
          href="${escapeHtml(link.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${renderLinkLabel(link.label)}
          <span>↗</span>
        </a>
      `
      )
      .join("");

    // 미디어 표시 (로컬 영상 / URL 영상 / YouTube / 공식 이미지)
    modalImage.hidden = true;
    modalVideo.hidden = true;
    modalIframe.hidden = true;
    videoOverlayControls.hidden = true;
    modalIframe.src = "";
    modalVideo.pause();
    modalVideo.removeAttribute("src");

    let shownVideo = false;

    if (project.videoSourceType === "local" && window.MediaStore) {
      try {
        const record = await window.MediaStore.getVideo(project.localVideoId || project.id);
        if (record && record.blob) {
          const blobUrl = URL.createObjectURL(record.blob);
          modalVideo.hidden = false;
          videoOverlayControls.hidden = false;
          modalVideo.muted = true;
          updateMuteIcons(true);
          modalVideo.src = blobUrl;
          modalVideo.play().catch(() => {});
          activeModalCleanup = () => URL.revokeObjectURL(blobUrl);
          shownVideo = true;
        }
      } catch {
        // fallback
      }
    }

    if (!shownVideo) {
      const ytEmbed = getYoutubeEmbedUrl(project.videoUrl);
      if (project.videoUrl && ytEmbed) {
        modalIframe.hidden = false;
        modalIframe.src = ytEmbed;
        shownVideo = true;
      } else if (project.videoUrl) {
        modalVideo.hidden = false;
        videoOverlayControls.hidden = false;
        modalVideo.muted = true;
        updateMuteIcons(true);
        modalVideo.src = project.videoUrl;
        modalVideo.play().catch(() => {});
        shownVideo = true;
      }
    }

    if (!shownVideo) {
      modalImage.hidden = false;
      modalImage.src = project.imageUrl || "";
      modalImage.alt = project.title || "";
    }

    document.body.classList.add("modal-open");
    modalBackdrop.classList.add("open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    liquidModal.scrollTop = 0;

    liquidModal.animate(
      [
        { transform: "translateY(12px) scale(0.98)", opacity: 0 },
        { transform: "translateY(0) scale(1)", opacity: 1 },
      ],
      {
        duration: 240,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      }
    );
  }

  function closeModal() {
    if (!modalBackdrop.classList.contains("open")) return;
    modalBackdrop.classList.remove("open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modalIframe.src = "";
    modalVideo.pause();
    if (activeModalCleanup) {
      activeModalCleanup();
      activeModalCleanup = null;
    }
  }

  function updateMuteIcons(isMuted) {
    iconMuted.hidden = !isMuted;
    iconUnmuted.hidden = isMuted;
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      filterButtons.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-selected", String(isActive));
      });
      updateFilterIndicator();
      renderProjects();
    });
  });

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    searchClear.hidden = searchQuery.length === 0;
    renderProjects();
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    searchClear.hidden = true;
    searchInput.focus();
    renderProjects();
  });

  resetFilterBtn.addEventListener("click", () => {
    activeCategory = "all";
    searchQuery = "";
    searchInput.value = "";
    searchClear.hidden = true;
    filterButtons.forEach((b) => {
      const isActive = b.dataset.category === "all";
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", String(isActive));
    });
    updateFilterIndicator();
    renderProjects();
  });

  modalCloseBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  // 숨겨진 관리자 페이지 진입 (단축키 Ctrl+Shift+A 또는 로고 5회 연속 클릭)
  let logoClicks = 0;
  let logoClickTimer = null;
  if (brandNameEl) {
    brandNameEl.addEventListener("click", (e) => {
      e.preventDefault();
      logoClicks += 1;
      clearTimeout(logoClickTimer);
      if (logoClicks >= 5) {
        logoClicks = 0;
        window.location.href = "./admin.html";
        return;
      }
      logoClickTimer = setTimeout(() => {
        logoClicks = 0;
      }, 1500);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      window.location.href = "./admin.html";
    }
  });

  muteToggleBtn.addEventListener("click", () => {
    modalVideo.muted = !modalVideo.muted;
    updateMuteIcons(modalVideo.muted);
  });

  fullscreenBtn.addEventListener("click", () => {
    const target = modalVideo.hidden ? modalIframe : modalVideo;
    if (target.requestFullscreen) target.requestFullscreen();
  });

  window.addEventListener("resize", updateFilterIndicator);

  initSiteConfig();
  updateCategoryCounts();
  renderProjects();
  requestAnimationFrame(updateFilterIndicator);
})();
