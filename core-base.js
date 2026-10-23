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
  show(); return el;
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

