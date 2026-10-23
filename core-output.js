/* KYMA · core/output — master output chain, deck EQs, crossfader and performance effects */
let OUT=null; const DECK={A:null,B:null};
const PERF={filter:0,xf:0,eq:{A:{lo:0,mid:0,hi:0,lvl:1},B:{lo:0,mid:0,hi:0,lvl:1}}};
function eqChain(){ const lo=bq(ac,'lowshelf',220), mid=bq(ac,'peaking',1200,.8), hi=bq(ac,'highshelf',3500), fader=gainN(ac,1), xf=gainN(ac,1); lo.connect(mid).connect(hi).connect(fader).connect(xf); return {in:lo,lo,mid,hi,fader,xf}; }
function crushCurve(){ const n=4096,c=new Float32Array(n),lv=9; for(let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.round(x*lv)/lv; } return c; }
function buildOut(){
  const O={}; O.in=ac.createGain();
  O.hp=bq(ac,'highpass',10,.7); O.lp=bq(ac,'lowpass',20000,.7);
  O.crDry=gainN(ac,1); O.crWet=gainN(ac,0); O.crSh=ac.createWaveShaper(); O.crSh.curve=crushCurve(); O.crLP=bq(ac,'lowpass',4200,.7); O.m1=ac.createGain();
  O.in.connect(O.hp).connect(O.lp); O.lp.connect(O.crDry).connect(O.m1); O.lp.connect(O.crSh).connect(O.crLP).connect(O.crWet).connect(O.m1);
  O.dry=gainN(ac,1); O.rpIn=gainN(ac,0); O.rpDel=ac.createDelay(4); O.rpFb=gainN(ac,0); O.rpWet=gainN(ac,0); O.m2=ac.createGain();
  O.m1.connect(O.dry).connect(O.m2); O.m1.connect(O.rpIn).connect(O.rpDel); O.rpDel.connect(O.rpFb).connect(O.rpDel); O.rpDel.connect(O.rpWet).connect(O.m2);
  O.ts=ac.createDelay(3); O.ts.delayTime.value=0; O.tsG=gainN(ac,1); O.m2.connect(O.ts).connect(O.tsG);
  O.m3=ac.createGain(); O.tsG.connect(O.m3);
  O.thS=gainN(ac,0); O.thD=ac.createDelay(3); O.thD.delayTime.value=.4; O.thLP=bq(ac,'lowpass',3200,.6); O.thFb=gainN(ac,.55); O.thRet=gainN(ac,.85);
  O.tsG.connect(O.thS).connect(O.thD).connect(O.thLP); O.thLP.connect(O.thFb).connect(O.thD); O.thLP.connect(O.thRet).connect(O.m3);
  O.lim=ac.createDynamicsCompressor(); O.lim.threshold.value=-1; O.lim.knee.value=0; O.lim.ratio.value=20; O.lim.attack.value=.002; O.lim.release.value=.1;
  O.out=gainN(ac,1); O.m3.connect(O.lim).connect(O.out).connect(ac.destination);
  return O;
}
const dbg=v=>Math.pow(10,v/20);
function applyDeckEq(){ if(!DECK.A) return; const now=ac.currentTime; ['A','B'].forEach(k=>{ const e=PERF.eq[k], d=DECK[k];
  d.lo.gain.setTargetAtTime(e.lo,now,.02); d.mid.gain.setTargetAtTime(e.mid,now,.02); d.hi.gain.setTargetAtTime(e.hi,now,.02); d.fader.gain.setTargetAtTime(e.lvl,now,.02); }); }
function applyXf(){ if(!DECK.A) return; const x=STUDIO==='dj'?PERF.xf:0, now=ac.currentTime;
  DECK.A.xf.gain.setTargetAtTime(Math.cos(x*Math.PI/2),now,.015); DECK.B.xf.gain.setTargetAtTime(Math.sin(x*Math.PI/2),now,.015); }
function setDJFilter(f,q){ if(!OUT) return; const now=ac.currentTime, Q=q==null?.7:q;
  const lp=f<0?20000*Math.pow(.0125,-f):20000, hp=f>0?20*Math.pow(90,f):10;
  hold(OUT.lp.frequency,now); hold(OUT.hp.frequency,now);
  OUT.lp.frequency.setTargetAtTime(lp,now,.025); OUT.hp.frequency.setTargetAtTime(hp,now,.025);
  OUT.lp.Q.setTargetAtTime(f<-.02?Q:.7,now,.03); OUT.hp.Q.setTargetAtTime(f>.02?Q:.7,now,.03); }
function hold(p,t){ if(p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { const v=p.value; p.cancelScheduledValues(t); p.setValueAtTime(v,t); } }
function fade(p,v,d=.008){ const t=ac.currentTime; hold(p,t); p.linearRampToValueAtTime(v,t+d); }

/* ---- punch-in FX (hold to play) ---- */
function repeatOn(n){ const now=ac.currentTime, len=n*stepDur();
  OUT.rpDel.delayTime.cancelScheduledValues(now); OUT.rpDel.delayTime.setValueAtTime(len,now);
  hold(OUT.rpIn.gain,now); OUT.rpIn.gain.setValueAtTime(1,now); OUT.rpIn.gain.setValueAtTime(0,now+len);
  hold(OUT.rpFb.gain,now); OUT.rpFb.gain.setValueAtTime(.999,now);
  hold(OUT.dry.gain,now); OUT.dry.gain.setValueAtTime(1,now+len-.004); OUT.dry.gain.linearRampToValueAtTime(0,now+len);
  hold(OUT.rpWet.gain,now); OUT.rpWet.gain.setValueAtTime(0,now+len-.004); OUT.rpWet.gain.linearRampToValueAtTime(1,now+len); }
function repeatOff(){ const now=ac.currentTime; fade(OUT.dry.gain,1,.01); fade(OUT.rpWet.gain,0,.01); fade(OUT.rpFb.gain,0,.02); hold(OUT.rpIn.gain,now); OUT.rpIn.gain.setValueAtTime(0,now); }
function tapeStopOn(){ const now=ac.currentTime, T=clamp(8*stepDur(),.5,1.4), N=10, dt=OUT.ts.delayTime;
  hold(dt,now); dt.setValueAtTime(0,now); for(let i=1;i<=N;i++){ const t=i/N*T; dt.linearRampToValueAtTime(t*t/(2*T),now+t); }
  hold(OUT.tsG.gain,now); OUT.tsG.gain.setValueAtTime(1,now); OUT.tsG.gain.linearRampToValueAtTime(0,now+T); }
function tapeStopOff(){ const now=ac.currentTime; hold(OUT.tsG.gain,now); OUT.tsG.gain.setValueAtTime(0,now); OUT.ts.delayTime.cancelScheduledValues(now); OUT.ts.delayTime.setValueAtTime(0,now+.01); OUT.tsG.gain.linearRampToValueAtTime(1,now+.05); }
function sweepOn(kind){ const now=ac.currentTime, T=4*stepDur();
  if(kind==='lp'){ const p=OUT.lp.frequency; hold(p,now); p.exponentialRampToValueAtTime(320,now+T); OUT.lp.Q.setTargetAtTime(7,now,.05); }
  else { const p=OUT.hp.frequency; hold(p,now); p.setValueAtTime(Math.max(12,p.value),now); p.exponentialRampToValueAtTime(1600,now+T); OUT.hp.Q.setTargetAtTime(5,now,.05); } }
function sweepOff(){ setDJFilter(PERF.filter); }
function crushOn(){ fade(OUT.crDry.gain,0); fade(OUT.crWet.gain,1.1); }
function crushOff(){ fade(OUT.crDry.gain,1); fade(OUT.crWet.gain,0); }
function throwOn(){ OUT.thD.delayTime.setValueAtTime(Math.min(2.9,.75*60/S.bpm),ac.currentTime); fade(OUT.thS.gain,1,.01); }
function throwOff(){ fade(OUT.thS.gain,0,.03); }
