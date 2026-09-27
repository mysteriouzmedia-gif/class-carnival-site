/* ClassCarnival team-tool kit — shared helpers for the Team Sorter, Balloon Pop Teams,
 * Captain's Draft and Seating Chart pages.
 *   CCTeam.lines(text) / shuffle(arr) / pick(arr) / tone(freq, when, dur, type, vol) / sfx.{tick,land,fanfare,pop,whoosh,thinking}
 *   CCTeam.makeTeams(n) -> [{ name, mascot, color, members:[], size:0 }]
 *   CCTeam.balance(names, teams) -> { order, plan } (plan[i] = team index for order[i]; sizes within one)
 *   CCTeam.wireSetup({ min, max, unit }) -> { count(), names() }   (needs #namesInput #nameCount #sampleBtn #teamsInput #teamMinus #teamPlus #preview)
 *   CCTeam.renderTeams(wrap, teams, { showSize }) ; CCTeam.flash(team) ; CCTeam.copy(text, msgEl)
 */
(function(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#ff6b5b','#2ec4b6','#ffb627','#9b72cf','#4fa8e0','#a8d46b','#e85d8a','#ff9f43'];
  const TEAMS  = [['Tigers','🐯'],['Dolphins','🐬'],['Rockets','🚀'],['Owls','🦉'],['Dragons','🐉'],['Pandas','🐼'],['Foxes','🦊'],
                  ['Sharks','🦈'],['Eagles','🦅'],['Koalas','🐨'],['Penguins','🐧'],['Lions','🦁'],['Unicorns','🦄'],['Turtles','🐢'],['Bees','🐝'],['Robots','🤖']];
  const SAMPLE = ['Minji','Daniel','Sora','Jayden','Ava','Leo','Yuna','Noah','Hana','Ethan','Jiwoo','Mia','Seojun','Chloe','Arjun','Emma'];

  const lines = t => t.split('\n').map(s => s.trim()).filter(Boolean);
  const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  let actx = null;
  const muted = () => { try{ return localStorage.getItem('cc-sound-muted') === 'true'; }catch(e){ return false; } };
  function ctx(){ if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if(actx.state === 'suspended') actx.resume(); return actx; }
  function tone(f, when, dur, type, vol){
    if(muted()) return;
    try{
      const c = ctx(), t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(vol || .08, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .02);
    }catch(e){}
  }
  function noise(dur, vol, freq){
    if(muted()) return;
    try{
      const c = ctx(), buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
      for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = freq || 1500; s.buffer = buf; g.gain.value = vol || .5;
      s.connect(f); f.connect(g); g.connect(c.destination); s.start();
    }catch(e){}
  }
  const sfx = {
    tick: () => tone(1200, 0, .03, 'square', .03),
    land: () => [659, 880, 1175].forEach((f, i) => tone(f, i * .07, .2, 'triangle', .09)),
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .1, i === 3 ? .6 : .2, 'square', .07)),
    pop: () => { noise(.18, .7, 1200); tone(220, 0, .08, 'square', .06); },
    whoosh: () => { noise(.3, .25, 3000); },
    thinking: () => [392, 440, 392, 494].forEach((f, i) => tone(f, i * .22, .2, 'sine', .05)),
    card: () => { noise(.06, .3, 4000); }
  };

  function makeTeams(n){
    const picks = shuffle(TEAMS), off = Math.floor(Math.random() * COLORS.length);
    return Array.from({ length: n }, (_, i) => ({ name: picks[i][0], mascot: picks[i][1], color: COLORS[(i + off) % COLORS.length], members: [], size: 0 }));
  }
  function balance(names, teams){
    const order = shuffle(names), g = teams.length;
    const plan = shuffle(order.map((_, i) => i % g));
    teams.forEach(t => { t.size = 0; t.members = []; });
    plan.forEach(ti => teams[ti].size++);
    return { order, plan };
  }

  function wireSetup(opts){
    opts = opts || {};
    const $ = id => document.getElementById(id);
    const min = opts.min || 2, max = opts.max || 8, unit = opts.unit || 'team';
    const input = $('namesInput');
    const count = () => $('teamsInput') ? Math.max(min, Math.min(max, parseInt($('teamsInput').value, 10) || min)) : 0;
    function update(){
      const n = lines(input.value).length;
      $('nameCount').textContent = n + (n === 1 ? ' student' : ' students');
      if(!$('preview')) return;
      const g = Math.min(count(), Math.max(n, 2));
      if(!n || !g){ $('preview').textContent = ''; return; }
      const base = Math.floor(n / g), extra = n % g;
      $('preview').textContent = '→ ' + (extra ? `${extra} ${unit}${extra > 1 ? 's' : ''} of ${base + 1}, ${g - extra} of ${base}` : `${g} ${unit}s of ${base}`);
    }
    input.addEventListener('input', update);
    if($('teamsInput')){
      $('teamMinus').addEventListener('click', () => { $('teamsInput').value = Math.max(min, count() - 1); update(); });
      $('teamPlus').addEventListener('click', () => { $('teamsInput').value = Math.min(max, count() + 1); update(); });
      $('teamsInput').addEventListener('change', () => { $('teamsInput').value = count(); update(); });
    }
    $('sampleBtn').addEventListener('click', () => {
      input.value = SAMPLE.slice(0, opts.sample || 12).join('\n');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    setTimeout(update, 0);
    return { count, names: () => lines(input.value), update };
  }

  const css = `
  .ct-options{ display:flex; flex-wrap:wrap; gap: 12px 26px; justify-content:center; align-items:center; margin-top: 18px; }
  .ct-options > label{ display:flex; align-items:center; gap:10px; font-weight:700; font-size:14px; color: var(--cream-dim); }
  .gm-stepper{ display:inline-flex; align-items:center; gap:6px; }
  .gm-stepper button{ width:36px; height:36px; padding:0; font-size:18px; line-height:1; }
  .gm-stepper input{ width:52px; height:36px; text-align:center; background:#0f1522; color: var(--cream); border:1px solid var(--line); border-radius: 10px; font-family:'Archivo Black', sans-serif; font-size:16px; -moz-appearance:textfield; }
  .gm-stepper input::-webkit-outer-spin-button, .gm-stepper input::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
  .gm-preview{ color: var(--cream-dim); font-size: 13px; }
  .gm-status{ font-size: 16px; font-weight: 800; color: var(--cream-dim); min-height: 1.4em; text-align:center; margin-top: 8px; }
  .gm-status b{ color: var(--gold); }
  .gm-copied{ text-align:center; color: var(--gold); font-size:13px; font-weight:700; min-height:1.2em; margin-top:8px; }
  .ct-teams{ display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 20px; }
  .ct-team{ --c:#ff6b5b; border-radius: 14px; border:1px solid var(--line); border-top: 6px solid var(--c); padding: 10px 12px; background: rgba(255,255,255,.03); transition: box-shadow .3s ease; }
  .ct-team h3{ margin: 0 0 8px; font-family:'Archivo Black', sans-serif; font-size: 16px; color: var(--c); display:flex; justify-content:space-between; gap:6px; }
  .ct-team h3 small{ font-family:'Work Sans', sans-serif; font-size: 12px; color: var(--cream-dim); font-weight:800; }
  .ct-team.full h3 small{ color: var(--c); }
  .ct-team.hit{ box-shadow: 0 0 0 3px var(--c), 0 0 26px color-mix(in srgb, var(--c) 50%, transparent); }
  .ct-team.turn{ box-shadow: 0 0 0 3px var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); }
  .ct-team ul{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:5px; }
  .ct-team li{ background:#1b2436; border-left: 4px solid var(--c); border-radius: 8px; padding: 5px 9px; font-weight:800; font-size: 14px; animation: ctIn .5s cubic-bezier(.3,1.5,.5,1) both; }
  .ct-team li.cap{ background: color-mix(in srgb, var(--c) 30%, #1b2436); }
  @keyframes ctIn{ from{ opacity:0; transform: scale(.6) translateY(-12px); } to{ opacity:1; transform:none; } }
  @media (prefers-reduced-motion: reduce){ .ct-team li{ animation:none; } }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function renderTeams(wrap, teams, o){
    o = o || {};
    wrap.innerHTML = '';
    teams.forEach((t, i) => {
      const box = document.createElement('div'); box.className = 'ct-team' + (t.size && t.members.length >= t.size ? ' full' : '') + (o.turn === i ? ' turn' : '');
      box.style.setProperty('--c', t.color);
      const h = document.createElement('h3'); const nm = document.createElement('span'); nm.textContent = t.mascot + ' ' + t.name;
      const sm = document.createElement('small');
      sm.textContent = o.showSize === false || !t.size ? t.members.length + (t.members.length === 1 ? ' player' : ' players') : (t.members.length >= t.size ? 'FULL' : t.members.length + ' / ' + t.size);
      h.append(nm, sm);
      const ul = document.createElement('ul');
      t.members.forEach((m, k) => { const li = document.createElement('li'); li.textContent = (o.captains && k === 0 ? '👑 ' : '') + m; if(o.captains && k === 0) li.className = 'cap'; if(o.noAnim) li.style.animation = 'none'; ul.appendChild(li); });
      box.append(h, ul); wrap.appendChild(box); t.box = box;
    });
  }
  function flash(t){ if(!t.box) return; t.box.classList.add('hit'); setTimeout(() => t.box && t.box.classList.remove('hit'), 900); }
  async function copy(text, el){
    try{ await navigator.clipboard.writeText(text); el.textContent = 'Copied! Paste it anywhere.'; }
    catch(e){ el.textContent = 'Couldn’t copy automatically — select it on screen instead.'; }
  }

  window.CCTeam = { COLORS, TEAMS, SAMPLE, lines, shuffle, pick, tone, noise, sfx, reduceMotion, makeTeams, balance, wireSetup, renderTeams, flash, copy };
})();
