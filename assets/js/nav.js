/**
 * Mommy Time — nav.js
 * 공통 네비게이션 렌더링 + 로그인 모달 + 세션 관리
 */

(function () {
  'use strict';

  /* ── 설정 ── */
  var NAV_LINKS = [
    { label: '엄마시간이란', href: '/pages/about.html' },
    { label: '배움 여정',    href: '/pages/journey.html' },
    { label: '참여 안내',    href: '/pages/join.html' },
  ];

  var SESSION_KEY    = 'mt_session';
  var SESSION_EXPIRY = 'mt_session_exp';
  var SESSION_HOURS  = 24 * 7; // 7일 유지

  /* ── 세션 유틸 ── */
  var Session = {
    get: function () {
      try {
        var raw = localStorage.getItem(SESSION_KEY);
        var exp = localStorage.getItem(SESSION_EXPIRY);
        if (!raw || !exp) return null;
        if (Date.now() > parseInt(exp, 10)) { Session.clear(); return null; }
        return JSON.parse(raw);
      } catch (e) { return null; }
    },
    save: function (data) {
      var expiry = Date.now() + SESSION_HOURS * 3600 * 1000;
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      localStorage.setItem(SESSION_EXPIRY, String(expiry));
    },
    clear: function () {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY);
    },
  };

  /* ── 네비 렌더링 ── */
  function renderNav() {
    var session  = Session.get();
    var current  = window.location.pathname;
    var isRoot   = current === '/' || current.endsWith('index.html');
    var prefix   = isRoot ? '' : (current.includes('/pages/') ? '..' : '.');

    // 경로 보정 함수
    function fixHref(href) {
      if (isRoot) return href.replace(/^\//, '');
      if (current.includes('/pages/')) return href.replace(/^\/pages\//, '').replace(/^\//, '../');
      return href.replace(/^\//, '../');
    }

    var linksHtml = NAV_LINKS.map(function (link) {
      var active = current.includes(link.href.replace('/pages/', '').replace('/', ''));
      return '<li><a href="' + fixHref(link.href) + '"' + (active ? ' class="active"' : '') + '>' + link.label + '</a></li>';
    }).join('');

    var rightHtml = session
      ? '<div class="nav-user">' +
          '<span class="nav-user-name">👋 ' + session.nickname + '님</span>' +
          '<button class="nav-logout-btn" onclick="MommyNav.logout()">로그아웃</button>' +
        '</div>'
      : '<button class="nav-login-btn" onclick="MommyNav.openLogin()">로그인</button>';

    var logoHref = isRoot ? 'index.html' : fixHref('/index.html');

    var navHtml =
      '<nav class="nav">' +
        '<a href="' + logoHref + '" class="nav-logo">엄마<span>시간</span></a>' +
        '<ul class="nav-links" id="navLinks">' + linksHtml + '</ul>' +
        '<div class="nav-right">' +
          rightHtml +
          '<button class="nav-toggle" id="navToggle" onclick="MommyNav.toggleMenu()" aria-label="메뉴">' +
            '<span></span><span></span><span></span>' +
          '</button>' +
        '</div>' +
      '</nav>';

    // body 시작 직후에 삽입
    document.body.insertAdjacentHTML('afterbegin', navHtml);
  }

  /* ── 로그인 모달 렌더링 ── */
  function renderModal() {
    var modalHtml =
      '<div class="modal-overlay" id="loginModal">' +
        '<div class="modal-box">' +
          '<button class="modal-close" onclick="MommyNav.closeLogin()">✕</button>' +

          /* Step 1: 코드 입력 */
          '<div class="modal-step active" id="stepCode">' +
            '<div class="modal-logo">엄마<span>시간</span></div>' +
            '<p class="modal-sub">수강 코드를 입력해주세요</p>' +
            '<input type="password" id="codeInput" class="modal-input" placeholder="수강 코드" maxlength="20" autocomplete="off">' +
            '<div class="modal-error" id="codeError"></div>' +
            '<div class="modal-loading" id="codeLoading">확인 중...</div>' +
            '<button class="modal-btn" id="codeBtn" onclick="MommyNav.submitCode()">확인</button>' +
          '</div>' +

          /* Step 2: 닉네임 설정 (처음 로그인 시) */
          '<div class="modal-step" id="stepNickname">' +
            '<div class="modal-logo">엄마<span>시간</span></div>' +
            '<p class="modal-sub">어떻게 불러드릴까요?<br>닉네임을 설정해주세요 😊</p>' +
            '<input type="text" id="nicknameInput" class="modal-input" placeholder="닉네임 (예: 민지맘)" maxlength="10" autocomplete="off">' +
            '<div class="modal-error" id="nicknameError"></div>' +
            '<button class="modal-btn" onclick="MommyNav.submitNickname()">시작하기</button>' +
          '</div>' +

          /* Step 3: 완료 */
          '<div class="modal-step" id="stepDone">' +
            '<div style="text-align:center;padding:20px 0;">' +
              '<div style="font-size:52px;margin-bottom:16px;">👋</div>' +
              '<p style="font-family:\'Noto Serif KR\',serif;font-size:20px;font-weight:600;margin-bottom:8px;" id="welcomeMsg"></p>' +
              '<p style="font-size:14px;color:var(--brown);line-height:1.7;">엄마시간에 오신 것을 환영해요!<br>아이와 함께하는 시간을 시작해봐요 💛</p>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Enter 키 지원
    document.getElementById('codeInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') MommyNav.submitCode();
    });
    document.getElementById('nicknameInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') MommyNav.submitNickname();
    });

    // 모달 외부 클릭 닫기
    document.getElementById('loginModal').addEventListener('click', function (e) {
      if (e.target === this) MommyNav.closeLogin();
    });
  }

  /* ── 공개 API ── */
  window.MommyNav = {

    openLogin: function () {
      var modal = document.getElementById('loginModal');
      if (modal) {
        modal.classList.add('open');
        // Step 초기화
        document.querySelectorAll('.modal-step').forEach(function (s) { s.classList.remove('active'); });
        document.getElementById('stepCode').classList.add('active');
        document.getElementById('codeInput').value = '';
        document.getElementById('codeError').classList.remove('show');
        setTimeout(function () { document.getElementById('codeInput').focus(); }, 100);
      }
    },

    closeLogin: function () {
      var modal = document.getElementById('loginModal');
      if (modal) modal.classList.remove('open');
    },

    toggleMenu: function () {
      var links = document.getElementById('navLinks');
      if (links) links.classList.toggle('open');
    },

    submitCode: function () {
      var code    = document.getElementById('codeInput').value.trim();
      var errEl   = document.getElementById('codeError');
      var loadEl  = document.getElementById('codeLoading');
      var btn     = document.getElementById('codeBtn');

      errEl.classList.remove('show');
      if (!code) {
        errEl.textContent = '수강 코드를 입력해주세요.';
        errEl.classList.add('show');
        return;
      }

      btn.disabled = true;
      loadEl.classList.add('show');

      MommyAuth.verifyCode(code, function (err, student) {
        btn.disabled = false;
        loadEl.classList.remove('show');

        if (err) {
          errEl.textContent = err;
          errEl.classList.add('show');
          document.getElementById('codeInput').classList.add('error');
          return;
        }

        // 기존 닉네임 있으면 바로 로그인
        var savedNick = localStorage.getItem('mt_nick_' + student.code);
        if (savedNick) {
          student.nickname = savedNick;
          Session.save(student);
          MommyNav._welcomeAndClose(savedNick);
        } else {
          // 닉네임 설정 단계로
          window._pendingStudent = student;
          document.querySelectorAll('.modal-step').forEach(function (s) { s.classList.remove('active'); });
          document.getElementById('stepNickname').classList.add('active');
          setTimeout(function () { document.getElementById('nicknameInput').focus(); }, 100);
        }
      });
    },

    submitNickname: function () {
      var nick    = document.getElementById('nicknameInput').value.trim();
      var errEl   = document.getElementById('nicknameError');

      errEl.classList.remove('show');
      if (!nick) {
        errEl.textContent = '닉네임을 입력해주세요.';
        errEl.classList.add('show');
        return;
      }
      if (nick.length > 10) {
        errEl.textContent = '10자 이내로 입력해주세요.';
        errEl.classList.add('show');
        return;
      }

      var student = window._pendingStudent;
      student.nickname = nick;
      localStorage.setItem('mt_nick_' + student.code, nick);
      Session.save(student);
      MommyNav._welcomeAndClose(nick);
    },

    _welcomeAndClose: function (nickname) {
      // 완료 화면
      document.querySelectorAll('.modal-step').forEach(function (s) { s.classList.remove('active'); });
      document.getElementById('stepDone').classList.add('active');
      document.getElementById('welcomeMsg').textContent = nickname + '님, 안녕하세요!';

      // 1.8초 후 닫고 nav 업데이트
      setTimeout(function () {
        MommyNav.closeLogin();
        MommyNav._updateNavUser(nickname);
      }, 1800);
    },

    _updateNavUser: function (nickname) {
      var navRight = document.querySelector('.nav-right');
      if (!navRight) return;
      var loginBtn = navRight.querySelector('.nav-login-btn');
      if (loginBtn) {
        var userDiv = document.createElement('div');
        userDiv.className = 'nav-user';
        userDiv.innerHTML =
          '<span class="nav-user-name">👋 ' + nickname + '님</span>' +
          '<button class="nav-logout-btn" onclick="MommyNav.logout()">로그아웃</button>';
        loginBtn.replaceWith(userDiv);
      }
    },

    logout: function () {
      Session.clear();
      window.location.reload();
    },

    getSession: function () { return Session.get(); },
  };

  /* ── 스크롤 애니메이션 ── */
  function initReveal() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          setTimeout(function () { e.target.classList.add('visible'); }, i * 80);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
  }

  /* ── 초기화 ── */
  document.addEventListener('DOMContentLoaded', function () {
    renderNav();
    renderModal();
    initReveal();
  });

})();
