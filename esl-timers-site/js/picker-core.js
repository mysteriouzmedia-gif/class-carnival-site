/**
 * Picker Core — shared "no repeats until everyone's had a turn" pool logic.
 * Used by any skin that just needs to draw a random name (list view, magic hat, etc).
 * The wheel skin manages its own pool since it needs to know the index before removing it.
 */
function createPicker(names){
  const all = [...names];
  let pool = [...all];
  return {
    pickNext(){
      if(pool.length === 0) pool = [...all];
      const idx = Math.floor(Math.random() * pool.length);
      const name = pool[idx];
      pool.splice(idx, 1);
      const exhausted = pool.length === 0;
      return { name, remaining: pool.length, justExhausted: exhausted };
    },
    reset(){ pool = [...all]; },
    isRemaining(name){ return pool.includes(name); },
    all(){ return all; }
  };
}
