/**
 * Fullscreen toggle — adds a floating button to the page that requests
 * browser fullscreen and applies a `fs-active` class to <body> while active,
 * which theme.css uses to hide the header/footer/nav and enlarge the tool.
 */
(function(){
  function createButton(){
    const btn = document.createElement('button');
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
  }

  function isFullscreen(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function toggleFullscreen(){
    if(!isFullscreen()){
      const el = document.documentElement;
      const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if(request) request.call(el);
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if(exit) exit.call(document);
    }
  }

  function updateState(){
    const active = isFullscreen();
    document.body.classList.toggle('fs-active', active);
    const btn = document.getElementById('fsToggleBtn');
    if(btn) btn.innerHTML = active ? '⤢' : '⛶';
  }

  document.addEventListener('DOMContentLoaded', createButton);
})();
