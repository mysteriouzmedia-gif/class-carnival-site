/* ClassCarnival email sign-up box.
 * Adds a small "get new tools by email" box near the bottom of the page and sends the
 * address to Kit (the email service). Nothing is sent unless the visitor presses Subscribe.
 * Hidden in fullscreen (theme.css), so it never shows on the projector.
 */
(function(){
  var ACTION = 'https://app.kit.com/forms/10003785/subscriptions';
  var KEY = 'cc-subscribed';
  var ko = (document.documentElement.lang || '').toLowerCase().indexOf('ko') === 0;
  var T = ko ? {
    title: '🎪 새 수업 도구 소식을 이메일로 받아 보세요',
    sub: '한 달에 한 번 정도, 새로 나온 도구와 계절 게임 소식만 보내 드려요. (이메일은 영어로 발송됩니다.)',
    label: '이메일 주소', ph: 'teacher@school.kr', btn: '구독하기', wait: '보내는 중…',
    small: '언제든 구독을 취소할 수 있어요.', privacy: '개인정보 처리방침',
    ok: '거의 다 됐어요! 받은 편지함에서 확인 메일의 링크를 눌러 주세요. 📬',
    bad: '이메일 주소를 다시 확인해 주세요.',
    fail: '지금은 연결할 수 없어요. 잠시 후 다시 시도해 주세요.'
  } : {
    title: '🎪 Get new classroom games by email',
    sub: 'About once a month: new tools and seasonal games for your class. No spam.',
    label: 'Email address', ph: 'you@school.edu', btn: 'Subscribe', wait: 'Sending…',
    small: 'Unsubscribe any time.', privacy: 'Privacy Policy',
    ok: 'Almost done! Check your inbox and click the link to confirm. 📬',
    bad: 'That email address doesn’t look right. Please check it.',
    fail: 'Couldn’t connect just now. Please try again in a moment.'
  };

  function subscribed(){ try{ return localStorage.getItem(KEY) === '1'; }catch(e){ return false; } }
  function remember(){ try{ localStorage.setItem(KEY, '1'); }catch(e){} }

  function build(){
    var main = document.querySelector('main');
    if(!main || document.getElementById('ccSignup') || subscribed()) return;
    var box = document.createElement('section');
    box.id = 'ccSignup'; box.className = 'cc-signup panel';
    box.innerHTML =
      '<h2>' + T.title + '</h2>' +
      '<p class="cc-signup-sub">' + T.sub + '</p>' +
      '<form novalidate>' +
        '<label class="cc-sr" for="ccSignupEmail">' + T.label + '</label>' +
        '<input type="email" id="ccSignupEmail" name="email_address" autocomplete="email" inputmode="email" placeholder="' + T.ph + '" required>' +
        '<input type="text" name="website" class="cc-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<button type="submit" class="btn-gold">' + T.btn + '</button>' +
      '</form>' +
      '<p class="cc-signup-msg" role="status" aria-live="polite"></p>' +
      '<p class="cc-signup-small">' + T.small + ' <a href="/privacy-policy.html">' + T.privacy + '</a></p>';
    var anchor = main.querySelector('.info-section');
    if(anchor) anchor.parentNode.insertBefore(box, anchor); else main.appendChild(box);

    var form = box.querySelector('form'), input = form.querySelector('input[type=email]'),
        hp = form.querySelector('.cc-hp'), btn = form.querySelector('button'), msg = box.querySelector('.cc-signup-msg');

    function say(text, cls){ msg.textContent = text; msg.className = 'cc-signup-msg ' + (cls || ''); }
    function finish(){
      remember();
      form.hidden = true; box.querySelector('.cc-signup-sub').hidden = true;
      say(T.ok, 'ok');
      try{ if(typeof gtag === 'function') gtag('event', 'sign_up', { method: 'email_box' }); }catch(e){}
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var email = (input.value || '').trim();
      if(hp.value){ finish(); return; }                       // bots fill the hidden field: pretend it worked, send nothing
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ say(T.bad, 'err'); input.focus(); return; }
      btn.disabled = true; btn.textContent = T.wait; say('');
      var fd = new FormData(); fd.append('email_address', email);
      fetch(ACTION, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function(r){ return r.json(); })
        .then(function(d){
          if(d && d.status === 'success'){ finish(); return; }
          btn.disabled = false; btn.textContent = T.btn; say(T.bad, 'err');
        })
        .catch(function(){ btn.disabled = false; btn.textContent = T.btn; say(T.fail, 'err'); });
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
