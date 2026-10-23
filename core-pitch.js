/* KYMA · core/pitch — pitch tracking, note segmentation and key detection for humming */
function yin(x,off,W,tauMin,tauMax,sr,thr){
  const d=new Float32Array(tauMax+2);
  for(let tau=1;tau<=tauMax+1;tau++){ let s=0; for(let j=0;j<W;j++){ const v=x[off+j]-x[off+j+tau]; s+=v*v; } d[tau]=s; }
  let run=0; d[0]=1;
  for(let tau=1;tau<=tauMax+1;tau++){ run+=d[tau]; d[tau]=run>0?d[tau]*tau/run:1; }
  let tau=-1;
  for(let t=tauMin;t<=tauMax;t++){ if(d[t]<thr){ while(t+1<=tauMax && d[t+1]<d[t]) t++; tau=t; break; } }
  if(tau<2) return null;
  const a=d[tau-1], b=d[tau], c=d[tau+1], den=a+c-2*b, sh=den?clamp((a-c)/(2*den),-1,1):0;
  return {f:sr/(tau+sh),ap:b};
}
const FMIN=65, FMAX=950;
const hz2m=f=>69+12*Math.log2(f/440);
async function toMono16k(buf){
  const sr=16000, ctx=new OfflineAudioContext(1,Math.max(1,Math.ceil(buf.duration*sr)),sr), s=ctx.createBufferSource();
  s.buffer=buf; s.connect(ctx.destination); s.start(); return (await ctx.startRendering()).getChannelData(0);
}
function pitchTrack(x,sr){
  const hop=Math.round(sr*.01), W=Math.round(sr*.025), tauMin=Math.floor(sr/FMAX), tauMax=Math.ceil(sr/FMIN), frames=[];
  const rmsAll=[];
  for(let off=0;off+W+tauMax+2<x.length;off+=hop){ let e=0; for(let j=0;j<W;j++) e+=x[off+j]*x[off+j]; rmsAll.push(Math.sqrt(e/W)); }
  const sorted=[...rmsAll].sort((a,b)=>a-b), p90=sorted[Math.floor(sorted.length*.9)]||0, gate=Math.max(.003,p90*.14);
  let i=0;
  for(let off=0;off+W+tauMax+2<x.length;off+=hop,i++){
    const t=(off+W/2)/sr, rms=rmsAll[i];
    let midi=null;
    if(rms>=gate){ const y=yin(x,off,W,tauMin,tauMax,sr,.16); if(y && y.f>=FMIN && y.f<=FMAX) midi=hz2m(y.f); }
    frames.push({t,rms,midi});
  }
  // median filter (voiced neighbours only) and octave-jump repair
  const out=frames.map((f,k)=>{ if(f.midi==null) return f; const w=[]; for(let j=k-2;j<=k+2;j++) if(frames[j]&&frames[j].midi!=null) w.push(frames[j].midi); return {...f,midi:median(w)}; });
  for(let k=1;k<out.length;k++){ const a=out[k-1].midi,b=out[k].midi; if(a!=null&&b!=null){ const dd=b-a; if(Math.abs(Math.abs(dd)-12)<1.2) out[k]={...out[k],midi:b-12*Math.sign(dd)}; } }
  return out;
}
function segmentNotes(fr){
  const dt=.01, notes=[]; let cur=null, gap=0, dev=0;
  const close=()=>{ if(cur){ cur.end=cur.last+dt; if(cur.end-cur.start>=.07 && cur.ms.length>=5){ cur.midi=median(cur.ms); notes.push({start:cur.start,end:cur.end,midi:cur.midi}); } cur=null; } };
  for(let i=0;i<fr.length;i++){
    const f=fr[i];
    if(f.midi==null){ gap++; if(gap>=3) close(); continue; }
    gap=0;
    if(!cur){ cur={start:f.t,last:f.t,ms:[f.midi]}; dev=0; continue; }
    const med=median(cur.ms.slice(-12));
    if(Math.abs(f.midi-med)>.75){ dev++; if(dev>=4){ const keep=cur.ms.splice(-3); cur.last=fr[i-4].t; close(); cur={start:fr[i-3].t,last:f.t,ms:[...keep,f.midi]}; dev=0; continue; } }
    else dev=0;
    // re-articulation: a fresh energy attack on the same pitch ("da-da")
    if(i>=4 && fr[i-4].rms>0 && f.rms>fr[i-4].rms*2.4 && cur.ms.length>8){ cur.last=fr[i-1].t; close(); cur={start:f.t,last:f.t,ms:[f.midi]}; continue; }
    cur.ms.push(f.midi); cur.last=f.t;
  }
  close();
  return notes;
}
function nearestDeg(m,oct){ const n=(SCALES[S.scale]||SCALES.Minor).length; let best=0,bd=1e9; for(let dg=-3*n;dg<=4*n;dg++){ const dd=Math.abs(degToMidi(dg,oct)-m); if(dd<bd-1e-9){bd=dd;best=dg;} } return best; }
function humToNotes(raw,target){
  const d=LDEF[target], sd=stepDur(), st=steps(), n=(SCALES[S.scale]||SCALES.Minor).length;
  if(!raw.length) return {notes:[],shift:0};
  const center=degToMidi(0,d.oct)+(target==='bass'?5:target==='keys'?9:7);
  const w=[]; raw.forEach(r=>{ const k=Math.max(1,Math.round((r.end-r.start)*20)); for(let i=0;i<k;i++) w.push(r.midi); });
  const shift=12*Math.round((center-median(w))/12);
  let out=[];
  for(const r of raw){
    let s0=Math.round(r.start/sd); if(s0<0) s0=0; if(s0>=st) continue;
    const e=Math.round(r.end/sd), dur=clamp(e-s0,1,st-s0);
    let dg=nearestDeg(r.midi+shift,d.oct); while(dg>2*n) dg-=n; while(dg<-n) dg+=n;
    out.push({s:s0,n:dg,d:dur,sung:r.midi});
  }
  out.sort((a,b)=>a.s-b.s||b.d-a.d);
  out=out.filter((x,i)=>i===0||x.s!==out[i-1].s);
  for(let i=0;i<out.length-1;i++) out[i].d=Math.max(1,Math.min(out[i].d,out[i+1].s-out[i].s));
  return {notes:out,shift};
}
function detectKey(raw){
  if(raw.length<4) return null;
  const h=new Array(12).fill(0); raw.forEach(r=>h[((Math.round(r.midi)%12)+12)%12]+=r.end-r.start);
  const MAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88], MIN=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
  const corr=(a,b)=>{ const ma=a.reduce((x,y)=>x+y)/12, mb=b.reduce((x,y)=>x+y)/12; let n=0,da=0,db=0; for(let i=0;i<12;i++){n+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2;} return n/Math.sqrt(da*db+1e-12); };
  let best=null;
  for(let r=0;r<12;r++) for(const [name,prof] of [['Major',MAJ],['Minor',MIN]]){ const rot=prof.map((_,i)=>prof[(i-r+12)%12]); const c=corr(h,rot); if(!best||c>best.c) best={root:r,scale:name,c}; }
  return best;
}

function click(t,accent){
  const o=ac.createOscillator(), g=ac.createGain(); o.type='sine'; o.frequency.value=accent?2400:1800;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(accent?.32:.2,t+.002); g.gain.exponentialRampToValueAtTime(.0001,t+.04);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t+.06);
}
function liveYin(chunk,sr){
  const q=Math.max(1,Math.round(sr/16000)), n=Math.floor(chunk.length/q), y=new Float32Array(n);
  for(let i=0;i<n;i++){ let s=0; for(let j=0;j<q;j++) s+=chunk[i*q+j]; y[i]=s/q; }
  const r=sr/q, W=Math.round(r*.025), tauMin=Math.floor(r/FMAX), tauMax=Math.ceil(r/FMIN);
  if(n<W+tauMax+3) return null;
  let e=0; for(let i=0;i<W;i++) e+=y[i]*y[i]; if(Math.sqrt(e/W)<.006) return null;
  const p=yin(y,0,W,tauMin,tauMax,r,.18); return p&&p.f>=FMIN&&p.f<=FMAX?hz2m(p.f):null;
}

