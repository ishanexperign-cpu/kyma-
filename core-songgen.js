/* KYMA · core/songgen — vibes, pattern generators and starter songs */
const PROGS=[[0,5,2,6],[0,3,4,0],[0,5,3,4],[0,6,5,4],[0,2,5,3],[5,3,0,4],[0,3,0,4],[0,4,5,3]];
/* ---------- vibes: a kit of sounds, effects, tempo and pattern style ---------- */
const VIBES={
  'Ambient':{tag:'Drift and glow',bpm:[54,66],roots:[2,9,4],scale:'Minor',bars:4,swing:0,feel:'slow',
    presets:{kick:'Felt',snare:'Brush',hat:'Dust',bass:'Drone Bass',keys:'Glass Bell',pad:'Vhikk Drone',ghost:'SMR Arcs',sample:'Ghost Choir Cloud'},
    mix:{kick:{vol:.6,space:.3},snare:{vol:.35,space:.5},hat:{vol:.3,space:.4},bass:{vol:.7,space:.1},keys:{vol:.6,space:.7,echo:.55,pan:.15},pad:{vol:.75,space:.55},ghost:{vol:.9,space:.65,echo:.25},sample:{vol:.5,space:.8,pan:-.1}},
    master:{space:.9,size:7,echo:.45,pump:0,glue:.15,tape:.35,width:1.3,tone:-.35,warble:0},
    layers:['pad','ghost','bass','keys','sample'],progs:[[0,5,2,6],[0,3,5,4],[0,5,3,6]],demo:'Ambient Ghosts',
    names:['Ghost Light','Slow Tide','Afterimage','Fog Choir']},
  'Lo-fi':{tag:'Dusty beats to study to',bpm:[72,86],roots:[5,0,9],scale:'Minor',bars:4,swing:.32,feel:'groove',
    presets:{kick:'Dusty Boom',snare:'Lo-fi Snare',hat:'Dust',bass:'Round Sub',keys:'Tine Piano',pad:'Warm Strings',ghost:'Breath Organ',sample:'Choir Hit'},
    mix:{kick:{vol:.85},snare:{vol:.7,space:.25},hat:{vol:.7,pan:.2},bass:{vol:.75},keys:{vol:.7,space:.35,echo:.15,pan:-.1},pad:{vol:.35,space:.5},ghost:{vol:.5,space:.6},sample:{vol:.45,space:.5,echo:.3,pan:.25}},
    master:{space:.45,size:3,echo:.3,pump:.12,glue:.45,tape:.7,width:.9,tone:-.45,warble:.25},
    layers:['kick','snare','hat','bass','keys','pad'],progs:[[0,5,3,4],[0,3,6,2],[0,5,1,4]],demo:'Night Bus',
    names:['Rain on 4th Street','Tea Gone Cold','Window Seat','Late Bus Home']},
  'Synthwave':{tag:'Neon highway at night',bpm:[96,112],roots:[9,4,2],scale:'Minor',bars:4,swing:0,feel:'synth',
    presets:{kick:'Synthwave Linn',snare:'Gated Snare',hat:'Synthwave Hats',bass:'Synthwave Pulse',keys:'Arp Pluck',pad:'Juno Pad',ghost:'Breath Organ',sample:'Choir Hit'},
    mix:{kick:{vol:.85},snare:{vol:.6,space:.7},hat:{vol:.8,pan:.15},bass:{vol:.7},keys:{vol:.75,space:.35,echo:.45,pan:-.1},pad:{vol:.5,space:.55},ghost:{vol:.45,space:.6},sample:{vol:.45,space:.6}},
    master:{space:.6,size:3.5,echo:.4,pump:.25,glue:.5,tape:.3,width:1.25,tone:.15,warble:.08},
    layers:['kick','snare','hat','bass','keys','pad'],progs:[[0,5,2,6],[0,5,6,4],[0,3,5,6]],demo:'Neon Drive',
    names:['Neon Drive','Chrome Sunset','Night Grid','Outrun 86']},
  'Vaporwave':{tag:'Slowed mall memories',bpm:[66,80],roots:[5,3,10],scale:'Major',bars:4,swing:.08,feel:'vapor',
    presets:{kick:'Vapor Thump',snare:'Vapor Snare',hat:'Dust',bass:'Vapor Bass',keys:'Vapor EP',pad:'Vapor Haze',ghost:'Breath Organ',sample:'Mall Choir'},
    mix:{kick:{vol:.75},snare:{vol:.75,space:.5},hat:{vol:.8},bass:{vol:.7},keys:{vol:.75,space:.5,echo:.3},pad:{vol:.5,space:.6},ghost:{vol:.45,space:.7},sample:{vol:.55,space:.7}},
    master:{space:.75,size:4.5,echo:.4,pump:.1,glue:.35,tape:.6,width:1.1,tone:-.4,warble:.7},
    layers:['keys','pad','sample','kick','snare','bass'],progs:[[1,4,0,3],[3,2,1,0],[0,5,1,4]],demo:'Plaza 1995',
    names:['Plaza 1995','Food Court Dreams','Pastel Escalator','Mall After Hours']},
  'House':{tag:'Warm four on the floor',bpm:[120,126],roots:[9,7,5],scale:'Dorian',bars:2,swing:.12,feel:'four',
    presets:{kick:'Tight House',snare:'Big Clap',hat:'Closed Tick',bass:'Pluck Bass',keys:'Soft Pluck',pad:'Glass Choir',ghost:'SMR Arcs',sample:'Choir Hit'},
    mix:{kick:{vol:.9},snare:{vol:.6,space:.3},hat:{vol:.55,pan:.15},bass:{vol:.75},keys:{vol:.6,space:.35,echo:.4,pan:-.15},pad:{vol:.45,space:.6},ghost:{vol:.55,space:.6,echo:.2},sample:{vol:.45,space:.4,echo:.35,pan:.2}},
    master:{space:.4,size:2.5,echo:.35,pump:.65,glue:.5,tape:.35,width:1.1,tone:.1,warble:0},
    layers:['kick','snare','hat','bass','keys','pad'],progs:[[0,3],[0,4,3,4],[0,5,3,4]],demo:'Glasshouse',
    names:['Glasshouse','Sunday Floor','Warehouse Glow','Late Lights']},
  'Techno':{tag:'Dark, rolling, hypnotic',bpm:[124,132],roots:[6,4,1],scale:'Phrygian',bars:2,swing:.05,feel:'techno',
    presets:{kick:'Techno Thud',snare:'Rimshot',hat:'Metal 808',bass:'Acid-ish',keys:'Hollow Lead',pad:'Dark Matter',ghost:'SMR Arcs',sample:'Stutter'},
    mix:{kick:{vol:.9},snare:{vol:.5,space:.3,echo:.35,pan:.2},hat:{vol:.5,pan:-.15},bass:{vol:.85,echo:.1},keys:{vol:.4,space:.4,echo:.5},pad:{vol:.5,space:.5},ghost:{vol:.6,space:.6,echo:.3},sample:{vol:.4,space:.3,echo:.4}},
    master:{space:.35,size:3,echo:.45,pump:.5,glue:.55,tape:.45,width:1.05,tone:.05,warble:0},
    layers:['kick','hat','bass','snare','keys'],progs:[[0,1],[0,0,1,0],[0,6]],demo:'Afterglow',
    names:['Afterglow','Concrete Pulse','Black Box','Signal Loss']},
  'Trap':{tag:'808s and rolling hats',bpm:[136,150],roots:[1,0,4],scale:'Harmonic minor',bars:2,swing:0,feel:'trap',
    presets:{kick:'Trap Kick',snare:'Trap Clap',hat:'Trap Hats',bass:'808 Boom',keys:'Dark Bell',pad:'Trap Choir',ghost:'Rain Glass',sample:'Stutter'},
    mix:{kick:{vol:.8},snare:{vol:.75,space:.25},hat:{vol:.85,pan:.1},bass:{vol:.85},keys:{vol:.8,space:.45,echo:.35},pad:{vol:.4,space:.6},ghost:{vol:.4,space:.6},sample:{vol:.4,echo:.4}},
    master:{space:.4,size:3,echo:.35,pump:.15,glue:.5,tape:.25,width:1.1,tone:.1,warble:0},
    layers:['kick','snare','hat','bass','keys','pad'],progs:[[0,5],[0,3,5,4],[0,0,5,4]],demo:'Night Shift',
    names:['Night Shift','Cold Chain','Rooftop 808','Low Beam']},
  'Raga':{tag:'Drone, plucks and a 3-3-2 lilt',bpm:[84,96],roots:[1,0,2],scale:'Bhairav',bars:4,swing:.18,feel:'raga',
    presets:{kick:'Felt',snare:'Rimshot',hat:'Shaker',bass:'Drone Bass',keys:'Sitar Pluck',pad:'Vhikk Drone',ghost:'Bowed Metal',sample:'Frozen'},
    mix:{kick:{vol:.8},snare:{vol:.5,space:.35,pan:-.15},hat:{vol:.45,pan:.25},bass:{vol:.55},keys:{vol:.9,space:.45,echo:.3},pad:{vol:.6,space:.5},ghost:{vol:.55,space:.7,echo:.2},sample:{vol:.45,space:.8}},
    master:{space:.6,size:5,echo:.4,pump:0,glue:.3,tape:.3,width:1.2,tone:-.1,warble:0},
    layers:['pad','keys','snare','hat','kick','bass'],progs:[[0,0,0,0],[0,4,0,3]],demo:'Bhairav Dawn',
    names:['Bhairav Dawn','Morning Ghat','Saffron Drift','Temple Steps']},
};
function applyVibeTo(p,v,fresh){
  const V=VIBES[v]; if(!V) return; p.vibe=v;
  LTRACKS.forEach(d=>{ const pn=V.presets[d.id], t=p.tracks[d.id]; t.preset=pn; t.p=presetParams(d.engine,pn); Object.assign(t,{vol:.8,pan:0,space:.2,echo:0},V.mix[d.id]||{}); t.mute=false; t.solo=false; });
  p.master={...p.master,...V.master};
  p.bpm = fresh ? Math.round(V.bpm[0]+Math.random()*(V.bpm[1]-V.bpm[0])) : Math.round((V.bpm[0]+V.bpm[1])/2);
  p.swing=V.swing; p.scale=V.scale;
  if(fresh){ p.root=rnd(V.roots); p.bars=V.bars; }
}
function feel(){ const v=VIBES[S.vibe]; return v?v.feel:(S.bpm>=115?'four':S.bpm>=86?'groove':'slow'); }
function ensureProg(sc){ if(!sc.prog){ const v=VIBES[S.vibe]; sc.prog=rnd(v?v.progs:PROGS).slice(); } return sc.prog; }
const chordAt=(sc,bar)=>{const p=ensureProg(sc); return p[bar%p.length];};
const lowRoot=r=>r>=3?r-7:r;
function drumStr(str,bars){const s=str.replace(/\s/g,'');const out=[];for(let i=0;i<bars*16;i++){const c=s[i%s.length];if(c==='.'||c==='-')continue;out.push({s:i,v:c==='X'?1:c==='o'?.45:.8});}return out;}
function genTrack(id,sc){
  const B=S.bars, f=feel(), N=(s,n,d)=>({s,n,d}), out=[];
  const bar=(b,str)=>drumStr(str,1).forEach(n=>out.push({s:n.s+b*16,v:n.v}));
  if(id==='kick'){
    const pats={slow:['x.......x.......','x..o............','x.........o.....'],groove:['x.........x.....','x......x..x.....','x.....x...x..x..','x..x......x.....'],
      four:['x...x...x...x...'],techno:['x...x...x...x...'],synth:['x...x...x...x...','x.......x.x.....'],vapor:['x.......x.......','x......x..x.....','x.........x.....'],
      trap:['x......x..x.....','x.....x...x..x..','x..x......x.....','x.......x.x.....'],raga:['x.......x..x....','x..x....x.......']};
    for(let b=0;b<B;b++){ let p=rnd(pats[f]||pats.groove); if(['four','techno','synth'].includes(f)&&b===B-1&&chance(.4)) p='x...x...x...x.x.'; bar(b,p); }
  } else if(id==='snare'){
    for(let b=0;b<B;b++){
      if(f==='trap'){ bar(b,'........x.......'); if(chance(.35)) out.push({s:b*16+rnd([14,15,11]),v:.45}); }
      else if(f==='raga') bar(b,rnd(['...x..x...x..x.o','..x..x.x..x..x..','x..x..x.x..x..x.']));
      else if(f==='techno') bar(b,rnd(['...x..x....x..x.','......x.......x.','..x.....x.x.....']));
      else if(f==='slow'){ if(chance(.5)) bar(b,'............x...'); }
      else { bar(b,'....X.......X...'); if(f==='groove') for(let i=0;i<2;i++) if(chance(.5)){const s=rnd([3,7,10,11,14,15]); if(!out.some(n=>n.s===s+b*16)) out.push({s:s+b*16,v:.45});} }
    }
  } else if(id==='hat'){
    for(let b=0;b<B;b++) for(let s=0;s<16;s++){
      let v=0, r=0;
      if(f==='four'){ if(s%4===2) v=1; else if(chance(.45)) v=.45; }
      else if(f==='techno'){ if(s%4===2) v=1; else if(chance(.5)) v=.45; }
      else if(f==='groove'){ if(s%2===0) v=s%4===0?.8:.45; else if(chance(.12)) v=.45; if(s===14&&chance(.3)) v=1; }
      else if(f==='synth'){ if(s%2===0) v=s%4===2?.8:.45; else if(s>=12&&chance(.3)) v=.45; }
      else if(f==='vapor'){ if(s%4===2) v=.45; else if(s%2===0&&chance(.3)) v=.45; }
      else if(f==='trap'){ if(s%2===0){ v=.8; if(s%4===2&&chance(.28)) r=rnd([2,3]); } else if(s>=12&&chance(.45)) v=.45; }
      else if(f==='raga'){ if(s%2===0) v=s%8===0?.8:.45; else if(chance(.15)) v=.45; }
      else { if(s%4===0&&chance(.8)) v=.45; else if(s%2===0&&chance(.25)) v=.45; }
      if(v) out.push(r?{s:s+b*16,v,r}:{s:s+b*16,v});
    }
  } else if(id==='bass'){
    for(let b=0;b<B;b++){
      const r=lowRoot(chordAt(sc,b));
      if(f==='synth'){ for(let s=0;s<16;s+=2) out.push(N(b*16+s,(s/2)%2?r+7:r,2)); }
      else if(f==='techno'){ for(let s=0;s<16;s++) if(s%4) out.push(N(b*16+s,s%4===2?r+7:r,1)); }
      else if(f==='trap'){ const k=(sc.notes.kick||[]).filter(n=>n.s>=b*16&&n.s<b*16+16).map(n=>n.s).sort((a,c)=>a-c); const hits=k.length?k:[b*16,b*16+10];
        hits.forEach((s,i)=>{ const nx=i<hits.length-1?hits[i+1]:b*16+16; out.push(N(s,(i>0&&chance(.25))?r+7:r,clamp(nx-s,1,8))); }); }
      else { const rh={four:[[2,2],[6,1],[10,2],[13,2]],groove:[[0,6],[10,3],[13,3]],vapor:[[0,6],[8,3],[12,3]],raga:[[0,16]],slow:[[0,16]]}[f]||[[0,8],[8,8]];
        rh.forEach(([s,d],i)=>out.push(N(b*16+s,(i>0&&chance(.3))?r+4:r,d))); }
    }
  } else if(id==='keys'){
    let walk=4;
    for(let b=0;b<B;b++){
      const r=chordAt(sc,b), tones=[0,2,4,7].map(x=>x+r);
      if(f==='four'){ [3,10].forEach(s=>[0,2,4,6].forEach(x=>out.push(N(b*16+s,r+x,2)))); }
      else if(f==='groove'){ const up=chance(.5); for(let s=0;s<16;s+=2){ if(chance(.25)) continue; const i=(s/2)%4; out.push(N(b*16+s,tones[up?i:3-i]+(s>=8?2:0),2)); } }
      else if(f==='synth'){ const pat=rnd([[0,2,4,7,9,7,4,2],[0,4,7,4,2,4,7,9],[7,4,2,0,2,4,7,11]]); for(let s=0;s<16;s++) out.push(N(b*16+s,r+pat[s%8],1)); }
      else if(f==='vapor'){ [[0,7],[10,5]].forEach(([s,d])=>[0,2,4,6].forEach(x=>out.push(N(b*16+s,r+x,d)))); }
      else if(f==='techno'){ if(chance(.6)) out.push(N(b*16+rnd([10,12,14]),r+rnd([7,8]),2)); }
      else if(f==='trap'){ const pos=[0,3,6,8,10,12,14].filter(()=>chance(.5)).slice(0,4); pos.forEach(s=>out.push(N(b*16+s,r+rnd([7,8,9,11]),2))); }
      else if(f==='raga'){ [0,3,6,8,11,14].forEach(s=>{ if(chance(.15)) return; walk=clamp(walk+rnd([-1,1,1,2,-2,-1]),0,9); out.push(N(b*16+s,walk,s===14?2:3)); }); }
      else { const k=2+Math.floor(Math.random()*2); for(let i=0;i<k;i++){ const s=rnd([0,4,6,8,10,12]); if(!out.some(n=>n.s===b*16+s)) out.push(N(b*16+s,rnd(tones)+7,4)); } }
    }
  } else if(id==='pad'){
    if(f==='raga'){ [0,4,7].forEach(x=>out.push(N(0,x,B*16))); return out; }
    if(f==='techno'&&chance(.4)) return out;
    if(chance(.5)){ const v=VIBES[S.vibe]; sc.prog=rnd(v?v.progs:PROGS).slice(); }
    const shape=f==='vapor'?[0,2,4,6]:f==='trap'?[0,2,4]:chance(.5)?[0,2,4]:[0,2,4,6];
    for(let b=0;b<B;b++){ const r=chordAt(sc,b); shape.forEach(x=>out.push(N(b*16,r+x,16))); }
  } else if(id==='ghost'){
    const span=B>=2?32:16;
    for(let s=0;s<B*16;s+=span){ const r=chordAt(sc,s/16); [0,4,7].forEach(x=>out.push(N(s,r+x,Math.min(span,B*16-s)))); }
  } else if(id==='sample'){
    if(['slow','vapor','raga'].includes(f)){ out.push(N(0,rnd([0,4,7]),B*16)); }
    else { for(let b=0;b<B;b+=2){ const r=chordAt(sc,b); out.push(N(b*16+rnd([6,10,14]),r+rnd([4,7]),rnd([2,3,4]))); } }
  }
  return out;
}
// a whole four-part song in one go
function generateSong(v){
  const V=VIBES[v]; const p=legacyProject(); applyVibeTo(p,v,true); p.name=rnd(V.names); p.desc=`${v}, freshly written: ${V.tag.toLowerCase()}. Press Surprise me for another.`;
  const keep=S; S=p;
  try{
    const prog=rnd(V.progs).slice(), clone=a=>JSON.parse(JSON.stringify(a));
    const order=['pad','kick','snare','hat','bass','keys','ghost','sample'];
    const main=p.scenes[1]; main.prog=prog;
    order.forEach(id=>{ if(V.layers.includes(id)) main.notes[id]=genTrack(id,main); main.prog=prog; });
    if(!V.layers.includes('ghost')&&chance(.35)) main.notes.ghost=genTrack('ghost',main);
    const [A,,C,D]=p.scenes; [A,C,D].forEach(sc=>sc.prog=prog);
    ['pad','ghost','sample'].forEach(id=>A.notes[id]=clone(main.notes[id]));
    A.notes.keys = V.feel==='slow'||chance(.6) ? clone(main.notes.keys) : [];
    if(V.feel!=='slow') A.notes.hat=clone(main.notes.hat);
    order.forEach(id=>C.notes[id]=clone(main.notes[id]));
    C.notes.keys=genTrack('keys',C); C.notes.hat=main.notes.hat.length?genTrack('hat',C):[]; C.notes.sample=genTrack('sample',C); C.prog=prog;
    ['pad','ghost','sample','keys'].forEach(id=>D.notes[id]=clone(main.notes[id]));
    if(!D.notes.ghost.length) D.notes.ghost=genTrack('ghost',D);
    if(!LTRACKS.some(d=>A.notes[d.id].length)) A.notes.pad=genTrack('pad',A);
    p.chain=[0,1,1,2,1,3]; p.cur=1; p.mode='loop';
  } finally { S=keep; }
  return p;
}

/* =========================================================
   STARTER LTRACKS
   ========================================================= */
const N=(s,n,d)=>({s,n,d});
function chordsAt(prog,shape,at,dur,bars){const o=[];for(let b=0;b<bars;b++){const r=prog[b%prog.length];shape.forEach(x=>o.push(N(b*16+at,r+x,dur)));}return o;}
function base(meta){
  const p=legacyProject(); Object.assign(p,meta); p.master={...p.master,...(meta.master||{})}; return p;
}
function tr(p,id,preset,mix={}){ const d=LDEF[id]; p.tracks[id]={...p.tracks[id],preset,p:presetParams(d.engine,preset),...mix}; }
const STARTERS = {
  'Ambient Ghosts': ()=>{
    const p=base({vibe:'Ambient',name:'Ambient Ghosts',desc:'Modeled on the reference: a D minor drone that turns toward C major, resonator arcs over slow bass notes under 90 Hz, no drums, long reverb.',bpm:56,swing:0,root:2,scale:'Minor',bars:4,chain:[0,1,2,3,3,2],
      master:{space:.9,size:7,echo:.45,pump:0,glue:.15,tape:.35,width:1.3,tone:-.35,out:.85}});
    tr(p,'kick','Felt',{vol:.6,space:.3}); tr(p,'snare','Brush',{vol:.35,space:.5}); tr(p,'hat','Dust',{vol:.3,space:.4});
    tr(p,'bass','Drone Bass',{vol:.7,space:.1}); tr(p,'keys','Glass Bell',{vol:.6,space:.7,echo:.55,pan:.15});
    tr(p,'pad','Vhikk Drone',{vol:.75,space:.55}); tr(p,'ghost','SMR Arcs',{vol:.9,space:.65,echo:.25}); tr(p,'sample','Ghost Choir Cloud',{vol:.5,space:.8,pan:-.1});
    const I=[0,5,2,6], II=[6,4,2,6], [A,Bs,C,D]=p.scenes;
    A.prog=I; A.notes.pad=[N(0,0,64),N(0,4,64)]; A.notes.ghost=[N(32,0,32),N(32,4,32)]; A.notes.sample=[N(16,7,48)];
    Bs.prog=I; Bs.notes.pad=chordsAt(I,[0,2,4],0,16,4); Bs.notes.ghost=chordsAt(I,[0,4,7],0,16,4); Bs.notes.bass=[N(0,0,16),N(16,-2,16),N(32,-5,16),N(48,-1,16)]; Bs.notes.sample=[N(0,4,32),N(32,2,32)];
    C.prog=I; C.notes={...Bs.notes, pad:chordsAt(I,[0,2,4],0,16,4), ghost:chordsAt(I,[0,4,7],0,16,4), bass:[N(0,0,16),N(16,-2,16),N(32,-5,16),N(48,-1,16)],
      keys:[N(8,7,8),N(20,9,6),N(40,11,8),N(52,13,12)], kick:drumStr('x..o............',4), sample:[N(0,7,64)]};
    D.prog=II; D.notes.pad=chordsAt(II,[0,2,4,6],0,16,4); D.notes.ghost=chordsAt(II,[0,4,9],0,16,4); D.notes.bass=II.map((r,i)=>N(i*16,lowRoot(r),16));
    D.notes.keys=[N(0,13,4),N(6,11,4),N(12,9,4),N(22,7,6),N(32,11,4),N(38,9,4),N(48,8,8)]; D.notes.sample=[N(0,9,64)]; D.notes.kick=drumStr('x..o............',4); D.notes.hat=drumStr('........o.......',4);
    return p;
  },
  'Night Bus': ()=>{
    const p=base({vibe:'Lo-fi',name:'Night Bus',desc:'Lo-fi at 80 BPM in F minor. Swung drums, tine piano sevenths, tape on the bus.',bpm:80,swing:.32,root:5,scale:'Minor',bars:4,chain:[0,0,1,1,2,1,3],
      master:{space:.45,size:3,echo:.3,pump:.12,glue:.45,tape:.7,width:.9,tone:-.45,out:.85}});
    tr(p,'kick','Dusty Boom',{vol:.85}); tr(p,'snare','Lo-fi Snare',{vol:.7,space:.25}); tr(p,'hat','Dust',{vol:.7,pan:.2});
    tr(p,'bass','Round Sub',{vol:.75}); tr(p,'keys','Tine Piano',{vol:.7,space:.35,echo:.15,pan:-.1}); tr(p,'pad','Warm Strings',{vol:.35,space:.5});
    tr(p,'ghost','Breath Organ',{vol:.5,space:.6}); tr(p,'sample','Choir Hit',{vol:.45,space:.5,echo:.3,pan:.25});
    const pr=[0,5,3,4], [A,Bs,C,D]=p.scenes;
    const kick=drumStr('x.........x.....x......x..x.....',4), snare=drumStr('....X.......X..o....X.....o.X...',4), hat=drumStr('X.o.x.o.X.o.x.ooX.o.x.o.X.o.x.o.',4);
    const keys=[...chordsAt(pr,[0,2,4,6],0,9,4),...chordsAt(pr,[2,4,7],10,5,4)];
    const bass=[]; pr.forEach((r,b)=>{const lr=lowRoot(r); bass.push(N(b*16,lr,7),N(b*16+10,lr,3),N(b*16+13,lr+4,3));});
    [A,Bs,C,D].forEach(s=>s.prog=pr);
    A.notes={...A.notes,kick,snare,hat,keys,bass};
    Bs.notes={...Bs.notes,kick,snare,hat,keys,bass,pad:chordsAt(pr,[0,4,7],0,16,4),sample:[N(0,7,8),N(32,9,8)]};
    C.notes={...C.notes,kick,snare:drumStr('....X.......X.......X.......X..o',4),hat,keys:chordsAt(pr,[0,2,4,6],0,14,4)};
    D.notes={...D.notes,keys:chordsAt(pr,[0,2,4,6],0,16,4),pad:chordsAt(pr,[0,4,7],0,16,4),ghost:chordsAt(pr,[0,4],0,16,4)};
    return p;
  },
  'Glasshouse': ()=>{
    const p=base({vibe:'House',name:'Glasshouse',desc:'Deep house at 122 BPM in A dorian. Open hats on the off-beat and kick-driven pump on the music bus.',bpm:122,swing:.12,root:9,scale:'Dorian',bars:2,chain:[2,0,0,1,3,3],
      master:{space:.4,size:2.5,echo:.35,pump:.65,glue:.5,tape:.35,width:1.1,tone:.1,out:.85}});
    tr(p,'kick','Tight House',{vol:.9}); tr(p,'snare','Big Clap',{vol:.6,space:.3}); tr(p,'hat','Closed Tick',{vol:.55,pan:.15});
    tr(p,'bass','Pluck Bass',{vol:.75}); tr(p,'keys','Soft Pluck',{vol:.6,space:.35,echo:.4,pan:-.15}); tr(p,'pad','Glass Choir',{vol:.45,space:.6});
    tr(p,'ghost','SMR Arcs',{vol:.55,space:.6,echo:.2}); tr(p,'sample','Choir Hit',{vol:.45,space:.4,echo:.35,pan:.2});
    const pr=[0,3], [A,Bs,C,D]=p.scenes;
    const kick=drumStr('x...x...x...x...',2), clap=drumStr('....x.......x...',2), hat=drumStr('o.X.o.X.o.X.ooX.',2);
    const bass=[]; pr.forEach((r,b)=>{const lr=lowRoot(r); bass.push(N(b*16+2,lr,2),N(b*16+6,lr+7,1),N(b*16+10,lr,2),N(b*16+13,lr+4,2));});
    const keys=[...chordsAt(pr,[0,2,4,6],3,2,2),...chordsAt(pr,[0,2,4,6],10,2,2),...[0,2,4,6].map(x=>N(30,pr[1]+x,2))];
    [A,Bs,C,D].forEach(s=>s.prog=pr);
    A.notes={...A.notes,kick,snare:clap,hat,bass,keys};
    Bs.notes={...Bs.notes,hat:drumStr('..X...X...X...X.',2),keys,pad:chordsAt(pr,[0,4,9],0,16,2),ghost:[N(0,0,32),N(0,4,32),N(0,7,32)]};
    C.notes={...C.notes,kick,hat,bass};
    D.notes={...D.notes,kick,snare:clap,hat,bass,keys,pad:chordsAt(pr,[0,4,9],0,16,2),sample:[N(6,4,2),N(22,7,2)]};
    return p;
  },
  'Bhairav Dawn': ()=>{
    const p=base({vibe:'Raga',name:'Bhairav Dawn',desc:'Raga Bhairav colours at 90 BPM. A tanpura-like drone on Sa and Pa, a marimba phrase, rim and shaker in a 3-3-2 lilt.',bpm:90,swing:.18,root:1,scale:'Bhairav',bars:4,chain:[0,1,1,2,2,3],
      master:{space:.6,size:5,echo:.4,pump:0,glue:.3,tape:.3,width:1.2,tone:-.1,out:.85}});
    tr(p,'kick','Felt',{vol:.8}); tr(p,'snare','Rimshot',{vol:.5,space:.35,pan:-.15}); tr(p,'hat','Shaker',{vol:.45,pan:.25});
    tr(p,'bass','Drone Bass',{vol:.55}); tr(p,'keys','Marimba',{vol:1,space:.45,echo:.3}); tr(p,'pad','Vhikk Drone',{vol:.6,space:.5});
    tr(p,'ghost','Bowed Metal',{vol:.55,space:.7,echo:.2}); tr(p,'sample','Frozen',{vol:.45,space:.8});
    const [A,Bs,C,D]=p.scenes;
    const drone=[N(0,0,64),N(0,4,64),N(0,7,64)];
    const mel=[N(0,4,3),N(3,5,3),N(6,6,2),N(8,7,4),N(12,6,2),N(14,5,2),N(16,4,6),N(22,3,2),N(24,2,4),N(28,1,2),N(30,2,2),N(32,2,3),N(35,3,3),N(38,4,2),N(40,5,4),N(44,6,2),N(46,7,2),N(48,8,4),N(52,7,4),N(56,6,2),N(58,5,2),N(60,4,4)];
    const perc={kick:drumStr('x.......x..x....',4),snare:drumStr('...x..x...x..x.o',4),hat:drumStr('x.o.x.o.x.o.x.oo',4)};
    [A,Bs,C,D].forEach(s=>s.prog=[0,4,0,3]);
    A.notes={...A.notes,pad:drone,keys:mel};
    Bs.notes={...Bs.notes,pad:drone,keys:mel,...perc,bass:[N(0,0,32),N(32,-3,32)]};
    C.notes={...Bs.notes,ghost:[N(0,0,32),N(0,4,32),N(32,5,32),N(32,7,32)],sample:[N(0,7,64)]};
    D.notes={...D.notes,pad:drone,ghost:[N(0,0,64),N(0,4,64)],keys:[N(0,7,8),N(16,4,8),N(32,8,8),N(48,7,16)]};
    return p;
  },
  'Afterglow': ()=>{
    const p=base({vibe:'Techno',name:'Afterglow',desc:'Minimal techno at 126 BPM in F♯ phrygian. Rolling acid bass between the kicks, metallic hats, resonator in the break.',bpm:126,swing:.05,root:6,scale:'Phrygian',bars:2,chain:[0,0,1,1,2,3,3],
      master:{space:.35,size:3,echo:.45,pump:.5,glue:.55,tape:.45,width:1.05,tone:.05,out:.85}});
    tr(p,'kick','Techno Thud',{vol:.9}); tr(p,'snare','Rimshot',{vol:.5,space:.3,echo:.35,pan:.2}); tr(p,'hat','Metal 808',{vol:.5,pan:-.15});
    tr(p,'bass','Acid-ish',{vol:.85,echo:.1}); tr(p,'keys','Hollow Lead',{vol:.4,space:.4,echo:.5}); tr(p,'pad','Dark Matter',{vol:.5,space:.5});
    tr(p,'ghost','SMR Arcs',{vol:.6,space:.6,echo:.3}); tr(p,'sample','Stutter',{vol:.4,space:.3,echo:.4});
    const [A,Bs,C,D]=p.scenes;
    const kick=drumStr('x...x...x...x...',2), hat=drumStr('o.X.ooX.o.X.ooX.',2), rim=drumStr('...x..x....x..x.',2);
    const bass=[]; for(let s=0;s<32;s++){ if(s%4===0) continue; const m=s%4; let n=m===2?7:0; if(s===29) n=1; if(s===13) n=3; bass.push(N(s,n,1)); }
    const keys=[N(12,7,3),N(28,8,3)];
    [A,Bs,C,D].forEach(s=>s.prog=[0,1]);
    A.notes={...A.notes,kick,hat,bass};
    Bs.notes={...Bs.notes,kick,hat,bass,snare:rim,keys};
    C.notes={...C.notes,hat:drumStr('..X...X...X...X.',2),pad:[N(0,0,32),N(0,2,32),N(0,4,32)],ghost:[N(0,0,32),N(0,4,32),N(0,7,32)],sample:[N(14,7,2)]};
    D.notes={...D.notes,kick,hat,bass,snare:rim,keys,pad:[N(0,0,32),N(0,2,32),N(0,4,32)]};
    return p;
  },
  'Neon Drive': ()=>{
    const p=base({name:'Neon Drive',desc:'Synthwave at 100 BPM in A minor. Gated snare, a sixteenth-note arp and pulsing octave bass under a Juno-style pad.',chain:[0,1,1,2,2,3,1]});
    applyVibeTo(p,'Synthwave',false); Object.assign(p,{bpm:100,root:9,bars:4});
    const pr=[0,5,2,6], [A,Bs,C,D]=p.scenes; [A,Bs,C,D].forEach(s=>s.prog=pr);
    const kick=drumStr('x...x...x...x...',4), snare=drumStr('....X.......X...',4), hat=drumStr('x.o.x.o.x.o.x.oo',4);
    const bass=[]; pr.forEach((r,b)=>{const lr=lowRoot(r); for(let s=0;s<16;s+=2) bass.push(N(b*16+s,(s/2)%2?lr+7:lr,2));});
    const pat=[0,2,4,7,9,7,4,2], arp=[]; pr.forEach((r,b)=>{ for(let s=0;s<16;s++) arp.push(N(b*16+s,r+pat[s%8],1)); });
    const pad=chordsAt(pr,[0,2,4],0,16,4);
    A.notes={...A.notes,pad,keys:arp};
    Bs.notes={...Bs.notes,kick,snare,hat,bass,keys:arp,pad};
    C.notes={...Bs.notes,sample:[N(0,7,8),N(32,9,8)],ghost:chordsAt(pr,[0,4],0,16,4)};
    D.notes={...D.notes,pad,keys:arp,hat:drumStr('x.x.x.x.x.x.x.x.',4)};
    return p;
  },
  'Plaza 1995': ()=>{
    const p=base({name:'Plaza 1995',desc:'Vaporwave at 72 BPM in F major. Slowed electric piano sevenths, a hazy pad, a mall choir and heavy tape wobble.',chain:[0,1,1,2,1,3]});
    applyVibeTo(p,'Vaporwave',false); Object.assign(p,{bpm:72,root:5,bars:4});
    const pr=[1,4,0,3], [A,Bs,C,D]=p.scenes; [A,Bs,C,D].forEach(s=>s.prog=pr);
    const keys=[...chordsAt(pr,[0,2,4,6],0,7,4),...chordsAt(pr,[0,2,4,6],10,5,4)];
    const bass=[]; pr.forEach((r,b)=>{const lr=lowRoot(r); bass.push(N(b*16,lr,6),N(b*16+8,lr,3),N(b*16+12,lr+4,3));});
    const drums={kick:drumStr('x.......x.......',4),snare:drumStr('....x.......x...',4),hat:drumStr('o...o.o.o...o.o.',4)};
    const pad=chordsAt(pr,[0,2,4],0,16,4), sample=[N(0,4,32),N(32,2,32)];
    A.notes={...A.notes,keys,pad,sample};
    Bs.notes={...Bs.notes,keys,pad,sample,bass,...drums};
    C.notes={...Bs.notes,ghost:chordsAt(pr,[0,4],0,16,4)};
    D.notes={...D.notes,keys,sample};
    return p;
  },
  'Night Shift': ()=>{
    const p=base({name:'Night Shift',desc:'Trap at 140 BPM in C♯ harmonic minor. 808 bass that follows the kick, rolling hi-hat triplets and a dark bell melody.',chain:[0,1,1,2,1,3]});
    applyVibeTo(p,'Trap',false); Object.assign(p,{bpm:140,root:1,bars:2});
    const pr=[0,5], [A,Bs,C,D]=p.scenes; [A,Bs,C,D].forEach(s=>s.prog=pr);
    const kick=drumStr('x......x..x.....x.....x...x..x..',2), clap=drumStr('........x...............x......o',2);
    const hats=(more)=>{ const h=[]; for(let s=0;s<32;s++){ if(s%2===0){ const n={s,v:.8}; if(s===6||s===22) n.r=3; if(s===14||s===30||(more&&(s===10||s===26))) n.r=2; h.push(n);} else if(s>=28) h.push({s,v:.45}); } return h; };
    const bass=[]; const ks=kick.map(n=>n.s); ks.forEach((s,i)=>{ const nx=i<ks.length-1?ks[i+1]:32, r=lowRoot(pr[Math.floor(s/16)]); bass.push(N(s,r,clamp(nx-s,1,8))); });
    const keys=[N(0,7,2),N(3,6,2),N(6,7,4),N(12,4,2),N(16,5,3),N(19,4,3),N(22,2,4),N(28,4,2)];
    const pad=chordsAt(pr,[0,2,4],0,16,2);
    A.notes={...A.notes,keys,pad};
    Bs.notes={...Bs.notes,kick,snare:clap,hat:hats(false),bass,keys,pad};
    C.notes={...Bs.notes,hat:hats(true),ghost:[N(0,0,32),N(0,4,32)]};
    D.notes={...D.notes,keys,pad,kick:drumStr('x...............',2)};
    return p;
  },
  'Blank canvas': ()=>base({name:'Untitled',desc:'An empty project. Press New idea, or start clicking steps.',bpm:100,root:0,scale:'Minor',bars:2,chain:[0]}),
};


