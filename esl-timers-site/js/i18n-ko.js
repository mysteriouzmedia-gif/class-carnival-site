/* ClassCarnival — Korean UI layer for /ko/ pages.
 * Translates interface text (static and dynamic) in place: exact phrases, patterns,
 * and a few HTML status templates. Student names are never touched (exact matches only).
 */
(function(){
  const TEAM = { Tigers:'호랑이', Dolphins:'돌고래', Rockets:'로켓', Owls:'부엉이', Dragons:'드래곤', Pandas:'판다', Comets:'혜성', Foxes:'여우', Sharks:'상어',
    Eagles:'독수리', Koalas:'코알라', Penguins:'펭귄', Lions:'사자', Unicorns:'유니콘', Wolves:'늑대', Bees:'꿀벌', Robots:'로봇', Wizards:'마법사', Octopuses:'문어', Turtles:'거북이' };
  const dur = s => s.replace(/(\d+) minutes?/g, '$1분').replace(/(\d+) seconds?/g, '$1초');
  const D = {
    // shared chrome
    'Fill sample class':'예시 학생 채우기', 'Edit Names':'이름 수정', 'Edit Class':'학급 수정', 'Reset':'초기화', 'Close':'닫기', 'Esc = close':'Esc = 닫기',
    'Space = next pick · Esc = close':'Space = 다음 뽑기 · Esc = 닫기', 'Next pick ▶':'다음 뽑기 ▶', 'Next pick':'다음 뽑기', 'Your turn!':'당신 차례!', 'The stick says…':'막대에 적힌 이름은…',
    '🎉 Everyone has had a turn! Starting a fresh round.':'🎉 모두 한 번씩 뽑혔어요! 새 라운드를 시작합니다.', '1 student still waiting':'1명 남음',
    'Toggle sound':'소리 켜기/끄기', 'Toggle fullscreen':'전체 화면', 'Fullscreen (great for projecting)':'전체 화면 (프로젝터에 딱!)',
    'My classes':'내 학급', 'Save your class so it’s ready on every tool':'학급을 저장하면 모든 도구에서 바로 불러올 수 있어요', '+ Save this class':'+ 이 학급 저장',
    '+ Save as new class':'+ 새 학급으로 저장', 'Class name, e.g. 3A':'학급 이름 (예: 3학년 2반)', 'Save':'저장', 'Cancel':'취소', 'Load this class':'이 학급 불러오기',
    'Delete this class':'이 학급 삭제', 'Your last list':'마지막 명단', 'Your last list is filled in.':'마지막으로 쓴 명단을 불러왔어요.', 'Delete':'삭제', 'Keep':'유지',
    'Copied! Paste it anywhere.':'복사했어요! 원하는 곳에 붙여넣으세요.', 'Couldn’t copy automatically — select it on screen instead.':'자동 복사가 안 돼요. 화면에서 직접 선택해 복사해 주세요.',
    'One name per line':'한 줄에 한 명씩', 'Clear':'지우기',
    'Type or paste one name per line, e.g.\nMinji\nDaniel\nSora\nJayden\nAva':'한 줄에 한 명씩 입력하거나 붙여넣으세요. 예:\n민지\n도윤\n서연\n지호\n하은', 'Fewer':'줄이기', 'More':'늘리기', 'Hide':'숨기기', 'Minutes':'분', 'Seconds':'초', 'min':'분', 'sec':'초',
    // name picker
    'Start Picking':'뽑기 시작', 'Pick a Student':'학생 뽑기', 'Reset Pool':'처음부터 다시', 'Tap Pick':'뽑기를 누르세요',
    'Everyone gets picked once before names repeat — resets automatically when the class is done.':'모든 학생이 한 번씩 뽑힌 뒤에야 다시 뽑혀요. 한 바퀴가 끝나면 자동으로 새로 시작해요.',
    // group maker
    'Groups of':'모둠당 인원', 'Number of groups':'모둠 수', 'Deal them all':'한 번에 공개', 'One at a time':'한 명씩 공개', 'Team names & mascots':'팀 이름과 마스코트',
    'Make Groups':'모둠 만들기', '🃏 Deal Next':'🃏 다음 카드', '🔀 Shuffle Again':'🔀 다시 섞기', 'Copy Groups':'모둠 복사', 'Shuffling the deck…':'카드를 섞는 중…', 'Dealing…':'나눠 주는 중…',
    'How to split the class':'모둠 나누는 방법', 'How to reveal the groups':'모둠 공개 방법', 'Number':'숫자',
    'Copied! Paste the groups anywhere.':'복사했어요! 원하는 곳에 붙여넣으세요.', 'Couldn’t copy automatically — select the groups on screen instead.':'자동 복사가 안 돼요. 화면에서 직접 선택해 복사해 주세요.',
    // seating chart
    '🪑 Make the Seating Chart':'🪑 자리 배치하기', 'Desks across':'가로 책상 수', 'Rows':'줄 수', 'Fewer columns':'열 줄이기', 'More columns':'열 늘리기', 'Fewer rows':'줄 줄이기', 'More rows':'줄 늘리기',
    'Desks in pairs':'짝 책상 (2인용)', 'Fill front rows first':'앞줄부터 채우기', '🚫 Keep students apart (optional)':'🚫 떨어뜨려 앉힐 학생 (선택)',
    'One pair per line, e.g.\nMinji, Daniel\nLeo, Noah':'한 줄에 두 명씩, 예:\n민지, 도윤\n서준, 하은', 'FRONT OF THE ROOM':'칠판 (교실 앞)', 'Teacher':'선생님',
    '🔀 Shuffle Seats':'🔀 자리 섞기', '🖨️ Print':'🖨️ 인쇄', 'Copy Chart':'자리표 복사', 'Tip: click two desks to swap them.':'팁: 책상 두 개를 차례로 누르면 자리를 바꿀 수 있어요.',
    '⚠️ Couldn’t keep every pair apart with this layout — the red names are still neighbours. Try swapping or adding desks.':'⚠️ 이 배치로는 모든 학생을 떨어뜨릴 수 없어요. 빨간 이름은 아직 옆자리예요. 자리를 바꾸거나 책상을 늘려 보세요.',
    // countdown
    '🔢 Classic':'🔢 기본', '⏳ Sand Timer':'⏳ 모래시계', '🚀 Rocket Launch':'🚀 로켓 발사', '🍦 Melting Ice Cream':'🍦 녹는 아이스크림', '⛄ Melting Snowman':'⛄ 녹는 눈사람', '🎁 Present Unwrap':'🎁 선물 포장 풀기',
    '⛄ The snowman melted!':'⛄ 눈사람이 다 녹았어요!', '🎁 Surprise!':'🎁 짜잔!', 'Brrr… it’s getting warm! ☀️':'으… 점점 따뜻해져! ☀️',
    'Save the snowman — keep working! ⛄':'눈사람을 지켜 줘 — 계속 집중! ⛄', 'Drip… drip… 💧':'똑… 똑… 💧', 'What’s inside? 🎁':'안에 뭐가 들었을까? 🎁',
    'Unwrapping… 🎀':'포장 푸는 중… 🎀', 'No peeking until time’s up!':'시간 끝날 때까지 엿보기 금지!', '🎈 Balloon Pop':'🎈 풍선 터뜨리기',
    '30 sec':'30초', '1 min':'1분', '2 min':'2분', '3 min':'3분', '5 min':'5분', '10 min':'10분', '15 min':'15분', 'Set':'설정', '+1 min':'+1분',
    'Tick sound in the last 10 seconds':'마지막 10초 째깍 소리', '🎵 Theme sounds':'🎵 테마 효과음', '🏁 Beat-the-timer mode':'🏁 타이머 이기기 모드',
    '🎁 Mystery rewards (comma separated):':'🎁 깜짝 보상 (쉼표로 구분):', 'Mystery rewards':'깜짝 보상', '▶ Start':'▶ 시작', '⏸ Pause':'⏸ 일시정지', '▶ Resume':'▶ 계속', '↺ Again':'↺ 다시',
    '✅ We’re done!':'✅ 다 했어요!', 'FUEL':'연료', 'Timer theme':'타이머 테마', 'Timer buddy':'타이머 친구', '⭐ Class point':'⭐ 학급 포인트',
    'Hi! Pick a time and press Start ▶':'안녕! 시간을 고르고 시작을 눌러 줘 ▶', 'And we’re back! ▶':'다시 시작! ▶', 'Paused… zzz':'잠깐 멈춤… zzz', 'Bonus minute! Phew! ⏱️':'보너스 1분! 휴~ ⏱️',
    'Halfway there! 🎉':'벌써 절반! 🎉', '1 minute left! ⏰':'1분 남았어요! ⏰', '30 seconds! Start wrapping up!':'30초! 이제 마무리해요!', 'HURRY!!! 😱':'서둘러요!!! 😱',
    'Beat the timer! Finish before it runs out for a mystery reward 🎁':'타이머를 이겨라! 시간 안에 끝내면 깜짝 보상 🎁', 'The timer won this time… rematch? 😅':'이번엔 타이머가 이겼네… 한 판 더? 😅',
    'Time’s up! Pencils down! 🥳':'시간 끝! 연필 내려놓기! 🥳', 'Time’s up!':'시간 끝!', '⏰ Time’s up!':'⏰ 시간 끝!', '⏰ The timer won this round — try again!':'⏰ 이번 판은 타이머 승리! 다시 도전해요!',
    '🚀 Liftoff!':'🚀 발사!', '🎈 POP!':'🎈 펑!', '🍦 All melted!':'🍦 다 녹았어요!', '⏳ The sand has run out!':'⏳ 모래가 다 떨어졌어요!', '🏆 Bragging rights!':'🏆 자랑할 권리!',
    'You’ve got this! 💪':'할 수 있어! 💪', 'Nice focus, everyone!':'모두 집중 잘하고 있어요!', 'Quiet brains at work… 🧠':'조용히 두뇌 풀가동 중… 🧠', 'Looking good!':'아주 좋아요!',
    'I believe in you!':'믿고 있어요!', 'Keep going, keep going!':'계속, 계속!', 'Fuel check… ✅':'연료 확인… ✅', 'Engines warming up 🔧':'엔진 예열 중 🔧',
    'Mission control says: keep working! 🛰️':'관제 센터: 계속 진행하라! 🛰️', 'Astronauts, stay focused! 👩‍🚀':'우주비행사들, 집중! 👩‍🚀', 'Sand is falling… ⏳':'모래가 떨어지고 있어요… ⏳',
    'Every grain counts!':'모래 한 알도 소중해!', 'Tick… tock… 🕰️':'째깍… 째깍… 🕰️', 'Phew, it’s hot! ☀️':'휴, 덥다! ☀️', 'My ice cream is melting! 🍦':'아이스크림이 녹고 있어! 🍦',
    'Work fast before it drips!':'흘러내리기 전에 빨리!', 'Pump… pump… 💨':'펌프… 펌프… 💨', 'It’s getting BIG! 🎈':'점점 커진다! 🎈', 'Careful… not too big…':'조심… 너무 크면 안 돼…',
    'Hi! 👋':'안녕! 👋', 'Tee-hee!':'히히!', 'That tickles!':'간지러워!', 'Boop!':'뿅!', 'Keep going!':'계속 가자!',
    // noise meter
    '🫧 Bouncing Balls':'🫧 통통 공', '🎚️ Noise Gauge':'🎚️ 소음 게이지', '🐉 Sleeping Dragon':'🐉 잠자는 드래곤', '▶ Start Listening':'▶ 측정 시작',
    'Your browser will ask to use the microphone. The sound level is measured live on this computer only — nothing is recorded, saved or sent anywhere.':'브라우저가 마이크 사용 권한을 물어봐요. 소리 크기는 이 컴퓨터에서만 실시간으로 측정되며, 녹음·저장·전송되지 않아요.',
    'Volume level for this activity':'이 활동의 목소리 크기', '🤫 Silent':'🤫 조용히', '🐭 Whisper':'🐭 속삭이기', '🗣️ Partner talk':'🗣️ 짝 활동', '👥 Group work':'👥 모둠 활동', '🎉 Free time':'🎉 자유 시간',
    'Loudness limit':'소음 한계', 'Mic sensitivity':'마이크 감도', 'Quiet challenge':'조용히 챌린지', 'Stay under the limit for':'한계 아래로 유지하기:', 'minutes':'분',
    '“Shh!” sound when too loud':'시끄러우면 “쉿!” 소리', 'quiet time':'조용한 시간', 'times too loud':'시끄러웠던 횟수', '⭐ class stars earned':'⭐ 받은 학급 별',
    'Reset Challenge':'챌린지 초기화', 'Too loud!':'너무 시끄러워요!', 'Careful…':'조심…', 'Great volume!':'딱 좋아요!', 'WAKE-UP METER':'잠 깨기 게이지', 'TOO LOUD':'너무 시끄러움',
    'ROAR! 🔥':'크아앙! 🔥', 'Too loud! 🙉':'너무 시끄러워요! 🙉', 'Noise meter theme':'소음 측정기 테마', 'Less time':'시간 줄이기', 'More time':'시간 늘리기', 'Goal minutes':'목표 시간(분)',
    '🤫 Quiet challenge complete! The class earned a star':'🤫 조용히 챌린지 성공! 학급 별 획득',
    'Couldn’t use the microphone. Check that one is connected and that you clicked “Allow” (look for the mic icon in the address bar).':'마이크를 사용할 수 없어요. 마이크가 연결되어 있는지, “허용”을 눌렀는지 확인해 주세요 (주소창의 마이크 아이콘).',
    // classroom screen
    '🕒 Clock':'🕒 시계', '⏳ Timer':'⏳ 타이머', '🎯 Name Picker':'🎯 이름 뽑기', '🔊 Noise':'🔊 소음', '🔊 Noise Meter':'🔊 소음 측정기', '📋 Work Mode':'📋 활동 모드', '🚦 Traffic Light':'🚦 신호등',
    '📝 Instructions':'📝 안내 사항', 'Background':'배경', '🎯 Pick a Student':'🎯 학생 뽑기', '✏️ Edit class list':'✏️ 명단 수정', '🎤 Start':'🎤 시작', '⏹ Stop':'⏹ 정지',
    '🗣️ Talk':'🗣️ 대화', '👥 Group':'👥 모둠', 'Click to change':'눌러서 바꾸기', 'Click here and type today’s instructions…':'여기를 눌러 오늘의 안내 사항을 적어 보세요…',
    'Silent work':'조용히 활동', 'Voices off':'목소리 끄기', 'Whisper voices':'속삭이는 목소리', 'Only your neighbour can hear':'옆 친구만 들리게', 'Partner talk':'짝과 대화',
    'Talk with your partner':'짝과 이야기해요', 'Group work':'모둠 활동', 'Work together, 6-inch voices':'함께해요, 작은 목소리로', 'Ask 3 before me':'선생님께 묻기 전에 친구 3명에게',
    'Try three classmates first':'먼저 친구 세 명에게 물어봐요', 'Eyes on me':'선생님을 보세요', 'Stop, look and listen':'멈추고, 보고, 들어요',
    '🛑 Stop and listen':'🛑 멈추고 들어요', '✋ Get ready':'✋ 준비', '✅ Go!':'✅ 시작!', 'Red':'빨강', 'Yellow':'노랑', 'Green':'초록', '🎤 Mic blocked — try again':'🎤 마이크 차단됨 — 다시 시도',
    '🎉 Everyone has had a turn — new round next':'🎉 모두 뽑혔어요 — 다음부터 새 라운드'
  };
  const P = [
    [/^(\d+) students?$/, (m, n) => n + '명'], [/^(\d+) cards?$/, (m, n) => n + '장 남음'], [/^(\d+) students still waiting$/, (m, n) => n + '명 남음'],
    [/^(\d+) still to pick$/, (m, n) => n + '명 남음'], [/^(\d+) min$/, (m, n) => n + '분'], [/^(\d+) players?$/, (m, n) => n + '명'],
    [/^Team (\w+)$/, (m, t) => TEAM[t] ? TEAM[t] + ' 팀' : m], [/^Group (\d+)$/, (m, n) => n + '모둠'],
    [/^→ 1 group of (\d+)$/, (m, n) => '→ ' + n + '명 1모둠'], [/^→ (\d+) groups of (\d+)$/, (m, g, n) => '→ ' + n + '명씩 ' + g + '모둠'],
    [/^→ (\d+) groups: (\d+) of (\d+) and (\d+) of (\d+)$/, (m, g, a, b, c, d) => '→ ' + g + '모둠: ' + b + '명 ' + a + '모둠, ' + d + '명 ' + c + '모둠'],
    [/^(\d+) desks$/, (m, n) => '책상 ' + n + '개'], [/^(\d+) desks, (\d+) empty$/, (m, n, e) => '책상 ' + n + '개, 빈자리 ' + e + '개'],
    [/^(\d+) desks — (\d+) more row\(s\) will be added$/, (m, n, r) => '책상 ' + n + '개 — ' + r + '줄이 추가돼요'],
    [/^Let’s go! (.+) on the clock!( Beat it! 🏁)?$/, (m, t, b) => '시작! ' + dur(t) + (b ? ' 타이머를 이겨라! 🏁' : '')],
    [/^WE BEAT THE TIMER! (\S+) to spare! 🏆$/, (m, t) => '타이머를 이겼다! ' + t + ' 남기고 성공! 🏆'],
    [/^🏁 Beat the timer with (\S+) to spare! Your mystery reward:$/, (m, t) => '🏁 ' + t + ' 남기고 타이머 격파! 깜짝 보상은:'],
    [/^Background (\d+)$/, (m, n) => '배경 ' + n]
  ];
  const HTML = [
    [/^Press <b>Space<\/b> or <b>Deal Next<\/b> to reveal each student\.$/, () => '<b>Space</b> 키나 <b>다음 카드</b>를 눌러 한 명씩 공개하세요.'],
    [/^🎉 <b>Groups ready!<\/b> Press Space to shuffle again\.$/, () => '🎉 <b>모둠 완성!</b> Space 키를 누르면 다시 섞어요.'],
    [/^(.*?)<b>(.*?)<\/b> joins (Team (\w+)|Group (\d+))!$/, (m, pre, name, _g, team, num) => pre + '<b>' + name + '</b> → ' + (team ? (TEAM[team] || team) + ' 팀' : num + '모둠') + '!'],
    [/^Tip: click two desks to <b>swap<\/b> them\.$/, () => '팁: 책상 두 개를 차례로 누르면 자리를 <b>바꿀</b> 수 있어요.'],
    [/^✅ All “keep apart” pairs are separated\. Tip: click two desks to <b>swap<\/b> them\.$/, () => '✅ 떨어뜨릴 학생들을 모두 떨어뜨렸어요. 팁: 책상 두 개를 누르면 자리를 <b>바꿀</b> 수 있어요.']
  ];
  const A = ['placeholder', 'title', 'aria-label', 'data-ph'];
  function tr(s){
    const t = s.trim(); if(!t) return null;
    let r = D[t];
    if(r === undefined){ for(const [re, fn] of P){ const m = t.match(re); if(m){ r = fn(...m); break; } } }
    if(r === undefined || r === t) return null;
    return s.replace(t, r);
  }
  function fixEl(el){
    if(el.id === 'status' || el.id === 'legend' || (el.classList && (el.classList.contains('gm-status') || el.classList.contains('sc-legend')))){
      const h = el.innerHTML;
      for(const [re, fn] of HTML){ const m = h.match(re); if(m){ const out = fn(...m); if(out !== h) el.innerHTML = out; return true; } }
    }
    return false;
  }
  function walk(n){
    if(n.nodeType === 3){ const r = tr(n.nodeValue); if(r !== null) n.nodeValue = r; return; }
    if(n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    A.forEach(a => { const v = n.getAttribute(a); if(v){ const r = tr(v); if(r !== null) n.setAttribute(a, r); } });
    if(n.tagName === 'TEXTAREA' || n.tagName === 'INPUT') return;
    if(fixEl(n)) return;
    n.childNodes.forEach(walk);
  }
  const obs = new MutationObserver(ms => ms.forEach(m => {
    if(m.type === 'characterData'){ const r = tr(m.target.nodeValue); if(r !== null) m.target.nodeValue = r; if(m.target.parentElement) fixEl(m.target.parentElement); }
    else if(m.type === 'attributes') walk(m.target);
    else { m.addedNodes.forEach(walk); if(m.target.nodeType === 1) fixEl(m.target); }
  }));
  obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: A });
  document.addEventListener('DOMContentLoaded', () => walk(document.body));
  const alert0 = window.alert.bind(window);
  const AL = { 'Add at least 1 name.':'이름을 1개 이상 입력해 주세요.', 'Add at least 2 names.':'이름을 2개 이상 입력해 주세요.', 'Add at least 3 names.':'이름을 3개 이상 입력해 주세요.' };
  window.alert = msg => alert0(AL[msg] || msg);
  window.CCi18n = { tr };
  window.CC_SAMPLE = ['민지','도윤','서연','지호','하은','준우','유나','시우','하나','예준','지우','수아','서준','채원','현우','지민'];
})();
