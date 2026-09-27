/* ClassCarnival noise core — reads the microphone level in the browser.
 * Audio is analysed live on this device only: nothing is recorded, stored or uploaded.
 *
 *   CCNoise.start(onLevel)  -> Promise (rejects if the mic is blocked). onLevel(level) is called ~30x/sec, level 0–100
 *   CCNoise.stop()
 *   CCNoise.setSensitivity(0.5–3)   (default 1)
 *   CCNoise.running
 */
(function(){
  let ctx = null, stream = null, analyser = null, data = null, raf = null, cb = null, sens = 1, smooth = 0, last = 0;
  function loop(t){
    raf = requestAnimationFrame(loop);
    if(t - last < 33) return; last = t;
    analyser.getFloatTimeDomainData(data);
    let sum = 0; for(let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    // map roughly -60dB..0dB to 0..100, then apply sensitivity
    const db = 20 * Math.log10(Math.max(rms, 1e-6));
    let lvl = Math.max(0, Math.min(100, ((db + 60) / 50) * 100 * sens));
    smooth = lvl > smooth ? smooth * .5 + lvl * .5 : smooth * .88 + lvl * .12;   // fast attack, slow release
    if(cb) cb(Math.round(smooth));
  }
  async function start(onLevel){
    cb = onLevel;
    if(stream) return;
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('unsupported');
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === 'suspended') await ctx.resume();
    const src = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048; data = new Float32Array(analyser.fftSize);
    src.connect(analyser);
    api.running = true; raf = requestAnimationFrame(loop);
  }
  function stop(){
    cancelAnimationFrame(raf); raf = null;
    if(stream) stream.getTracks().forEach(t => t.stop());
    if(ctx) ctx.close();
    stream = ctx = analyser = null; smooth = 0; api.running = false;
  }
  const api = { start, stop, running: false, setSensitivity(v){ sens = v; } };
  window.CCNoise = api;
})();
