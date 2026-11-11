/* KYMA · features/hum — hum a melody or beatbox a beat into a track
   One module for the whole voice path: the record popover (humTrack), recording with a count-in
   and optional backing (startHum), pitch tracking and note-making for humming (smooth or every
   syllable), hit detection for beatboxing (kick, snare, hat), and turning a take into a clip.
   Used by Compose and Video through the timeline, and by the Hum studio directly. */
/* =========================================================
   HUM OR BEATBOX INTO A TRACK (any length)
   ========================================================= */
const HUMPOP={mode:'song'};
const HUM_VOICES=['Choir Mmm','Theremin','Bansuri','Cello','String Ensemble','Soft Lead','Saxophone','Flute'];
const DECAYS=new Set(['keys','pluck','mallet','kit','sample']);
function humOptions(){
  const opts=[{k:'song',label:'Whole song',a:0,b:S.len}], p=Math.floor(curStep()/16)*16;
  if(p>0&&p<S.len-4) opts.push({k:'head',label:'From the playhead to the end',a:p,b:S.len});
  if(RANGE&&RANGE.b-RANGE.a>=4) opts.push({k:'sel',label:'Only the selected range',a:RANGE.a,b:RANGE.b});
  return opts;
}
function humTrack(tr,anchor){
  if(!tr) return;
  if(HUM.busy) return;
  if(HUM.recording){ if(HUM.counting){ toast('Recording starts after the count-in. Press Cancel to back out.'); return; } HUM.finish(false); return; }
  FOCUS=tr.id; markFocus();
  const p=$('pop'), sd=stepDur(), opts=humOptions(), drum=tr.kind==='drum';
  if(!opts.some(o=>o.k===HUMPOP.mode)) HUMPOP.mode='song';
  p.className='pop clipmenu humpop';
  p.innerHTML=`<div class="rackhead"><span class="lbl">${drum?'Beatbox':'Hum'} into</span><b class="hp-t"></b></div>
    <div class="hp-opts" role="radiogroup" aria-label="How much to record">${opts.map(o=>`<label class="bopt"><input type="radio" name="hmode" value="${o.k}"${o.k===HUMPOP.mode?' checked':''}><span><b>${o.label}</b><small>${fmtMS(o.a*sd)} → ${fmtMS(o.b*sd)} · records ${fmtMS((o.b-o.a)*sd)} without stopping</small></span></label>`).join('')}</div>
    ${drum?'':`<div class="hp-row"><span class="lbl">Notes</span><div class="seg" data-style role="group" aria-label="Note style"><button data-v="smooth" aria-pressed="${UI.humStyle!=='detail'}" title="Long held notes that glide into each other, like your voice">Smooth</button><button data-v="detail" aria-pressed="${UI.humStyle==='detail'}" title="A separate note for every syllable">Every syllable</button></div></div>
    <div class="hp-row hp-inst"><span class="lbl">Play as</span><span class="hp-cur"></span></div>
    <div class="hp-chips">${HUM_VOICES.map(n=>INSTS.find(i=>i.name===n)).filter(Boolean).map(I=>`<button class="chip" data-inst="${I.id}" aria-pressed="${tr.inst===I.id}">${I.name}</button>`).join('')}</div>`}
    <label class="check"><input type="checkbox" data-k="humOpen"${UI.humOpen?' checked':''}> <span>Keep recording past the end. The song grows until I press Stop.</span></label>
    <label class="check"><input type="checkbox" data-k="humBacking"${UI.humBacking?' checked':''}> <span>Play the other tracks while I ${drum?'beatbox':'hum'} (headphones help)</span></label>
    <label class="check"><input type="checkbox" data-k="humReplace"${UI.humReplace?' checked':''}> <span>Replace what’s already on this track in that stretch</span></label>
    <p class="hint" style="margin:0">${drum?'Short sounds work best: “boom” for kick, “ka” or “psh” for snare, “ts” for hats.':'Hum on “mmm” or “doo”. Smooth keeps held notes held and glides between them; Every syllable gives each “da” its own note. Pauses are fine; the recording runs to the end.'}</p>
    <div class="pact" style="justify-content:flex-end"><button class="btn ghost" data-a="x">Cancel</button><button class="btn rec" data-a="go"><span class="rdot"></span>Start ${drum?'beatboxing':'humming'}</button></div>`;
  p.querySelector('.hp-t').textContent=tr.name;
  const showCur=()=>{ const el=p.querySelector('.hp-cur'); if(!el) return; const I=INST[tr.inst]; el.textContent=I.name+(DECAYS.has(I.engine)?' · fades out on long notes; pick a sustaining sound below for held notes':' · sustains'); el.classList.toggle('warn',DECAYS.has(I.engine)); p.querySelectorAll('[data-inst]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.inst===tr.inst)); };
  showCur();
  p.querySelectorAll('[data-style] button').forEach(b=>b.onclick=()=>{ UI.humStyle=b.dataset.v; saveUI(); p.querySelectorAll('[data-style] button').forEach(x=>x.setAttribute('aria-pressed',x===b)); });
  p.querySelectorAll('[data-inst]').forEach(b=>b.onclick=()=>{ const I=INST[b.dataset.inst]; if(!I||tr.inst===I.id) return; pushHist(); setTrackInst(tr,I); persist(); renderTracks(); showCur(); p.querySelector('.hp-t').textContent=tr.name; previewInst(I); });
  p.querySelectorAll('input[name=hmode]').forEach(r=>r.onchange=()=>{ HUMPOP.mode=r.value; });
  p.querySelectorAll('[data-k]').forEach(c=>c.onchange=()=>{ UI[c.dataset.k]=c.checked; saveUI(); });
  p.querySelector('[data-a=x]').onclick=closePop;
  p.querySelector('[data-a=go]').onclick=()=>{ const o=opts.find(x=>x.k===HUMPOP.mode)||opts[0]; closePop(); startHum(tr,o); };
  const an=anchor||document.querySelector(`.thead[data-id="${tr.id}"] .thum`)||$('humBtn'), r=an.getBoundingClientRect(); placePop(p,r.left,r.bottom+6);
  setTimeout(()=>p.querySelector('[data-a=go]').focus(),20);
}
function hud(title,time,frac,state){
  const h=$('humHud'); h.hidden=false; h.dataset.state=state||'rec';
  $('hhTitle').textContent=title; $('hhTime').textContent=time; $('hhFill').style.width=(frac==null?0:clamp(frac,0,1)*100)+'%';
  $('hhStop').hidden=state==='busy'||(state==='count'&&!!UI.humBacking); $('hhCancel').hidden=state==='busy';
  $('hhStop').textContent=state==='count'?'Skip count-in':'■ Stop and make notes';
}
function hideHud(){ $('humHud').hidden=true; }
async function startHum(tr,o){
  const sd=stepDur(), open=!!UI.humOpen, maxSec=600;
  ensureAudio(); try{ await ac.resume(); }catch(e){}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ humFail(tr,'unsupported'); return; }
  let stream; try{ stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!!UI.humBacking,noiseSuppression:false,autoGainControl:false}}); }catch(e){ humFail(tr,'blocked'); return; }
  if(playing) stopPlay();
  const pre=16, srIn=ac.sampleRate, a=o.a, b=open?a+Math.ceil(maxSec/sd):o.b, totalSec=(b-a)*sd;
  Object.assign(HUM,{recording:true,counting:true,target:tr.id,a,b,open,trace:[],chunks:[],firstT:null,stream,cur:a,nextClick:null,stopT:null});
  HUM.src=ac.createMediaStreamSource(stream); HUM.ana=ac.createAnalyser(); HUM.ana.fftSize=1024; HUM.src.connect(HUM.ana); HUM.proc=ac.createScriptProcessor(2048,1,1); const z=gainN(ac,0); HUM.src.connect(HUM.proc); HUM.proc.connect(z).connect(ac.destination);
  const now=ac.currentTime+.25; HUM.t0=now+pre*sd;
  if(UI.humBacking){ HUM.exclude=tr.id; const from=Math.max(0,a-pre), missing=pre-(a-from); for(let i=0;i<missing/4;i++) click(now+i*4*sd,i===0); PH.step=from; startPlay(now+missing*sd); }
  else for(let i=0;i<4;i++) click(now+i*4*sd,i===0);
  renderHeads(); const what=tr.kind==='drum'?'Beatboxing':'Humming';
  hud(`Get ready · ${tr.name}`,'4',0,'count');
  let lastDraw=0;
  HUM.proc.onaudioprocess=e=>{
    if(!HUM.recording) return;
    const d=e.inputBuffer.getChannelData(0); if(HUM.firstT==null) HUM.firstT=ac.currentTime-d.length/srIn;
    HUM.chunks.push(new Float32Array(d));
    const t=ac.currentTime-HUM.t0;
    if(t<0){ HUM.counting=true; if(performance.now()-lastDraw>100){ lastDraw=performance.now(); hud(`Get ready · ${what} into ${tr.name} starts in`,String(Math.ceil(-t/(4*sd))),0,'count'); } return; }
    HUM.counting=false;
    if(tr.kind==='drum'){ let e2=0; for(let i=0;i<d.length;i++) e2+=d[i]*d[i]; if(Math.sqrt(e2/d.length)>.03) HUM.trace.push({s:a+t/sd,m:null}); }
    else { const m=liveYin(d,srIn); if(m!=null) HUM.trace.push({s:a+t/sd,m}); }
    HUM.cur=a+t/sd;
    if(!playing){ PH.step=Math.floor(HUM.cur);
      if(HUM.nextClick==null||HUM.nextClick<ac.currentTime) HUM.nextClick=HUM.t0+Math.ceil((ac.currentTime-HUM.t0)/(4*sd)+.05)*4*sd;
      while(HUM.nextClick<ac.currentTime+.4){ const k=Math.round((HUM.nextClick-HUM.t0)/(4*sd)); click(HUM.nextClick,k%4===0); HUM.nextClick+=4*sd; } }
    if(HUM.cur>=b){ HUM.finish(false); return; }
    if(performance.now()-lastDraw>100){ lastDraw=performance.now(); if(HUM.cur>S.len) sizeLanes(); else requestDraw();
      hud(`● ${what} into ${tr.name}`,`${fmtMS(t)} / ${open?'until you stop':fmtMS(totalSec)}`,open?null:t/totalSec,'rec'); }
  };
  HUM.finish=async(cancel)=>{
    if(!HUM.recording) return; HUM.recording=false; HUM.counting=false; clearTimeout(HUM.timer); HUM.stopT=ac.currentTime;
    try{ HUM.proc.onaudioprocess=null; HUM.src.disconnect(); HUM.proc.disconnect(); }catch(e){}
    HUM.stream.getTracks().forEach(x=>x.stop()); if(HUM.exclude){ HUM.exclude=null; if(playing) stopPlay(); }
    renderHeads();
    if(cancel){ HUM.chunks=[]; HUM.trace=[]; hideHud(); requestDraw(); toast('Recording discarded'); return; }
    const total=HUM.chunks.reduce((q,c)=>q+c.length,0), all=new Float32Array(total); let off=0; HUM.chunks.forEach(c=>{ all.set(c,off); off+=c.length; }); HUM.chunks=[];
    const lat=(ac.outputLatency||ac.baseLatency||.01)+.025, i0=clamp(Math.round((HUM.t0+lat-HUM.firstT)*srIn),0,total), i1=Math.min(total,i0+Math.round((HUM.b-HUM.a)*sd*srIn));
    if(i1-i0<srIn*.4){ hideHud(); HUM.trace=[]; requestDraw(); toast('That take was too short. Start again and keep going through the count-in.'); return; }
    const buf=new AudioBuffer({length:i1-i0,numberOfChannels:1,sampleRate:srIn}); buf.copyToChannel(all.subarray(i0,i1),0);
    HUM.busy=true; hud(`Turning your ${tr.kind==='drum'?'beatbox':'humming'} into ${INST[tr.inst]?.name||tr.name}`,fmtMS(buf.duration)+' recorded',0,'busy');
    try{ await humApply(tr,buf,HUM.a,f=>hud(`Turning your ${tr.kind==='drum'?'beatbox':'humming'} into ${INST[tr.inst]?.name||tr.name}`,Math.round(f*100)+'%',f,'busy')); }
    catch(err){ console.error(err); toast('Something went wrong converting that take. Try again.'); }
    HUM.busy=false; hideHud();
  };
  HUM.timer=setTimeout(()=>HUM.finish&&HUM.finish(false),(HUM.t0+(b-a)*sd-ac.currentTime)*1000+500);
}
function humFail(tr,code){
  const msg={blocked:'The microphone is blocked here. Open the downloaded HTML file in Chrome, Edge or Firefox and allow the mic, or use a recording.',unsupported:'This browser can’t record here. Use a recording of your humming.'}[code];
  toast(msg,[{label:'Use a recording',fn:()=>{ HUM.fileTarget=tr.id; $('humFile').click(); }}],9000);
}
async function humFromFile(file){
  const tr=trackById(HUM.fileTarget); HUM.fileTarget=null; if(!tr) return;
  try{ ensureAudio(); const b=await ac.decodeAudioData(await file.arrayBuffer()); const r=humOptions().find(o=>o.k===HUMPOP.mode)||{a:0,b:S.len}, sd=stepDur(), n=Math.min(b.length,UI.humOpen?b.length:Math.round((r.b-r.a)*sd*b.sampleRate)), m=new AudioBuffer({length:n,numberOfChannels:1,sampleRate:b.sampleRate}), md=m.getChannelData(0);
    for(let c=0;c<b.numberOfChannels;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) md[i]+=d[i]/b.numberOfChannels; }
    HUM.busy=true; hud('Turning your recording into '+tr.name,'',0,'busy'); try{ await humApply(tr,m,r.a,f=>hud('Turning your recording into '+tr.name,Math.round(f*100)+'%',f,'busy')); } finally { HUM.busy=false; hideHud(); } }
  catch(e){ toast('That file could not be decoded. Try a WAV, MP3 or M4A.'); }
}
function beatboxNotes(x,sr,sd,q){
  const hop=128, W=256, E=[]; for(let off=0;off+W<x.length;off+=hop){ let e=0; for(let i=off;i<off+W;i++) e+=x[i]*x[i]; E.push(Math.sqrt(e/W)); }
  const sorted=[...E].sort((a,b)=>a-b), gate=Math.max(.01,(sorted[Math.floor(sorted.length*.9)]||0)*.18), maxE=sorted[sorted.length-1]||1, hits=[]; let last=-1e9;
  for(let i=0;i<E.length;i++){ const t=i*hop/sr; let avg=0,n=0; for(let j=Math.max(0,i-4);j<i;j++){ avg+=E[j]; n++; } avg=n?avg/n:0; avg=Math.max(avg,gate*.25);
    if(E[i]>gate&&E[i]>avg*2&&(i===0||E[i]>=E[i-1])&&t-last>.07){ last=t;
      const s0=Math.max(0,i*hop-64), s1=Math.min(x.length,s0+Math.round(sr*.05)); let lpv=0,lo=0,tot=0,df=0;
      for(let j=s0;j<s1;j++){ lpv+=.06*(x[j]-lpv); lo+=lpv*lpv; tot+=x[j]*x[j]; if(j>s0){ const d=x[j]-x[j-1]; df+=d*d; } }
      hits.push({t,lowR:lo/(tot+1e-9),bright:df/(tot+1e-9),e:E[i]}); } }
  // kicks are mostly low end; the rest split into darker (snare) and brighter (hat) groups, adapted to this voice
  const rest=hits.filter(h=>h.lowR<=.35);
  let cut=2.6; if(rest.length>=4){ const b=rest.map(h=>h.bright).sort((a,c)=>a-c); let c1=b[0], c2=b[b.length-1];
    if(c2-c1>.35){ for(let it=0;it<12;it++){ let s1=0,n1=0,s2=0,n2=0; b.forEach(v=>{ if(Math.abs(v-c1)<=Math.abs(v-c2)){ s1+=v; n1++; } else { s2+=v; n2++; } }); c1=n1?s1/n1:c1; c2=n2?s2/n2:c2; } cut=(c1+c2)/2; }
    else cut=(b[0]+b[b.length-1])/2>2.2?-1:99; }
  const out=hits.map(h=>({t:Math.round(h.t/sd/q)*q,d:1,n:h.lowR>.35?0:h.bright>cut?4:1,v:clamp(h.e/maxE*1.25,.45,1)}));
  const seen=new Set(); return out.filter(n=>{ const k=n.t+':'+n.n; if(seen.has(k)) return false; seen.add(k); return true; });
}
async function pitchTrackAsync(x,sr,onP){
  const hop=Math.round(sr*.01), W=Math.round(sr*.025), tauMin=Math.floor(sr/FMAX), tauMax=Math.ceil(sr/FMIN), rmsAll=[];
  for(let off=0;off+W+tauMax+2<x.length;off+=hop){ let e=0; for(let j=0;j<W;j++) e+=x[off+j]*x[off+j]; rmsAll.push(Math.sqrt(e/W)); }
  const p90=arr=>{ const q=[...arr].sort((u,v)=>u-v); return q[Math.floor(q.length*.9)]||0; }, gP=p90(rmsAll), B=600, gates=[];
  for(let k=0;k<rmsAll.length;k+=B) gates.push(Math.max(.0025,.14*Math.max(p90(rmsAll.slice(k,k+B)),gP*.35)));
  const frames=[]; let i=0;
  for(let off=0;off+W+tauMax+2<x.length;off+=hop,i++){
    const t=(off+W/2)/sr, rms=rmsAll[i]; let midi=null;
    if(rms>=gates[Math.floor(i/B)]){ const y=yin(x,off,W,tauMin,tauMax,sr,.16); if(y&&y.f>=FMIN&&y.f<=FMAX) midi=hz2m(y.f); }
    frames.push({t,rms,midi});
    if(i%1200===0){ onP&&onP(.9*i/rmsAll.length); await new Promise(r=>setTimeout(r,0)); }
  }
  const out=frames.map((f,k)=>{ if(f.midi==null) return f; const w=[]; for(let j=k-2;j<=k+2;j++) if(frames[j]&&frames[j].midi!=null) w.push(frames[j].midi); return {...f,midi:median(w)}; });
  for(let k=1;k<out.length;k++){ const p=out[k-1].midi,q=out[k].midi; if(p!=null&&q!=null){ const dd=q-p; if(Math.abs(Math.abs(dd)-12)<1.2) out[k]={...out[k],midi:q-12*Math.sign(dd)}; } }
  return out;
}
/* Smooth hum → notes: bridges breath gaps, ignores vibrato and slides, keeps held notes held,
   joins touching notes (they glide on playback) and takes velocity from how loud you hummed. */
function humNotesSmooth(fr,sd,q,oct){
  const N=fr.length, dt=.01; if(!N) return {notes:[],key:null};
  const m=fr.map(f=>f.midi), voiced=m.filter(v=>v!=null); if(voiced.length<8) return {notes:[],key:null};
  const center=degToMidi(0,oct)+(oct<=2?5:7), shift=12*Math.round((center-median(voiced))/12);
  // bridge short unvoiced gaps (breaths, consonants) up to 160 ms
  const gapFill=new Uint8Array(N);
  for(let i=0;i<N;){ if(m[i]!=null){ i++; continue; } let j=i; while(j<N&&m[j]==null) j++; if(i>0&&j<N&&j-i<=16){ for(let k=i;k<j;k++){ m[k]=m[i-1]; gapFill[k]=1; } } i=j; }
  const sm=m.map((v,k)=>{ if(v==null) return null; const w=[]; for(let j=k-5;j<=k+5;j++) if(m[j]!=null) w.push(m[j]); return median(w); });
  const deg=sm.map(v=>v==null?null:nearestDeg(v+shift,oct)), rms=fr.map(f=>f.rms);
  const segs=[]; let cur=null, pend=null;
  const close=k=>{ if(cur){ cur.end=k; segs.push(cur); cur=null; } pend=null; };
  for(let k=0;k<N;k++){
    const d=deg[k]; if(d==null){ close(k); continue; }
    if(!cur){ cur={d,start:k,end:k,art:true}; continue; }
    // re-articulation on the same pitch: a clear dip then a fresh attack ("doo-doo")
    if(k>=6&&k-cur.start>14&&!gapFill[k]){ let mn=1e9; for(let j=k-6;j<k;j++) mn=Math.min(mn,rms[j]); let pk=0; for(let j=cur.start;j<k;j++) pk=Math.max(pk,rms[j]); if(mn<pk*.38&&rms[k]>mn*2.4){ close(k); cur={d,start:k,end:k,art:true}; continue; } }
    if(d===cur.d){ pend=null; cur.end=k; continue; }
    if(pend&&pend.d===d) pend.n++; else pend={d,n:1,start:k};
    if(pend.n>=7){ const st=pend.start; cur.end=st; segs.push(cur); cur={d,start:st,end:k,art:false}; pend=null; }
  }
  close(N);
  // fold blips (< 90 ms) into the previous note when they touch it
  const S2=[]; for(const g of segs){ const len=g.end-g.start, prev=S2[S2.length-1];
    if(len<9){ if(prev&&g.start-prev.end<=2&&!g.art) prev.end=g.end; else if(len>=6) S2.push(g); continue; }
    if(prev&&prev.d===g.d&&!g.art&&g.start-prev.end<=3){ prev.end=g.end; continue; } S2.push(g); }
  // loudness → velocity
  const loud=S2.map(g=>{ let a=0; for(let k=g.start;k<g.end;k++) a+=rms[k]; return a/Math.max(1,g.end-g.start); });
  const ref=[...loud].sort((u,v)=>u-v)[Math.floor(loud.length*.85)]||1;
  let notes=S2.map((g,i)=>{ const t=Math.round(g.start*dt/sd/q)*q, e=Math.round(g.end*dt/sd/q)*q; return {t,e:Math.max(t+q,e),n:g.d,v:clamp(.5+.5*loud[i]/ref,.45,1),touch:i>0&&g.start-S2[i-1].end<=2,art:g.art}; });
  notes.sort((a,b)=>a.t-b.t); notes=notes.filter((n,i)=>i===0||n.t>notes[i-1].t);
  const hold=Math.max(.2/sd,1);
  for(let i=0;i<notes.length;i++){ const n=notes[i], nx=notes[i+1]; if(nx){ if(nx.t-n.e<=hold) n.e=nx.t; n.e=Math.min(n.e,nx.t); } if(n.e<=n.t) n.e=n.t+q; }
  const out=notes.map((n,i)=>{ const o={t:n.t,d:n.e-n.t,n:n.n,v:+n.v.toFixed(2)}; if(i>0&&n.touch&&!n.art&&notes[i-1].e===n.t&&notes[i-1].n!==n.n) o.l=1; return o; });
  const key=detectKey(S2.map(g=>({start:g.start*dt,end:g.end*dt,midi:median(sm.slice(g.start,g.end).filter(v=>v!=null))})).filter(x=>isFinite(x.midi)));
  return {notes:out,key};
}
async function humApply(tr,buf,a,onP){
  const sd=stepDur(); onP&&onP(.02); const x=await toMono16k(buf), q=tr.kind==='drum'?1:(tr.quant||1), lenSteps=Math.max(4,Math.ceil(buf.duration/sd/4)*4);
  let notes=[], keyGuess=null;
  if(tr.kind==='drum') notes=beatboxNotes(x,16000,sd,q);
  else if(UI.humStyle!=='detail'){ const fr=await pitchTrackAsync(x,16000,onP); const r=humNotesSmooth(fr,sd,q,tr.oct); notes=r.notes.filter(n=>n.t<lenSteps); keyGuess=r.key; }
  else { const raw=segmentNotes(await pitchTrackAsync(x,16000,onP)); keyGuess=detectKey(raw);
    if(raw.length){ const center=degToMidi(0,tr.oct)+(tr.oct<=2?5:7), w=[]; raw.forEach(r=>{ for(let i=0;i<Math.max(1,Math.round((r.end-r.start)*20));i++) w.push(r.midi); });
      const shift=12*Math.round((center-median(w))/12);
      notes=raw.map(r=>{ const t=Math.round(r.start/sd/q)*q, e=Math.round(r.end/sd/q)*q; return {t,d:Math.max(q,e-t),n:nearestDeg(r.midi+shift,tr.oct),v:.85}; }).filter(n=>n.t<lenSteps);
      notes.sort((p,r)=>p.t-r.t); notes=notes.filter((n,i)=>i===0||n.t!==notes[i-1].t); for(let i=0;i<notes.length-1;i++) notes[i].d=Math.max(q,Math.min(notes[i].d,notes[i+1].t-notes[i].t)); } }
  onP&&onP(1);
  HUM.trace=[];
  if(!notes.length){ requestDraw(); toast(tr.kind==='drum'?'No clear hits came through. Try short “boom”, “ka” and “tss” sounds, close to the mic.':'No clear notes came through. Hum a little louder and closer, on “doo”.'); return; }
  pushHist(); HUM.count++;
  if(UI.humReplace) eraseRange(tr,a,a+lenSteps);
  const c=newClip(a,lenSteps,notes,{name:(tr.kind==='drum'?'Beatbox ':'Hum ')+HUM.count}); tr.clips.push(c); SEL={clips:new Set([c.id]),notes:new Set()}; tr.open=true;
  if(a+lenSteps>S.len){ S.len=Math.ceil((a+lenSteps)/16)*16; renderSongLen(); }
  markDirty(); persist(); renderTracks();
  const acts=[{label:'Undo',fn:undo},{label:'Play again',fn:()=>{ seekTo(a); if(!playing) startPlay(); }}];
  PH.step=a; startPlay();
  if(keyGuess&&(keyGuess.root!==S.root||keyGuess.scale!==S.scale)) acts.push({label:'Use my key: '+NOTE_NAMES[keyGuess.root]+' '+keyGuess.scale.toLowerCase(),fn:()=>{ pushHist(); S.root=keyGuess.root; S.scale=keyGuess.scale; renderHeader(); requestDraw(); persist(); }});
  toast(`${notes.length} ${tr.kind==='drum'?'hits':'notes'} over ${fmtMS(lenSteps*sd)}, now playing as ${INST[tr.inst]?.name||tr.name}. Drag notes to move them, double-click to delete.`,acts,10000);
}

/* the shared wiring: the toolbar's Hum button, the recording HUD and "use a recording" */
function initHum(){
  if(initHum.done) return; initHum.done=true;
  const hb=$('humBtn'); if(hb) hb.onclick=()=>{ const tr=focusTrack(); if(!tr){ toast('Add a track first'); return; } humTrack(tr,hb); };
  $('hhStop').onclick=()=>{ if(!HUM.recording) return; if(HUM.counting){ HUM.t0=ac.currentTime+.02; return; } HUM.finish(false); }; $('hhCancel').onclick=()=>HUM.finish&&HUM.finish(true);
  const hf=$('humFile'); if(hf) hf.onchange=e=>{ const f=e.target.files[0]; e.target.value=''; if(f) humFromFile(f); else HUM.fileTarget=null; };
}
