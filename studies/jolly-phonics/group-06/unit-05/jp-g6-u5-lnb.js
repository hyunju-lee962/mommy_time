// ══════════════════════════════════════════
//  Unit LNB (Left Navigation Bar)
//  모든 Step 파일에서 공통으로 사용
// ══════════════════════════════════════════

const LNB_STEPS = [
  { num:1,  icon:'🔊', title:'Sound Intro',       short:'소리 만나기' },
  { num:2,  icon:'✍️', title:'Letter Formation',  short:'글자 쓰기' },
  { num:3,  icon:'👂', title:'Sound Discrimination', short:'소리 구별' },
  { num:4,  icon:'📖', title:'Word Cards',         short:'단어 카드' },
  { num:5,  icon:'🔤', title:'Blending',           short:'소리 합치기' },
  { num:6,  icon:'📚', title:'Decodable Story',    short:'스토리 읽기' },
  { num:7,  icon:'⭐', title:'Tricky Words',       short:'트리키 워드' },
  { num:8,  icon:'🎮', title:'Games',              short:'게임' },
  { num:9,  icon:'💬', title:'Talk Together',      short:'함께 대화' },
  { num:10, icon:'📔', title:'My Journal',         short:'나의 저널' },
];

const DONE_KEY = 'jp_g6_u5_done';

function getLNBDone() {
  return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]'));
}

// 현재 step 번호 파악
function getCurrentStep() {
  const path = window.location.pathname;
  const match = path.match(/step-(\d+)\.html/);
  return match ? parseInt(match[1]) : 0;
}

// LNB CSS 주입
function injectLNBStyle() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── LNB 레이아웃 ── */
    body { overflow-x: hidden; }

    /* 기존 nav 조정 */
    nav { left: 0; z-index: 200; }

    /* LNB 사이드바 */
    #unitLNB {
      position: fixed;
      top: 56px; /* nav 높이 */
      left: 0;
      width: 220px;
      height: calc(100vh - 56px);
      background: #FEFCFF;
      border-right: 2px solid #5BA4CF66;
      overflow-y: auto;
      z-index: 150;
      padding: 16px 0 32px;
      transition: transform .3s ease;
    }

    /* LNB 헤더 */
    .lnb-header {
      padding: 0 16px 12px;
      border-bottom: 1px solid var(--soft);
      margin-bottom: 8px;
    }
    .lnb-unit-label {
      font-size: 10px; font-weight: 700; color: var(--br);
      text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px;
    }
    .lnb-unit-title {
      font-size: 16px; font-weight: 800; color: #1a4a7a;
    }
    .lnb-progress {
      margin-top: 8px;
    }
    .lnb-prog-track {
      background: #E0D0FF; border-radius: 6px; height: 6px; overflow: hidden;
    }
    .lnb-prog-fill {
      height: 100%; background: #1a4a7a; border-radius: 6px; transition: width .4s;
    }
    .lnb-prog-txt {
      font-size: 10px; color: var(--br); font-weight: 700; margin-top: 3px;
    }

    /* LNB 아이템 */
    .lnb-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; cursor: pointer;
      text-decoration: none; color: var(--dark);
      border-left: 3px solid transparent;
      transition: all .15s;
      font-size: 13px; font-weight: 600;
      position: relative;
    }
    .lnb-item:hover {
      background: #EBF4FFdd; border-left-color: #5BA4CF88;
    }
    .lnb-item.active {
      background: #EBF4FF;
      border-left-color: #1a4a7a;
      color: #1a4a7a;
      font-weight: 800;
    }
    .lnb-item.done {
      color: var(--g);
    }
    .lnb-item.done .lnb-check {
      display: flex;
    }
    .lnb-num {
      width: 26px; height: 26px; border-radius: 8px;
      background: #EBF4FF; color: #1a4a7a;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800; flex-shrink: 0;
      transition: all .15s;
    }
    .lnb-item.active .lnb-num {
      background: #1a4a7a; color: #fff;
    }
    .lnb-item.done .lnb-num {
      background: #2D9E68; color: #fff;
    }
    .lnb-icon { font-size: 14px; flex-shrink: 0; }
    .lnb-text { flex: 1; }
    .lnb-title { display: block; font-size: 12px; font-weight: 700; line-height: 1.2; }
    .lnb-short { display: block; font-size: 10px; opacity: .65; margin-top: 1px; }
    .lnb-check {
      display: none; width: 18px; height: 18px; border-radius: 50%;
      background: var(--g); color: #fff;
      align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0;
    }

    /* 콘텐츠 영역 밀기 */
    #lnbContentShift {
      margin-left: 220px;
      transition: margin-left .3s;
    }

    /* 모바일 토글 버튼 */
    #lnbToggle {
      display: none;
      position: fixed;
      bottom: 20px; right: 20px;
      width: 52px; height: 52px;
      border-radius: 50%;
      background: var(--p); color: #fff;
      border: none; font-size: 20px;
      cursor: pointer; z-index: 300;
      box-shadow: 0 4px 16px rgba(155,114,207,.4);
    }

    /* 모바일 오버레이 */
    #lnbOverlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,.3);
      z-index: 140;
    }
    #lnbOverlay.show { display: block; }

    /* 모바일 */
    @media (max-width: 768px) {
      #unitLNB {
        transform: translateX(-100%);
        top: 0; height: 100vh;
        padding-top: 72px;
        box-shadow: 4px 0 24px rgba(0,0,0,.12);
      }
      #unitLNB.open { transform: translateX(0); }
      #lnbContentShift { margin-left: 0 !important; }
      #lnbToggle { display: flex; align-items: center; justify-content: center; }
    }
  `;
  document.head.appendChild(style);
}

// LNB HTML 생성
function buildLNB() {
  const currentStep = getCurrentStep();
  const done = getLNBDone();

  // LNB 사이드바
  const lnb = document.createElement('div');
  lnb.id = 'unitLNB';

  // 헤더
  const pct = Math.round(done.size / LNB_STEPS.length * 100);
  lnb.innerHTML = `
    <div class="lnb-header">
      <div class="lnb-unit-label">Group 6 · Unit 5</div>
      <div class="lnb-unit-title">Compound Words</div>
      <div class="lnb-progress">
        <div class="lnb-prog-track">
          <div class="lnb-prog-fill" style="width:${pct}%"></div>
        </div>
        <div class="lnb-prog-txt">${done.size} / ${LNB_STEPS.length} 완료</div>
      </div>
    </div>`;

  // Step 목록
  LNB_STEPS.forEach(s => {
    const isDone = done.has(s.num);
    const isActive = s.num === currentStep;
    const a = document.createElement('a');
    a.href = `step-${String(s.num).padStart(2,'0')}.html`;
    a.className = 'lnb-item' + (isActive ? ' active' : '') + (isDone ? ' done' : '');
    a.innerHTML = `
      <div class="lnb-num">${isDone ? '✓' : s.num}</div>
      <span class="lnb-icon">${s.icon}</span>
      <span class="lnb-text">
        <span class="lnb-title">${s.title}</span>
        <span class="lnb-short">${s.short}</span>
      </span>
      <div class="lnb-check">✓</div>`;
    lnb.appendChild(a);
  });

  document.body.appendChild(lnb);

  // 오버레이 (모바일)
  const overlay = document.createElement('div');
  overlay.id = 'lnbOverlay';
  overlay.onclick = closeLNB;
  document.body.appendChild(overlay);

  // 토글 버튼 (모바일)
  const toggle = document.createElement('button');
  toggle.id = 'lnbToggle';
  toggle.innerHTML = '☰';
  toggle.onclick = toggleLNB;
  document.body.appendChild(toggle);
}

// 기존 콘텐츠에 margin-left 적용
function shiftContent() {
  // nav는 이미 fixed라 영향 없음
  // wrap 또는 body의 직접 자식 div들에 margin 적용
  const wrap = document.querySelector('.wrap') || document.querySelector('main');
  if (wrap) {
    wrap.id = wrap.id || 'lnbContentShift';
    wrap.style.marginLeft = '220px';
    wrap.style.transition = 'margin-left .3s';
  }

  // 모바일에서는 margin 제거
  function applyMobile() {
    if (window.innerWidth <= 768) {
      if (wrap) wrap.style.marginLeft = '0';
    } else {
      if (wrap) wrap.style.marginLeft = '220px';
    }
  }
  applyMobile();
  window.addEventListener('resize', applyMobile);
}

function toggleLNB() {
  const lnb = document.getElementById('unitLNB');
  const overlay = document.getElementById('lnbOverlay');
  const toggle = document.getElementById('lnbToggle');
  const isOpen = lnb.classList.contains('open');
  lnb.classList.toggle('open', !isOpen);
  overlay.classList.toggle('show', !isOpen);
  toggle.innerHTML = isOpen ? '☰' : '✕';
}

function closeLNB() {
  document.getElementById('unitLNB')?.classList.remove('open');
  document.getElementById('lnbOverlay')?.classList.remove('show');
  document.getElementById('lnbToggle').innerHTML = '☰';
}

// 초기화
function initLNB() {
  injectLNBStyle();
  buildLNB();
  shiftContent();
}

// DOM 준비 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLNB);
} else {
  initLNB();
}
