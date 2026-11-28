window.SITE_CONFIG = {
  brandName: "sungomi",
  heroTitle: "앱과 프로그램",
  heroSubtitle: "직접 만든 데스크톱 유틸리티와 웹 게임 모음.",
  creator: {
    name: "sungomi",
    links: [
      { label: "GitHub", url: "https://github.com/sungomi" },
    ],
  },
};

window.PROJECTS = [
  {
    id: "NoopToken",
    title: "NoopToken",
    category: "program",
    categoryLabel: "PROGRAM",
    tagline: "AI 코딩 도구 사용량·한도를 띄워주는 데스크톱 위젯",
    description:
      "Antigravity, Claude, Cursor, ChatGPT의 5시간·주간·월간 사용량을 실시간으로 확인합니다. macOS(.dmg)와 Windows(.exe) 설치 및 자동 업데이트를 지원합니다.",
    tags: ["Python", "macOS", "Windows"],
    accentColor: "#10b981",
    imageUrl: "./images/nooptoken.png",
    videoUrl: "",
    stats: [
      { label: "지원", value: "4대 AI 에이전트" },
      { label: "플랫폼", value: "macOS / Windows" },
      { label: "업데이트", value: "자동 업데이트" },
    ],
    links: [
      { label: "다운로드", url: "https://github.com/sungomi/NoopToken/releases/latest", primary: true },
      { label: "Windows (.exe)", url: "https://github.com/sungomi/NoopToken/releases/latest/download/NoopToken-Windows.exe", primary: false },
      { label: "macOS (.dmg)", url: "https://github.com/sungomi/NoopToken/releases/latest/download/NoopToken-macOS.dmg", primary: false },
      { label: "GitHub", url: "https://github.com/sungomi/NoopToken", primary: false },
    ],
  },
  {
    id: "NoopFlow",
    title: "NoopFlow",
    category: "program",
    categoryLabel: "PROGRAM",
    tagline: "키보드·마우스 하나로 Windows와 Mac을 넘나드는 KVM 앱",
    description:
      "커서를 화면 가장자리로 밀어 옆 PC를 바로 제어합니다. Windows·macOS 간 한/영 전환 동기화, 클립보드 공유, 드래그 파일 전송을 지원합니다.",
    tags: ["Rust", "Windows", "macOS", "KVM"],
    accentColor: "#2563eb",
    imageUrl: "./images/noopflow.png",
    videoUrl: "",
    stats: [
      { label: "유형", value: "소프트웨어 KVM" },
      { label: "기능", value: "한/영·클립보드·파일전송" },
      { label: "플랫폼", value: "Windows / macOS" },
    ],
    links: [
      { label: "다운로드", url: "https://github.com/sungomi/NoopFlow/releases/latest", primary: true },
      { label: "GitHub", url: "https://github.com/sungomi/NoopFlow", primary: false },
    ],
  },
  {
    id: "NooP",
    title: "NooP",
    category: "program",
    categoryLabel: "PROGRAM",
    tagline: "iPhone을 PC/Mac 무선 마우스·키보드·보조 화면으로 쓰는 원격 제어 앱",
    description:
      "Wi-Fi, Bluetooth LE, 외부망 6자리 P2P 코드로 별도 포트포워딩 없이 PC/Mac을 제어합니다. 한글 입력, 단축키, 화면 공유를 지원합니다.",
    tags: ["iOS", "macOS", "Windows", "P2P"],
    accentColor: "#6366f1",
    imageUrl: "./images/noop.png",
    videoUrl: "",
    stats: [
      { label: "유형", value: "무선 입력 · 화면 공유" },
      { label: "연결", value: "Wi-Fi · BLE · P2P" },
      { label: "플랫폼", value: "iOS / macOS / Win" },
    ],
    links: [
      { label: "다운로드", url: "https://github.com/sungomi/NooP/releases/latest", primary: true },
      { label: "GitHub", url: "https://github.com/sungomi/NooP", primary: false },
    ],
  },
  {
    id: "sunbit",
    title: "SUNBIT",
    category: "game",
    categoryLabel: "WEB GAME",
    tagline: "실시간 시세로 겨루는 모바일 웹 투자 게임",
    description:
      "업비트 원화마켓과 미국 주식·원자재 실시간 시세를 연동한 투자 배틀 웹 게임입니다. 현물·선물 거래와 친구 리그 순위 경쟁을 지원합니다.",
    tags: ["JavaScript", "WebSocket", "Firebase"],
    accentColor: "#f59e0b",
    imageUrl: "./images/sunbit.png",
    videoUrl: "",
    stats: [
      { label: "장르", value: "투자 배틀" },
      { label: "시세", value: "업비트 · CNBC" },
      { label: "플랫폼", value: "모바일 / PC 웹" },
    ],
    links: [
      { label: "플레이", url: "https://sungomi.github.io/sunbit/", primary: true },
      { label: "GitHub", url: "https://github.com/sungomi/sunbit", primary: false },
    ],
  },
  {
    id: "skylane",
    title: "Skylane",
    category: "game",
    categoryLabel: "WEB GAME",
    tagline: "드래그로 비행 경로를 그려 착륙시키는 항공 관제 게임",
    description:
      "단일 HTML 파일로 동작하는 항공 관제 웹 게임입니다. 같은 색 활주로로 경로를 그려 착륙시키고 업그레이드로 기록을 갱신합니다.",
    tags: ["Canvas", "Web Audio", "Single File"],
    accentColor: "#0ea5e9",
    imageUrl: "./images/skylane.png",
    videoUrl: "",
    stats: [
      { label: "장르", value: "항공 관제" },
      { label: "조작", value: "마우스 / 터치" },
      { label: "플랫폼", value: "웹 브라우저" },
    ],
    links: [
      { label: "플레이", url: "https://sungomi.github.io/skylane/", primary: true },
      { label: "GitHub", url: "https://github.com/sungomi/skylane", primary: false },
    ],
  },
  {
    id: "tft-fates",
    title: "TFT 시즌 4: 운명",
    category: "game",
    categoryLabel: "WEB GAME",
    tagline: "브라우저에서 바로 플레이하는 롤토체스 시즌 4 시뮬레이터",
    description:
      "HTML5 Canvas와 Web Audio로 구현한 전략 오토배틀러입니다. 선택받은 자, 광신도·달빛 시너지와 5코스트 스킬을 지원합니다.",
    tags: ["JavaScript", "Canvas", "Web Audio"],
    accentColor: "#d97706",
    imageUrl: "./images/tft-fates.png",
    videoUrl: "",
    stats: [
      { label: "장르", value: "오토배틀러" },
      { label: "시스템", value: "선택받은 자 · 4성" },
      { label: "플랫폼", value: "웹 브라우저" },
    ],
    links: [
      { label: "플레이", url: "https://sungomi.github.io/tft-fates/", primary: true },
      { label: "GitHub", url: "https://github.com/sungomi/tft-fates", primary: false },
    ],
  },
  {
    id: "kwangwoon-winter-survival",
    title: "광운대 겨울 서바이벌",
    category: "game",
    categoryLabel: "WEB GAME",
    tagline: "광운대 캠퍼스 지형 기반 3D 웹 배틀로얄",
    description:
      "실제 광운대 지형 위에서 눈사람을 잡아 장비를 얻고 자기장을 피해 생존하는 3D 웹 서바이벌 게임입니다.",
    tags: ["JavaScript", "Vite", "Node.js"],
    accentColor: "#3b82f6",
    imageUrl: "./images/kwangwoon-winter-survival.png",
    videoUrl: "",
    stats: [
      { label: "장르", value: "3D 서바이벌" },
      { label: "스택", value: "Vite · Node.js" },
      { label: "플랫폼", value: "웹 브라우저" },
    ],
    links: [
      { label: "GitHub", url: "https://github.com/sungomi/kwangwoon-winter-survival", primary: true },
    ],
  },
  {
    id: "menhera-chat-game",
    title: "HARIN.exe",
    category: "game",
    categoryLabel: "VISUAL NOVEL",
    tagline: "채팅 기반 한국어 비주얼 노벨 웹 게임",
    description:
      "5명의 캐릭터, 50종 표정 스프라이트, 17종 서울 배경을 수록한 스마트폰 채팅형 연애 시뮬레이션입니다. 로컬 엔진과 OpenAI 호환 API를 지원합니다.",
    tags: ["ESM", "Visual Novel", "Chat Sim"],
    accentColor: "#ec4899",
    imageUrl: "./images/harin.jpg",
    videoUrl: "",
    stats: [
      { label: "장르", value: "비주얼 노벨" },
      { label: "구성", value: "캐릭터 5명 · 50종 표정" },
      { label: "실행", value: "로컬 웹 서버" },
    ],
    links: [
      { label: "GitHub", url: "https://github.com/sungomi/menhera-chat-game", primary: true },
    ],
  },
];
