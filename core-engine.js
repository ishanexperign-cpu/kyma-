/* KYMA · core/engine — song model, mixer graph, transport, offline render, clip editing primitives */
/* =========================================================
   SONG MODEL: a linear multitrack timeline
   ========================================================= */
let uidN=1; const nid=()=>Date.now().toString(36).slice(-5)+(uidN++).toString(36);
const COLORS=['--t-kick','--t-keys','--t-ghost','--t-bass','--t-pad','--t-snare','--t-sample','--t-hat'];
function newSong(){ return {v:5,name:'Untitled',desc:'',vibe:null,bpm:100,swing:0,human:.35,root:0,scale:'Minor',len:256,loop:true,master:Object.fromEntries(MASTER.map(p=>[p.k,p.def])),tracks:[]}; }
let S=newSong();
const stepDur=()=>60/S.bpm/4;
function newTrack(instId,o={}){
  const I=INST[instId]||INSTS[0];
  return {id:nid(),name:o.name||I.name,inst:I.id,p:{...I.p},oct:o.oct??I.oct,kind:I.kind,color:o.color??(S.tracks.length%COLORS.length),vol:o.vol??.8,pan:o.pan??0,space:o.space??.2,echo:o.echo??0,mute:false,solo:false,open:false,quant:1,clips:[]};
}
function newClip(start,len,notes,o={}){ return {id:nid(),start,len:Math.max(1,len),offset:0,loop:false,loopLen:Math.max(1,len),notes:notes||[],name:'',fin:{type:'cut',len:0},fout:{type:'cut',len:0},...o}; }
const trackById=id=>S.tracks.find(t=>t.id===id);
const clipEnd=c=>c.start+c.len;
function findClip(id){ for(const tr of S.tracks){ const c=tr.clips.find(x=>x.id===id); if(c) return {tr,c}; } return null; }
// all notes a clip actually plays, in song time
function flatten(c){
  const out=[], end=c.start+c.len, eps=1e-6;
  const push=(n,ct)=>{ if(ct<c.offset-eps||ct>=c.offset+c.len-eps) return; const at=c.start+(ct-c.offset); out.push({at,d:Math.max(.05,Math.min(n.d,end-at)),n:n.n,v:n.v??.85,c,src:n,rep:ct!==n.t}); };
  if(c.loop&&c.loopLen>0){ const L=c.loopLen, k0=Math.floor(c.offset/L)-1, k1=Math.ceil((c.offset+c.len)/L)+1;
    for(let k=k0;k<=k1;k++) for(const n of c.notes){ if(n.t<0||n.t>=L) continue; push(n,k*L+n.t); } }
  else for(const n of c.notes) push(n,n.t);
  return out;
}
let IDX=null;
function markDirty(){ IDX=null; }
function ensureIndex(){
  if(IDX) return IDX;
  IDX={ev:new Map(),bus:new Map()};
  for(const tr of S.tracks){
    const em=new Map(), bm=new Map();
    for(const c of tr.clips){
      if(c.start>=S.len) continue;
      const fl=flatten(c);
      if(tr.kind!=='drum'&&c.notes.some(n=>n.l)){ fl.sort((a,b)=>a.at-b.at); for(let i=1;i<fl.length;i++){ const e=fl[i]; if(!e.src.l) continue; for(let j=i-1;j>=0&&j>=i-4;j--){ const p=fl[j]; if(Math.abs(p.at+p.d-e.at)<.3){ e.from=p.n; p.tie=1; break; } } } }
      for(const e of fl){ if(e.at>=S.len) continue; const k=Math.floor(e.at+1e-6); if(!em.has(k)) em.set(k,[]); em.get(k).push(e); }
      const pre=c.fin&&c.fin.type==='riser'?c.fin.len:0, bs=Math.max(0,Math.floor(c.start-pre)); if(!bm.has(bs)) bm.set(bs,[]); bm.get(bs).push(c);
    }
    IDX.ev.set(tr.id,em); IDX.bus.set(tr.id,bm);
  }
  return IDX;
}
const audibleT=(tr,anySolo)=>!tr.mute&&(!anySolo||tr.solo);

/* =========================================================
   MIXER GRAPH (dynamic channels) + CLIP BUSES WITH TRANSITIONS
   ========================================================= */
function buildGraph(ctx,{stem=false}={}){
  const R=resources(ctx), G={ctx,R,ch:new Map(),cb:new Map(),stem};
  const sum=ctx.createGain(); G.sum=sum;
  G.music=ctx.createGain(); G.duck=ctx.createGain(); G.music.connect(G.duck).connect(sum);
  G.revIn=ctx.createGain(); G.pre=ctx.createDelay(.3); G.pre.delayTime.value=.022;
  G.conv=ctx.createConvolver(); G.conv.normalize=false; G.irSize=S.master.size; G.conv.buffer=makeIR(ctx,S.master.size);
  G.revHP=bq(ctx,'highpass',190,.7); G.revLP=bq(ctx,'lowpass',9000,.5); G.revRet=ctx.createGain();
  G.revIn.connect(G.pre).connect(G.conv).connect(G.revHP).connect(G.revLP).connect(G.revRet).connect(sum);
  G.dlyIn=ctx.createGain(); const dhp=bq(ctx,'highpass',280,.7);
  G.dL=ctx.createDelay(4); G.dR=ctx.createDelay(4); G.fbL=ctx.createGain(); G.fbR=ctx.createGain();
  const lpa=bq(ctx,'lowpass',3800,.5), lpb=bq(ctx,'lowpass',3800,.5), mrg=ctx.createChannelMerger(2); G.dlyRet=gainN(ctx,.85);
  G.dlyIn.connect(dhp).connect(G.dL); G.dL.connect(mrg,0,0); G.dR.connect(mrg,0,1);
  G.dL.connect(lpa).connect(G.fbL).connect(G.dR); G.dR.connect(lpb).connect(G.fbR).connect(G.dL); mrg.connect(G.dlyRet).connect(sum);
  if(stem){ G.out=ctx.createGain(); const fd=ctx.createDelay(.1); fd.delayTime.value=.012; sum.connect(fd).connect(G.out).connect(ctx.destination); }
  else{
    G.hp=bq(ctx,'highpass',22,.7); G.lowS=bq(ctx,'lowshelf',160); G.highS=bq(ctx,'highshelf',5200);
    G.comp=ctx.createDynamicsCompressor(); G.comp.attack.value=.015; G.comp.release.value=.2; G.comp.knee.value=8;
    G.tapePre=gainN(ctx,.25); G.shaper=ctx.createWaveShaper(); G.shaper.oversample='4x'; G.tapeLP=bq(ctx,'lowpass',20000,.5);
    const sp=ctx.createChannelSplitter(2), mg=ctx.createChannelMerger(2);
    G.wLL=ctx.createGain(); G.wRL=ctx.createGain(); G.wRR=ctx.createGain(); G.wLR=ctx.createGain();
    sp.connect(G.wLL,0); sp.connect(G.wLR,0); sp.connect(G.wRR,1); sp.connect(G.wRL,1);
    G.wLL.connect(mg,0,0); G.wRL.connect(mg,0,0); G.wRR.connect(mg,0,1); G.wLR.connect(mg,0,1);
    G.lim=ctx.createDynamicsCompressor(); G.lim.threshold.value=-1.5; G.lim.knee.value=0; G.lim.ratio.value=20; G.lim.attack.value=.001; G.lim.release.value=.08;
    G.out=ctx.createGain();
    G.wob=ctx.createDelay(.1); G.wob.delayTime.value=.012;
    G.wl1=ctx.createOscillator(); G.wl1.frequency.value=.55; G.wg1=gainN(ctx,0); G.wl1.connect(G.wg1).connect(G.wob.delayTime); G.wl1.start(0);
    G.wl2=ctx.createOscillator(); G.wl2.frequency.value=6.3; G.wg2=gainN(ctx,0); G.wl2.connect(G.wg2).connect(G.wob.delayTime); G.wl2.start(0);
    // a fixed curve fitted so generated mixes match the tonal balance of the training set (less sub and air, more body)
    G.cal=[bq(ctx,'lowshelf',55,.7),bq(ctx,'peaking',120,.8),bq(ctx,'peaking',420,.6),bq(ctx,'peaking',2000,.8),bq(ctx,'peaking',5600,.8),bq(ctx,'highshelf',9500,.7)]; [-5.5,3.2,4,-.8,-3,-11].forEach((v,i)=>G.cal[i].gain.value=v);
    sum.connect(G.hp); G.cal.reduce((a,b)=>(a.connect(b),b),G.hp); G.cal[G.cal.length-1].connect(G.lowS).connect(G.highS).connect(G.comp).connect(G.tapePre).connect(G.shaper).connect(G.tapeLP).connect(G.wob).connect(sp);
    mg.connect(G.lim).connect(G.out).connect(ctx.destination);
  }
  S.tracks.forEach(tr=>channel(G,tr));
  applyGraph(G,false);
  return G;
}
function channel(G,tr){
  let T=G.ch.get(tr.id); const ctx=G.ctx;
  if(!T){
    T={in:ctx.createGain(),pan:ctx.createStereoPanner(),vol:ctx.createGain(),mute:ctx.createGain(),rev:ctx.createGain(),dly:ctx.createGain(),dry:ctx.createGain(),wet:ctx.createGain(),spot:bq(ctx,'bandpass',600,1.3),lfo:ctx.createOscillator(),lfoAmt:gainN(ctx,2400),dest:null};
    T.lfo.connect(T.lfoAmt).connect(T.spot.detune); T.lfo.start(0);
    T.in.connect(T.dry).connect(T.pan); T.in.connect(T.spot).connect(T.wet).connect(T.pan);
    T.pan.connect(T.vol).connect(T.mute); T.mute.connect(T.rev).connect(G.revIn); T.mute.connect(T.dly).connect(G.dlyIn);
    G.ch.set(tr.id,T);
  }
  const dest=tr.kind==='drum'?G.sum:G.music;
  if(T.dest!==dest){ try{ if(T.dest) T.mute.disconnect(T.dest); }catch(e){} T.mute.connect(dest); T.dest=dest; }
  return T;
}
function dropChannel(G,id){ const T=G.ch.get(id); if(!T) return; try{ T.mute.disconnect(); T.lfo.stop(); }catch(e){} G.ch.delete(id); }
function applyGraph(G,smooth=true){
  const ctx=G.ctx, now=ctx.currentTime, m=S.master;
  const set=(par,v)=>{ if(smooth) par.setTargetAtTime(v,now,.03); else par.value=v; };
  const anySolo=S.tracks.some(t=>t.solo);
  for(const id of [...G.ch.keys()]) if(!trackById(id)) dropChannel(G,id);
  for(const tr of S.tracks){
    const T=channel(G,tr), I=INST[tr.inst]||{};
    set(T.vol.gain,tr.vol); set(T.pan.pan,tr.pan); set(T.rev.gain,tr.space); set(T.dly.gain,tr.echo);
    set(T.mute.gain,G.stem?1:(audibleT(tr,anySolo)?1:0));
    if(I.engine==='ghost'){ set(T.lfo.frequency,tr.p.sweep); set(T.dry.gain,1-tr.p.depth*.8); set(T.wet.gain,tr.p.depth*3.2); }
    else { set(T.dry.gain,1); set(T.wet.gain,0); }
  }
  set(G.revRet.gain,m.space*1.1);
  if(Math.abs(G.irSize-m.size)>.05){ G.irSize=m.size; try{ G.conv.buffer=makeIR(ctx,m.size); }catch(e){} }
  const dt=Math.min(3.9,.75*60/S.bpm); set(G.dL.delayTime,dt); set(G.dR.delayTime,dt);
  set(G.fbL.gain,.12+m.echo*.68); set(G.fbR.gain,.12+m.echo*.68);
  if(G.stem) return;
  set(G.lowS.gain,-m.tone*3.5); set(G.highS.gain,m.tone*5);
  set(G.comp.threshold,-4-m.glue*22); set(G.comp.ratio,1.4+m.glue*2.8);
  if(G.tapeAmt!==Math.round(m.tape*40)){ G.tapeAmt=Math.round(m.tape*40); G.shaper.curve=tapeCurve(G.tapeAmt/40); }
  set(G.tapeLP.frequency,20000-m.tape*8500);
  set(G.wg1.gain,(m.warble||0)*.0032); set(G.wg2.gain,(m.warble||0)*.00022);
  const w=m.width, a=(1+w)/2, b=(1-w)/2; set(G.wLL.gain,a); set(G.wRR.gain,a); set(G.wRL.gain,b); set(G.wLR.gain,b);
  set(G.out.gain,m.out);
}
const TRANS_IN={cut:'Cut',fade:'Fade in',filter:'Filter rise',swell:'Swell',riser:'Riser'};
const TRANS_OUT={cut:'Cut',fade:'Fade out',filter:'Filter fall',echo:'Echo out',tape:'Tape stop',stutter:'Stutter',wash:'Reverb wash'};
// a clip gets its own little bus so its fades and transitions never touch other clips
function clipBus(G,tr,c,pass,tS){
  const key=c.id+':'+pass; let B=G.cb.get(key); if(B) return B;
  const ctx=G.ctx, sd=stepDur(), T=channel(G,tr), tE=tS+c.len*sd;
  B={in:ctx.createGain(),hp:bq(ctx,'highpass',10,.7),lp:bq(ctx,'lowpass',20000,.7),g:ctx.createGain()}; G.cb.set(key,B);
  B.in.connect(B.hp).connect(B.lp).connect(B.g);
  let tail=B.g;
  const fi=c.fin||{type:'cut',len:0}, fo=c.fout||{type:'cut',len:0}, Li=Math.max(0,fi.len)*sd, Lo=Math.min(c.len*sd,Math.max(0,fo.len)*sd);
  const g=B.g.gain; g.setValueAtTime(1,Math.max(0,tS-Li-.01));
  if(Li>0){
    if(fi.type==='fade'){ g.setValueAtTime(0,tS); g.linearRampToValueAtTime(1,tS+Li); }
    else if(fi.type==='filter'){ B.hp.frequency.setValueAtTime(2500,tS); B.hp.frequency.exponentialRampToValueAtTime(10,tS+Li); g.setValueAtTime(.35,tS); g.linearRampToValueAtTime(1,tS+Li); }
    else if(fi.type==='swell'){ g.setValueAtTime(.0005,tS); g.exponentialRampToValueAtTime(1,tS+Li); B.hp.frequency.setValueAtTime(1200,tS); B.hp.frequency.exponentialRampToValueAtTime(10,tS+Li);
      const rs=ctx.createGain(); B.lp.connect(rs).connect(G.revIn); rs.gain.setValueAtTime(1.2,tS); rs.gain.linearRampToValueAtTime(0,tS+Li); }
    else if(fi.type==='riser'){ const t0=tS-Li, n=noiseSrc(ctx,G.R.white,Math.max(0,t0),Li+.05), bp=bq(ctx,'bandpass',300,3), rg=ctx.createGain();
      bp.frequency.setValueAtTime(300,Math.max(0,t0)); bp.frequency.exponentialRampToValueAtTime(7000,tS); rg.gain.setValueAtTime(0,Math.max(0,t0)); rg.gain.linearRampToValueAtTime(.22,tS-.01); rg.gain.setValueAtTime(0,tS);
      n.connect(bp).connect(rg).connect(T.in); const rr2=gainN(ctx,.5); rg.connect(rr2).connect(G.revIn); }
  }
  if(Lo>0){
    const t1=tE-Lo;
    if(fo.type==='fade'){ g.setValueAtTime(1,t1); g.linearRampToValueAtTime(0,tE); }
    else if(fo.type==='filter'){ B.lp.frequency.setValueAtTime(20000,t1); B.lp.frequency.exponentialRampToValueAtTime(220,tE); B.lp.Q.setValueAtTime(.7,t1); B.lp.Q.linearRampToValueAtTime(5,tE); g.setValueAtTime(1,tE-.02); g.linearRampToValueAtTime(0,tE+.06); }
    else if(fo.type==='echo'){ const es=ctx.createGain(), d=ctx.createDelay(3), fb=gainN(ctx,.62), lp=bq(ctx,'lowpass',3000,.5); d.delayTime.value=Math.min(2.9,.75*60/S.bpm);
      B.lp.connect(es).connect(d).connect(lp); lp.connect(fb).connect(d); lp.connect(T.in); es.gain.setValueAtTime(0,t1); es.gain.linearRampToValueAtTime(1,tE); es.gain.setValueAtTime(0,tE+.02);
      g.setValueAtTime(1,t1); g.linearRampToValueAtTime(.2,tE); }
    else if(fo.type==='wash'){ const ws=ctx.createGain(); B.lp.connect(ws).connect(G.revIn); ws.gain.setValueAtTime(0,t1); ws.gain.linearRampToValueAtTime(1.8,tE); g.setValueAtTime(1,t1); g.linearRampToValueAtTime(0,tE); }
    else if(fo.type==='tape'){ const ts=ctx.createDelay(4), N=10, Tt=Lo; ts.delayTime.setValueAtTime(0,t1); for(let i=1;i<=N;i++){ const x=i/N*Tt; ts.delayTime.linearRampToValueAtTime(x*x/(2*Tt),t1+x); }
      B.g.connect(ts); tail=ts; g.setValueAtTime(1,t1); g.linearRampToValueAtTime(0,tE); }
    else if(fo.type==='stutter'){ const sl=Math.min(Lo/2,2*sd), rIn=ctx.createGain(), rD=ctx.createDelay(2), rFb=ctx.createGain(), rW=ctx.createGain(), mix=ctx.createGain();
      rD.delayTime.value=sl; rIn.gain.setValueAtTime(0,0); rIn.gain.setValueAtTime(1,t1); rIn.gain.setValueAtTime(0,t1+sl); rFb.gain.setValueAtTime(0,0); rFb.gain.setValueAtTime(.999,t1); rFb.gain.setValueAtTime(0,tE);
      rW.gain.setValueAtTime(0,0); rW.gain.setValueAtTime(1,t1+sl); rW.gain.setValueAtTime(0,tE);
      B.g.connect(mix); g.setValueAtTime(1,t1+sl-.003); g.linearRampToValueAtTime(0,t1+sl);
      B.lp.connect(rIn).connect(rD); rD.connect(rFb).connect(rD); rD.connect(rW).connect(mix); tail=mix; }
  }
  tail.connect(T.in);
  if(!G.stem && G.ctx===ac){ const life=(tE-ac.currentTime+6)*1000; setTimeout(()=>{ try{ tail.disconnect(); B.g.disconnect(); }catch(e){} G.cb.delete(key); },Math.max(1000,life)); }
  return B;
}
// schedule one sixteenth step of the song
/* legato: connected hummed notes re-enter quickly and slide from the previous pitch */
const GLIDE_ENG=new Set(['wind','strings','brass','choirv','lead','pad','bass','organ']);
function legatoP(p){ const q={...p}; if('attack' in q) q.attack=Math.min(q.attack,.03); if('slide' in q) q.slide=0; if('glide' in q) q.glide=0; if('chiff' in q) q.chiff*=.15; return q; }
function withGlide(ctx,ratio,t,gl,call){
  const orig=ctx.createOscillator, made=[]; ctx.createOscillator=function(){ const o=orig.apply(ctx,arguments); made.push(o); return o; };
  try{ call(); } finally { ctx.createOscillator=orig; if(ctx.hasOwnProperty('createOscillator')&&ctx.createOscillator===orig&&orig===Object.getPrototypeOf(ctx).createOscillator) delete ctx.createOscillator; }
  if(!isFinite(ratio)||Math.abs(ratio-1)<.003) return;
  made.forEach(o=>{ const f=o.frequency.value; if(f<30) return; o.frequency.setValueAtTime(f*ratio,t); o.frequency.exponentialRampToValueAtTime(f,t+gl); });
}
const hsh=x=>{ const v=Math.sin(x*12.9898)*43758.5453; return v-Math.floor(v); };
function scheduleAt(Gx,st,t,pass,only){
  const X=ensureIndex(), sd=stepDur(), anySolo=S.tracks.some(x=>x.solo), hits=[];
  const base=t;
  for(const tr of S.tracks){
    const live=only?only===tr.id:audibleT(tr,anySolo);
    if(HUM.exclude===tr.id && Gx===LIVE.G) continue;
    const bs=X.bus.get(tr.id)?.get(st); if(bs&&live) bs.forEach(c=>clipBus(Gx,tr,c,pass,base+(c.start-st)*sd));
    const evs=X.ev.get(tr.id)?.get(st); if(!evs) continue;
    const I=INST[tr.inst]||INSTS[0], fn=VOICES[I.engine];
    for(const e of evs){
      const frac=e.at-st; let tt=base+frac*sd, vel=e.v; if(frac<1e-6&&st%2===1) tt+=S.swing*.5*sd;
      const hu=S.human??.35; if(hu>0){ const h1=hsh(e.at*7.13+e.n*.917), h2=hsh(e.at*3.71+e.n*1.37+.5); tt+=(h1-.5)*.018*hu*(tr.kind==='drum'&&e.n<2?.35:1); vel=clamp(e.v*(1+(h2-.5)*.24*hu),.05,1); }
      if(tr.kind==='drum'&&e.n===0&&S.master.pump>0&&audibleT(tr,anySolo)){ const g=Gx.duck.gain; g.cancelScheduledValues(tt); g.setTargetAtTime(1-S.master.pump*.75,tt,.004); g.setTargetAtTime(1,tt+.03,.05+sd*1.2); }
      if(!live) continue;
      const B=clipBus(Gx,tr,e.c,pass,base+(e.c.start-st)*sd);
      try{ if(tr.kind==='drum') fn(Gx.ctx,B.in,tr.p,tt,vel,e.d*sd,e.n,Gx.R);
        else { const midi=degToMidi(e.n,tr.oct), dur=Math.max(.03,e.d*sd-.004)+(e.tie?.06:0);
          if(e.from!=null&&e.from!==e.n){ const p2=legatoP(tr.p); if(GLIDE_ENG.has(I.engine)) withGlide(Gx.ctx,mtof(degToMidi(e.from,tr.oct))/mtof(midi),tt,Math.min(.09,sd*.6),()=>fn(Gx.ctx,B.in,p2,tt,vel,dur,midi,Gx.R)); else fn(Gx.ctx,B.in,p2,tt,vel,dur,midi,Gx.R); }
          else fn(Gx.ctx,B.in,tr.p,tt,vel,dur,midi,Gx.R); } }catch(err){ console.warn(err); }
      hits.push(tr.id);
    }
  }
  return hits;
}
// buses for clips that are already running when playback starts mid-song
function primeBuses(Gx,st,t,pass,only){
  const sd=stepDur(), anySolo=S.tracks.some(x=>x.solo);
  for(const tr of S.tracks){ if(!(only?only===tr.id:audibleT(tr,anySolo))) continue;
    for(const c of tr.clips){ const pre=c.fin&&c.fin.type==='riser'?c.fin.len:0; if(c.start-pre<st&&clipEnd(c)>st) clipBus(Gx,tr,c,pass,t+(c.start-st)*sd); }
    /* long atmosphere notes already under way when playback starts: join them, fading in quickly */
    const I=INST[tr.inst]; if(!I||I.engine!=='atmos') continue;
    for(const c of tr.clips){ if(!(c.start<st&&clipEnd(c)>st)) continue;
      for(const e of flatten(c)){ if(!(e.at<st&&e.at+e.d>st+.5)) continue; const B=clipBus(Gx,tr,c,pass,t+(c.start-st)*sd);
        try{ VOICES.atmos(Gx.ctx,B.in,{...tr.p,fadeIn:Math.min(1.2,tr.p.fadeIn??3)},t,e.v,(e.at+e.d-st)*sd,degToMidi(e.n,tr.oct),Gx.R); }catch(err){ console.warn(err); } } } }
}

/* =========================================================
   LIVE TRANSPORT
   ========================================================= */
let ac=null, G=null, playing=false, nextTime=0, PH={step:0,pass:0}, uiQueue=[], recent=[], playView={step:-1,t:0};
const lastHit={}; const LIVE={G:null,voices:new Set()};
let anaL,anaR,anaS;
const TIMER=(()=>{ try{ const w=new Worker(URL.createObjectURL(new Blob(['let id=null;onmessage=e=>{clearInterval(id);id=null;if(e.data==="go")id=setInterval(()=>postMessage(0),25);};'],{type:'text/javascript'})));
  w.onmessage=()=>{ if(playing) tick(); }; return {go:()=>w.postMessage('go'),halt:()=>w.postMessage('halt')}; }
  catch(e){ let id=null; return {go:()=>{clearInterval(id);id=setInterval(()=>{ if(playing) tick(); },25);},halt:()=>{clearInterval(id);id=null;}}; } })();
function ensureAudio(){
  if(ac) return;
  ac=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
  G=buildGraph(ac); LIVE.G=G;
  const reg=src=>{ LIVE.voices.add(src); src.addEventListener('ended',()=>LIVE.voices.delete(src)); return src; };
  const mkO=ac.createOscillator.bind(ac), mkB=ac.createBufferSource.bind(ac);
  ac.createOscillator=()=>reg(mkO()); ac.createBufferSource=()=>reg(mkB());
  LIVE.rawB=mkB;
  OUT=buildOut(); DECK.A=eqChain(); DECK.B=eqChain(); DECK.A.xf.connect(OUT.in); DECK.B.xf.connect(OUT.in);
  G.out.disconnect(); G.out.connect(DECK.A.in);
  const sp=ac.createChannelSplitter(2);
  anaL=ac.createAnalyser(); anaR=ac.createAnalyser(); anaS=ac.createAnalyser();
  anaL.fftSize=anaR.fftSize=1024; anaS.fftSize=4096; anaS.smoothingTimeConstant=.55;
  OUT.out.connect(sp); sp.connect(anaL,0); sp.connect(anaR,1); OUT.out.connect(anaS);
  applyDeckEq(); applyXf(); setDJFilter(PERF.filter);
}
const loopRange=()=>{ if(UI.loopSel&&RANGE&&RANGE.b>RANGE.a) return {a:RANGE.a,b:RANGE.b}; return {a:0,b:S.len}; };
let starting=false;
async function startPlay(at){
  ensureAudio(); stopPreview();
  if(playing||starting) return;
  starting=true; if(ac.state!=='running'){ try{ await ac.resume(); }catch(e){} } starting=false;
  if(playing) return;
  const L=loopRange(); if(PH.step<L.a||PH.step>=L.b) PH.step=L.a;
  playing=true; uiQueue=[]; recent=[];
  nextTime=at||ac.currentTime+.06;
  G.duck.gain.cancelScheduledValues(0); G.duck.gain.setValueAtTime(1,ac.currentTime);
  primeBuses(G,PH.step,nextTime,PH.pass);
  tick(); TIMER.go(); renderPlayBtn();
}
function killVoices(){
  if(!ac) return; const now=ac.currentTime;
  for(const T of G.ch.values()){ const g=T.in.gain; g.cancelScheduledValues(now); g.setValueAtTime(g.value,now); g.linearRampToValueAtTime(0,now+.03); g.setValueAtTime(0,now+.045); g.linearRampToValueAtTime(1,now+.06); }
  LIVE.voices.forEach(v=>{ try{ v.stop(now+.04); }catch(e){} }); LIVE.voices.clear();
  for(const [k,B] of G.cb){ try{ B.g.disconnect(); }catch(e){} } G.cb.clear(); PH.pass++;
  G.duck.gain.cancelScheduledValues(now); G.duck.gain.setValueAtTime(1,now);
}
function stopPlay(){
  if(!playing){ renderPlayBtn(); return; }
  playing=false; TIMER.halt();
  if(ac){ const now=ac.currentTime, next=uiQueue.find(e=>e.t>now+.004); if(next) PH.step=next.step; killVoices(); }
  uiQueue=[]; playView={step:-1,t:0}; renderPlayBtn(); requestDraw();
}
function seekTo(step){
  const L=loopRange(); step=clamp(Math.round(step),0,Math.max(0,S.len-1));
  const was=playing; if(was){ playing=false; TIMER.halt(); killVoices(); }
  PH.step=step; uiQueue=[]; playView={step:-1,t:0};
  if(was) startPlay(); else { renderPlayBtn(); requestDraw(); }
}
function restartPlay(){ seekTo(loopRange().a); }
function tick(){
  if(!playing) return;
  const ahead=.14;
  while(nextTime<ac.currentTime+ahead){
    const L=loopRange();
    if(PH.step>=L.b){
      if((S.loop||UI.loopSel)&&!HUM.recording){ PH.step=L.a; PH.pass++; primeBuses(G,PH.step,nextTime,PH.pass); }
      else { const endAt=nextTime; setTimeout(()=>{ if(playing){ stopPlay(); PH.step=0; requestDraw(); } },Math.max(0,(endAt-ac.currentTime)*1000)+400); playing=false; TIMER.halt(); return; }
    }
    const hits=scheduleAt(G,PH.step,nextTime,PH.pass);
    const ev={t:nextTime,step:PH.step,hits}; uiQueue.push(ev); recent.push(ev); if(recent.length>64) recent.shift();
    PH.step++; nextTime+=stepDur();
  }
}
function audition(trackId,n){
  ensureAudio(); if(ac.state!=='running') ac.resume();
  const tr=trackById(trackId); if(!tr) return; const I=INST[tr.inst], T=channel(G,tr), t=ac.currentTime+.01;
  try{ if(tr.kind==='drum') VOICES[I.engine](ac,T.in,tr.p,t,.85,.1,n??0,G.R); else VOICES[I.engine](ac,T.in,tr.p,t,.8,Math.min(.6,stepDur()*3),degToMidi(n??0,tr.oct),G.R); }catch(e){ console.warn(e); }
}

/* =========================================================
   OFFLINE RENDER (song or range, optional single track, optional other song)
   ========================================================= */
const RSR=48000;
async function renderSong({a=0,b=null,only=null,onProgress=null,state=null}={}){
  const withS=fn=>{ const keep=S, keepIdx=IDX; if(state){ S=state; IDX=null; } try{ return fn(); } finally { if(state){ state.__idx=IDX; S=keep; IDX=keepIdx; } } };
  let ctx,g,len,st,end,sd; const CH=1, ahead=2;
  withS(()=>{ end=b==null?S.len:b; sd=stepDur(); const tail=3+S.master.size*.7+S.master.echo*3; len=.05+(end-a)*sd+tail;
    ctx=new OfflineAudioContext(2,Math.ceil(len*RSR),RSR); ctx.__tick=[]; g=buildGraph(ctx,{stem:!!only}); st=a; primeBuses(g,a,.05,0,only); });
  const until=tEnd=>{ const keep=S, keepIdx=IDX; if(state){ S=state; IDX=state.__idx||null; } try{ while(st<end){ const t=.05+(st-a)*sd; if(t>=tEnd) break; scheduleAt(g,st,t,0,only); st++; } } finally { if(state){ state.__idx=IDX; S=keep; IDX=keepIdx; } } };
  until(ahead);
  for(let k=1;k*CH<len-.1;k++){ const at=k*CH; ctx.suspend(at).then(()=>{ until(at+ahead); ctx.__tick.forEach(f=>f(at)); if(onProgress) onProgress(at/len); ctx.resume(); }); }
  return await ctx.startRendering();
}

/* =========================================================
   CONVERT A PATTERN DEMO (vibes) INTO A TIMELINE SONG
   ========================================================= */
const VIBE_KIT={Ambient:'Soft Kit','Lo-fi':'Lo-fi Kit',Synthwave:'Linn Kit',Vaporwave:'Vapor Kit',House:'909 Kit',Techno:'Techno Kit',Trap:'Trap Kit',Raga:'Tabla & Percussion'};
function fromPattern(op){
  const song=newSong(); Object.assign(song,{name:op.name,desc:op.desc,vibe:op.vibe,bpm:op.bpm,swing:op.swing,root:op.root,scale:op.scale,master:{...song.master,...op.master}});
  const part=op.bars*16, chain=op.chain.length?op.chain:[op.cur]; song.len=chain.length*part;
  const runs=[]; chain.forEach((sc,i)=>{ const r=runs[runs.length-1]; if(r&&r.sc===sc) r.n++; else runs.push({sc,i,n:1}); });
  const keep=S; S=song;
  try{
    const raga=op.vibe==='Raga';
    const kitT=newTrack(slug(VIBE_KIT[op.vibe]||'808 Kit'),{name:'Drums',vol:.85});
    const snMode=(PRESETS.snare[op.tracks.snare.preset]||{}).mode;
    const pieceOf={kick:raga?15:0,snare:raga?14:(snMode==='clap'?2:snMode==='rim'?3:1),hat:raga?11:4};
    const drumNotes=sc=>{ const out=[]; ['kick','snare','hat'].forEach(id=>{ const vs=clamp((op.tracks[id].vol||.8)/.85,.3,1.3);
      sc.notes[id].forEach(n=>{ const pc=id==='hat'&&n.v>=.95&&!raga?5:pieceOf[id]; const r=(n.r|0)>1?n.r:1; for(let k=0;k<r;k++) out.push({t:n.s+k/r,d:1/r,n:pc,v:clamp(n.v*vs*(k?.8:1),.05,1)}); }); }); return out; };
    const mk=(tr,getNotes)=>{ runs.forEach(r=>{ const notes=getNotes(op.scenes[r.sc]); if(notes.length) tr.clips.push(newClip(r.i*part,r.n*part,notes,{loop:true,loopLen:part,name:'Part '+'ABCD'[r.sc]})); }); if(tr.clips.length) song.tracks.push(tr); };
    mk(kitT,drumNotes);
    [['bass','Bass'],['keys','Melody'],['pad','Chords'],['ghost','Ghost'],['sample','Voice']].forEach(([id,name])=>{ const o=op.tracks[id], I=instByName(o.preset.replace(/ \(edited\)$/,''))||INSTS[0];
      const tr=newTrack(I.id,{name:name+' · '+I.name,vol:o.vol,pan:o.pan,space:o.space,echo:o.echo}); tr.p={...I.p,...o.p};
      mk(tr,sc=>sc.notes[id].map(n=>({t:n.s,d:n.d,n:n.n,v:n.v||.85}))); });
    song.tracks.forEach((t,i)=>t.color=i%COLORS.length);
  } finally { S=keep; }
  return song;
}
function demoSong(name){ return fromPattern(STARTERS[name]()); }
function vibeSong(v,fresh){ const V=VIBES[v]; const op=(!fresh&&V.demo&&STARTERS[V.demo])?STARTERS[V.demo]():generateSong(v); op.vibe=v; return fromPattern(op); }

/* =========================================================
   CLIP + NOTE EDITING PRIMITIVES
   ========================================================= */
function bakeClip(c){ if(!c.loop) return; const fl=flatten(c); c.notes=fl.map(e=>({t:e.at-c.start,d:e.d,n:e.n,v:e.v})); c.offset=0; c.loop=false; c.loopLen=c.len; }
function splitClip(tr,c,at){
  at=Math.round(at); if(at<=c.start||at>=clipEnd(c)) return null;
  const b=JSON.parse(JSON.stringify(c)); b.id=nid(); const cut=at-c.start;
  b.start=at; b.len=c.len-cut; b.offset=c.offset+cut; b.fin={type:'cut',len:0}; c.fout={type:'cut',len:0}; c.len=cut;
  if(!c.loop){ c.notes=c.notes.filter(n=>n.t<c.offset+c.len); }
  tr.clips.push(b); markDirty(); return b;
}
// remove [a,b) from a track, splitting clips where needed
function eraseRange(tr,a,b){
  for(const c of [...tr.clips]){
    const s=c.start, e=clipEnd(c); if(e<=a||s>=b) continue;
    if(s>=a&&e<=b){ tr.clips.splice(tr.clips.indexOf(c),1); continue; }
    if(s<a&&e>b){ const r=splitClip(tr,c,b); c.len=a-c.start; continue; }
    if(s<a){ c.len=a-s; c.fout={type:'cut',len:0}; continue; }
    const cut=b-s; c.start=b; c.len-=cut; c.offset+=cut; c.fin={type:'cut',len:0};
  }
  markDirty();
}
// notes that sound inside [a,b) on a track, relative to a
function notesInRange(tr,a,b){
  const out=[]; for(const c of tr.clips) for(const e of flatten(c)){ if(e.at>=a-1e-6&&e.at<b-1e-6) out.push({t:e.at-a,d:Math.min(e.d,b-e.at),n:e.n,v:e.v}); }
  return out.sort((x,y)=>x.t-y.t);
}
function mapNotesKind(notes,fromKind,toKind){
  if(fromKind===toKind) return notes;
  if(toKind==='drum') return notes.map(n=>({...n,n:((Math.round(n.n)%7)+7)%7===0?0:[1,4,2,4,5,4][(((Math.round(n.n)%7)+7)%7)-1]??4,d:Math.min(n.d,1)}));
  return notes.map(n=>({...n,n:[0,7,4,2,9,11,-7,-5,-3,14,12,5,3,1,6,-1][n.n|0]??0,d:Math.max(1,n.d)}));
}

