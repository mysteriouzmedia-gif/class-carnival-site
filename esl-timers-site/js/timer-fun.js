/* ClassCarnival timer extras — shared by the Countdown and Stopwatch.
 *
 *   const buddy = CCTimerFun.buddy(hostEl)        // cheering character + speech bubble
 *   buddy.say(text, mood, ms)                      // mood: happy, focus, wow, worried, panic, party, sleep, cool
 *   buddy.mood(mood)
 *   CCTimerFun.sfx.*                                // shared sound effects (respect the site-wide mute)
 *   CCTimerFun.pick(array)
 */
(function(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const css = `
  .tf-row{ display:flex; align-items:center; justify-content:flex-start; gap: 12px; min-height: 64px; width: min(100%, 640px); margin: 4px auto 0; }
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
  @media (max-width: 560px){ .tf-row{ flex-wrap: wrap; } .tf-buddy{ font-size: 40px; } }
  @media (prefers-reduced-motion: reduce){ .tf-buddy{ animation: none !important; } }
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
  function noise(dur, vol, freq, type, when){
    if(muted()) return;
    try{
      if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if(actx.state === 'suspended') actx.resume();
      const c = actx, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.5);
      const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      f.type = type || 'lowpass'; f.frequency.value = freq || 1000; s.buffer = buf; g.gain.value = vol || .3;
      s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime + (when || 0));
    }catch(e){}
  }
  function glide(f0, f1, dur, type, vol, when){
    if(muted()) return;
    try{
      if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if(actx.state === 'suspended') actx.resume();
      const t = actx.currentTime + (when || 0), o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(vol || .08, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + .02);
    }catch(e){}
  }
  const chirp = () => [660, 990].forEach((f, i) => tone(f, i * .07, .12, 'sine', .05));
  const BABBLE = { panic: [900, 1300], party: [700, 1200], worried: [350, 600], sleep: [200, 320] };
  function babble(m){
    const [lo, hi] = BABBLE[m] || [450, 850], n = 3 + Math.floor(Math.random() * 3);
    for(let i = 0; i < n; i++) tone(lo + Math.random() * (hi - lo), i * .075, .06, 'sine', .035);
  }
  const sfx = {
    tone, noise, glide,
    start:   () => { [523, 784].forEach((f, i) => tone(f, i * .09, .16, 'triangle', .09)); glide(300, 900, .25, 'sine', .04); },
    ready:   () => { [0, .18, .36].forEach(t => tone(440, t, .1, 'square', .06)); tone(880, .54, .3, 'square', .08); },
    pause:   () => glide(700, 300, .22, 'triangle', .08),
    resume:  () => glide(300, 700, .22, 'triangle', .08),
    reset:   () => { noise(.35, .18, 2500, 'bandpass'); glide(900, 250, .3, 'sine', .04); },
    coin:    () => { tone(988, 0, .08, 'square', .06); tone(1319, .08, .35, 'square', .06); },
    chime:   () => [1047, 1319, 1568].forEach((f, i) => tone(f, i * .12, .5, 'sine', .08)),
    alert:   () => [0, .25].forEach(t => { tone(880, t, .15, 'square', .06); tone(660, t + .12, .12, 'square', .06); }),
    alarm3:  () => [0, .16, .32].forEach(t => tone(1175, t, .1, 'square', .07)),
    bell:    () => [0, .3].forEach(t => { tone(1568, t, .8, 'sine', .07); tone(2349, t, .5, 'sine', .03); }),
    whistle: () => { for(let i = 0; i < 6; i++) tone(i % 2 ? 2100 : 2350, i * .05, .06, 'sine', .08); tone(2250, .3, .35, 'sine', .07); },
    sadTrombone: () => [392, 370, 349, 311].forEach((f, i) => glide(f, f * .97, i === 3 ? .8 : .3, 'sawtooth', .05, i * .32)),
    cheer:   () => { noise(1.4, .22, 1800, 'bandpass'); [0, .2, .45].forEach(t => noise(.12, .15, 3000, 'highpass', t)); },
    tickTock: (odd) => tone(odd ? 1500 : 1100, 0, .03, 'square', .025),
    heartbeat: () => { tone(60, 0, .12, 'sine', .25); tone(55, .18, .14, 'sine', .2); },
    footstep: () => noise(.05, .12, 500),
    bird:    () => { const b = 2000 + Math.random() * 1200; glide(b, b * 1.4, .08, 'sine', .04); glide(b * 1.1, b * 1.6, .08, 'sine', .04, .12); },
    buzz:    () => { tone(180, 0, .5, 'sawtooth', .015); tone(186, 0, .5, 'sawtooth', .015); },
    pew:     () => glide(1400, 200, .35, 'square', .035),
    whoosh:  () => noise(.6, .14, 1200, 'bandpass'),
    rumble:  () => noise(1.2, .3, 180),
    beacon:  () => tone(1760, 0, .06, 'sine', .03),
    sand:    () => noise(.5, .05, 5000, 'highpass'),
    drip:    () => glide(1200, 500, .09, 'sine', .07),
    pump:    () => noise(.25, .25, 900, 'bandpass'),
    jingle:  () => [784, 988, 1175, 988, 784, 1175].forEach((f, i) => tone(f, i * .14, .13, 'triangle', .05)),
    flip:    () => { noise(.3, .15, 1500, 'bandpass'); tone(300, .25, .1, 'triangle', .08); }
  };

  const FACES = { happy: '😄', focus: '🤓', wow: '🤩', worried: '😬', panic: '😱', party: '🥳', sleep: '😴', cool: '😎', calm: '🙂' };

  function buddy(host){
    const row = document.createElement('div'); row.className = 'tf-row';
    row.innerHTML = '<div class="tf-buddy" role="img" aria-label="Timer buddy"></div><div class="tf-bubble" aria-live="polite"></div>';
    host.appendChild(row);
    const face = row.children[0], bubble = row.children[1];
    let hideT = null, cur = 'calm';

    function mood(m){ cur = m; face.textContent = FACES[m] || FACES.calm; face.className = 'tf-buddy ' + m; }
    function say(text, m, ms){
      if(m) mood(m);
      babble(m);
      clearTimeout(hideT);
      bubble.textContent = text; bubble.className = 'tf-bubble ' + (m || '');
      void bubble.offsetWidth; bubble.classList.add('show');
      if(ms !== 0) hideT = setTimeout(() => bubble.classList.remove('show'), ms || 4500);
    }
    function quiet(){ clearTimeout(hideT); bubble.classList.remove('show'); }
    face.addEventListener('click', () => { chirp(); say(pick(['Hi! 👋', 'Tee-hee!', 'That tickles!', 'Boop!', 'Keep going!']), cur === 'sleep' ? 'happy' : cur, 2000); });
    mood('calm');
    return { say, mood, quiet, get current(){ return cur; } };
  }

  window.CCTimerFun = { buddy, sfx, pick };
})();
