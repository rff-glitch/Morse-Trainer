const MORSE = {
  A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',
  K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',
  U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.'
};
const MORSE_REV = {};
for (const [ch,code] of Object.entries(MORSE)) MORSE_REV[code] = ch;

const WORDS = ['CAT','DOG','SUN','MOON','STAR','TREE','FISH','BIRD','FIRE','WIND','RAIN','SNOW','ROCK','WAVE','LOVE','HOPE','COOL','FAST','SLOW','RIVER','OCEAN','CLOUD','EARTH','LIGHT','NIGHT','BRAVE'];
const SENTENCES = ['HELLO WORLD','SOS SAVE OUR SHIP','THE CAT ON THE MAT','ALL IS WELL','MORSE CODE IS FUN','SEND HELP NOW','STARS AT NIGHT','KEEP IT SIMPLE'];

let mode = 'letters';
let direction = 'to-letter'; // to-letter: show morse→type letter | to-morse: show letter→type morse
let currentTarget = '';
let charIndex = 0;
let score=0, streak=0, attempts=0, correct=0, speedVal=5;
let audioCtx = null;

// ── AUDIO ──
function getCtx(){ if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function playTone(f,dur,t){ const ctx=getCtx(),o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.setValueAtTime(f,t);o.type='sine'; g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.3,t+0.005);g.gain.setValueAtTime(0.3,t+dur-0.005);g.gain.linearRampToValueAtTime(0,t+dur); o.start(t);o.stop(t+dur); }
function playMorse(code){ const ctx=getCtx(),unit=1.2/speedVal,dot=unit*0.08,dash=unit*0.24,gap=unit*0.08; let t=ctx.currentTime+0.05; for(const c of code){ if(c==='.'){ playTone(650,dot,t);t+=dot+gap; }else if(c==='-'){ playTone(650,dash,t);t+=dash+gap; }else if(c===' '){ t+=gap*3; } } }
function playBeep(ok){ const ctx=getCtx(),t=ctx.currentTime; if(ok){playTone(880,0.08,t);playTone(1100,0.1,t+0.1);}else{playTone(200,0.25,t);} }
function updateSpeed(v){ speedVal=parseInt(v); document.getElementById('speedVal').textContent=v; }

// ── DIRECTION ──
function randomDir(){ direction = Math.random()<0.5?'to-letter':'to-morse'; }

function applyDirUI(){
  const badge=document.getElementById('dirBadge');
  const lw=document.getElementById('letterInputWrap');
  const mw=document.getElementById('morseInputWrap');
  const mv=document.getElementById('morseVisual');
  const lbl=document.getElementById('challengeLabel');
  if(direction==='to-letter'){
    badge.className='dir-badge to-letter'; badge.textContent='· — TYPE THE LETTER';
    lbl.textContent='Decode this signal';
    lw.style.display=''; mw.style.display='none'; mv.style.display='';
    setTimeout(()=>{ const el=document.getElementById('letterInput'); el.value=''; el.className='morse-input letter-input'; el.focus(); },30);
  } else {
    badge.className='dir-badge to-morse'; badge.textContent='A — TYPE THE MORSE';
    lbl.textContent='Encode this letter';
    lw.style.display='none'; mw.style.display=''; mv.style.display='none';
    setTimeout(()=>{ const el=document.getElementById('morseInput'); el.value=''; el.className='morse-input'; el.focus(); },30);
  }
  document.getElementById('livePreview').textContent='';
}

// ── MORSE VISUAL ──
function buildMorseVisual(code){
  const el=document.getElementById('morseVisual');
  el.innerHTML='';
  if(!code) return;
  const groups=code.split(' ');
  groups.forEach((grp,gi)=>{
    if(gi>0){ const sp=document.createElement('div'); sp.style.cssText='width:24px;flex-shrink:0'; el.appendChild(sp); }
    const wrap=document.createElement('div');
    wrap.style.cssText='display:flex;align-items:center;gap:6px;';
    let delay=0;
    for(let i=0;i<grp.length;i++){
      const s=document.createElement('div');
      s.className=grp[i]==='.'?'sym-dot':'sym-dash';
      s.style.animationDelay=(delay*0.06)+'s';
      wrap.appendChild(s); delay++;
      if(i<grp.length-1){ const sg=document.createElement('div'); sg.style.cssText='width:4px'; wrap.appendChild(sg); }
    }
    el.appendChild(wrap);
  });
}

// ── MODE ──
function setMode(m){
  mode=m; charIndex=0;
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',['letters','words','sentences'][i]===m));
  newChallenge();
}

function getTotalChars(){ return mode==='letters'?1:mode==='words'?currentTarget.length:currentTarget.replace(/\s/g,'').length; }

function getCurrentChar(){
  if(mode==='letters') return currentTarget;
  if(mode==='words') return currentTarget[charIndex];
  return currentTarget.replace(/\s/g,'')[charIndex];
}

function newChallenge(){
  charIndex=0;
  if(mode==='letters'){ const keys=Object.keys(MORSE).filter(k=>isNaN(k)); currentTarget=keys[Math.floor(Math.random()*keys.length)]; }
  else if(mode==='words'){ currentTarget=WORDS[Math.floor(Math.random()*WORDS.length)]; }
  else { currentTarget=SENTENCES[Math.floor(Math.random()*SENTENCES.length)]; }
  randomDir();
  applyDirUI();
  renderChallenge();
  updateProgress();
  setTimeout(()=>playCurrentMorse(),380);
}

// ── RENDER ──
function renderChallenge(){
  const d=document.getElementById('targetDisplay');
  if(direction==='to-letter'){
    d.style.display='none';
    buildMorseVisual(MORSE[getCurrentChar()]||'');
  } else {
    document.getElementById('morseVisual').innerHTML='';
    d.style.display='';
    if(mode==='letters'){
      d.className='target-display';
      d.innerHTML=`<span class="char-current">${currentTarget}</span>`;
    } else if(mode==='words'){
      d.className='target-display word-mode';
      let h='';
      for(let i=0;i<currentTarget.length;i++){
        const c=i<charIndex?'char-correct':i===charIndex?'char-current':'char-pending';
        h+=`<span class="${c}">${currentTarget[i]}</span>`;
      }
      d.innerHTML=h;
    } else {
      d.className='target-display sentence-mode';
      const ns=currentTarget.replace(/\s/g,'');
      let nsi=0,h='';
      for(let i=0;i<currentTarget.length;i++){
        if(currentTarget[i]===' '){ h+=`<span style="display:inline-block;width:14px"></span>`; }
        else { const c=nsi<charIndex?'char-correct':nsi===charIndex?'char-current':'char-pending'; h+=`<span class="${c}">${currentTarget[i]}</span>`; nsi++; }
      }
      d.innerHTML=h;
    }
  }
}

function playCurrentMorse(){ const ch=getCurrentChar(); if(ch) playMorse(MORSE[ch]||''); }
function updateProgress(){ const pct=(getTotalChars()>0?(charIndex/getTotalChars())*100:0); document.getElementById('progressFill').style.width=pct+'%'; }

// ── INPUT ──
function onLetterKeyDown(e){
  if(e.key==='Enter'){e.preventDefault();checkAnswer();}
}
function onMorseKeyDown(e){
  if(e.key==='Enter'){e.preventDefault();checkAnswer();}
}
function onMorseInput(){
  const val=document.getElementById('morseInput').value.trim();
  const decoded=MORSE_REV[val];
  const pv=document.getElementById('livePreview');
  if(decoded){ pv.textContent='→ '+decoded; pv.style.color='var(--accent)'; }
  else if(val){ pv.textContent='→ ?'; pv.style.color='var(--text-dim)'; }
  else { pv.textContent=''; }
}
function insertSymbol(s){ const el=document.getElementById('morseInput'); el.value+=s; el.focus(); onMorseInput(); }
function clearMorseInput(){ const el=document.getElementById('morseInput'); el.value=''; el.className='morse-input'; el.focus(); document.getElementById('livePreview').textContent=''; }

document.addEventListener('keydown',e=>{
  const act=document.activeElement;
  if(direction==='to-morse' && act && act.id!=='letterInput'){
    if(e.key==='s'||e.key==='S'){e.preventDefault();insertSymbol('.');return;}
    if(e.key==='l'||e.key==='L'){e.preventDefault();insertSymbol('-');return;}
  }
  if(e.key==='Enter' && act && act.id!=='letterInput' && act.id!=='morseInput'){
    e.preventDefault(); checkAnswer();
  }
});

// ── CHECK ──
function checkAnswer(){
  const ch=getCurrentChar();
  let userVal, expected, inputEl;
  if(direction==='to-letter'){
    inputEl=document.getElementById('letterInput');
    userVal=inputEl.value.trim().toUpperCase();
    expected=ch.toUpperCase();
  } else {
    inputEl=document.getElementById('morseInput');
    userVal=inputEl.value.trim();
    expected=MORSE[ch.toUpperCase()];
  }
  if(!userVal) return;
  attempts++;

  if(userVal===expected){
    correct++; streak++;
    score+=10+(streak>1?streak*2:0);
    playBeep(true);
    inputEl.className=(direction==='to-letter'?'morse-input letter-input':'morse-input')+' correct';
    charIndex++;
    updateStats();
    if(charIndex>=getTotalChars()){
      showFeedback('✓','#00ff88');
      setTimeout(()=>newChallenge(),700);
    } else {
      showFeedback('·','#00e5ff');
      setTimeout(()=>{
        randomDir(); applyDirUI(); renderChallenge(); updateProgress();
        setTimeout(()=>playCurrentMorse(),220);
      },360);
    }
  } else {
    streak=0; playBeep(false);
    inputEl.className=(direction==='to-letter'?'morse-input letter-input':'morse-input')+' wrong';
    showFeedback('✕','#ff6b35');
    setTimeout(()=>{ inputEl.className=direction==='to-letter'?'morse-input letter-input':'morse-input'; },500);
    updateStats();
  }
}

function updateStats(){
  document.getElementById('statScore').textContent=score;
  document.getElementById('statStreak').textContent=streak;
  const acc=attempts>0?Math.round((correct/attempts)*100)+'%':'—';
  document.getElementById('statAccuracy').textContent=acc;
}
function showFeedback(txt,col){
  const el=document.getElementById('feedbackFlash');
  el.textContent=txt; el.style.color=col; el.style.textShadow=`0 0 40px ${col}`;
  el.className='feedback-flash show';
  setTimeout(()=>{ el.className='feedback-flash fade'; setTimeout(()=>el.className='feedback-flash',400); },300);
}
function toggleRef(){ document.getElementById('refGrid').classList.toggle('visible'); document.getElementById('refToggle').classList.toggle('open'); }
function buildRefGrid(){
  const grid=document.getElementById('refGrid');
  for(const [ch,code] of Object.entries(MORSE)){
    const item=document.createElement('div'); item.className='ref-item';
    item.innerHTML=`<span class="ref-char">${ch}</span><span class="ref-morse">${code}</span>`;
    item.onclick=()=>playMorse(code); grid.appendChild(item);
  }
}

buildRefGrid();
newChallenge();