/* KYMA · studio/atmos — the Atmosphere studio
   One live AtmosEngine plays the scene. Faders, knobs, scene changes, key changes and Evolve are all
   smooth parameter moves on that running engine, so nothing restarts or clicks. The scene is saved
   with the project; Add to project lays it under the song as an atmosphere track, Export renders it. */
const AT={scene:'Forest dawn',p:null,space:.55,level:.8,evolve:false,secs:60,range:'song',E:null,bus:null,send:null,ana:null,evoT:null,faders:{},strips:{},
  presets:[],A:null,B:null,morph:0,auto:false,autoLen:120,autoT0:0,
  strip:null,strum:'harp',cycLen:8,build:false,progI:-1,harmT:[]};
const AT_SECS=[30,60,120,300];
function atDefaults(scene){ const base={fadeIn:3,fadeOut:3,motion:.4,bright:.6,width:1,lowcut:0}; ATMOS_LAYERS.forEach(k=>{ base[k]=0; base['pan_'+k]=0; base['tone_'+k]=1; base['mute_'+k]=0; base['solo_'+k]=0; }); return {...base,...AT_HARM0(),...ATMOS_SCENES[scene]}; }
/* the harmony keys of a mix: chord, colour, cycle time and the eight progression steps */
const AT_HARM0=()=>({ch_deg:-1,ch_col:0,cyc:0,pg0:-1,pg1:-1,pg2:-1,pg3:-1,pg4:-1,pg5:-1,pg6:-1,pg7:-1});
const atHarmOf=p=>Object.fromEntries(Object.keys(AT_HARM0()).map(k=>[k,p[k]??AT_HARM0()[k]]));
const AT_PRESET_KEY='kyma.atmosPresets';
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
  const E=AtmosEngine(ac,AT.bus,G.R,{raw:true,midi:atMidi(),p:AT.p,onHarm:atOnHarm}), now=ac.currentTime;
  E.out.gain.setValueAtTime(0,now); E.out.gain.linearRampToValueAtTime(1,now+Math.max(.6,Math.min(3,AT.p.fadeIn||1.5)));
  E.start(now+.02); E.live(); AT.E=E; renderAtTransport();
}
function atStop(){ const E=AT.E; if(!E) return; AT.E=null; AT.harmT.forEach(clearTimeout); AT.harmT=[]; E.stop(Math.max(.4,Math.min(4,AT.p.fadeOut||1.2))); renderAtTransport(); }
function atApply(ramp){ if(AT.E) AT.E.set(AT.p,ramp); }

/* ---------- Evolve: a slow random walk on the active layers ---------- */
function atEvolveTick(){
  ATMOS_LAYERS.forEach(k=>{ const v=AT.p[k]||0; if(v<.02&&Math.random()>.06) return; let n=v+(Math.random()-.5)*.22; if(v<.02) n=.12+Math.random()*.15; AT.p[k]=+clamp(n,0,1).toFixed(3); if(AT.p[k]<.05) AT.p[k]=0; });
  ATMOS_LAYERS.forEach(k=>{ if((AT.p[k]||0)>.02) AT.p['pan_'+k]=+clamp((AT.p['pan_'+k]||0)+(Math.random()-.5)*.18,-.8,.8).toFixed(3); });
  AT.p.motion=+clamp(AT.p.motion+(Math.random()-.5)*.12,.05,1).toFixed(3); AT.p.bright=+clamp(AT.p.bright+(Math.random()-.5)*.08,.1,1).toFixed(3);
  atApply(5.5); refreshMix(); renderAtHead(); persist();
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
   [P('width','Width',0,1.5,1,{fmt:fmtPct,tip:'How far the layers spread across the stereo field'}),()=>AT.p.width??1,v=>{ AT.p.width=v; atApply(.2); }],
   [P('lowcut','Low cut',0,1,0,{fmt:v=>Math.round(20+v*v*780)+' Hz',tip:'Thins the bottom end so it sits under a voice'}),()=>AT.p.lowcut||0,v=>{ AT.p.lowcut=v; atApply(.2); }],
   [P('fadeIn','Fade in',0,12,3,{fmt:fmtS,tip:'Used when it starts, on the timeline and in exports'}),()=>AT.p.fadeIn,v=>{ AT.p.fadeIn=v; }],
   [P('fadeOut','Fade out',0,12,3,{fmt:fmtS}),()=>AT.p.fadeOut,v=>{ AT.p.fadeOut=v; }]]
   .forEach(([spec,get,set])=>kn.appendChild(knob(spec,get,v=>{ set(v); clearTimeout(renderKnobs.t); renderKnobs.t=setTimeout(persist,300); },'var(--orange)')));
}
function renderAtmos(){
  const sc=$('atScenes'); sc.innerHTML='';
  Object.entries(ATMOS_GROUPS).forEach(([g,names])=>{ const row=document.createElement('div'); row.className='at-group'; row.innerHTML='<span class="lbl"></span><div class="mchips"></div>'; row.querySelector('.lbl').textContent=g;
    names.filter(n=>ATMOS_SCENES[n]).forEach(n=>{ const b=document.createElement('button'); b.className='mchip'; b.dataset.s=n; b.textContent=n; b.onclick=()=>atLoadScene(n); row.querySelector('.mchips').appendChild(b); }); sc.appendChild(row); });
  renderMixer(); renderKnobs(); renderPresets(); renderMorph(); renderHarmony();
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

function atLoadScene(n){ AT.scene=n; AT.p={...atDefaults(n),fadeIn:AT.p.fadeIn,fadeOut:AT.p.fadeOut,...atHarmOf(AT.p),...(AT.p.chord>.01?{chord:AT.p.chord}:{})}; atApply(2.5); refreshMix(); atChanged(); if(!AT.E) atStart(); }

/* ---------- the mixer: level, tone, pan, mute and solo for every layer ---------- */
function renderMixer(){
  const fz=$('atFaders'); fz.innerHTML=''; AT.faders={}; AT.strips={};
  ATMOS_LAYERS.forEach(k=>{
    const col=document.createElement('div'); col.className='mx'; col.dataset.k=k;
    const f=vfader(k,ATMOS_LABEL[k],()=>AT.p[k]||0,v=>{ AT.p[k]=v; atApply(.12); renderAtHead(); }); AT.faders[k]=f; col.appendChild(f);
    const st=document.createElement('div'); st.className='mx-strip';
    st.innerHTML=`<label title="Tone: turn down to muffle this layer"><span>tone</span><input class="mini" type="range" min="0" max="100" data-c="tone" aria-label="${ATMOS_LABEL[k]} tone"></label>
      <label title="Pan: left or right"><span>pan</span><input class="mini" type="range" min="-100" max="100" data-c="pan" aria-label="${ATMOS_LABEL[k]} pan"></label>
      <div class="mx-ms"><button class="ms m" data-c="mute" title="Mute ${ATMOS_LABEL[k]}">M</button><button class="ms s" data-c="solo" title="Solo ${ATMOS_LABEL[k]}">S</button></div>`;
    const tone=st.querySelector('[data-c=tone]'), pan=st.querySelector('[data-c=pan]'), mu=st.querySelector('[data-c=mute]'), so=st.querySelector('[data-c=solo]');
    tone.oninput=()=>{ AT.p['tone_'+k]=tone.value/100; atApply(.08); }; tone.onchange=atChanged; tone.ondblclick=()=>{ tone.value=100; tone.oninput(); atChanged(); };
    pan.oninput=()=>{ AT.p['pan_'+k]=pan.value/100; atApply(.08); }; pan.onchange=atChanged; pan.ondblclick=()=>{ pan.value=0; pan.oninput(); atChanged(); };
    mu.onclick=()=>{ AT.p['mute_'+k]=AT.p['mute_'+k]>.5?0:1; atApply(.15); refreshMix(); atChanged(); };
    so.onclick=()=>{ AT.p['solo_'+k]=AT.p['solo_'+k]>.5?0:1; atApply(.15); refreshMix(); atChanged(); };
    col.appendChild(st); AT.strips[k]={tone,pan,mu,so,col}; fz.appendChild(col);
  });
  refreshMix();
}
function refreshMix(){
  const anySolo=ATMOS_LAYERS.some(k=>AT.p['solo_'+k]>.5);
  ATMOS_LAYERS.forEach(k=>{ const S2=AT.strips[k]; if(!S2) return; AT.faders[k]._show();
    S2.tone.value=Math.round((AT.p['tone_'+k]??1)*100); S2.pan.value=Math.round((AT.p['pan_'+k]||0)*100);
    S2.mu.setAttribute('aria-pressed',AT.p['mute_'+k]>.5); S2.so.setAttribute('aria-pressed',AT.p['solo_'+k]>.5);
    S2.col.classList.toggle('silenced',AT.p['mute_'+k]>.5||(anySolo&&!(AT.p['solo_'+k]>.5))); });
  renderKnobs();
}
function atVary(){
  ATMOS_LAYERS.forEach(k=>{ const v=AT.p[k]||0; if(v<.02) return; AT.p[k]=+clamp(v+(Math.random()-.5)*.24,.04,1).toFixed(3);
    AT.p['pan_'+k]=+clamp((AT.p['pan_'+k]||0)+(Math.random()-.5)*.5,-.9,.9).toFixed(3); AT.p['tone_'+k]=+clamp((AT.p['tone_'+k]??1)+(Math.random()-.5)*.3,.25,1).toFixed(3); });
  AT.p.motion=+clamp(AT.p.motion+(Math.random()-.5)*.2,.05,1).toFixed(3); atApply(2); refreshMix(); atChanged();
}

/* ---------- presets: save a mix, recall it with a glide ---------- */
const atSnap=name=>({name,scene:AT.scene,p:{...AT.p},space:AT.space,level:AT.level});
function atStorePresets(){ try{ localStorage.setItem(AT_PRESET_KEY,JSON.stringify(AT.presets.slice(0,60))); }catch(e){} persist(); }
function atMergePresets(list){ (Array.isArray(list)?list:[]).forEach(x=>{ if(x&&x.name&&x.p&&!AT.presets.some(y=>y.name===x.name)) AT.presets.push({name:String(x.name).slice(0,40),scene:x.scene,p:x.p,space:+x.space||AT.space,level:+x.level||AT.level}); }); }
function atRecall(x,glide=2.5){ AT.p={...atDefaults(ATMOS_SCENES[x.scene]?x.scene:AT.scene),...x.p}; if(ATMOS_SCENES[x.scene]) AT.scene=x.scene; AT.space=clamp(+x.space||AT.space,0,1); AT.level=clamp(+x.level||AT.level,0,1.2);
  if(AT.send) AT.send.gain.setTargetAtTime(AT.space,ac.currentTime,.4); if(AT.bus) AT.bus.gain.setTargetAtTime(AT.level,ac.currentTime,.3); atApply(glide); refreshMix(); renderAtHead(); }
function renderPresets(){
  const box=$('atPresets'); box.innerHTML='';
  if(!AT.presets.length){ box.innerHTML='<p class="hint">Shape a mix, name it and save it. Presets stay in this browser and travel with the project.</p>'; return; }
  AT.presets.forEach((x,i)=>{ const b=document.createElement('div'); b.className='pchip'; b.innerHTML='<button class="pc-go"></button><button class="pc-x" aria-label="Delete preset">×</button>';
    b.querySelector('.pc-go').textContent=x.name; b.querySelector('.pc-go').title='Glide to '+x.name+(x.scene?' ('+x.scene+')':'');
    b.querySelector('.pc-go').onclick=()=>{ atRecall(x); if(!AT.E) atStart(); persist(); };
    b.querySelector('.pc-x').onclick=()=>{ const gone=AT.presets.splice(i,1)[0]; atStorePresets(); renderPresets(); toast('Deleted '+gone.name,[{label:'Undo',fn:()=>{ AT.presets.splice(i,0,gone); atStorePresets(); renderPresets(); }}]); };
    box.appendChild(b); });
}
function atSavePreset(){
  const inp=$('atPresetName'); let name=inp.value.trim()||AT.scene+' mix'; let n=2, base=name; while(AT.presets.some(x=>x.name===name)) name=base+' '+(n++);
  AT.presets.unshift(atSnap(name)); inp.value=''; atStorePresets(); renderPresets(); toast('Saved preset “'+name+'”');
}

/* ---------- morph: slide between two mixes ---------- */
function atLerpMix(A,B,m){
  const out={}, keys=new Set([...Object.keys(A.p),...Object.keys(B.p)]), d=atDefaults(AT.scene);
  keys.forEach(k=>{ const a=A.p[k]??d[k]??0, b=B.p[k]??d[k]??0; out[k]=/^(mute|solo)_|^ch_|^pg\d|^cyc$/.test(k)?(m<.5?a:b):a+(b-a)*m; });
  return {p:out,space:A.space+(B.space-A.space)*m,level:A.level+(B.level-A.level)*m};
}
function atMorphTo(m,ramp=.15){
  AT.morph=clamp(m,0,1); $('atMorph').value=Math.round(AT.morph*100); if(!AT.A||!AT.B) return;
  const x=atLerpMix(AT.A,AT.B,AT.morph); AT.p={...AT.p,...x.p}; AT.space=x.space; AT.level=x.level;
  if(AT.send) AT.send.gain.setTargetAtTime(AT.space,ac.currentTime,ramp/3); if(AT.bus) AT.bus.gain.setTargetAtTime(AT.level,ac.currentTime,ramp/3); atApply(ramp);
  if(!atMorphTo.t||performance.now()-atMorphTo.t>120){ atMorphTo.t=performance.now(); refreshMix(); }
}
function renderMorph(){
  $('atSetA').querySelector('b').textContent=AT.A?AT.A.name:'empty'; $('atSetB').querySelector('b').textContent=AT.B?AT.B.name:'empty';
  $('atMorph').disabled=!(AT.A&&AT.B); $('atMorph').value=Math.round(AT.morph*100); $('atAuto').setAttribute('aria-pressed',AT.auto); $('atAuto').disabled=!(AT.A&&AT.B);
  $('atAutoLen').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===AT.autoLen));
}
function atMorphFrame(now){
  if(!AT.auto||!AT.A||!AT.B) return; const T=AT.autoLen*1000, ph=((now-AT.autoT0)%T)/T, m=.5-.5*Math.cos(ph*Math.PI*2);
  if(Math.abs(m-AT.morph)>.004) atMorphTo(m,.4);
}

/* ---------- harmony: chord strips, always on ----------
   A chord moves every tonal layer (drone, shimmer, chord pad, grains, pulse, sub) to its notes with a glide.
   Build collects tapped chords into a progression; Cycle walks it on its own, live, on the timeline and in exports. */
const atProg=()=>{ const l=[]; for(let i=0;i<8;i++){ const d=AT.p['pg'+i]; if(d!=null&&d>=0) l.push(d); } return l; };
function atSetProg(l){ for(let i=0;i<8;i++) AT.p['pg'+i]=l[i]??-1; if(!l.length) AT.p.cyc=0; }
function atStrumVoice(degs,o={}){
  if(AT.strum==='off') return; atEnsureBus(); if(ac.state!=='running') ac.resume(); const I=INST[AT.strum]; if(!I) return;
  const t0=ac.currentTime+.01; degs.forEach((d,i)=>{ try{ VOICES[I.engine](ac,AT.bus,I.p,t0+(o.gap??.03)*i,(o.vel||.55)*(1-i*.04),o.dur||2.6,degToMidi(d,3),G.R); }catch(e){ console.warn(e); } });
}
function atChooseChord(d,quiet){
  const cycling=(AT.p.cyc||0)>0;
  if(AT.build){ const l=atProg(); if(l.length<8){ l.push(d); atSetProg(l); } else if(!quiet) toast('The progression holds eight chords. Clear it or remove one first.'); }
  else if(cycling){ AT.p.cyc=0; AT.progI=-1; }
  AT.p.ch_deg=d; AT.p.ch_col=AT.p.ch_col||0;
  if((AT.p.chord||0)<.02&&!AT.p['mute_chord']){ AT.p.chord=.45; if(!atChooseChord.told){ atChooseChord.told=true; toast('The Chords layer is up in the mixer, so you can hear the harmony on its own too.'); } }
  if(!AT.E) atStart(); atApply(.3); refreshMix(); renderHarmony(); renderAtHead(); persist();
}
function atOnHarm(i,d,t){
  const id=setTimeout(()=>{ AT.harmT=AT.harmT.filter(x=>x!==id); AT.progI=i; AT.p.ch_deg=d; renderHarmony(); },Math.max(0,(t-ac.currentTime)*1000)); AT.harmT.push(id);
}
function renderHarmony(){
  if(!AT.strip||!AT.p) return; AT.strip.render(); const d=AT.p.ch_deg??-1, col=AT.p.ch_col||0;
  AT.strip.mark(d>=0?d:null);
  if(d>=0){ const info=chordInfo(d,col); $('atChord').textContent=info.name; $('atChordR').textContent=info.roman+' · '+info.notes.join(' '); }
  else { $('atChord').textContent='On the key'; $('atChordR').textContent=NOTE_NAMES[S.root]+' '+S.scale+' · tap a chord'; }
  $('atCol').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===col));
  $('atStrum').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===AT.strum));
  $('atCyc').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===AT.cycLen));
  const l=atProg(), cyc=(AT.p.cyc||0)>0; $('atBuild').setAttribute('aria-pressed',AT.build); $('atCycle').setAttribute('aria-pressed',cyc); $('atCycle').disabled=!l.length; $('atProgClear').disabled=!l.length;
  const box=$('atProg'); box.innerHTML='';
  if(!l.length){ box.innerHTML='<span class="empty">Turn on Build and tap chords to make a progression.</span>'; return; }
  l.forEach((x,i)=>{ const b=document.createElement('div'); b.className='pchip'+(cyc&&i===AT.progI?' now':''); b.innerHTML='<button class="pc-go"></button><button class="pc-x" aria-label="Remove this chord">×</button>';
    const info=chordInfo(x,col); b.querySelector('.pc-go').textContent=info.name; b.querySelector('.pc-go').title=info.roman+' · glide to it';
    b.querySelector('.pc-go').onclick=()=>{ const keep=AT.build; AT.build=false; atChooseChord(x,true); AT.build=keep; renderHarmony(); };
    b.querySelector('.pc-x').onclick=()=>{ const m=atProg(); m.splice(i,1); atSetProg(m); atApply(.3); renderHarmony(); persist(); };
    box.appendChild(b); });
}
function initHarmony(){
  AT.strip=ChordStrip($('atStrips'),{colour:()=>AT.p?AT.p.ch_col||0:0,
    onChord:(d,degs)=>{ atChooseChord(d); const N=scaleLen(); atStrumVoice([...degs,d+N,...degs.slice(1,3).map(x=>x+N)],{gap:.045}); },
    onNote:(d,nd)=>{ if((AT.p.ch_deg??-1)!==d&&!((AT.p.cyc||0)>0)){ const keep=AT.build; AT.build=false; atChooseChord(d,true); AT.build=keep; } atStrumVoice([nd],{dur:2.2,vel:.5}); }});
  $('atCol').querySelectorAll('button').forEach(b=>b.onclick=()=>{ AT.p.ch_col=+b.dataset.v; atApply(.3); renderHarmony(); persist(); });
  $('atStrum').querySelectorAll('button').forEach(b=>b.onclick=()=>{ AT.strum=b.dataset.v; renderHarmony(); persist(); if(AT.strum!=='off'){ const d=Math.max(0,AT.p.ch_deg??0); atStrumVoice(chordDegs(d,AT.p.ch_col||0)); } });
  $('atKeyOnly').onclick=()=>{ AT.p.ch_deg=-1; AT.p.cyc=0; AT.progI=-1; atApply(.3); renderHarmony(); persist(); };
  $('atBuild').onclick=()=>{ AT.build=!AT.build; renderHarmony(); };
  $('atCycle').onclick=()=>{ if(!atProg().length) return; const on=!((AT.p.cyc||0)>0); AT.p.cyc=on?AT.cycLen:0; AT.progI=-1; if(on){ AT.build=false; if((AT.p.chord||0)<.02) AT.p.chord=.45; if(!AT.E) atStart(); }
    if(AT.E){ AT.E.next.harm=ac.currentTime+.05; AT.E.pi=-1; } atApply(.3); refreshMix(); renderHarmony(); persist(); };
  $('atCyc').querySelectorAll('button').forEach(b=>b.onclick=()=>{ AT.cycLen=+b.dataset.v; if((AT.p.cyc||0)>0) AT.p.cyc=AT.cycLen; atApply(.3); renderHarmony(); persist(); });
  $('atProgClear').onclick=()=>{ const keep=atProg(); atSetProg([]); AT.progI=-1; atApply(.3); renderHarmony(); persist(); toast('Cleared the progression',[{label:'Undo',fn:()=>{ atSetProg(keep); atApply(.3); renderHarmony(); persist(); }}]); };
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
  const btn=$('atExport'); btn.disabled=true; setLabel(btn,'Rendering…');
  try{ const sr=48000, secs=AT.secs, ctx=new OfflineAudioContext(2,sr*secs,sr), R=resources(ctx), out=ctx.createGain(), conv=ctx.createConvolver(), wet=gainN(ctx,AT.space*.9), lvl=gainN(ctx,AT.level);
    offlineTicks(ctx,secs); conv.normalize=false; conv.buffer=makeIR(ctx,6); lvl.connect(ctx.destination); lvl.connect(wet).connect(conv).connect(ctx.destination); out.connect(lvl);
    hud('Rendering '+AT.scene,fmtMS(secs)+' of atmosphere',.1,'busy');
    VOICES.atmos(ctx,out,{...AT.p,fadeIn:Math.max(1,AT.p.fadeIn||3),fadeOut:Math.max(2,AT.p.fadeOut||3)},0,.85,secs,atMidi(),R);
    const buf=await ctx.startRendering(); masterBuffer(buf,-18); const name=slug(AT.scene)+'-'+secs+'s';
    hideHud(); await offerFile(name+'.zip',makeZip([{name:name+'.wav',data:encodeWav(buf,24)}])); }
  catch(e){ console.error(e); hideHud(); toast('That render stopped. Try a shorter length.'); }
  btn.disabled=false; setLabel(btn,'Export WAV');
}
function hud(title,time,frac,state){ const h=$('humHud'); h.hidden=false; h.dataset.state=state||'busy'; $('hhTitle').textContent=title; $('hhTime').textContent=time; $('hhFill').style.width=(frac==null?0:clamp(frac,0,1)*100)+'%'; $('hhStop').hidden=$('hhCancel').hidden=true; }
function hideHud(){ $('humHud').hidden=true; }
async function atLoadAudio(f){ if(await loadUserSample(f)){ if(!AT.p.grains) AT.p.grains=.5; atApply(.5); AT.faders.grains._show(); $('atSampleName').textContent=SAMPLE.name; atChanged(); } }

/* ---------- wiring ---------- */
panelDefaults('atmos',{dock:['atplay','atevolve','atvary','atcycle','atkeyonly','at_space','at_level','at_motion','at_bright','atmorph','atsend','meter'],head:['atplay']});
function registerAtmosControls(){
  const G1='Atmosphere', kn=(id,label,get,set,o={})=>control({id,group:G1,kind:'knob',label,spec:P(id,label,o.min??0,o.max??1,o.def??.5,{fmt:fmtPct}),get,set});
  control({id:'atplay',group:G1,kind:'toggle',label:()=>AT.E?'Stop scene':'Play scene',icon:()=>AT.E?'pause':'cloud',keys:'A',hot:()=>!!AT.E,run:()=>AT.E?atStop():atStart(),pressed:()=>!!AT.E});
  control({id:'atevolve',group:G1,kind:'toggle',label:'Evolve',icon:'evolve',tip:'Let the layers drift on their own',run:()=>atSetEvolve(!AT.evolve),pressed:()=>AT.evolve});
  control({id:'atvary',group:G1,label:'Vary',icon:'shuffle',tip:'A one-off variation of the mix',run:atVary});
  control({id:'atnext',group:G1,label:'Next scene',icon:'skip',run:()=>{ const n=Object.values(ATMOS_GROUPS).flat().filter(x=>ATMOS_SCENES[x]), i=n.indexOf(AT.scene); atLoadScene(n[(i+1)%n.length]); }});
  control({id:'atcycle',group:G1,kind:'toggle',label:'Cycle chords',icon:'cycle',tip:'Walk the progression on its own',run:()=>$('atCycle').click(),pressed:()=>(AT.p.cyc||0)>0,disabled:()=>!atProg().length});
  control({id:'atbuild',group:G1,kind:'toggle',label:'Build',icon:'plus',tip:'Tapped chords join the progression',run:()=>$('atBuild').click(),pressed:()=>AT.build});
  control({id:'atkeyonly',group:G1,label:'Key only',icon:'note',tip:'Back to the plain key',run:()=>$('atKeyOnly').click()});
  control({id:'atautomorph',group:G1,kind:'toggle',label:'Auto morph',icon:'morph',run:()=>$('atAuto').click(),pressed:()=>AT.auto,disabled:()=>!(AT.A&&AT.B)});
  control({id:'atmorph',group:G1,kind:'slider',label:'Morph A · B',min:0,max:1,step:.005,get:()=>AT.morph,set:v=>{ AT.auto=false; atMorphTo(v); renderMorph(); },commit:()=>{ refreshMix(); persist(); },disabled:()=>!(AT.A&&AT.B)});
  kn('at_space','Space',()=>AT.space,v=>{ AT.space=v; if(AT.send) AT.send.gain.setTargetAtTime(v,ac.currentTime,.08); persist(); });
  kn('at_level','Level',()=>AT.level,v=>{ AT.level=v; if(AT.bus) AT.bus.gain.setTargetAtTime(v,ac.currentTime,.05); persist(); },{max:1.2,def:.8});
  kn('at_motion','Motion',()=>AT.p.motion,v=>{ AT.p.motion=v; atApply(.4); persist(); });
  kn('at_bright','Brightness',()=>AT.p.bright,v=>{ AT.p.bright=v; atApply(.2); persist(); });
  kn('at_chordlvl','Chords layer',()=>AT.p.chord||0,v=>{ AT.p.chord=v; atApply(.12); refreshMix(); persist(); });
  control({id:'atsend',group:G1,label:'Add to project',icon:'layers',run:atSendToSong});
  control({id:'atexport',group:G1,label:'Export WAV',icon:'export',run:()=>atExport()});
}
function initAtmos(){
  registerAtmosControls();
  try{ const a=JSON.parse(localStorage.getItem('kyma.atmos')||'{}'); if(isFinite(a.secs)&&AT_SECS.includes(+a.secs)) AT.secs=+a.secs; }catch(e){}
  try{ atMergePresets(JSON.parse(localStorage.getItem(AT_PRESET_KEY)||'[]')); }catch(e){}
  on('project',p=>{ const a=p.atmos||{}; if(ATMOS_SCENES[a.scene]) AT.scene=a.scene; AT.p={...atDefaults(AT.scene),...(a.p&&typeof a.p==='object'?a.p:{})};
    atMergePresets(a.presets); const okSnap=x=>x&&x.p&&typeof x.p==='object'?{name:String(x.name||'mix').slice(0,40),scene:x.scene,p:x.p,space:+x.space||.55,level:+x.level||.8}:null;
    AT.A=okSnap(a.A); AT.B=okSnap(a.B); if(isFinite(a.morph)) AT.morph=clamp(+a.morph,0,1); if([30,120,300].includes(a.autoLen)) AT.autoLen=a.autoLen;
    if(isFinite(a.space)) AT.space=clamp(+a.space,0,1); if(isFinite(a.level)) AT.level=clamp(+a.level,0,1.2); if(['song','intro','16'].includes(a.range)) AT.range=a.range;
    if(['harp','kalimba','vibraphone','off'].includes(a.strum)) AT.strum=a.strum; if([4,8,16,32].includes(a.cycLen)) AT.cycLen=a.cycLen; if((AT.p.cyc||0)>0) AT.cycLen=[4,8,16,32].includes(AT.p.cyc)?AT.p.cyc:AT.cycLen;
    renderAtmos(); if(a.evolve) atSetEvolve(true); });
  on('serialize',p=>{ p.atmos={scene:AT.scene,p:{...AT.p},space:AT.space,level:AT.level,range:AT.range,evolve:AT.evolve,presets:AT.presets.slice(0,60),A:AT.A,B:AT.B,morph:AT.morph,autoLen:AT.autoLen,strum:AT.strum,cycLen:AT.cycLen}; });
  on('key',(e,c)=>{ if(!c) return false; const {typing,sheetOpen,mod,k}=c; if(typing||sheetOpen||mod) return false; if(k==='a'&&!e.repeat){ AT.E?atStop():atStart(); return true; }
    if(/^[1-9]$/.test(e.key)&&AT.strip){ e.preventDefault(); if(!e.repeat) AT.strip.play(+e.key-1,{first:true}); return true; } return false; });
  on('header',()=>{ if(AT.E) AT.E.setKey(atMidi()); renderAtHead(); renderHarmony(); });
  on('export',()=>{ atExport(); return true; });
  on('frame',now=>{ atViz(); atMorphFrame(now); });
  on('choir',()=>{ $('atSampleName').textContent=SAMPLE.name||'built-in choir'; });
  $('atPlay').onclick=()=>AT.E?atStop():atStart();
  $('atEvolve').onclick=()=>atSetEvolve(!AT.evolve);
  $('atClear').onclick=()=>{ ATMOS_LAYERS.forEach(k=>AT.p[k]=0); atApply(1.2); refreshMix(); atChanged(); };
  $('atVary').onclick=atVary;
  $('atResetMix').onclick=()=>{ ATMOS_LAYERS.forEach(k=>{ AT.p['pan_'+k]=0; AT.p['tone_'+k]=1; AT.p['mute_'+k]=0; AT.p['solo_'+k]=0; }); atApply(.6); refreshMix(); atChanged(); };
  $('atPresetSave').onclick=atSavePreset; $('atPresetName').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); atSavePreset(); } };
  $('atSetA').onclick=()=>{ AT.A=atSnap(AT.scene); AT.morph=0; renderMorph(); persist(); toast('A is now this mix'); };
  $('atSetB').onclick=()=>{ AT.B=atSnap(AT.scene); AT.morph=1; renderMorph(); persist(); toast('B is now this mix. Slide to morph between A and B.'); };
  $('atMorph').oninput=e=>{ const m=e.target.value/100; AT.auto=false; atMorphTo(m); renderMorph(); }; $('atMorph').onchange=()=>{ refreshMix(); persist(); };
  $('atAuto').onclick=()=>{ AT.auto=!AT.auto; if(AT.auto){ AT.autoT0=performance.now()-Math.acos(1-2*AT.morph)/(Math.PI*2)*AT.autoLen*1000; if(!AT.E) atStart(); } renderMorph(); };
  $('atAutoLen').querySelectorAll('button').forEach(b=>b.onclick=()=>{ AT.autoLen=+b.dataset.v; renderMorph(); persist(); });
  $('atSend').onclick=atSendToSong; $('atExport').onclick=atExport;
  $('atSecs').querySelectorAll('button').forEach(b=>b.onclick=()=>{ AT.secs=+b.dataset.v; try{ localStorage.setItem('kyma.atmos',JSON.stringify({secs:AT.secs})); }catch(e){} renderAtmos(); });
  $('atRange').querySelectorAll('button').forEach(b=>b.onclick=()=>{ AT.range=b.dataset.v; persist(); $('atRange').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); });
  $('atLoad').onclick=()=>$('atFile').click(); $('atFile').onchange=e=>{ const f=e.target.files[0]; e.target.value=''; if(f) atLoadAudio(f); };
  $('atToCompose').onclick=()=>openStudio('compose');
  initHarmony();
  AT.p=atDefaults(AT.scene);
}
boot({ init:initAtmos });
