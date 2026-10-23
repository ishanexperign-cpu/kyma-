/* KYMA · core/instruments — synth engines and the instrument library */
/* =========================================================
   NEW ENGINES: plucked strings, mallets, organ, winds, bowed strings, brass, choir, leads, drum kits
   ========================================================= */
const KS_CACHE=new Map();
function ksBuffer(ctx,p,midi){
  const sr=ctx.sampleRate, key=[sr,midi,p.bright,p.decay,p.damp,p.pick,p.buzz,p.len].map(v=>typeof v==='number'?(+v).toFixed(3):String(v)).join('|');
  const hit=KS_CACHE.get(key); if(hit){ KS_CACHE.delete(key); KS_CACHE.set(key,hit); return hit; }
  const f=mtof(midi), k=.5*clamp(p.damp,0,1), D=Math.max(2.2,sr/f-k), N=Math.floor(D), frac=D-N;
  const len=Math.floor(sr*clamp(p.len||3,.3,4)), y=new Float32Array(len);
  let lp=0; const a=.12+.88*clamp(p.bright,0,1), ex=new Float32Array(N+3);
  for(let i=0;i<N+3;i++){ const w=Math.random()*2-1; lp+=a*(w-lp); ex[i]=lp; }
  const pk=Math.max(1,Math.floor(N*clamp(p.pick,.02,.5))); for(let i=N+2;i>=pk;i--) ex[i]-=ex[i-pk]*.9;
  for(let i=0;i<Math.min(len,N+3);i++) y[i]=ex[i];
  const g=Math.pow(.001,1/(f*Math.max(.05,p.decay))), th=.24*(1-clamp(p.buzz,0,1))+.03;
  for(let n=N+3;n<len;n++){
    const i0=n-N, s0=y[i0]*(1-frac)+y[i0-1]*frac, s1=y[i0-1]*(1-frac)+y[i0-2]*frac;
    let v=g*((1-k)*s0+k*s1);
    if(p.buzz>0){ if(v>th) v=th+(v-th)*.3; else if(v<-th*1.6) v=-th*1.6+(v+th*1.6)*.5; }
    y[n]=v;
  }
  let pkv=0; for(let i=0;i<len;i++) pkv=Math.max(pkv,Math.abs(y[i])); if(pkv>0){ const s=.8/pkv; for(let i=0;i<len;i++) y[i]*=s; }
  const b=ctx.createBuffer(1,len,sr); b.copyToChannel(y,0);
  KS_CACHE.set(key,b); if(KS_CACHE.size>90) KS_CACHE.delete(KS_CACHE.keys().next().value);
  return b;
}
const MODES={
  marimba:{r:[1,3.99,10.65],a:[1,.35,.12],d:[.7,.18,.05]}, vibes:{r:[1,3.98,9.6],a:[1,.25,.08],d:[3,.9,.3]},
  glock:{r:[1,2.76,5.4,8.93],a:[1,.5,.25,.12],d:[2.2,1.2,.6,.3]}, xylo:{r:[1,3,6.5],a:[1,.4,.15],d:[.35,.1,.04]},
  kalimba:{r:[1,5.6,10.1],a:[1,.25,.1],d:[1.4,.3,.12]}, steelpan:{r:[1,2,3.01,4.02],a:[1,.6,.35,.2],d:[1.6,1.1,.7,.4]},
  tubular:{r:[1,2.02,3.01,4.17,5.41],a:[1,.7,.45,.3,.2],d:[5,4,3,2,1.5]}, gamelan:{r:[1,1.52,2.42,3.17],a:[1,.6,.4,.3],d:[2.8,2,1.4,1]},
  celesta:{r:[1,4.01],a:[1,.25],d:[1.4,.4]}, musicbox:{r:[1,3.99,8.2],a:[1,.3,.1],d:[1.8,.6,.2]},
  bowl:{r:[1,2.71,4.95,7.6],a:[1,.5,.3,.15],d:[7,5,3,2]}, gong:{r:[1,1.42,1.96,2.45,2.99,3.7],a:[1,.8,.6,.5,.35,.25],d:[6,5,4,3.5,3,2.5]},
};
const ORGAN_REG={jazz:'888000000',full:'888888888',gospel:'888800048',flute:'008000000',reed:'468866446',pipe:'608804000',bright:'800008888',soft:'006802000'};
function organWave(ctx,R,reg){
  R.org=R.org||{}; if(R.org[reg]) return R.org[reg];
  const bars=(ORGAN_REG[reg]||reg).split('').map(d=>+d/8), H=[1,3,2,4,6,8,10,12,16], re=new Float32Array(17), im=new Float32Array(17);
  bars.forEach((a,i)=>{ im[H[i]]+=a; });
  return R.org[reg]=ctx.createPeriodicWave(re,im);
}
const VOWELS={aa:[[730,10,1],[1090,12,.5],[2440,18,.25]],oo:[[300,8,1],[870,12,.35],[2240,18,.12]],ee:[[270,8,1],[2290,16,.4],[3010,20,.25]],mm:[[250,6,1],[1000,8,.12],[2500,10,.04]]};
function vibratoTo(ctx,param,t,depthCents,rate,delay){
  const l=ctx.createOscillator(), g=ctx.createGain(); l.frequency.value=rate*(1+(Math.random()-.5)*.08);
  g.gain.setValueAtTime(0,t); g.gain.setValueAtTime(0,t+delay); g.gain.linearRampToValueAtTime(depthCents,t+delay+.35);
  l.connect(g).connect(param); return l;
}
Object.assign(VOICES,{
  pluck(ctx,out,p,t,vel,dur,midi,R){
    const buf=ksBuffer(ctx,p,midi), amp=.6*vel, off=t+Math.max(dur,.03), end=Math.min(t+buf.duration,off+p.release*1.6+.05);
    const lp=bq(ctx,'lowpass',p.tone,.5), g=ctx.createGain();
    g.gain.setValueAtTime(amp,t); g.gain.setValueAtTime(amp,off); g.gain.setTargetAtTime(0,off,Math.max(.01,p.release/4));
    let head=lp;
    if(p.body>.01){ const b=bq(ctx,'peaking',210,1.2); b.gain.value=p.body*7; lp.connect(b); head=b; }
    head.connect(g).connect(out);
    const s=ctx.createBufferSource(); s.buffer=buf; s.connect(lp); s.start(t); s.stop(end);
    if(p.chorus>.5){ const s2=ctx.createBufferSource(); s2.buffer=buf; s2.playbackRate.value=Math.pow(2,p.chorus/1200); const pn=ctx.createStereoPanner(); pn.pan.value=.45; const g2=gainN(ctx,.6); s2.connect(g2).connect(pn).connect(lp); s2.start(t+.004); s2.stop(end); }
  },
  mallet(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), M=MODES[p.modes]||MODES.marimba, amp=.3*vel, sum=ctx.createGain(), lp=bq(ctx,'lowpass',p.tone,.4); sum.connect(lp).connect(out);
    let end=t+.1; const oscs=[];
    M.r.forEach((r,i)=>{ const fr=f*r; if(fr>ctx.sampleRate*.45) return;
      const o=ctx.createOscillator(); o.frequency.value=fr*(1+(Math.random()-.5)*.0015); const g=ctx.createGain(), d=M.d[i]*p.decay, a=M.a[i]*(i?p.bright:1);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(amp*a,t+.002); g.gain.setTargetAtTime(0,t+.002,Math.max(.01,d/4));
      if(p.mute>.01){ g.gain.setTargetAtTime(0,t+Math.max(dur,.05),.04+(1-p.mute)*.4); }
      o.connect(g).connect(sum); oscs.push(o); end=Math.max(end,t+d*1.8+.05); });
    if(p.click>.01){ const n=noiseSrc(ctx,R.white,t,.02), bp=bq(ctx,'bandpass',Math.min(9000,f*4),1.5), ng=ctx.createGain(); ng.gain.setValueAtTime(amp*p.click*.8,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.012); n.connect(bp).connect(ng).connect(sum); }
    if(p.trem>.01){ const l=ctx.createOscillator(), lg=gainN(ctx,p.trem*.5); l.frequency.value=5.2; sum.gain.value=1-p.trem*.25; l.connect(lg).connect(sum.gain); oscs.push(l); }
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  organ(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), amp=.16*vel, g=ctx.createGain(), lp=bq(ctx,'lowpass',p.tone,.5), oscs=[];
    const mk=(det)=>{ const o=ctx.createOscillator(); o.setPeriodicWave(organWave(ctx,R,p.reg)); o.frequency.value=f/2; o.detune.value=det; o.connect(lp); oscs.push(o);
      if(p.vib>.01) oscs.push(vibratoTo(ctx,o.detune,t,p.vib*14,p.rotor,0)); return o; };
    mk(0); if(p.det>.5) mk(p.det);
    lp.connect(g).connect(out);
    const end=envAR(g,t,amp/(p.det>.5?1.4:1),p.attack,dur,p.release);
    if(p.perc>.01){ const o=ctx.createOscillator(), pg=ctx.createGain(); o.frequency.value=f*3; pg.gain.setValueAtTime(amp*p.perc,t); pg.gain.setTargetAtTime(0,t+.002,.06); o.connect(pg).connect(out); oscs.push(o); }
    if(p.click>.01){ const n=noiseSrc(ctx,R.white,t,.01), ng=ctx.createGain(), hp=bq(ctx,'highpass',2500,.7); ng.gain.setValueAtTime(amp*p.click,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.006); n.connect(hp).connect(ng).connect(out); }
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  wind(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), amp=.2*vel, g=ctx.createGain(), lp=bq(ctx,'lowpass',p.tone,.5), oscs=[];
    const o=ctx.createOscillator(); o.type={sine:'sine',tri:'triangle',square:'square',saw:'sawtooth'}[p.wave]||'triangle'; o.frequency.value=f; oscs.push(o);
    if(p.slide>.01){ o.detune.setValueAtTime(-p.slide*100,t); o.detune.linearRampToValueAtTime(0,t+.09); }
    if(p.vdepth>.01) oscs.push(vibratoTo(ctx,o.detune,t,p.vdepth*35,p.vrate,p.vdelay));
    let head=lp; if(p.fgain>.5){ const fm=bq(ctx,'peaking',p.formant,2); fm.gain.value=p.fgain; o.connect(fm).connect(lp); } else o.connect(lp);
    lp.connect(g).connect(out);
    const end=envADSR(g,t,amp,p.attack,.25,.9,dur,p.release);
    if(p.breath>.01){ const n=noiseSrc(ctx,R.pink,t,end-t), bp=bq(ctx,'bandpass',Math.min(9000,f*2),1.6), ng=ctx.createGain(); ng.gain.value=p.breath*.9; n.connect(bp).connect(ng).connect(g); }
    if(p.chiff>.01){ const n=noiseSrc(ctx,R.white,t,.08), bp=bq(ctx,'bandpass',Math.min(9000,f*4),2), ng=ctx.createGain(); ng.gain.setValueAtTime(amp*p.chiff*1.4,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.06); n.connect(bp).connect(ng).connect(out); }
    oscs.forEach(x=>{x.start(t);x.stop(end);});
  },
  strings(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), amp=.12*vel, g=ctx.createGain(), lp=bq(ctx,'lowpass',p.tone,.5), b1=bq(ctx,'peaking',450,1.2), b2=bq(ctx,'peaking',1600,1.5), oscs=[];
    b1.gain.value=4; b2.gain.value=2+p.nasal*8;
    [-1,0,1].forEach(k=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=k*p.det;
      if(p.slide>.01){ o.detune.setValueAtTime(k*p.det-p.slide*100,t); o.detune.linearRampToValueAtTime(k*p.det,t+.14); }
      if(p.vdepth>.01) oscs.push(vibratoTo(ctx,o.detune,t,p.vdepth*30,p.vrate,p.vdelay));
      const pn=ctx.createStereoPanner(); pn.pan.value=k*.4; o.connect(pn).connect(lp); oscs.push(o); });
    lp.connect(b1).connect(b2).connect(g).connect(out);
    const end=envAR(g,t,amp,p.attack,dur,p.release);
    if(p.bow>.01){ const n=noiseSrc(ctx,R.pink,t,end-t), bp=bq(ctx,'bandpass',Math.min(9000,f*3),2), ng=gainN(ctx,p.bow*.5); n.connect(bp).connect(ng).connect(g); }
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  brass(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), amp=.15*vel, g=ctx.createGain(), lp=bq(ctx,'lowpass',f*1.2,.9), oscs=[];
    const top=Math.min(16000,f*p.bright*12), sus=Math.min(14000,f*p.bright*5);
    lp.frequency.setValueAtTime(f*1.1,t); lp.frequency.linearRampToValueAtTime(top,t+p.attack*1.4); lp.frequency.setTargetAtTime(sus,t+p.attack*1.4,.15);
    [-1,1].forEach(k=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=k*p.det/2;
      o.detune.setValueAtTime(k*p.det/2-30,t); o.detune.linearRampToValueAtTime(k*p.det/2,t+.05);
      if(p.vdepth>.01) oscs.push(vibratoTo(ctx,o.detune,t,p.vdepth*25,p.vrate,.25));
      o.connect(lp); oscs.push(o); });
    lp.connect(g).connect(out);
    const end=envADSR(g,t,amp,p.attack,.3,.85,dur,p.release);
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  choirv(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), amp=.17*vel, bus=ctx.createGain(), env=ctx.createGain(), oscs=[];
    (VOWELS[p.vowel]||VOWELS.aa).forEach(([F,q,a])=>{ const bp=bq(ctx,'bandpass',F*p.size,q), fg=gainN(ctx,a*2.4); bus.connect(bp).connect(fg).connect(env); });
    [-1.5,-.5,.5,1.5].forEach(k=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=k*p.det;
      if(p.vdepth>.01) oscs.push(vibratoTo(ctx,o.detune,t,p.vdepth*28,4.6+k*.3,.15));
      const pn=ctx.createStereoPanner(); pn.pan.value=k*.3; const g=gainN(ctx,.25); o.connect(g).connect(pn).connect(bus); oscs.push(o); });
    env.connect(out);
    const end=envAR(env,t,amp,p.attack,dur,p.release);
    if(p.breath>.01){ const n=noiseSrc(ctx,R.pink,t,end-t), hp=bq(ctx,'highpass',1200,.7), ng=gainN(ctx,p.breath*.35); n.connect(hp).connect(ng).connect(bus); }
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  lead(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), amp=.15*vel, wave={saw:'sawtooth',square:'square',tri:'triangle',sine:'sine'}[p.wave]||'sawtooth';
    const lp=bq(ctx,'lowpass',p.cutoff,p.res), sh=ctx.createWaveShaper(), g=ctx.createGain(), oscs=[];
    sh.curve=driveCurve(R,p.drive);
    lp.frequency.setValueAtTime(Math.min(16000,p.cutoff*(1+p.env*8)),t); lp.frequency.setTargetAtTime(p.cutoff,t+.003,Math.max(.01,p.decay/3));
    [-1,1].forEach(k=>{ const o=ctx.createOscillator(); o.type=wave; o.frequency.value=f; o.detune.value=k*p.det/2;
      if(p.glide>.01){ o.detune.setValueAtTime(k*p.det/2-p.glide*100,t); o.detune.linearRampToValueAtTime(k*p.det/2,t+.12); }
      if(p.vdepth>.01) oscs.push(vibratoTo(ctx,o.detune,t,p.vdepth*30,5.5,.25));
      o.connect(lp); oscs.push(o); });
    lp.connect(sh).connect(g).connect(out);
    const end=envADSR(g,t,amp/(1+p.drive*.6),p.attack,.3,p.sustain,dur,p.release);
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  kit(ctx,out,p,t,vel,dur,piece,R){
    const K=KITS[p.kit]||KITS['808 Kit'], tn=Math.pow(2,(p.tune||0)/12), dm=p.decay||1, pp=(eng,name,mod)=>Object.assign(presetParams(eng,name),mod||{});
    const hatP=pp('hat',K.hat);
    switch(piece|0){
      case 0:{ const q=pp('kick',K.kick); q.pitch*=tn; q.decay*=dm; VOICES.kick(ctx,out,q,t,vel,dur,0,R); break; }
      case 1:{ const q=pp('snare',K.snare); q.tone*=tn; q.decay*=dm; VOICES.snare(ctx,out,q,t,vel,dur,0,R); break; }
      case 2:{ const q=pp('snare',K.clap||'Big Clap'); q.decay*=dm; VOICES.snare(ctx,out,q,t,vel,dur,0,R); break; }
      case 3:{ const q=pp('snare','Rimshot'); q.tone*=tn; VOICES.snare(ctx,out,q,t,vel,dur,0,R); break; }
      case 4:{ hatP.decay*=dm; VOICES.hat(ctx,out,hatP,t,Math.min(vel,.9),dur,0,R); break; }
      case 5:{ hatP.decay*=hatP.open*dm*1.1; VOICES.hat(ctx,out,hatP,t,Math.min(vel,.9),dur,0,R); break; }
      case 6: case 7: case 8: tom(ctx,out,(K.tom||90)*[1,1.34,1.78][piece-6]*tn,(K.tdec||.4)*dm,t,vel,R); break;
      case 9: VOICES.hat(ctx,out,{tone:4200*tn,decay:1.5*dm,metal:.65,open:1},t,Math.min(vel,.9)*.9,dur,0,R); break;
      case 10: VOICES.hat(ctx,out,{tone:7200*tn,decay:.8*dm,metal:.9,open:1},t,Math.min(vel,.9)*.7,dur,0,R); break;
      case 11: VOICES.hat(ctx,out,{tone:6500,decay:.06*dm,metal:0,open:1},t,Math.min(vel,.9)*.8,dur,0,R); break;
      case 12: cowbell(ctx,out,tn,t,vel,dm); break;
      case 13: tom(ctx,out,260*tn,.18*dm,t,vel,R,true); break;
      case 14: tablaNa(ctx,out,330*tn,t,vel,dm); break;
      case 15: tablaGe(ctx,out,95*tn,t,vel,dm); break;
    }
  },
});
function tom(ctx,out,f,dec,t,vel,R,slap){
  const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(f*1.6,t); o.frequency.exponentialRampToValueAtTime(f,t+.05);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.7*vel,t+.002); g.gain.setTargetAtTime(0,t+.005,dec/3.5);
  o.connect(g).connect(out); o.start(t); o.stop(t+dec*1.6+.05);
  const n=noiseSrc(ctx,R.white,t,.04), bp=bq(ctx,'bandpass',slap?2200:f*6,1), ng=ctx.createGain(); ng.gain.setValueAtTime((slap?.45:.15)*vel,t); ng.gain.exponentialRampToValueAtTime(.0001,t+(slap?.03:.02)); n.connect(bp).connect(ng).connect(out);
}
function cowbell(ctx,out,tn,t,vel,dm){
  const bp=bq(ctx,'bandpass',2640*tn,2.5), g=ctx.createGain(); g.gain.setValueAtTime(.35*vel,t); g.gain.setTargetAtTime(0,t+.01,.08*dm); bp.connect(g).connect(out);
  [540,800].forEach(f=>{ const o=ctx.createOscillator(); o.type='square'; o.frequency.value=f*tn; o.connect(bp); o.start(t); o.stop(t+.5*dm+.05); });
}
function tablaNa(ctx,out,f,t,vel,dm){
  const sum=ctx.createGain(); sum.connect(out);
  [[1,1,.55],[2.01,.5,.3],[3.02,.3,.2],[4.1,.18,.12]].forEach(([r,a,d])=>{ const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(f*r*1.02,t); o.frequency.exponentialRampToValueAtTime(f*r,t+.03);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.32*vel*a,t+.002); g.gain.setTargetAtTime(0,t+.003,d*dm/3.5); o.connect(g).connect(sum); o.start(t); o.stop(t+d*dm*1.6+.05); });
}
function tablaGe(ctx,out,f,t,vel,dm){
  const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f*1.45,t+.18*dm);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.8*vel,t+.004); g.gain.setTargetAtTime(0,t+.01,.16*dm); o.connect(g).connect(out); o.start(t); o.stop(t+.7*dm+.05);
}
const PIECES=['Kick','Snare','Clap','Rim','Closed hat','Open hat','Low tom','Mid tom','High tom','Crash','Ride','Shaker','Cowbell','Conga','Tabla na','Tabla ge'];
const KITS={
  '808 Kit':{kick:'Sub 808',snare:'Crisp Snare',clap:'Big Clap',hat:'Metal 808',tom:75,tdec:.6},
  '909 Kit':{kick:'Tight House',snare:'Crisp Snare',clap:'Big Clap',hat:'Closed Tick',tom:95,tdec:.35},
  'Linn Kit':{kick:'Synthwave Linn',snare:'Gated Snare',clap:'Big Clap',hat:'Synthwave Hats',tom:100,tdec:.4},
  'Lo-fi Kit':{kick:'Dusty Boom',snare:'Lo-fi Snare',clap:'Big Clap',hat:'Dust',tom:90,tdec:.3},
  'Trap Kit':{kick:'Trap Kick',snare:'Crisp Snare',clap:'Trap Clap',hat:'Trap Hats',tom:70,tdec:.6},
  'Techno Kit':{kick:'Techno Thud',snare:'Crisp Snare',clap:'Big Clap',hat:'Metal 808',tom:85,tdec:.3},
  'Soft Kit':{kick:'Felt',snare:'Brush',clap:'Big Clap',hat:'Dust',tom:85,tdec:.4},
  'Vapor Kit':{kick:'Vapor Thump',snare:'Vapor Snare',clap:'Big Clap',hat:'Dust',tom:80,tdec:.45},
  'Brush Jazz Kit':{kick:'Felt',snare:'Brush',clap:'Big Clap',hat:'Shaker',tom:110,tdec:.35},
  'Tabla & Percussion':{kick:'Felt',snare:'Rimshot',clap:'Big Clap',hat:'Shaker',tom:120,tdec:.3},
  'Latin Percussion':{kick:'Dusty Boom',snare:'Rimshot',clap:'Big Clap',hat:'Shaker',tom:150,tdec:.25},
  'Boom Bap Kit':{kick:'Dusty Boom',snare:'Lo-fi Snare',clap:'Big Clap',hat:'Closed Tick',tom:90,tdec:.35},
};

/* =========================================================
   INSTRUMENT LIBRARY
   ========================================================= */
const ESCHEMA={...ENGINES,
  pluck:[P('bright','Bright',0,1,.6,{fmt:fmtPct}),P('decay','Sustain',.2,8,2.5,{log:1,fmt:fmtS}),P('damp','Damping',0,1,.5,{fmt:fmtPct}),P('pick','Pick spot',.05,.5,.18,{fmt:fmtPct}),P('buzz','Buzz',0,1,0,{fmt:fmtPct}),P('tone','Tone',500,16000,8000,{log:1,fmt:fmtHz}),P('body','Body',0,1,.3,{fmt:fmtPct}),P('release','Release',.02,2,.15,{fmt:fmtS}),P('chorus','Double',0,25,0,{fmt:v=>Math.round(v)+'¢'}),P('len','Ring time',.5,4,3,{fmt:fmtS})],
  mallet:[P('modes','Material',0,0,'marimba',{opts:Object.keys(MODES)}),P('decay','Decay',.2,3,1,{fmt:v=>v.toFixed(2)+'×'}),P('bright','Bright',0,1.5,1,{fmt:fmtPct}),P('trem','Tremolo',0,1,0,{fmt:fmtPct}),P('click','Strike',0,1,.4,{fmt:fmtPct}),P('mute','Damper',0,1,0,{fmt:fmtPct}),P('tone','Tone',500,16000,9000,{log:1,fmt:fmtHz})],
  organ:[P('reg','Stops',0,0,'jazz',{opts:Object.keys(ORGAN_REG)}),P('vib','Rotor',0,1,.4,{fmt:fmtPct}),P('rotor','Rotor speed',.5,7,5.5,{fmt:v=>v.toFixed(1)+'Hz'}),P('perc','Percussion',0,1,.4,{fmt:fmtPct}),P('click','Key click',0,1,.3,{fmt:fmtPct}),P('det','Musette',0,30,0,{fmt:v=>Math.round(v)+'¢'}),P('attack','Attack',.003,1.5,.005,{log:1,fmt:fmtS}),P('release','Release',.02,2,.08,{fmt:fmtS}),P('tone','Tone',800,12000,6000,{log:1,fmt:fmtHz})],
  wind:[P('wave','Tone source',0,0,'tri',{opts:['sine','tri','square','saw']}),P('breath','Breath',0,1,.35,{fmt:fmtPct}),P('chiff','Chiff',0,1,.3,{fmt:fmtPct}),P('vdepth','Vibrato',0,1,.3,{fmt:fmtPct}),P('vrate','Vib rate',2,8,5,{fmt:v=>v.toFixed(1)+'Hz'}),P('vdelay','Vib delay',0,1,.25,{fmt:fmtS}),P('slide','Scoop',0,2,0,{fmt:v=>v.toFixed(1)+' st'}),P('formant','Formant',300,4000,1200,{log:1,fmt:fmtHz}),P('fgain','Nasal',0,18,0,{fmt:v=>v.toFixed(0)+'dB'}),P('tone','Tone',500,12000,4000,{log:1,fmt:fmtHz}),P('attack','Attack',.005,1,.06,{log:1,fmt:fmtS}),P('release','Release',.02,2,.15,{fmt:fmtS})],
  strings:[P('det','Ensemble',0,30,8,{fmt:v=>Math.round(v)+'¢'}),P('vdepth','Vibrato',0,1,.35,{fmt:fmtPct}),P('vrate','Vib rate',3,8,5.5,{fmt:v=>v.toFixed(1)+'Hz'}),P('vdelay','Vib delay',0,1,.3,{fmt:fmtS}),P('bow','Bow noise',0,1,.25,{fmt:fmtPct}),P('nasal','Nasal',0,1,.3,{fmt:fmtPct}),P('slide','Slide in',0,2,0,{fmt:v=>v.toFixed(1)+' st'}),P('tone','Tone',800,12000,5000,{log:1,fmt:fmtHz}),P('attack','Attack',.01,2,.25,{log:1,fmt:fmtS}),P('release','Release',.05,4,.5,{fmt:fmtS})],
  brass:[P('det','Section',0,25,6,{fmt:v=>Math.round(v)+'¢'}),P('bright','Brassiness',.3,2,1,{fmt:fmtPct}),P('vdepth','Vibrato',0,1,.2,{fmt:fmtPct}),P('vrate','Vib rate',3,8,5,{fmt:v=>v.toFixed(1)+'Hz'}),P('attack','Attack',.01,.5,.06,{log:1,fmt:fmtS}),P('release','Release',.05,2,.25,{fmt:fmtS})],
  choirv:[P('vowel','Vowel',0,0,'aa',{opts:Object.keys(VOWELS)}),P('size','Voice size',.8,1.3,1,{fmt:v=>v.toFixed(2)+'×'}),P('det','Ensemble',0,30,12,{fmt:v=>Math.round(v)+'¢'}),P('vdepth','Vibrato',0,1,.3,{fmt:fmtPct}),P('breath','Breath',0,1,.25,{fmt:fmtPct}),P('attack','Attack',.02,3,.5,{log:1,fmt:fmtS}),P('release','Release',.1,5,1.2,{fmt:fmtS})],
  lead:[P('wave','Wave',0,0,'saw',{opts:['saw','square','tri','sine']}),P('det','Detune',0,40,8,{fmt:v=>Math.round(v)+'¢'}),P('cutoff','Cutoff',200,14000,3000,{log:1,fmt:fmtHz}),P('res','Reso',0,20,3,{fmt:v=>v.toFixed(1)}),P('env','Env',0,1,.4,{fmt:fmtPct}),P('decay','Decay',.05,2,.4,{fmt:fmtS}),P('glide','Glide',0,12,0,{fmt:v=>v.toFixed(1)+' st'}),P('vdepth','Vibrato',0,1,.2,{fmt:fmtPct}),P('drive','Drive',0,1,.2,{fmt:fmtPct}),P('attack','Attack',.002,1,.01,{log:1,fmt:fmtS}),P('sustain','Sustain',0,1,.8,{fmt:fmtPct}),P('release','Release',.02,2,.2,{fmt:fmtS})],
  kit:[P('tune','Tune',-12,12,0,{fmt:v=>(v>0?'+':'')+v.toFixed(1)+' st'}),P('decay','Decay',.4,2,1,{fmt:v=>v.toFixed(2)+'×'})],
};
const INSTS=[];
const INST={};
function addInst(name,cat,engine,p,oct,tags){ const id=slug(name); if(INST[id]) return; const base=Object.fromEntries((ESCHEMA[engine]||[]).map(s=>[s.k,s.def])); const I={id,name,cat,engine,p:{...base,...p},oct,kind:engine==='kit'?'drum':'mel',tags:tags||[]}; INSTS.push(I); INST[id]=I; }
Object.keys(KITS).forEach(k=>addInst(k,'Drums','kit',{kit:k},0,k.startsWith('Tabla')||k.startsWith('Latin')?['world']:[]));
const LEG={bass:['Bass',2],keys:['Keys',4],pad:['Pads',3],ghost:['Textures',3],sample:['Textures',4]};
Object.entries(LEG).forEach(([eng,[cat,oct]])=>Object.entries(PRESETS[eng]).forEach(([n,p])=>addInst(n,n==='Sitar Pluck'?'Plucked':cat,eng,p,oct,n.includes('Sitar')?['world']:[])));
[ ['Reese Bass',{wave:'saw',sub:.3,cutoff:900,res:2,env:.1,decay:1,drive:.6,release:.2}], ['Moog Bass',{wave:'square',sub:.4,cutoff:300,res:9,env:.6,decay:.25,drive:.3,release:.08}],
  ['Finger Bass',{wave:'saw',sub:.45,cutoff:520,res:1,env:.3,decay:.3,drive:.1,release:.1}], ['Sub Sine',{wave:'sine',sub:0,cutoff:400,res:0,env:0,decay:1,drive:.15,release:.15}],
  ['Wobble Bass',{wave:'saw',sub:.5,cutoff:220,res:12,env:.95,decay:.5,drive:.55,release:.1}] ].forEach(([n,p])=>addInst(n,'Bass','bass',p,2));
[ ['Clavinet',{ratio:3,fm:3,fmDecay:.15,saw:.3,cutoff:5000,attack:.001,decay:.5,sustain:.2,release:.1}], ['Toy Piano',{ratio:5.4,fm:1.5,fmDecay:.3,saw:0,cutoff:8000,attack:.001,decay:1,sustain:0,release:.3}],
  ['Wurly',{ratio:1,fm:3.5,fmDecay:.3,saw:0,cutoff:3000,attack:.003,decay:1.6,sustain:.3,release:.4}], ['DX Piano',{ratio:1,fm:3,fmDecay:.4,saw:0,cutoff:8000,attack:.002,decay:3,sustain:.1,release:.6}],
  ['Lofi Keys',{ratio:1,fm:1.2,fmDecay:.8,saw:0,cutoff:1800,attack:.004,decay:2.2,sustain:.25,release:.6}] ].forEach(([n,p])=>addInst(n,'Keys','keys',p,4));
[ ['Nylon Guitar',{bright:.45,decay:2.6,damp:.6,pick:.2,tone:5000,body:.5,release:.25},3], ['Steel Guitar',{bright:.75,decay:3.5,damp:.35,pick:.15,tone:9000,body:.35,release:.3},3],
  ['Clean Electric',{bright:.6,decay:4,damp:.5,pick:.25,tone:4500,body:0,release:.2,chorus:6},3], ['12-String',{bright:.8,decay:3.5,damp:.35,pick:.13,tone:10000,body:.3,chorus:12},3],
  ['Harp',{bright:.5,decay:4,damp:.55,pick:.35,tone:7000,body:.2,release:1.2,len:4},4], ['Koto',{bright:.8,decay:2.2,damp:.3,pick:.1,buzz:.15,tone:9000,body:.2},4,['world']],
  ['Sitar',{bright:.85,decay:3.5,damp:.25,pick:.08,buzz:.7,tone:10000,body:.3,chorus:4},3,['world']], ['Santoor',{bright:.95,decay:2.5,damp:.2,pick:.4,tone:12000,body:0,chorus:9},4,['world']],
  ['Oud',{bright:.55,decay:1.8,damp:.55,pick:.2,buzz:.1,tone:5000,body:.6},3,['world']], ['Banjo',{bright:.9,decay:1.2,damp:.4,pick:.08,tone:10000,body:.2},3],
  ['Ukulele',{bright:.55,decay:1.3,damp:.6,pick:.22,tone:6000,body:.5},4], ['Pizzicato Strings',{bright:.4,decay:.6,damp:.75,pick:.3,tone:4000,body:.5},3],
  ['Harpsichord',{bright:1,decay:2,damp:.2,pick:.05,tone:12000,body:.1,chorus:5},3], ['Veena',{bright:.7,decay:4,damp:.3,pick:.12,buzz:.45,tone:8000,body:.5},3,['world']],
  ['Shamisen',{bright:.9,decay:1,damp:.3,pick:.06,buzz:.35,tone:9000,body:.1},3,['world']], ['Muted Guitar',{bright:.5,decay:.35,damp:.7,pick:.2,tone:3500,body:.5,release:.05},3] ]
  .forEach(([n,p,o,tg])=>addInst(n,'Plucked','pluck',p,o,tg));
[ ['Wood Marimba','marimba',{},4], ['Vibraphone','vibes',{trem:.5,decay:1.2},4], ['Glockenspiel','glock',{},5], ['Xylophone','xylo',{},5], ['Kalimba','kalimba',{click:.2},4,['world']],
  ['Steel Pan','steelpan',{},4,['world']], ['Tubular Bells','tubular',{},4], ['Gamelan','gamelan',{},4,['world']], ['Celesta','celesta',{},5], ['Music Box','musicbox',{tone:12000},5],
  ['Singing Bowl','bowl',{click:.1,decay:1.4},3,['world']], ['Gong','gong',{click:.1,decay:1.3,tone:6000},2] ]
  .forEach(([n,m,p,o,tg])=>addInst(n,'Mallets','mallet',{modes:m,...p},o,tg));
[ ['Jazz Organ',{reg:'jazz',vib:.4,perc:.5}], ['Gospel Organ',{reg:'gospel',vib:.6,perc:.3}], ['Church Organ',{reg:'pipe',vib:0,perc:0,click:0,attack:.08,release:.6,tone:9000}],
  ['Flute Organ',{reg:'flute',vib:.3,perc:0}], ['Harmonium',{reg:'reed',vib:0,perc:0,click:.1,det:7,attack:.05,release:.2,tone:5000},['world']], ['Accordion',{reg:'reed',vib:0,perc:0,det:18,attack:.03,release:.12}],
  ['Combo Organ',{reg:'bright',vib:.2,perc:0,tone:9000}], ['Calliope',{reg:'flute',vib:.9,rotor:6.5,perc:0,click:.2}] ].forEach(([n,p,tg])=>addInst(n,'Organ','organ',p,3,tg));
[ ['Violin',{vdepth:.45,det:4,nasal:.3,tone:7000,attack:.18},4], ['Viola',{vdepth:.4,det:4,tone:5500,attack:.2},3], ['Cello',{vdepth:.4,det:4,tone:4000,attack:.22,nasal:.2},2],
  ['Contrabass',{vdepth:.25,det:4,tone:2500,attack:.25},2], ['String Ensemble',{vdepth:.25,det:14,tone:5000,attack:.35,release:.9},3],
  ['Erhu',{vdepth:.6,det:2,nasal:.7,slide:1.2,tone:6500,attack:.1},4,['world']], ['Sarangi',{vdepth:.5,det:6,nasal:.9,slide:.7,tone:6000,attack:.12,bow:.4},4,['world']],
  ['Tremolo Strings',{vdepth:.1,vrate:7.8,det:16,tone:6000,attack:.05},3] ].forEach(([n,p,o,tg])=>addInst(n,'Strings','strings',p,o,tg));
[ ['Flute',{wave:'tri',breath:.3,chiff:.3,vdepth:.3,tone:6000},5], ['Bansuri',{wave:'sine',breath:.55,chiff:.2,vdepth:.35,vdelay:.4,slide:.6,tone:5000},4,['world']],
  ['Pan Flute',{wave:'sine',breath:.6,chiff:.6,vdepth:.15,tone:5000},4], ['Shakuhachi',{wave:'sine',breath:.8,chiff:.5,vdepth:.25,slide:1,tone:4000},4,['world']],
  ['Ocarina',{wave:'sine',breath:.1,chiff:.1,vdepth:.2,tone:4000},5], ['Whistle',{wave:'sine',breath:.05,chiff:0,vdepth:.25,tone:8000},5],
  ['Recorder',{wave:'tri',breath:.2,chiff:.5,vdepth:.1,tone:5000},5], ['Clarinet',{wave:'square',breath:.15,chiff:.1,vdepth:.15,tone:2500},4],
  ['Oboe',{wave:'saw',breath:.1,vdepth:.25,formant:1400,fgain:10,tone:3200},4], ['Saxophone',{wave:'saw',breath:.25,vdepth:.3,slide:.3,formant:1100,fgain:8,tone:3500},3],
  ['Duduk',{wave:'saw',breath:.3,vdepth:.3,formant:700,fgain:9,tone:1800,attack:.12},3,['world']], ['Shehnai',{wave:'saw',breath:.15,vdepth:.35,slide:.6,formant:1600,fgain:14,tone:5000},4,['world']] ]
  .forEach(([n,p,o,tg])=>addInst(n,'Winds','wind',p,o,tg));
[ ['Trumpet',{bright:1.2,det:3,vdepth:.15},4], ['Trombone',{bright:.9,det:3,vdepth:.1,attack:.08},3], ['French Horn',{bright:.6,det:4,attack:.1,release:.4},3],
  ['Tuba',{bright:.5,det:2,attack:.09},2], ['Brass Section',{bright:1.1,det:14,vdepth:.1},3], ['Muted Trumpet',{bright:.45,det:2,vdepth:.2,attack:.03},4] ]
  .forEach(([n,p,o])=>addInst(n,'Brass','brass',p,o));
[ ['Choir Aah',{vowel:'aa'},3], ['Choir Ooh',{vowel:'oo'},3], ['Choir Mmm',{vowel:'mm',breath:.1},3], ['Boys Choir',{vowel:'oo',size:1.2,det:8},4],
  ['Monks',{vowel:'oo',size:.85,vdepth:.1,det:6},2], ['Ethereal Ah',{vowel:'aa',attack:1.6,det:22,breath:.5,release:3},4] ].forEach(([n,p,o])=>addInst(n,'Choir','choirv',p,o));
[ ['Saw Lead',{wave:'saw',det:8,cutoff:3500,res:3,env:.4},4], ['Square Lead',{wave:'square',det:4,cutoff:3000,res:2,env:.3},4], ['Supersaw',{wave:'saw',det:28,cutoff:6000,res:1,env:.2},4],
  ['Theremin',{wave:'sine',det:0,cutoff:8000,res:0,env:0,glide:3,vdepth:.6,attack:.15},4], ['Chiptune',{wave:'square',det:0,cutoff:14000,res:0,env:0,drive:0},4],
  ['Acid Lead',{wave:'saw',det:0,cutoff:600,res:15,env:.9,decay:.2,drive:.5},3], ['Soft Lead',{wave:'tri',det:6,cutoff:2500,res:1,env:.2,vdepth:.25},4],
  ['Sync Lead',{wave:'saw',det:12,cutoff:8000,res:6,env:.6,drive:.5},4] ].forEach(([n,p,o])=>addInst(n,'Leads','lead',p,o));
[ ['Saw Strings',{wave:'saw',voices:7,detune:10,cutoff:3500,lfo:.2,attack:.3,release:1.5,air:.1}], ['Air Pad',{wave:'tri',voices:5,detune:12,cutoff:6000,lfo:.4,attack:1.5,release:3,air:.8}],
  ['Shimmer Pad',{wave:'harm',voices:5,detune:9,cutoff:9000,lfo:.3,attack:1.2,release:4,air:.5}], ['Tanpura Drone',{wave:'harm',voices:2,detune:4,cutoff:2600,lfo:.2,attack:2.5,release:8,air:.15}],
  ['Dream Pad',{wave:'tri',voices:7,detune:20,cutoff:2200,lfo:.7,attack:2,release:5,air:.4}] ].forEach(([n,p])=>addInst(n,'Pads','pad',p,3,n.startsWith('Tanpura')?['world']:[]));
// instruments for the freetouse-style genres (rock, funk, phonk, chiptune, medieval, disco, classical)
[['Crunch Guitar','Plucked','pluck',{bright:.95,decay:2.2,damp:.25,pick:.12,buzz:.85,tone:5200,body:.5,chorus:6},3],
 ['Power Chords','Plucked','pluck',{bright:1,decay:3,damp:.2,pick:.1,buzz:1,tone:4200,body:.7,chorus:10},2],
 ['Clavinet','Keys','pluck',{bright:1,decay:.7,damp:.15,pick:.08,buzz:.35,tone:7000,body:.1,release:.05},4],
 ['Lute','Plucked','pluck',{bright:.55,decay:2.5,damp:.55,pick:.22,buzz:.1,tone:5000,body:.6},4,['world']],
 ['Phonk Cowbell','Mallets','mallet',{modes:'gamelan',decay:.45,bright:1.3,click:.8,tone:9000},5],
 ['Chip Square','Leads','lead',{wave:'square',det:0,cutoff:12000,res:0,env:0,decay:.1,vdepth:0,drive:0,attack:.002,sustain:.9,release:.03},5],
 ['Chip Bass','Bass','lead',{wave:'tri',det:0,cutoff:9000,res:0,env:0,decay:.1,vdepth:0,drive:0,attack:.002,sustain:1,release:.03},2],
 ['Chip Arp','Leads','lead',{wave:'square',det:3,cutoff:7000,res:2,env:.2,decay:.08,vdepth:0,drive:.1,attack:.002,sustain:.5,release:.04},5],
 ['Disco Strings','Strings','strings',{det:12,vdepth:.15,attack:.02,release:.2,tone:7000},4],
 ['Funk Bass','Bass','bass',{wave:'square',sub:.5,cutoff:900,res:6,env:.7,decay:.18,drive:.35,release:.05},2],
 ['Supersaw Chords','Pads','lead',{wave:'saw',det:28,cutoff:6000,res:2,env:.3,decay:.3,vdepth:0,drive:.25,attack:.01,sustain:.7,release:.25},4],
 ['Timpani Roll','Textures','mallet',{modes:'gong',decay:.6,bright:.6,click:.5,tone:2500},2],
].forEach(([n,cat,eng,p,o,tg])=>addInst(n,cat,eng,p,o,tg||[]));
['Glass Harmonica','Wind Chimes'].forEach((n,i)=>addInst(n,'Textures','ghost',i?{q:140,bands:8,spread:1.05,sweep:.6,depth:1,noise:1,attack:.05,release:4}:{q:90,bands:4,spread:1,sweep:.12,depth:.4,noise:.3,attack:.4,release:3},i?4:4));
const CATS=['All','Drums','Bass','Keys','Plucked','Mallets','Organ','Strings','Winds','Brass','Choir','Leads','Pads','Atmospheres','Textures','World'];
const instByName=n=>INST[slug(n)];

