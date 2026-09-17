export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'pipe' | 'brick' | 'question';
  hit?: boolean;
  hasMushroom?: boolean;
}

export interface MushroomItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  collected: boolean;
}

export interface Goomba {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  alive: boolean;
  squishedTimer: number;
}

export interface Coin {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  animOffset: number;
}

export interface BonusQuiz {
  id: string;
  category: '수학' | '과학' | '상식' | '게임';
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  bonusScore: number;
  bonusCoins: number;
}

export interface MarioStage {
  id: number;
  stageCode: string; // e.g. "STAGE 1"
  name: string;
  subName: string;
  badgeEmoji: string;
  icon?: string;
  difficulty: '쉬움' | '보통' | '어려움';
  description: string;
  worldWidth: number;
  goalX: number;
  groundY: number;
  themeType: 'grass' | 'cave' | 'castle' | 'sky' | 'ice';
  skyColors: [string, string, string];
  groundGrassColor: string;
  groundBodyColor: string;
  pipeColor: string;
  pipeLipColor: string;
  brickColor: string;
  goombaColor: string;
  lavaPit?: boolean;
  platforms: Platform[];
  goombas: Goomba[];
  coins: Coin[];
  quizzes: BonusQuiz[];
}

export const STAGE_DATA: MarioStage[] = [
  // ==========================================
  // STAGE 1: 버섯 초원 (Mushroom Plains)
  // ==========================================
  {
    id: 1,
    stageCode: 'STAGE 1',
    name: '버섯 초원',
    subName: 'World 1-1',
    badgeEmoji: '🍄',
    icon: '🍄',
    difficulty: '쉬움',
    description: '푸른 하늘과 푸른 언덕! 정통 슈퍼마리오 스타일의 초원 맵',
    worldWidth: 3800,
    goalX: 3500,
    groundY: 320,
    themeType: 'grass',
    skyColors: ['#5c94fc', '#83b1ff', '#a8caff'],
    groundGrassColor: '#70c000',
    groundBodyColor: '#c84c0c',
    pipeColor: '#00a800',
    pipeLipColor: '#00c800',
    brickColor: '#b84418',
    goombaColor: '#a84000',
    platforms: [
      // Ground stretches with pits
      { x: 0, y: 320, width: 850, height: 80, type: 'ground' },
      { x: 970, y: 320, width: 900, height: 80, type: 'ground' }, // pit 850~970
      { x: 1980, y: 320, width: 1100, height: 80, type: 'ground' }, // pit 1870~1980
      { x: 3180, y: 320, width: 700, height: 80, type: 'ground' },

      // Pipes
      { x: 380, y: 320 - 45, width: 44, height: 45, type: 'pipe' },
      { x: 650, y: 320 - 65, width: 44, height: 65, type: 'pipe' },
      { x: 1320, y: 320 - 55, width: 44, height: 55, type: 'pipe' },
      { x: 2320, y: 320 - 70, width: 44, height: 70, type: 'pipe' },
      { x: 2780, y: 320 - 55, width: 44, height: 55, type: 'pipe' },

      // Floating blocks
      { x: 250, y: 320 - 95, width: 32, height: 24, type: 'question', hasMushroom: true },
      { x: 282, y: 320 - 95, width: 32, height: 24, type: 'brick' },
      { x: 314, y: 320 - 95, width: 32, height: 24, type: 'question' },

      { x: 740, y: 320 - 100, width: 32, height: 24, type: 'question' },
      { x: 772, y: 320 - 100, width: 96, height: 24, type: 'brick' },
      { x: 804, y: 320 - 170, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 1450, y: 320 - 105, width: 32, height: 24, type: 'question' },
      { x: 1482, y: 320 - 105, width: 32, height: 24, type: 'brick' },
      { x: 1514, y: 320 - 105, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 2050, y: 320 - 90, width: 128, height: 24, type: 'brick' },
      { x: 2114, y: 320 - 160, width: 32, height: 24, type: 'question' },

      // Castle at goal
      { x: 3550, y: 320 - 140, width: 130, height: 140, type: 'brick' },
    ],
    goombas: [
      { x: 480, y: 320 - 26, width: 26, height: 26, vx: -1.2, alive: true, squishedTimer: 0 },
      { x: 580, y: 320 - 26, width: 26, height: 26, vx: -1.2, alive: true, squishedTimer: 0 },
      { x: 1120, y: 320 - 26, width: 26, height: 26, vx: -1.3, alive: true, squishedTimer: 0 },
      { x: 1200, y: 320 - 26, width: 26, height: 26, vx: -1.3, alive: true, squishedTimer: 0 },
      { x: 1650, y: 320 - 26, width: 26, height: 26, vx: -1.4, alive: true, squishedTimer: 0 },
      { x: 2460, y: 320 - 26, width: 26, height: 26, vx: -1.5, alive: true, squishedTimer: 0 },
      { x: 2620, y: 320 - 26, width: 26, height: 26, vx: -1.5, alive: true, squishedTimer: 0 },
      { x: 3000, y: 320 - 26, width: 26, height: 26, vx: -1.6, alive: true, squishedTimer: 0 },
    ],
    coins: [
      { x: 266, y: 320 - 135, radius: 10, collected: false, animOffset: 0 },
      { x: 330, y: 320 - 135, radius: 10, collected: false, animOffset: 0.3 },
      { x: 756, y: 320 - 140, radius: 10, collected: false, animOffset: 0.6 },
      { x: 820, y: 320 - 210, radius: 10, collected: false, animOffset: 0.9 },
      { x: 1466, y: 320 - 145, radius: 10, collected: false, animOffset: 0.2 },
      { x: 1530, y: 320 - 145, radius: 10, collected: false, animOffset: 0.5 },
      { x: 2130, y: 320 - 200, radius: 10, collected: false, animOffset: 0.8 },
      // Arcs
      ...[0, 1, 2, 3, 4].map((i) => ({
        x: 520 + i * 24,
        y: 320 - 45 - Math.sin((i / 4) * Math.PI) * 35,
        radius: 9,
        collected: false,
        animOffset: i * 0.2,
      })),
      ...[0, 1, 2, 3, 4].map((i) => ({
        x: 1720 + i * 24,
        y: 320 - 45 - Math.sin((i / 4) * Math.PI) * 35,
        radius: 9,
        collected: false,
        animOffset: i * 0.2,
      })),
    ],
    quizzes: [
      {
        id: 'q1_math_1',
        category: '수학',
        question: 'Q. 12를 소인수분해한 올바른 결과는 무엇일까요?',
        options: ['2² × 3', '2 × 3²', '2³ × 3', '3 × 4'],
        answerIndex: 0,
        explanation: '12 = 4 × 3 = 2² × 3 으로 소수의 곱으로만 나타냅니다!',
        bonusScore: 2000,
        bonusCoins: 5,
      },
      {
        id: 'q1_math_2',
        category: '수학',
        question: 'Q. (-3) × (-4)의 계산 값은 얼마일까요?',
        options: ['-12', '12', '-7', '7'],
        answerIndex: 1,
        explanation: '음수 × 음수는 항상 양수가 되므로 (+12)입니다!',
        bonusScore: 2000,
        bonusCoins: 5,
      },
      {
        id: 'q1_game_1',
        category: '게임',
        question: 'Q. 슈퍼마리오의 상징적인 초록색 멜빵 옷을 입은 동생의 이름은?',
        options: ['와리오', '피치공주', '루이지', '키노피오'],
        answerIndex: 2,
        explanation: '마리오의 쌍둥이 동생은 루이지(Luigi)입니다!',
        bonusScore: 2000,
        bonusCoins: 5,
      },
    ],
  },

  // ==========================================
  // STAGE 2: 지하 동굴 (Underground Cavern)
  // ==========================================
  {
    id: 2,
    stageCode: 'STAGE 2',
    name: '지하 동굴',
    subName: 'World 1-2',
    badgeEmoji: '🦇',
    icon: '🦇',
    difficulty: '보통',
    description: '신비로운 푸른 빛의 지하 던전! 2층 계단 발판과 스릴 넘치는 점프 코스',
    worldWidth: 4000,
    goalX: 3700,
    groundY: 320,
    themeType: 'cave',
    skyColors: ['#080e1a', '#0f172a', '#1e293b'],
    groundGrassColor: '#0ea5e9',
    groundBodyColor: '#0f172a',
    pipeColor: '#0891b2',
    pipeLipColor: '#06b6d4',
    brickColor: '#334155',
    goombaColor: '#2563eb', // Blue underground Goombas!
    platforms: [
      // Ground with multiple daring chasms
      { x: 0, y: 320, width: 700, height: 80, type: 'ground' },
      { x: 800, y: 320, width: 650, height: 80, type: 'ground' },
      { x: 1550, y: 320, width: 800, height: 80, type: 'ground' },
      { x: 2450, y: 320, width: 500, height: 80, type: 'ground' },
      { x: 3050, y: 320, width: 950, height: 80, type: 'ground' },

      // High Suspended Bridges & Blocks (Double Decker)
      { x: 300, y: 220, width: 160, height: 20, type: 'brick' },
      { x: 360, y: 220, width: 32, height: 20, type: 'question', hasMushroom: true },
      { x: 550, y: 170, width: 96, height: 20, type: 'brick' },

      // Pipes
      { x: 480, y: 320 - 50, width: 44, height: 50, type: 'pipe' },
      { x: 1050, y: 320 - 65, width: 44, height: 65, type: 'pipe' },
      { x: 1850, y: 320 - 75, width: 44, height: 75, type: 'pipe' },
      { x: 2700, y: 320 - 60, width: 44, height: 60, type: 'pipe' },

      // Floating Steps over chasms
      { x: 710, y: 250, width: 64, height: 20, type: 'brick' },
      { x: 1470, y: 240, width: 60, height: 20, type: 'brick' },
      { x: 2365, y: 250, width: 70, height: 20, type: 'brick' },
      { x: 2970, y: 240, width: 60, height: 20, type: 'brick' },

      // Ceiling and mid-air Question blocks
      { x: 1180, y: 210, width: 32, height: 24, type: 'question' },
      { x: 1212, y: 210, width: 64, height: 24, type: 'brick' },
      { x: 1276, y: 210, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 2000, y: 190, width: 128, height: 22, type: 'brick' },
      { x: 2048, y: 130, width: 32, height: 24, type: 'question', hasMushroom: true },

      // End Fortress
      { x: 3750, y: 320 - 140, width: 130, height: 140, type: 'brick' },
    ],
    goombas: [
      { x: 420, y: 320 - 26, width: 26, height: 26, vx: -1.4, alive: true, squishedTimer: 0 },
      { x: 920, y: 320 - 26, width: 26, height: 26, vx: -1.5, alive: true, squishedTimer: 0 },
      { x: 1250, y: 320 - 26, width: 26, height: 26, vx: -1.5, alive: true, squishedTimer: 0 },
      { x: 1650, y: 320 - 26, width: 26, height: 26, vx: -1.6, alive: true, squishedTimer: 0 },
      { x: 2020, y: 190 - 26, width: 26, height: 26, vx: -1.2, alive: true, squishedTimer: 0 }, // on bridge!
      { x: 2550, y: 320 - 26, width: 26, height: 26, vx: -1.7, alive: true, squishedTimer: 0 },
      { x: 3250, y: 320 - 26, width: 26, height: 26, vx: -1.8, alive: true, squishedTimer: 0 },
      { x: 3450, y: 320 - 26, width: 26, height: 26, vx: -1.8, alive: true, squishedTimer: 0 },
    ],
    coins: [
      // Suspended coins
      { x: 380, y: 180, radius: 10, collected: false, animOffset: 0.1 },
      { x: 590, y: 130, radius: 10, collected: false, animOffset: 0.4 },
      { x: 740, y: 210, radius: 10, collected: false, animOffset: 0.7 },
      { x: 1490, y: 200, radius: 10, collected: false, animOffset: 0.3 },
      { x: 2064, y: 90, radius: 10, collected: false, animOffset: 0.5 },
      { x: 2395, y: 210, radius: 10, collected: false, animOffset: 0.8 },
      // Bottom coin lines
      ...[0, 1, 2, 3, 4, 5].map((i) => ({
        x: 880 + i * 26,
        y: 280,
        radius: 9,
        collected: false,
        animOffset: i * 0.15,
      })),
      ...[0, 1, 2, 3, 4].map((i) => ({
        x: 1700 + i * 26,
        y: 280,
        radius: 9,
        collected: false,
        animOffset: i * 0.15,
      })),
    ],
    quizzes: [
      {
        id: 'q2_math_1',
        category: '수학',
        question: 'Q. 일차방정식 3x - 5 = 10 에서 x의 값은?',
        options: ['3', '5', '7', '15'],
        answerIndex: 1,
        explanation: '3x = 15 이므로 양변을 3으로 나누면 x = 5 입니다!',
        bonusScore: 2500,
        bonusCoins: 6,
      },
      {
        id: 'q2_sci_1',
        category: '과학',
        question: 'Q. 물의 화학 분자식으로 옳은 것은 무엇일까요?',
        options: ['CO₂', 'H₂O', 'NaCl', 'O₂'],
        answerIndex: 1,
        explanation: '물은 수소 2개와 산소 1개로 이루어진 H₂O입니다!',
        bonusScore: 2500,
        bonusCoins: 6,
      },
      {
        id: 'q2_math_2',
        category: '수학',
        question: 'Q. 모든 삼각형의 세 내각의 합은 몇 도일까요?',
        options: ['90°', '180°', '270°', '360°'],
        answerIndex: 1,
        explanation: '삼각형의 세 내각의 합은 항상 180°입니다!',
        bonusScore: 2500,
        bonusCoins: 6,
      },
    ],
  },

  // ==========================================
  // STAGE 3: 쿠파 용암성 (Bowser's Lava Castle)
  // ==========================================
  {
    id: 3,
    stageCode: 'STAGE 3',
    name: '쿠파 용암성',
    subName: 'World 1-3',
    badgeEmoji: '🔥',
    icon: '🔥',
    difficulty: '어려움',
    description: '붉게 타오르는 마그마와 흑요석 성채! 최고 난이도의 최종 보스 스테이지',
    worldWidth: 4200,
    goalX: 3900,
    groundY: 320,
    themeType: 'castle',
    skyColors: ['#1c0303', '#450a0a', '#7f1d1d'],
    groundGrassColor: '#ef4444',
    groundBodyColor: '#18181b',
    pipeColor: '#475569',
    pipeLipColor: '#64748b',
    brickColor: '#3f3f46',
    goombaColor: '#dc2626', // Red fiery Goombas!
    lavaPit: true,
    platforms: [
      // Ground broken across molten lava
      { x: 0, y: 320, width: 600, height: 80, type: 'ground' },
      { x: 720, y: 320, width: 550, height: 80, type: 'ground' },
      { x: 1380, y: 320, width: 600, height: 80, type: 'ground' },
      { x: 2100, y: 320, width: 450, height: 80, type: 'ground' },
      { x: 2680, y: 320, width: 450, height: 80, type: 'ground' },
      { x: 3250, y: 320, width: 950, height: 80, type: 'ground' },

      // Floating stone steps over bubbling magma
      { x: 615, y: 265, width: 85, height: 22, type: 'brick' },
      { x: 1285, y: 260, width: 80, height: 22, type: 'brick' },
      { x: 1995, y: 250, width: 90, height: 22, type: 'brick' },
      { x: 2565, y: 260, width: 95, height: 22, type: 'brick' },
      { x: 3145, y: 250, width: 90, height: 22, type: 'brick' },

      // High castle battlements
      { x: 350, y: 210, width: 128, height: 24, type: 'brick' },
      { x: 414, y: 150, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 950, y: 200, width: 160, height: 24, type: 'brick' },
      { x: 1014, y: 140, width: 32, height: 24, type: 'question' },

      { x: 1600, y: 190, width: 128, height: 24, type: 'brick' },
      { x: 1664, y: 130, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 2250, y: 180, width: 160, height: 24, type: 'brick' },
      { x: 2314, y: 120, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 2850, y: 190, width: 140, height: 24, type: 'brick' },

      // Steel pipes
      { x: 800, y: 320 - 65, width: 44, height: 65, type: 'pipe' },
      { x: 1500, y: 320 - 80, width: 44, height: 80, type: 'pipe' },
      { x: 2750, y: 320 - 70, width: 44, height: 70, type: 'pipe' },

      // Grand Bowser Fortress
      { x: 3950, y: 320 - 150, width: 150, height: 150, type: 'brick' },
    ],
    goombas: [
      { x: 450, y: 320 - 26, width: 26, height: 26, vx: -1.6, alive: true, squishedTimer: 0 },
      { x: 880, y: 320 - 26, width: 26, height: 26, vx: -1.7, alive: true, squishedTimer: 0 },
      { x: 1050, y: 200 - 26, width: 26, height: 26, vx: -1.4, alive: true, squishedTimer: 0 }, // on battlement
      { x: 1450, y: 320 - 26, width: 26, height: 26, vx: -1.8, alive: true, squishedTimer: 0 },
      { x: 1700, y: 190 - 26, width: 26, height: 26, vx: -1.5, alive: true, squishedTimer: 0 },
      { x: 2180, y: 320 - 26, width: 26, height: 26, vx: -1.9, alive: true, squishedTimer: 0 },
      { x: 2750, y: 320 - 26, width: 26, height: 26, vx: -2.0, alive: true, squishedTimer: 0 },
      { x: 3400, y: 320 - 26, width: 26, height: 26, vx: -2.0, alive: true, squishedTimer: 0 },
      { x: 3600, y: 320 - 26, width: 26, height: 26, vx: -2.0, alive: true, squishedTimer: 0 },
    ],
    coins: [
      { x: 430, y: 110, radius: 10, collected: false, animOffset: 0.1 },
      { x: 657, y: 220, radius: 10, collected: false, animOffset: 0.3 },
      { x: 1030, y: 100, radius: 10, collected: false, animOffset: 0.5 },
      { x: 1325, y: 215, radius: 10, collected: false, animOffset: 0.2 },
      { x: 1680, y: 90, radius: 10, collected: false, animOffset: 0.7 },
      { x: 2040, y: 205, radius: 10, collected: false, animOffset: 0.4 },
      { x: 2330, y: 80, radius: 10, collected: false, animOffset: 0.6 },
      { x: 2612, y: 215, radius: 10, collected: false, animOffset: 0.8 },
      { x: 3190, y: 205, radius: 10, collected: false, animOffset: 0.2 },
      // Grand coin line at end
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({
        x: 3450 + i * 28,
        y: 270,
        radius: 9,
        collected: false,
        animOffset: i * 0.15,
      })),
    ],
    quizzes: [
      {
        id: 'q3_math_1',
        category: '수학',
        question: 'Q. 1보다 큰 자연수 중 1과 자기 자신만을 약수로 가지는 수는?',
        options: ['합성수', '소수(Prime Number)', '홀수', '유리수'],
        answerIndex: 1,
        explanation: '1과 자기 자신만을 약수로 가지는 수를 소수라고 부릅니다!',
        bonusScore: 3000,
        bonusCoins: 8,
      },
      {
        id: 'q3_sci_1',
        category: '과학',
        question: 'Q. 빛의 속도(약 30만km/s)와 소리의 속도(약 340m/s) 중 더 빠른 것은?',
        options: ['빛의 속도', '소리의 속도', '둘의 속도는 같다', '온도에 따라 소리가 더 빠르다'],
        answerIndex: 0,
        explanation: '빛의 속도는 1초에 지구를 일곱 바퀴 반이나 돌 정도로 소리보다 압도적으로 빠릅니다!',
        bonusScore: 3000,
        bonusCoins: 8,
      },
      {
        id: 'q3_game_1',
        category: '게임',
        question: 'Q. 마리오 게임에서 먹으면 몸집이 두 배로 커지는 아이템은?',
        options: ['파이어 플라워', '슈퍼 버섯', '슈퍼 스타', '1UP 초록 버섯'],
        answerIndex: 1,
        explanation: '빨간색 슈퍼 버섯(Super Mushroom)을 획득하면 슈퍼 마리오로 변신합니다!',
        bonusScore: 3000,
        bonusCoins: 8,
      },
    ],
  },

  // ==========================================
  // STAGE 4: 구름 왕국 (Sky Athletic)
  // ==========================================
  {
    id: 4,
    stageCode: 'STAGE 4',
    name: '구름 왕국',
    subName: 'World 2-1',
    badgeEmoji: '☁️',
    icon: '☁️',
    difficulty: '보통',
    description: '황금빛 노을과 둥실 떠오르는 무지개 구름 섬! 공중 연계 점프와 코인 천국',
    worldWidth: 4200,
    goalX: 3850,
    groundY: 320,
    themeType: 'sky',
    skyColors: ['#ff7e5f', '#feb47b', '#ffeccc'],
    groundGrassColor: '#f59e0b',
    groundBodyColor: '#78350f',
    pipeColor: '#ea580c',
    pipeLipColor: '#f97316',
    brickColor: '#d97706',
    goombaColor: '#b45309',
    platforms: [
      // Ground sections with wide cloud gaps
      { x: 0, y: 320, width: 600, height: 80, type: 'ground' },
      { x: 800, y: 320, width: 700, height: 80, type: 'ground' },
      { x: 1700, y: 320, width: 600, height: 80, type: 'ground' },
      { x: 2550, y: 320, width: 550, height: 80, type: 'ground' },
      { x: 3350, y: 320, width: 850, height: 80, type: 'ground' },

      // Floating Cloud Steps (Athletic bridges)
      { x: 620, y: 260, width: 80, height: 20, type: 'brick' },
      { x: 710, y: 210, width: 70, height: 20, type: 'brick' },

      { x: 1520, y: 250, width: 75, height: 20, type: 'brick' },
      { x: 1610, y: 190, width: 75, height: 20, type: 'brick' },

      { x: 2330, y: 240, width: 90, height: 20, type: 'brick' },
      { x: 2440, y: 180, width: 85, height: 20, type: 'brick' },

      { x: 3130, y: 240, width: 90, height: 20, type: 'brick' },
      { x: 3240, y: 190, width: 90, height: 20, type: 'brick' },

      // Question Blocks & Mushroom High Blocks
      { x: 320, y: 200, width: 32, height: 24, type: 'question', hasMushroom: true },
      { x: 352, y: 200, width: 64, height: 24, type: 'brick' },
      { x: 416, y: 200, width: 32, height: 24, type: 'question' },

      { x: 1050, y: 190, width: 32, height: 24, type: 'question' },
      { x: 1082, y: 190, width: 96, height: 24, type: 'brick' },
      { x: 1114, y: 130, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 1950, y: 180, width: 128, height: 22, type: 'brick' },
      { x: 2000, y: 120, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 2800, y: 190, width: 32, height: 24, type: 'question' },
      { x: 2832, y: 190, width: 96, height: 24, type: 'brick' },

      // Pipes
      { x: 500, y: 320 - 55, width: 44, height: 55, type: 'pipe' },
      { x: 1250, y: 320 - 70, width: 44, height: 70, type: 'pipe' },
      { x: 2150, y: 320 - 60, width: 44, height: 60, type: 'pipe' },
      { x: 2950, y: 320 - 75, width: 44, height: 75, type: 'pipe' },

      // End Cloud Castle
      { x: 3900, y: 320 - 140, width: 130, height: 140, type: 'brick' },
    ],
    goombas: [
      { x: 400, y: 320 - 26, width: 26, height: 26, vx: -1.3, alive: true, squishedTimer: 0 },
      { x: 950, y: 320 - 26, width: 26, height: 26, vx: -1.4, alive: true, squishedTimer: 0 },
      { x: 1150, y: 320 - 26, width: 26, height: 26, vx: -1.4, alive: true, squishedTimer: 0 },
      { x: 1800, y: 320 - 26, width: 26, height: 26, vx: -1.5, alive: true, squishedTimer: 0 },
      { x: 1970, y: 180 - 26, width: 26, height: 26, vx: -1.2, alive: true, squishedTimer: 0 }, // on cloud bridge
      { x: 2650, y: 320 - 26, width: 26, height: 26, vx: -1.6, alive: true, squishedTimer: 0 },
      { x: 2850, y: 320 - 26, width: 26, height: 26, vx: -1.6, alive: true, squishedTimer: 0 },
      { x: 3500, y: 320 - 26, width: 26, height: 26, vx: -1.7, alive: true, squishedTimer: 0 },
    ],
    coins: [
      { x: 336, y: 160, radius: 10, collected: false, animOffset: 0.1 },
      { x: 432, y: 160, radius: 10, collected: false, animOffset: 0.3 },
      { x: 660, y: 220, radius: 10, collected: false, animOffset: 0.5 },
      { x: 745, y: 170, radius: 10, collected: false, animOffset: 0.2 },
      { x: 1130, y: 90, radius: 10, collected: false, animOffset: 0.7 },
      { x: 1555, y: 210, radius: 10, collected: false, animOffset: 0.4 },
      { x: 1645, y: 150, radius: 10, collected: false, animOffset: 0.6 },
      { x: 2016, y: 80, radius: 10, collected: false, animOffset: 0.8 },
      { x: 2480, y: 140, radius: 10, collected: false, animOffset: 0.2 },
      { x: 3285, y: 150, radius: 10, collected: false, animOffset: 0.5 },
      // Floating Cloud Coin Arcs
      ...[0, 1, 2, 3, 4].map((i) => ({
        x: 1350 + i * 26,
        y: 270 - Math.sin((i / 4) * Math.PI) * 40,
        radius: 9,
        collected: false,
        animOffset: i * 0.2,
      })),
      ...[0, 1, 2, 3, 4, 5].map((i) => ({
        x: 3550 + i * 26,
        y: 275,
        radius: 9,
        collected: false,
        animOffset: i * 0.15,
      })),
    ],
    quizzes: [
      {
        id: 'q4_math_1',
        category: '수학',
        question: 'Q. 두 정수 -8 과 +5 의 합은 얼마일까요?',
        options: ['-13', '-3', '+3', '+13'],
        answerIndex: 1,
        explanation: '(-8) + (+5) = -3 입니다. 음수의 절댓값이 더 큽니다!',
        bonusScore: 3500,
        bonusCoins: 8,
      },
      {
        id: 'q4_sci_1',
        category: '과학',
        question: 'Q. 식물이 햇빛과 이산화탄소를 이용해 양분을 만드는 작용은?',
        options: ['호흡 작용', '광합성', '증산 작용', '소화 작용'],
        answerIndex: 1,
        explanation: '식물의 엽록체에서 빛에너지를 이용해 포도당과 산소를 만드는 것을 광합성이라고 합니다!',
        bonusScore: 3500,
        bonusCoins: 8,
      },
      {
        id: 'q4_game_1',
        category: '게임',
        question: 'Q. 마리오가 버섯 왕국에서 주로 구하러 가는 공주의 이름은?',
        options: ['데이지 공주', '젤다 공주', '피치 공주', '로잘리나'],
        answerIndex: 2,
        explanation: '버섯 왕국의 통치자이자 마리오가 구출하러 가는 공주는 피치 공주(Princess Peach)입니다!',
        bonusScore: 3500,
        bonusCoins: 8,
      },
    ],
  },

  // ==========================================
  // STAGE 5: 빙하 크리스탈 봉우리 (Frozen Ice Peak)
  // ==========================================
  {
    id: 5,
    stageCode: 'STAGE 5',
    name: '빙하 설산',
    subName: 'World 2-2',
    badgeEmoji: '❄️',
    icon: '❄️',
    difficulty: '어려움',
    description: '눈부신 오로라와 얼음 크리스탈! 정밀한 점프가 요구되는 마스터 익스트림 코스',
    worldWidth: 4400,
    goalX: 4050,
    groundY: 320,
    themeType: 'ice',
    skyColors: ['#0f2027', '#203a43', '#2c5364'],
    groundGrassColor: '#e0f2fe',
    groundBodyColor: '#0369a1',
    pipeColor: '#0284c7',
    pipeLipColor: '#38bdf8',
    brickColor: '#0c4a6e',
    goombaColor: '#0284c7',
    platforms: [
      // Ground stretches with slippery glacier gaps
      { x: 0, y: 320, width: 550, height: 80, type: 'ground' },
      { x: 700, y: 320, width: 650, height: 80, type: 'ground' },
      { x: 1500, y: 320, width: 550, height: 80, type: 'ground' },
      { x: 2200, y: 320, width: 600, height: 80, type: 'ground' },
      { x: 2950, y: 320, width: 450, height: 80, type: 'ground' },
      { x: 3550, y: 320, width: 850, height: 80, type: 'ground' },

      // Floating Glacier Steps over abyss
      { x: 570, y: 260, width: 75, height: 22, type: 'brick' },
      { x: 1375, y: 250, width: 80, height: 22, type: 'brick' },
      { x: 2075, y: 250, width: 85, height: 22, type: 'brick' },
      { x: 2825, y: 245, width: 85, height: 22, type: 'brick' },
      { x: 3425, y: 240, width: 90, height: 22, type: 'brick' },

      // High Ice Pyramids and Floating Mystery Blocks
      { x: 300, y: 200, width: 32, height: 24, type: 'question', hasMushroom: true },
      { x: 332, y: 200, width: 96, height: 24, type: 'brick' },
      { x: 428, y: 200, width: 32, height: 24, type: 'question' },

      { x: 920, y: 190, width: 128, height: 22, type: 'brick' },
      { x: 984, y: 130, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 1680, y: 190, width: 96, height: 22, type: 'brick' },
      { x: 1712, y: 130, width: 32, height: 24, type: 'question', hasMushroom: true },

      { x: 2400, y: 180, width: 128, height: 22, type: 'brick' },
      { x: 2448, y: 120, width: 32, height: 24, type: 'question' },

      { x: 3100, y: 170, width: 128, height: 22, type: 'brick' },
      { x: 3148, y: 110, width: 32, height: 24, type: 'question', hasMushroom: true },

      // Blue crystal pipes
      { x: 800, y: 320 - 65, width: 44, height: 65, type: 'pipe' },
      { x: 1600, y: 320 - 80, width: 44, height: 80, type: 'pipe' },
      { x: 2320, y: 320 - 70, width: 44, height: 70, type: 'pipe' },
      { x: 3050, y: 320 - 80, width: 44, height: 80, type: 'pipe' },

      // Grand Ice Crystal Castle at goal
      { x: 4100, y: 320 - 150, width: 150, height: 150, type: 'brick' },
    ],
    goombas: [
      { x: 420, y: 320 - 26, width: 26, height: 26, vx: -1.7, alive: true, squishedTimer: 0 },
      { x: 850, y: 320 - 26, width: 26, height: 26, vx: -1.8, alive: true, squishedTimer: 0 },
      { x: 1050, y: 190 - 26, width: 26, height: 26, vx: -1.4, alive: true, squishedTimer: 0 }, // on high ice platform
      { x: 1580, y: 320 - 26, width: 26, height: 26, vx: -1.9, alive: true, squishedTimer: 0 },
      { x: 1720, y: 190 - 26, width: 26, height: 26, vx: -1.5, alive: true, squishedTimer: 0 },
      { x: 2260, y: 320 - 26, width: 26, height: 26, vx: -2.0, alive: true, squishedTimer: 0 },
      { x: 2460, y: 180 - 26, width: 26, height: 26, vx: -1.6, alive: true, squishedTimer: 0 },
      { x: 3000, y: 320 - 26, width: 26, height: 26, vx: -2.1, alive: true, squishedTimer: 0 },
      { x: 3650, y: 320 - 26, width: 26, height: 26, vx: -2.1, alive: true, squishedTimer: 0 },
      { x: 3850, y: 320 - 26, width: 26, height: 26, vx: -2.2, alive: true, squishedTimer: 0 },
    ],
    coins: [
      { x: 316, y: 160, radius: 10, collected: false, animOffset: 0.1 },
      { x: 444, y: 160, radius: 10, collected: false, animOffset: 0.3 },
      { x: 607, y: 215, radius: 10, collected: false, animOffset: 0.5 },
      { x: 1000, y: 90, radius: 10, collected: false, animOffset: 0.2 },
      { x: 1415, y: 205, radius: 10, collected: false, animOffset: 0.7 },
      { x: 1728, y: 90, radius: 10, collected: false, animOffset: 0.4 },
      { x: 2117, y: 205, radius: 10, collected: false, animOffset: 0.6 },
      { x: 2464, y: 80, radius: 10, collected: false, animOffset: 0.8 },
      { x: 2867, y: 200, radius: 10, collected: false, animOffset: 0.3 },
      { x: 3164, y: 70, radius: 10, collected: false, animOffset: 0.5 },
      { x: 3470, y: 195, radius: 10, collected: false, animOffset: 0.7 },
      // Giant Victory Diamond formation
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({
        x: 3700 + i * 28,
        y: 260 - Math.sin((i / 6) * Math.PI) * 45,
        radius: 9,
        collected: false,
        animOffset: i * 0.15,
      })),
    ],
    quizzes: [
      {
        id: 'q5_math_1',
        category: '수학',
        question: 'Q. 반지름이 4cm인 원의 둘레의 길이는? (원주율은 π)',
        options: ['4π cm', '8π cm', '16π cm', '24π cm'],
        answerIndex: 1,
        explanation: '원의 둘레 = 2 × π × r = 2 × π × 4 = 8π cm 입니다!',
        bonusScore: 4000,
        bonusCoins: 10,
      },
      {
        id: 'q5_math_2',
        category: '수학',
        question: 'Q. 좌표평면에서 점 (-2, 3)은 제몇 사분면 위의 점일까요?',
        options: ['제1사분면', '제2사분면', '제3사분면', '제4사분면'],
        answerIndex: 1,
        explanation: 'x좌표가 음수(-)이고 y좌표가 양수(+)인 점은 제2사분면에 속합니다!',
        bonusScore: 4000,
        bonusCoins: 10,
      },
      {
        id: 'q5_game_1',
        category: '게임',
        question: 'Q. 마리오 게임에서 초록색 공룡 캐릭터로 마리오를 태워주는 친구는?',
        options: ['요시(Yoshi)', '쿠파(Bowser)', '동키콩(Donkey Kong)', '와루이지'],
        answerIndex: 0,
        explanation: '마리오의 영원한 친구이자 든든한 파트너 공룡은 요시(Yoshi)입니다!',
        bonusScore: 4000,
        bonusCoins: 10,
      },
    ],
  },
];

export function getStageById(id: number): MarioStage {
  const found = STAGE_DATA.find((s) => s.id === id);
  return found || STAGE_DATA[0];
}

export function getRandomQuizForStage(stageId: number): BonusQuiz {
  const stage = getStageById(stageId);
  const randomIndex = Math.floor(Math.random() * stage.quizzes.length);
  return stage.quizzes[randomIndex];
}
