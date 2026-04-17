/**
 * Mommy Time — main.js
 * 공통 유틸리티 (TTS, 언어 전환, 스크롤 애니메이션)
 */

/* ── TTS (영어 읽어주기) ── */
var speaking = false;

function speak(text, btn) {
  if (!('speechSynthesis' in window)) return;
  if (speaking) {
    window.speechSynthesis.cancel();
    speaking = false;
    if (btn) btn.classList.remove('speaking');
    return;
  }
  var utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-GB'; utter.rate = 0.85;
  var voices = window.speechSynthesis.getVoices();
  var voice = voices.find(function(v) { return v.lang === 'en-GB'; })
           || voices.find(function(v) { return v.lang.startsWith('en'); });
  if (voice) utter.voice = voice;
  utter.onstart = function() { speaking = true; if (btn) btn.classList.add('speaking'); };
  utter.onend = utter.onerror = function() { speaking = false; if (btn) btn.classList.remove('speaking'); };
  window.speechSynthesis.speak(utter);
}

function speakBtn(el, text) { speak(text, el); }

/* ── 언어 전환 ── */
var currentLang = 'ko';

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  document.querySelectorAll('[data-ko]').forEach(function(el) {
    el.textContent = lang === 'ko' ? el.dataset.ko : el.dataset.en;
  });
  document.querySelectorAll('[data-ko-html]').forEach(function(el) {
    el.innerHTML = lang === 'ko' ? el.dataset.koHtml : el.dataset.enHtml;
  });
}

/* ── 음성 목록 미리 로드 ── */
window.speechSynthesis.onvoiceschanged = function() {
  window.speechSynthesis.getVoices();
};
