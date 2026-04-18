/**
 * Mommy Time — auth.js
 * Google Sheets 수강 코드 검증 + 콘텐츠 잠금
 *
 * ⚠️  배포 전 설정:
 *     SHEET_ID  → Google Sheets ID
 *     API_KEY   → Google API Key
 *     GAS_URL   → Google Apps Script URL
 */

(function () {
  'use strict';

  window.MT_CONFIG = {
    SHEET_ID: '19QbpmskE5-BJTMAgHF9hbUtG5iVqltiJP2nhN1WqkyM',
    API_KEY:  'AIzaSyAXJD6JGwpbujmeGqvQnkXWCpThIdS1KBY',
    GAS_URL:  'https://script.google.com/macros/s/AKfycbxKqtDRMEoRXhjWi7ko-_fyaTHlGAgcTwgozZR3KUnV_Y9oB4ZL_UxOK8PukZBb5zaH/exec',
  };

  window.MommyAuth = {

    verifyCode: function (code, cb) {
      if (!code) return cb('수강 코드를 입력해주세요.');
      var cfg = window.MT_CONFIG;

      // 설정 미완료 시 테스트 모드
      if (cfg.SHEET_ID === 'YOUR_SHEET_ID_HERE') {
        if (code.toUpperCase() === 'floralhj') {
          return cb(null, { code:'floralhj', name:'serina', expires:'2099-12-31', groups:'ALL', active:true });
        }
        return cb('코드가 올바르지 않아요. 다시 확인해주세요.');
      }

      var range = encodeURIComponent('students!A2:F200');
      var url   = 'https://sheets.googleapis.com/v4/spreadsheets/'
                + cfg.SHEET_ID + '/values/' + range + '?key=' + cfg.API_KEY;

      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) return cb('서버 연결 오류가 발생했어요.');
        try {
          var rows  = JSON.parse(xhr.responseText).values || [];
          var today = new Date().toISOString().slice(0, 10);
          var found = null;
          for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (r[0] && r[0].trim().toUpperCase() === code.trim().toUpperCase()) {
              found = { code:r[0].trim(), name:r[1]||'', expires:r[2]||'2099-12-31', groups:r[3]||'ALL', active:(r[4]||'TRUE').toUpperCase()==='TRUE' };
              break;
            }
          }
          if (!found)                return cb('코드가 올바르지 않아요.');
          if (!found.active)         return cb('비활성화된 코드예요. 선생님께 문의해주세요.');
          if (found.expires < today) return cb('만료된 코드예요. 선생님께 문의해주세요.');
          cb(null, found);
        } catch (e) { cb('오류가 발생했어요. 잠시 후 다시 시도해주세요.'); }
      };
      xhr.send();
    },

    getSession: function () {
      try {
        var raw = localStorage.getItem('mt_session');
        var exp = localStorage.getItem('mt_session_exp');
        if (!raw || !exp) return null;
        if (Date.now() > parseInt(exp, 10)) {
          localStorage.removeItem('mt_session');
          localStorage.removeItem('mt_session_exp');
          return null;
        }
        return JSON.parse(raw);
      } catch (e) { return null; }
    },

    // 무료 체험 범위 — 각 카테고리 첫 번째 Unit
    FREE_UNITS: ['G1-U1', 'MSB-W1'],

    canAccess: function (contentId) {
      var isFree = MommyAuth.FREE_UNITS.some(function (u) {
        return contentId.startsWith(u);
      });
      if (isFree) return true;

      var session = MommyAuth.getSession();
      if (!session) return false;

      var allowed = (session.groups || 'ALL').toUpperCase();
      if (allowed === 'ALL') return true;

      var gMatch = contentId.match(/^G(\d)/);
      if (!gMatch) return true;
      return allowed.split(',').map(function (g) { return g.trim(); })
                    .indexOf('G' + gMatch[1]) >= 0;
    },

    guard: function (contentId) {
      if (MommyAuth.canAccess(contentId)) return;
      MommyAuth._showLock();
    },

    _showLock: function () {
      function show() {
        if (document.getElementById('mt-lock')) return;
        var el = document.createElement('div');
        el.id = 'mt-lock';
        el.style.cssText = 'position:fixed;inset:0;background:rgba(44,31,20,.88);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:"Noto Sans KR",sans-serif;padding:20px;';
        el.innerHTML =
          '<div style="background:#FFFCF8;border-radius:24px;padding:40px 36px;max-width:380px;width:100%;text-align:center;">' +
            '<div style="font-size:48px;margin-bottom:16px;">🔒</div>' +
            '<p style="font-family:\'Noto Serif KR\',serif;font-size:18px;font-weight:600;margin-bottom:8px;color:#2C1F14;">아직 잠긴 콘텐츠예요</p>' +
            '<p style="font-size:13px;color:#8B6F5E;line-height:1.7;margin-bottom:24px;">선생님이 아직 이 내용을 공개하지 않았어요.<br>다음 수업 때 열릴 거예요 😊</p>' +
            '<button onclick="history.back()" style="padding:12px 28px;border-radius:30px;background:#D4845A;color:#fff;border:none;font-family:inherit;font-size:14px;cursor:pointer;">← 돌아가기</button>' +
          '</div>';
        document.body.appendChild(el);
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', show);
      } else { show(); }
    },

    logProgress: function (contentId) {
      var session = MommyAuth.getSession();
      if (!session) return;
      var gasUrl = window.MT_CONFIG.GAS_URL;
      if (!gasUrl || gasUrl === 'YOUR_GAS_URL_HERE') return;
      var xhr = new XMLHttpRequest();
      xhr.open('POST', gasUrl, true);
      xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.send(JSON.stringify({
        action: 'logProgress',
        data: { code:session.code, name:session.nickname||session.name, contentId:contentId, completedAt:new Date().toISOString() },
      }));
    },
  };

})();
