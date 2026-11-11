/* KYMA · core/dsp — parameters, presets, synth voices, reverb, mastering, WAV and ZIP writers, built-in choir */
/* =========================================================
   LTRACKS, PARAMETERS, PRESETS
   ========================================================= */
const LTRACKS = [
  {id:'kick',  name:'Kick',      engine:'kick',  kind:'drum'},
  {id:'snare', name:'Snare',     engine:'snare', kind:'drum'},
  {id:'hat',   name:'Hats',      engine:'hat',   kind:'drum'},
  {id:'bass',  name:'Bass',      engine:'bass',  kind:'mel', oct:2, len:2},
  {id:'keys',  name:'Melody',    engine:'keys',  kind:'mel', oct:4, len:2},
  {id:'pad',   name:'Chords',    engine:'pad',   kind:'mel', oct:3, len:16},
  {id:'ghost', name:'Ghost',     engine:'ghost', kind:'mel', oct:3, len:16},
  {id:'sample',name:'Voice',     engine:'sample',kind:'mel', oct:4, len:8},
];
const LDEF = Object.fromEntries(LTRACKS.map(t=>[t.id,t]));

const ENGINES = {
  kick:[P('pitch','Pitch',30,90,48,{fmt:v=>Math.round(v)+'Hz'}),P('punch','Punch',1.2,8,4,{fmt:v=>v.toFixed(1)+'×'}),P('sweep','Sweep',.01,.2,.05,{fmt:fmtS}),P('decay','Decay',.1,1.6,.5,{fmt:fmtS}),P('click','Click',0,1,.3,{fmt:fmtPct}),P('drive','Drive',0,1,.3,{fmt:fmtPct}),P('tone','Tone',200,12000,4000,{log:1,fmt:fmtHz})],
  snare:[P('mode','Type',0,0,'snare',{opts:['snare','clap','rim','gated']}),P('tone','Tune',120,500,200,{fmt:v=>Math.round(v)+'Hz'}),P('snappy','Snap',0,1,.7,{fmt:fmtPct}),P('decay','Decay',.04,.8,.22,{fmt:fmtS}),P('color','Color',600,9000,3000,{log:1,fmt:fmtHz}),P('body','Body',0,1,.6,{fmt:fmtPct})],
  hat:[P('tone','Tone',2000,14000,8000,{log:1,fmt:fmtHz}),P('decay','Decay',.01,.6,.05,{log:1,fmt:fmtS}),P('metal','Metal',0,1,.4,{fmt:fmtPct}),P('open','Accent open',1,10,5,{fmt:v=>v.toFixed(1)+'×'})],
  bass:[P('wave','Wave',0,0,'saw',{opts:['saw','square','sine']}),P('sub','Sub',0,1,.4,{fmt:fmtPct}),P('cutoff','Cutoff',40,6000,600,{log:1,fmt:fmtHz}),P('res','Reso',0,20,2,{fmt:v=>v.toFixed(1)}),P('env','Env',0,1,.4,{fmt:fmtPct}),P('decay','Decay',.04,1.5,.35,{fmt:fmtS}),P('drive','Drive',0,1,.3,{fmt:fmtPct}),P('release','Release',.01,2,.12,{fmt:fmtS}),P('bend','Slide',0,12,0,{fmt:v=>Math.round(v)+' st'}),P('glide','Slide time',.01,.5,.08,{log:1,fmt:fmtS})],
  keys:[P('ratio','FM ratio',.5,8,1,{fmt:v=>v.toFixed(2)}),P('fm','FM depth',0,8,2,{fmt:v=>v.toFixed(1)}),P('fmDecay','FM decay',.03,3,.6,{log:1,fmt:fmtS}),P('saw','Saw layer',0,1,0,{fmt:fmtPct}),P('cutoff','Cutoff',200,14000,6000,{log:1,fmt:fmtHz}),P('attack','Attack',.001,2,.003,{log:1,fmt:fmtS}),P('decay','Decay',.05,4,1.5,{fmt:fmtS}),P('sustain','Sustain',0,1,.3,{fmt:fmtPct}),P('release','Release',.02,4,.5,{fmt:fmtS})],
  pad:[P('wave','Wave',0,0,'saw',{opts:['saw','tri','harm']}),P('voices','Voices',1,7,5,{step:1,fmt:v=>Math.round(v)+''}),P('detune','Detune',0,40,12,{fmt:v=>Math.round(v)+'¢'}),P('cutoff','Cutoff',100,12000,2200,{log:1,fmt:fmtHz}),P('lfo','Drift',0,1,.3,{fmt:fmtPct}),P('attack','Attack',.01,8,1.2,{log:1,fmt:fmtS}),P('release','Release',.1,10,2.5,{fmt:fmtS}),P('air','Air',0,1,.15,{fmt:fmtPct})],
  ghost:[P('q','Resonance',4,150,50,{log:1,fmt:v=>'Q'+Math.round(v)}),P('bands','Bands',2,8,6,{step:1,fmt:v=>Math.round(v)+''}),P('spread','Stretch',.97,1.06,1,{fmt:v=>(v>=1?'+':'')+((v-1)*100).toFixed(1)+'%'}),P('sweep','Sweep rate',.01,1,.07,{log:1,fmt:v=>v.toFixed(2)+'Hz'}),P('depth','Sweep depth',0,1,.85,{fmt:fmtPct}),P('noise','Breath',0,1,.6,{fmt:fmtPct}),P('attack','Attack',.02,8,2.5,{log:1,fmt:fmtS}),P('release','Release',.2,12,6,{fmt:fmtS})],
  sample:[P('mode','Mode',0,0,'cloud',{opts:['cloud','play']}),P('start','Start',0,1,.25,{fmt:fmtPct}),P('length','Length',.05,4,1.2,{log:1,fmt:fmtS}),P('grain','Grain',.03,.5,.16,{log:1,fmt:fmtS}),P('spray','Spray',0,1,.35,{fmt:fmtPct}),P('tone','Tone',300,16000,9000,{log:1,fmt:fmtHz}),P('attack','Attack',.003,6,.8,{log:1,fmt:fmtS}),P('release','Release',.05,8,2.5,{fmt:fmtS})],
};
const MIX = [P('vol','Volume',0,1.4,.8,{fmt:v=>v<=0.0001?'−∞':(20*Math.log10(v)).toFixed(1)+'dB'}),P('pan','Pan',-1,1,0,{fmt:v=>Math.abs(v)<.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100)}),P('space','Reverb',0,1,.2,{fmt:fmtPct}),P('echo','Echo',0,1,0,{fmt:fmtPct})];
const MASTER = [
  P('space','Space',0,1.5,.5,{fmt:fmtPct,tip:'Reverb return'}),P('size','Size',1,10,4,{fmt:v=>v.toFixed(1)+'s',tip:'Reverb decay time'}),P('echo','Repeats',0,1,.35,{fmt:fmtPct,tip:'Echo feedback'}),
  P('pump','Pump',0,1,0,{fmt:fmtPct,tip:'Kick ducks the music bus'}),P('glue','Glue',0,1,.3,{fmt:fmtPct,tip:'Bus compression'}),P('tape','Tape',0,1,.3,{fmt:fmtPct,tip:'Saturation and roll-off'}),
  P('width','Width',0,1.6,1,{fmt:fmtPct,tip:'Stereo width'}),P('tone','Tilt',-1,1,0,{fmt:v=>Math.abs(v)<.02?'flat':(v<0?'dark ':'bright ')+Math.round(Math.abs(v)*100)}),P('warble','Wobble',0,1,0,{fmt:fmtPct,tip:'Tape wow and flutter'}),P('out','Output',0,1.2,.85,{fmt:v=>v<=0.0001?'−∞':(20*Math.log10(v)).toFixed(1)+'dB'})
];

const PRESETS = {
  kick:{
    'Tight House':{pitch:52,punch:5,sweep:.035,decay:.38,click:.55,drive:.35,tone:7000},
    'Sub 808':{pitch:42,punch:3,sweep:.06,decay:1.2,click:.15,drive:.25,tone:2500},
    'Dusty Boom':{pitch:47,punch:3.5,sweep:.05,decay:.55,click:.3,drive:.5,tone:1500},
    'Techno Thud':{pitch:50,punch:6,sweep:.03,decay:.6,click:.7,drive:.65,tone:5000},
    'Felt':{pitch:44,punch:2,sweep:.08,decay:.45,click:0,drive:0,tone:500},
    'Synthwave Linn':{pitch:56,punch:4.5,sweep:.035,decay:.42,click:.5,drive:.45,tone:6000},
    'Vapor Thump':{pitch:46,punch:2.5,sweep:.06,decay:.55,click:.1,drive:.2,tone:900},
    'Trap Kick':{pitch:52,punch:5,sweep:.03,decay:.32,click:.65,drive:.5,tone:8000}},
  snare:{
    'Crisp Snare':{mode:'snare',tone:210,snappy:.75,decay:.2,color:4000,body:.6},
    'Big Clap':{mode:'clap',tone:200,snappy:1,decay:.28,color:1400,body:0},
    'Lo-fi Snare':{mode:'snare',tone:180,snappy:.55,decay:.17,color:1800,body:.75},
    'Rimshot':{mode:'rim',tone:420,snappy:.3,decay:.06,color:2500,body:.8},
    'Brush':{mode:'snare',tone:160,snappy:.9,decay:.38,color:5500,body:.15},
    'Gated Snare':{mode:'gated',tone:190,snappy:.9,decay:.32,color:2600,body:.7},
    'Vapor Snare':{mode:'snare',tone:170,snappy:.6,decay:.3,color:1500,body:.5},
    'Trap Clap':{mode:'clap',tone:200,snappy:1,decay:.2,color:1900,body:0}},
  hat:{
    'Closed Tick':{tone:8500,decay:.045,metal:.45,open:5},
    'Shaker':{tone:6000,decay:.08,metal:0,open:2.5},
    'Metal 808':{tone:7000,decay:.06,metal:.95,open:6},
    'Dust':{tone:4500,decay:.035,metal:.15,open:3},
    'Synthwave Hats':{tone:7500,decay:.06,metal:.3,open:4},
    'Trap Hats':{tone:9500,decay:.035,metal:.6,open:4}},
  bass:{
    'Round Sub':{wave:'sine',sub:.6,cutoff:500,res:1,env:.15,decay:.4,drive:.25,release:.12},
    'Warm Saw':{wave:'saw',sub:.5,cutoff:650,res:3,env:.4,decay:.45,drive:.3,release:.15},
    'Pluck Bass':{wave:'saw',sub:.45,cutoff:350,res:5,env:.75,decay:.16,drive:.35,release:.08},
    'Acid-ish':{wave:'saw',sub:.2,cutoff:280,res:15,env:.85,decay:.2,drive:.5,release:.05},
    'Drone Bass':{wave:'square',sub:.7,cutoff:230,res:2,env:.08,decay:1.2,drive:.3,release:1.6},
    'Synthwave Pulse':{wave:'saw',sub:.35,cutoff:850,res:6,env:.55,decay:.18,drive:.35,release:.06},
    'Vapor Bass':{wave:'square',sub:.6,cutoff:420,res:2,env:.2,decay:.6,drive:.15,release:.3},
    '808 Boom':{wave:'sine',sub:.25,cutoff:900,res:.5,env:0,decay:1.4,drive:.6,release:.25},
    '808 Slide':{wave:'sine',sub:.25,cutoff:900,res:.5,env:0,decay:1.4,drive:.6,release:.25,bend:7,glide:.09}},
  keys:{
    'Tine Piano':{ratio:1,fm:2.2,fmDecay:.6,saw:0,cutoff:5000,attack:.003,decay:2,sustain:.25,release:.5},
    'Glass Bell':{ratio:3.5,fm:3,fmDecay:1.4,saw:0,cutoff:9000,attack:.002,decay:3,sustain:0,release:2.5},
    'Soft Pluck':{ratio:2,fm:1.2,fmDecay:.15,saw:.55,cutoff:2600,attack:.002,decay:.4,sustain:0,release:.3},
    'Marimba':{ratio:4,fm:2.5,fmDecay:.07,saw:0,cutoff:5000,attack:.001,decay:.6,sustain:0,release:.4},
    'Hollow Lead':{ratio:1,fm:.6,fmDecay:2,saw:.8,cutoff:3000,attack:.02,decay:1,sustain:.7,release:.3},
    'Arp Pluck':{ratio:2,fm:1.8,fmDecay:.12,saw:.7,cutoff:4200,attack:.002,decay:.28,sustain:0,release:.22},
    'Synth Brass':{ratio:1,fm:.3,fmDecay:.5,saw:1,cutoff:2200,attack:.04,decay:.8,sustain:.7,release:.4},
    'Vapor EP':{ratio:1,fm:1.6,fmDecay:.9,saw:0,cutoff:3200,attack:.004,decay:2.5,sustain:.3,release:.8},
    'Dark Bell':{ratio:2.76,fm:2.2,fmDecay:.5,saw:0,cutoff:4000,attack:.002,decay:1.2,sustain:0,release:1},
    'Sitar Pluck':{ratio:1.5,fm:4,fmDecay:.25,saw:.35,cutoff:6500,attack:.002,decay:1.2,sustain:.1,release:.6},
    'House Organ':{ratio:.5,fm:1,fmDecay:3,saw:.3,cutoff:3000,attack:.005,decay:.3,sustain:.8,release:.1}},
  pad:{
    'Warm Strings':{wave:'saw',voices:5,detune:14,cutoff:2000,lfo:.3,attack:1.2,release:2.5,air:.1},
    'Vhikk Drone':{wave:'harm',voices:3,detune:6,cutoff:1500,lfo:.5,attack:4,release:6,air:.25},
    'Glass Choir':{wave:'tri',voices:5,detune:10,cutoff:5000,lfo:.4,attack:1.5,release:3.5,air:.4},
    'Dark Matter':{wave:'saw',voices:7,detune:24,cutoff:550,lfo:.6,attack:2.5,release:7,air:.3},
    'Juno Pad':{wave:'saw',voices:5,detune:18,cutoff:2600,lfo:.4,attack:.5,release:1.8,air:.15},
    'Vapor Haze':{wave:'tri',voices:5,detune:22,cutoff:1400,lfo:.7,attack:1.5,release:4,air:.3},
    'Trap Choir':{wave:'tri',voices:5,detune:8,cutoff:3000,lfo:.3,attack:.6,release:2,air:.5}},
  ghost:{
    'SMR Arcs':{q:60,bands:6,spread:1,sweep:.07,depth:.9,noise:.55,attack:3,release:6},
    'Bowed Metal':{q:110,bands:7,spread:1.025,sweep:.18,depth:.7,noise:.8,attack:1.2,release:4},
    'Breath Organ':{q:22,bands:5,spread:1,sweep:.03,depth:.4,noise:.85,attack:2,release:3.5},
    'Rain Glass':{q:140,bands:8,spread:1.045,sweep:.5,depth:1,noise:1,attack:.3,release:5}},
  sample:{
    'Ghost Choir Cloud':{mode:'cloud',start:.3,length:1.2,grain:.18,spray:.45,tone:6000,attack:2,release:4},
    'Choir Hit':{mode:'play',start:.1,length:.9,grain:.16,spray:.3,tone:9000,attack:.01,release:.4},
    'Frozen':{mode:'cloud',start:.5,length:1,grain:.35,spray:.12,tone:4000,attack:3,release:6},
    'Stutter':{mode:'cloud',start:.2,length:1,grain:.05,spray:.8,tone:12000,attack:.005,release:.3},
    'Mall Choir':{mode:'cloud',start:.2,length:1,grain:.25,spray:.25,tone:3500,attack:.8,release:3}},
};
function presetParams(engine,name){
  const base = Object.fromEntries(ENGINES[engine].map(p=>[p.k,p.def]));
  return {...base, ...(PRESETS[engine][name]||{})};
}

/* =========================================================
   PROJECT STATE
   ========================================================= */
const emptyScene = () => ({notes:Object.fromEntries(LTRACKS.map(t=>[t.id,[]])), prog:null});
function legacyProject(){
  return {v:1, vibe:null, name:'Untitled', desc:'', bpm:100, swing:0, root:0, scale:'Minor', bars:2, cur:0, mode:'loop', chain:[0],
    master:Object.fromEntries(MASTER.map(p=>[p.k,p.def])),
    tracks:Object.fromEntries(LTRACKS.map(t=>{const pn=Object.keys(PRESETS[t.engine])[0];return [t.id,{preset:pn,p:presetParams(t.engine,pn),vol:.8,pan:0,space:.2,echo:0,mute:false,solo:false}]})),
    scenes:[0,1,2,3].map(emptyScene)};
}

const SAMPLE = {buffer:null, baseMidi:60, follow:false, name:'', peaks:null};

function resources(ctx){
  if(ctx.__R) return ctx.__R;
  const sr = ctx.sampleRate, len = Math.floor(sr*4);
  const white = ctx.createBuffer(1,len,sr), w = white.getChannelData(0);
  for(let i=0;i<len;i++) w[i]=Math.random()*2-1;
  const pink = ctx.createBuffer(1,len,sr), pk = pink.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for(let i=0;i<len;i++){const x=Math.random()*2-1;b0=.99886*b0+x*.0555179;b1=.99332*b1+x*.0750759;b2=.969*b2+x*.153852;b3=.8665*b3+x*.3104856;b4=.55*b4+x*.5329522;b5=-.7616*b5-x*.016898;pk[i]=(b0+b1+b2+b3+b4+b5+b6+x*.5362)*.11;b6=x*.115926;}
  const H=40, re=new Float32Array(H), im=new Float32Array(H);
  for(let n=1;n<H;n++) im[n] = Math.pow(n,-1.15) * (n%2?1:.55) * (n>12?.6:1);
  const harm = ctx.createPeriodicWave(re,im);
  ctx.__R = {white,pink,harm,phase:{},curves:{}};
  return ctx.__R;
}
function phaseWave(ctx,R,phi){
  const key = phi.toFixed(3);
  if(!R.phase[key]){ const re=new Float32Array([0,Math.sin(phi)]), im=new Float32Array([0,Math.cos(phi)]); R.phase[key]=ctx.createPeriodicWave(re,im,{disableNormalization:true}); }
  return R.phase[key];
}
function driveCurve(R,amt){
  const key = Math.round(amt*20);
  if(!R.curves[key]){ const a=key/20, n=2048, c=new Float32Array(n), k=3, tk=Math.tanh(k);
    for(let i=0;i<n;i++){const x=i/(n-1)*2-1; c[i]=(1-a)*x + a*Math.tanh(k*x)/tk;} R.curves[key]=c; }
  return R.curves[key];
}
const bq = (ctx,type,f,q) => {const b=ctx.createBiquadFilter(); b.type=type; b.frequency.value=f; if(q!=null) b.Q.value=q; return b;};
const gainN = (ctx,v) => {const g=ctx.createGain(); g.gain.value=v; return g;};
function noiseSrc(ctx,buf,t,dur){ const s=ctx.createBufferSource(); s.buffer=buf; s.loop=true; s.start(t, Math.random()*(buf.duration-.5)); s.stop(t+dur); return s; }
function envAR(g,t,peak,a,dur,r){
  const off = t+Math.max(dur,a);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+a);
  if(off>t+a+1e-4) g.gain.setValueAtTime(peak,off);
  g.gain.setTargetAtTime(0,off,Math.max(.005,r/4));
  return off + r*1.4 + .05;
}
function envADSR(g,t,peak,a,d,s,dur,r){
  const off = t+Math.max(dur,a+.001);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+a);
  g.gain.setTargetAtTime(peak*s,t+a,Math.max(.005,d/3));
  g.gain.setTargetAtTime(0,off,Math.max(.005,r/4));
  return off + r*1.4 + .05;
}

/* =========================================================
   VOICES  (ctx, out, params, time, velocity, duration, midi, resources)
   ========================================================= */
const VOICES = {
  kick(ctx,out,p,t,vel,dur,midi,R){
    const o=ctx.createOscillator(), g=ctx.createGain(), sh=ctx.createWaveShaper(), lp=bq(ctx,'lowpass',p.tone,.5);
    const f=p.pitch;
    o.frequency.setValueAtTime(f*p.punch,t);
    o.frequency.exponentialRampToValueAtTime(f,t+p.sweep);
    o.frequency.exponentialRampToValueAtTime(f*.82,t+p.sweep+p.decay);
    const amp = vel*.95/(1+p.drive*.9);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(amp,t+.0025);
    g.gain.setTargetAtTime(0,t+.0025+p.decay*.12,p.decay/3.2);
    sh.curve=driveCurve(R,p.drive);
    o.connect(g).connect(sh).connect(lp).connect(out);
    const end=t+p.decay*1.9+.06; o.start(t); o.stop(end);
    if(p.click>0.01){
      const n=noiseSrc(ctx,R.white,t,.02), hp=bq(ctx,'highpass',1800,.7), ng=ctx.createGain();
      ng.gain.setValueAtTime(p.click*vel*.6,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.012);
      n.connect(hp).connect(ng).connect(sh);
    }
  },
  snare(ctx,out,p,t,vel,dur,midi,R){
    const amp=.55*vel;
    if(p.mode==='clap'){
      const n=noiseSrc(ctx,R.white,t,p.decay+.2), hp=bq(ctx,'highpass',700,.7), bp=bq(ctx,'bandpass',p.color,1.1), g=ctx.createGain();
      g.gain.setValueAtTime(0,t);
      [.0005,.0115,.0235].forEach(o=>{g.gain.setValueAtTime(amp*3,t+o); g.gain.setTargetAtTime(.0001,t+o+.0005,.0035);});
      g.gain.setValueAtTime(amp*3,t+.034); g.gain.setTargetAtTime(0,t+.035,p.decay/4);
      n.connect(hp).connect(bp).connect(g).connect(out);
    } else if(p.mode==='gated'){
      const o=ctx.createOscillator(), og=ctx.createGain();
      o.type='triangle'; o.frequency.setValueAtTime(p.tone*1.6,t); o.frequency.exponentialRampToValueAtTime(p.tone,t+.04);
      og.gain.setValueAtTime(amp*p.body*1.2,t); og.gain.setTargetAtTime(0,t+.002,.05);
      o.connect(og).connect(out); o.start(t); o.stop(t+.4);
      const n=noiseSrc(ctx,R.white,t,p.decay+.1), hp=bq(ctx,'highpass',500,.7), pk=bq(ctx,'peaking',p.color,.8); pk.gain.value=5;
      const ng=ctx.createGain(); ng.gain.setValueAtTime(0,t); ng.gain.linearRampToValueAtTime(amp*p.snappy*.42,t+.003);
      ng.gain.linearRampToValueAtTime(amp*p.snappy*.26,t+p.decay); ng.gain.linearRampToValueAtTime(0,t+p.decay+.014);
      n.connect(hp).connect(pk).connect(ng).connect(out);
    } else if(p.mode==='rim'){
      const o=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), bp=bq(ctx,'bandpass',p.color,2);
      o.type='triangle'; o.frequency.value=p.tone*2; o2.type='square'; o2.frequency.value=p.tone*5.1;
      g.gain.setValueAtTime(amp*1.3,t); g.gain.setTargetAtTime(0,t+.001,Math.max(.006,p.decay/3));
      o.connect(g); o2.connect(bp).connect(g); g.connect(out);
      o.start(t); o2.start(t); o.stop(t+p.decay*2+.05); o2.stop(t+p.decay*2+.05);
      const n=noiseSrc(ctx,R.white,t,.03), nh=bq(ctx,'highpass',3000,.7), ng=ctx.createGain();
      ng.gain.setValueAtTime(amp*p.snappy,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.02); n.connect(nh).connect(ng).connect(out);
    } else {
      const o=ctx.createOscillator(), og=ctx.createGain();
      o.type='triangle'; o.frequency.setValueAtTime(p.tone*1.6,t); o.frequency.exponentialRampToValueAtTime(p.tone,t+.04);
      og.gain.setValueAtTime(amp*p.body*1.2,t); og.gain.setTargetAtTime(0,t+.002,.03+.05*p.body);
      o.connect(og).connect(out); o.start(t); o.stop(t+.4);
      const n=noiseSrc(ctx,R.white,t,p.decay*2+.1), hp=bq(ctx,'highpass',900,.7), pk=bq(ctx,'peaking',p.color,1); pk.gain.value=6;
      const ng=ctx.createGain(); ng.gain.setValueAtTime(amp*p.snappy,t); ng.gain.setTargetAtTime(0,t+.002,p.decay/3.5);
      n.connect(hp).connect(pk).connect(ng).connect(out);
    }
  },
  hat(ctx,out,p,t,vel,dur,midi,R){
    const dec = p.decay*(vel>.95?p.open:1), amp=.38*Math.min(vel,.9);
    const hp=bq(ctx,'highpass',p.tone,.8), g=ctx.createGain();
    g.gain.setValueAtTime(amp,t); g.gain.setTargetAtTime(0,t+.001,dec/3);
    hp.connect(g).connect(out);
    const end=t+dec*2.2+.03;
    if(p.metal<.98){ const n=noiseSrc(ctx,R.white,t,end-t), ng=gainN(ctx,1-p.metal*.8); n.connect(ng).connect(hp); }
    if(p.metal>.02){
      const bp=bq(ctx,'bandpass',10000,.8), mg=gainN(ctx,p.metal*.8), m=p.tone/7000;
      [205.3,304.4,369.6,522.7,540,800].forEach(f=>{const o=ctx.createOscillator(); o.type='square'; o.frequency.value=f*m*1.6; o.connect(mg); o.start(t); o.stop(end);});
      mg.connect(bp).connect(hp);
    }
  },
  bass(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), amp=.42*vel;
    const wave = {saw:'sawtooth',square:'square',sine:'sine'}[p.wave]||'sawtooth';
    const o1=ctx.createOscillator(); o1.type=wave; o1.frequency.value=f;
    const lp=bq(ctx,'lowpass',p.cutoff,p.res);
    const top=Math.min(16000,p.cutoff*(1+p.env*12));
    lp.frequency.setValueAtTime(top,t); lp.frequency.setTargetAtTime(p.cutoff,t+.003,Math.max(.01,p.decay/3));
    const sh=ctx.createWaveShaper(); sh.curve=driveCurve(R,p.drive);
    const g=ctx.createGain();
    o1.connect(lp);
    let o3=null;
    if(p.wave!=='sine'){ o3=ctx.createOscillator(); o3.type=wave; o3.frequency.value=f; o3.detune.value=7; const g3=gainN(ctx,.5); o3.connect(g3).connect(lp); }
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=f/2; const g2=gainN(ctx,p.sub*.9);
    lp.connect(sh).connect(g); o2.connect(g2).connect(g); g.connect(out);
    const end=envADSR(g,t,amp/(1+p.drive*.6),.004,p.decay,.72,dur,p.release);
    if(p.bend>0){ const k=Math.pow(2,p.bend/12), gl=Math.max(.01,p.glide||.08);
      [o1,o3].forEach(o=>{ if(o){ o.frequency.setValueAtTime(f*k,t); o.frequency.exponentialRampToValueAtTime(f,t+gl);} });
      o2.frequency.setValueAtTime(f*k/2,t); o2.frequency.exponentialRampToValueAtTime(f/2,t+gl); }
    [o1,o2,o3].forEach(o=>{if(o){o.start(t);o.stop(end);}});
  },
  keys(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), amp=.2*vel;
    const car=ctx.createOscillator(), mod=ctx.createOscillator(), mg=ctx.createGain();
    car.frequency.value=f; mod.frequency.value=f*p.ratio;
    mg.gain.setValueAtTime(p.fm*f,t); mg.gain.setTargetAtTime(p.fm*f*.08,t,Math.max(.01,p.fmDecay/3));
    mod.connect(mg).connect(car.frequency);
    const lp=bq(ctx,'lowpass',p.cutoff,.7);
    lp.frequency.setValueAtTime(Math.min(18000,p.cutoff*1.7),t); lp.frequency.setTargetAtTime(p.cutoff,t,Math.max(.02,p.decay/2));
    car.connect(lp);
    const oscs=[car,mod];
    if(p.saw>.01){ const sg=gainN(ctx,p.saw*.32); [-7,7].forEach(d=>{const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=d; o.connect(sg); oscs.push(o);}); sg.connect(lp); }
    const g=ctx.createGain(); lp.connect(g).connect(out);
    const end=envADSR(g,t,amp,p.attack,p.decay,p.sustain,dur,p.release);
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  pad(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), N=Math.round(p.voices), amp=.15*vel/Math.sqrt(N);
    const sum=ctx.createGain(), lp=bq(ctx,'lowpass',p.cutoff,.6), g=ctx.createGain();
    const oscs=[];
    for(let i=0;i<N;i++){
      const o=ctx.createOscillator();
      if(p.wave==='harm') o.setPeriodicWave(R.harm); else o.type = p.wave==='tri'?'triangle':'sawtooth';
      const spread = N>1 ? (i/(N-1))*2-1 : 0;
      o.frequency.value=f; o.detune.value = spread*p.detune + (Math.random()-.5)*3;
      const pn=ctx.createStereoPanner(); pn.pan.value=spread*.75;
      o.connect(pn).connect(sum); oscs.push(o);
    }
    const lfo=ctx.createOscillator(), lg=gainN(ctx,p.cutoff*p.lfo*.55); lfo.frequency.value=.06+Math.random()*.12;
    lfo.connect(lg).connect(lp.frequency); oscs.push(lfo);
    sum.connect(lp).connect(g); g.connect(out);
    const end=envAR(g,t,amp,p.attack,dur,p.release);
    if(p.air>.01){ const n=noiseSrc(ctx,R.pink,t,end-t), bp=bq(ctx,'bandpass',Math.min(f*6,9000),1.4), ag=gainN(ctx,p.air*.9); n.connect(bp).connect(ag).connect(g); }
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  ghost(ctx,out,p,t,vel,dur,midi,R){
    const f=mtof(midi), B=Math.round(p.bands), nyq=ctx.sampleRate*.45;
    const exc=ctx.createGain(), env=ctx.createGain();
    const lvl = vel*(.3+Math.sqrt(p.q)*.1);
    const end=envAR(env,t,lvl,p.attack,dur,p.release);
    const n=noiseSrc(ctx,R.pink,t,end-t), ng=gainN(ctx,p.noise*2.2); n.connect(ng).connect(exc);
    const saw=ctx.createOscillator(); saw.type='sawtooth'; saw.frequency.value=f; const sg=gainN(ctx,(1-p.noise)*.22); saw.connect(sg).connect(exc);
    const oscs=[saw];
    // odd bands lean left, even bands lean right (SMR-style split)
    const sideL=gainN(ctx,1), sideR=gainN(ctx,1), mrg=ctx.createChannelMerger(2), cross=ctx.createChannelMerger(2), cg=gainN(ctx,.35);
    sideL.channelCount=sideR.channelCount=1; sideL.channelCountMode=sideR.channelCountMode='explicit';
    mrg.connect(env); cross.connect(cg);
    const swap=ctx.createChannelSplitter(2), sw=ctx.createChannelMerger(2); cg.connect(swap); swap.connect(sw,0,1); swap.connect(sw,1,0); sw.connect(env);
    for(let k=1;k<=B;k++){
      const fk=f*k*Math.pow(p.spread,k-1); if(fk>Math.min(nyq,14000)) break;
      const bp=bq(ctx,'bandpass',fk,p.q), bg=gainN(ctx,Math.pow(k,-.25));
      exc.connect(bp).connect(bg).connect(k%2?sideL:sideR);
    }
    sideL.connect(mrg,0,0); sideR.connect(mrg,0,1); sideL.connect(cross,0,0); sideR.connect(cross,0,1);
    env.connect(out);
    oscs.forEach(o=>{o.start(t);o.stop(end);});
  },
  sample(ctx,out,p,t,vel,dur,midi,R){
    const buf=SAMPLE.buffer; if(!buf) return;
    const base = SAMPLE.follow ? 60+S.root : SAMPLE.baseMidi;
    const rate=Math.pow(2,(midi-base)/12), L=buf.duration, st=clamp(p.start,0,.999)*L, amp=.5*vel;
    const lp=bq(ctx,'lowpass',p.tone,.6); lp.connect(out);
    if(p.mode==='play'){
      const s=ctx.createBufferSource(); s.buffer=buf; s.playbackRate.value=rate;
      const len=Math.min(p.length,(L-st)/rate), g=ctx.createGain();
      const end=envAR(g,t,amp,Math.min(p.attack,len*.5),Math.min(dur,len),p.release);
      s.connect(g).connect(lp); s.start(t,st); s.stop(Math.min(end,t+len+.01));
    } else {
      const a=p.attack, off=Math.max(dur,a), total=off+p.release*1.4, step=p.grain/3, count=Math.min(600,Math.ceil(total/step));
      const gl=p.grain, pans=[-.8,0,.8].map(v=>{const pn=ctx.createStereoPanner(); pn.pan.value=v*p.spray; pn.connect(lp); return pn;});
      for(let i=0;i<count;i++){
        const rel=i*step, gt=t+rel;
        let e = rel<a ? rel/a : (rel<off ? 1 : Math.exp(-(rel-off)/(p.release/4)));
        if(e<.003) continue;
        let pos = st + (Math.random()*2-1)*p.spray*1.2 + rel*.04;
        pos = clamp(pos,0,Math.max(0,L-gl*rate-.01));
        const s=ctx.createBufferSource(); s.buffer=buf; s.playbackRate.value=rate*(1+(Math.random()-.5)*.012*p.spray);
        const g=ctx.createGain();
        g.gain.setValueAtTime(0,gt); g.gain.linearRampToValueAtTime(amp*e*.55,gt+gl/2); g.gain.linearRampToValueAtTime(0,gt+gl);
        s.connect(g).connect(pans[i%3]); s.start(gt,pos); s.stop(gt+gl+.01);
      }
    }
  }
};


const IR_CACHE = {};
function makeIR(ctx,sec){
  const key=ctx.sampleRate+':'+sec.toFixed(1);
  if(IR_CACHE[key]) return IR_CACHE[key];
  const sr=ctx.sampleRate, len=Math.floor(sr*sec), buf=ctx.createBuffer(2,len,sr);
  for(let ch=0;ch<2;ch++){
    const d=buf.getChannelData(ch); let y=0;
    for(let i=0;i<len;i++){
      const tt=i/len, x=Math.random()*2-1;
      const a=.92-.8*tt;               // progressively darker tail
      y+=a*(x-y);
      const env=Math.exp(-6.9*tt) * Math.min(1,i/(sr*.006));
      d[i]=y*env;
    }
  }
  let e=0; for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch); for(let i=0;i<len;i++) e+=d[i]*d[i];}
  const k=1/Math.sqrt(e/2)*.55; for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch); for(let i=0;i<len;i++) d[i]*=k;}
  IR_CACHE[key]=buf; return buf;
}
function tapeCurve(amt){
  const n=4096, c=new Float32Array(n), k=1.6;
  for(let i=0;i<n;i++){const s=(i/(n-1)*2-1)*4; c[i]=(1-amt)*s + amt*Math.tanh(k*s)/k;}
  return c;
}

function kWeight(x){ // BS.1770 K-weighting @48k
  const y=new Float32Array(x.length);
  let x1=0,x2=0,y1=0,y2=0;
  const b0=1.53512485958697,b1=-2.69169618940638,b2=1.19839281085285,a1=-1.69065929318241,a2=.73248077421585;
  for(let i=0;i<x.length;i++){const v=b0*x[i]+b1*x1+b2*x2-a1*y1-a2*y2; x2=x1;x1=x[i];y2=y1;y1=v;y[i]=v;}
  x1=x2=y1=y2=0; const c1=-1.99004745483398,c2=.99007225036621;
  for(let i=0;i<y.length;i++){const xv=y[i], v=xv-2*x1+x2-c1*y1-c2*y2; x2=x1;x1=xv;y2=y1;y1=v;y[i]=v;}
  return y;
}
function measureLUFS(L,R,sr){
  const kl=kWeight(L), kr=kWeight(R), blk=Math.floor(sr*.4), hop=Math.floor(sr*.1), z=[];
  for(let s=0;s+blk<=kl.length;s+=hop){ let a=0,b=0; for(let i=s;i<s+blk;i++){a+=kl[i]*kl[i];b+=kr[i]*kr[i];} z.push((a+b)/blk); }
  const lk=v=>-0.691+10*Math.log10(v+1e-20);
  let g1=z.filter(v=>lk(v)>-70); if(!g1.length) return -70;
  const rel=lk(g1.reduce((a,b)=>a+b,0)/g1.length)-10;
  const g2=g1.filter(v=>lk(v)>rel);
  return lk(g2.reduce((a,b)=>a+b,0)/g2.length);
}
function limitBuffers(L,R,sr,ceil){
  const n=L.length, W=Math.max(8,Math.round(sr*.004)), need=new Float32Array(n);
  for(let i=0;i<n;i++){
    let pk=Math.max(Math.abs(L[i]),Math.abs(R[i]));
    if(i>0){ const mL=Math.abs((L[i]+L[i-1])*.5625-(i>1?L[i-2]:0)*.0625-(i<n-1?L[i+1]:0)*.0625), mR=Math.abs((R[i]+R[i-1])*.5625-(i>1?R[i-2]:0)*.0625-(i<n-1?R[i+1]:0)*.0625); pk=Math.max(pk,mL,mR); }
    need[i]=pk>ceil?ceil/pk:1;
  }
  // forward-looking sliding minimum over W samples
  const mn=new Float32Array(n), dq=new Int32Array(n); let h=0,tl=0;
  for(let i=n-1;i>=0;i--){ while(tl>h && need[dq[tl-1]]>=need[i]) tl--; dq[tl++]=i; while(dq[h]>i+W) h++; mn[i]=need[dq[h]]; }
  // box smoothing then release
  let acc=0; const sm=new Float32Array(n);
  for(let i=0;i<n;i++){ acc+=mn[i]; if(i>=W) acc-=mn[i-W]; sm[i]=i>=W?acc/W:Math.min(acc/(i+1),mn[i]); }
  const rc=1-Math.exp(-1/(sr*.12)); let g=1, maxGR=1;
  for(let i=0;i<n;i++){ const tgt=sm[i]; g = tgt<g ? tgt : g+(tgt-g)*rc; if(g>tgt) g=tgt; L[i]*=g; R[i]*=g; if(g<maxGR) maxGR=g; }
  return maxGR;
}
function masterBuffer(buf,target){
  const sr=buf.sampleRate, L=buf.getChannelData(0), R=buf.getChannelData(1), ceil=Math.pow(10,-1/20);
  let lufs=measureLUFS(L,R,sr), gr=1;
  for(let pass=0;pass<3;pass++){
    const g=Math.pow(10,clamp(target-lufs,-30,30)/20);
    if(Math.abs(target-lufs)<.15 && pass>0) break;
    for(let i=0;i<L.length;i++){L[i]*=g;R[i]*=g;}
    gr=Math.min(gr,limitBuffers(L,R,sr,ceil));
    lufs=measureLUFS(L,R,sr);
  }
  const fi=Math.floor(sr*.003); for(let i=0;i<fi;i++){const k=i/fi;L[i]*=k;R[i]*=k;}
  const fo=Math.floor(sr*.25); for(let i=0;i<fo;i++){const k=i/fo,j=L.length-1-i;L[j]*=k;R[j]*=k;}
  let peak=0; for(let i=0;i<L.length;i++) peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));
  return {lufs,peak:20*Math.log10(peak+1e-12),gr:20*Math.log10(gr)};
}
function trimTail(buf,thresh=Math.pow(10,-80/20)){
  const L=buf.getChannelData(0),R=buf.getChannelData(1); let n=L.length-1;
  while(n>0 && Math.abs(L[n])<thresh && Math.abs(R[n])<thresh) n--;
  const len=Math.min(L.length,n+Math.floor(buf.sampleRate*.3));
  if(len>=L.length-10) return buf;
  const out=new AudioBuffer({length:len,numberOfChannels:2,sampleRate:buf.sampleRate});
  out.copyToChannel(L.subarray(0,len),0); out.copyToChannel(R.subarray(0,len),1); return out;
}
function encodeWav(buf,bits=24){
  const ch=buf.numberOfChannels, n=buf.length, sr=buf.sampleRate, bps=bits/8, data=n*ch*bps;
  const float=bits===32, hdr=float?58:44, ab=new ArrayBuffer(hdr+data), dv=new DataView(ab); let o=0;
  const str=s=>{for(let i=0;i<s.length;i++) dv.setUint8(o++,s.charCodeAt(i));}, u32=v=>{dv.setUint32(o,v,true);o+=4;}, u16=v=>{dv.setUint16(o,v,true);o+=2;};
  str('RIFF');u32(hdr-8+data);str('WAVE');str('fmt ');u32(float?18:16);u16(float?3:1);u16(ch);u32(sr);u32(sr*ch*bps);u16(ch*bps);u16(bits);
  if(float){u16(0);str('fact');u32(4);u32(n);}
  str('data');u32(data);
  const chans=[...Array(ch)].map((_,i)=>buf.getChannelData(i));
  if(float){ for(let i=0;i<n;i++) for(let c=0;c<ch;c++){dv.setFloat32(o,chans[c][i],true);o+=4;} }
  else if(bits===16){ for(let i=0;i<n;i++) for(let c=0;c<ch;c++){ const v=clamp(chans[c][i]+(Math.random()-Math.random())/32767,-1,1); dv.setInt16(o,Math.round(v*32767),true); o+=2; } }
  else { const u=new Uint8Array(ab), q=8388607;
    for(let i=0;i<n;i++) for(let c=0;c<ch;c++){
      let v=chans[c][i]+(Math.random()-Math.random())/q; v=clamp(v,-1,1); let s=Math.round(v*q); if(s<0) s+=16777216;
      u[o++]=s&255; u[o++]=(s>>8)&255; u[o++]=(s>>16)&255; } }
  return new Uint8Array(ab);
}
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function makeZip(files){
  const enc=new TextEncoder(), parts=[], central=[]; let off=0;
  const d=new Date(), dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(), tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);
  for(const f of files){
    const name=enc.encode(f.name), crc=crc32(f.data), sz=f.data.length;
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,tm,true);lh.setUint16(12,dt,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,name.length,true);lh.setUint16(28,0,true);
    parts.push(new Uint8Array(lh.buffer),name,f.data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,tm,true);ch.setUint16(14,dt,true);
    ch.setUint32(16,crc,true);ch.setUint32(20,sz,true);ch.setUint32(24,sz,true);ch.setUint16(28,name.length,true);ch.setUint32(42,off,true);
    central.push(new Uint8Array(ch.buffer),name);
    off+=30+name.length+sz;
  }
  const cdSize=central.reduce((a,b)=>a+b.length,0), end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cdSize,true);end.setUint32(16,off,true);
  return new Blob([...parts,...central,new Uint8Array(end.buffer)],{type:'application/zip'});
}

/* =========================================================
   BUILT-IN SAMPLE: a formant "ghost choir"
   ========================================================= */
async function makeChoir(){
  const sr=48000, len=3.6, ctx=new OfflineAudioContext(2,Math.floor(sr*len),sr), R=resources(ctx), f=mtof(60);
  const bus=ctx.createGain(), env=ctx.createGain();
  env.gain.setValueAtTime(0,0); env.gain.linearRampToValueAtTime(1,.35); env.gain.setValueAtTime(1,2.7); env.gain.linearRampToValueAtTime(0,3.5);
  const forms=[[700,500,8,1],[1150,850,11,.55],[2700,2500,18,.22],[3500,3300,22,.1]].map(([a,b,q,gv])=>{const bp=bq(ctx,'bandpass',a,q); bp.frequency.setValueAtTime(a,0); bp.frequency.linearRampToValueAtTime(b,3.4); const g=gainN(ctx,gv*2.2); bus.connect(bp).connect(g).connect(env); return bp;});
  [[-9,-.5],[-3,.3],[4,-.2],[10,.5]].forEach(([dc,pn],i)=>{
    const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=dc;
    const v=ctx.createOscillator(); v.frequency.value=4.8+i*.35; const vg=gainN(ctx,f*.004); v.connect(vg).connect(o.frequency);
    const p=ctx.createStereoPanner(); p.pan.value=pn; const g=gainN(ctx,.22); o.connect(g).connect(p).connect(bus); o.start(0); v.start(0); o.stop(len); v.stop(len);
  });
  const n=noiseSrc(ctx,R.pink,0,len), nh=bq(ctx,'highpass',900,.7), ng=gainN(ctx,.35); n.connect(nh).connect(ng).connect(bus);
  const out=gainN(ctx,.9); env.connect(out).connect(ctx.destination);
  const buf=await ctx.startRendering();
  let pk=0; for(let c=0;c<2;c++){const d=buf.getChannelData(c); for(let i=0;i<d.length;i++) pk=Math.max(pk,Math.abs(d[i]));}
  for(let c=0;c<2;c++){const d=buf.getChannelData(c); for(let i=0;i<d.length;i++) d[i]*=.9/pk;}
  return buf;
}
function computePeaks(buf,n=400){
  const d=buf.getChannelData(0), step=Math.max(1,Math.floor(d.length/n)), out=new Float32Array(n);
  for(let i=0;i<n;i++){let m=0; for(let j=i*step;j<Math.min(d.length,(i+1)*step);j+=4) m=Math.max(m,Math.abs(d[j])); out[i]=m;}
  let mx=0; out.forEach(v=>mx=Math.max(mx,v)); if(mx>0) for(let i=0;i<n;i++) out[i]/=mx; return out;
}

let choirBuf=null;
async function initChoir(){
  if(!choirBuf){ try{ choirBuf=await makeChoir(); }catch(e){ console.warn(e); return; } }
  SAMPLE.buffer=choirBuf; SAMPLE.baseMidi=60; SAMPLE.follow=false; SAMPLE.name='Ghost choir (built-in) · '+fmtTime(choirBuf.duration); SAMPLE.peaks=computePeaks(choirBuf);
}

