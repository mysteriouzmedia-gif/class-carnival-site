/**
 * Picker Reveal — shared "big moment" for every name picker.
 *
 *   CCReveal.show(name, {
 *     label:     'The stick says…',     // small line above the name
 *     remaining: 5,                     // how many are still waiting (optional)
 *     roundDone: false,                 // true when this pick emptied the pool
 *     nameClass: 'as-stick',            // extra class for per-picker styling of the name
 *     accent:    '#ff6b5b',             // exposed to that styling as --accent
 *     onNext:    () => pickAgain(),     // shows a "Next pick" button
 *     onClose:   () => {}               // runs when the overlay closes (any way)
 *   });
 *   CCReveal.drumroll(ms)   // anticipation sound while a picker animates
 *   CCReveal.isOpen()
 *
 * Full-screen overlay (works inside browser fullscreen), confetti, and
 * Web Audio sounds (no files). Shares the mute setting with the race pages.
 */
(function(){
  const MUTE_KEY = 'cc-sound-muted';
  let muted = false;
  try{ muted = localStorage.getItem(MUTE_KEY) === 'true'; }catch(e){}
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Sound ---------------- */
  let ctx = null;
  function getCtx(){
    try{
      if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if(ctx.state === 'suspended') ctx.resume();
      return ctx;
    }catch(e){ return null; }
  }
  function tone(freq, start, dur, type, vol){
    const c = getCtx(); if(!c || muted) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(start); o.stop(start + dur + 0.02);
  }
  let noiseBuf = null;
  function snare(start, vol){
    const c = getCtx(); if(!c || muted) return;
    if(!noiseBuf){
      noiseBuf = c.createBuffer(1, c.sampleRate * 0.1, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    src.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 1200;
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.07);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(start); src.stop(start + 0.09);
  }
  function drumroll(ms){
    const c = getCtx(); if(!c || muted) return;
    const t0 = c.currentTime, total = (ms || 1000) / 1000;
    let t = 0, gap = 0.07;
    while(t < total){
      snare(t0 + t, 0.05 + 0.1 * (t / total));   // gets louder
      t += gap; gap = Math.max(0.035, gap * 0.97); // and faster
    }
  }
  function tada(){
    const c = getCtx(); if(!c || muted) return;
    const t = c.currentTime;
    tone(523.25, t, 0.14, 'square', 0.08);
    tone(659.25, t + 0.1, 0.14, 'square', 0.08);
    [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(f, t + 0.22, 0.7, 'triangle', 0.1));
  }
  function chime(){
    const c = getCtx(); if(!c || muted) return;
    const t = c.currentTime;
    [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => tone(f, t + i * 0.08, 0.5, 'sine', 0.09));
  }

  function setupSoundButton(){
    if(document.getElementById('soundToggleBtn')) return; // race-sound.js already made one
    const btn = document.createElement('button');
    btn.id = 'soundToggleBtn';
    btn.className = 'sound-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.title = 'Toggle sound';
    btn.textContent = muted ? '🔇' : '🔊';
    btn.addEventListener('click', () => {
      muted = !muted;
      try{ localStorage.setItem(MUTE_KEY, muted); }catch(e){}
      btn.textContent = muted ? '🔇' : '🔊';
    });
    document.body.appendChild(btn);
  }

  /* ---------------- Confetti ---------------- */
  const COLORS = ['#ffb627', '#ff6b5b', '#2ec4b6', '#9b72cf', '#4fa8e0', '#a8d46b', '#e85d8a', '#f5f0e6'];
  let canvas = null, cctx = null, parts = [], rafId = null;
  function confetti(){
    if(reduceMotion) return;
    if(!canvas){
      canvas = document.createElement('canvas');
      canvas.className = 'cc-confetti';
      document.body.appendChild(canvas);
      cctx = canvas.getContext('2d');
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(160, Math.round(innerWidth / 8));
    for(let i = 0; i < n; i++){
      const fromLeft = i % 2 === 0;
      parts.push({
        x: fromLeft ? -10 : innerWidth + 10,
        y: innerHeight * (0.55 + Math.random() * 0.35),
        vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 9),
        vy: -(9 + Math.random() * 11),
        w: 6 + Math.random() * 7, h: 8 + Math.random() * 10,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
        c: COLORS[i % COLORS.length], life: 0
      });
    }
    if(!rafId) rafId = requestAnimationFrame(tick);
  }
  function tick(){
    cctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life < 260 && p.y < innerHeight + 40);
    parts.forEach(p => {
      p.life++; p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.r);
      cctx.scale(1, Math.cos(p.life * 0.15));
      cctx.fillStyle = p.c; cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cctx.restore();
    });
    if(parts.length){ rafId = requestAnimationFrame(tick); }
    else { rafId = null; cctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* ---------------- Overlay ---------------- */
  let overlay = null, els = {}, current = null, lastFocus = null;
  function build(){
    overlay = document.createElement('div');
    overlay.className = 'cc-reveal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.innerHTML =
      '<div class="cc-reveal-inner">' +
        '<div class="cc-reveal-label"></div>' +
        '<div class="cc-reveal-name"></div>' +
        '<div class="cc-reveal-sub"></div>' +
        '<div class="cc-reveal-actions">' +
          '<button class="btn-gold cc-reveal-next">Next pick ▶</button>' +
          '<button class="btn-ghost cc-reveal-close">Close</button>' +
        '</div>' +
        '<div class="cc-reveal-keys">Space = next pick · Esc = close</div>' +
      '</div>';
    document.body.appendChild(overlay);
    els.label = overlay.querySelector('.cc-reveal-label');
    els.name  = overlay.querySelector('.cc-reveal-name');
    els.sub   = overlay.querySelector('.cc-reveal-sub');
    els.next  = overlay.querySelector('.cc-reveal-next');
    els.close = overlay.querySelector('.cc-reveal-close');
    els.keys  = overlay.querySelector('.cc-reveal-keys');

    overlay.addEventListener('click', e => { if(e.target === overlay) hide(); });
    els.close.addEventListener('click', () => hide());
    els.next.addEventListener('click', () => next());
    document.addEventListener('keydown', e => {
      if(!isOpen()) return;
      if(e.key === 'Escape'){ e.preventDefault(); hide(); }
      else if((e.key === ' ' || e.key === 'Enter') && current && current.onNext){
        e.preventDefault(); next();
      }
    });
  }
  function isOpen(){ return !!(overlay && overlay.classList.contains('open')); }

  function show(name, opts){
    opts = opts || {};
    if(!overlay) build();
    lastFocus = document.activeElement;
    current = opts;
    els.label.textContent = opts.label || 'Your turn!';
    els.name.className = 'cc-reveal-name' + (opts.nameClass ? ' ' + opts.nameClass : '');
    els.name.textContent = name;
    if(opts.accent) els.name.style.setProperty('--accent', opts.accent);
    else els.name.style.removeProperty('--accent');
    // Long names: shrink so they stay on one or two lines
    els.name.style.fontSize = name.length > 14 ? 'clamp(40px, 8vw, 110px)' : '';
    let sub = '';
    if(opts.roundDone) sub = '🎉 Everyone has had a turn! Starting a fresh round.';
    else if(typeof opts.remaining === 'number'){
      sub = opts.remaining === 1 ? '1 student still waiting' : opts.remaining + ' students still waiting';
    }
    els.sub.textContent = sub;
    els.next.style.display = opts.onNext ? '' : 'none';
    els.keys.textContent = opts.onNext ? 'Space = next pick · Esc = close' : 'Esc = close';

    overlay.classList.remove('open'); void overlay.offsetWidth;
    overlay.classList.add('open');
    (opts.roundDone ? chime : tada)();
    confetti();
    setTimeout(() => { if(isOpen()) (opts.onNext ? els.next : els.close).focus({ preventScroll: true }); }, 50);
  }

  function hide(){
    if(!isOpen()) return;
    overlay.classList.remove('open');
    const cb = current && current.onClose;
    current = null;
    if(lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if(cb) cb();
  }
  function next(){
    const cb = current && current.onNext;
    hide();
    if(cb) setTimeout(cb, 180);
  }

  window.CCReveal = { show, hide, isOpen, drumroll, confetti };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupSoundButton);
  else setupSoundButton();
})();
