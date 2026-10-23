/* KYMA · core/atmos-engine — generative soundscapes and transition one-shots
   AtmosEngine builds one living scene: continuous beds (drone, shimmer, wind, rain, city, sub) run
   for as long as the scene plays, while event layers (grains, drops, birds, insects, swells, waves,
   pulse) are scheduled a moment ahead. Every control is a smooth parameter change on the running
   graph, so moving a fader or switching scenes never restarts the sound.
   The same engine plays live in the Atmosphere studio, renders exports, and plays atmosphere
   tracks on the timeline (VOICES.atmos). fxkit holds the sound-design one-shots. */
const ATMOS_LAYERS=['drone','shimmer','grains','wind','rain','birds','insects','city','water','pulse','sub'];
const ATMOS_LABEL={drone:'Drone',shimmer:'Shimmer',grains:'Grains',wind:'Wind',rain:'Rain',birds:'Birds',insects:'Insects',city:'City',water:'Water',pulse:'Pulse',sub:'Sub'};
const ATMOS_GAIN={drone:.09,shimmer:.035,grains:.55,wind:.5,rain:.4,birds:.12,insects:.05,city:.6,water:.55,pulse:.16,sub:.22};
const ATMOS_TONAL=new Set(['drone','shimmer','grains','pulse','sub']);
function atmosRand(seed){ let s=(seed>>>0)||1; return ()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)%100000)/100000; }; }

function AtmosEngine(ctx,dest,R,o={}){
  const rnd=atmosRand(o.seed||((Math.random()*1e9)|0)), raw=!!o.raw, bpm=o.bpm||(()=>S.bpm);
  /* raw nodes bypass the song transport's voice registry, so stopping the song never cuts a live scene */
  const mkO=()=>raw?new OscillatorNode(ctx):ctx.createOscillator();
  const mkB=()=>raw?new AudioBufferSourceNode(ctx):ctx.createBufferSource();
  const E={ctx,p:{motion:.4,bright:.6},midi:o.midi||50,g:{},cont:[],lfos:[],tonal:[],next:{},running:false,ended:false,timer:null};
  E.out=ctx.createGain(); E.tone=bq(ctx,'lowpass',8000,.5); E.tone.connect(E.out); E.out.connect(dest);
  ATMOS_LAYERS.forEach(k=>{ const g=ctx.createGain(); g.gain.value=0; g.connect(E.tone); E.g[k]=g; });
  const f0=()=>mtof(E.midi), mot=()=>.15+(E.p.motion??.4)*1.6, brightHz=()=>200+Math.pow(E.p.bright??.6,1.6)*15800, lv=k=>E.p[k]||0;
  const cont=n=>{ E.cont.push(n); return n; };
  const lfo=(rate,depth,param)=>{ const ov=cont(mkO()), g=ctx.createGain(), r=rate*(.85+rnd()*.3); g.gain.value=depth; ov.frequency.value=r*mot(); ov.connect(g).connect(param); E.lfos.push({o:ov,r}); return ov; };
  const tonal=(ov,ratio,min)=>{ ov.frequency.value=Math.max(min||0,f0()*ratio); E.tonal.push({o:ov,ratio,min:min||0}); return ov; };
  const loopNoise=(buf)=>{ const s=cont(mkB()); s.buffer=buf; s.loop=true; s._off=rnd()*(buf.duration-.5); return s; };
  /* finished event voices are unhooked straight away, so a scene can run for hours without piling up nodes */
  const done=(src,...nodes)=>{ src.onended=()=>{ nodes.forEach(n=>{ try{ n.disconnect(); }catch(e){} }); }; };
  const pan=v=>{ const p=ctx.createStereoPanner(); p.pan.value=clamp(v,-1,1); return p; };

  /* ---------- continuous beds ---------- */
  // drone: detuned saws and a triangle a fifth up through a breathing low-pass
  E.droneLP=bq(ctx,'lowpass',500,.8); E.droneLP.connect(E.g.drone); lfo(.05,300,E.droneLP.frequency);
  [[.5,-7,'sawtooth'],[.5,7,'sawtooth'],[.75,3,'triangle'],[1,0,'sine']].forEach(([r,dt,w])=>{ const ov=cont(mkO()); ov.type=w; ov.detune.value=dt; tonal(ov,r); ov.connect(E.droneLP); });
  // shimmer: high partials with slow tremolo
  [2,3,4,6].forEach((h,i)=>{ const ov=cont(mkO()), a=ctx.createGain(); a.gain.value=.25/(i+1); tonal(ov,h*(1+(rnd()-.5)*.003)); lfo(.08*(i+1),.22/(i+1),a.gain); ov.connect(a).connect(E.g.shimmer); });
  // wind: pink noise through a wandering band, with gusts
  { const n=loopNoise(R.pink), bp=bq(ctx,'bandpass',500,.7), gust=ctx.createGain(); gust.gain.value=.6; n.connect(bp).connect(gust).connect(E.g.wind); lfo(.07,380,bp.frequency); lfo(.11,.35,gust.gain); lfo(.031,.2,gust.gain); }
  // rain bed: bright hiss under the drops
  { const n=loopNoise(R.white), hp=bq(ctx,'highpass',1800,.5), lp=bq(ctx,'lowpass',9000,.5), bed=ctx.createGain(); bed.gain.value=.22; n.connect(hp).connect(lp).connect(bed).connect(E.g.rain); }
  // insects: three pulsing high tones that sing in bursts
  E.insects=[4300,4700,5200].map((fr,i)=>{ const ov=cont(mkO()), am=ctx.createGain(), l=cont(mkO()), lg=ctx.createGain(), burst=ctx.createGain(), pn=pan((i-1)*.7);
    ov.frequency.value=fr*(1+(rnd()-.5)*.05); l.type='square'; l.frequency.value=22+i*6+rnd()*6; lg.gain.value=.5; am.gain.value=.5; l.connect(lg).connect(am.gain); burst.gain.value=0;
    ov.connect(am).connect(burst).connect(pn).connect(E.g.insects); return burst; });
  // city: low rumble with slow swells
  { const n=loopNoise(R.pink), lp=bq(ctx,'lowpass',320,.6), sw=ctx.createGain(); sw.gain.value=.5; n.connect(lp).connect(sw).connect(E.g.city); lfo(.045,.3,sw.gain); }
  // sub: a low sine that swells
  { const ov=cont(mkO()), a=ctx.createGain(); a.gain.value=.7; tonal(ov,.25,28); lfo(.04,.3,a.gain); ov.connect(a).connect(E.g.sub); }
  // shared banks: drops and grains feed a few fixed filters and panners instead of building their own
  E.rainBank=[0,1,2,3,4,5].map(i=>{ const b=bq(ctx,'bandpass',1500+i*900+rnd()*400,4+rnd()*4), pn=pan((i/5-.5)*1.8); b.connect(pn).connect(E.g.rain); return b; });
  E.grainBank=[0,1,2,3,4].map(i=>{ const pn=pan((i/4-.5)*1.6); pn.connect(E.g.grains); return pn; });
  // pulse: tempo-locked soft eighths through a band tuned to the key
  E.pulseBP=bq(ctx,'bandpass',f0()*4,6); E.pulseBP.connect(E.g.pulse);

  /* ---------- event layers, scheduled ahead ---------- */
  const EV={
    grains(t){ const B=SAMPLE.buffer, dens=4+lv('grains')*10; if(!B) return t+.25;
      const base=SAMPLE.follow?f0()/mtof(SAMPLE.baseMidi||60):Math.pow(2,(E.midi-(SAMPLE.baseMidi||60))/12), s=mkB(), e=ctx.createGain(), L=.08+rnd()*.25*(1+(1-mot()/1.75)), pos=rnd()*Math.max(0,B.duration-L), pn=E.grainBank[Math.floor(rnd()*5)];
      s.buffer=B; s.playbackRate.value=base*[1,1,2,.5,1.5][Math.floor(rnd()*5)]*(1+(rnd()-.5)*.01); e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(.35,t+L/2); e.gain.linearRampToValueAtTime(0,t+L);
      s.connect(e).connect(pn); done(s,e); s.start(t,pos,L+.02); return t+1/dens*(.5+rnd()); },
    rain(t){ const s=mkB(), e=ctx.createGain(), L=.03+rnd()*.03;
      s.buffer=R.white; e.gain.setValueAtTime(.5*rnd()+.02,t); e.gain.exponentialRampToValueAtTime(.001,t+L); s.connect(e).connect(E.rainBank[Math.floor(rnd()*6)]); done(s,e); s.start(t,rnd()*3,L+.01);
      return t-Math.log(1-rnd()*.999)/(8+lv('rain')*40); },
    birds(t){ const voice=rnd(), n=2+Math.floor(rnd()*5), base=2200+voice*2600, pn=pan((voice-.5)*1.6); pn.connect(E.g.birds); let tt=t;
      for(let i=0;i<n;i++){ const ov=mkO(), m=mkO(), mg=ctx.createGain(), e=ctx.createGain(), L=.05+rnd()*.09, up=rnd()<.5; mg.gain.value=base*.08;
        ov.frequency.setValueAtTime(base*(up?.8:1.25),tt); ov.frequency.exponentialRampToValueAtTime(base*(up?1.3:.75),tt+L); m.frequency.value=40+rnd()*60; m.connect(mg).connect(ov.frequency);
        e.gain.setValueAtTime(0,tt); e.gain.linearRampToValueAtTime(.5,tt+.008); e.gain.exponentialRampToValueAtTime(.001,tt+L); ov.connect(e).connect(pn); done(ov,e,mg); ov.start(tt); ov.stop(tt+L+.02); m.start(tt); m.stop(tt+L+.02);
        tt+=L+.03+rnd()*.08; }
      { const z=mkO(); z.connect(ctx.createGain()); done(z,pn); z.start(tt); z.stop(tt+.05); }
      return tt-Math.log(1-rnd()*.999)/(.25+lv('birds')*1.4)+.2; },
    insects(t){ E.insects.forEach(b=>{ if(rnd()<.6){ const a=t+rnd()*.6, h=.25+rnd()*.4; b.gain.setValueAtTime(0,a); b.gain.linearRampToValueAtTime(1,a+.02); b.gain.setValueAtTime(1,a+h); b.gain.linearRampToValueAtTime(0,a+h+.3); } }); return t+.9+rnd()*1.2; },
    city(t){ const m=mkB(), bp=bq(ctx,'bandpass',300+rnd()*500,1.2), e=ctx.createGain(), pn=ctx.createStereoPanner(), L=2+rnd()*2; m.buffer=R.pink; m.loop=true;
      e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(.35,t+L*.6); e.gain.linearRampToValueAtTime(0,t+L); pn.pan.setValueAtTime(rnd()<.5?-.8:.8,t); pn.pan.linearRampToValueAtTime(rnd()<.5?.8:-.8,t+L);
      m.connect(bp).connect(e).connect(pn).connect(E.g.city); done(m,bp,e,pn); m.start(t,rnd()*3); m.stop(t+L+.05); return t+3+rnd()*7; },
    water(t){ const per=5+(1-mot()/1.75)*6, L=per*1.2, n=mkB(), lp=bq(ctx,'lowpass',700,.5), e=ctx.createGain(), pn=pan((rnd()-.5)*1.2); n.buffer=R.pink; n.loop=true;
      lp.frequency.setValueAtTime(400,t); lp.frequency.linearRampToValueAtTime(1800+rnd()*1500,t+L*.45); lp.frequency.linearRampToValueAtTime(350,t+L);
      e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(.45,t+L*.45); e.gain.linearRampToValueAtTime(0,t+L); n.connect(lp).connect(e).connect(pn).connect(E.g.water); done(n,lp,e,pn); n.start(t,rnd()*3); n.stop(t+L+.05);
      return t+per*(.75+rnd()*.5); },
    pulse(t){ const step=60/Math.max(40,bpm())/2, k=E.pk=(E.pk||0)+1, ov=mkO(), e=ctx.createGain(); ov.type='triangle'; ov.frequency.value=f0()*(k%4===2?3:2);
      e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(k%2?.25:.5,t+.005); e.gain.exponentialRampToValueAtTime(.001,t+step*.9); ov.connect(e).connect(E.pulseBP); done(ov,e); ov.start(t); ov.stop(t+step);
      return t+step; },
  };
  const EVK=Object.keys(EV);

  /* ---------- controls ---------- */
  E.set=(p,ramp=.25)=>{
    Object.assign(E.p,p); const now=ctx.currentTime, tc=Math.max(.005,ramp/3);
    ATMOS_LAYERS.forEach(k=>{ const v=lv(k)*ATMOS_GAIN[k]; if(ramp<=0) E.g[k].gain.setValueAtTime(v,now); else E.g[k].gain.setTargetAtTime(v,now,tc); });
    const set=(prm,v)=>ramp<=0?prm.setValueAtTime(v,now):prm.setTargetAtTime(v,now,tc);
    set(E.tone.frequency,brightHz()); set(E.droneLP.frequency,500+(E.p.bright??.6)*1600);
    E.lfos.forEach(l=>set(l.o.frequency,l.r*mot()));
  };
  E.setKey=(midi,glide=1.2)=>{ E.midi=midi; const now=ctx.currentTime;
    E.tonal.forEach(t=>t.o.frequency.setTargetAtTime(Math.max(t.min,f0()*t.ratio),now,glide/3)); E.pulseBP.frequency.setTargetAtTime(f0()*4,now,glide/3); };
  E.start=(t)=>{ E.t0=t; E.cont.forEach(n=>{ if(n instanceof AudioBufferSourceNode) n.start(t,n._off||0); else n.start(t); });
    EVK.forEach(k=>E.next[k]=t+rnd()*(k==='city'?3:k==='water'?2:1.2)); E.running=true; };
  E.schedule=(until)=>{ if(!E.running) return;
    for(const k of EVK){ let t=E.next[k]; let guard=0; const lim=200+Math.ceil(Math.max(0,until-t)*80);
      while(t<until&&guard++<lim){ const on=lv(k)>.01; const nt=on?EV[k](t):t+(k==='pulse'?60/Math.max(40,bpm())/2:.5); t=Math.max(nt,t+.004); }
      E.next[k]=t; } };
  /* live: keep scheduling ~0.8 s ahead until stopped */
  E.live=()=>{ clearInterval(E.timer); E.schedule(ctx.currentTime+.8); E.timer=setInterval(()=>E.schedule(ctx.currentTime+.8),200); };
  E.stopAt=(t)=>{ E.cont.forEach(n=>{ try{ n.stop(t+.05); }catch(e){} }); };
  E.stop=(fade=.8)=>{ if(E.ended) return; E.ended=true; E.running=false; clearInterval(E.timer); const now=ctx.currentTime;
    E.out.gain.cancelScheduledValues(now); E.out.gain.setValueAtTime(E.out.gain.value,now); E.out.gain.linearRampToValueAtTime(0,now+fade);
    E.stopAt(now+fade+.05); setTimeout(()=>{ try{ E.out.disconnect(); }catch(e){} },(fade+.5)*1000); };
  if(o.p) E.set(o.p,0);
  return E;
}

/* let an offline render call back once a second so long scenes can be scheduled as it goes */
function offlineTicks(ctx,len){ ctx.__tick=[]; for(let k=1;k<len-.05;k++){ ctx.suspend(k).then(()=>{ ctx.__tick.forEach(f=>f(k)); ctx.resume(); }); } }
/* a whole scene as one timeline note; tonal layers follow the note's pitch */
VOICES.atmos=function(ctx,out,p,t,vel,dur,midi,R){
  dur=Math.max(.5,dur); const end=t+dur, fi=Math.min(p.fadeIn??3,dur*.45), fo=Math.min(p.fadeOut??3,dur*.45), peak=(vel||.8)*1.1;
  const env=ctx.createGain(); env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(peak,t+Math.max(.01,fi)); env.gain.setValueAtTime(peak,Math.max(t+fi,end-fo)); env.gain.linearRampToValueAtTime(0,end); env.connect(out);
  const E=AtmosEngine(ctx,env,R,{midi,seed:((t*1000)|0)+midi*7919,p}); E.start(t); E.stopAt(end);
  const offline=typeof OfflineAudioContext!=='undefined'&&ctx instanceof OfflineAudioContext;
  if(dur<=6){ E.schedule(end); return; }
  /* offline renders tick once a second (see offlineTicks / renderSong): keep scheduling two seconds ahead */
  if(offline){ E.schedule(Math.min(end,t+2.5)); if(ctx.__tick) ctx.__tick.push(at=>{ if(at+2.5>=t) E.schedule(Math.min(end,at+2.5)); }); else E.schedule(end); return; }
  /* live playback: schedule a second or so ahead; stop when the transport kills its voices */
  const sentinel=E.cont[0]; E.schedule(Math.min(end,ctx.currentTime+1.2));
  const id=setInterval(()=>{ if(ctx.currentTime>end||(typeof LIVE!=='undefined'&&!LIVE.voices.has(sentinel))){ clearInterval(id); E.running=false; return; } E.schedule(Math.min(end,ctx.currentTime+1.2)); },250);
};

const FX_PIECES=['Hit','Boom','Whoosh','Reverse swell','Riser','Downlifter','Sub drop','Impact','Exhale','Glitch','Stutter','Shimmer hit','Snap','Thud','Air burst','Dark riser'];

VOICES.fxkit=function(ctx,out,p,t,vel,dur,piece,R){
  const g=gainN(ctx,(vel||.9)*(p.level??1)), tone=bq(ctx,'lowpass',1500+(p.tone??.7)*16000,.5); tone.connect(g).connect(out);
  const L=Math.max(.2,dur), size=p.size??.5;
  const noise=(buf,s,len)=>noiseSrc(ctx,buf,s,len);
  const thump=(f0,f1,len,amp)=>{ const o=ctx.createOscillator(), e=ctx.createGain(); o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+len*.6); e.gain.setValueAtTime(amp,t); e.gain.exponentialRampToValueAtTime(.001,t+len); o.connect(e).connect(tone); o.start(t); o.stop(t+len+.05); };
  const burst=(buf,f,q,len,amp,at)=>{ const s=noise(buf,at??t,len+.05), b=bq(ctx,'bandpass',f,q), e=ctx.createGain(); e.gain.setValueAtTime(amp,at??t); e.gain.exponentialRampToValueAtTime(.001,(at??t)+len); s.connect(b).connect(e).connect(tone); };
  const metal=(len,amp)=>{ [1,1.47,2.09,2.56,3.3].forEach((r,i)=>{ const o=ctx.createOscillator(), e=ctx.createGain(); o.frequency.value=180*r*(1+i*.003); e.gain.setValueAtTime(amp/(i+1.5),t); e.gain.exponentialRampToValueAtTime(.001,t+len*(1-i*.12)); o.connect(e).connect(tone); o.start(t); o.stop(t+len); }); };
  const tail=(len,amp)=>{ const s=noise(R.pink,t,len), lp=bq(ctx,'lowpass',2200,.5), e=ctx.createGain(); lp.frequency.setValueAtTime(5000,t); lp.frequency.exponentialRampToValueAtTime(300,t+len); e.gain.setValueAtTime(amp,t); e.gain.exponentialRampToValueAtTime(.001,t+len); s.connect(lp).connect(e).connect(tone); };
  const sweep=(f0,f1,len,amp,shape)=>{ const s=noise(R.white,t,len+.05), b=bq(ctx,'bandpass',f0,2.2), e=ctx.createGain(); b.frequency.setValueAtTime(f0,t); b.frequency.exponentialRampToValueAtTime(f1,t+len*(shape==='mid'?.7:1));
    if(shape==='mid'){ b.frequency.exponentialRampToValueAtTime(f0*1.2,t+len); e.gain.setValueAtTime(.001,t); e.gain.exponentialRampToValueAtTime(amp,t+len*.7); e.gain.exponentialRampToValueAtTime(.001,t+len); }
    else if(shape==='up'){ e.gain.setValueAtTime(.001,t); e.gain.exponentialRampToValueAtTime(amp,t+len*.97); e.gain.linearRampToValueAtTime(0,t+len); }
    else { e.gain.setValueAtTime(amp,t); e.gain.exponentialRampToValueAtTime(.001,t+len); }
    const pn=ctx.createStereoPanner(); pn.pan.setValueAtTime(-.6,t); pn.pan.linearRampToValueAtTime(.6,t+len); s.connect(b).connect(e).connect(pn).connect(tone); };
  switch(piece){
    case 0: thump(110,42,1.4+size,1); burst(R.white,1800,.8,.25,.9); metal(1.2+size,.25); tail(2+size*3,.25); break; // Hit
    case 1: thump(70,30,2.6+size*2,1.2); tail(3+size*4,.18); break; // Boom
    case 2: sweep(300,4000,Math.min(L,1.6),.9,'mid'); break; // Whoosh (peaks ~70% through)
    case 3: { const s=noise(R.pink,t,L+.05), lp=bq(ctx,'lowpass',400,.7), e=ctx.createGain(); lp.frequency.setValueAtTime(300,t); lp.frequency.exponentialRampToValueAtTime(9000,t+L); e.gain.setValueAtTime(.001,t); e.gain.exponentialRampToValueAtTime(.9,t+L*.98); e.gain.linearRampToValueAtTime(0,t+L);
      const o=ctx.createOscillator(), oe=ctx.createGain(); o.type='sawtooth'; o.frequency.value=110; oe.gain.setValueAtTime(.001,t); oe.gain.exponentialRampToValueAtTime(.12,t+L*.98); oe.gain.linearRampToValueAtTime(0,t+L); const ol=bq(ctx,'lowpass',600,.5); ol.frequency.setValueAtTime(300,t); ol.frequency.exponentialRampToValueAtTime(5000,t+L);
      s.connect(lp).connect(e).connect(tone); o.connect(ol).connect(oe).connect(tone); o.start(t); o.stop(t+L); break; } // Reverse swell
    case 4: case 15: { const dark=piece===15; sweep(dark?120:400,dark?2400:9000,L,dark?.9:.8,'up'); const o=ctx.createOscillator(), e=ctx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(dark?55:220,t); o.frequency.exponentialRampToValueAtTime(dark?220:880,t+L);
      const lp=bq(ctx,'lowpass',dark?900:3000,2); e.gain.setValueAtTime(.001,t); e.gain.exponentialRampToValueAtTime(dark?.22:.1,t+L*.97); e.gain.linearRampToValueAtTime(0,t+L); o.connect(lp).connect(e).connect(tone); o.start(t); o.stop(t+L);
      if(dark){ const sb=ctx.createOscillator(), se=ctx.createGain(); sb.frequency.setValueAtTime(40,t); sb.frequency.exponentialRampToValueAtTime(60,t+L); se.gain.setValueAtTime(.001,t); se.gain.exponentialRampToValueAtTime(.5,t+L*.95); se.gain.linearRampToValueAtTime(0,t+L); sb.connect(se).connect(tone); sb.start(t); sb.stop(t+L); } break; } // Riser / Dark riser
    case 5: sweep(8000,250,L,.8,'down'); break; // Downlifter
    case 6: { const o=ctx.createOscillator(), e=ctx.createGain(); o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(28,t+Math.min(L,1.8)); e.gain.setValueAtTime(1,t); e.gain.exponentialRampToValueAtTime(.001,t+Math.min(L,1.8)+.3); o.connect(e).connect(tone); o.start(t); o.stop(t+2.3); break; } // Sub drop
    case 7: thump(160,50,.9,1); burst(R.white,900,.6,.4,1); burst(R.white,4000,1,.15,.6); break; // Impact
    case 8: { const s=noise(R.pink,t,L+.05), bp=bq(ctx,'bandpass',900,1.4), e=ctx.createGain(); bp.frequency.setValueAtTime(600,t); bp.frequency.linearRampToValueAtTime(1500,t+L*.4); bp.frequency.linearRampToValueAtTime(700,t+L);
      e.gain.setValueAtTime(.001,t); e.gain.linearRampToValueAtTime(.8,t+L*.35); e.gain.linearRampToValueAtTime(0,t+L); s.connect(bp).connect(e).connect(tone); break; } // Exhale
    case 9: for(let i=0;i<10;i++){ const tt=t+i*.045; burst(R.white,800+Math.random()*6000,4,.03,.6,tt); } break; // Glitch
    case 10: { const o=ctx.createOscillator(), e=ctx.createGain(); o.type='square'; o.frequency.value=220; const n=Math.max(4,Math.round(L/.06)); for(let i=0;i<n;i++){ const tt=t+i*L/n; e.gain.setValueAtTime(.18,tt); e.gain.setValueAtTime(0,tt+L/n*.5); } o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(110,t+L); o.connect(e).connect(tone); o.start(t); o.stop(t+L); break; } // Stutter
    case 11: { [1,2.01,2.99,4.2,5.4].forEach((r,i)=>{ const o=ctx.createOscillator(), e=ctx.createGain(); o.frequency.value=523*r; e.gain.setValueAtTime(.2/(i+1),t); e.gain.exponentialRampToValueAtTime(.001,t+2.5+size*3); o.connect(e).connect(tone); o.start(t); o.stop(t+6); }); burst(R.white,6000,1,.2,.4); break; } // Shimmer hit
    case 12: burst(R.white,2500,2,.06,1); break; // Snap
    case 13: thump(90,45,.35,1); break; // Thud
    case 14: { const s=noise(R.white,t,.6), hp=bq(ctx,'highpass',3000,.5), e=ctx.createGain(); e.gain.setValueAtTime(.001,t); e.gain.exponentialRampToValueAtTime(.6,t+.08); e.gain.exponentialRampToValueAtTime(.001,t+.5); s.connect(hp).connect(e).connect(tone); break; } // Air burst
  }
};
ESCHEMA.atmos=[...ATMOS_LAYERS.map(k=>P(k,ATMOS_LABEL[k],0,1,0,{fmt:fmtPct})),P('motion','Motion',0,1,.4,{fmt:fmtPct}),P('bright','Brightness',0,1,.6,{fmt:fmtPct}),P('fadeIn','Fade in',0,12,3,{fmt:fmtS}),P('fadeOut','Fade out',0,12,3,{fmt:fmtS})];
ESCHEMA.fxkit=[P('level','Level',0,1.5,1,{fmt:fmtPct}),P('tone','Tone',0,1,.7,{fmt:fmtPct}),P('size','Size',0,1,.5,{fmt:fmtPct})];
const ATMOS_SCENES={
  'Forest dawn':{birds:.75,wind:.35,insects:.15,drone:.15,shimmer:.2,motion:.35,bright:.8},
  'Rain on glass':{rain:.8,wind:.15,drone:.25,sub:.15,motion:.25,bright:.55},
  'Night city':{city:.8,pulse:.25,drone:.3,sub:.3,rain:.1,motion:.5,bright:.45},
  'Deep space':{drone:.7,shimmer:.55,sub:.45,grains:.2,motion:.2,bright:.4},
  'Underwater':{water:.6,sub:.5,drone:.4,motion:.3,bright:.22},
  'Desert wind':{wind:.8,drone:.35,shimmer:.15,sub:.2,motion:.55,bright:.6},
  'Cathedral':{drone:.6,grains:.55,shimmer:.35,motion:.2,bright:.5},
  'Ocean shore':{water:.85,wind:.3,birds:.15,motion:.45,bright:.7},
  'Summer night':{insects:.7,wind:.15,drone:.2,motion:.3,bright:.6},
  'Atmospheric formation':{drone:.55,shimmer:.45,wind:.2,sub:.35,grains:.25,motion:.4,bright:.55},
  'Subtle city movement':{city:.45,pulse:.45,drone:.35,shimmer:.2,sub:.25,motion:.55,bright:.6},
  'Surfacing':{water:.35,drone:.5,shimmer:.5,sub:.3,motion:.35,bright:.5},
};
Object.entries(ATMOS_SCENES).forEach(([n,p])=>addInst(n,'Atmospheres','atmos',{fadeIn:3,fadeOut:3,...p},3,['atmos']));
addInst('Transition FX','Textures','fxkit',{level:1,tone:.7,size:.5},0,['fx']);
INST['transition-fx'].kind='drum';
function piecesFor(tr){ const I=tr&&INST[tr.inst]; return I&&I.engine==='fxkit'?FX_PIECES:PIECES; }


/* ---------- FX one-shots on the song: audition, and place on the project's FX track ---------- */
const FX_LEN={2:1.2,3:2,4:2,5:1.5,8:2,10:.8,15:3};
function auditionFx(i){ ensureAudio(); if(ac.state!=='running') ac.resume(); const I=INST['transition-fx']; try{ VOICES.fxkit(ac,G.sum,I.p,ac.currentTime+.03,.9,FX_LEN[i]||1,i,G.R); }catch(e){ console.warn(e); } }
/* FX notes live on one FX track. Risers and swells end on the target; whooshes peak on it; hits start on it. */
function fxTrack(){ let tr=S.tracks.find(t=>INST[t.inst]?.engine==='fxkit'); if(!tr){ tr=newTrack('transition-fx',{name:'FX · Transitions'}); tr.role='texture'; tr.vol=.75; tr.space=.35; S.tracks.push(tr); if(G) applyGraph(G); } return tr; }
function fxPlacement(i,at,beats){ const sd=stepDur(); const lead=i===4||i===15||i===3?Math.max(4,(beats||4)*4):i===2?Math.round(1.2*.7/sd):0; const len=i===4||i===15||i===3?lead:i===2?Math.max(2,Math.round(1.2/sd)):Math.max(1,Math.round((FX_LEN[i]||1)/sd)); return {t:Math.max(0,at-lead),d:len}; }
function addFxAt(i,at,o){
  o=o||{}; if(!o.noHist) pushHist(); const tr=fxTrack(); let c=tr.clips.find(x=>x.name==='FX'); if(!c){ c=newClip(0,Math.max(16,S.len),[],{name:'FX'}); tr.clips.push(c); }
  const pl=fxPlacement(i,at,o.beats); if(pl.t+pl.d>clipEnd(c)) c.len=Math.ceil((pl.t+pl.d)/16)*16; if(pl.t<c.start){ c.offset-=c.start-pl.t; c.len+=c.start-pl.t; c.start=pl.t; }
  c.notes.push({t:pl.t-c.start+c.offset,d:pl.d,n:i,v:o.v??.9}); if(clipEnd(c)>S.len) S.len=Math.ceil(clipEnd(c)/16)*16;
  markDirty(); if(!o.quiet){ persist(); renderTracks(); emit('header'); }
  return c;
}

