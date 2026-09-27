/* ClassCarnival timer extras — shared by the Countdown and Stopwatch.
 *
 *   const buddy = CCTimerFun.buddy(hostEl)        // cheering character + speech bubble + class-star counter
 *   buddy.say(text, mood, ms)                      // mood: happy, focus, wow, worried, panic, party, sleep, cool
 *   buddy.mood(mood)
 *   const v = CCTimerFun.visitors(stageEl, buddy)  // surprise flyers the class can "catch" for a star
 *   v.start(); v.stop(); v.catchNow();             // catchNow = keyboard shortcut (S)
 *   CCTimerFun.pick(array)
 */
(function(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const css = `
  .tf-row{ display:flex; align-items:center; justify-content:center; gap: 12px; min-height: 64px; width: min(100%, 640px); margin: 4px auto 0; }
  .tf-buddy{ font-size: 50px; line-height: 1; cursor: pointer; user-select:none; animation: tfBob 1.6s ease-in-out infinite; transform-origin: 50% 100%; }
  .tf-buddy.focus{ animation-duration: 2.2s; }
  .tf-buddy.worried{ animation: tfWobble .5s ease-in-out infinite; }
  .tf-buddy.panic{ animation: tfPanic .18s linear infinite; }
  .tf-buddy.party{ animation: tfJump .5s ease-in-out infinite; }
  .tf-buddy.sleep{ animation: tfBob 4s ease-in-out infinite; opacity: .75; }
  @keyframes tfBob{ 50%{ transform: translateY(-6px) rotate(-3deg); } }
  @keyframes tfWobble{ 25%{ transform: rotate(-8deg); } 75%{ transform: rotate(8deg); } }
  @keyframes tfPanic{ 0%{ transform: translate(-2px,0) rotate(-6deg); } 50%{ transform: translate(2px,-3px) rotate(6deg); } 100%{ transform: translate(-2px,0) rotate(-6deg); } }
  @keyframes tfJump{ 50%{ transform: translateY(-16px) scale(1.08); } }
  .tf-bubble{ position:relative; background: #fffdf7; color: #1d2433; font-weight: 800; font-size: clamp(15px, 2vw, 20px); padding: 10px 16px; border-radius: 18px;
    max-width: 420px; opacity: 0; transform: scale(.6); transform-origin: 0 50%; transition: opacity .25s ease, transform .35s cubic-bezier(.3,1.6,.5,1); }
  .tf-bubble::before{ content:''; position:absolute; left: -10px; top: 50%; margin-top: -8px; border: 8px solid transparent; border-right: 10px solid #fffdf7; border-left: 0; }
  .tf-bubble.show{ opacity: 1; transform: none; }
  .tf-bubble.panic{ background: #ff6b5b; color: #fff; } .tf-bubble.panic::before{ border-right-color: #ff6b5b; }
  .tf-bubble.party{ background: #ffb627; } .tf-bubble.party::before{ border-right-color: #ffb627; }
  .tf-stars{ margin-left: auto; font-weight: 800; color: var(--gold, #ffb627); font-size: 15px; white-space: nowrap; background: rgba(255,182,39,.1);
    border: 1px solid rgba(255,182,39,.35); padding: 6px 12px; border-radius: 20px; cursor: default; }
  .tf-stars.bump{ animation: tfBump .5s cubic-bezier(.3,1.6,.5,1); }
  .tf-stars button{ background:none; border:none; color: var(--cream-dim, #aab); font-size: 11px; text-decoration: underline; padding: 0 0 0 6px; cursor:pointer; }
  @keyframes tfBump{ 0%{ transform: scale(1.5); } 100%{ transform: none; } }
  .tf-visitor{ position:absolute; z-index: 30; font-size: 46px; line-height:1; cursor: pointer; user-select:none; filter: drop-shadow(0 4px 8px rgba(0,0,0,.4));
    animation: tfFly var(--dur, 8s) linear forwards; }
  .tf-visitor span{ display:inline-block; animation: tfFlap .5s ease-in-out infinite; }
  .tf-visitor.rtl span{ transform: scaleX(-1); }
  .tf-visitor.gold{ filter: drop-shadow(0 0 14px #ffd23f); }
  @keyframes tfFly{ from{ left: var(--x0); } to{ left: var(--x1); } }
  @keyframes tfFlap{ 50%{ margin-top: -14px; } }
  .tf-pop{ position:absolute; z-index: 31; font-family:'Archivo Black', sans-serif; color: #ffd23f; font-size: 30px; pointer-events:none; text-shadow: 0 3px 10px rgba(0,0,0,.6);
    animation: tfPop 1.1s ease-out forwards; }
  @keyframes tfPop{ 0%{ transform: translate(-50%,-50%) scale(.4); opacity: 0; } 20%{ transform: translate(-50%,-80%) scale(1.3); opacity: 1; } 100%{ transform: translate(-50%,-220%) scale(1); opacity: 0; } }
  .tf-hint{ font-size: 12px; color: var(--cream-dim, #aab); text-align:center; margin-top: 2px; }
  @media (max-width: 560px){ .tf-row{ flex-wrap: wrap; } .tf-stars{ margin: 0 auto; } .tf-buddy{ font-size: 40px; } }
  @media (prefers-reduced-motion: reduce){ .tf-buddy, .tf-visitor span, .tf-stars.bump{ animation: none !important; } }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* tiny sound helper (respects the site-wide mute) */
  let actx = null;
  const muted = () => { try{ return localStorage.getItem('cc-sound-muted') === 'true'; }catch(e){ return false; } };
  function tone(f, when, dur, type, vol){
    if(muted()) return;
    try{
      if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if(actx.state === 'suspended') actx.resume();
      const t = actx.currentTime + (when || 0), o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(vol || .07, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + .02);
    }catch(e){}
  }
  const chirp = () => [660, 990].forEach((f, i) => tone(f, i * .07, .12, 'sine', .05));
  const sparkle = () => [1319, 1568, 2093, 2637].forEach((f, i) => tone(f, i * .06, .18, 'triangle', .07));

  const FACES = { happy: '😄', focus: '🤓', wow: '🤩', worried: '😬', panic: '😱', party: '🥳', sleep: '😴', cool: '😎', calm: '🙂' };

  function buddy(host){
    const row = document.createElement('div'); row.className = 'tf-row';
    row.innerHTML = '<div class="tf-buddy" role="img" aria-label="Timer buddy"></div><div class="tf-bubble" aria-live="polite"></div><div class="tf-stars" title="Class stars — catch flying visitors to earn them"></div>';
    host.appendChild(row);
    const face = row.children[0], bubble = row.children[1], starsEl = row.children[2];
    let hideT = null, cur = 'calm', stars = 0;
    try{ stars = parseInt(localStorage.getItem('cc-timer-stars'), 10) || 0; }catch(e){}

    function mood(m){ cur = m; face.textContent = FACES[m] || FACES.calm; face.className = 'tf-buddy ' + m; }
    function say(text, m, ms){
      if(m) mood(m);
      clearTimeout(hideT);
      bubble.textContent = text; bubble.className = 'tf-bubble ' + (m || '');
      void bubble.offsetWidth; bubble.classList.add('show');
      if(ms !== 0) hideT = setTimeout(() => bubble.classList.remove('show'), ms || 4500);
    }
    function quiet(){ clearTimeout(hideT); bubble.classList.remove('show'); }
    function renderStars(bump){
      starsEl.innerHTML = '';
      starsEl.append('⭐ ' + stars + (stars === 1 ? ' class star' : ' class stars'));
      if(stars){ const b = document.createElement('button'); b.textContent = 'reset'; b.title = 'Reset class stars';
        b.addEventListener('click', () => { stars = 0; save(); renderStars(); }); starsEl.appendChild(b); }
      if(bump){ starsEl.classList.remove('bump'); void starsEl.offsetWidth; starsEl.classList.add('bump'); }
    }
    function save(){ try{ localStorage.setItem('cc-timer-stars', String(stars)); }catch(e){} }
    function addStar(n){ stars += n || 1; save(); renderStars(true); }
    face.addEventListener('click', () => { chirp(); say(pick(['Hi! 👋', 'Tee-hee!', 'That tickles!', 'Boop!', 'Keep going!']), cur === 'sleep' ? 'happy' : cur, 2000); });
    mood('calm'); renderStars();
    return { say, mood, quiet, addStar, get current(){ return cur; } };
  }

  const VISITORS = [
    { e: '🦋', say: 'A butterfly!' }, { e: '🐝', say: 'Bzzz! A bee!' }, { e: '🛸', say: 'A UFO!!' }, { e: '🐦', say: 'Tweet tweet!' },
    { e: '🎈', say: 'A runaway balloon!' }, { e: '🦄', say: 'A UNICORN!' }, { e: '🐉', say: 'A dragon!' }, { e: '✈️', say: 'Plane!' },
    { e: '🦖', say: 'A flying dino?!' }, { e: '🐟', say: 'A flying fish?' }, { e: '👾', say: 'Space invader!' }, { e: '🦇', say: 'A bat!' }
  ];

  function visitors(stage, bud){
    if(getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
    let timer = null, on = false, current = null;
    function schedule(){ clearTimeout(timer); if(on) timer = setTimeout(spawn, 14000 + Math.random() * 16000); }
    function spawn(){
      if(!on || reduce || document.hidden){ return schedule(); }
      const gold = Math.random() < .2, v = gold ? { e: '🌟', say: 'A GOLDEN STAR! Worth 3!' } : pick(VISITORS);
      const el = document.createElement('div'), rtl = Math.random() < .5, W = stage.clientWidth;
      el.className = 'tf-visitor' + (rtl ? ' rtl' : '') + (gold ? ' gold' : '');
      el.innerHTML = '<span>' + v.e + '</span>';
      el.style.top = (4 + Math.random() * 38) + '%';
      el.style.setProperty('--x0', (rtl ? W + 20 : -70) + 'px');
      el.style.setProperty('--x1', (rtl ? -70 : W + 20) + 'px');
      el.style.setProperty('--dur', (gold ? 5 : 7 + Math.random() * 3) + 's');
      el.title = 'Catch me! (or press S)';
      el.addEventListener('click', () => grab(el, gold));
      el.addEventListener('animationend', e => { if(e.target === el){ el.remove(); if(current === el) current = null; } });
      stage.appendChild(el); current = el; chirp();
      if(bud) bud.say(v.say + ' Catch it!', 'wow', 3000);
      schedule();
    }
    function grab(el, gold){
      if(!el || !el.isConnected || el.dataset.caught) return;
      el.dataset.caught = '1';
      const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), n = gold ? 3 : 1;
      const p = document.createElement('div'); p.className = 'tf-pop'; p.textContent = '+' + n + ' ⭐';
      p.style.left = (r.left - s.left + r.width / 2) + 'px'; p.style.top = (r.top - s.top + r.height / 2) + 'px';
      stage.appendChild(p); setTimeout(() => p.remove(), 1200);
      el.remove(); if(current === el) current = null;
      sparkle(); if(bud){ bud.addStar(n); bud.say(gold ? 'Golden catch! +3 stars! 🌟' : 'Caught it! +1 star!', 'party', 2500); }
    }
    return {
      start(){ if(!on){ on = true; schedule(); } },
      stop(){ on = false; clearTimeout(timer); },
      catchNow(){ if(current && current.isConnected) grab(current, current.classList.contains('gold')); }
    };
  }

  window.CCTimerFun = { buddy, visitors, pick };
})();
