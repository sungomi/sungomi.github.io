/**
 * sungomi's 게임 & 프로그램 쇼케이스 데이터
 * ---------------------------------------------------------
 * - videoUrl: 실제 동영상 경로(예: "./videos/sunbit.mp4") 또는 YouTube URL을 넣으면
 *             카드와 모달에서 자동 재생됩니다. 비워두면 내장 프리뷰가 재생됩니다.
 */
window.SITE_CONFIG = {
  brandName: "SUNGOMI.ARC",
  heroBadge: "SUNGOMI · INDIE GAMES & TOOLS",
  heroTitle: "직접 만든 게임과<br />유용한 프로그램들",
  heroSubtitle:
    "GitHub에 공개된 인디 웹 게임과 데스크톱 유틸리티들을 한곳에 모았습니다. 카드를 눌러 프리뷰와 바로 실행·다운로드 링크를 확인해보세요.",
  creator: {
    name: "sungomi",
    bio: "게임과 데스크톱 유틸리티를 만듭니다.",
    links: [
      { label: "GitHub", url: "https://github.com/sungomi" },
      { label: "SUNBIT 플레이", url: "https://sungomi.github.io/sunbit/" },
      { label: "Skylane 플레이", url: "https://sungomi.github.io/skylane/" },
    ],
  },
};

window.PROJECTS = [
  {
    id: "sunbit",
    title: "썬빗 (SUNBIT)",
    category: "game",
    categoryLabel: "WEB GAME",
    tagline: "친구들끼리 총자산으로 겨루는 실시간 모바일 가상 주식·코인 게임",
    description:
      "업비트 원화마켓 실시간 시세(웹소켓)와 미국 주식 99종목·원자재 시세를 연동한 모바일 웹 투자 배틀 게임입니다. 현물·선물 롱/숏(최대 100배), 서울 25개 구채 투자, 친구 수익 약탈 & 마진 사냥까지 즐길 수 있습니다.",
    tags: ["JavaScript", "WebSocket", "Firebase", "모바일 웹게임"],
    accentColor: "#00f0ff",
    videoUrl: "",
    demoPreset: "cyber",
    stats: [
      { label: "장르", value: "실시간 투자 배틀" },
      { label: "시세 연동", value: "업비트 · CNBC" },
      { label: "플랫폼", value: "모바일 / PC 웹" },
    ],
    links: [
      { label: "지금 바로 플레이", url: "https://sungomi.github.io/sunbit/", primary: true },
      { label: "GitHub 저장소", url: "https://github.com/sungomi/sunbit", primary: false },
    ],
  },
  {
    id: "skylane",
    title: "Skylane",
    category: "game",
    categoryLabel: "WEB GAME",
    tagline: "드래그로 비행 경로를 그려 착륙시키는 미니멀 항공 관제 게임",
    description:
      "빌드도, 외부 의존성도 없이 단 하나의 HTML 파일로 동작하는 미니멀 항공 관제 게임입니다. 비행기에서 선을 그어 같은 색 활주로에 안전하게 유도하고, 새 활주로·연료 보급·감속 업그레이드를 선택해 최고 기록에 도전하세요.",
    tags: ["HTML5 Canvas", "Web Audio", "Single File", "아케이드"],
    accentColor: "#38bdf8",
    videoUrl: "",
    demoPreset: "physics",
    stats: [
      { label: "장르", value: "항공 관제 퍼즐" },
      { label: "조작", value: "마우스 / 터치" },
      { label: "플랫폼", value: "All Browsers" },
    ],
    links: [
      { label: "웹에서 바로 플레이", url: "https://sungomi.github.io/skylane/", primary: true },
      { label: "GitHub 저장소", url: "https://github.com/sungomi/skylane", primary: false },
    ],
  },
  {
    id: "tft-fates",
    title: "TFT 시즌 4: 운명 시뮬레이터",
    category: "game",
    categoryLabel: "WEB GAME",
    tagline: "선택받은 자·시너지·자체 합성 사운드를 구현한 롤토체스 시즌 4 웹 게임",
    description:
      "순수 JavaScript와 HTML5 Canvas, Web Audio API로 구현한 전략 오토배틀러 시뮬레이터입니다. 황금빛 '선택받은 자' 시스템, 광신도 마왕 갈리오, 달빛 4성, 5코스트 고유 스킬까지 브라우저에서 바로 즐길 수 있습니다.",
    tags: ["JavaScript", "Canvas", "Web Audio", "오토배틀러"],
    accentColor: "#f59e0b",
    videoUrl: "",
    demoPreset: "arcade",
    stats: [
      { label: "장르", value: "전략 오토배틀러" },
      { label: "특징", value: "선택받은 자 · 4성" },
      { label: "플랫폼", value: "All Browsers" },
    ],
    links: [
      { label: "온라인 바로 플레이", url: "https://sungomi.github.io/tft-fates/", primary: true },
      { label: "GitHub 저장소", url: "https://github.com/sungomi/tft-fates", primary: false },
    ],
  },
  {
    id: "menhera-chat-game",
    title: "HARIN.exe",
    category: "game",
    categoryLabel: "VISUAL NOVEL",
    tagline: "5명의 히로인과 50종 표정 스프라이트로 즐기는 멘헤라 채팅 연애 시뮬레이션",
    description:
      "한국어 멘헤라 컨셉의 비주얼 노벨 & 스마트폰 채팅 연애 시뮬레이션 웹 게임입니다. 5명의 개성 있는 히로인, 50종의 착장·표정 스프라이트, 17종의 서울 배경과 함께 로컬 엔진 및 OpenAI 호환 API 대화 모드를 지원합니다.",
    tags: ["ESM", "Swift", "Visual Novel", "Chat Sim"],
    accentColor: "#ff2e93",
    videoUrl: "",
    demoPreset: "shader",
    stats: [
      { label: "장르", value: "비주얼 노벨 / 채팅" },
      { label: "콘텐츠", value: "히로인 5명 · 50종 표정" },
      { label: "실행", value: "로컬 웹 서버" },
    ],
    links: [
      { label: "GitHub 저장소 보기", url: "https://github.com/sungomi/menhera-chat-game", primary: true },
    ],
  },
  {
    id: "NoopToken",
    title: "NoopToken",
    category: "program",
    categoryLabel: "PROGRAM",
    tagline: "Antigravity · Claude · Cursor · ChatGPT 공식 한도를 띄워주는 플로팅 위젯",
    description:
      "4대 AI 코딩 에이전트의 공식 사용량(5시간 한도, 주간 한도, 월간 요청량)을 바탕화면 플로팅 위젯에서 실시간으로 확인하는 데스크톱 프로그램입니다. 파이썬 설치 없이 macOS(.dmg)와 Windows(.exe) 설치 파일로 바로 실행하고 자동 업데이트까지 지원합니다.",
    tags: ["Python", "macOS", "Windows", "데스크톱 위젯"],
    accentColor: "#10b981",
    videoUrl: "",
    demoPreset: "terminal",
    stats: [
      { label: "지원 AI", value: "4대 코딩 에이전트" },
      { label: "플랫폼", value: "macOS / Windows" },
      { label: "기능", value: "원클릭 자동 업데이트" },
    ],
    links: [
      { label: "최신 릴리즈 다운로드", url: "https://github.com/sungomi/NoopToken/releases/latest", primary: true },
      { label: "Windows (.exe)", url: "https://github.com/sungomi/NoopToken/releases/latest/download/NoopToken-Windows.exe", primary: false },
      { label: "macOS (.dmg)", url: "https://github.com/sungomi/NoopToken/releases/latest/download/NoopToken-macOS.dmg", primary: false },
      { label: "GitHub 저장소", url: "https://github.com/sungomi/NoopToken", primary: false },
    ],
  },
  {
    id: "NoopFlow",
    title: "NoopFlow",
    category: "program",
    categoryLabel: "PROGRAM",
    tagline: "키보드·마우스 하나로 Windows와 Mac을 넘나드는 크로스 PC 제어 앱",
    description:
      "커서를 화면 가장자리 너머로 밀면 옆 컴퓨터로 자연스럽게 넘어가는 NooP 패밀리 앱입니다. Windows와 Mac 간 한/영 전환 동기화, 클립보드 공유, 파일 전송까지 하나의 키보드와 마우스로 간편하게 사용할 수 있습니다.",
    tags: ["Rust", "Windows", "macOS", "KVM"],
    accentColor: "#06b6d4",
    videoUrl: "",
    demoPreset: "shader",
    stats: [
      { label: "유형", value: "소프트웨어 KVM" },
      { label: "핵심 기능", value: "한/영·클립보드·파일전송" },
      { label: "플랫폼", value: "Windows / macOS" },
    ],
    links: [
      { label: "최신 릴리즈 다운로드", url: "https://github.com/sungomi/NoopFlow/releases/latest", primary: true },
      { label: "GitHub 저장소", url: "https://github.com/sungomi/NoopFlow", primary: false },
    ],
  },
  {
    id: "kwangwoon-winter-survival",
    title: "Kwangwoon Winter Survival",
    category: "game",
    categoryLabel: "WEB GAME",
    tagline: "겨울 캠퍼스에서 살아남는 멀티플레이어 웹 서바이벌 게임",
    description:
      "Vite와 Node.js 서버 기반으로 제작된 JavaScript 웹 서바이벌 게임입니다. 추운 겨울 배경 속에서 자원을 관리하고 생존에 도전하세요.",
    tags: ["JavaScript", "Vite", "Node.js", "서바이벌"],
    accentColor: "#60a5fa",
    videoUrl: "",
    demoPreset: "physics",
    stats: [
      { label: "장르", value: "웹 서바이벌" },
      { label: "스택", value: "Vite · Node.js" },
      { label: "플랫폼", value: "Web Browser" },
    ],
    links: [
      { label: "GitHub 저장소 보기", url: "https://github.com/sungomi/kwangwoon-winter-survival", primary: true },
    ],
  },
  {
    id: "NooP",
    title: "NooP",
    category: "program",
    categoryLabel: "PROGRAM",
    tagline: "iPhone을 무선 마우스 · 키보드 · 원격 미니 모니터로 쓰는 경량 원격 제어 앱",
    description:
      "같은 Wi-Fi(Bonjour)와 Bluetooth LE는 물론, 외부 LTE/5G에서도 별도 VPN이나 포트포워딩 없이 6자리 원격 코드(STUN + UDP P2P 홀펀칭)로 PC/Mac을 제어할 수 있습니다. 한글 두벌식·단축키·Retina 화면 공유까지 지원합니다.",
    tags: ["iPhone", "macOS", "Windows", "P2P 원격 제어"],
    accentColor: "#a855f7",
    videoUrl: "",
    demoPreset: "audio",
    stats: [
      { label: "유형", value: "무선 입력 · 원격 화면" },
      { label: "연결", value: "Wi-Fi · BLE · 6자리 P2P" },
      { label: "플랫폼", value: "iOS / macOS / Win" },
    ],
    links: [
      { label: "최신 릴리즈 다운로드 (v1.1)", url: "https://github.com/sungomi/NooP/releases/latest", primary: true },
      { label: "GitHub 저장소", url: "https://github.com/sungomi/NooP", primary: false },
    ],
  },
];
