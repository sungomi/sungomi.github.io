(() => {
  const STORAGE_CONFIG_KEY = "sungomi_arc_config_v1";
  const STORAGE_PROJECTS_KEY = "sungomi_arc_projects_v1";

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
  const heroBadgeEl = document.getElementById("heroBadge");
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
  const modalVideo = document.getElementById("modalVideo");
  const modalIframe = document.getElementById("modalIframe");
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
  let lastTriggerCard = null;
  let activeModalStreamCleanup = null;
  const cardStreamCleanups = [];

  // ===== 사이트 설정 반영 =====
  function initSiteConfig() {
    if (config.brandName) {
      const textEl = brandNameEl.querySelector(".brand-text");
      if (textEl) textEl.textContent = config.brandName;
    }
    if (config.heroBadge) {
      const span = heroBadgeEl.querySelector("span:last-child");
      if (span) span.textContent = config.heroBadge;
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

  async function bindProjectVideo(videoEl, project, cleanups) {
    if (project.videoSourceType === "local" && window.MediaStore) {
      try {
        const record = await window.MediaStore.getVideo(project.localVideoId || project.id);
        if (record && record.blob) {
          const blobUrl = URL.createObjectURL(record.blob);
          videoEl.srcObject = null;
          videoEl.src = blobUrl;
          videoEl.play().catch(() => {});
          cleanups.push(() => URL.revokeObjectURL(blobUrl));
          return true;
        }
      } catch {
        // IndexedDB 실패 시 프리셋으로 폴백
      }
    }
    const ytEmbed = getYoutubeEmbedUrl(project.videoUrl);
    if (project.videoUrl && !ytEmbed) {
      videoEl.srcObject = null;
      videoEl.src = project.videoUrl;
      videoEl.play().catch(() => {});
      return true;
    }
    const cleanup = attachProceduralVideo(videoEl, project.demoPreset, project.accentColor);
    cleanups.push(cleanup);
    return false;
  }

  // ===== 내장 실시간 데모 영상 생성기 (Canvas -> MediaStream -> <video>) =====
  function attachProceduralVideo(videoEl, preset, accentColor) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    let rafId = 0;
    let t = Math.random() * 100;

    // 프리셋별 상태 초기화
    const particles = Array.from({ length: 36 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2.5,
      vy: (Math.random() - 0.5) * 2.5,
      r: 2 + Math.random() * 4,
      phase: i * 0.4,
    }));

    function drawFrame() {
      t += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // 배경
      ctx.fillStyle = "#060914";
      ctx.fillRect(0, 0, w, h);

      if (preset === "cyber") {
        // 네온 신스웨이브 그리드 & 질주 라인
        const horizon = h * 0.46;
        const grad = ctx.createLinearGradient(0, 0, 0, horizon);
        grad.addColorStop(0, "#0b1026");
        grad.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, horizon);

        // 네온 태양
        const sunGrad = ctx.createRadialGradient(w / 2, horizon - 20, 10, w / 2, horizon - 20, 90);
        sunGrad.addColorStop(0, "#00f0ff");
        sunGrad.addColorStop(0.5, "#ff2e93");
        sunGrad.addColorStop(1, "transparent");
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(w / 2, horizon - 20, 90, 0, Math.PI * 2);
        ctx.fill();

        // 원근감 바닥 그리드
        ctx.strokeStyle = "rgba(0, 240, 255, 0.45)";
        ctx.lineWidth = 1.5;
        for (let i = -8; i <= 8; i++) {
          ctx.beginPath();
          ctx.moveTo(w / 2 + i * 22, horizon);
          ctx.lineTo(w / 2 + i * 110, h);
          ctx.stroke();
        }
        for (let j = 0; j < 10; j++) {
          const progress = ((j / 10 + (t * 0.35) % 0.1)) % 1;
          const y = horizon + Math.pow(progress, 2) * (h - horizon);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      } else if (preset === "arcade") {
        // 우주 탄막 슈터 프리뷰
        ctx.fillStyle = "rgba(6, 9, 20, 0.35)";
        ctx.fillRect(0, 0, w, h);

        // 보스 코어
        const bx = w / 2 + Math.sin(t * 0.9) * 110;
        const by = 110 + Math.cos(t * 1.2) * 20;
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(bx, by, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 방사형 탄막
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2 + t * 0.8;
          const dist = ((t * 95 + i * 18) % 280);
          const px = bx + Math.cos(angle) * dist;
          const py = by + Math.sin(angle) * dist;
          ctx.fillStyle = i % 2 === 0 ? "#ff2e93" : "#38bdf8";
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 플레이어 기체
        const sx = w / 2 + Math.sin(t * 1.6) * 150;
        const sy = h - 65;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(sx, sy - 14);
        ctx.lineTo(sx - 12, sy + 12);
        ctx.lineTo(sx + 12, sy + 12);
        ctx.closePath();
        ctx.fill();
      } else if (preset === "audio") {
        // 오디오 웨이브테이블 & 스펙트럼 바
        const bars = 32;
        const barW = w / bars;
        for (let i = 0; i < bars; i++) {
          const val = (Math.sin(t * 3 + i * 0.45) * 0.5 + 0.5) * 140 + 25;
          const grad = ctx.createLinearGradient(0, h, 0, h - val);
          grad.addColorStop(0, "#7c3aed");
          grad.addColorStop(1, "#00f0ff");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(i * barW + 4, h - val - 30, barW - 8, val, 6);
          ctx.fill();
        }
        // 파형 라인
        ctx.strokeStyle = "#f0abfc";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y = h * 0.35 + Math.sin(x * 0.025 + t * 4) * 38 * Math.sin(t + x * 0.01);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (preset === "physics") {
        // 천체 궤도 시뮬레이터
        const cx = w / 2;
        const cy = h / 2;
        const coreGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 55);
        coreGrad.addColorStop(0, "#fff");
        coreGrad.addColorStop(0.3, "#38bdf8");
        coreGrad.addColorStop(1, "transparent");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 55, 0, Math.PI * 2);
        ctx.fill();

        particles.slice(0, 12).forEach((p, idx) => {
          const rX = 70 + idx * 17;
          const rY = 42 + idx * 10;
          const ang = t * (1.2 - idx * 0.06) + p.phase;
          const px = cx + Math.cos(ang) * rX;
          const py = cy + Math.sin(ang) * rY;

          ctx.strokeStyle = "rgba(56, 189, 248, 0.16)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rX, rY, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = idx % 3 === 0 ? "#f472b6" : "#67e8f9";
          ctx.beginPath();
          ctx.arc(px, py, 4 + (idx % 3) * 2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (preset === "shader") {
        // 리퀴드 프리즘 셰이더 느낌의 컬러 블롭
        for (let i = 0; i < 5; i++) {
          const px = w / 2 + Math.cos(t * (0.7 + i * 0.15) + i) * 140;
          const py = h / 2 + Math.sin(t * (0.9 + i * 0.12) + i * 2) * 90;
          const r = 95 + Math.sin(t + i) * 25;
          const g = ctx.createRadialGradient(px, py, 5, px, py, r);
          g.addColorStop(0, i % 2 === 0 ? "rgba(34,211,238,0.65)" : "rgba(192,132,252,0.65)");
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 해킹 터미널 매트릭스 스타일
        ctx.fillStyle = "#04110b";
        ctx.fillRect(0, 0, w, h);
        ctx.font = "14px monospace";
        const lines = [
          "> INIT GHOST.SYS KERNEL v1.2...",
          "> SCANNING FIREWALL NODES [192.168.0.x]",
          "> BYPASSING LAYER 04... OK",
          "> DECRYPTING PAYLOAD: 0x7FA9C2",
          "> ACCESS GRANTED // ROOT SHELL ACTIVE",
        ];
        lines.forEach((line, idx) => {
          const visibleChars = Math.floor(((t * 18 + idx * 10) % (line.length + 18)));
          ctx.fillStyle = idx === 4 ? "#34d399" : "rgba(16, 185, 129, 0.8)";
          ctx.fillText(line.slice(0, visibleChars), 36, 85 + idx * 46);
        });
      }

      rafId = requestAnimationFrame(drawFrame);
    }

    drawFrame();

    // Canvas를 실제 <video> 스트림으로 연결해 진짜 동영상처럼 자동 재생
    if (typeof canvas.captureStream === "function") {
      const stream = canvas.captureStream(30);
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach((track) => track.stop());
        videoEl.srcObject = null;
      }
    };
  }

  // YouTube URL 판별 및 임베드 URL 변환
  function getYoutubeEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (!match) return null;
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&playsinline=1`;
  }

  // ===== 카운트 및 필터 인디케이터 =====
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
    const offsetLeft = btnRect.left - dockRect.left - 6;
    filterIndicator.style.width = `${btnRect.width}px`;
    filterIndicator.style.transform = `translateX(${offsetLeft}px)`;
  }

  // ===== 프로젝트 카드 렌더링 =====
  function renderProjects() {
    while (cardStreamCleanups.length) {
      const cleanup = cardStreamCleanups.pop();
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
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });

    projectsGrid.innerHTML = "";
    emptyState.hidden = filtered.length > 0;

    filtered.forEach((project) => {
      const card = document.createElement("article");
      card.className = "project-card";
      card.style.setProperty("--accent", project.accentColor || "#00f0ff");
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${project.title} 상세 보기`);

      card.innerHTML = `
        <div class="card-media">
          <video class="card-video" autoplay muted loop playsinline></video>
          <div class="card-media-overlay">
            <div style="display:flex;gap:6px;align-items:center;">
              <span class="category-chip">${escapeHtml(project.categoryLabel || project.category)}</span>
              ${project.featured ? '<span class="featured-pill">★ 추천</span>' : ""}
            </div>
            <span class="expand-hint">미리보기 열기 ↗</span>
          </div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(project.title)}</h3>
          <p class="card-tagline">${escapeHtml(project.tagline)}</p>
          <div class="card-tags">
            ${(project.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      `;

      const videoEl = card.querySelector(".card-video");
      bindProjectVideo(videoEl, project, cardStreamCleanups);

      // 마우스 위치에 따른 글래스 반사광
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });

      card.addEventListener("click", () => openLiquidModal(project, card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLiquidModal(project, card);
        }
      });

      projectsGrid.appendChild(card);
    });
  }

  // ===== 물방울처럼 쫙 켜지는 리퀴드 모달 열기/닫기 =====
  function openLiquidModal(project, sourceCard) {
    lastTriggerCard = sourceCard;

    // 기존 스트림 정리
    if (activeModalStreamCleanup) {
      activeModalStreamCleanup();
      activeModalStreamCleanup = null;
    }

    // 텍스트 & 메타 채우기
    modalCategory.textContent = project.categoryLabel || project.category.toUpperCase();
    modalTitle.textContent = project.title;
    modalTagline.textContent = project.tagline;
    modalDescription.innerHTML = renderSimpleMarkdown(project.description);

    modalTags.innerHTML = project.tags
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

    // 영상 자동 재생 설정
    const ytEmbed = getYoutubeEmbedUrl(project.videoUrl);
    if (project.videoSourceType !== "local" && ytEmbed) {
      modalVideo.hidden = true;
      modalIframe.hidden = false;
      modalIframe.src = ytEmbed;
    } else {
      modalIframe.hidden = true;
      modalIframe.src = "";
      modalVideo.hidden = false;
      modalVideo.removeAttribute("src");
      modalVideo.muted = true;
      updateMuteIcons(true);
      const modalCleanups = [];
      bindProjectVideo(modalVideo, project, modalCleanups);
      activeModalStreamCleanup = () => {
        modalCleanups.forEach((fn) => fn());
      };
    }

    // FLIP 물방울 확장 애니메이션
    document.body.classList.add("modal-open");
    modalBackdrop.classList.add("open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    liquidModal.scrollTop = 0;

    if (sourceCard) {
      const fromRect = sourceCard.getBoundingClientRect();
      const toRect = liquidModal.getBoundingClientRect();

      const dx = fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2);
      const dy = fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2);
      const sx = Math.max(0.2, fromRect.width / toRect.width);
      const sy = Math.max(0.2, fromRect.height / toRect.height);

      liquidModal.animate(
        [
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
            borderRadius: "48px",
            opacity: 0.35,
          },
          {
            transform: "translate3d(0, 0, 0) scale(1.025, 1.025)",
            borderRadius: "36px",
            opacity: 1,
            offset: 0.72,
          },
          {
            transform: "translate3d(0, 0, 0) scale(1, 1)",
            borderRadius: "34px",
            opacity: 1,
          },
        ],
        {
          duration: 540,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }
      );
    }
  }

  function closeLiquidModal() {
    if (!modalBackdrop.classList.contains("open")) return;

    const finishClose = () => {
      modalBackdrop.classList.remove("open");
      modalBackdrop.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      modalIframe.src = "";
      modalVideo.pause();
      if (activeModalStreamCleanup) {
        activeModalStreamCleanup();
        activeModalStreamCleanup = null;
      }
    };

    if (lastTriggerCard && document.body.contains(lastTriggerCard)) {
      const toRect = lastTriggerCard.getBoundingClientRect();
      const fromRect = liquidModal.getBoundingClientRect();
      const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
      const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
      const sx = Math.max(0.18, toRect.width / fromRect.width);
      const sy = Math.max(0.18, toRect.height / fromRect.height);

      modalBackdrop.classList.remove("open");
      const anim = liquidModal.animate(
        [
          {
            transform: "translate3d(0, 0, 0) scale(1, 1)",
            opacity: 1,
          },
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
            borderRadius: "48px",
            opacity: 0,
          },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        }
      );
      anim.onfinish = finishClose;
    } else {
      finishClose();
    }
  }

  function updateMuteIcons(isMuted) {
    iconMuted.hidden = !isMuted;
    iconUnmuted.hidden = isMuted;
  }

  // ===== 이벤트 바인딩 =====
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

  modalCloseBtn.addEventListener("click", closeLiquidModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeLiquidModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLiquidModal();
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

  // 초기화
  initSiteConfig();
  updateCategoryCounts();
  renderProjects();
  requestAnimationFrame(updateFilterIndicator);
})();
