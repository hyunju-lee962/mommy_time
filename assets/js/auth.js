/**
 * Mommy Time — 접근 제어 스크립트 (auth.js)
 * Google Sheets 연동 + 코드 검증 + 자동 리다이렉트
 *
 * ⚠️  배포 전 반드시 설정:
 *     SHEET_ID    → Google Sheets ID (URL에서 복사)
 *     API_KEY     → Google Sheets API Key
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════
  //  ★ 설정값 — 배포 전 반드시 교체하세요 ★
  // ══════════════════════════════════════════════
  var CONFIG = {
    SHEET_ID:  'YOUR_SHEET_ID_HERE',          // Google Sheets ID
    API_KEY:   'YOUR_GOOGLE_API_KEY_HERE',    // Google API Key
    SHEET_TAB: 'students',                    // 시트 탭 이름
    LS_KEY:    'mt_auth',                     // localStorage 키
    LS_EXPIRY: 'mt_auth_exp',                 // 만료시각 키
    SESSION_HOURS: 24,                        // 세션 유지 시간
    GATE_PAGE: '/gate.html',                  // 코드 입력 페이지 경로
  };

  // ══════════════════════════════════════════════
  //  공개 API
  // ══════════════════════════════════════════════
  window.MommyAuth = {

    /** 현재 저장된 인증 정보 가져오기 */
    getSession: function () {
      try {
        var raw = localStorage.getItem(CONFIG.LS_KEY);
        var exp = localStorage.getItem(CONFIG.LS_EXPIRY);
        if (!raw || !exp) return null;
        if (Date.now() > parseInt(exp, 10)) {
          MommyAuth.clearSession();
          return null;
        }
        return JSON.parse(raw);
      } catch (e) { return null; }
    },

    /** 세션 저장 */
    saveSession: function (data) {
      var expiry = Date.now() + CONFIG.SESSION_HOURS * 3600 * 1000;
      localStorage.setItem(CONFIG.LS_KEY, JSON.stringify(data));
      localStorage.setItem(CONFIG.LS_EXPIRY, String(expiry));
    },

    /** 세션 삭제 (로그아웃) */
    clearSession: function () {
      localStorage.removeItem(CONFIG.LS_KEY);
      localStorage.removeItem(CONFIG.LS_EXPIRY);
    },

    /**
     * Google Sheets에서 코드 검증
     * @param {string} code  입력된 수강 코드
     * @param {function} cb  cb(err, studentData)
     */
    verifyCode: function (code, cb) {
      if (!code) return cb('코드를 입력해주세요.');

      // Sheets API URL
      var range  = encodeURIComponent(CONFIG.SHEET_TAB + '!A2:F100');
      var url    = 'https://sheets.googleapis.com/v4/spreadsheets/'
                 + CONFIG.SHEET_ID
                 + '/values/' + range
                 + '?key=' + CONFIG.API_KEY;

      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;

        if (xhr.status !== 200) {
          // API 키 or 시트 ID 오류
          console.error('Sheets API 오류:', xhr.status, xhr.responseText);
          return cb('서버 연결 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
        }

        try {
          var data   = JSON.parse(xhr.responseText);
          var rows   = data.values || [];
          var today  = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          var found  = null;

          for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            // A: code, B: name, C: expires, D: groups, E: active
            if (!row[0]) continue;
            if (row[0].trim().toUpperCase() === code.trim().toUpperCase()) {
              found = {
                code:    row[0].trim(),
                name:    row[1] || '',
                expires: row[2] || '2099-12-31',
                groups:  row[3] || 'ALL',
                active:  (row[4] || 'TRUE').toUpperCase() === 'TRUE',
                memo:    row[5] || '',
              };
              break;
            }
          }

          if (!found)            return cb('코드가 올바르지 않아요. 다시 확인해주세요.');
          if (!found.active)     return cb('비활성화된 코드예요. 선생님께 문의해주세요.');
          if (found.expires < today) return cb('만료된 코드예요. 선생님께 문의해주세요.');

          cb(null, found);

        } catch (e) {
          console.error('파싱 오류:', e);
          cb('오류가 발생했어요. 잠시 후 다시 시도해주세요.');
        }
      };
      xhr.send();
    },

    /**
     * 현재 페이지가 접근 가능한지 확인
     * 그룹 제한 체크 (예: groups="G1,G2" 이면 G3 이상 접근 불가)
     * @param {string} pageGroup  현재 페이지의 그룹 (예: 'G3')
     */
    canAccess: function (pageGroup) {
      var session = MommyAuth.getSession();
      if (!session) return false;
      if (!pageGroup) return true;              // 그룹 제한 없는 페이지
      var allowed = session.groups.toUpperCase();
      if (allowed === 'ALL') return true;
      return allowed.split(',').map(function (g) {
        return g.trim().toUpperCase();
      }).indexOf(pageGroup.toUpperCase()) >= 0;
    },

    /**
     * 페이지 접근 제어 — 미인증 또는 접근 불가면 게이트로 리다이렉트
     * 각 학습 페이지 상단에 호출
     * @param {string} pageGroup  현재 페이지의 그룹 (예: 'G3'), 없으면 그룹 체크 안 함
     */
    guard: function (pageGroup) {
      var session = MommyAuth.getSession();
      if (!session) {
        // 현재 URL을 redirect 파라미터로 넘김
        var redirect = encodeURIComponent(window.location.pathname);
        window.location.replace(CONFIG.GATE_PAGE + '?redirect=' + redirect);
        return;
      }
      if (pageGroup && !MommyAuth.canAccess(pageGroup)) {
        window.location.replace(CONFIG.GATE_PAGE + '?error=access');
        return;
      }
      // 인증 성공 — 페이지 상단에 수강생 이름 표시 (선택)
      MommyAuth._showBadge(session);
    },

    /** 인증 뱃지 UI 삽입 (nav 오른쪽에 이름 + 로그아웃 버튼) */
    _showBadge: function (session) {
      // nav 로드 후 삽입 (DOMContentLoaded)
      function insert() {
        var nav = document.querySelector('nav');
        if (!nav) return;
        if (document.getElementById('mt-auth-badge')) return;

        var badge = document.createElement('div');
        badge.id = 'mt-auth-badge';
        badge.style.cssText = [
          'display:flex', 'align-items:center', 'gap:8px',
          'font-family:Nunito,sans-serif', 'font-size:12px',
        ].join(';');

        var name = document.createElement('span');
        name.style.cssText = 'font-weight:700;color:#8B6F5E;';
        name.textContent = session.name ? '👋 ' + session.name : '👋 수강생';

        var btn = document.createElement('button');
        btn.textContent = '로그아웃';
        btn.style.cssText = [
          'padding:4px 10px', 'border-radius:8px',
          'border:1.5px solid #EAE0D5', 'background:#fff',
          'font-family:Nunito,sans-serif', 'font-size:11px',
          'font-weight:700', 'cursor:pointer', 'color:#8B6F5E',
        ].join(';');
        btn.onclick = function () {
          MommyAuth.clearSession();
          window.location.replace(CONFIG.GATE_PAGE);
        };

        badge.appendChild(name);
        badge.appendChild(btn);
        nav.appendChild(badge);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insert);
      } else {
        insert();
      }
    },
  };

})();

// ══════════════════════════════════════════════
//  콘텐츠 잠금 확인 (Sheets content 탭 조회)
// ══════════════════════════════════════════════
(function () {

  /**
   * 콘텐츠 잠금 여부 확인 후 잠겨 있으면 잠금 화면 표시
   * 각 학습 페이지에서 MommyAuth.guard() 다음에 자동 호출
   *
   * @param {string} contentId  예: 'G1', 'G1-U1', 'G1-U1-S01'
   */
  MommyAuth.checkLock = function (contentId) {
    if (!contentId) return;
    if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE') return; // 미설정 시 스킵

    var range  = encodeURIComponent('content!A2:D100');
    var url    = 'https://sheets.googleapis.com/v4/spreadsheets/'
               + CONFIG.SHEET_ID + '/values/' + range
               + '?key=' + CONFIG.API_KEY;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4 || xhr.status !== 200) return;
      try {
        var rows = JSON.parse(xhr.responseText).values || [];
        var locked = false;

        // 현재 ID 및 상위 ID 모두 잠금 체크 (G1-U1-S01 → G1-U1 → G1 순)
        var parts = contentId.split('-');
        for (var depth = parts.length; depth >= 1; depth--) {
          var checkId = parts.slice(0, depth).join('-');
          for (var i = 0; i < rows.length; i++) {
            if (rows[i][0] === checkId && (rows[i][3] || '').toUpperCase() === 'TRUE') {
              locked = true; break;
            }
          }
          if (locked) break;
        }

        if (locked) MommyAuth._showLockScreen(contentId);
      } catch (e) { /* 오류 시 무시하고 콘텐츠 표시 */ }
    };
    xhr.send();
  };

  /** 잠금 화면 오버레이 표시 */
  MommyAuth._showLockScreen = function (contentId) {
    function show() {
      if (document.getElementById('mt-lock-screen')) return;
      var overlay = document.createElement('div');
      overlay.id = 'mt-lock-screen';
      overlay.style.cssText = [
        'position:fixed','top:0','left:0','width:100%','height:100%',
        'background:rgba(44,32,22,.92)','z-index:9999',
        'display:flex','align-items:center','justify-content:center',
        'font-family:Nunito,sans-serif','padding:20px',
      ].join(';');

      var box = document.createElement('div');
      box.style.cssText = [
        'background:#fff','border-radius:24px','padding:40px 36px',
        'max-width:400px','width:100%','text-align:center',
      ].join(';');
      box.innerHTML = [
        '<div style="font-size:52px;margin-bottom:16px">🔒</div>',
        '<div style="font-size:18px;font-weight:800;color:#2C2016;margin-bottom:8px">아직 잠긴 콘텐츠예요</div>',
        '<div style="font-size:13px;color:#8B6F5E;line-height:1.7;margin-bottom:24px">',
          '선생님이 아직 이 내용을 공개하지 않았어요.<br>',
          '다음 수업 때 열릴 거예요! 조금만 기다려주세요 😊',
        '</div>',
        '<button id="mt-lock-back" style="',
          'padding:13px 28px;border-radius:14px;background:#F4845F;color:#fff;',
          'border:none;font-family:Nunito,sans-serif;font-size:14px;font-weight:700;cursor:pointer;',
        '">← 돌아가기</button>',
      ].join('');

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      document.getElementById('mt-lock-back').onclick = function () {
        window.history.back();
      };
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', show);
    } else {
      show();
    }
  };

})();

// ══════════════════════════════════════════════
//  학습 진행률 Sheets 기록
// ══════════════════════════════════════════════
MommyAuth.logProgress = function (contentId) {
  var session = MommyAuth.getSession();
  if (!session) return;
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE') return;

  // GAS_URL 은 auth.js에서도 공유해서 쓸 수 있게 window에서 찾음
  var gasUrl = (window.AdminCfg && window.AdminCfg.GAS_URL) || CONFIG.GAS_URL || '';
  if (!gasUrl || gasUrl === 'YOUR_GAS_URL_HERE') return;

  var payload = JSON.stringify({
    action: 'logProgress',
    data: {
      code:      session.code,
      name:      session.name,
      contentId: contentId,
      completedAt: new Date().toISOString(),
    }
  });

  var xhr = new XMLHttpRequest();
  xhr.open('POST', gasUrl, true);
  xhr.setRequestHeader('Content-Type', 'text/plain');
  xhr.send(payload);
  // 응답 무시 (비동기, fire-and-forget)
};
