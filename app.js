(() => {
  const STORAGE_CONFIG_KEY = "sungomi_arc_config_v2";
  const STORAGE_PROJECTS_KEY = "sungomi_arc_projects_v2";

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
  const projects = allProjects.filter((p) => p.status !== "draft");

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

      const platformStat =
        (project.stats || []).find((s) => s.label === "플랫폼") ||
        (project.stats || [])[0];
      const platformText = platformStat ? platformStat.value : "";

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
            ${(project.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="card-footer">
            <span class="card-platform">${escapeHtml(platformText)}</span>
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
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");

    modalStats.innerHTML = (project.stats || [])
      .map(
        (s) => `
        <div class="stat-box">
          <div class="stat-label">${escapeHtml(s.label)}</div>
          <div class="stat-value">${escapeHtml(s.value)}</div>
        </div>
      `
      )
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
          <span>${escapeHtml(link.label)}</span>
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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
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
