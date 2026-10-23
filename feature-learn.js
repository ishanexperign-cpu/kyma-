/* =========================================================
   LEARN A STYLE FROM A TRACK
   Drop in any song: Kyma measures its tempo, swing, key, brightness, density and the
   16-step groove of its kick, snare and hat bands, then turns that into a new genre chip.
   Only those numbers are kept, never the audio.
   ========================================================= */
var LEARNED=[];
try{ const a=JSON.parse(localStorage.getItem('kyma.styles')||localStorage.getItem('ghostloop.styles')||'[]'); if(Array.isArray(a)) LEARNED=a.slice(0,24); }catch(e){}
function saveLearned(){ try{ localStorage.setItem('kyma.styles',JSON.stringify(LEARNED)); }catch(e){} }
function fftMag(re){ // in-place radix-2 FFT of a real frame, returns magnitudes of the first half
  const n=re.length, im=new Float32Array(n);
  for(let i=1,j=0;i<n;i++){ let b=n>>1; for(;j&b;b>>=1) j^=b; j^=b; if(i<j){ const t=re[i]; re[i]=re[j]; re[j]=t; } }
  for(let len=2;len<=n;len<<=1){ const a=-2*Math.PI/len, wr=Math.cos(a), wi=Math.sin(a);
    for(let i=0;i<n;i+=len){ let cr=1,ci=0; for(let j=0;j<len/2;j++){ const ur=re[i+j],ui=im[i+j], xr=re[i+j+len/2]*cr-im[i+j+len/2]*ci, xi=re[i+j+len/2]*ci+im[i+j+len/2]*cr;
      re[i+j]=ur+xr; im[i+j]=ui+xi; re[i+j+len/2]=ur-xr; im[i+j+len/2]=ui-xi; const t=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=t; } } }
  const m=new Float32Array(n/2); for(let i=0;i<n/2;i++) m[i]=Math.hypot(re[i],im[i]); return m;
}
async function analyseTrack(buf,onP){
  const secs=Math.min(buf.duration,180), SR=22050, len=Math.floor(secs*SR);
  const oc=new OfflineAudioContext(3,len,SR), src=oc.createBufferSource(); src.buffer=buf; const mg=oc.createChannelMerger(3);
  const lo=bq(oc,'lowpass',150,.7), md=bq(oc,'bandpass',2500,.6), hi=bq(oc,'highpass',6500,.7); src.connect(lo).connect(mg,0,0); src.connect(md).connect(mg,0,1); src.connect(hi).connect(mg,0,2); mg.connect(oc.destination); src.start();
  onP&&onP(.1); const bands=await oc.startRendering(); onP&&onP(.35);
  const hop=256, F=Math.floor(len/hop), env=[0,1,2].map(c=>{ const d=bands.getChannelData(c), e=new Float32Array(F); for(let f=0;f<F;f++){ let s=0; for(let i=f*hop;i<f*hop+hop;i++) s+=d[i]*d[i]; e[f]=Math.log(1e-6+s); } return e; });
  const flux=env.map(e=>{ const o=new Float32Array(F); for(let f=1;f<F;f++) o[f]=Math.max(0,e[f]-e[f-1]); return o; });
  const on=new Float32Array(F); for(let f=0;f<F;f++) on[f]=flux[0][f]*1.2+flux[1][f]+flux[2][f]*.8;
  const fps=SR/hop; let best=0,bestLag=0;
  for(let bpm=60;bpm<=180;bpm+=.5){ const lag=fps*60/bpm; let s=0,c=0; for(let f=Math.ceil(lag);f<F;f++){ const l=f-lag, i=Math.floor(l), fr=l-i; s+=on[f]*(on[i]*(1-fr)+on[i+1]*fr); c++; }
    const w=Math.exp(-Math.pow(Math.log2(bpm/112),2)*1.2), v=s/c*w; if(v>best){ best=v; bestLag=lag; } }
  const tempo=60*fps/bestLag; let ph=0,phs=-1; for(let p=0;p<bestLag;p+=1){ let s=0; for(let t=p;t<F;t+=bestLag) s+=on[Math.round(t)]||0; if(s>phs){ phs=s; ph=p; } }
  const beats=[]; for(let t=ph;t<F;t+=bestLag) beats.push(t);
  let dP=0,dS=-1; for(let k=0;k<4;k++){ let s=0; for(let i=k;i<beats.length;i+=4) s+=flux[0][Math.round(beats[i])]||0; if(s>dS){ dS=s; dP=k; } }
  const grid=[0,1,2].map(()=>new Float32Array(16)); let bars=0;
  for(let i=dP;i+4<beats.length;i+=4){ const a=beats[i], L=beats[i+4]-a; for(let st=0;st<16;st++){ const c=a+L*st/16, w=L/64; for(let b=0;b<3;b++){ let m=0; for(let f=Math.floor(c-w);f<=Math.ceil(c+w);f++) m=Math.max(m,flux[b][f]||0); grid[b][st]+=m; } } bars++; }
  const norm=g=>{ const a=Array.from(g), mean=a.reduce((x,y)=>x+y,0)/16, sd=Math.sqrt(a.reduce((x,y)=>x+(y-mean)*(y-mean),0)/16)||1; return a.map(v=>+((v-mean)/sd).toFixed(2)); };
  const grids=grid.map(norm);
  const offs=[]; for(let i=0;i+1<beats.length;i++){ const a=beats[i], L=beats[i+1]-a; let m=0,at=-1; for(let f=Math.floor(a+L*.35);f<=Math.ceil(a+L*.8);f++){ if((on[f]||0)>m){ m=on[f]; at=f; } } if(at>0&&m>.5) offs.push((at-a)/L); }
  offs.sort((x,y)=>x-y); const off=offs.length?offs[Math.floor(offs.length/2)]:.5;
  onP&&onP(.55);
  // key + brightness from FFT frames of the mono mix
  const oc2=new OfflineAudioContext(1,Math.floor(secs*11025),11025), s2=oc2.createBufferSource(); s2.buffer=buf; s2.connect(oc2.destination); s2.start(); const mono=(await oc2.startRendering()).getChannelData(0);
  const N=4096, chroma=new Float64Array(12); let cen=0,cn=0; const win=new Float32Array(N); for(let i=0;i<N;i++) win[i]=.5-.5*Math.cos(2*Math.PI*i/N);
  for(let o=0;o+N<mono.length;o+=4096){ const fr=new Float32Array(N); for(let i=0;i<N;i++) fr[i]=mono[o+i]*win[i]; const m=fftMag(fr); let num=0,den=0;
    for(let k=1;k<N/2;k++){ const hz=k*11025/N; num+=hz*m[k]; den+=m[k]; if(hz<80||hz>2000) continue; const pc=((Math.round(12*Math.log2(hz/440))+69)%12+12)%12; chroma[pc]+=m[k]; }
    if(den>0){ cen+=num/den; cn++; } }
  onP&&onP(.85);
  const MAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88], MIN=[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
  const corr=(P,r)=>{ let mx=0,my=0; for(let i=0;i<12;i++){ mx+=P[i]; my+=chroma[(i+r)%12]; } mx/=12; my/=12; let a=0,b=0,c=0; for(let i=0;i<12;i++){ const x=P[i]-mx, y=chroma[(i+r)%12]-my; a+=x*y; b+=x*x; c+=y*y; } return a/Math.sqrt(b*c+1e-12); };
  let key={r:0,mode:'major',c:-1}; for(let r=0;r<12;r++){ const a=corr(MAJ,r), b=corr(MIN,r); if(a>key.c) key={r,mode:'major',c:a}; if(b>key.c) key={r,mode:'minor',c:b}; }
  let onsets=0; const thr=(()=>{ const s=[...on].sort((a,b)=>a-b); return s[Math.floor(s.length*.9)]; })(); for(let f=1;f<F-1;f++) if(on[f]>thr&&on[f]>=on[f-1]&&on[f]>=on[f+1]) onsets++;
  const rmsA=env[0].map((v,i)=>Math.exp(v)+Math.exp(env[1][i])+Math.exp(env[2][i])), seg=24, arc=[]; for(let i=0;i<seg;i++){ let s=0,c=0; for(let f=Math.floor(i*F/seg);f<Math.floor((i+1)*F/seg);f++){ s+=rmsA[f]; c++; } arc.push(s/(c||1)); }
  const am=Math.max(...arc)||1;
  return {tempo:+tempo.toFixed(1),off:+off.toFixed(3),key,centroid:Math.round(cen/(cn||1)),density:+(onsets/secs).toFixed(2),grids,arc:arc.map(v=>+(v/am).toFixed(2)),bars,secs:+secs.toFixed(1)};
}
function patternFromGrid(g,hiT,loT){ return Array.from(g,v=>v>=hiT?'x':v>=loT?'o':'.').join(''); }
function styleFromAnalysis(name,a){
  const id='l'+Date.now().toString(36), feel='learned_'+id, bpm=a.tempo;
  // nearest built-in genre by tempo, density and brightness gives the instruments and the mix
  let best=null; Object.entries(GENRES).forEach(([gn,g])=>{ if(gn.startsWith('★')) return; const mid=(g.bpm[0]+g.bpm[1])/2, sw=clamp((a.off-.5)*2.2,0,.45), d=Math.abs(Math.log2(bpm/mid))*3+(QUANTIZED.has(g.feel)?(sw>.1?.5:a.density>3?0:.6):(a.density>3&&sw<.08?.4:0)); if(!best||d<best.d) best={gn,g,d}; });
  const base=best.g, kick=patternFromGrid(a.grids[0],1.0,.55), snare=patternFromGrid(a.grids[1],1.1,.7), hat=patternFromGrid(a.grids[2],.6,.1);
  const k2=kick[0]==='.'?'x'+kick.slice(1):kick;
  const bassRh=[]; let last=-1; for(let i=0;i<16;i++) if(k2[i]!=='.'){ if(last>=0) bassRh.push([last,i-last]); last=i; } if(last>=0) bassRh.push([last,16-last]);
  const swing=clamp((a.off-.5)*2.2,0,.45), minor=a.key.mode==='minor', fast=bpm>=110, bright=a.centroid>1500;
  const mood=minor?(fast?(a.density>5&&a.centroid>1800?'Hype':a.centroid>1400?'Cool':'Dark'):(bright?'Cool':'Sad')):(fast?(a.density>3?'Upbeat':'Happy'):(bright?'Hopeful':'Calm'));
  return {id,name,feel,bpm,swing:+swing.toFixed(2),key:a.key,mood,base:best.gn,centroid:a.centroid,density:a.density,
    drums:[{k:k2,s:snare,h:hat}],bass:[bassRh.length?bassRh:[[0,16]]],chords:CH_RH[base.feel]||CH_RH.pop,insts:{...base.insts},master:{...(base.master||{}),tone:clamp((a.centroid-1300)/2600,-.5,.3)},arc:a.arc};
}
function registerLearned(st){
  const name='★ '+st.name; GENRES[name]={feel:st.feel,bpm:[Math.max(40,Math.round(st.bpm-4)),Math.round(st.bpm+4)],swing:st.swing,human:.4,insts:st.insts,master:st.master,learned:st};
  DRUM_RH[st.feel]=st.drums; BASS_RH[st.feel]=st.bass; CH_RH[st.feel]=st.chords;
  if(!GENRE_ORDER.includes(name)) GENRE_ORDER.unshift(name);
}
LEARNED.forEach(registerLearned);
async function learnFromFile(file){
  ensureAudio(); const name=file.name.replace(/\.[^.]+$/,'').replace(/\s*\(.*?\)\s*/g,' ').replace(/[_]+/g,' ').replace(/\s+-\s+/g,' · ').replace(/\s+/g,' ').trim().slice(0,28)||'My style';
  hud('Learning a style from '+name,'0%',0,'busy');
  try{ const buf=await ac.decodeAudioData(await file.arrayBuffer()); const a=await analyseTrack(buf,f=>hud('Learning a style from '+name,Math.round(f*100)+'%',f,'busy'));
    const st=styleFromAnalysis(name,a); LEARNED=LEARNED.filter(x=>x.name!==st.name); LEARNED.unshift(st); LEARNED=LEARNED.slice(0,24); saveLearned();
    Object.keys(GENRES).filter(k=>k==='★ '+st.name).forEach(k=>{ delete GENRES[k]; const i=GENRE_ORDER.indexOf(k); if(i>=0) GENRE_ORDER.splice(i,1); });
    registerLearned(st); hideHud();
    MAGIC.genre='★ '+st.name; MAGIC.mood=st.mood; MAGIC.tab='genre'; saveMagic(); renderMagicControls(); buildDeck();
    toast(`Learned “${st.name}”: ${st.bpm} BPM, ${NOTE_NAMES[st.key.r]} ${st.key.mode}, swing ${Math.round(st.swing*100)}%, closest to ${st.base}. It’s now a genre chip.`,[{label:'Use its key and tempo',fn:()=>{ pushHist(); S.bpm=Math.round(st.bpm); S.root=st.key.r; S.scale=st.key.mode==='minor'?'Minor':'Major'; S.swing=st.swing; if(G) applyGraph(G); persist(); renderHeader(); renderMagicControls(); buildDeck(); }},{label:'Make a track',fn:craftTrack}],12000);
  }catch(e){ console.error(e); hideHud(); toast('That file could not be read. Try a WAV, MP3 or M4A.'); }
}
function forgetLearned(name){ const st=LEARNED.find(x=>'★ '+x.name===name); if(!st) return; LEARNED=LEARNED.filter(x=>x!==st); saveLearned(); delete GENRES[name]; const i=GENRE_ORDER.indexOf(name); if(i>=0) GENRE_ORDER.splice(i,1); if(MAGIC.genre===name) MAGIC.genre='Any'; saveMagic(); renderMagicControls(); buildDeck(); }
/* learned styles are registered at load; restore a learned genre the viewer had picked */
try{ const m=JSON.parse(localStorage.getItem('kyma.magic')||localStorage.getItem('ghostloop.magic')||'{}'); if(m.genre&&GENRES[m.genre]) MAGIC.genre=m.genre; }catch(e){}
