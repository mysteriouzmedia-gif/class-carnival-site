/**
 * Race Engine — powers every race-timer skin on the site.
 * Each themed page sets `window.RACE_SKIN` before loading this file, e.g.:
 *
 *   window.RACE_SKIN = {
 *     avatarType: 'emoji',      // 'emoji' or 'initials'
 *     emoji: '🦆',              // used when avatarType === 'emoji'
 *     emojis: ['🍣','🥟'],      // optional: cycles per racer instead of one emoji
 *     sampleNames: [...]        // optional, falls back to DEFAULT_SAMPLE
 *   };
 *
 * Expects these element ids to exist in the page:
 *   setupScreen, raceScreen, resultsScreen, namesInput, nameCount,
 *   sampleBtn, startBtn, startRaceBtn, track, liveLeaderboard, finalList,
 *   editBtn, raceAgainBtn
 */
(function(){
  const DEFAULT_SAMPLE = ['Minji','Daniel','Sora','Jayden','Ava','Leo','Yuna','Noah'];
  const WRAP_WIDTH = 66; // px — must match .runner-wrap width in CSS

  function initRaceEngine(){
    const skin = Object.assign({ avatarType: 'initials', emoji: '🏃', sampleNames: DEFAULT_SAMPLE }, window.RACE_SKIN || {});

    const setupScreen = document.getElementById('setupScreen');
    const raceScreen = document.getElementById('raceScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const namesInput = document.getElementById('namesInput');
    const nameCount = document.getElementById('nameCount');
    const trackEl = document.getElementById('track');
    const liveLeaderboard = document.getElementById('liveLeaderboard');
    const finalList = document.getElementById('finalList');
    const startRaceBtn = document.getElementById('startRaceBtn');

    let names = [], racers = [], finishOrder = [], rafId = null, lastFrameTime = 0;
    let raceState = 'idle'; // 'idle' | 'running' | 'paused' | 'done'

    function color(i){ return `hsl(${(i*47)%360}, 65%, 58%)`; }
    function initials(name){
      const parts = name.trim().split(/\s+/);
      return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
    function labelFor(name, i){
      if(skin.avatarType === 'emoji'){
        if(Array.isArray(skin.emojis) && skin.emojis.length) return skin.emojis[i % skin.emojis.length];
        return skin.emoji;
      }
      return initials(name);
    }
    function escapeHtml(str){
      return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function updateCount(){
      const list = namesInput.value.split('\n').map(s=>s.trim()).filter(Boolean);
      nameCount.textContent = list.length + (list.length===1 ? ' student' : ' students');
    }

    function fillSample(){
      namesInput.value = skin.sampleNames.join('\n');
      updateCount();
    }

    function showCountdown(callback){
      const overlay = document.createElement('div');
      overlay.className = 'race-countdown-overlay';
      trackEl.appendChild(overlay);
      const steps = ['Ready…', 'Set…', 'GO!'];
      let idx = 0;
      function showStep(){
        overlay.textContent = steps[idx];
        overlay.classList.remove('pulse'); void overlay.offsetWidth; overlay.classList.add('pulse');
        idx++;
        if(idx < steps.length){
          setTimeout(showStep, 550);
        } else {
          setTimeout(()=>{ overlay.remove(); callback(); }, 450);
        }
      }
      showStep();
    }

    function spawnConfetti(laneEl, racerIndex){
      const rect = laneEl.getBoundingClientRect();
      const trackRect = trackEl.getBoundingClientRect();
      const originX = rect.right - trackRect.left - 14;
      const originY = rect.top - trackRect.top + rect.height / 2;
      const colors = [color(racerIndex), '#ffb627', '#f5f0e6'];
      for(let p = 0; p < 10; p++){
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const dist = 24 + Math.random() * 34;
        particle.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        particle.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        particle.style.left = originX + 'px';
        particle.style.top = originY + 'px';
        particle.style.background = colors[p % colors.length];
        trackEl.appendChild(particle);
        setTimeout(()=> particle.remove(), 700);
      }
    }

    function runnerMarkup(name, i){
      const label = labelFor(name, i);
      const bodyClass = skin.avatarType === 'emoji' ? 'runner-body emoji' : 'runner-body';
      return `
        <div class="runner-name-tag">${escapeHtml(name)}</div>
        <div class="${bodyClass}" style="background:${color(i)};">${label}</div>
        <svg class="runner-legs" viewBox="0 0 32 20" width="30" height="18">
          <line class="leg leg-l" x1="16" y1="0" x2="8" y2="20" stroke="#f5f0e6" stroke-width="4" stroke-linecap="round"/>
          <line class="leg leg-r" x1="16" y1="0" x2="24" y2="20" stroke="#f5f0e6" stroke-width="4" stroke-linecap="round"/>
        </svg>`;
    }

    function buildTrack(){
      trackEl.innerHTML = '';
      trackEl.style.position = 'relative';
      racers = names.map((name, i)=>({
        name, i, pos: 0, done: false, speed: 0, targetSpeed: 0, nextSpeedChange: 0
      }));

      names.forEach((name, i)=>{
        const lane = document.createElement('div');
        lane.className = 'lane';
        lane.id = 'lane-'+i;
        lane.innerHTML = `
          <div class="lane-track">
            <div class="rank-badge" id="rank-${i}"></div>
            <div class="rail"></div>
            <div class="flag"></div>
            <div class="runner-wrap" id="runner-${i}" style="left:2px;">${runnerMarkup(name, i)}</div>
          </div>`;
        trackEl.appendChild(lane);
      });
    }

    function setControlLabel(text){
      if(startRaceBtn) startRaceBtn.textContent = text;
    }

    function beginRace(){
      raceState = 'running';
      setControlLabel('⏸ Pause');
      document.querySelectorAll('.runner-wrap').forEach(el=> el.classList.add('running'));

      const now = performance.now();
      racers.forEach(r=>{
        r.targetSpeed = 8 + Math.random() * 8;
        r.nextSpeedChange = now;
      });

      showCountdown(()=>{
        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(frame);
      });
    }

    function pauseRace(){
      raceState = 'paused';
      setControlLabel('▶ Resume');
      if(rafId) cancelAnimationFrame(rafId);
      document.querySelectorAll('.runner-wrap').forEach(el=> el.classList.remove('running'));
    }

    function resumeRace(){
      raceState = 'running';
      setControlLabel('⏸ Pause');
      document.querySelectorAll('.runner-wrap:not(.finished)').forEach(el=> el.classList.add('running'));
      lastFrameTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function frame(now){
      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;
      let allDone = true;

      racers.forEach(r=>{
        if(r.done) return;
        allDone = false;

        if(now >= r.nextSpeedChange){
          const suspensePause = Math.random() < 0.12;
          r.targetSpeed = suspensePause ? (1 + Math.random() * 2) : (7 + Math.random() * 11);
          r.nextSpeedChange = now + 400 + Math.random() * 600;
        }
        r.speed += (r.targetSpeed - r.speed) * Math.min(dt * 3.2, 1);
        r.pos = Math.min(r.pos + r.speed * dt, 100);

        const runner = document.getElementById('runner-'+r.i);
        const laneTrack = runner.parentElement;
        const maxLeft = laneTrack.clientWidth - WRAP_WIDTH;
        runner.style.left = (2 + (r.pos/100)*maxLeft) + 'px';

        if(r.pos >= 100){
          r.done = true;
          finishOrder.push(r.name);
          const lane = document.getElementById('lane-'+r.i);
          lane.classList.add('finished');
          runner.classList.remove('running');
          runner.classList.add('finished');
          const body = runner.querySelector('.runner-body');
          if(body) body.classList.add('finished-bounce');
          document.getElementById('rank-'+r.i).textContent = '#'+finishOrder.length;
          spawnConfetti(lane, r.i);
          const item = document.createElement('div');
          item.className = 'lb-item';
          item.innerHTML = `<div class="lb-rank">#${finishOrder.length}</div><div class="lb-name">${escapeHtml(r.name)}</div>`;
          liveLeaderboard.appendChild(item);
        }
      });

      if(!allDone && raceState === 'running'){
        rafId = requestAnimationFrame(frame);
      } else if(allDone){
        raceState = 'done';
        if(startRaceBtn) startRaceBtn.style.display = 'none';
        setTimeout(showResults, 700);
      }
    }

    function showResults(){
      raceScreen.style.display = 'none';
      resultsScreen.style.display = 'block';
      finalList.innerHTML = '';
      finishOrder.forEach((name, idx)=>{
        const item = document.createElement('div');
        item.className = 'lb-item';
        item.innerHTML = `<div class="lb-rank">#${idx+1}</div><div class="lb-name">${escapeHtml(name)}</div>`;
        finalList.appendChild(item);
      });
    }

    namesInput.addEventListener('input', updateCount);
    document.getElementById('sampleBtn').addEventListener('click', fillSample);

    document.getElementById('startBtn').addEventListener('click', ()=>{
      names = namesInput.value.split('\n').map(s=>s.trim()).filter(Boolean);
      if(names.length < 2){ alert('Add at least 2 names to race.'); return; }
      finishOrder = [];
      liveLeaderboard.innerHTML = '';
      raceState = 'idle';
      setupScreen.style.display = 'none';
      raceScreen.style.display = 'block';
      if(startRaceBtn){ startRaceBtn.style.display = 'inline-block'; setControlLabel('▶ Start Race'); }
      buildTrack();
    });

    if(startRaceBtn){
      startRaceBtn.addEventListener('click', ()=>{
        if(raceState === 'idle') beginRace();
        else if(raceState === 'running') pauseRace();
        else if(raceState === 'paused') resumeRace();
      });
    }

    document.getElementById('editBtn').addEventListener('click', ()=>{
      resultsScreen.style.display = 'none';
      setupScreen.style.display = 'block';
    });

    document.getElementById('raceAgainBtn').addEventListener('click', ()=>{
      finishOrder = [];
      liveLeaderboard.innerHTML = '';
      raceState = 'idle';
      resultsScreen.style.display = 'none';
      raceScreen.style.display = 'block';
      if(startRaceBtn){ startRaceBtn.style.display = 'inline-block'; setControlLabel('▶ Start Race'); }
      buildTrack();
    });

    window.addEventListener('resize', ()=>{
      racers.forEach(r=>{
        const runner = document.getElementById('runner-'+r.i);
        if(!runner) return;
        const maxLeft = runner.parentElement.clientWidth - WRAP_WIDTH;
        runner.style.left = (2 + (r.pos/100)*maxLeft) + 'px';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initRaceEngine);
})();
