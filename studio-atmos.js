/* KYMA · studio/atmos — the Atmosphere studio
   One live AtmosEngine plays the scene. Faders, knobs, scene changes, key changes and Evolve are all
   smooth parameter moves on that running engine, so nothing restarts or clicks. The scene is saved
   with the project; Add to project lays it under the song as an atmosphere track, Export renders it. */
const AT={scene:'Forest dawn',p:null,space:.55,level:.8,evolve:false,secs:60,range:'song',E:null,bus:null,send:null,ana:null,evoT:null,faders:{}};
const AT_SECS=[30,60,120,300];
function atDefaults(scene){ const base={fadeIn:3,fadeOut:3,motion:.4,bright:.6}; ATMOS_LAYERS.forEach(k=>base[k]=0); return {...base,...ATMOS_SCENES[scene]}; }
const atMidi=()=>48+S.root;
const atActive=()=>ATMOS_LAYERS.filter(k=>(AT.p[k]||0)>.01).length;
function atChanged(){ persist(); renderAtHead(); }

/* ---------- the live engine ---------- */
function atEnsureBus(){
  ensureAudio(); if(AT.bus) return;
  AT.bus=new GainNode(ac,{gain:AT.level}); AT.send=new GainNode(ac,{gain:AT.space}); AT.ana=new AnalyserNode(ac,{fftSize:2048,smoothingTimeConstant:.6});
  AT.bus.connect(G.music); AT.bus.connect(AT.send).connect(G.revIn); AT.bus.connect(AT.ana);
}
function atStart(){
  atEnsureBus(); if(ac.state!=='running') ac.resume(); if(AT.E) return;
  const E=AtmosEngine(ac,AT.bus,G.R,{raw:true,midi:atMidi(),p:AT.p}), now=ac.currentTime;
  E.out.gain.setValueAtTime(0,now); E.out.gain.linearRampToValueAtTime(1,now+Math.max(.6,Math.min(3,AT.p.fadeIn||1.5)));
  E.start(now+.02); E.live(); AT.E=E; renderAtTransport();
}
function atStop(){ const E=AT.E; if(!E) return; AT.E=null; E.stop(Math.max(.4,Math.min(4,AT.p.fadeOut||1.2))); renderAtTransport(); }
function atApply(ramp){ if(AT.E) AT.E.set(AT.p,ramp); }

/* ---------- Evolve: a slow random walk on the active layers ---------- */
function atEvolveTick(){
  ATMOS_LAYERS.forEach(k=>{ const v=AT.p[k]||0; if(v<.02&&Math.random()>.06) return; let n=v+(Math.random()-.5)*.22; if(v<.02) n=.12+Math.random()*.15; AT.p[k]=+clamp(n,0,1).toFixed(3); if(AT.p[k]<.05) AT.p[k]=0; });
  AT.p.motion=+clamp(AT.p.motion+(Math.random()-.5)*.12,.05,1).toFixed(3); AT.p.bright=+clamp(AT.p.bright+(Math.random()-.5)*.08,.1,1).toFixed(3);
  atApply(5.5); Object.values(AT.faders).forEach(f=>f._show()); renderKnobs(); renderAtHead(); persist();
}
function atSetEvolve(on){ AT.evolve=on; clearInterval(AT.evoT); if(on){ AT.evoT=setInterval(atEvolveTick,6000); if(!AT.E) atStart(); atEvolveTick(); } $('atEvolve').setAttribute('aria-pressed',on); persist(); }

/* ---------- faders ---------- */
function vfader(key,label,get,set){
  const el=document.createElement('div'); el.className='vfader'; el.tabIndex=0; el.setAttribute('role','slider'); el.setAttribute('aria-label',label); el.setAttribute('aria-valuemin',0); el.setAttribute('aria-valuemax',100);
  el.innerHTML='<div class="vf-track"><i></i><span class="vf-meter"></span></div><b></b><small></small>'; el.querySelector('small').textContent=label;
  const show=()=>{ const v=get(); el.style.setProperty('--v',v); el.querySelector('b').textContent=Math.round(v*100); el.setAttribute('aria-valuenow',Math.round(v*100)); el.classList.toggle('off',v<.01); };
  const tr=el.querySelector('.vf-track'); let drag=null;
  const at=e=>{ const r=tr.getBoundingClientRect(); set(clamp(1-(e.clientY-r.top)/r.height,0,1)); show(); };
  el.addEventListener('pointerdown',e=>{ e.preventDefault(); el.focus(); el.setPointerCapture(e.pointerId); drag={y:e.clientY,v:get(),fine:e.shiftKey}; if(!e.shiftKey) at(e); });
  el.addEventListener('pointermove',e=>{ if(!drag) return; if(drag.fine){ const r=tr.getBoundingClientRect(); set(clamp(drag.v+(drag.y-e.clientY)/r.height*.25,0,1)); show(); } else at(e); });
  const end=()=>{ if(drag){ drag=null; atChanged(); } }; el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
  el.addEventListener('wheel',e=>{ e.preventDefault(); set(clamp(get()-e.deltaY*.0012,0,1)); show(); clearTimeout(el._wt); el._wt=setTimeout(atChanged,300); },{passive:false});
  el.addEventListener('keydown',e=>{ const d={ArrowUp:.05,ArrowRight:.05,ArrowDown:-.05,ArrowLeft:-.05,PageUp:.2,PageDown:-.2}[e.key]; if(d==null) return; e.preventDefault(); set(clamp(get()+d,0,1)); show(); atChanged(); });
  el.addEventListener('dblclick',()=>{ set(get()>0?0:.5); show(); atChanged(); });
  show(); el._show=show; return el;
}

/* ---------- render ---------- */
function renderAtHead(){
  const t=$('atTitle'); t.innerHTML=''; const sp=document.createElement('span'); sp.textContent=AT.scene; t.appendChild(sp); const i=document.createElement('i'); i.textContent='.'; t.appendChild(i);
  $('atKey').textContent=NOTE_NAMES[S.root]; const on=atActive(); $('atCount').textContent=on+' layer'+(on===1?'':'s');
  document.querySelectorAll('#atScenes .mchip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===AT.scene));
  const tracks=S.tracks.filter(tr=>INST[tr.inst]?.engine==='atmos').length; $('atInProject').textContent=tracks?`The project has ${tracks} atmosphere track${tracks>1?'s':''}.`:'Nothing from here is in the project yet.';
}
function renderAtTransport(){ const b=$('atPlay'); b.innerHTML=AT.E?ICON_PAUSE:ICON_PLAY; b.setAttribute('aria-label',AT.E?'Stop the atmosphere':'Play the atmosphere'); $('atState').textContent=AT.E?'playing live':'stopped'; $('atScene').classList.toggle('live',!!AT.E); }
function renderKnobs(){
  const kn=$('atKnobs'); kn.innerHTML='';
  [[P('motion','Motion',0,1,.4,{fmt:fmtPct,tip:'How fast things drift'}),()=>AT.p.motion,v=>{ AT.p.motion=v; atApply(.4); }],
   [P('bright','Brightness',0,1,.6,{fmt:fmtPct}),()=>AT.p.bright,v=>{ AT.p.bright=v; atApply(.2); }],
   [P('space','Space',0,1,.55,{fmt:fmtPct,tip:'Reverb send'}),()=>AT.space,v=>{ AT.space=v; if(AT.send) AT.send.gain.setTargetAtTime(v,ac.currentTime,.08); }],
   [P('level','Level',0,1.2,.8,{fmt:fmtPct}),()=>AT.level,v=>{ AT.level=v; if(AT.bus) AT.bus.gain.setTargetAtTime(v,ac.currentTime,.05); }],
   [P('fadeIn','Fade in',0,12,3,{fmt:fmtS,tip:'Used when it starts, on the timeline and in exports'}),()=>AT.p.fadeIn,v=>{ AT.p.fadeIn=v; }],
   [P('fadeOut','Fade out',0,12,3,{fmt:fmtS}),()=>AT.p.fadeOut,v=>{ AT.p.fadeOut=v; }]]
   .forEach(([spec,get,set])=>kn.appendChild(knob(spec,get,v=>{ set(v); clearTimeout(renderKnobs.t); renderKnobs.t=setTimeout(persist,300); },'var(--orange)')));
}
function renderAtmos(){
  const sc=$('atScenes'); sc.innerHTML='';
  Object.keys(ATMOS_SCENES).forEach(n=>{ const b=document.createElement('button'); b.className='mchip'; b.dataset.s=n; b.textContent=n;
    b.onclick=()=>{ AT.scene=n; AT.p={...atDefaults(n),fadeIn:AT.p.fadeIn,fadeOut:AT.p.fadeOut}; atApply(2.5); Object.values(AT.faders).forEach(f=>f._show()); renderKnobs(); atChanged(); if(!AT.E) atStart(); }; sc.appendChild(b); });
  const fz=$('atFaders'); fz.innerHTML=''; AT.faders={};
  ATMOS_LAYERS.forEach(k=>{ const f=vfader(k,ATMOS_LABEL[k],()=>AT.p[k]||0,v=>{ AT.p[k]=v; atApply(.12); renderAtHead(); }); f.dataset.k=k; AT.faders[k]=f; fz.appendChild(f); });
  renderKnobs();
  $('atSampleName').textContent=SAMPLE.name||'built-in choir';
  $('atSecs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===AT.secs));
  $('atRange').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===AT.range));
  $('atEvolve').setAttribute('aria-pressed',AT.evolve);
  const pads=$('atPads'); pads.innerHTML='';
  FX_PIECES.forEach((n,i)=>{ const d=document.createElement('div'); d.className='fxpad'; d.innerHTML=`<button class="fx-hear" title="Hear ${n}"><i></i><span></span><small>${String(i+1).padStart(2,'0')}</small></button><button class="fx-add" title="Add ${n} to the project at the playhead" aria-label="Add ${n} to the project at the playhead">+</button>`;
    d.querySelector('span').textContent=n; d.querySelector('.fx-hear').onclick=()=>auditionFx(i);
    d.querySelector('.fx-add').onclick=()=>{ const st=snapTo(curStep(),4); addFxAt(i,st); renderAtHead(); toast(`${n} added to the project at ${fmtMS(st*stepDur())}, on the FX track`,[{label:'Undo',fn:undo},{label:'Open in Compose',fn:()=>openStudio('compose')}]); };
    pads.appendChild(d); });
  renderAtHead(); renderAtTransport();
}

/* ---------- live spectrogram ---------- */
function atViz(){
  const cv=$('atViz'); if(!cv) return; const dpr=devicePixelRatio||1, W=cv.clientWidth, H=cv.clientHeight; if(!W||!H) return;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  const g=cv.getContext('2d'), cw=cv.width, ch=cv.height, col=Math.max(1,Math.round(2*dpr));
  g.globalCompositeOperation='copy'; g.drawImage(cv,-col,0); g.globalCompositeOperation='source-over';
  g.clearRect(cw-col,0,col,ch);
  if(!AT.ana||!AT.E){ return; }
  const bins=atViz.b||(atViz.b=new Uint8Array(AT.ana.frequencyBinCount)); AT.ana.getByteFrequencyData(bins);
  const sr=ac.sampleRate, n=bins.length, rows=Math.ceil(ch/(2*dpr)), lo=Math.log(40), hi=Math.log(14000);
  for(let r=0;r<rows;r++){ const f0=Math.exp(lo+(hi-lo)*r/rows), f1=Math.exp(lo+(hi-lo)*(r+1)/rows); let i0=Math.floor(f0/(sr/2)*n), i1=Math.max(i0+1,Math.ceil(f1/(sr/2)*n)), m=0;
    for(let i=i0;i<i1&&i<n;i++) m=Math.max(m,bins[i]); const v=Math.pow(m/255,1.8); if(v<.02) continue;
    g.fillStyle=`rgba(${232+(244-232)*v|0},${105+(241-105)*v|0},${46+(234-46)*v|0},${Math.min(1,v*1.4)})`; g.fillRect(cw-col,ch-(r+1)*2*dpr,col,2*dpr); }
}

/* ---------- use it: add to the project, export ---------- */
function openStudio(id){ Project.saveNow(); location.href=id+'.html'; }
function atRangeSteps(){ if(AT.range==='16'){ const a=Math.floor(curStep()/16)*16; return [a,a+256]; } if(AT.range==='intro') return [0,Math.min(S.len,128)]; return [0,Math.max(S.len,64)]; }
function atSendToSong(){
  const [a,b]=atRangeSteps(); if(b<=a) return; pushHist();
  const I=INST[slug(AT.scene)]||INSTS.find(x=>x.engine==='atmos'); const tr=newTrack(I.id,{name:'Atmosphere · '+AT.scene}); tr.p={...AT.p}; tr.role='texture'; tr.space=AT.space; tr.vol=AT.level; tr.oct=3;
  tr.clips.push(newClip(a,b-a,[{t:0,d:b-a,n:0,v:.85}],{name:AT.scene})); S.tracks.push(tr);
  if(b>S.len) S.len=Math.ceil(b/16)*16; if(G) applyGraph(G); markDirty(); persist(); renderAtHead(); emit('header');
  toast(`${AT.scene} is now a track under ${fmtMS(a*stepDur())}–${fmtMS(b*stepDur())} of “${S.name}”.`,[{label:'Open in Compose',fn:()=>openStudio('compose')},{label:'Undo',fn:()=>{ undo(); renderAtHead(); }}],9000);
}
async function atExport(){
  const btn=$('atExport'); btn.disabled=true; const old=btn.textContent; btn.textContent='Rendering…';
  try{ const sr=48000, secs=AT.secs, ctx=new OfflineAudioContext(2,sr*secs,sr), R=resources(ctx), out=ctx.createGain(), conv=ctx.createConvolver(), wet=gainN(ctx,AT.space*.9), lvl=gainN(ctx,AT.level);
    offlineTicks(ctx,secs); conv.normalize=false; conv.buffer=makeIR(ctx,6); lvl.connect(ctx.destination); lvl.connect(wet).connect(conv).connect(ctx.destination); out.connect(lvl);
    hud('Rendering '+AT.scene,fmtMS(secs)+' of atmosphere',.1,'busy');
    VOICES.atmos(ctx,out,{...AT.p,fadeIn:Math.max(1,AT.p.fadeIn||3),fadeOut:Math.max(2,AT.p.fadeOut||3)},0,.85,secs,atMidi(),R);
    const buf=await ctx.startRendering(); masterBuffer(buf,-18); const name=slug(AT.scene)+'-'+secs+'s';
    hideHud(); await offerFile(name+'.zip',makeZip([{name:name+'.wav',data:encodeWav(buf,24)}])); }
  catch(e){ console.error(e); hideHud(); toast('That render stopped. Try a shorter length.'); }
  btn.disabled=false; btn.textContent=old;
}
function hud(title,time,frac,state){ const h=$('humHud'); h.hidden=false; h.dataset.state=state||'busy'; $('hhTitle').textContent=title; $('hhTime').textContent=time; $('hhFill').style.width=(frac==null?0:clamp(frac,0,1)*100)+'%'; $('hhStop').hidden=$('hhCancel').hidden=true; }
function hideHud(){ $('humHud').hidden=true; }
async function atLoadAudio(f){ if(await loadUserSample(f)){ if(!AT.p.grains) AT.p.grains=.5; atApply(.5); AT.faders.grains._show(); $('atSampleName').textContent=SAMPLE.name; atChanged(); } }

/* ---------- wiring ---------- */
function initAtmos(){
  try{ const a=JSON.parse(localStorage.getItem('kyma.atmos')||'{}'); if(isFinite(a.secs)&&AT_SECS.includes(+a.secs)) AT.secs=+a.secs; }catch(e){}
  on('project',p=>{ const a=p.atmos||{}; if(ATMOS_SCENES[a.scene]) AT.scene=a.scene; AT.p={...atDefaults(AT.scene),...(a.p&&typeof a.p==='object'?a.p:{})};
    if(isFinite(a.space)) AT.space=clamp(+a.space,0,1); if(isFinite(a.level)) AT.level=clamp(+a.level,0,1.2); if(['song','intro','16'].includes(a.range)) AT.range=a.range;
    renderAtmos(); if(a.evolve) atSetEvolve(true); });
  on('serialize',p=>{ p.atmos={scene:AT.scene,p:{...AT.p},space:AT.space,level:AT.level,range:AT.range,evolve:AT.evolve}; });
  on('key',(e,{typing,sheetOpen,mod,k})=>{ if(typing||sheetOpen||mod) return false; if(k==='a'&&!e.repeat){ AT.E?atStop():atStart(); return true; } return false; });
  on('header',()=>{ if(AT.E) AT.E.setKey(atMidi()); renderAtHead(); });
  on('export',()=>{ atExport(); return true; });
  on('frame',atViz);
  on('choir',()=>{ $('atSampleName').textContent=SAMPLE.name||'built-in choir'; });
  $('atPlay').onclick=()=>AT.E?atStop():atStart();
  $('atEvolve').onclick=()=>atSetEvolve(!AT.evolve);
  $('atClear').onclick=()=>{ ATMOS_LAYERS.forEach(k=>AT.p[k]=0); atApply(1.2); Object.values(AT.faders).forEach(f=>f._show()); atChanged(); };
  $('atSend').onclick=atSendToSong; $('atExport').onclick=atExport;
  $('atSecs').querySelectorAll('button').forEach(b=>b.onclick=()=>{ AT.secs=+b.dataset.v; try{ localStorage.setItem('kyma.atmos',JSON.stringify({secs:AT.secs})); }catch(e){} renderAtmos(); });
  $('atRange').querySelectorAll('button').forEach(b=>b.onclick=()=>{ AT.range=b.dataset.v; persist(); $('atRange').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); });
  $('atLoad').onclick=()=>$('atFile').click(); $('atFile').onchange=e=>{ const f=e.target.files[0]; e.target.value=''; if(f) atLoadAudio(f); };
  $('atToCompose').onclick=()=>openStudio('compose');
  AT.p=atDefaults(AT.scene);
}
boot({ init:initAtmos });
