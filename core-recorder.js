/* KYMA · core/recorder — record everything you hear into takes */
const REC={on:false,L:[],R:[],len:0,node:null,takes:[],t0:0,n:0};
function toggleRec(){ ensureAudio(); if(REC.on) stopRec(); else startRec(); }
function startRec(){
  if(ac.state!=='running') ac.resume();
  const sp=ac.createScriptProcessor(4096,2,2), z=gainN(ac,0); OUT.out.connect(sp); sp.connect(z).connect(ac.destination);
  REC.L=[]; REC.R=[]; REC.len=0; REC.node=sp; REC.z=z; REC.on=true; REC.t0=performance.now(); REC.bpm=S.bpm; REC.song=S.name;
  sp.onaudioprocess=e=>{ if(!REC.on) return; const a=e.inputBuffer.getChannelData(0), b=e.inputBuffer.getChannelData(1); REC.L.push(new Float32Array(a)); REC.R.push(new Float32Array(b)); REC.len+=a.length;
    if(REC.len>ac.sampleRate*60*20){ stopRec(); toast('Recording stopped at the 20-minute limit'); } };
  renderRec();
}
function stopRec(){
  if(!REC.on) return; REC.on=false;
  try{ OUT.out.disconnect(REC.node); REC.node.disconnect(); REC.z.disconnect(); }catch(e){}
  const n=REC.len; if(n<ac.sampleRate*.5){ renderRec(); toast('That take was too short to keep'); return; }
  const buf=new AudioBuffer({length:n,numberOfChannels:2,sampleRate:ac.sampleRate}), L=buf.getChannelData(0), R=buf.getChannelData(1);
  let o=0; for(let i=0;i<REC.L.length;i++){ L.set(REC.L[i],o); R.set(REC.R[i],o); o+=REC.L[i].length; } REC.L=[]; REC.R=[];
  REC.n++; const take={name:`Take ${REC.n} · ${REC.song} · ${fmtMS(buf.duration)}`,file:`${slug(REC.song)}-take-${REC.n}`,buf,bpm:REC.bpm};
  REC.takes.unshift(take); if(REC.takes.length>6) REC.takes.pop();
  renderRec(); renderTakes(); if(typeof renderDeckBLoad==='function') renderDeckBLoad();
  const acts=[{label:'Save',fn:()=>saveTake(take)}]; if(typeof loadDeck==='function') acts.push({label:'Load to deck B',fn:()=>loadDeck(take.buf,take.name,take.bpm)});
  toast(`${take.name} recorded`,acts,8000);
}
function renderRec(){
  const on=REC.on, secs=on?(performance.now()-REC.t0)/1000:0;
  const rb=$('recBtn'); if(rb){ rb.classList.toggle('on',on); $('recLbl').textContent=on?'REC '+fmtMS(secs):'REC'; }
  const big=$('recBig'); if(big){ big.classList.toggle('on',on); $('recBigLbl').textContent=on?'STOP · '+fmtMS(secs):'START RECORDING'; }
}
function renderTakes(){
  const box=$('takes'); if(!box||!REC.takes.length) return; box.innerHTML='';
  REC.takes.forEach(t=>{ const row=document.createElement('div'); row.className='take';
    row.innerHTML='<b></b><button class="btn">To B</button><button class="btn">Save</button>'; row.querySelector('b').textContent=t.name;
    const [toB,save]=row.querySelectorAll('button'); toB.onclick=()=>loadDeck(t.buf,t.name,t.bpm); save.onclick=()=>saveTake(t); box.appendChild(row); });
}
async function saveTake(t,master){
  toast('Packing '+t.file+'.zip…');
  await new Promise(r=>setTimeout(r,30));
  const files=[{name:t.file+'.wav',data:encodeWav(t.buf,24)}];
  await offerFile(t.file+'.zip',makeZip(files));
}


