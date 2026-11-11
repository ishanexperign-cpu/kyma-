/* KYMA · core/base — DOM helper, music theory, formatting, knob widgets, toasts, icons, file saving */
const $=id=>document.getElementById(id);
/* Which studio this page is. Each page sets window.STUDIO before loading scripts. */
const STUDIO=window.STUDIO||'home';
const SCALES = {
  'Minor':[0,2,3,5,7,8,10], 'Dorian':[0,2,3,5,7,9,10], 'Phrygian':[0,1,3,5,7,8,10],
  'Major':[0,2,4,5,7,9,11], 'Lydian':[0,2,4,6,7,9,11], 'Harmonic minor':[0,2,3,5,7,8,11],
  'Bhairav':[0,1,4,5,7,8,11], 'Pentatonic':[0,3,5,7,10]
};
const NOTE_NAMES = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const mtof = m => 440*Math.pow(2,(m-69)/12);
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
function degToMidi(deg, oct){
  const sc = SCALES[S.scale]||SCALES.Minor, n = sc.length;
  const o = Math.floor(deg/n), i = ((deg%n)+n)%n;
  return 12*(oct+1) + S.root + sc[i] + 12*o;
}
const midiName = m => NOTE_NAMES[((m%12)+12)%12] + (Math.floor(m/12)-1);



const fmtHz = v => v>=1000 ? (v/1000).toFixed(v>=10000?0:1)+'k' : Math.round(v)+'';
const fmtS  = v => v<1 ? Math.round(v*1000)+'ms' : v.toFixed(v<10?1:0)+'s';
const fmtPct= v => Math.round(v*100)+'%';
const P = (k,label,min,max,def,o={}) => ({k,label,min,max,def,...o});

const fmtTime=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');


const rnd=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()<p;

const MACROS=[
  {label:'Space',lo:'dry',hi:'huge',get:m=>m.space/1.5,set:(m,v)=>{m.space=v*1.5; m.size=1.5+v*7;}},
  {label:'Warmth',lo:'crisp',hi:'warm tape',get:m=>clamp((m.tape-.05)/.75,0,1),set:(m,v)=>{m.tape=.05+v*.75; m.tone=clamp(.3-v*.8,-1,1);}},
  {label:'Punch',lo:'soft',hi:'pumping',get:m=>clamp((m.glue-.1)/.6,0,1),set:(m,v)=>{m.glue=.1+v*.6; m.pump=Math.max(0,(v-.3)/.7)*.8;}},
  {label:'Wobble',lo:'steady',hi:'warped',get:m=>m.warble||0,set:(m,v)=>{m.warble=v;}},
];

function knob(spec,get,set,color,onStart){
  const el=document.createElement('div'); el.className='knob'; el.tabIndex=0; el.setAttribute('role','slider');
  el.setAttribute('aria-label',spec.label); el.setAttribute('aria-valuemin',spec.min); el.setAttribute('aria-valuemax',spec.max); if(spec.tip) el.title=spec.tip+' · double-click to reset';
  el.innerHTML='<div class="dial"></div><span class="kv"></span><span class="kl"></span>';
  el.querySelector('.kl').textContent=spec.label; if(color) el.style.setProperty('--kc',color);
  const norm=v=> spec.log ? Math.log(v/spec.min)/Math.log(spec.max/spec.min) : (v-spec.min)/(spec.max-spec.min);
  const den=n=>{ n=clamp(n,0,1); let v= spec.log ? spec.min*Math.pow(spec.max/spec.min,n) : spec.min+n*(spec.max-spec.min); if(spec.step) v=Math.round(v/spec.step)*spec.step; return +v.toPrecision(5); };
  const show=()=>{ const v=get(); el.style.setProperty('--v',clamp(norm(v),0,1)); const s=spec.fmt?spec.fmt(v):v.toFixed(2); el.querySelector('.kv').textContent=s; el.setAttribute('aria-valuetext',s); el.setAttribute('aria-valuenow',v); };
  const put=v=>{ set(v); show(); };
  let y0=0,n0=0,drag=false;
  el.addEventListener('pointerdown',e=>{ e.preventDefault(); el.focus(); el.setPointerCapture(e.pointerId); drag=true; y0=e.clientY; n0=norm(get()); onStart&&onStart(); selectKnob(el); });
  el._spec=spec; el._norm=()=>norm(get()); el._set=n=>put(den(n)); el._start=()=>onStart&&onStart();
  el.addEventListener('focus',()=>selectKnob(el));
  el.addEventListener('pointermove',e=>{ if(!drag) return; const n=n0+(y0-e.clientY)/(e.shiftKey?700:170); put(den(n)); });
  const end=()=>{drag=false;}; el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
  el.addEventListener('dblclick',()=>{ onStart&&onStart(); put(spec.def); });
  el.addEventListener('keydown',e=>{ const d={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1}[e.key]; if(!d) return; e.preventDefault(); onStart&&onStart(); put(den(norm(get())+d*(e.shiftKey?.1:.02))); });
  show(); el._show=show; return el;
}
/* ---- selected knob: the trackpad turns it ----
   Click (or tab to) a knob to select it. While selected, two-finger scroll anywhere turns it:
   up or right = clockwise. Pinch out/in also turns it, and Safari's two-finger rotate gesture
   turns it like a real dial. Shift = fine. Esc or a click elsewhere releases it. */
let SELKNOB=null, KTURN={acc:0,t:0,started:false,g0:0};
function selectKnob(el){
  if(SELKNOB===el) return; if(SELKNOB) SELKNOB.classList.remove('ksel'); SELKNOB=el; KTURN.started=false;
  if(el){ el.classList.add('ksel'); knobPill(); } else knobPill();
}
function knobPill(){
  let p=document.getElementById('knobPill');
  if(!SELKNOB||!SELKNOB.isConnected){ if(p) p.hidden=true; return; }
  if(!p){ p=document.createElement('div'); p.id='knobPill'; p.className='knobpill'; p.setAttribute('role','status');
    p.innerHTML='<span class="kpdot"></span><span class="kpt"></span><button type="button" aria-label="Release knob">Esc</button>'; document.body.appendChild(p);
    p.querySelector('button').onclick=()=>selectKnob(null); }
  p.querySelector('.kpt').textContent=`Trackpad turns ${SELKNOB._spec.label} · ${SELKNOB.querySelector('.kv').textContent}`; p.hidden=false;
}
function turnSelected(dn){
  const el=SELKNOB; if(!el||!el.isConnected){ selectKnob(null); return false; }
  const now=performance.now(); if(!KTURN.started||now-KTURN.t>600){ el._start(); KTURN.started=true; } KTURN.t=now;
  el._set(clamp(el._norm()+dn,0,1)); el.classList.add('turning'); clearTimeout(KTURN.tm); KTURN.tm=setTimeout(()=>el.classList.remove('turning'),180); knobPill(); return true;
}
window.addEventListener('wheel',e=>{
  if(!SELKNOB||!SELKNOB.isConnected){ const k=e.target.closest&&e.target.closest('.knob'); if(k&&k._set) selectKnob(k); else { if(SELKNOB) selectKnob(null); return; } }
  const m=e.deltaMode===1?16:e.deltaMode===2?400:1; let dx=e.deltaX*m, dy=e.deltaY*m;
  // ctrl+wheel is a trackpad pinch in Chromium/Firefox: pinch out turns up
  let px=(Math.abs(dx)>Math.abs(dy)?dx:-dy); if(e.ctrlKey) px=-dy*4;
  e.preventDefault(); e.stopPropagation();
  turnSelected(px/(e.shiftKey?3000:600));
},{passive:false,capture:true});
window.addEventListener('gesturestart',e=>{ if(!SELKNOB) return; e.preventDefault(); KTURN.g0=SELKNOB._norm(); KTURN.r0=e.rotation||0; KTURN.s0=e.scale||1; },{passive:false});
window.addEventListener('gesturechange',e=>{ if(!SELKNOB) return; e.preventDefault(); const target=KTURN.g0+((e.rotation||0)-KTURN.r0)/300+Math.log((e.scale||1)/KTURN.s0)*.35; turnSelected(target-SELKNOB._norm()); },{passive:false});
window.addEventListener('gestureend',e=>{ if(SELKNOB) e.preventDefault(); },{passive:false});
document.addEventListener('pointerdown',e=>{ if(SELKNOB&&!e.target.closest('.knob,#knobPill')) selectKnob(null); },true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&SELKNOB){ selectKnob(null); if(document.activeElement&&document.activeElement.classList.contains('knob')) document.activeElement.blur(); } },true);
function segControl(spec,get,set){
  const wrap=document.createElement('div'); wrap.className='enum';
  wrap.innerHTML=`<span class="lbl">${spec.label}</span>`;
  const seg=document.createElement('div'); seg.className='seg'; seg.setAttribute('role','group'); seg.setAttribute('aria-label',spec.label);
  spec.opts.forEach(o=>{ const b=document.createElement('button'); b.textContent=o; b.setAttribute('aria-pressed',get()===o); b.onclick=()=>{ set(o); seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.textContent===get())); }; seg.appendChild(b); });
  wrap.appendChild(seg); return wrap;
}

function rr(g,x,y,w,h,r){ r=Math.min(r,w/2,h/2); g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }


const slug=s=>(s||'kyma').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'kyma';

async function useCap(name){ try{ if(window.claude && typeof window.claude.use==='function') return await window.claude.use(name); }catch(e){} return undefined; }
async function offerFile(filename,data){
  const dl=await useCap('downloads');
  if(dl){ try{ await dl.save({filename,data}); toast('Saved '+filename); }catch(e){ if(e&&e.code==='declined') toast('Save cancelled'); else if(e&&e.code==='rate_limited') toast('A save prompt is already open'); else toast('Saving isn’t available here ('+(e&&e.code||'error')+')'); } return; }
  if(dl===null){ toast('Saving files isn’t available in this view'); return; }
  const blob=data instanceof Blob?data:new Blob([data]); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}

const median=a=>{ if(!a.length) return 0; const b=[...a].sort((x,y)=>x-y), m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2; };
// YIN pitch estimator on x[off .. off+W+tauMax]

function toast(msg,acts,ms){
  const t=$('toast'); if(!t) return; t.innerHTML=''; const sp=document.createElement('span'); sp.textContent=msg; t.appendChild(sp);
  (acts?[].concat(acts):[]).forEach(a=>{ const b=document.createElement('button'); b.textContent=a.label; b.onclick=()=>{ t.hidden=true; a.fn(); }; t.appendChild(b); });
  t.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>t.hidden=true,ms||(acts?5500:2600));
}

const ICON_PLAY='<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';

const ICON_PAUSE='<svg viewBox="0 0 16 16"><rect x="3.5" y="2.5" width="3.2" height="11" rx="1" fill="currentColor"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1" fill="currentColor"/></svg>';

const ICON_MIC='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="1.8" width="5" height="8" rx="2.5"/><path d="M3.2 7.6a4.8 4.8 0 0 0 9.6 0M8 12.4v2"/></svg>';

const ICON_DICE='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="3"/><circle cx="5.5" cy="5.5" r=".9" fill="currentColor"/><circle cx="10.5" cy="10.5" r=".9" fill="currentColor"/><circle cx="8" cy="8" r=".9" fill="currentColor"/><circle cx="10.5" cy="5.5" r=".9" fill="currentColor"/><circle cx="5.5" cy="10.5" r=".9" fill="currentColor"/></svg>';

const ICON_SWAP='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h9l-2.5-2.5M13 11H4l2.5 2.5"/></svg>';


/* ---------- icons: one 16-unit line set for every CTA, header button and dock control ---------- */
const ICONS=(()=>{
  const L=b=>`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
  const F=b=>`<svg viewBox="0 0 16 16" aria-hidden="true">${b}</svg>`;
  return {
    play:F('<path d="M4.5 2.6v10.8c0 .5.5.8.9.5l8.2-5.4c.4-.3.4-.8 0-1L5.4 2.1c-.4-.3-.9 0-.9.5z" fill="currentColor"/>'),
    pause:F('<rect x="3.6" y="2.6" width="3" height="10.8" rx="1" fill="currentColor"/><rect x="9.4" y="2.6" width="3" height="10.8" rx="1" fill="currentColor"/>'),
    stop:F('<rect x="3.2" y="3.2" width="9.6" height="9.6" rx="2" fill="currentColor"/>'),
    restart:F('<rect x="2.6" y="3" width="1.8" height="10" rx=".8" fill="currentColor"/><path d="M13.4 3.6v8.8c0 .5-.5.7-.9.5L6 8.5a.6.6 0 0 1 0-1l6.5-4.4c.4-.2.9 0 .9.5z" fill="currentColor"/>'),
    rec:F('<circle cx="8" cy="8" r="4.6" fill="currentColor"/>'),
    loop:L('<path d="M3 7.2V6.5A2.5 2.5 0 0 1 5.5 4h7.5M11 2l2 2-2 2M13 8.8v.7A2.5 2.5 0 0 1 10.5 12H3M5 14l-2-2 2-2"/>'),
    save:L('<path d="M3 2.8h7.6L13.2 5.4v7.8a.8.8 0 0 1-.8.8H3.6a.8.8 0 0 1-.8-.8V3.6a.8.8 0 0 1 .8-.8z"/><path d="M5.2 2.8v3h5V3M5 14v-4h6v4"/>'),
    new:L('<path d="M9.2 2H4.4a.9.9 0 0 0-.9.9v10.2c0 .5.4.9.9.9h7.2c.5 0 .9-.4.9-.9V5.3z"/><path d="M9.2 2v3.3h3.3M8 7.6v4M6 9.6h4"/>'),
    open:L('<path d="M2.2 4.4c0-.6.4-1 1-1h3l1.4 1.5h5.2c.6 0 1 .4 1 1v6.5c0 .6-.4 1-1 1H3.2c-.6 0-1-.4-1-1z"/><path d="M2.2 7.2h11.6"/>'),
    export:L('<path d="M8 10.2V2.4M5 5.2l3-3 3 3"/><path d="M3 9v3.6c0 .5.4.9.9.9h8.2c.5 0 .9-.4.9-.9V9"/>'),
    download:L('<path d="M8 2.4v7.8M5 7.2l3 3 3-3"/><path d="M3 11.6v1c0 .5.4.9.9.9h8.2c.5 0 .9-.4.9-.9v-1"/>'),
    more:F('<circle cx="3.6" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="12.4" cy="8" r="1.3" fill="currentColor"/>'),
    back:L('<path d="M10 3 5 8l5 5"/>'),
    sliders:L('<path d="M3 3v10M8 3v10M13 3v10"/><rect x="1.6" y="8.6" width="2.8" height="2.4" rx=".8" fill="currentColor"/><rect x="6.6" y="4.4" width="2.8" height="2.4" rx=".8" fill="currentColor"/><rect x="11.6" y="9.8" width="2.8" height="2.4" rx=".8" fill="currentColor"/>'),
    tap:L('<path d="M6.2 8.6V3.4a1.2 1.2 0 0 1 2.4 0v4.2l3.1.7c.8.2 1.3.9 1.2 1.7l-.4 3.1a1.4 1.4 0 0 1-1.4 1.2H7.6c-.4 0-.8-.2-1.1-.5L3.7 11a1.1 1.1 0 0 1 1.5-1.6z"/>'),
    metronome:L('<path d="M5.8 2.4h4.4L13 13.6H3z"/><path d="M8 11 11.6 4.2M5.2 10.2h5.6"/>'),
    undo:L('<path d="M5.6 3.4 2.8 6.2 5.6 9"/><path d="M3 6.2h6.4a3.6 3.6 0 0 1 0 7.2H6.8"/>'),
    redo:L('<path d="M10.4 3.4l2.8 2.8L10.4 9"/><path d="M13 6.2H6.6a3.6 3.6 0 0 0 0 7.2h2.6"/>'),
    mic:L('<rect x="5.6" y="1.8" width="4.8" height="7.8" rx="2.4"/><path d="M3.2 7.6a4.8 4.8 0 0 0 9.6 0M8 12.4v1.9"/>'),
    chords:L('<rect x="2" y="2.6" width="3" height="10.8" rx="1"/><rect x="6.5" y="2.6" width="3" height="10.8" rx="1"/><rect x="11" y="2.6" width="3" height="10.8" rx="1"/><path d="M2.6 9.6h1.8M7.1 6.8h1.8M11.6 11h1.8"/>'),
    plus:L('<path d="M8 3v10M3 8h10"/>'),
    track:L('<rect x="2" y="3" width="12" height="4" rx="1.2"/><rect x="2" y="9" width="7" height="4" rx="1.2"/><path d="M12.2 9.4v3.6M10.4 11.2H14"/>'),
    magic:L('<path d="M8 1.8l1.3 3.7L13 6.8 9.3 8.1 8 11.8 6.7 8.1 3 6.8l3.7-1.3z"/><path d="M12.6 11.2l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z"/>'),
    dice:L('<rect x="2" y="2" width="12" height="12" rx="3"/><circle cx="5.5" cy="5.5" r=".8" fill="currentColor"/><circle cx="10.5" cy="10.5" r=".8" fill="currentColor"/><circle cx="10.5" cy="5.5" r=".8" fill="currentColor"/><circle cx="5.5" cy="10.5" r=".8" fill="currentColor"/>'),
    split:L('<circle cx="4.4" cy="4.4" r="2"/><circle cx="4.4" cy="11.6" r="2"/><path d="M6 5.6 13.4 12M6 10.4 13.4 4"/>'),
    copy:L('<rect x="5.2" y="5.2" width="8.4" height="8.4" rx="1.6"/><path d="M10.6 5V3.6c0-.7-.5-1.2-1.2-1.2H3.6c-.7 0-1.2.5-1.2 1.2v5.8c0 .7.5 1.2 1.2 1.2H5"/>'),
    paste:L('<rect x="3" y="3" width="10" height="11" rx="1.6"/><path d="M6 3V2h4v1.6H6zM5.6 7.4h4.8M5.6 10.4h3"/>'),
    duplicate:L('<rect x="2.4" y="2.4" width="8" height="8" rx="1.6"/><path d="M13.6 6v6.4c0 .7-.5 1.2-1.2 1.2H6M6.4 4.6v3.6M4.6 6.4h3.6"/>'),
    trash:L('<path d="M2.8 4.4h10.4M6.2 4.4V3c0-.4.3-.7.7-.7h2.2c.4 0 .7.3.7.7v1.4M4.2 4.4l.6 8.6c0 .5.5.9 1 .9h4.4c.5 0 1-.4 1-.9l.6-8.6"/>'),
    fit:L('<path d="M2.4 5.6V2.4h3.2M13.6 5.6V2.4h-3.2M2.4 10.4v3.2h3.2M13.6 10.4v3.2h-3.2"/>'),
    follow:L('<path d="M5 2v12"/><path d="M8 5.6 12.4 8 8 10.4z" fill="currentColor"/>'),
    magnet:L('<path d="M3.4 2.6v5.2a4.6 4.6 0 0 0 9.2 0V2.6h-2.8v5.2a1.8 1.8 0 0 1-3.6 0V2.6z"/><path d="M3.4 5.2h2.8M9.8 5.2h2.8"/>'),
    wave:L('<path d="M1.6 8h1.6M4.8 5v6M8 2.6v10.8M11.2 5.4v5.2M14.4 8h-1.6"/>'),
    morph:L('<circle cx="4.6" cy="8" r="2.6"/><circle cx="11.4" cy="8" r="2.6"/><path d="M7.2 8h1.6"/>'),
    evolve:L('<path d="M8 13.6c-3 0-5.6-2.4-5.6-5.4S4.8 2.6 8 2.6s4.8 2.2 4.8 4.8-2 4.2-4.2 4.2S5 10 5 8.2 6.4 5.6 8 5.6s2.4 1.2 2.4 2.4"/>'),
    shuffle:L('<path d="M2.4 4.4h2.4c1.4 0 2.2.6 3 1.8l1.6 2.6c.8 1.2 1.6 1.8 3 1.8h1.2M12.2 8.8l1.6 1.8-1.6 1.8M2.4 11.6h2.4c1 0 1.7-.3 2.3-1M9.4 5.2c.6-.5 1.3-.8 2.2-.8h1.2M12.2 2.6l1.6 1.8-1.6 1.8"/>'),
    cloud:L('<path d="M4.6 12.4h7a2.8 2.8 0 0 0 .4-5.6 4 4 0 0 0-7.6-.8 3.2 3.2 0 0 0 .2 6.4z"/>'),
    skip:L('<path d="M3 3.4 9.4 8 3 12.6z" fill="currentColor"/><path d="M12.6 3.4v9.2"/>'),
    cycle:L('<path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.6v2.6h-2.6"/>'),
    layers:L('<path d="M8 2.4 14 5.6 8 8.8 2 5.6z"/><path d="M2 8.6 8 11.8l6-3.2"/>'),
    fx:L('<path d="M8 1.8v2.6M8 11.6v2.6M1.8 8h2.6M11.6 8h2.6M3.6 3.6l1.8 1.8M10.6 10.6l1.8 1.8M3.6 12.4l1.8-1.8M10.6 5.4l1.8-1.8"/><circle cx="8" cy="8" r="1.6"/>'),
    film:L('<rect x="2" y="3" width="12" height="10" rx="1.6"/><path d="M5 3v10M11 3v10M2 6.4h3M2 9.6h3M11 6.4h3M11 9.6h3"/>'),
    sync:L('<path d="M2.6 8a5.4 5.4 0 0 1 9.6-3.4M13.4 8a5.4 5.4 0 0 1-9.6 3.4"/><path d="M12.6 2.4v2.6H10M3.4 13.6V11H6"/>'),
    headphones:L('<path d="M2.6 10V8.4a5.4 5.4 0 0 1 10.8 0V10"/><rect x="2" y="9.4" width="3" height="4.4" rx="1"/><rect x="11" y="9.4" width="3" height="4.4" rx="1"/>'),
    dial:L('<circle cx="8" cy="8" r="5.6"/><path d="M8 8 10.8 5.2"/>'),
    meter:L('<path d="M3 13V9M6.3 13V5M9.6 13V7M13 13V3"/>'),
    note:L('<path d="M6 12.2V3.4l7-1.4v8.6"/><circle cx="4.4" cy="12.2" r="1.8"/><circle cx="11.4" cy="10.6" r="1.8"/>'),
    gear:L('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v1.8M8 12.4v1.8M1.8 8h1.8M12.4 8h1.8M3.6 3.6l1.3 1.3M11.1 11.1l1.3 1.3M3.6 12.4l1.3-1.3M11.1 4.9l1.3-1.3"/>'),
    pin:L('<path d="M10.2 2 14 5.8l-2 .6-2.8 2.8-.4 2.8-1 1L2.2 7.4l1-1 2.8-.4 2.8-2.8z"/><path d="M5 11 2 14"/>'),
    chevUp:L('<path d="M4 10l4-4 4 4"/>'),
    chevDown:L('<path d="M4 6l4 4 4-4"/>'),
    close:L('<path d="M4 4l8 8M12 4l-8 8"/>'),
    left:L('<path d="M9.6 4 5.6 8l4 4"/>'),
    right:L('<path d="M6.4 4l4 4-4 4"/>'),
    home:L('<path d="M2.6 7.4 8 2.8l5.4 4.6V13c0 .4-.3.6-.6.6H9.8V10H6.2v3.6H3.2c-.3 0-.6-.2-.6-.6z"/>'),
    agent:L('<circle cx="8" cy="8" r="2.2"/><circle cx="8" cy="8" r="5.6" stroke-dasharray="2.2 2.2"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15"/>'),
    upload:L('<path d="M8 11V2.6M5 5.6l3-3 3 3"/><path d="M2.6 10.4v2.2c0 .5.4.9.9.9h9c.5 0 .9-.4.9-.9v-2.2"/>'),
    share:L('<circle cx="12" cy="3.6" r="1.8"/><circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="12.4" r="1.8"/><path d="M5.6 7.1 10.4 4.5M5.6 8.9l4.8 2.6"/>'),
    link:L('<path d="M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.4-2.4a2.6 2.6 0 0 0-3.7-3.7L8.4 4"/><path d="M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.1 9.2a2.6 2.6 0 0 0 3.7 3.7L7.6 12"/>'),
    check:L('<path d="M3 8.4 6.4 11.6 13 4.6"/>'),
  };
})();
/* a CTA keeps its icon when its words change */
function setLabel(btn,text){ if(!btn) return; const t=btn.querySelector('.cta-t,.ib-t'); if(t) t.textContent=text; else btn.textContent=text; }
/* fill every [data-icon] placeholder in the page with its icon */
function paintIcons(root){ (root||document).querySelectorAll('[data-icon]').forEach(el=>{ if(el.dataset.painted) return; const s=ICONS[el.dataset.icon]; if(s){ el.insertAdjacentHTML('afterbegin',s); el.dataset.painted='1'; } }); }
