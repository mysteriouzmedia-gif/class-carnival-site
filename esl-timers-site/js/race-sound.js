/**
 * Race sound engine — synthesized entirely with the Web Audio API (no audio files).
 * Provides countdown beeps, a finish fanfare, and a simple looping background
 * music riff while a race is running. Respects a mute toggle saved in localStorage.
 */
(function(){
  let ctx = null;
  let musicTimer = null;
  let musicStep = 0;
  let muted = localStorage.getItem('cc-sound-muted') === 'true';

  function getCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, startTime, duration, type, gainVal){
    if(muted || !freq) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainVal || 0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function playCountdownStep(step){
    const c = getCtx();
    const t = c.currentTime;
    if(step < 2){
      tone(440, t, 0.15, 'square', 0.12);
    } else {
      tone(660, t, 0.12, 'square', 0.15);
      tone(880, t + 0.13, 0.28, 'square', 0.15);
    }
  }

  function playFinishFanfare(){
    const c = getCtx();
    const t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.09, 0.22, 'square', 0.14));
  }

  // Simple looping 8-bit-style riff: a bass note plus a lead note per step.
  const bassline = [130.81, 130.81, 164.81, 146.83];
  const lead     = [523.25, 587.33, 659.25, 587.33, 523.25, 440, 523.25, 0];
  const stepDur = 0.22;

  function scheduleMusicStep(){
    const c = getCtx();
    const t = c.currentTime;
    tone(bassline[musicStep % bassline.length], t, stepDur * 0.9, 'triangle', 0.06);
    const lf = lead[musicStep % lead.length];
    if(lf) tone(lf, t, stepDur * 0.5, 'square', 0.045);
    musicStep++;
  }

  function startMusic(){
    if(muted || musicTimer) return;
    musicStep = 0;
    scheduleMusicStep();
    musicTimer = setInterval(scheduleMusicStep, stepDur * 1000);
  }

  function stopMusic(){
    if(musicTimer){ clearInterval(musicTimer); musicTimer = null; }
  }

  function updateButton(){
    const btn = document.getElementById('soundToggleBtn');
    if(btn) btn.innerHTML = muted ? '🔇' : '🔊';
  }

  function toggleMute(){
    muted = !muted;
    localStorage.setItem('cc-sound-muted', muted);
    if(muted) stopMusic();
    updateButton();
  }

  function createButton(){
    const btn = document.createElement('button');
    btn.id = 'soundToggleBtn';
    btn.className = 'sound-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.setAttribute('title', 'Toggle race sound');
    btn.innerHTML = muted ? '🔇' : '🔊';
    document.body.appendChild(btn);
    btn.addEventListener('click', toggleMute);
  }

  window.CCSound = { playCountdownStep, playFinishFanfare, startMusic, stopMusic };
  document.addEventListener('DOMContentLoaded', createButton);
})();
