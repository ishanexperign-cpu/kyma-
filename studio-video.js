/* KYMA · studio/video — the Video studio
   Load a clip; Kyma reads its cuts, motion and speech, scores music that lands on the cuts and
   dresses each cut with a transition sound. The picture sits on the timeline as the top lane, so the
   music is built, edited and mixed against it with every Compose tool. Nothing leaves the browser. */
var V={file:null,url:null,name:'',dur:0,w:0,h:0,cuts:[],motion:[],bright:[],warm:[],thumbs:[],speech:[],audio:null,step:.125,analysing:false,
  src:null,vgain:null,vol:.9,mute:false,music:1,duck:true,fit:true,fx:'standard',lastStep:-1,exporting:null,remembered:null};
try{ const v=JSON.parse(localStorage.getItem('kyma.video')||localStorage.getItem('ghostloop.video')||'{}'); ['vol','music'].forEach(k=>{ if(isFinite(v[k])) V[k]=clamp(+v[k],0,1.5); }); ['duck','fit'].forEach(k=>{ if(typeof v[k]==='boolean') V[k]=v[k]; }); if(['off','subtle','standard','trailer'].includes(v.fx)) V.fx=v.fx; }catch(e){}
function vdSave(){ persist(); try{ localStorage.setItem('kyma.video',JSON.stringify({vol:V.vol,music:V.music,duck:V.duck,fit:V.fit,fx:V.fx})); }catch(e){} }
const vdEl=()=>$('vdVideo');

/* ---------- loading + analysis ---------- */
async function vdLoad(file){
  if(!file) return; if(V.url) URL.revokeObjectURL(V.url);
  V.file=file; V.name=file.name; V.url=URL.createObjectURL(file); V.cuts=[]; V.motion=[]; V.thumbs=[]; V.speech=[]; V.audio=null;
  const v=vdEl(); v.src=V.url; v.muted=false; v.volume=1; $('vdEmpty').hidden=true; $('vdDrop').classList.add('loaded');
  await new Promise((res,rej)=>{ v.onloadedmetadata=res; v.onerror=()=>rej(new Error('This video format can’t be played here. Try MP4 (H.264) or WebM.')); }).catch(e=>{ toast(e.message); throw e; });
  V.dur=v.duration; V.w=v.videoWidth; V.h=v.videoHeight;
  ensureAudio(); if(!V.src){ try{ V.src=ac.createMediaElementSource(v); V.vgain=gainN(ac,V.mute?0:V.vol); V.src.connect(V.vgain).connect(ac.destination); }catch(e){ console.warn(e); } }
  persist(); renderVideo(); renderTracks(); await vdAnalyse();
}
async function vdAnalyse(){
  if(!V.url||V.analysing) return; V.analysing=true; renderVideo();
  const probe=document.createElement('video'); probe.muted=true; probe.preload='auto'; probe.src=V.url; probe.playsInline=true;
  await new Promise(r=>{ probe.onloadeddata=r; probe.onerror=r; });
  const W=48,H=27, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const g=cv.getContext('2d',{willReadFrequently:true});
  const tc=document.createElement('canvas'), TW=112, TH=Math.round(TW*(V.h||9)/(V.w||16)); tc.width=TW; tc.height=TH; const tg=tc.getContext('2d');
  const step=V.step=Math.max(.125,V.dur/700), N=Math.floor(V.dur/step), score=[], motion=[], bright=[], warm=[]; let prev=null, prevH=null; V.thumbs=[]; const thumbEvery=Math.max(1,Math.floor(N/48));
  for(let i=0;i<N;i++){
    probe.currentTime=Math.min(V.dur-.05,i*step+.01); await new Promise(r=>{ probe.onseeked=r; setTimeout(r,800); });
    g.drawImage(probe,0,0,W,H); const d=g.getImageData(0,0,W,H).data, hist=new Float32Array(48); let mo=0,br=0,wa=0;
    for(let p=0;p<d.length;p+=4){ hist[d[p]>>4]++; hist[16+(d[p+1]>>4)]++; hist[32+(d[p+2]>>4)]++; br+=d[p]*.3+d[p+1]*.59+d[p+2]*.11; wa+=d[p]-d[p+2]; if(prev) mo+=Math.abs(d[p]-prev[p])+Math.abs(d[p+1]-prev[p+1])+Math.abs(d[p+2]-prev[p+2]); }
    const px=W*H; let chi=0; if(prevH) for(let k=0;k<48;k++){ const a=hist[k]/px, b=prevH[k]/px; chi+=(a-b)*(a-b)/(a+b+1e-6); }
    score.push(prevH?chi:0); motion.push(prev?mo/(px*3*255):0); bright.push(br/px/255); warm.push(wa/px/255); prev=d; prevH=hist;
    if(i%thumbEvery===0){ tg.drawImage(probe,0,0,TW,TH); V.thumbs.push({t:i*step,img:tc.toDataURL('image/jpeg',.6)}); }
    if(i%6===0){ $('vdStatus').textContent=`Reading frames… ${Math.round(i/N*100)}%`; $('vdBar').style.width=Math.round(i/N*70)+'%'; await new Promise(r=>setTimeout(r,0)); }
  }
  // cuts: histogram jumps that stand well above the local level
  const cuts=[]; const med=a=>{ const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]||0; };
  for(let i=1;i<score.length-1;i++){ const lo=Math.max(0,i-20), loc=med(score.slice(lo,i+20)), thr=Math.max(.18,loc*5);
    if(score[i]>thr&&score[i]>=score[i-1]&&score[i]>=score[i+1]){ const t=i*step; if(!cuts.length||t-cuts[cuts.length-1].t>.45) cuts.push({t:+t.toFixed(3),s:score[i]}); else if(score[i]>cuts[cuts.length-1].s) cuts[cuts.length-1]={t:+t.toFixed(3),s:score[i]}; } }
  const smax=Math.max(.001,...cuts.map(c=>c.s)); cuts.forEach(c=>c.s=+(c.s/smax).toFixed(2));
  // motion without the cut spikes, smoothed over ~1 s
  const mclean=motion.map((m,i)=>cuts.some(c=>Math.abs(c.t-i*step)<step*1.5)?null:m); const win=Math.max(1,Math.round(1/step)), mot=[];
  for(let i=0;i<mclean.length;i++){ let s=0,c=0; for(let j=i-win;j<=i+win;j++){ if(mclean[j]!=null){ s+=mclean[j]; c++; } } mot.push(c?s/c:0); }
  const mm=Math.max(.0001,...mot); V.motion=mot.map(v=>+(v/mm).toFixed(3)); V.bright=bright; V.warm=warm; V.cuts=cuts;
  $('vdStatus').textContent='Listening to the video’s sound…'; $('vdBar').style.width='80%';
  try{ const ab=await V.file.arrayBuffer(); V.audio=await ac.decodeAudioData(ab); V.speech=vdSpeech(V.audio); }catch(e){ V.audio=null; V.speech=[]; }
  $('vdBar').style.width='100%'; V.analysing=false; renderVideo(); renderTracks(); persist();
  if(S.len*stepDur()<V.dur-.5&&!S.tracks.some(t=>t.clips.length)){ S.len=Math.ceil(V.dur/stepDur()/16)*16; fitZoom(); }
  toast(`${V.cuts.length} cut${V.cuts.length===1?'':'s'} found in ${fmtMS(V.dur)} of video${V.speech.length?`, speech in ${V.speech.length} place${V.speech.length>1?'s':''}`:''}. Press Score it to write music that lands on them.`,[{label:'Score it',fn:vdScore}],10000);
}
function vdSpeech(buf){ // simple voice activity: energy in the speech band well above the floor, held for a moment
  const sr=buf.sampleRate, ch=buf.getChannelData(0), hop=Math.round(sr*.05), n=Math.floor(ch.length/hop), e=new Float32Array(n), z=new Float32Array(n);
  for(let i=0;i<n;i++){ let s=0,zc=0; for(let j=i*hop;j<(i+1)*hop;j++){ s+=ch[j]*ch[j]; if(j>i*hop&&(ch[j]>=0)!==(ch[j-1]>=0)) zc++; } e[i]=Math.sqrt(s/hop); z[i]=zc/hop; }
  const sorted=[...e].sort((a,b)=>a-b), floor=sorted[Math.floor(n*.15)]||0, thr=Math.max(.01,floor*4), out=[]; let on=-1, hang=0;
  for(let i=0;i<n;i++){ const sp=e[i]>thr&&z[i]>.02&&z[i]<.25; if(sp){ if(on<0) on=i; hang=6; } else if(on>=0&&--hang<=0){ if((i-on)*.05>.4) out.push({a:on*.05,b:i*.05}); on=-1; } }
  if(on>=0) out.push({a:on*.05,b:n*.05}); return out;
}
function vdSuggest(){
  if(!V.motion.length) return; const avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1), mo=avg(V.motion), br=avg(V.bright), wa=avg(V.warm), cutRate=V.cuts.length/Math.max(1,V.dur);
  let mood='Chill'; if(cutRate>.7||mo>.55) mood=br<.35?'Hype':'Energetic'; else if(cutRate>.35||mo>.35) mood=wa>.05?'Upbeat':'Cool'; else if(br<.3) mood=wa<0?'Mysterious':'Dramatic'; else mood=wa>.06?'Happy':'Dreamy';
  const genre=MOODS[mood].genres[0]; MAGIC.mood=mood; MAGIC.genre=genre; MAGIC.energy=MOODS[mood].energy; saveMagic(); renderMagicControls(); renderVideo();
  toast(`From the picture: ${mood.toLowerCase()} ${genre.toLowerCase()} (${cutRate.toFixed(2)} cuts a second, ${br>.5?'bright':br<.3?'dark':'mid'} and ${wa>.04?'warm':wa<-.02?'cool':'neutral'}).`);
}

/* ---------- scoring ---------- */
function fitTempo(lo,hi){ // choose the tempo whose beat grid lands closest to the strongest cuts
  if(!V.cuts.length) return Math.round((lo+hi)/2); let best=null;
  for(let b=lo;b<=hi;b+=.5){ const beat=60/b; let s=0; V.cuts.forEach(c=>{ const ph=c.t/beat, d=Math.abs(ph-Math.round(ph))*beat; const d8=Math.abs(ph*2-Math.round(ph*2))*beat/2; s+=c.s*(Math.exp(-Math.pow(d/.05,2))+.35*Math.exp(-Math.pow(d8/.04,2))); });
    if(!best||s>best.s) best={b,s}; }
  return Math.round(best.b*2)/2;
}
function planFromVideo(bpm,totalBars){
  const barSec=240/bpm, segs=[]; let starts=[0];
  V.cuts.filter(c=>c.s>.25).forEach(c=>{ const bar=Math.round(c.t/barSec); if(Math.abs(c.t-bar*barSec)<barSec/4&&bar>0&&bar<totalBars-1) starts.push(bar); });
  starts=[...new Set(starts)].sort((a,b)=>a-b); const merged=[0]; starts.forEach(s=>{ if(s-merged[merged.length-1]>=2) merged.push(s); });
  for(let i=0;i<merged.length;i++){ const a=merged[i], b=i+1<merged.length?merged[i+1]:totalBars; if(b>a) segs.push([a,b]); }
  if(segs.length===1&&totalBars>=12){ const a=segs[0]; segs.splice(0,1,[0,Math.round(totalBars*.3)],[Math.round(totalBars*.3),totalBars]); }
  const mAt=(a,b)=>{ const i0=Math.floor(a*barSec/V.step), i1=Math.max(i0+1,Math.floor(b*barSec/V.step)); let s=0,c=0; for(let i=i0;i<i1&&i<V.motion.length;i++){ s+=V.motion[i]; c++; } const cuts=V.cuts.filter(x=>x.t>=a*barSec&&x.t<b*barSec).length/Math.max(.5,(b-a)*barSec); return clamp((c?s/c:0)*.7+cuts*.45,0,1.4); };
  const lv=segs.map(([a,b])=>mAt(a,b)), sorted=[...lv].sort((x,y)=>x-y), hiT=sorted[Math.floor(sorted.length*.66)]??.5, loT=sorted[Math.floor(sorted.length*.33)]??.3;
  // rank the segments: the busiest third become choruses, the quietest calm (or the intro), the rest verses
  const order=lv.map((L,i)=>[L,i]).sort((x,y)=>y[0]-x[0]), rank=new Array(lv.length); order.forEach(([,i],r)=>rank[i]=r/(Math.max(1,lv.length-1)));
  let plan=segs.map(([a,b],i)=>{ const r=rank[i]; let k=segs.length===1?'verse':r<=.34?'chorus':r>=.75?(i===0?'intro':'calm'):'verse'; if(i===0&&k==='chorus'&&segs.length>2) k='verse'; return {...SECTIONS[k],bars:b-a,key:k}; });
  if(plan.length>2&&!plan.some(x=>x.key==='chorus')){ const i=order[0][1]; plan[i]={...SECTIONS.chorus,bars:plan[i].bars,key:'chorus'}; }
  const merged2=[]; plan.forEach(x=>{ const l=merged2[merged2.length-1]; if(l&&l.key===x.key&&x.key!=='chorus') l.bars+=x.bars; else merged2.push({...x}); }); plan=merged2;
  if(plan.length&&plan[plan.length-1].bars>2&&plan[plan.length-1].key!=='chorus') plan[plan.length-1].fout='fade';
  return plan;
}
function vdScore(){
  if(!V.dur){ toast('Load a video first'); return; }
  const M=moodP(), g=genreP(), lo=Math.max(g.bpm[0],M.bpm[0]-8), hi=Math.max(lo,Math.min(g.bpm[1],M.bpm[1]+8));
  const bpm=V.fit&&V.cuts.length?fitTempo(lo,hi):Math.round((lo+hi)/2), barSec=240/bpm, totalBars=Math.max(2,Math.ceil(V.dur/barSec));
  const plan=planFromVideo(bpm,totalBars), button=V.dur<=75;
  if(button&&plan.length){ const last=plan[plan.length-1]; if(last.bars>1){ last.bars-=1; plan.push({...SECTIONS.button,bars:1,key:'button'}); } }
  craftTrack({bpm,plan,secs:V.dur,button,noFx:V.fx!=='off',label:'Scored to '+V.name,len:Math.ceil(V.dur/stepDurFor(bpm))});
  setTimeout(()=>{ if(V.fx!=='off') vdAddFx(true); vdApplyDuck(); const beat=60/bpm, on=V.cuts.filter(c=>{ const ph=c.t/beat*2, d=Math.abs(ph-Math.round(ph))*beat/2; return d<.045; }).length;
    toast(`Scored “${S.name}” at ${bpm} BPM: ${on} of ${V.cuts.length} cuts land on a beat or half-beat${V.fx!=='off'?', and every cut has a transition sound':''}${V.duck&&V.speech.length?'. Music dips under speech':''}.`,[{label:'Undo',fn:undo},{label:'Play',fn:()=>{ seekTo(0); if(!playing) startPlay(); }}],10000); },60);
}
const stepDurFor=b=>60/b/4;
function vdAddFx(quiet){
  if(!V.cuts.length){ if(!quiet) toast('No cuts to dress'); return; }
  const sd=stepDur(); if(!quiet) pushHist();
  const tr=fxTrack(); tr.clips.forEach(c=>{ if(c.name==='Cut FX') c.notes=[]; }); let c=tr.clips.find(x=>x.name==='Cut FX'); if(!c){ c=newClip(0,Math.max(16,S.len),[],{name:'Cut FX'}); tr.clips.push(c); }
  c.start=0; c.offset=0; c.len=Math.max(c.len,Math.ceil(V.dur/sd/16)*16);
  const style=V.fx, strong=V.cuts.filter(x=>x.s>=.6).map(x=>x.t), dark=['Epic','Dark','Tense','Powerful','Dramatic','Mysterious','Hype'].includes(MAGIC.mood);
  let lastT=-9;
  V.cuts.forEach((cut,i)=>{ const st=cut.t/sd, big=cut.s>=.6, gap=cut.t-lastT; lastT=cut.t;
    if(style==='subtle'){ if(big) c.notes.push({t:Math.max(0,st-Math.round(.84/sd)),d:Math.round(1.2/sd),n:2,v:.45}); return; }
    // whoosh peaks on the cut (70% into it), hits and booms start on it, risers end on it
    const wh=Math.max(1,Math.round(1.2/sd)); c.notes.push({t:Math.max(0,st-wh*.7),d:wh,n:2,v:big?.8:.55});
    if(big){ c.notes.push({t:st,d:Math.round(2/sd),n:style==='trailer'?0:(dark?1:7),v:style==='trailer'?.95:.7});
      const room=Math.min(gap,style==='trailer'?4:2.5); if(room>1.2){ const L=Math.round(room*.9/sd); c.notes.push({t:Math.max(0,st-L),d:L,n:style==='trailer'||dark?15:4,v:.6}); } }
    else if(style==='trailer'&&i%2===0) c.notes.push({t:st,d:Math.round(.8/sd),n:13,v:.6});
  });
  if(style==='trailer'){ const end=V.dur/sd; c.notes.push({t:Math.max(0,end-Math.round(4/sd)),d:Math.round(4/sd),n:5,v:.5}); }
  markDirty(); persist(); renderTracks();
  if(!quiet) toast(`${V.cuts.length} cuts dressed with ${style} transition sounds on the FX track.`,[{label:'Undo',fn:undo}]);
}
function vdApplyDuck(){ /* live ducking reads V.speech in the frame loop; export applies it to the mix */ renderVideo(); }

/* ---------- the picture lane on the timeline ---------- */
const THUMB_IMG={};
function thumbImg(src){ if(!THUMB_IMG[src]){ const i=new Image(); i.onload=()=>requestDraw(); i.src=src; THUMB_IMG[src]=i; } return THUMB_IMG[src]; }
const VLANE={id:'video',cursor:'pointer',
  h:()=>V.dur?92:48,
  head(el){
    el.innerHTML=`<div class="tstrip"></div><div class="trow1"><span class="vl-tag">VIDEO</span><b class="vl-name"></b><button class="ms m" title="Mute the video’s own sound">M</button></div>
      <div class="trow3"><input class="tvol" type="range" min="0" max="150" aria-label="Video sound level"><span class="tvl"></span></div>`;
    el.querySelector('.vl-name').textContent=V.dur?V.name:(V.remembered?'Re-attach '+V.remembered:'No video yet');
    const m=el.querySelector('.m'), vol=el.querySelector('.tvol'), vl=el.querySelector('.tvl');
    const show=()=>{ m.setAttribute('aria-pressed',V.mute); vol.value=Math.round(V.vol*100); vl.textContent=V.mute?'muted':Math.round(V.vol*100)+'%'; el.classList.toggle('muted',V.mute); };
    m.onclick=()=>{ V.mute=!V.mute; vdLevel(); show(); vdSave(); };
    vol.oninput=()=>{ V.vol=vol.value/100; vdLevel(); show(); vdSave(); renderVideoLevels(); };
    if(!V.dur){ vol.disabled=true; m.disabled=true; }
    show();
  },
  draw(g,X,k,W,y,h){
    const sd=stepDur(), font=fontMono();
    if(!V.dur){ g.fillStyle=css['--muted']; g.font='500 11px '+font; g.fillText(V.analysing?'Reading the video…':'Drop a video on the player above. Its frames, cuts and speech line up here with your tracks.',10,y+h/2+4); return; }
    const x0=X(0), x1=X(V.dur/sd), th=h-24, n=V.thumbs.length, ar=(V.w||16)/(V.h||9), tw=Math.max(24,th*ar);
    if(n){ const every=n>1?V.thumbs[1].t-V.thumbs[0].t:V.dur;
      for(let x=Math.max(x0,-tw);x<Math.min(x1,W);x+=tw){ const t=(x-x0)/k*sd, i=clamp(Math.round(t/every),0,n-1), im=thumbImg(V.thumbs[i].img), w=Math.min(tw,x1-x);
        if(im.complete&&im.naturalWidth){ const sw=im.naturalWidth*(w/tw); g.drawImage(im,0,0,sw,im.naturalHeight,x,y+2,w,th); } } }
    g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x0,y+2,x1-x0,th);
    V.speech.forEach(r=>{ g.fillStyle=css['--t-pad']||'#a7ad93'; g.globalAlpha=.75; g.fillRect(X(r.a/sd),y+h-9,Math.max(2,X(r.b/sd)-X(r.a/sd)),6); g.globalAlpha=1; });
    if(V.motion.length){ g.strokeStyle=css['--fg']; g.globalAlpha=.7; g.lineWidth=1.2; g.beginPath(); V.motion.forEach((m,i)=>{ const x=X(i*V.step/sd), yy=y+h-12-m*10; i?g.lineTo(x,yy):g.moveTo(x,yy); }); g.stroke(); g.globalAlpha=1; g.lineWidth=1; }
    V.cuts.forEach(c=>{ const x=X(c.t/sd); g.fillStyle=css['--accent']; g.globalAlpha=.55+c.s*.45; g.fillRect(Math.round(x)-1,y+2,2,th); g.beginPath(); g.moveTo(x-5,y+2); g.lineTo(x+5,y+2); g.lineTo(x,y+9); g.fill(); g.globalAlpha=1; });
    g.fillStyle=css['--muted']; g.font='500 9.5px '+font; g.fillText('motion · speech',Math.max(4,x0+4),y+h-12);
  },
  down(e,hh){ if(!V.dur) { $('vdFile').click(); return null; } const sd=stepDur(), t=hh.step*sd;
    if(e.altKey||e.shiftKey){ const tol=8/pps()*sd, near=V.cuts.findIndex(c=>Math.abs(c.t-t)<tol); if(near>=0) V.cuts.splice(near,1); else { V.cuts.push({t:+t.toFixed(3),s:.8}); V.cuts.sort((a,b)=>a.t-b.t); } renderVideo(); requestDraw(); persist(); return null; }
    seekTo(hh.step); return {mode:'scrub'}; },
};
function vdLevel(){ if(V.vgain&&ac) V.vgain.gain.setTargetAtTime(V.mute?0:V.vol,ac.currentTime,.05); }
function renderVideoLevels(){ const a=$('vdVol'); if(a) a.value=Math.round(V.vol*100); const b=$('vdMus'); if(b) b.value=Math.round(V.music*100); }

/* ---------- playback sync ---------- */
function vdTick(){
  const v=vdEl(); if(!v||!V.url||V.exporting) return;
  const t=curStep()*stepDur();
  if(playing){ if(t<V.dur){ if(v.paused){ v.currentTime=t; v.play().catch(()=>{}); } else if(Math.abs(v.currentTime-t)>.12) v.currentTime=t; } else if(!v.paused) v.pause(); }
  else { if(!v.paused) v.pause(); const st=Math.round(curStep()*4); if(st!==V.lastStep){ V.lastStep=st; if(Math.abs(v.currentTime-t)>.05&&t<V.dur) v.currentTime=Math.max(0,t); } }
  if(G&&G.out){ const sp=V.duck&&playing&&V.speech.some(r=>t>=r.a-.15&&t<=r.b+.25); const target=V.music*(sp?.4:1); if(Math.abs((G.out._vd??1)-target)>.01){ G.out.gain.setTargetAtTime(target,ac.currentTime,sp?.08:.35); G.out._vd=target; } }
}
function vdFrame(){ try{ vdTick(); }catch(e){} requestAnimationFrame(vdFrame); }

/* ---------- export ---------- */
async function vdExportAudio(){
  if(!V.dur) return toast('Load a video first'); const btn=$('vdExpA'); btn.disabled=true;
  try{ hud('Mixing music with the video’s sound','0%',0,'busy'); let mus=await renderSong({a:0,b:Math.ceil(V.dur/stepDur()),onProgress:f=>hud('Mixing music with the video’s sound',Math.round(f*90)+'%',f*.9,'busy')});
    const sr=mus.sampleRate, n=Math.round(V.dur*sr), out=new AudioBuffer({length:n,numberOfChannels:2,sampleRate:sr});
    let va=null; if(V.audio){ const oc=new OfflineAudioContext(2,n,sr), s=oc.createBufferSource(); s.buffer=V.audio; s.connect(oc.destination); s.start(); va=await oc.startRendering(); }
    for(let c=0;c<2;c++){ const o=out.getChannelData(c), m=mus.getChannelData(c), a=va?va.getChannelData(c):null; let duck=1;
      for(let i=0;i<n;i++){ const t=i/sr; if(i%256===0){ const sp=V.duck&&V.speech.some(r=>t>=r.a-.15&&t<=r.b+.25); duck+=((sp?.4:1)-duck)*(sp?.25:.04); } o[i]=(m[i]||0)*V.music*duck+(a?a[i]*V.vol:0); } }
    masterBuffer(out,-14); hideHud(); const base=slug(V.name.replace(/\.[^.]+$/,''))+'-scored';
    await offerFile(base+'.zip',makeZip([{name:base+'.wav',data:encodeWav(out,24)}]));
  }catch(e){ console.error(e); hideHud(); toast('The mix stopped. Try again.'); }
  btn.disabled=false;
}
async function vdExportVideo(){
  if(!V.dur) return toast('Load a video first'); if(typeof MediaRecorder==='undefined'){ toast('This browser can’t record video. Export the audio mix instead.'); return; }
  const v=vdEl(), cv=document.createElement('canvas'); cv.width=Math.min(1920,V.w||1280); cv.height=Math.round(cv.width*(V.h||720)/(V.w||1280)); const g=cv.getContext('2d');
  ensureAudio(); const dest=ac.createMediaStreamDestination(); if(V.vgain) V.vgain.connect(dest); if(OUT&&OUT.out) OUT.out.connect(dest);
  const stream=new MediaStream([...cv.captureStream(30).getVideoTracks(),...dest.stream.getAudioTracks()]);
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
  const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:6e6}:{}), chunks=[]; rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  V.exporting={rec,stop:false}; if(playing) stopPlay(); seekTo(0); v.currentTime=0; await new Promise(r=>{ v.onseeked=r; setTimeout(r,500); });
  rec.start(500); startPlay(); v.play().catch(()=>{});
  const draw=()=>{ if(!V.exporting) return; g.drawImage(v,0,0,cv.width,cv.height); const t=v.currentTime; hud('Recording the scored video (plays in real time)',fmtMS(t)+' / '+fmtMS(V.dur),t/V.dur,'rec');
    const sp=V.duck&&V.speech.some(r=>t>=r.a-.15&&t<=r.b+.25), target=V.music*(sp?.4:1); if(G&&G.out&&Math.abs((G.out._vd??1)-target)>.01){ G.out.gain.setTargetAtTime(target,ac.currentTime,sp?.08:.35); G.out._vd=target; }
    if(t>=V.dur-.05||v.ended||V.exporting.stop){ finish(); return; } requestAnimationFrame(draw); };
  const finish=()=>{ const E=V.exporting; if(!E) return; V.exporting=null; v.pause(); stopPlay(); rec.onstop=async()=>{ try{ if(V.vgain) V.vgain.disconnect(dest); if(OUT&&OUT.out) OUT.out.disconnect(dest); }catch(e){} hideHud();
      if(E.stop&&E.cancel) return; const blob=new Blob(chunks,{type:'video/webm'}); await offerFile(slug(V.name.replace(/\.[^.]+$/,''))+'-scored.webm',blob); }; rec.stop(); };
  $('hhStop').onclick=()=>{ if(V.exporting){ V.exporting.stop=true; } }; $('hhCancel').onclick=()=>{ if(V.exporting){ V.exporting.stop=true; V.exporting.cancel=true; } };
  requestAnimationFrame(draw);
}

/* ---------- UI ---------- */
function renderVideo(){
  if(!$('vdInfo')) return;
  $('vdInfo').textContent=V.dur?`${V.name} · ${fmtMS(V.dur)} · ${V.w}×${V.h}`:'no video yet';
  $('vdCuts').innerHTML=V.dur?`${V.cuts.length}<small> cuts</small>`:'—'; $('vdSpeech').textContent=V.dur?(V.audio?`${V.speech.length} speech passage${V.speech.length===1?'':'s'}`:'no readable audio track'):'';
  if(!V.analysing) $('vdStatus').textContent=V.dur?`Scores as ${MAGIC.mood.toLowerCase()} ${genreName().toLowerCase()}. Change the mood and genre below, or press Suggest.`:(V.remembered?`This project was scored to “${V.remembered}”. Drop it in again to keep working against the picture.`:'MP4 or WebM. Nothing leaves your browser.');
  $('vdBar').parentElement.hidden=!V.analysing;
  ['vdScore','vdFx','vdSuggest','vdExpA','vdExpV','vdReAn'].forEach(id=>$(id).disabled=!V.dur||V.analysing);
  $('vdFit').checked=V.fit; $('vdDuck').checked=V.duck; $('vdFxStyle').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===V.fx));
  renderVideoLevels();
  const em=$('vdEmptyNote'); if(em) em.textContent=V.remembered&&!V.dur?'Last time: '+V.remembered:'MP4 or WebM · it never leaves your browser';
}
function drawVideoMarks(g,X,k,H){ if(!V.dur||!V.cuts.length) return; const sd=stepDur();
  g.save(); V.cuts.forEach(c=>{ const x=X(c.t/sd); g.fillStyle='#ec6a43'; g.globalAlpha=.25+c.s*.4; g.fillRect(Math.round(x),RULER_H,1,H-RULER_H-ADD_H); g.globalAlpha=1; g.beginPath(); g.moveTo(x-4,RULER_H); g.lineTo(x+4,RULER_H); g.lineTo(x,RULER_H+6); g.fill(); });
  const xe=X(V.dur/sd); g.fillStyle='#f3eff5'; g.globalAlpha=.6; g.fillRect(Math.round(xe),0,1,H-ADD_H); g.globalAlpha=1; g.font='600 9.5px '+fontMono(); g.fillText('VIDEO END',xe+4,RULER_H-3); g.restore(); }
panelDefaults('video',{dock:['play','restart','loop','vdscore','vdfx','hum','split','follow','m_space','mac_punch','m_out','meter'],head:['undo','redo']});
function initVideo(){
  if(!$('vdVideo')) return;
  control({id:'vdpick',group:'Video',label:'Choose video',icon:'film',run:()=>$('vdFile').click()});
  control({id:'vdscore',group:'Video',label:'Score to cuts',icon:'magic',tip:'Write music that turns with the cuts',run:()=>$('vdScore').click(),disabled:()=>$('vdScore').disabled});
  control({id:'vdfx',group:'Video',label:'Sound the cuts',icon:'fx',tip:'Place transition sounds on every cut',run:()=>$('vdFx').click(),disabled:()=>$('vdFx').disabled});
  control({id:'vdsuggest',group:'Video',label:'Suggest mood',icon:'shuffle',tip:'Pick a mood and genre from the picture',run:()=>$('vdSuggest').click(),disabled:()=>$('vdSuggest').disabled});
  control({id:'vdexpa',group:'Video',label:'Export audio',icon:'wave',run:()=>$('vdExpA').click(),disabled:()=>$('vdExpA').disabled});
  control({id:'vdexpv',group:'Video',label:'Export video',icon:'film',run:()=>$('vdExpV').click(),disabled:()=>$('vdExpV').disabled});
  control({id:'vdmus',group:'Video',kind:'slider',label:'Music level',min:0,max:150,step:1,get:()=>+$('vdMus').value,set:v=>{ const x=$('vdMus'); x.value=v; x.dispatchEvent(new Event('input')); },commit:()=>$('vdMus').dispatchEvent(new Event('change'))});
  control({id:'vdvol',group:'Video',kind:'slider',label:'Video sound',min:0,max:150,step:1,get:()=>+$('vdVol').value,set:v=>{ const x=$('vdVol'); x.value=v; x.dispatchEvent(new Event('input')); },commit:()=>$('vdVol').dispatchEvent(new Event('change'))});
  const pick=()=>$('vdFile').click(); $('vdPick').onclick=pick; $('vdPick2').onclick=pick;
  $('vdFile').onchange=e=>{ const f=e.target.files[0]; e.target.value=''; if(f) vdLoad(f).catch(()=>{}); };
  const drop=$('vdDrop'); ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('dropping'); })); ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,()=>drop.classList.remove('dropping')));
  drop.addEventListener('drop',e=>{ e.preventDefault(); const f=[...(e.dataTransfer.files||[])].find(x=>x.type.startsWith('video/')); if(f) vdLoad(f).catch(()=>{}); });
  $('vdScore').onclick=vdScore; $('vdFx').onclick=()=>vdAddFx(false); $('vdSuggest').onclick=vdSuggest; $('vdExpA').onclick=vdExportAudio; $('vdExpV').onclick=vdExportVideo; $('vdReAn').onclick=()=>vdAnalyse();
  $('vdFit').onchange=e=>{ V.fit=e.target.checked; vdSave(); }; $('vdDuck').onchange=e=>{ V.duck=e.target.checked; vdSave(); };
  $('vdFxStyle').querySelectorAll('button').forEach(b=>b.onclick=()=>{ V.fx=b.dataset.v; vdSave(); renderVideo(); });
  $('vdVol').oninput=e=>{ V.vol=e.target.value/100; vdLevel(); vdSave(); renderTracks(); };
  $('vdMus').oninput=e=>{ V.music=e.target.value/100; vdSave(); };
  /* the project remembers which video it was scored to, the cut edits and the mix settings */
  on('project',p=>{ const v=p.video; if(v&&v.name){ V.remembered=v.name; ['vol','music'].forEach(k=>{ if(isFinite(v[k])) V[k]=clamp(+v[k],0,1.5); }); ['duck','fit','mute'].forEach(k=>{ if(typeof v[k]==='boolean') V[k]=v[k]; }); if(['off','subtle','standard','trailer'].includes(v.fx)) V.fx=v.fx; } });
  on('serialize',p=>{ const name=V.name||V.remembered; if(name) p.video={name,dur:V.dur||(p.video&&p.video.dur)||0,vol:V.vol,music:V.music,duck:V.duck,fit:V.fit,fx:V.fx,mute:V.mute}; });
  on('header',renderVideo);
  addTopLane(VLANE);
  renderVideo(); requestAnimationFrame(vdFrame);
}
boot({ init(){ initTimeline(); initMagic(); initVideo(); } });
