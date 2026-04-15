// ── 언어 전환 ──
let currentLang = 'ko';
function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-ko]').forEach(el => {
    el.textContent = lang === 'ko' ? el.dataset.ko : el.dataset.en;
  });
  document.querySelectorAll('[data-ko-html]').forEach(el => {
    el.innerHTML = lang === 'ko' ? el.dataset.koHtml : el.dataset.enHtml;
  });
}

// ── TTS (영어 읽어주기) ──
let speaking = false;
function speak(text, btn) {
  if (!('speechSynthesis' in window)) { alert('이 브라우저는 읽기 기능을 지원하지 않아요.'); return; }
  if (speaking) { window.speechSynthesis.cancel(); speaking = false; if (btn) btn.classList.remove('speaking'); return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US'; utter.rate = 0.85; utter.pitch = 1.1;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) || voices.find(v => v.lang.startsWith('en'));
  if (en) utter.voice = en;
  utter.onstart = () => { speaking = true; if (btn) btn.classList.add('speaking'); };
  utter.onend = utter.onerror = () => { speaking = false; if (btn) btn.classList.remove('speaking'); };
  window.speechSynthesis.speak(utter);
}

function speakBtn(el, text) { speak(text, el); }

// ── 스크롤 애니메이션 ──
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── 출석 체크 (Google Sheets) ──
const SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
async function checkAttendance(name, study, week) {
  try {
    await fetch(SHEET_URL, { method:'POST', mode:'no-cors', body: JSON.stringify({ name, study, week, date: new Date().toLocaleDateString('ko-KR') }) });
    showCelebration(name);
  } catch(e) { showCelebration(name); }
}

// ── 축하 연출 ──
function showCelebration(name) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#FFFCF8;border-radius:28px;padding:48px 40px;text-align:center;max-width:360px;width:90%;animation:fadeUp .4s ease;">
      <div style="font-size:64px;margin-bottom:16px">🎉</div>
      <h2 style="font-family:'Noto Serif KR',serif;font-size:22px;font-weight:400;margin-bottom:8px;color:#2C1F14">${name}님, 오늘도 수고했어요!</h2>
      <p style="font-size:14px;color:#8B6F5E;line-height:1.7;margin-bottom:28px">엄마랑 함께한 오늘이<br>소중한 추억이 됐을 거예요 💛</p>
      <button onclick="this.closest('div[style]').remove()" style="background:#D4845A;color:#fff;border:none;padding:14px 36px;border-radius:30px;font-size:15px;cursor:pointer;font-family:inherit;">확인</button>
    </div>`;
  document.body.appendChild(overlay);
}

// ── 음성 목록 미리 로드 ──
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
