/**
 * Fullscreen toggle — adds a floating button that requests browser fullscreen
 * and applies a `fs-active` class to <body> while active (theme.css hides the
 * header/footer/nav and enlarges the tool).
 *
 * "Fit to screen": while fullscreen, the page never scrolls. If the tool is
 * taller (or wider) than the screen, <main> is zoomed down so everything fits,
 * and it re-fits automatically whenever the tool's content changes size
 * (race starts, results appear, window resizes, etc).
 */
(function(){
  var active = false;
  var zoom = 1;
  var raf = 0;
  var ro = null, mo = null;

  function createButton(){
    var btn = document.createElement('button');
    btn.id = 'fsToggleBtn';
    btn.className = 'fs-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle fullscreen');
    btn.setAttribute('title', 'Fullscreen (great for projecting)');
    btn.innerHTML = '⛶';
    document.body.appendChild(btn);
    btn.addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', updateState);
    document.addEventListener('webkitfullscreenchange', updateState);
    document.addEventListener('msfullscreenchange', updateState);
    window.addEventListener('resize', schedule);
  }

  function isFullscreen(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function toggleFullscreen(){
    if(!isFullscreen()){
      var el = document.documentElement;
      var request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if(request){
        var p = request.call(el);
        if(p && p.catch) p.catch(function(){ setActive(!active); });
      } else {
        // No fullscreen API (e.g. iPhone): still give the distraction-free, no-scroll view
        setActive(!active);
      }
    } else {
      var exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if(exit) exit.call(document);
    }
  }

  function updateState(){ setActive(isFullscreen()); }

  function setActive(on){
    active = on;
    document.body.classList.toggle('fs-active', on);
    document.documentElement.classList.toggle('fs-on', on);
    var btn = document.getElementById('fsToggleBtn');
    if(btn) btn.innerHTML = on ? '⤢' : '⛶';
    var main = getMain();
    if(on){
      window.scrollTo(0, 0);
      watch(main);
      schedule();
    } else {
      unwatch();
      zoom = 1;
      if(main) main.style.zoom = '';
    }
  }

  function getMain(){ return document.querySelector('main'); }

  function watch(main){
    unwatch();
    if(!main) return;
    if(window.ResizeObserver){
      ro = new ResizeObserver(schedule);
      ro.observe(main);
      for(var i = 0; i < main.children.length; i++) ro.observe(main.children[i]);
    }
    if(window.MutationObserver){
      mo = new MutationObserver(schedule);
      mo.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    }
  }
  function unwatch(){
    if(ro){ ro.disconnect(); ro = null; }
    if(mo){ mo.disconnect(); mo = null; }
  }

  function schedule(){
    if(!active || raf) return;
    raf = requestAnimationFrame(function(){ raf = 0; fit(); });
  }

  // How tall/wide the tool would be at 100% (in screen pixels)
  function natural(main){
    var r = main.getBoundingClientRect();
    var h = r.height, w = main.scrollWidth * zoom;
    // include anything poking out of main (absolutely positioned bits etc.)
    var bottom = r.bottom, top = r.top;
    var kids = main.querySelectorAll('*');
    for(var i = 0; i < kids.length && i < 4000; i++){
      var k = kids[i];
      if(k.offsetParent === null) continue;
      var cs = getComputedStyle(k);
      if(cs.position === 'fixed') continue;
      var kr = k.getBoundingClientRect();
      if(kr.height === 0) continue;
      if(kr.bottom > bottom) bottom = kr.bottom;
      if(kr.top < top) top = kr.top;
    }
    h = Math.max(h, bottom - top);
    return { h: h / zoom, w: Math.max(w, r.width) / zoom };
  }

  function fit(){
    if(!active) return;
    var main = getMain();
    if(!main) return;
    var n = natural(main);
    var availH = window.innerHeight - 4;
    var availW = document.documentElement.clientWidth || window.innerWidth;
    var z = Math.min(1, availH / n.h, availW / n.w);
    z = Math.max(0.3, Math.floor(z * 1000) / 1000);
    if(Math.abs(z - zoom) < 0.004) return;
    zoom = z;
    main.style.zoom = z === 1 ? '' : String(z);
  }

  window.CCFullscreen = { setActive: setActive, fit: fit, toggle: toggleFullscreen };
  document.addEventListener('DOMContentLoaded', createButton);
})();
