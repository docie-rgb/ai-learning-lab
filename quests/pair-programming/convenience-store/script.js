'use strict';

/* =========================================================
   편의점 야간 알바 - 게임 로직
   ========================================================= */

// ---------- 기본 설정 ----------
const CONFIG = {
  stageTime: 180,       // 스테이지 제한 시간(초)
  startRating: 70,
  maxRating: 100,
  startStock: 5,
  restockAmount: 5,
  wrongPenalty: 10,
  streakGoal: 3,
  streakBonus: 5,
  maxVillainsPerStage: 3,
};

const STAGES = [
  { day: 1, target: 15000, maxKinds: 2, maxQty: 2, villainChance: 0.3 },
  { day: 2, target: 25000, maxKinds: 3, maxQty: 2, villainChance: 0.35 },
  { day: 3, target: 35000, maxKinds: 3, maxQty: 3, villainChance: 0.4 },
];

// ---------- 픽셀 아트 ----------
const PRODUCTS = [
  {
    id: 'onigiri', name: '삼각김밥', price: 1200,
    art: ['...WW...', '..WWWW..', '.WWWWWW.', '.WWWWWW.', 'WWWWWWWW', 'WGGRRGGW', 'WGGGGGGW', 'GGGGGGGG'],
    pal: { W: '#fffaf0', G: '#1f3b2d', R: '#e8505b' },
  },
  {
    id: 'ramen', name: '컵라면', price: 1300,
    art: ['LLLLLLLL', 'RRRRRRRR', '.WWWWWW.', '.WRRRRW.', '.WWWWWW.', '.RRRRRR.', '..RRRR..', '..RRRR..'],
    pal: { L: '#c9c9d6', R: '#e63946', W: '#fff' },
  },
  {
    id: 'milk', name: '바나나우유', price: 1500,
    art: ['...GG...', '...YY...', '..YYYY..', '.YYYYYY.', 'YYBBBBYY', 'YYBYYBYY', '.YYYYYY.', '..YYYY..'],
    pal: { G: '#3fbf7f', Y: '#ffd23f', B: '#a0522d' },
  },
  {
    id: 'cola', name: '콜라', price: 1800,
    art: ['..SSSS..', '.RRRRRR.', '.RWWWWR.', '.RRRRRR.', '.RRWWRR.', '.RRRRRR.', '.RRRRRR.', '..SSSS..'],
    pal: { S: '#b8b8c8', R: '#d62828', W: '#fff' },
  },
  {
    id: 'chips', name: '감자칩', price: 1700,
    art: ['.OOOOOO.', '.OYYYYO.', 'OYYRRYYO', 'OYRRRRYO', 'OYYRRYYO', 'OYYYYYYO', '.OYYYYO.', '.OOOOOO.'],
    pal: { O: '#f77f00', Y: '#fcbf49', R: '#d62828' },
  },
  {
    id: 'dosirak', name: '도시락', price: 4200,
    art: ['........', 'BBBBBBBB', 'BWWWBGGB', 'BWWWBGGB', 'BWWWBOOB', 'BWWWBOOB', 'BBBBBBBB', '........'],
    pal: { B: '#3a3a4a', W: '#fffaf0', G: '#6abf4b', O: '#ff9f1c' },
  },
];

const PERSON = [
  '....HHHH....',
  '...HHHHHH...',
  '..HHHHHHHH..',
  '..HSSSSSSH..',
  '..SSESSESS..',
  '..SSSSSSSS..',
  '..SBSMMSBS..',
  '...SSSSSS...',
  '....SSSS....',
  '..CCCCCCCC..',
  '.CCCCCCCCCC.',
  '.SCCCCCCCCS.',
  '.SCCCCCCCCS.',
  '..PPPPPPPP..',
  '..PP....PP..',
  '..KK....KK..',
];
const BASE_PAL = { E: '#222', M: '#c0392b', B: '#ffa3a3', K: '#333', W: '#fff' };

const CLERK = {
  pal: { H: '#3b2a20', S: '#ffd9b3', C: '#3fbf7f', P: '#2d3a5c', V: '#2e9c63', Y: '#ffd23f' },
  over: {
    0: '...VVVVVV...', 1: '..VVVVVVVV..', 2: '..VVVVVVVVVV',
    9: '..CWCCCCWC..', 11: '.SCCCCCYCCS.',
  },
};

const CUSTOMER_LOOKS = [
  { H: '#3b2a20', S: '#ffd9b3', C: '#4f8ef7', P: '#2d3a5c' },
  { H: '#e8b04a', S: '#ffe0c2', C: '#ff7aa2', P: '#5b4a8a' },
  { H: '#1a1a2e', S: '#f1c6a0', C: '#6fcf97', P: '#3d3d3d' },
  { H: '#8b4513', S: '#ffd2a6', C: '#f2c94c', P: '#2f4f6f' },
  { H: '#c0c0c0', S: '#f6d0b0', C: '#9b51e0', P: '#333333' },
  { H: '#ff6b6b', S: '#ffe3c9', C: '#56ccf2', P: '#264653' },
];
const CUSTOMER_LINES = ['계산해 주세요~', '이거 얼마예요?', '빨리요 빨리!', '봉투는 괜찮아요', '카드 되죠?', '야식 타임~'];

// ---------- 빌런 손님 ----------
// grade: good(모범 대처) / meh(무난) / bad(최악) — 엔딩 판정에 사용
const VILLAINS = [
  {
    id: 'banmal', name: '반말 아저씨',
    line: '야, 거기 알바. 담배 젤 싼 걸로 하나. 빨리빨리 안 해?',
    pal: { H: '#2b2b2b', S: '#e9b48a', C: '#f4f4f4', P: '#556b2f', G: '#111', M: '#7a1f1f', B: '#e9b48a' },
    over: { 0: '............', 1: '............', 2: '...SSSSSS...', 4: '..SGGGGGGS..', 6: '..SSMMMMSS..', 9: '..SCSSSSCS..' },
    choices: [
      { text: '"손님~ 존댓말 부탁드려요 😊" 웃으며 응대한다', grade: 'good', rating: 5, sales: 4500, result: '아저씨가 머쓱해하며 "...주세요" 라고 했다. 존댓말의 승리!' },
      { text: '말없이 담배를 꺼내 건넨다', grade: 'meh', rating: -3, sales: 4500, result: '계산은 끝났지만 마음 한구석이 찜찜하다...' },
      { text: '"아저씨나 빨리빨리 하세요!" 맞받아친다', grade: 'bad', rating: -15, sales: 0, result: '아저씨가 본사에 항의 전화를 걸었다. 평점 폭락!' },
    ],
  },
  {
    id: 'oneplus', name: '1+1 우기는 아주머니',
    line: '이 콜라 1+1 맞잖아! 저번 주에 그랬다니까? 하나 더 가져갈게~',
    pal: { H: '#7b3fa0', S: '#ffd9b3', C: '#ff5fa2', P: '#4a4a8a', B: '#ff7f9f' },
    over: { 0: '..HHHHHHHH..', 1: '.HHHHHHHHHH.', 2: 'HHHHHHHHHHHH', 3: 'HHHSSSSSSHHH', 4: 'HHSESSSSESHH', 5: '.HSSSSSSSSH.' },
    choices: [
      { text: '행사 안내판을 차분히 보여드린다', grade: 'good', rating: 5, sales: 1800, result: '"아 그게 지난주였어?" 아주머니는 순순히 계산하고 가셨다.' },
      { text: '귀찮으니 그냥 하나 더 드린다', grade: 'meh', rating: 0, sales: -1800, result: '아주머니는 신났지만 매출에서 콜라값이 빠졌다...' },
      { text: '"눈이 좀 안 좋으신가 봐요?"', grade: 'bad', rating: -15, sales: 0, result: '아주머니의 단골 모임 단톡방에 가게 험담이 올라갔다.' },
    ],
  },
  {
    id: 'coins', name: '동전 폭탄 할아버지',
    line: '허허, 도시락 하나 주게. 10원짜리로 모아 둔 게 있어서... (짤랑짤랑) 420개라네.',
    pal: { H: '#dddddd', S: '#f0c8a0', C: '#8b5a2b', P: '#555555', G: '#333' },
    over: { 0: '............', 1: '...H....H...', 2: '..HHSSSSHH..', 4: '..GEGSSGEG..', 6: '..SSSMMSSS..', 7: '...SHHHHS...' },
    choices: [
      { text: '침착하게 하나하나 센다 (시간 -10초)', grade: 'good', rating: 5, sales: 4200, time: -10, result: '"젊은이가 참 친절하구먼!" 할아버지가 엄지를 척 올렸다.' },
      { text: '저울에 올려서 무게로 대충 계산한다', grade: 'meh', rating: 0, sales: 4000, result: '200원쯤 모자란 것 같지만... 시간은 아꼈다.' },
      { text: '"동전은 안 받습니다!" 거절한다', grade: 'bad', rating: -10, sales: 0, result: '할아버지가 서운한 얼굴로 돌아섰다. 지켜보던 손님들 시선이 따갑다.' },
    ],
  },
  {
    id: 'drunk', name: '사장 친구라는 취객',
    line: '히끅~ 나 여기 사장이랑 친구야~ 오늘은 외상 좀 하자~ 소주 다섯 병!',
    pal: { H: '#222', S: '#f5a98c', B: '#e8413c', C: '#f0f0f0', P: '#374151', T: '#d62828' },
    over: { 2: '..TTTTTTTT..', 4: '..SEESSEES..', 6: '..BBSMMSBB..' },
    choices: [
      { text: '"사장님께 지금 전화 드려 볼게요!"', grade: 'good', rating: 5, sales: 0, result: '휴대폰을 꺼내자 취객이 "어... 다음에 올게~" 하며 비틀비틀 사라졌다.' },
      { text: '외상 장부에 이름을 적어 준다', grade: 'meh', rating: 0, sales: -3000, result: '장부에 "사장 친구"라고만 적혔다... 매출 손실!' },
      { text: '같이 건배하며 맞장구친다', grade: 'bad', rating: -20, sales: 0, result: '"알바생이 근무 중 술판" 목격담이 동네에 퍼졌다...' },
    ],
  },
  {
    id: 'minor', name: '콧수염 붙인 학생',
    line: '(가짜 콧수염을 만지며) 흠흠, 저 스무 살 맞거든요? 맥주 네 캔 주세요. 아마도요.',
    pal: { H: '#222', S: '#ffe0c2', C: '#2ecc71', P: '#2c3e50', m: '#3b2a20', V: '#e74c3c' },
    over: { 0: '............', 1: '...VVVVVV...', 2: 'VVVVVVVVVV..', 6: '..SmmmmmmS..', 7: '...SSMMSS...' },
    choices: [
      { text: '신분증을 보여 달라고 한다', grade: 'good', rating: 5, sales: 0, result: '"아... 지갑을 집에 두고 와서..." 콧수염이 바닥에 툭 떨어졌다.' },
      { text: '대신 바나나우유를 추천한다', grade: 'good', rating: 3, sales: 1500, result: '"...사실 이게 더 좋아요." 학생은 바나나우유를 사 갔다.' },
      { text: '"에이 설마~" 하고 그냥 판다', grade: 'bad', rating: -25, sales: 8000, result: '미성년자 주류 판매 적발! 사장님 얼굴이 하얗게 질렸다.' },
    ],
  },
  {
    id: 'points', name: '포인트 고민러',
    line: '잠깐만요~ 통신사 할인이랑 포인트 적립이랑 쿠폰 다 되죠? 앱이... 어? 왜 안 열리지...',
    pal: { H: '#5a3825', S: '#ffd9b3', C: '#f2994a', P: '#3d5a80', G: '#222', F: '#111' },
    over: { 0: '....HH......', 4: '..GEGSSGEG..', 11: '.SCCCCCCCCSF', 12: '.SCCCCCCCCSF' },
    choices: [
      { text: '웃으며 끝까지 기다려 준다 (시간 -15초)', grade: 'good', rating: 5, sales: 3000, time: -15, result: '할인 세 개를 전부 적용! 손님이 "여기 단골 할게요!"라고 외쳤다.' },
      { text: '"할인은 다음에 받으시고 결제 먼저 할까요?"', grade: 'meh', rating: 0, sales: 3000, result: '손님은 살짝 아쉬워했지만 계산은 빠르게 끝났다.' },
      { text: '뒤에서 한숨을 크게 쉰다', grade: 'bad', rating: -10, sales: 0, result: '손님이 상품을 내려놓고 나갔다. "불친절해!"' },
    ],
  },
  {
    id: 'water', name: '뜨거운 물만 손님',
    line: '뜨거운 물만 좀 받아 갈게요~ 라면은 집에 있거든요. 아, 젓가락이랑 단무지도요!',
    pal: { H: '#111', S: '#f7cfa5', C: '#2f80ed', P: '#2f80ed', L: '#bbbbbb' },
    over: { 0: '.H..H..H..H.', 9: '..CCCWWCCC..', 10: '.CCCCWWCCCC.', 11: 'LSCCCCCCCCS.', 12: 'LSCCCCCCCCS.' },
    choices: [
      { text: '"컵라면 사시면 물은 무료예요!" 영업한다', grade: 'good', rating: 3, sales: 1300, result: '"오... 그럼 하나 살게요." 영업 성공!' },
      { text: '그냥 물이랑 젓가락을 챙겨 준다', grade: 'meh', rating: 1, sales: 0, result: '손님은 고마워했지만 단무지 재고가 줄었다.' },
      { text: '"여기가 정수기 대리점인 줄 아세요?"', grade: 'bad', rating: -10, sales: 0, result: '손님이 리뷰 앱에 별 하나를 남겼다.' },
    ],
  },
  {
    id: 'refund', name: '다 먹고 환불 빌런',
    line: '이 도시락 맛없어서 환불해 줘요. (텅 빈 용기를 내밀며) 반찬이 영 별로더라고.',
    pal: { H: '#f2c94c', S: '#ffe0c2', C: '#d4a373', P: '#222', G: '#111', R: '#c0392b' },
    over: { 2: '..GGGGGGGG..', 5: '.HSSSSSSSSH.', 6: '.HSBSRRSBSH.', 7: '.HHSSSSSSHH.', 10: 'CCCCCCCCCCCC', 11: 'CSCCCCCCCCSC', 12: 'CSCCCCCCCCSC' },
    choices: [
      { text: '"드신 상품은 환불이 어려워요" 정중히 안내한다', grade: 'good', rating: 3, sales: 0, result: '손님은 투덜댔지만 반박할 말이 없어 조용히 나갔다.' },
      { text: '귀찮아서 그냥 환불해 준다', grade: 'meh', rating: 0, sales: -4200, result: '손님은 만족했지만 도시락 값이 그대로 날아갔다.' },
      { text: '빈 용기를 손님 앞에서 쓰레기통에 던진다', grade: 'bad', rating: -15, sales: 0, result: '"알바 태도 실화?" 손님이 가게 앞에서 30분간 소리쳤다.' },
    ],
  },
  {
    id: 'streamer', name: '챌린지 스트리머',
    line: '구독자 여러분 안녕하세요~! 지금 편의점 알바님께 챌린지 춤을 요청해 볼게요! 한 번만요~',
    pal: { H: '#ff4fd8', S: '#ffe0c2', C: '#222', P: '#ff4fd8', F: '#555' },
    over: {
      0: '.HH.HHHH.HH.', 1: 'HHHHHHHHHHHH', 2: '..HHHHHHHHFF', 3: '..HSSSSSSH.F', 4: '..SSESSESS.F',
      5: '..SSSSSSSS.F', 6: '..SBSMMSBS.F', 7: '...SSSSSS..F', 8: '....SSSS...F', 9: '..CCCCCCCC.F', 10: '.CCCCCCCCCSF',
    },
    choices: [
      { text: '프로 알바의 칼각 춤을 보여 준다', grade: 'good', rating: 5, sales: 3000, result: '영상 떡상! 구경 온 손님들이 간식을 잔뜩 사 갔다.' },
      { text: '"근무 중 촬영은 곤란해요" 정중히 거절한다', grade: 'good', rating: 3, sales: 0, result: '"아 넵! 죄송합니다~" 스트리머는 쿨하게 물러났다.' },
      { text: '카메라를 손으로 확 가린다', grade: 'bad', rating: -10, sales: 0, result: '"편의점 알바 태도 논란" 영상이 올라갔다...' },
    ],
  },
];

// ---------- 엔딩 ----------
const ENDINGS = [
  {
    icon: '👑', title: '전설의 야간 알바왕',
    test: (s) => s.rating >= 90 && s.handled >= 5 && s.good >= s.handled * 0.7,
    story: '빌런도, 계산도 완벽! 사장님이 눈물을 글썽이며 말했다. "자네... 이 가게를 물려받지 않겠나?" 냥냥마트 2호점 점장 등극!',
  },
  {
    icon: '🔥', title: '빌런보다 무서운 알바',
    test: (s) => s.bad >= 4,
    story: '동네에 소문이 퍼졌다. "냥냥마트 야간 알바는 건드리지 마라." 빌런들은 사라졌지만... 일반 손님도 같이 사라졌다.',
  },
  {
    icon: '💰', title: '사장님의 정직원 제안',
    test: (s) => s.totalSales >= 100000 && s.rating >= 70,
    story: '3일 만에 역대 최고 야간 매출 달성! 사장님이 정규직 계약서를 내밀었다. 근데 야간 수당은...?',
  },
  {
    icon: '🛡️', title: '빌런 퇴치 전문가',
    test: (s) => s.handled >= 3 && s.good >= s.handled * 0.7,
    story: '어떤 진상 손님도 웃으며 돌려보내는 당신. 다른 편의점들에서 스카우트 제의가 쏟아지고 있다!',
  },
  {
    icon: '😵', title: '간신히 퇴근...',
    test: (s) => s.rating < 40,
    story: '3일을 버티긴 했지만 평점은 바닥. 사장님이 조용히 다음 주 근무표에서 이름을 지웠다. 그래도 월급은 들어온다!',
  },
  {
    icon: '🌅', title: '무사히 퇴근 성공',
    test: () => true,
    story: '해가 뜨고, 교대 알바생이 왔다. 특별한 일은 없었지만 그게 바로 프로의 하루. 오늘은 삼각김밥 하나 사 들고 퇴근!',
  },
];

// ---------- 유틸 ----------
const $ = (id) => document.getElementById(id);
const won = (n) => n.toLocaleString('ko-KR');
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const productById = (id) => PRODUCTS.find((p) => p.id === id);

// 문자 지도 → SVG (가로로 같은 색이 이어지면 하나의 rect로 합침)
function pixelArt(rows, palette) {
  const w = rows[0].length;
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const ch = row[x];
      const color = palette[ch];
      if (!color) { x++; continue; }
      let len = 1;
      while (x + len < w && row[x + len] === ch) len++;
      rects += `<rect x="${x}" y="${y}" width="${len}" height="1.05" fill="${color}"/>`;
      x += len;
    }
  });
  return `<svg viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${rects}</svg>`;
}
function personArt(look) {
  const rows = PERSON.map((r, i) => (look.over && look.over[i]) || r);
  return pixelArt(rows, { ...BASE_PAL, ...(look.pal || look) });
}
const iconCache = {};
function productIcon(id) {
  if (!iconCache[id]) {
    const p = productById(id);
    iconCache[id] = `<span class="icon">${pixelArt(p.art, p.pal)}</span>`;
  }
  return iconCache[id];
}

// ---------- 사운드 ----------
const Sound = {
  ctx: null,
  on: true,
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type = 'square', vol = 0.06, delay = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  },
  seq(notes, type) {
    notes.forEach(([f, d, delay]) => this.tone(f, d, type, 0.06, delay));
  },
};
const SFX = {
  click: () => Sound.tone(660, 0.05),
  key: () => Sound.tone(880, 0.03, 'triangle'),
  door: () => Sound.seq([[988, 0.12, 0], [784, 0.18, 0.12]], 'triangle'),
  scan: () => Sound.seq([[1568, 0.06, 0], [1568, 0.06, 0.09]]),
  cash: () => Sound.seq([[1047, 0.08, 0], [1319, 0.08, 0.08], [1568, 0.16, 0.16]]),
  wrong: () => Sound.seq([[220, 0.18, 0], [165, 0.3, 0.16]], 'sawtooth'),
  bonus: () => Sound.seq([[784, 0.08, 0], [988, 0.08, 0.08], [1175, 0.08, 0.16], [1568, 0.2, 0.24]]),
  restock: () => Sound.seq([[392, 0.06, 0], [523, 0.1, 0.07]]),
  villain: () => Sound.seq([[311, 0.12, 0], [294, 0.12, 0.14], [277, 0.12, 0.28], [262, 0.3, 0.42]], 'sawtooth'),
  good: () => Sound.seq([[659, 0.1, 0], [880, 0.2, 0.1]]),
  bad: () => Sound.seq([[330, 0.15, 0], [247, 0.3, 0.15]], 'sawtooth'),
  tick: () => Sound.tone(1200, 0.03, 'square', 0.04),
  timeup: () => Sound.seq([[880, 0.15, 0], [660, 0.15, 0.18], [440, 0.4, 0.36]]),
  clear: () => Sound.seq([[523, 0.1, 0], [659, 0.1, 0.1], [784, 0.1, 0.2], [1047, 0.35, 0.3]]),
  fail: () => Sound.seq([[392, 0.2, 0], [370, 0.2, 0.22], [349, 0.5, 0.44]], 'triangle'),
  over: () => Sound.seq([[294, 0.25, 0], [277, 0.25, 0.27], [262, 0.25, 0.54], [196, 0.7, 0.81]], 'sawtooth'),
  ending: () => Sound.seq([[523, 0.12, 0], [659, 0.12, 0.13], [784, 0.12, 0.26], [1047, 0.12, 0.39], [784, 0.12, 0.52], [1047, 0.5, 0.65]]),
};

// ---------- 게임 상태 ----------
const state = {
  phase: 'title',        // title | playing | ended | over | finished
  stage: 0,
  timeLeft: CONFIG.stageTime,
  sales: 0,
  rating: CONFIG.startRating,
  streak: 0,
  stock: {},
  customer: null,
  modal: null,
  usedVillains: new Set(),  // 이번 게임에서 이미 등장한 빌런 (같은 빌런 재등장 X)
  villainLog: [],           // { id, grade }
  stageSales: [0, 0, 0],    // 클리어한 스테이지의 매출
  stageStart: null,         // 다시하기용 스냅샷
  villainsThisStage: 0,
  normalsSinceVillain: 0,
  targetReached: false,
  runId: 0,                 // 스테이지가 다시 시작되면 예약된 타이머를 무효화
  timerId: null,
};

const el = {};

// 스테이지가 바뀌면 예약 작업이 실행되지 않도록 runId로 보호
function later(fn, ms) {
  const id = state.runId;
  setTimeout(() => { if (id === state.runId) fn(); }, ms);
}
const isPlaying = () => state.phase === 'playing';

// ---------- 화면 갱신 ----------
function render() {
  const st = STAGES[state.stage];
  el.hudStage.textContent = st.day;
  el.hudTime.textContent = fmtTime(state.timeLeft);
  el.hudTimeBox.classList.toggle('danger', isPlaying() && state.timeLeft <= 20);
  el.hudTarget.textContent = won(st.target);
  el.hudSales.textContent = `${won(state.sales)}원`;
  el.salesBar.style.width = `${clamp(state.sales / st.target, 0, 1) * 100}%`;
  el.hudRating.textContent = state.rating;
  el.ratingBar.style.width = `${state.rating}%`;
  el.ratingBar.className = 'bar-fill rating' + (state.rating <= 30 ? ' low' : state.rating <= 60 ? ' mid' : '');
  document.querySelectorAll('[data-timer]').forEach((t) => { t.textContent = `⏱ ${fmtTime(state.timeLeft)}`; });
  el.streak.textContent = `연속 정답 ${'★'.repeat(state.streak)}${'☆'.repeat(CONFIG.streakGoal - state.streak)}`;

  // 게임 속 시계: 밤 10시 → 아침 6시
  const minutes = Math.floor(((CONFIG.stageTime - state.timeLeft) / CONFIG.stageTime) * 480);
  const h24 = (22 + Math.floor(minutes / 60)) % 24;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  el.clock.textContent = `${ampm} ${String(h12).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  renderShelves();
  renderButtons();
}

function renderShelves() {
  el.shelves.innerHTML = PRODUCTS.map((p) => {
    const n = state.stock[p.id] ?? CONFIG.startStock;
    const cls = n === 0 ? 'empty' : n <= 2 ? 'low' : '';
    return `<button type="button" class="slot ${cls}" data-id="${p.id}" title="${p.name}">${productIcon(p.id)}<span class="count">×${n}</span></button>`;
  }).join('');
}

function renderButtons() {
  const c = state.customer;
  const playing = isPlaying();
  el.btnCheckout.disabled = !(playing && c && c.ready && c.type === 'normal');
  el.btnStock.disabled = !playing;
  el.btnServe.disabled = !(playing && c && c.ready && c.type === 'villain' && !c.handled);
  el.btnServe.classList.toggle('alert', !el.btnServe.disabled);
  el.btnRetry.disabled = state.phase === 'title';

  let hint = '';
  if (state.phase === 'title') hint = '게임 시작을 눌러주세요';
  else if (!playing) hint = '영업 종료! 조작할 수 없어요';
  else if (!c) hint = '손님을 기다리는 중...';
  else if (c.type === 'villain') hint = '빌런 등장! 손님 응대를 눌러요';
  else if (c.ready) hint = '계산하기 또는 숫자키로 금액을 입력해요';
  el.hint.textContent = hint;
}

function floatText(text, cls = 'good', x = 50, y = 40) {
  const f = document.createElement('div');
  f.className = `floater ${cls}`;
  f.textContent = text;
  f.style.left = `${x}%`;
  f.style.top = `${y}%`;
  el.floaters.appendChild(f);
  setTimeout(() => f.remove(), 1400);
}

function showBanner(html) {
  el.banner.innerHTML = html;
  el.banner.classList.remove('hidden');
  // 애니메이션 재시작
  el.banner.style.animation = 'none';
  void el.banner.offsetWidth;
  el.banner.style.animation = '';
  later(() => el.banner.classList.add('hidden'), 1800);
}

function shakeScene() {
  el.scene.classList.remove('shake');
  void el.scene.offsetWidth;
  el.scene.classList.add('shake');
}

// ---------- 팝업 ----------
const MODALS = ['modalStart', 'modalCalc', 'modalStock', 'modalVillain', 'modalResult'];
function openModal(id) {
  MODALS.forEach((m) => el[m].classList.toggle('hidden', m !== id));
  el.overlay.classList.remove('hidden');
  state.modal = id;
}
function closeModal() {
  MODALS.forEach((m) => el[m].classList.add('hidden'));
  el.overlay.classList.add('hidden');
  state.modal = null;
}

// ---------- 스테이지 흐름 ----------
function startGame() {
  state.rating = CONFIG.startRating;
  state.usedVillains = new Set();
  state.villainLog = [];
  state.stageSales = [0, 0, 0];
  enterStage(0);
}

function enterStage(idx) {
  state.stage = idx;
  state.stageStart = {
    rating: state.rating,
    used: new Set(state.usedVillains),
    logLen: state.villainLog.length,
  };
  runStage();
}

// 다시하기: 이 스테이지를 시작했을 때 상태로 되돌린다
function retryStage() {
  if (!state.stageStart) return;
  const s = state.stageStart;
  state.rating = s.rating;
  state.usedVillains = new Set(s.used);
  state.villainLog.length = s.logLen;
  runStage();
}

function runStage() {
  state.runId++;
  clearInterval(state.timerId);
  state.timeLeft = CONFIG.stageTime;
  state.sales = 0;
  state.streak = 0;
  state.villainsThisStage = 0;
  state.normalsSinceVillain = 0;
  state.targetReached = false;
  PRODUCTS.forEach((p) => { state.stock[p.id] = CONFIG.startStock; });
  state.customer = null;
  el.customer.className = 'customer hidden';
  el.counterItems.innerHTML = '';
  el.registerScreen.textContent = 'WELCOME';
  el.floaters.innerHTML = '';
  closeModal();
  state.phase = 'playing';
  render();

  const st = STAGES[state.stage];
  showBanner(`DAY ${st.day}<small>목표 매출 ${won(st.target)}원</small>`);
  state.timerId = setInterval(tick, 1000);
  later(spawnCustomer, 1600);
}

function tick() {
  if (!isPlaying()) return;
  state.timeLeft = Math.max(0, state.timeLeft - 1);
  if (state.timeLeft <= 10 && state.timeLeft > 0) SFX.tick();
  render();
  if (state.timeLeft <= 0) endStage();
}

function endStage() {
  if (!isPlaying()) return;
  state.phase = 'ended';
  state.runId++;
  clearInterval(state.timerId);
  closeModal();
  if (state.customer) {
    el.customer.className = 'customer leave';
    state.customer = null;
  }
  render();
  SFX.timeup();
  showBanner('영업 종료!');
  later(showStageResult, 1500);
}

function showStageResult() {
  const st = STAGES[state.stage];
  const cleared = state.sales >= st.target;
  if (cleared) state.stageSales[state.stage] = state.sales;

  const table = `
    <table class="stats">
      <tr><td>오늘 매출</td><td>${won(state.sales)}원</td></tr>
      <tr><td>목표 매출</td><td>${won(st.target)}원</td></tr>
      <tr><td>현재 평점</td><td>${state.rating}점</td></tr>
    </table>`;

  if (cleared && state.stage === STAGES.length - 1) {
    SFX.clear();
    setResult('🎉', `DAY ${st.day} 클리어!`, `${table}<p>드디어 마지막 밤이 끝났다...!</p>`, [
      { text: '엔딩 보기 ▶', cls: 'btn-main', fn: showEnding },
    ]);
  } else if (cleared) {
    SFX.clear();
    setResult('🎉', `DAY ${st.day} 클리어!`, `${table}<p>수고했어요! 다음 날 밤도 힘내봐요.</p>`, [
      { text: `DAY ${st.day + 1} 출근 ▶`, cls: 'btn-main', fn: () => enterStage(state.stage + 1) },
    ]);
  } else {
    SFX.fail();
    setResult('😢', '목표 매출 미달...', `${table}<p>사장님: "내일 다시 해 보자고!"<br>같은 날을 다시 도전합니다.</p>`, [
      { text: '↺ 다시 도전', cls: 'btn-main', fn: retryStage },
    ]);
  }
}

function gameOver() {
  if (state.phase !== 'playing') return;
  state.phase = 'over';
  state.runId++;
  clearInterval(state.timerId);
  closeModal();
  shakeScene();
  render();
  SFX.over();
  setResult('💀', '게임 오버', `
    <div class="story">평점이 0점이 되었다...<br>사장님: "자네, 내일부터 안 나와도 되네."</div>
    <table class="stats">
      <tr><td>DAY</td><td>${STAGES[state.stage].day}일 차</td></tr>
      <tr><td>오늘 매출</td><td>${won(state.sales)}원</td></tr>
    </table>`, [
    { text: '처음부터', cls: 'btn-sub', fn: startGame },
    { text: '↺ 다시하기', cls: 'btn-main', fn: retryStage },
  ]);
}

function showEnding() {
  state.phase = 'finished';
  const stats = {
    totalSales: state.stageSales.reduce((a, b) => a + b, 0),
    rating: state.rating,
    handled: state.villainLog.length,
    good: state.villainLog.filter((v) => v.grade === 'good').length,
    bad: state.villainLog.filter((v) => v.grade === 'bad').length,
  };
  const ending = ENDINGS.find((e) => e.test(stats));
  SFX.ending();
  setResult(ending.icon, ending.title, `
    <div class="story">${ending.story}</div>
    <table class="stats">
      <tr><td>3일 총 매출</td><td>${won(stats.totalSales)}원</td></tr>
      <tr><td>최종 평점</td><td>${stats.rating}점</td></tr>
      <tr><td>빌런 응대</td><td>모범 ${stats.good} / 최악 ${stats.bad} (총 ${stats.handled})</td></tr>
    </table>`, [
    { text: '처음부터 다시', cls: 'btn-main', fn: startGame },
  ]);
  render();
}

function setResult(icon, title, body, actions) {
  el.resultIcon.textContent = icon;
  el.resultTitle.textContent = title;
  el.resultBody.innerHTML = body;
  el.resultActions.innerHTML = '';
  actions.forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn ${a.cls}`;
    b.textContent = a.text;
    b.addEventListener('click', () => { SFX.click(); a.fn(); });
    el.resultActions.appendChild(b);
  });
  openModal('modalResult');
}

// ---------- 평점 / 매출 ----------
function changeRating(delta) {
  if (!delta) return;
  state.rating = clamp(state.rating + delta, 0, CONFIG.maxRating);
  floatText(`평점 ${delta > 0 ? '+' : ''}${delta}`, delta > 0 ? 'info' : 'bad', 78, 30);
  render();
  if (state.rating <= 0) gameOver();
}

function addSales(amount) {
  if (!amount) return;
  state.sales = Math.max(0, state.sales + amount);
  floatText(`${amount > 0 ? '+' : ''}${won(amount)}원`, amount > 0 ? 'good' : 'bad', 52, 22);
  const st = STAGES[state.stage];
  if (!state.targetReached && state.sales >= st.target) {
    state.targetReached = true;
    later(() => showBanner('🎯 목표 매출 달성!'), 400);
  }
  render();
}

// ---------- 손님 ----------
function spawnCustomer() {
  if (!isPlaying() || state.customer) return;
  const st = STAGES[state.stage];
  const available = VILLAINS.filter((v) => !state.usedVillains.has(v.id));
  const villainTurn = available.length > 0
    && state.villainsThisStage < CONFIG.maxVillainsPerStage
    && state.normalsSinceVillain >= 2
    && Math.random() < st.villainChance;

  let c;
  if (villainTurn) {
    const v = pick(available);
    state.usedVillains.add(v.id);
    state.villainsThisStage++;
    state.normalsSinceVillain = 0;
    c = { type: 'villain', villain: v, handled: false, ready: false };
    el.customerSprite.innerHTML = personArt(v);
  } else {
    const kinds = randInt(1, st.maxKinds);
    const items = shuffle(PRODUCTS).slice(0, kinds).map((p) => ({ id: p.id, qty: randInt(1, st.maxQty) }));
    c = { type: 'normal', items, line: pick(CUSTOMER_LINES), ready: false };
    state.normalsSinceVillain++;
    el.customerSprite.innerHTML = personArt(pick(CUSTOMER_LOOKS));
  }
  state.customer = c;
  el.bubble.classList.add('hidden');
  el.counterItems.innerHTML = '';
  el.customer.className = `customer enter${c.type === 'villain' ? ' villain' : ''}`;
  SFX.door();
  render();

  later(() => {
    c.ready = true;
    if (c.type === 'villain') {
      SFX.villain();
      shakeScene();
      el.registerScreen.textContent = '!! WARNING !!';
    } else {
      SFX.scan();
      el.counterItems.innerHTML = c.items.map((it) => productIcon(it.id).repeat(Math.min(it.qty, 3))).join('');
      el.registerScreen.textContent = `ITEM ${c.items.reduce((a, it) => a + it.qty, 0)}`;
    }
    renderBubble();
    render();
    // 일반 손님이 계산대에 오면 계산 팝업 자동으로 열기 (재고 관리 중이면 방해하지 않음)
    if (c.type === 'normal' && !state.modal) openCalc();
  }, 950);
}

// 재고가 주문 수량보다 적으면 판매 불가
function basketLines(c) {
  return c.items.map((it) => {
    const p = productById(it.id);
    return { ...it, name: p.name, price: p.price, ok: state.stock[it.id] >= it.qty };
  });
}

function renderBubble() {
  const c = state.customer;
  if (!c || !c.ready) { el.bubble.classList.add('hidden'); return; }
  el.bubble.classList.remove('hidden');
  if (c.type === 'villain') {
    el.bubble.className = 'bubble villain-bubble';
    el.bubble.textContent = `💢 ${c.villain.name}`;
  } else {
    el.bubble.className = 'bubble';
    el.bubble.innerHTML = basketLines(c)
      .map((l) => `<span class="bi${l.ok ? '' : ' out'}">${productIcon(l.id)}×${l.qty}</span>`)
      .join('');
  }
}

function customerLeave(mood) {
  const c = state.customer;
  if (!c) return;
  state.customer = null;
  el.bubble.classList.add('hidden');
  if (mood === 'angry') {
    el.bubble.className = 'bubble villain-bubble';
    el.bubble.textContent = '😡 뭐야!';
    el.bubble.classList.remove('hidden');
  } else if (mood === 'happy') {
    el.bubble.className = 'bubble';
    el.bubble.textContent = '😊 감사합니다~';
    el.bubble.classList.remove('hidden');
  } else if (mood === 'sad') {
    el.bubble.className = 'bubble';
    el.bubble.textContent = '😞 없네...';
    el.bubble.classList.remove('hidden');
  }
  render();
  later(() => {
    el.customer.className = 'customer leave';
    el.counterItems.innerHTML = '';
    el.registerScreen.textContent = 'WELCOME';
  }, 700);
  later(spawnCustomer, 700 + randInt(900, 1800));
}

// ---------- 계산 ----------
function openCalc() {
  const c = state.customer;
  if (!isPlaying() || !c || !c.ready || c.type !== 'normal') return;
  SFX.click();
  const lines = basketLines(c);
  const sellable = lines.filter((l) => l.ok);

  el.calcList.innerHTML = lines.map((l) => `
    <li class="${l.ok ? '' : 'out'}">
      ${productIcon(l.id)}
      <span class="name">${l.name}</span>
      <span class="price">${won(l.price)}원 × ${l.qty}</span>
      ${l.ok ? '' : '<span class="tag-out">재고 부족</span>'}
    </li>`).join('');

  const noneSellable = sellable.length === 0;
  if (noneSellable) {
    el.calcNote.innerHTML = '⚠️ 판매할 수 있는 상품이 없어요! <b>재고 관리</b>에서 발주하거나 손님을 돌려보내세요.';
  } else if (sellable.length < lines.length) {
    el.calcNote.innerHTML = '⚠️ <b>재고 부족</b> 상품은 판매할 수 없어요. 나머지 금액만 계산하세요!';
  } else {
    el.calcNote.textContent = '손님이 가져온 상품의 총금액을 입력하세요.';
  }
  el.calcInputWrap.classList.toggle('hidden', noneSellable);
  el.keypad.classList.toggle('hidden', noneSellable);
  el.btnCalcSubmit.textContent = noneSellable ? '🙇 손님 돌려보내기' : '계산 완료';
  el.calcInput.value = '';
  el.calcMsg.textContent = '';
  openModal('modalCalc');
  if (!noneSellable && window.matchMedia('(pointer: fine)').matches) el.calcInput.focus();
}

function submitCalc() {
  const c = state.customer;
  if (!isPlaying() || !c || c.type !== 'normal' || state.modal !== 'modalCalc') return;
  const sellable = basketLines(c).filter((l) => l.ok);

  if (sellable.length === 0) {
    closeModal();
    customerLeave('sad');
    return;
  }

  const raw = el.calcInput.value.trim().replace(/,/g, '');
  if (raw === '') return calcError('금액을 입력해 주세요!');
  if (!/^\d+$/.test(raw)) return calcError('숫자만 입력할 수 있어요!');

  const answer = Number(raw);
  const total = sellable.reduce((sum, l) => sum + l.price * l.qty, 0);
  closeModal();

  if (answer === total) {
    sellable.forEach((l) => { state.stock[l.id] -= l.qty; });
    SFX.cash();
    el.registerScreen.textContent = `₩${won(total)}`;
    addSales(total);
    state.streak++;
    if (state.streak >= CONFIG.streakGoal) {
      state.streak = 0;
      later(() => { SFX.bonus(); floatText('⭐ 3연속 정답!', 'info', 50, 50); }, 300);
      changeRating(CONFIG.streakBonus);
    }
    render();
    customerLeave('happy');
  } else {
    state.streak = 0;
    SFX.wrong();
    shakeScene();
    el.registerScreen.textContent = 'ERROR';
    floatText(`정답: ${won(total)}원`, 'bad', 30, 55);
    el.customer.classList.add('angry');
    customerLeave('angry');
    changeRating(-CONFIG.wrongPenalty);
  }
}

function calcError(msg) {
  SFX.wrong();
  el.calcMsg.textContent = `⚠️ ${msg}`;
  el.modalCalc.classList.remove('shake');
  void el.modalCalc.offsetWidth;
  el.modalCalc.classList.add('shake');
}

function pressKey(k) {
  SFX.key();
  if (k === 'C') el.calcInput.value = '';
  else if (el.calcInput.value.length < 9) el.calcInput.value += k;
  el.calcMsg.textContent = '';
}

// ---------- 키보드 ----------
// 계산 팝업: 숫자키 입력, Backspace 지우기, Delete/C 전체 지우기, Enter 계산, Esc 닫기
// 게임 화면: Enter/Space 계산하기·손님 응대, 숫자키를 누르면 바로 계산 팝업을 열고 입력 시작
const isDigitKey = (key) => /^\d$/.test(key);

function handleKeydown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;

  if (state.modal === 'modalCalc') {
    handleCalcKey(e);
    return;
  }
  if (state.modal === 'modalStock') {
    if (e.key === 'Escape') closeModal();
    return;
  }
  if (state.modal || !isPlaying() || e.repeat) return;

  const c = state.customer;
  if (!c || !c.ready) return;
  const confirmKey = e.key === 'Enter' || e.key === ' ';
  if (c.type === 'normal' && (confirmKey || isDigitKey(e.key))) {
    e.preventDefault();
    openCalc();
    if (isDigitKey(e.key) && !el.calcInputWrap.classList.contains('hidden')) pressKey(e.key);
  } else if (c.type === 'villain' && confirmKey) {
    e.preventDefault();
    openVillain();
  }
}

function handleCalcKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!e.repeat) submitCalc();
    return;
  }
  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  // 입력칸에 포커스가 있으면 브라우저 기본 입력을 그대로 사용
  if (document.activeElement === el.calcInput) return;

  if (isDigitKey(e.key)) {
    e.preventDefault();
    pressKey(e.key);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    SFX.key();
    el.calcInput.value = el.calcInput.value.slice(0, -1);
    el.calcMsg.textContent = '';
  } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    pressKey('C');
  }
}

// ---------- 재고 ----------
function openStock() {
  if (!isPlaying()) return;
  SFX.click();
  renderStockList();
  openModal('modalStock');
}

function renderStockList() {
  el.stockList.innerHTML = PRODUCTS.map((p) => {
    const n = state.stock[p.id];
    return `
      <li class="${n === 0 ? 'zero' : ''}">
        ${productIcon(p.id)}
        <span class="name">${p.name}<br><small>${won(p.price)}원</small></span>
        <span class="stock-count">${n === 0 ? '품절' : `${n}개`}</span>
        <button type="button" class="btn btn-stock" data-order="${p.id}">발주 +${CONFIG.restockAmount}</button>
      </li>`;
  }).join('');
}

function restock(id) {
  if (!isPlaying() || !productById(id)) return;
  state.stock[id] += CONFIG.restockAmount;
  SFX.restock();
  renderStockList();
  render();
  renderBubble();
  const slot = el.shelves.querySelector(`[data-id="${id}"]`);
  if (slot) slot.classList.add('flash');
}

// ---------- 빌런 응대 ----------
function openVillain() {
  const c = state.customer;
  if (!isPlaying() || !c || !c.ready || c.type !== 'villain' || c.handled) return;
  SFX.click();
  const v = c.villain;
  el.villainPortrait.innerHTML = personArt(v);
  el.villainName.textContent = v.name;
  el.villainLine.textContent = v.line;
  el.villainChoices.innerHTML = '';
  el.villainChoices.classList.remove('hidden');
  el.villainResult.classList.add('hidden');
  v.choices.forEach((ch, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.innerHTML = `<b>${'ABC'[i]}.</b> ${ch.text}`;
    b.addEventListener('click', () => chooseVillain(i));
    el.villainChoices.appendChild(b);
  });
  openModal('modalVillain');
}

function chooseVillain(i) {
  const c = state.customer;
  // 같은 빌런 이벤트는 한 번만 처리
  if (!isPlaying() || !c || c.type !== 'villain' || c.handled) return;
  c.handled = true;
  el.villainChoices.querySelectorAll('button').forEach((b) => { b.disabled = true; });

  const ch = c.villain.choices[i];
  state.villainLog.push({ id: c.villain.id, grade: ch.grade });
  (ch.grade === 'bad' ? SFX.bad : SFX.good)();

  const deltas = [];
  if (ch.sales) deltas.push(`<span class="${ch.sales > 0 ? 'pos' : 'neg'}">매출 ${ch.sales > 0 ? '+' : ''}${won(ch.sales)}원</span>`);
  if (ch.rating) deltas.push(`<span class="${ch.rating > 0 ? 'pos' : 'neg'}">평점 ${ch.rating > 0 ? '+' : ''}${ch.rating}</span>`);
  if (ch.time) deltas.push(`<span class="neg">시간 ${ch.time}초</span>`);
  if (!deltas.length) deltas.push('<span>변화 없음</span>');
  el.villainResultText.textContent = ch.result;
  el.villainResultDelta.innerHTML = deltas.join('');
  el.villainChoices.classList.add('hidden');
  el.villainResult.classList.remove('hidden');

  addSales(ch.sales || 0);
  if (ch.time) state.timeLeft = Math.max(1, state.timeLeft + ch.time);
  render();
  changeRating(ch.rating || 0); // 0점이면 여기서 즉시 게임 오버
}

function closeVillain() {
  if (state.modal !== 'modalVillain') return;
  closeModal();
  const c = state.customer;
  if (isPlaying() && c && c.type === 'villain' && c.handled) customerLeave(null);
}

// ---------- 사운드 토글 ----------
function setSound(on) {
  Sound.on = on;
  el.btnSound.textContent = on ? '🔊' : '🔇';
  el.btnSound.setAttribute('aria-pressed', String(!on));
  try { localStorage.setItem('nightshift-sound', on ? '1' : '0'); } catch (e) { /* 저장 불가 환경 무시 */ }
}

// ---------- 초기화 ----------
function init() {
  [
    'hudStage', 'hudTime', 'hudTimeBox', 'hudTarget', 'hudSales', 'salesBar', 'hudRating', 'ratingBar', 'btnSound',
    'scene', 'shelves', 'customer', 'bubble', 'customerSprite', 'clerk', 'counterItems', 'registerScreen',
    'floaters', 'banner', 'clock', 'streak', 'hint',
    'btnCheckout', 'btnStock', 'btnServe', 'btnRetry',
    'overlay', 'modalStart', 'modalCalc', 'modalStock', 'modalVillain', 'modalResult', 'titleArt', 'btnStart',
    'calcList', 'calcNote', 'calcInputWrap', 'calcInput', 'calcMsg', 'keypad', 'btnCalcClose', 'btnCalcSubmit',
    'stockList', 'btnStockClose',
    'villainPortrait', 'villainName', 'villainLine', 'villainChoices', 'villainResult', 'villainResultText', 'villainResultDelta', 'btnVillainOk',
    'resultIcon', 'resultTitle', 'resultBody', 'resultActions',
  ].forEach((id) => { el[id] = $(id); });

  el.clerk.innerHTML = personArt(CLERK);
  el.titleArt.innerHTML = `<div class="person">${personArt(CLERK)}</div><div class="person">${personArt(VILLAINS[3])}</div>`;

  let soundOn = true;
  try { soundOn = localStorage.getItem('nightshift-sound') !== '0'; } catch (e) { /* 무시 */ }
  setSound(soundOn);

  // 첫 터치/클릭 때 오디오 활성화 (브라우저 자동재생 정책)
  document.addEventListener('pointerdown', () => Sound.unlock(), { passive: true });

  el.btnStart.addEventListener('click', () => { Sound.unlock(); SFX.click(); startGame(); });
  el.btnSound.addEventListener('click', () => { Sound.unlock(); setSound(!Sound.on); SFX.click(); });
  el.btnCheckout.addEventListener('click', openCalc);
  el.btnStock.addEventListener('click', openStock);
  el.btnServe.addEventListener('click', openVillain);
  el.btnRetry.addEventListener('click', () => { if (state.phase !== 'title') { SFX.click(); retryStage(); } });

  el.shelves.addEventListener('click', (e) => { if (e.target.closest('.slot')) openStock(); });

  el.keypad.addEventListener('click', (e) => {
    const k = e.target.closest('[data-key]');
    if (k) pressKey(k.dataset.key);
  });
  // 키패드를 눌러도 입력칸 포커스를 뺏지 않도록 (키보드 입력과 같이 쓸 수 있게)
  el.keypad.addEventListener('mousedown', (e) => e.preventDefault());
  el.calcInput.addEventListener('input', () => { el.calcMsg.textContent = ''; });
  el.btnCalcSubmit.addEventListener('click', submitCalc);
  el.btnCalcClose.addEventListener('click', () => { SFX.click(); closeModal(); });

  el.stockList.addEventListener('click', (e) => {
    const b = e.target.closest('[data-order]');
    if (b) restock(b.dataset.order);
  });
  el.btnStockClose.addEventListener('click', () => { SFX.click(); closeModal(); });
  el.btnVillainOk.addEventListener('click', () => { SFX.click(); closeVillain(); });

  document.addEventListener('keydown', handleKeydown);

  render();
  openModal('modalStart');
}

document.addEventListener('DOMContentLoaded', init);
