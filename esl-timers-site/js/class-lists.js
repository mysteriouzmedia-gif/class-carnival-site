/**
 * Class Lists — saved class rosters shared by every tool that has a #namesInput box.
 *
 * - "My classes" bar above the names box: click a class to load it, save the current
 *   list as a named class, update a class after editing, or delete one.
 * - Remembers the last list used, so the next tool opens with the class already filled in.
 * - Stored only in this browser (localStorage). Nothing is uploaded anywhere.
 *
 * Include on a tool page after the page's own scripts:
 *   <script src="../js/class-lists.js"></script>
 */
(function(){
  const KEY_CLASSES = 'cc-classes';     // [{ id, name, names: [...] }]
  const KEY_ACTIVE  = 'cc-active-class'; // id of the class last loaded/used
  const KEY_LAST    = 'cc-last-list';    // text of the last list a tool was started with

  function load(key, fallback){
    try{ const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }catch(e){ return fallback; }
  }
  function save(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); return true; }catch(e){ return false; }
  }
  function storageWorks(){
    try{ localStorage.setItem('cc-test', '1'); localStorage.removeItem('cc-test'); return true; }catch(e){ return false; }
  }

  const clean = text => text.split('\n').map(s => s.trim()).filter(Boolean);
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  function injectStyles(){
    const css = `
      .cc-classes{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin: 0 0 12px; }
      .cc-classes-label{ font-size:12px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color: var(--cream-dim); margin-right: 2px; }
      .cc-chip{ display:inline-flex; align-items:center; border:1px solid var(--line); border-radius: 20px; background: rgba(255,255,255,.03); overflow:hidden; }
      .cc-chip.active{ border-color: var(--gold); background: rgba(255,182,39,.12); }
      .cc-chip button{ background:none; border:none; color: var(--cream); font-family:'Work Sans', sans-serif; font-weight:700; font-size:13px; padding: 6px 12px; border-radius:0; cursor:pointer; }
      .cc-chip button:hover{ background: rgba(255,255,255,.06); }
      .cc-chip .cc-del{ padding: 6px 10px 6px 4px; color: var(--cream-dim); font-size:15px; line-height:1; }
      .cc-chip .cc-del:hover{ color: #ff6b5b; background:none; }
      .cc-chip.confirm{ border-color:#ff6b5b; }
      .cc-chip.confirm .cc-yes{ color:#ff6b5b; }
      .cc-action{ background:none; border:1px dashed var(--line); color: var(--gold); font-weight:700; font-size:13px; padding: 6px 12px; border-radius: 20px; cursor:pointer; }
      .cc-action:hover{ border-color: var(--gold); }
      .cc-form{ display:inline-flex; gap:6px; align-items:center; }
      .cc-form input{ background:#0f1522; color: var(--cream); border:1px solid var(--gold); border-radius: 20px; padding: 6px 12px; font-family:'Work Sans', sans-serif; font-size:13px; width: 170px; outline:none; }
      .cc-form button{ padding: 6px 12px; font-size:13px; border-radius: 20px; }
      .cc-note{ width:100%; font-size:12px; color: var(--cream-dim); margin-top: -2px; }
      .cc-note button{ background:none; border:none; padding:0; color: var(--gold); font-size:12px; font-weight:700; cursor:pointer; text-decoration: underline; }
    `;
    const tag = document.createElement('style');
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function init(){
    const input = document.getElementById('namesInput');
    const start = document.getElementById('startBtn');
    if(!input || !storageWorks()) return;
    injectStyles();

    let classes = load(KEY_CLASSES, []);
    let activeId = load(KEY_ACTIVE, null);
    let mode = 'idle';          // 'idle' | 'naming' | 'confirm:<id>'
    let note = '';

    const bar = document.createElement('div');
    bar.className = 'cc-classes';
    input.parentNode.insertBefore(bar, input);

    const active = () => classes.find(c => c.id === activeId) || null;

    function setText(names){
      input.value = names.join('\n');
      input.dispatchEvent(new Event('input', { bubbles: true }));   // lets the page update its "N students" count
    }

    function persist(){ save(KEY_CLASSES, classes); save(KEY_ACTIVE, activeId); }

    function render(){
      bar.innerHTML = '';
      const current = clean(input.value);
      const act = active();
      const edited = act && !same(current, act.names);

      const label = document.createElement('span');
      label.className = 'cc-classes-label';
      label.textContent = classes.length ? 'My classes' : 'Save your class so it’s ready on every tool';
      bar.appendChild(label);

      classes.forEach(c => {
        const chip = document.createElement('span');
        chip.className = 'cc-chip' + (c.id === activeId ? ' active' : '');
        if(mode === 'confirm:' + c.id){
          chip.classList.add('confirm');
          chip.appendChild(btn('Delete “' + c.name + '”?', null));
          chip.appendChild(btn('Yes', () => {
            classes = classes.filter(x => x.id !== c.id);
            if(activeId === c.id) activeId = null;
            mode = 'idle'; note = ''; persist(); render();
          }, 'cc-yes'));
          chip.appendChild(btn('No', () => { mode = 'idle'; render(); }));
        } else {
          const open = btn(c.name + ' (' + c.names.length + ')', () => {
            activeId = c.id; persist(); setText(c.names);
            note = ''; mode = 'idle'; render();
          });
          open.title = 'Load this class';
          chip.appendChild(open);
          const del = btn('×', () => { mode = 'confirm:' + c.id; render(); }, 'cc-del');
          del.title = 'Delete this class';
          del.setAttribute('aria-label', 'Delete ' + c.name);
          chip.appendChild(del);
        }
        bar.appendChild(chip);
      });

      if(mode === 'naming'){
        const form = document.createElement('span');
        form.className = 'cc-form';
        const name = document.createElement('input');
        name.type = 'text'; name.maxLength = 30; name.placeholder = 'Class name, e.g. 3A';
        const ok = document.createElement('button'); ok.className = 'btn-gold'; ok.textContent = 'Save';
        const cancel = document.createElement('button'); cancel.className = 'btn-ghost'; cancel.textContent = 'Cancel';
        const doSave = () => {
          const n = name.value.trim();
          if(!n){ name.focus(); return; }
          const c = { id: 'c' + Date.now().toString(36), name: n, names: clean(input.value) };
          classes.push(c); activeId = c.id; mode = 'idle';
          note = '“' + n + '” saved — it’ll be ready on every ClassCarnival tool in this browser.';
          persist(); render();
        };
        ok.addEventListener('click', doSave);
        cancel.addEventListener('click', () => { mode = 'idle'; render(); });
        name.addEventListener('keydown', e => {
          if(e.key === 'Enter'){ e.preventDefault(); doSave(); }
          if(e.key === 'Escape'){ mode = 'idle'; render(); }
        });
        form.append(name, ok, cancel);
        bar.appendChild(form);
        setTimeout(() => name.focus(), 0);
      } else if(current.length){
        if(edited){
          bar.appendChild(btn('Update “' + act.name + '”', () => {
            act.names = current; note = '“' + act.name + '” updated.'; persist(); render();
          }, 'cc-action'));
        }
        if(!act || edited){
          bar.appendChild(btn(classes.length ? '+ Save as new class' : '+ Save this class', () => { mode = 'naming'; render(); }, 'cc-action'));
        }
      }

      if(note){
        const n = document.createElement('div');
        n.className = 'cc-note';
        n.textContent = note + ' ';
        if(note.startsWith('Your last list')){
          n.appendChild(btn('Clear', () => { setText([]); note = ''; activeId = null; persist(); render(); }));
        }
        bar.appendChild(n);
      }
    }

    function btn(text, onClick, cls){
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      if(cls) b.className = cls;
      if(onClick) b.addEventListener('click', onClick); else b.disabled = true;
      return b;
    }

    // Open with the class already filled in: the active class, else the last list used.
    if(!clean(input.value).length){
      const act = active();
      const last = load(KEY_LAST, '');
      if(act){
        setText(act.names);
        note = 'Loaded “' + act.name + '”. Click another class to switch.';
      } else if(last && clean(last).length){
        setText(clean(last));
        note = 'Your last list is filled in.';
      }
    }

    input.addEventListener('input', () => { note = ''; if(mode !== 'naming') render(); });
    const sample = document.getElementById('sampleBtn');
    if(sample) sample.addEventListener('click', () => setTimeout(() => { note = ''; render(); }, 0));
    if(start){
      start.addEventListener('click', () => {
        const list = clean(input.value);
        if(list.length) save(KEY_LAST, list.join('\n'));
      });
    }
    render();
  }

  // Run after the page's own scripts have wired up their listeners.
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  else setTimeout(init, 0);
})();
