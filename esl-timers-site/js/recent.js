/* "Your recent tools" — remembers the tools a teacher opens (in this browser only) and shows
 * them at the top of the home page so returning teachers are one click from their favourites.
 * Tool pages: records the visit.  Home pages: renders into #recentTools if it exists.
 */
(function(){
  const KEY = 'cc-recent-tools', MAX = 8;
  const ko = location.pathname.indexOf('/ko/') === 0;
  const load = () => { try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } };
  const save = v => { try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){} };
  const clean = p => p.replace(/\.html$/, '').replace(/\/$/, '');

  function record(){
    const h1 = document.querySelector('.page-header h1'), eb = document.querySelector('.page-header .eyebrow');
    if(!h1) return;
    const icon = eb ? (eb.textContent.trim().match(/^\S+/) || [''])[0] : '';
    const path = clean(location.pathname);
    const list = load().filter(x => x.path !== path);
    list.unshift({ path, title: h1.textContent.trim(), icon: /[A-Za-z가-힣]/.test(icon) ? '⭐' : icon, t: Date.now() });
    save(list.slice(0, MAX));
  }

  function render(el){
    const list = load().filter(x => (x.path.indexOf('/ko/') === 0) === ko).slice(0, 4);
    if(!list.length){ el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '';
    const head = document.createElement('div'); head.className = 'section-head';
    const h2 = document.createElement('h2'); h2.textContent = ko ? '🕘 최근에 쓴 도구' : '🕘 Your recent tools';
    const p = document.createElement('p'); p.textContent = ko ? '이 브라우저에서 최근에 연 도구예요.' : 'Pick up where you left off — saved in this browser only.';
    const clr = document.createElement('a'); clr.href = '#'; clr.textContent = ko ? '기록 지우기' : 'Clear';
    clr.addEventListener('click', e => { e.preventDefault(); save(load().filter(x => (x.path.indexOf('/ko/') === 0) !== ko)); render(el); });
    head.append(h2, p, clr);
    const grid = document.createElement('div'); grid.className = 'tool-grid recent';
    list.forEach(x => {
      const a = document.createElement('a'); a.className = 'tool-card'; a.href = x.path;
      const ic = document.createElement('span'); ic.className = 'icon'; ic.textContent = x.icon || '⭐';
      const h3 = document.createElement('h3'); h3.textContent = x.title;
      a.append(ic, h3); grid.appendChild(a);
    });
    el.append(head, grid);
  }

  const el = document.getElementById('recentTools');
  if(el) render(el); else record();
})();
