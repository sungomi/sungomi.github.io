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

  // HEX 색상을 RGB로 변환 (라이트 톤 프리뷰 틴트용)
  function hexToRgb(hex) {
    const clean = String(hex || "#2563eb").replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const num = parseInt(full, 16);
    if (Number.isNaN(num)) return { r: 37, g: 99, b: 235 };
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
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
    const cleanup = attachProceduralVideo(videoEl, project);
    cleanups.push(cleanup);
    return false;
  }

  // ===== 깔끔한 화이트 톤 앱/프로그램 UI 목업 프리뷰 생성기 =====
  function attachProceduralVideo(videoEl, project) {
    const preset = project.demoPreset || "cyber";
    const accentColor = project.accentColor || "#2563eb";
    const rgb = hexToRgb(accentColor);
    const rgba = (a) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
    const title = project.title || "App Preview";

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    let rafId = 0;
    let t = Math.random() * 20;

    function drawWindowChrome(x, y, w, h, label) {
      ctx.save();
      ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.stroke();

      // 상단 바
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, w - 2, 34, [15, 15, 0, 0]);
      ctx.fill();

      ctx.strokeStyle = "rgba(15, 23, 42, 0.06)";
      ctx.beginPath();
      ctx.moveTo(x, y + 35);
      ctx.lineTo(x + w, y + 35);
      ctx.stroke();

      // macOS 신호등 버튼
      const dots = ["#f87171", "#fbbf24", "#4ade80"];
      dots.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x + 18 + i * 13, y + 18, 4.2, 0, Math.PI * 2);
        ctx.fill();
      });

      if (label) {
        ctx.fillStyle = "#64748b";
        ctx.font = "600 11px Pretendard, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, x + w / 2, y + 22);
        ctx.textAlign = "left";
      }
    }

    function drawFrame() {
      t += 0.024;
      const w = canvas.width;
      const h = canvas.height;

      // 깔끔한 화이트 + 은은한 포인트 틴트 배경
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#ffffff");
      bgGrad.addColorStop(0.55, "#f8fafc");
      bgGrad.addColorStop(1, rgba(0.08));
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 은은한 도트 그리드
      ctx.fillStyle = "rgba(15, 23, 42, 0.055)";
      for (let gx = 24; gx < w; gx += 28) {
        for (let gy = 24; gy < h; gy += 28) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (preset === "cyber") {
        // 실시간 차트 & 대시보드 앱 UI 프리뷰
        drawWindowChrome(68, 56, 504, 294, title);

        // 상단 KPI 칩 3개
        for (let i = 0; i < 3; i++) {
          const cx = 90 + i * 156;
          ctx.fillStyle = i === 0 ? rgba(0.08) : "#f8fafc";
          ctx.beginPath();
          ctx.roundRect(cx, 108, 142, 46, 10);
          ctx.fill();
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(cx + 12, 120, 48, 6);
          ctx.fillStyle = i === 0 ? accentColor : "#0f172a";
          ctx.fillRect(cx + 12, 134, 78 + Math.sin(t + i) * 10, 9);
        }

        // 실시간 꺾은선 그래프
        ctx.save();
        ctx.beginPath();
        const chartX = 96;
        const chartY = 290;
        const chartW = 448;
        for (let i = 0; i <= 28; i++) {
          const px = chartX + (i / 28) * chartW;
          const py =
            238 -
            Math.sin(i * 0.35 + t * 1.6) * 28 -
            Math.cos(i * 0.18 - t) * 16 -
            (i / 28) * 18;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.lineTo(chartX + chartW, chartY + 34);
        ctx.lineTo(chartX, chartY + 34);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, 170, 0, 324);
        areaGrad.addColorStop(0, rgba(0.2));
        areaGrad.addColorStop(1, rgba(0.0));
        ctx.fillStyle = areaGrad;
        ctx.fill();
        ctx.restore();
      } else if (preset === "terminal") {
        // 데스크톱 플로팅 위젯 & 사용량 미터 UI 프리뷰 (NoopToken 등)
        drawWindowChrome(96, 62, 448, 282, title);

        const bars = [
          { label: "Claude", pct: 0.42 + Math.sin(t * 0.9) * 0.08, col: "#f97316" },
          { label: "Cursor", pct: 0.68 + Math.cos(t * 0.8) * 0.06, col: "#2563eb" },
          { label: "Antigravity", pct: 0.34 + Math.sin(t * 1.1 + 1) * 0.09, col: "#10b981" },
          { label: "ChatGPT", pct: 0.55 + Math.cos(t * 0.7 + 2) * 0.07, col: "#6366f1" },
        ];

        bars.forEach((b, idx) => {
          const y = 122 + idx * 50;
          ctx.fillStyle = "#334155";
          ctx.font = "600 13px Pretendard, -apple-system, sans-serif";
          ctx.fillText(b.label, 122, y + 4);

          ctx.fillStyle = "#64748b";
          ctx.font = "600 12px Pretendard, -apple-system, sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`${Math.round(b.pct * 100)}%`, 518, y + 4);
          ctx.textAlign = "left";

          ctx.fillStyle = "#f1f5f9";
          ctx.beginPath();
          ctx.roundRect(122, y + 14, 396, 12, 6);
          ctx.fill();

          ctx.fillStyle = b.col;
          ctx.beginPath();
          ctx.roundRect(122, y + 14, 396 * b.pct, 12, 6);
          ctx.fill();
        });
      } else if (preset === "physics") {
        // 경로 & 인터랙티브 캔버스 프리뷰 (Skylane 등)
        drawWindowChrome(72, 56, 496, 294, title);

        const cx = w / 2;
        const cy = 224;
        // 부드러운 경로 곡선
        ctx.strokeStyle = rgba(0.28);
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 155, 68, -0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 활주로 / 목적지 노드
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(cx - 28, cy - 8, 56, 16, 8);
        ctx.fill();

        // 이동 객체들
        for (let i = 0; i < 4; i++) {
          const ang = t * 0.9 + (i * Math.PI) / 2;
          const px = cx + Math.cos(ang) * 155;
          const py = cy + Math.sin(ang) * 68;
          ctx.fillStyle = i % 2 === 0 ? accentColor : "#0f172a";
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = rgba(0.18);
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (preset === "audio") {
        // 모바일/원격 컨트롤 & 웨이브 UI 프리뷰 (NooP 등)
        drawWindowChrome(76, 62, 310, 276, "Desktop");

        // 우측 iPhone 목업
        ctx.save();
        ctx.shadowColor = "rgba(15, 23, 42, 0.1)";
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(422, 74, 142, 264, 24);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(422, 74, 142, 264, 24);
        ctx.stroke();

        // 연결 파형
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 104; x <= 356; x += 6) {
          const y = 212 + Math.sin(x * 0.04 + t * 2.8) * 26 * Math.sin((x - 104) / 252 * Math.PI);
          if (x === 104) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 트랙패드 커서
        const mx = 493 + Math.cos(t * 1.4) * 32;
        const my = 186 + Math.sin(t * 1.8) * 36;
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.roundRect(438, 108, 110, 146, 14);
        ctx.fill();
        ctx.fillStyle = rgba(0.2);
        ctx.beginPath();
        ctx.arc(mx, my, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(mx, my, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (preset === "shader") {
        // 크로스 디바이스 / 부드러운 카드 인터페이스 프리뷰
        drawWindowChrome(66, 70, 238, 256, "macOS");
        drawWindowChrome(336, 70, 238, 256, "Windows");

        // 두 화면 사이를 오가는 커서 & 전송 펄스
        const progress = (Math.sin(t * 1.2) + 1) / 2;
        const cx = 135 + progress * 370;
        const cy = 205 + Math.sin(progress * Math.PI) * -18;

        ctx.strokeStyle = rgba(0.25);
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(135, 205);
        ctx.quadraticCurveTo(320, 165, 505, 205);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = rgba(0.18);
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 전략 / 보드 게임 라이트 프리뷰 (arcade 등)
        drawWindowChrome(76, 56, 488, 294, title);

        const cols = 6;
        const rows = 3;
        const startX = 118;
        const startY = 120;
        const cellW = 64;
        const cellH = 56;
        const activeIdx = Math.floor(t * 1.4) % (cols * rows);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const x = startX + c * (cellW + 8);
            const y = startY + r * (cellH + 10);
            const isActive = idx === activeIdx || idx === (activeIdx + 7) % (cols * rows);
            ctx.fillStyle = isActive ? rgba(0.16) : "#f8fafc";
            ctx.strokeStyle = isActive ? accentColor : "rgba(15, 23, 42, 0.08)";
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect(x, y, cellW, cellH, 10);
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(drawFrame);
    }

    drawFrame();

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
    const offsetLeft = btnRect.left - dockRect.left - 4;
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
      const primaryLink = (project.links || []).find((l) => l.primary) || (project.links || [])[0];
      const ctaText = primaryLink ? "자세히 보기 →" : "상세 보기 →";

      card.innerHTML = `
        <div class="card-media">
          <video class="card-video" autoplay muted loop playsinline></video>
          <div class="card-media-overlay">
            <div class="card-badges-left">
              <span class="category-chip">${escapeHtml(project.categoryLabel || project.category)}</span>
              ${project.featured ? '<span class="featured-pill">★ 추천</span>' : ""}
            </div>
            <span class="expand-hint">상세 보기 ↗</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">${escapeHtml(project.title)}</h3>
          </div>
          <p class="card-tagline">${escapeHtml(project.tagline)}</p>
          <div class="card-tags">
            ${(project.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="card-footer">
            <span class="card-platform">${escapeHtml(platformText)}</span>
            <span class="card-cta-label">${ctaText}</span>
          </div>
        </div>
      `;

      const videoEl = card.querySelector(".card-video");
      bindProjectVideo(videoEl, project, cardStreamCleanups);

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

  // ===== 상세 모달 열기/닫기 =====
  function openLiquidModal(project, sourceCard) {
    lastTriggerCard = sourceCard;

    if (activeModalStreamCleanup) {
      activeModalStreamCleanup();
      activeModalStreamCleanup = null;
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

    document.body.classList.add("modal-open");
    modalBackdrop.classList.add("open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    liquidModal.scrollTop = 0;

    liquidModal.animate(
      [
        { transform: "translateY(14px) scale(0.97)", opacity: 0 },
        { transform: "translateY(0) scale(1)", opacity: 1 },
      ],
      {
        duration: 280,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      }
    );
  }

  function closeLiquidModal() {
    if (!modalBackdrop.classList.contains("open")) return;

    modalBackdrop.classList.remove("open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modalIframe.src = "";
    modalVideo.pause();
    if (activeModalStreamCleanup) {
      activeModalStreamCleanup();
      activeModalStreamCleanup = null;
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
