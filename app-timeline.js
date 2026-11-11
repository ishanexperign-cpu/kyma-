/* KYMA · app/timeline — the multitrack timeline used by Compose and Video
   Track heads, the lanes canvas (clips, piano roll, range selection), edit commands, clip menu,
   blends and the instrument browser (humming lives in features/hum). Studios can add lanes above the
   tracks (Video adds its picture lane) with addTopLane(). */
/* =========================================================
   LAYOUT HELPERS
   ========================================================= */
/* lanes a studio adds above the tracks: {id, h(), head(el), draw(g,X,k,W,y,h), down(e,hit)} */
const TOP=[];
function addTopLane(l){ TOP.push(l); renderTracks(); }
const topH=()=>TOP.reduce((a,l)=>a+l.h(),0);
function rows(){ let y=RULER_H+topH(); return S.tracks.map((tr,i)=>{ const h=tr.open?OPEN_H:LANE_H, r={tr,i,y,h}; y+=h; return r; }); }
const totalH=()=>RULER_H+topH()+S.tracks.reduce((a,t)=>a+(t.open?OPEN_H:LANE_H),0)+ADD_H;
function rollGeom(tr,y,h){
  const top=y+BAR_H+2, rh=h-BAR_H-6;
  if(tr.kind==='drum'){ const n=PIECES.length; return {top,rh,lo:0,hi:n-1,row:rh/n,rows:n}; }
  let lo=Infinity, hi=-Infinity; for(const c of tr.clips) for(const n of c.notes){ lo=Math.min(lo,n.n); hi=Math.max(hi,n.n); }
  const sc=(SCALES[S.scale]||SCALES.Minor).length;
  lo=Math.min(-Math.ceil(sc/2),isFinite(lo)?lo-1:0); hi=Math.max(sc*2,isFinite(hi)?hi+1:0);
  const n=hi-lo+1; return {top,rh,lo,hi,row:rh/n,rows:n};
}
const pps=()=>UI.pps||8;
function fitZoom(){ const w=$('lanes').clientWidth||900; UI.pps=clamp((w-48)/Math.max(16,S.len),1.2,48); saveUI(); syncZoom(); }
function syncZoom(){ const z=$('zoom'); if(z) z.value=Math.round(Math.log(pps()/1.2)/Math.log(40)*100); sizeLanes(); }

/* =========================================================
   TRACK HEADERS (DOM)
   ========================================================= */
function renderHeads(){
  const H=$('heads'); H.innerHTML='';
  const rh=document.createElement('div'); rh.className='rhead'; rh.style.height=RULER_H+'px';
  rh.innerHTML=`<span class="lbl">Tracks · ${S.tracks.length}</span>`; H.appendChild(rh);
  TOP.forEach(l=>{ const el=document.createElement('div'); el.className='thead toplane'; el.style.height=l.h()+'px'; el.dataset.lane=l.id; l.head(el); H.appendChild(el); });
  const anySolo=S.tracks.some(t=>t.solo);
  S.tracks.forEach((tr,i)=>{
    const I=INST[tr.inst]||INSTS[0], el=document.createElement('div');
    el.className='thead'+(tr.open?' open':'')+(FOCUS===tr.id?' focus':'')+(audibleT(tr,anySolo)?'':' muted');
    el.style.height=(tr.open?OPEN_H:LANE_H)+'px'; el.style.setProperty('--tc',`var(${COLORS[tr.color%COLORS.length]})`); el.dataset.id=tr.id;
    const recNow=HUM.recording&&HUM.target===tr.id;
    el.innerHTML=`<div class="tstrip"></div>
      <div class="trow1"><button class="tchev" aria-expanded="${tr.open}" aria-label="${tr.open?'Collapse':'Expand'} ${tr.name}" title="Click to ${tr.open?'collapse':'expand and edit notes'}">${tr.open?'▾':'▸'}</button><input class="tnm" value="" aria-label="Track name" spellcheck="false">
        <button class="ms m" aria-pressed="${tr.mute}" title="Mute">M</button><button class="ms s" aria-pressed="${tr.solo}" title="Solo">S</button></div>
      <div class="trow2"><button class="tinst" title="Change instrument (keeps the notes)"><span class="tcat"></span><b></b></button>
        <button class="ltool thum${recNow?' rec':''}" title="${tr.kind==='drum'?'Beatbox into this drum track':'Hum into this track'} (whole song, a selection, or from the playhead)" aria-label="Hum into ${tr.name}">${ICON_MIC}</button>
        <button class="ltool tmore" title="Track options" aria-label="Track options">⋯</button></div>
      <div class="trow3"><input class="tvol" type="range" min="0" max="140" aria-label="${tr.name} volume"><span class="tvl"></span></div>`;
    el.querySelector('.tnm').value=tr.name;
    el.querySelector('.tcat').textContent=I.cat; el.querySelector('.tinst b').textContent=I.name;
    const vol=el.querySelector('.tvol'); vol.value=Math.round(tr.vol*100); el.querySelector('.tvl').textContent=tr.vol<=.001?'−∞':(20*Math.log10(tr.vol)).toFixed(1)+'dB';
    vol.oninput=()=>{ pushHistOnce(); tr.vol=vol.value/100; el.querySelector('.tvl').textContent=tr.vol<=.001?'−∞':(20*Math.log10(tr.vol)).toFixed(1)+'dB'; if(G) applyGraph(G); persist(); };
    el.querySelector('.tnm').onchange=e=>{ pushHist(); tr.name=e.target.value.trim()||I.name; persist(); };
    el.querySelector('.tchev').onclick=()=>toggleOpen(tr);
    el.addEventListener('pointerdown',e=>{ if(e.target===el||e.target.classList.contains('tstrip')||e.target.classList.contains('thx')){ FOCUS=tr.id; } });
    el.addEventListener('click',e=>{ if(e.target===el||e.target.classList.contains('tstrip')) toggleOpen(tr); else if(!e.target.closest('input,button,select,.knob')) { FOCUS=tr.id; markFocus(); } });
    el.querySelector('.m').onclick=()=>{ tr.mute=!tr.mute; afterMix(); };
    el.querySelector('.s').onclick=()=>{ tr.solo=!tr.solo; afterMix(); };
    el.querySelector('.tinst').onclick=()=>openBrowser('change',tr.id);
    el.querySelector('.thum').onclick=()=>humTrack(tr);
    el.querySelector('.tmore').onclick=e=>trackMenu(tr,e.currentTarget);
    if(tr.open) el.appendChild(trackDetails(tr));
    H.appendChild(el);
  });
  const add=document.createElement('div'); add.className='addrow'; add.style.height=ADD_H+'px';
  add.innerHTML='<button class="btn bright" id="addTrackBtn">+ Add track</button>'; add.querySelector('button').onclick=()=>openBrowser('new');
  H.appendChild(add);
}
function markFocus(){ document.querySelectorAll('.thead').forEach(h=>h.classList.toggle('focus',h.dataset.id===FOCUS)); }
function toggleOpen(tr){ tr.open=!tr.open; FOCUS=tr.id; persist(); renderTracks(); }
function trackDetails(tr){
  const I=INST[tr.inst]||INSTS[0], d=document.createElement('div'); d.className='tdetail';
  const color=`var(${COLORS[tr.color%COLORS.length]})`;
  d.innerHTML=`<div class="trow4">${tr.kind==='drum'?'':'<span class="lbl">Octave</span><button class="ltool" data-o="-1">−</button><b class="toct"></b><button class="ltool" data-o="1">+</button>'}
     <span class="lbl" style="margin-left:auto" title="Grid that humming snaps to">Grid</span><select class="sel tq" aria-label="Quantize humming to"><option value="2">1/8</option><option value="1">1/16</option><option value=".5">1/32</option></select></div>
     <div class="knobs tk"></div>`;
  if(tr.kind!=='drum'){ d.querySelector('.toct').textContent=tr.oct; d.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{ pushHist(); tr.oct=clamp(tr.oct+(+b.dataset.o),0,7); persist(); renderTracks(); audition(tr.id,0); }); }
  const q=d.querySelector('.tq'); q.value=String(tr.quant||1); q.onchange=()=>{ tr.quant=+q.value; persist(); };
  const k=d.querySelector('.tk');
  (ESCHEMA[I.engine]||[]).forEach(spec=>{ if(spec.hidden) return;
    if(spec.opts) k.appendChild(segControl(spec,()=>tr.p[spec.k],v=>{ pushHist(); tr.p[spec.k]=v; persist(); audition(tr.id,tr.kind==='drum'?0:0); }));
    else k.appendChild(knob(spec,()=>tr.p[spec.k],v=>{ tr.p[spec.k]=v; if(I.engine==='ghost'&&G) applyGraph(G); persist(); },color,pushHistOnce));
  });
  [P('pan','Pan',-1,1,0,{fmt:v=>Math.abs(v)<.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100)}),P('space','Reverb',0,1,.2,{fmt:fmtPct}),P('echo','Echo',0,1,0,{fmt:fmtPct})]
    .forEach(spec=>k.appendChild(knob(spec,()=>tr[spec.k],v=>{ tr[spec.k]=v; if(G) applyGraph(G); persist(); },color,pushHistOnce)));
  if(I.engine==='sample'){ const w=document.createElement('div'); w.className='enum'; w.innerHTML='<span class="lbl">Sample</span><span class="hint" style="flex:1;flex-basis:auto"></span><button class="btn">Load audio…</button><input type="file" accept="audio/*" hidden>';
    w.querySelector('.hint').textContent=SAMPLE.name||'Built-in choir'; const fi=w.querySelector('input'); w.querySelector('button').onclick=()=>fi.click(); fi.onchange=()=>{ const f=fi.files[0]; fi.value=''; if(f) loadUserSample(f); }; k.prepend(w); }
  return d;
}
function afterMix(){ if(G) applyGraph(G); persist(); renderHeads(); requestDraw(); emit('mix'); }
function trackMenu(tr,anchor){
  const i=S.tracks.indexOf(tr);
  popMenu(anchor,[
    {label:'Change instrument…',fn:()=>openBrowser('change',tr.id)},
    {label:tr.kind==='drum'?'Beatbox into this track':'Hum into this track',fn:()=>humTrack(tr)},
    {label:'Duplicate track',fn:()=>{ pushHist(); const c=JSON.parse(JSON.stringify(tr)); c.id=nid(); c.name=tr.name+' copy'; c.clips.forEach(x=>x.id=nid()); c.color=(tr.color+1)%COLORS.length; S.tracks.splice(i+1,0,c); markDirty(); if(G) applyGraph(G); renderTracks(); persist(); }},
    {label:'Move up',fn:()=>{ if(i<1) return; pushHist(); S.tracks.splice(i,1); S.tracks.splice(i-1,0,tr); renderTracks(); persist(); }},
    {label:'Move down',fn:()=>{ if(i>=S.tracks.length-1) return; pushHist(); S.tracks.splice(i,1); S.tracks.splice(i+1,0,tr); renderTracks(); persist(); }},
    {label:'Next colour',fn:()=>{ tr.color=(tr.color+1)%COLORS.length; renderTracks(); persist(); }},
    {label:'Delete track',danger:true,fn:()=>{ pushHist(); S.tracks.splice(i,1); markDirty(); if(G) applyGraph(G); renderTracks(); persist(); toast('Deleted '+tr.name,[{label:'Undo',fn:undo}]); }},
  ]);
}

/* =========================================================
   LANES CANVAS: draw
   ========================================================= */
let staticDirty=true, off=null;
function sizeLanes(){
  const L=$('lanes'), inner=$('lanesInner'), cv=$('lanesCv'); if(!L) return;
  const W=Math.max(200,L.clientWidth), H=totalH(), dpr=devicePixelRatio||1;
  inner.style.width=Math.ceil((Math.max(S.len,lastClipEnd(),HUM.recording?HUM.cur+16:0)+64)*pps())+'px'; inner.style.height=H+'px';
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.width=W+'px'; cv.style.height=H+'px'; }
  requestDraw();
}
const lastClipEnd=()=>S.tracks.reduce((m,t)=>t.clips.reduce((a,c)=>Math.max(a,clipEnd(c)),m),0);
function drawStatic(){
  const cv=$('lanesCv'), dpr=devicePixelRatio||1, W=cv.width/dpr, H=cv.height/dpr;
  if(!off||off.width!==cv.width||off.height!==cv.height){ off=document.createElement('canvas'); off.width=cv.width; off.height=cv.height; }
  const g=off.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const sx=$('lanes').scrollLeft, k=pps(), X=s=>s*k-sx, font=fontMono(), sd=stepDur();
  const s0=Math.max(0,Math.floor(sx/k)), s1=Math.ceil((sx+W)/k)+1;
  // background bands per bar, beat lines
  const R=rows();
  R.forEach(r=>{ g.fillStyle=r.tr.id===FOCUS?css['--surface-2']:css['--surface']; g.fillRect(0,r.y,W,r.h); g.fillStyle=css['--line']; g.fillRect(0,r.y+r.h-1,W,1); });
  for(let b=Math.floor(s0/16);b*16<=s1;b++){ const x=X(b*16); if(b%2===1){ g.fillStyle=css['--fg']; g.globalAlpha=.025; g.fillRect(x,RULER_H,16*k,H-RULER_H-ADD_H); g.globalAlpha=1; }
    g.fillStyle=css['--line']; g.fillRect(Math.round(x),RULER_H,1,H-RULER_H-ADD_H);
    if(k*4>=10) for(let q=1;q<4;q++){ g.globalAlpha=.35; g.fillRect(Math.round(X(b*16+q*4)),RULER_H,1,H-RULER_H-ADD_H); g.globalAlpha=1; } }
  // beyond song end
  const xe=X(S.len); if(xe<W){ g.fillStyle=css['--bg']; g.globalAlpha=.55; g.fillRect(Math.max(0,xe),RULER_H,W,H-RULER_H-ADD_H); g.globalAlpha=1; }
  // ruler
  g.fillStyle=css['--screen']; g.fillRect(0,0,W,RULER_H); g.fillStyle=css['--line']; g.fillRect(0,RULER_H-1,W,1);
  const barW=16*k, every=barW<26?(barW<9?8:4):barW<44?2:1;
  g.font='500 10px '+font; g.textBaseline='alphabetic';
  for(let b=Math.floor(s0/16);b*16<=s1;b++){ if(b%every) continue; const x=X(b*16); g.fillStyle='#55534d'; g.fillRect(x,RULER_H-9,1,9); g.fillStyle='#b3b0a8'; g.fillText(String(b+1),x+3,RULER_H-11); }
  const tStep=Math.max(1,[1,2,5,10,15,30,60].find(t=>t/sd*k>70)||120);
  for(let t=Math.floor(s0*sd/tStep)*tStep;t<=s1*sd;t+=tStep){ const x=X(t/sd); g.fillStyle='#7a776f'; g.fillRect(x,0,1,5); g.fillText(fmtMS(t),x+3,10); }
  // song end flag + loop region
  g.fillStyle=css['--accent']; g.fillRect(Math.round(xe)-1,0,2,H-ADD_H); g.beginPath(); g.moveTo(xe,0); g.lineTo(xe-9,0); g.lineTo(xe,9); g.fill();
  g.fillStyle=css['--accent']; g.fillText('END '+fmtMS(S.len*sd),xe-74<4?xe+6:xe-74,RULER_H-3);
  if(RANGE&&RANGE.b>RANGE.a){ g.fillStyle=css['--play']; g.globalAlpha=.22; g.fillRect(X(RANGE.a),0,(RANGE.b-RANGE.a)*k,RULER_H); g.globalAlpha=1; }
  // lanes above the tracks
  { let y=RULER_H; TOP.forEach(l=>{ const h=l.h(); g.save(); g.beginPath(); g.rect(0,y,W,h); g.clip(); g.fillStyle=css['--screen']; g.fillRect(0,y,W,h); l.draw(g,X,k,W,y,h); g.restore(); g.fillStyle=css['--line']; g.fillRect(0,y+h-1,W,1); y+=h; }); }
  // tracks
  R.forEach(r=>drawTrack(g,r,X,k,W));
  if(typeof drawVideoMarks==='function') drawVideoMarks(g,X,k,H);
  // range selection overlay
  if(RANGE&&RANGE.b>RANGE.a){ const a=R[clamp(RANGE.t0,0,R.length-1)], b=R[clamp(RANGE.t1,0,R.length-1)]; if(a&&b){ const y0=Math.min(a.y,b.y), y1=Math.max(a.y+a.h,b.y+b.h);
    g.fillStyle=css['--play']; g.globalAlpha=.14; g.fillRect(X(RANGE.a),y0,(RANGE.b-RANGE.a)*k,y1-y0); g.globalAlpha=1; g.strokeStyle=css['--play']; g.lineWidth=1; g.setLineDash([4,3]); g.strokeRect(X(RANGE.a)+.5,y0+.5,(RANGE.b-RANGE.a)*k-1,y1-y0-1); g.setLineDash([]);
    g.fillStyle=css['--play']; g.font='600 10px '+font; g.fillText(`${fmtMS(RANGE.a*sd)}–${fmtMS(RANGE.b*sd)} · ${((RANGE.b-RANGE.a)/16).toFixed(RANGE.b-RANGE.a<16?2:1)} bars`,X(RANGE.a)+4,y0+12); } }
  // empty add row hint
  const ay=H-ADD_H; g.fillStyle=css['--muted']; g.font='500 11px '+font; g.fillText(S.tracks.length?'Double-click a lane to add an empty clip · drag to select a range · drop clips anywhere':'Add an instrument track to begin, or pick a vibe above',12,ay+30);
  staticDirty=false;
}
function drawTrack(g,r,X,k,W){
  const tr=r.tr, col=trCol(tr), y=r.y, h=r.h, font=fontMono();
  const band=tr.open?BAR_H:h;
  // clips
  for(const c of tr.clips){
    const x0=X(c.start), x1=X(clipEnd(c)); if(x1<-2||x0>W+2) continue;
    const cy=y+3, ch=band-6, sel=SEL.clips.has(c.id), past=c.start>=S.len;
    g.globalAlpha=past?.35:1;
    g.fillStyle=col; g.globalAlpha*=.2; rr(g,x0+.5,cy,Math.max(2,x1-x0-1),ch,4); g.fill(); g.globalAlpha=past?.35:1;
    g.strokeStyle=sel?css['--fg']:col; g.lineWidth=sel?2:1; rr(g,x0+.5,cy+.5,Math.max(2,x1-x0-1),ch-1,4); g.stroke();
    // fades / transitions
    const fi=c.fin||{}, fo=c.fout||{};
    if(fi.type!=='cut'&&fi.len>0){ const w=fi.len*k; g.fillStyle=css['--fg']; g.globalAlpha=.18; g.beginPath(); if(fi.type==='riser'){ g.moveTo(x0-w,cy+ch); g.lineTo(x0,cy); g.lineTo(x0,cy+ch); } else { g.moveTo(x0,cy); g.lineTo(x0+w,cy); g.lineTo(x0,cy+ch); } g.fill(); g.globalAlpha=1;
      g.fillStyle=css['--fg']; g.font='600 9px '+font; if(w>18) g.fillText(TRANS_IN[fi.type].split(' ')[0].toUpperCase(),fi.type==='riser'?x0-w+3:x0+3,cy+ch-3); }
    if(fo.type!=='cut'&&fo.len>0){ const w=fo.len*k; g.fillStyle=css['--fg']; g.globalAlpha=.18; g.beginPath(); g.moveTo(x1,cy); g.lineTo(x1-w,cy); g.lineTo(x1,cy+ch); g.fill(); g.globalAlpha=1;
      g.fillStyle=css['--fg']; g.font='600 9px '+font; if(w>18){ const t=TRANS_OUT[fo.type].split(' ')[0].toUpperCase(); g.fillText(t,x1-g.measureText(t).width-4,cy+ch-3); } }
    // handles
    if(sel){ g.fillStyle=css['--fg']; g.fillRect(x0+1,cy+ch/2-7,3,14); g.fillRect(x1-4,cy+ch/2-7,3,14); }
    // loop marks
    if(c.loop&&c.loopLen>0){ g.fillStyle=col; for(let s=c.start+(c.loopLen-((c.offset%c.loopLen)+c.loopLen)%c.loopLen);s<clipEnd(c);s+=c.loopLen){ const x=X(s); if(x>x0+4) { g.globalAlpha=.6; g.fillRect(x,cy+2,1,6); g.globalAlpha=1; } } }
    // name
    if(x1-x0>34){ g.save(); g.beginPath(); g.rect(x0,cy,x1-x0,ch); g.clip(); g.fillStyle=css['--fg']; g.font='600 10px '+font;
      g.fillText((c.loop?'⟲ ':'')+(c.name||'Clip'),Math.max(x0,0)+6,cy+12); if(x1-x0>60){ g.fillStyle=css['--muted']; g.fillText('⋯',x1-14,cy+12); } g.restore(); }
    // mini notes (collapsed only)
    if(!tr.open){ const fl=flatten(c); if(fl.length){ g.save(); g.beginPath(); g.rect(x0,cy,x1-x0,ch); g.clip(); g.fillStyle=col;
      const top=cy+16, hh=ch-20;
      if(tr.kind==='drum'){ for(const e of fl){ const yy=top+(e.n/(PIECES.length-1))*Math.max(1,hh-3); g.fillRect(X(e.at),yy,Math.max(1.5,Math.min(4,e.d*k-.5)),3); } }
      else { let lo=Infinity,hi=-Infinity; fl.forEach(e=>{lo=Math.min(lo,e.n);hi=Math.max(hi,e.n);}); const sp=Math.max(6,hi-lo+1), nh=Math.max(2,Math.min(4,hh/sp));
        for(const e of fl){ const yy=top+(1-(e.n-lo+.5)/sp)*hh-nh/2; g.fillRect(X(e.at),yy,Math.max(1.5,e.d*k-1),nh); } }
      g.restore(); } }
    g.globalAlpha=1;
  }
  if(tr.open) drawRoll(g,r,X,k,W);
  // live recording region + pitch contour
  if(HUM.recording&&HUM.target===tr.id){ const top=y+2, hh=h-4, xa=X(HUM.a), xc=X(Math.max(HUM.a,HUM.cur));
    if(!HUM.open){ g.strokeStyle=css['--warn']; g.globalAlpha=.6; g.setLineDash([5,4]); g.strokeRect(xa+.5,top+.5,X(HUM.b)-xa-1,hh-1); g.setLineDash([]); g.globalAlpha=1; }
    g.fillStyle=css['--warn']; g.globalAlpha=.16; g.fillRect(xa,top,Math.max(0,xc-xa),hh); g.globalAlpha=1; g.fillRect(Math.round(xc)-1,top,2,hh);
    g.font='600 10px '+font; g.fillText(HUM.counting?'COUNT-IN':'● REC',xa+6,top+12);
    const ty=y+(tr.open?BAR_H+2:16), th=(tr.open?h-BAR_H-6:h-20); let ms=HUM.trace.filter(p=>p.m!=null).map(p=>p.m); const lo=ms.length?Math.min(...ms)-2:48, hi=ms.length?Math.max(...ms)+2:72, sp=Math.max(12,hi-lo);
    g.strokeStyle=css['--warn']; g.lineWidth=2; g.beginPath(); let prev=null;
    for(const p of HUM.trace){ const x=X(p.s); if(x<-2||x>W+2){ prev=null; continue; }
      if(p.m==null){ g.moveTo(x,ty+th*.5-4); g.lineTo(x,ty+th*.5+4); prev=null; continue; }
      const yy=ty+th-((p.m-lo)/sp)*th; if(prev&&p.s-prev.s<.6) g.lineTo(x,yy); else g.moveTo(x,yy); prev=p; }
    g.stroke(); g.lineWidth=1; }
}
function drawRoll(g,r,X,k,W){
  const tr=r.tr, col=trCol(tr), Gm=rollGeom(tr,r.y,r.h), font=fontMono(), sc=SCALES[S.scale]||SCALES.Minor, n=sc.length;
  for(let i=0;i<Gm.rows;i++){ const val=Gm.hi-i, yy=Gm.top+i*Gm.row;
    const root=tr.kind!=='drum'&&((val%n)+n)%n===0; g.fillStyle=root?css['--cell-hi']:(i%2?css['--cell']:css['--surface']); g.globalAlpha=root?.9:.55; g.fillRect(0,yy,W,Gm.row); g.globalAlpha=1; }
  // clip windows highlighted in roll
  for(const c of tr.clips){ const x0=X(c.start), x1=X(clipEnd(c)); if(x1<0||x0>W) continue; g.fillStyle=col; g.globalAlpha=.05; g.fillRect(x0,Gm.top,x1-x0,Gm.rh); g.globalAlpha=.4; g.fillRect(x0,Gm.top,1,Gm.rh); g.fillRect(x1-1,Gm.top,1,Gm.rh); g.globalAlpha=1; }
  // notes
  for(const c of tr.clips) for(const e of flatten(c)){ const x=X(e.at), w=Math.max(2,e.d*k-1); if(x+w<0||x>W) continue; const val=tr.kind==='drum'?e.n:e.n; if(val<Gm.lo||val>Gm.hi) continue;
    const yy=Gm.top+(Gm.hi-val)*Gm.row+1, sel=SEL.notes.has(e.src); g.fillStyle=col; g.globalAlpha=e.rep?.45:1; rr(g,x,yy,w,Math.max(3,Gm.row-2),2); g.fill(); g.globalAlpha=1;
    if(sel){ g.strokeStyle=css['--fg']; g.lineWidth=1.5; rr(g,x,yy,w,Math.max(3,Gm.row-2),2); g.stroke(); } }
  // labels (sticky left)
  g.font='500 9.5px '+font; g.textBaseline='middle';
  for(let i=0;i<Gm.rows;i++){ const val=Gm.hi-i, yy=Gm.top+i*Gm.row+Gm.row/2; if(Gm.row<8&&i%2) continue;
    const lab=tr.kind==='drum'?piecesFor(tr)[val]:midiName(degToMidi(val,tr.oct)); g.fillStyle=css['--screen']; g.globalAlpha=.78; g.fillRect(0,yy-6,tr.kind==='drum'?66:30,12); g.globalAlpha=1;
    g.fillStyle=tr.kind!=='drum'&&((val%n)+n)%n===0?css['--accent']:'#b9b6ae'; g.fillText(lab,4,yy); }
  g.textBaseline='alphabetic';
  if(MARQ&&MARQ.tr===tr.id){ g.strokeStyle=css['--fg']; g.setLineDash([3,3]); g.strokeRect(Math.min(MARQ.x0,MARQ.x1),Math.min(MARQ.y0,MARQ.y1),Math.abs(MARQ.x1-MARQ.x0),Math.abs(MARQ.y1-MARQ.y0)); g.setLineDash([]); }
}
function drawFrame(){
  const cv=$('lanesCv'); if(!cv) return;
  if(staticDirty) drawStatic();
  const dpr=devicePixelRatio||1, g=cv.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,cv.width,cv.height); g.drawImage(off,0,0);
  g.setTransform(dpr,0,0,dpr,0,0);
  const k=pps(), sx=$('lanes').scrollLeft, x=curStep()*k-sx, H=cv.height/dpr;
  g.fillStyle=css['--play']; g.fillRect(Math.round(x)-1,0,2,H-ADD_H); g.beginPath(); g.moveTo(x-6,0); g.lineTo(x+6,0); g.lineTo(x,8); g.fill();
  if(typeof PLACE!=='undefined'&&(PLACE.card||PLACE.peek)) drawPlacement(g,s=>s*k-sx,k,cv.width/dpr);
  if(DRAG&&DRAG.ghost){ g.strokeStyle=css['--fg']; g.setLineDash([4,3]); DRAG.ghost.forEach(q=>g.strokeRect(q.x,q.y,q.w,q.h)); g.setLineDash([]); }
}

/* =========================================================
   LANES CANVAS: interaction
   ========================================================= */
let DRAG=null, MARQ=null;
function hit(e){
  const cv=$('lanesCv'), rc=cv.getBoundingClientRect(), x=e.clientX-rc.left, y=e.clientY-rc.top, k=pps(), sx=$('lanes').scrollLeft, step=(x+sx)/k;
  if(y<RULER_H){ const xe=S.len*k-sx; return {zone:Math.abs(x-xe)<7?'end':'ruler',x,y,step}; }
  { let ty=RULER_H; for(const l of TOP){ const h=l.h(); if(y>=ty&&y<ty+h) return {zone:'top',lane:l,x,y,ly:y-ty,lh:h,step}; ty+=h; } }
  const R=rows(), r=R.find(q=>y>=q.y&&y<q.y+q.h);
  if(!r) return {zone:'add',x,y,step};
  const tr=r.tr, inBar=!tr.open||y<r.y+BAR_H;
  if(inBar){
    for(let i=tr.clips.length-1;i>=0;i--){ const c=tr.clips[i], x0=c.start*k-sx, x1=clipEnd(c)*k-sx; const fiw=(c.fin?.type==='riser'?0:c.fin?.len||0)*k;
      if(x<x0-3||x>x1+3) continue; const top=y<r.y+11;
      if(x1-x0>60&&top&&x>x1-18) return {zone:'menu',tr,r,c,x,y,step};
      if(top&&x<x0+Math.max(12,fiw)&&x>=x0) return {zone:'fin',tr,r,c,x,y,step};
      if(top&&x>x1-Math.max(12,(c.fout?.len||0)*k)&&x<=x1) return {zone:'fout',tr,r,c,x,y,step};
      if(Math.abs(x-x0)<6) return {zone:'trimL',tr,r,c,x,y,step};
      if(Math.abs(x-x1)<6) return {zone:'trimR',tr,r,c,x,y,step};
      if(x>=x0&&x<=x1) return {zone:'clip',tr,r,c,x,y,step};
    }
    return {zone:'lane',tr,r,x,y,step};
  }
  const Gm=rollGeom(tr,r.y,r.h), row=Math.floor((y-Gm.top)/Gm.row), val=clamp(Gm.hi-row,Gm.lo,Gm.hi);
  for(const c of tr.clips) for(const ev of flatten(c)){ if(ev.n!==val) continue; const x0=ev.at*k-sx, x1=(ev.at+ev.d)*k-sx; if(x>=x0-1&&x<=x1+1) return {zone:x>x1-6&&x1-x0>10?'noteR':'note',tr,r,c,ev,val,x,y,step,Gm}; }
  return {zone:'roll',tr,r,val,x,y,step,Gm};
}
function clipAtStep(tr,step){ for(let i=tr.clips.length-1;i>=0;i--){ const c=tr.clips[i]; if(step>=c.start&&step<clipEnd(c)) return c; } return null; }
function contentT(c,at){ let t=at-c.start+c.offset; if(c.loop&&c.loopLen>0) t=((t%c.loopLen)+c.loopLen)%c.loopLen; return t; }
function initLanes(){
  const cv=$('lanesCv');
  cv.addEventListener('contextmenu',e=>{ const h=hit(e); if(h.c){ e.preventDefault(); SEL.clips=new Set([h.c.id]); requestDraw(); clipMenu(h.tr,h.c,e.clientX,e.clientY); } });
  cv.addEventListener('dblclick',e=>{ const h=hit(e);
    if(h.zone==='clip'||h.zone==='menu') clipMenu(h.tr,h.c,e.clientX,e.clientY);
    else if(h.zone==='lane'){ pushHist(); const s=Math.floor(h.step/16)*16; const c=newClip(s,16,[],{name:'Clip'}); h.tr.clips.push(c); SEL={clips:new Set([c.id]),notes:new Set()}; markDirty(); if(!h.tr.open){ h.tr.open=true; renderTracks(); } else requestDraw(); persist(); }
    else if(h.zone==='note'||h.zone==='noteR'){ pushHist(); const c=h.ev.c; c.notes.splice(c.notes.indexOf(h.ev.src),1); SEL.notes.delete(h.ev.src); markDirty(); requestDraw(); persist(); }
  });
  cv.addEventListener('pointerdown',e=>{
    if(e.button===2) return; if(typeof magicLaneDown==='function'&&magicLaneDown(e)) return; const h=hit(e); cv.setPointerCapture(e.pointerId); closePop();
    const k=pps();
    if(h.zone==='ruler'){ DRAG={mode:'scrub'}; seekTo(h.step); return; }
    if(h.zone==='top'){ const d=h.lane.down&&h.lane.down(e,h); DRAG=d||null; return; }
    if(h.zone==='end'){ pushHist(); DRAG={mode:'end'}; return; }
    if(h.zone==='add'){ DRAG=null; return; }
    if(h.tr){ FOCUS=h.tr.id; markFocus(); }
    if(h.zone==='menu'){ SEL.clips=new Set([h.c.id]); requestDraw(); clipMenu(h.tr,h.c,e.clientX,e.clientY); return; }
    if(['clip','trimL','trimR','fin','fout'].includes(h.zone)){
      SEL.notes.clear();
      if(e.shiftKey){ SEL.clips.has(h.c.id)?SEL.clips.delete(h.c.id):SEL.clips.add(h.c.id); }
      else if(!SEL.clips.has(h.c.id)) SEL.clips=new Set([h.c.id]);
      RANGE=null; requestDraw();
      const items=[...SEL.clips].map(id=>findClip(id)).filter(Boolean).map(({tr,c})=>({tr,c,start:c.start,len:c.len,offset:c.offset,fin:c.fin.len,fout:c.fout.len,ti:S.tracks.indexOf(tr)}));
      DRAG={mode:h.zone,x0:h.x,s0:h.step,ti0:h.r.i,h,items,copy:e.altKey||e.ctrlKey||e.metaKey,moved:false,hist:false};
      return;
    }
    if(h.zone==='lane'){ SEL.clips.clear(); SEL.notes.clear(); const a=snapTo(h.step); RANGE=null; DRAG={mode:'range',a,ti:h.r.i,x0:h.x,y0:h.y,s0:h.step,moved:false}; requestDraw(); return; }
    if(h.zone==='note'||h.zone==='noteR'){
      SEL.clips.clear();
      if(e.shiftKey){ SEL.notes.has(h.ev.src)?SEL.notes.delete(h.ev.src):SEL.notes.add(h.ev.src); }
      else if(!SEL.notes.has(h.ev.src)) SEL.notes=new Set([h.ev.src]);
      const items=[]; for(const c of h.tr.clips) for(const n of c.notes) if(SEL.notes.has(n)) items.push({n,c,t:n.t,v:n.n,d:n.d});
      DRAG={mode:h.zone==='noteR'?'nresize':'nmove',tr:h.tr,x0:h.x,y0:h.y,s0:h.step,val0:h.val,items,Gm:h.Gm,moved:false,hist:false};
      if(h.tr.kind==='drum') audition(h.tr.id,h.val); else audition(h.tr.id,h.val);
      requestDraw(); return;
    }
    if(h.zone==='roll'){
      if(e.shiftKey){ MARQ={tr:h.tr.id,x0:h.x,y0:h.y,x1:h.x,y1:h.y}; DRAG={mode:'marq',tr:h.tr,Gm:h.Gm}; return; }
      pushHist(); SEL.clips.clear();
      const q=h.tr.kind==='drum'?1:Math.max(.5,h.tr.quant||1), at=Math.floor(h.step/q)*q;
      let c=clipAtStep(h.tr,at);
      if(!c){ const s=Math.floor(at/16)*16; c=newClip(s,16,[],{name:'Clip'}); h.tr.clips.push(c); }
      const len=h.tr.kind==='drum'?1:(h.tr.lastLen||2), n={t:contentT(c,at),d:len,n:h.val,v:.85}; c.notes.push(n); SEL.notes=new Set([n]); markDirty();
      audition(h.tr.id,h.val);
      DRAG={mode:'nresize',tr:h.tr,x0:h.x,s0:h.step,items:[{n,c,t:n.t,v:n.n,d:n.d}],fresh:true,moved:true,hist:true,Gm:h.Gm}; requestDraw(); return;
    }
  });
  cv.addEventListener('pointerleave',()=>{ if(typeof magicLaneLeave==='function') magicLaneLeave(); });
  cv.addEventListener('pointermove',e=>{
    if(!DRAG&&typeof magicLaneMove==='function'&&magicLaneMove(e)) return;
    const h=hit(e);
    if(!DRAG){ const c={trimL:'ew-resize',trimR:'ew-resize',fin:'nesw-resize',fout:'nwse-resize',clip:'grab',menu:'pointer',note:'move',noteR:'ew-resize',roll:'crosshair',lane:'text',ruler:'pointer',end:'ew-resize',top:(h.lane&&h.lane.cursor)||'pointer'}[h.zone]||'default'; cv.style.cursor=c; return; }
    const k=pps(), dxs=(h.x-DRAG.x0)/k;
    if(DRAG.mode==='scrub'){ seekTo(h.step); return; }
    if(DRAG.mode==='end'){ S.len=clamp(snapTo(h.step,16)||16,16,16*400); markDirty(); renderSongLen(); sizeLanes(); return; }
    if(DRAG.mode==='range'){ if(Math.abs(h.x-DRAG.x0)<3&&!DRAG.moved) return; DRAG.moved=true;
      const b=snapTo(h.step), R=rows(), ri=R.findIndex(q=>h.y>=q.y&&h.y<q.y+q.h), ti=ri<0?(h.y<RULER_H?0:R.length-1):ri;
      RANGE={a:Math.max(0,Math.min(DRAG.a,b)),b:Math.max(DRAG.a,b),t0:Math.min(DRAG.ti,ti),t1:Math.max(DRAG.ti,ti)}; requestDraw(); return; }
    if(DRAG.mode==='marq'){ MARQ.x1=h.x; MARQ.y1=h.y; requestDraw(); return; }
    if(!DRAG.moved&&Math.abs(h.x-DRAG.x0)<3&&Math.abs((h.y??0)-(DRAG.y0??h.y))<3) return;
    if(!DRAG.hist){ pushHist(); DRAG.hist=true; }
    DRAG.moved=true;
    if(['clip','trimL','trimR','fin','fout'].includes(DRAG.mode)){
      const ds=Math.round(dxs/UI.snap)*UI.snap;
      if(DRAG.mode==='clip'){
        const R=rows(), ri=R.findIndex(q=>h.y>=q.y&&h.y<q.y+q.h), dti=ri<0?0:ri-DRAG.ti0;
        if(DRAG.copy&&!DRAG.copied){ DRAG.items=DRAG.items.map(it=>{ const cc=JSON.parse(JSON.stringify(it.c)); cc.id=nid(); it.tr.clips.push(cc); return {...it,c:cc}; }); SEL.clips=new Set(DRAG.items.map(it=>it.c.id)); DRAG.copied=true; }
        DRAG.items.forEach(it=>{ it.c.start=Math.max(0,it.start+ds);
          const nti=clamp(it.ti+dti,0,S.tracks.length-1), ntr=S.tracks[nti];
          if(ntr!==it.tr){ it.tr.clips.splice(it.tr.clips.indexOf(it.c),1); if(ntr.kind!==it.tr.kind) it.c.notes=mapNotesKind(it.c.notes,it.tr.kind,ntr.kind); ntr.clips.push(it.c); it.tr=ntr; } });
      } else if(DRAG.mode==='trimL'){ DRAG.items.forEach(it=>{ const d=clamp(ds,-it.start,it.len-1); it.c.start=it.start+d; it.c.len=it.len-d; it.c.offset=it.offset+d; }); }
      else if(DRAG.mode==='trimR'){ DRAG.items.forEach(it=>{ it.c.len=Math.max(1,it.len+ds); }); }
      else if(DRAG.mode==='fin'){ const it=DRAG.items.find(x=>x.c===DRAG.h.c)||DRAG.items[0]; const v=clamp(Math.round((it.fin+dxs)/1),0,Math.min(64,it.len)); it.c.fin.len=v; if(v>0&&it.c.fin.type==='cut') it.c.fin.type='fade'; if(v===0) it.c.fin.type='cut'; }
      else if(DRAG.mode==='fout'){ const it=DRAG.items.find(x=>x.c===DRAG.h.c)||DRAG.items[0]; const v=clamp(Math.round(it.fout-dxs),0,Math.min(64,it.len)); it.c.fout.len=v; if(v>0&&it.c.fout.type==='cut') it.c.fout.type='fade'; if(v===0) it.c.fout.type='cut'; }
      markDirty(); sizeLanes(); return;
    }
    if(DRAG.mode==='nmove'){
      const q=DRAG.tr.kind==='drum'?1:Math.max(.5,DRAG.tr.quant||1), dt=Math.round(dxs/q)*q, dv=DRAG.Gm?Math.round((DRAG.y0-h.y)/DRAG.Gm.row):0;
      DRAG.items.forEach(it=>{ let t=it.t+dt; const L=it.c.loop?it.c.loopLen:null; if(L) t=clamp(t,0,L-.01); else t=clamp(t,it.c.offset,it.c.offset+it.c.len-.01); it.n.t=t;
        it.n.n=DRAG.tr.kind==='drum'?clamp(it.v+dv,0,PIECES.length-1):it.v+dv; });
      if(dv!==DRAG.lastDv){ DRAG.lastDv=dv; audition(DRAG.tr.id,DRAG.items[0].n.n); }
      markDirty(); requestDraw(); return;
    }
    if(DRAG.mode==='nresize'){ const q=DRAG.tr.kind==='drum'?.5:Math.max(.5,DRAG.tr.quant||1);
      DRAG.items.forEach(it=>{ const d=Math.max(q,Math.round((it.d+dxs)/q)*q); it.n.d=d; }); DRAG.tr.lastLen=DRAG.items[0].n.d; markDirty(); requestDraw(); return; }
  });
  const end=e=>{
    if(!DRAG) return; const D=DRAG; DRAG=null;
    if(D.mode==='range'&&!D.moved){ RANGE=null; seekTo(D.s0); requestDraw(); return; }
    if(D.mode==='marq'){ const k=pps(), sx=$('lanes').scrollLeft, x0=Math.min(MARQ.x0,MARQ.x1), x1=Math.max(MARQ.x0,MARQ.x1), y0=Math.min(MARQ.y0,MARQ.y1), y1=Math.max(MARQ.y0,MARQ.y1), Gm=D.Gm;
      SEL.notes=new Set(); for(const c of D.tr.clips) for(const ev of flatten(c)){ const ex=ev.at*k-sx, ey=Gm.top+(Gm.hi-ev.n)*Gm.row+Gm.row/2; if(ex>=x0&&ex<=x1&&ey>=y0&&ey<=y1) SEL.notes.add(ev.src); }
      MARQ=null; requestDraw(); return; }
    if(D.mode==='end'){ persist(); renderSongLen(); requestDraw(); return; }
    if(D.moved){ markDirty(); persist(); sizeLanes(); }
    requestDraw();
  };
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
  $('lanes').addEventListener('scroll',()=>{ requestDraw(); });
  $('lanes').addEventListener('wheel',e=>{ if(e.ctrlKey||e.metaKey){ e.preventDefault(); const L=$('lanes'), rc=L.getBoundingClientRect(), mx=e.clientX-rc.left, st=(mx+L.scrollLeft)/pps();
    UI.pps=clamp(pps()*Math.exp(-e.deltaY*.0025),1.2,48); syncZoom(); L.scrollLeft=st*pps()-mx; saveUI(); } },{passive:false});
}

/* =========================================================
   EDIT COMMANDS
   ========================================================= */
const selClips=()=>[...SEL.clips].map(findClip).filter(Boolean);
const focusTrack=()=>trackById(FOCUS)||selClips()[0]?.tr||S.tracks[0];
function pastePos(){ return snapTo(curStep(),UI.snap); }
function cmdCopy(cut){
  if(SEL.notes.size){ const tr=S.tracks.find(t=>t.clips.some(c=>c.notes.some(n=>SEL.notes.has(n)))); const abs=[];
    tr.clips.forEach(c=>flatten(c).forEach(e=>{ if(SEL.notes.has(e.src)&&!abs.some(a=>a.src===e.src)) abs.push(e); }));
    const t0=Math.floor(Math.min(...abs.map(e=>e.at))), t1=Math.max(...abs.map(e=>e.at+e.d));
    CLIPBOARD={type:'notes',len:Math.max(1,Math.ceil(t1-t0)),tracks:[{kind:tr.kind,notes:abs.map(e=>({t:e.at-t0,d:e.d,n:e.n,v:e.v}))}]};
    if(cut){ pushHist(); tr.clips.forEach(c=>c.notes=c.notes.filter(n=>!SEL.notes.has(n))); SEL.notes.clear(); markDirty(); }
    toast(`Copied ${abs.length} notes. Pick a track and press Paste.`); }
  else if(RANGE&&RANGE.b>RANGE.a){ const trs=S.tracks.slice(RANGE.t0,RANGE.t1+1);
    CLIPBOARD={type:'range',len:RANGE.b-RANGE.a,tracks:trs.map(t=>({kind:t.kind,notes:notesInRange(t,RANGE.a,RANGE.b)}))};
    if(cut){ pushHist(); trs.forEach(t=>eraseRange(t,RANGE.a,RANGE.b)); }
    toast(`Copied ${fmtMS((RANGE.b-RANGE.a)*stepDur())} from ${trs.length} track${trs.length>1?'s':''}. Click where it should go, then Paste.`); }
  else if(SEL.clips.size){ const cl=selClips(), s0=Math.min(...cl.map(x=>x.c.start)), ti0=Math.min(...cl.map(x=>S.tracks.indexOf(x.tr)));
    CLIPBOARD={type:'clips',len:Math.max(...cl.map(x=>clipEnd(x.c)))-s0,items:cl.map(({tr,c})=>({dt:S.tracks.indexOf(tr)-ti0,kind:tr.kind,c:{...JSON.parse(JSON.stringify(c)),start:c.start-s0}}))};
    if(cut){ pushHist(); cl.forEach(({tr,c})=>tr.clips.splice(tr.clips.indexOf(c),1)); SEL.clips.clear(); markDirty(); }
    toast(`Copied ${cl.length} clip${cl.length>1?'s':''}. Pick a track and press Paste.`); }
  else { toast('Select clips, notes or drag a range first'); return; }
  if(cut){ persist(); requestDraw(); }
  updateToolbar();
}
function cmdPaste(){
  if(!CLIPBOARD){ toast('Copy something first'); return; }
  const tr0=focusTrack(); if(!tr0){ toast('Add a track first'); return; }
  const ti0=S.tracks.indexOf(tr0), pos=RANGE&&RANGE.b>RANGE.a?RANGE.a:pastePos(); pushHist(); const newIds=new Set();
  if(CLIPBOARD.type==='clips'){ CLIPBOARD.items.forEach(it=>{ const tr=S.tracks[clamp(ti0+it.dt,0,S.tracks.length-1)], c={...JSON.parse(JSON.stringify(it.c)),id:nid()}; c.start=pos+it.c.start;
      if(it.kind!==tr.kind) c.notes=mapNotesKind(c.notes,it.kind,tr.kind); eraseRange(tr,c.start,clipEnd(c)); tr.clips.push(c); newIds.add(c.id); }); }
  else CLIPBOARD.tracks.forEach((src,i)=>{ const tr=S.tracks[ti0+i]; if(!tr||!src.notes.length&&CLIPBOARD.type!=='range') return; if(!tr) return;
      const notes=mapNotesKind(src.notes.map(n=>({...n})),src.kind,tr.kind), c=newClip(pos,CLIPBOARD.len,notes,{name:'Pasted'}); eraseRange(tr,pos,pos+CLIPBOARD.len); tr.clips.push(c); newIds.add(c.id); });
  SEL={clips:newIds,notes:new Set()}; RANGE=null; markDirty(); if(pos+CLIPBOARD.len>S.len){ S.len=Math.ceil((pos+CLIPBOARD.len)/16)*16; renderSongLen(); }
  persist(); sizeLanes(); toast(`Pasted onto ${tr0.name} at ${fmtMS(pos*stepDur())}. It plays with that track’s instrument.`,[{label:'Undo',fn:undo}]);
}
function cmdDuplicate(){
  if(RANGE&&RANGE.b>RANGE.a){ const r={...RANGE}, trs=S.tracks.slice(r.t0,r.t1+1), L=r.b-r.a; pushHist();
    trs.forEach(t=>{ const notes=notesInRange(t,r.a,r.b); eraseRange(t,r.b,r.b+L); if(notes.length) t.clips.push(newClip(r.b,L,notes,{name:'Copy'})); });
    RANGE={...r,a:r.b,b:r.b+L}; if(r.b+L>S.len){ S.len=Math.ceil((r.b+L)/16)*16; renderSongLen(); } markDirty(); persist(); sizeLanes(); return; }
  const cl=selClips(); if(!cl.length){ toast('Select clips or a range to duplicate'); return; } pushHist();
  const s0=Math.min(...cl.map(x=>x.c.start)), e0=Math.max(...cl.map(x=>clipEnd(x.c))), L=e0-s0, ids=new Set();
  cl.forEach(({tr,c})=>{ const d=JSON.parse(JSON.stringify(c)); d.id=nid(); d.start=c.start+L; eraseRange(tr,d.start,clipEnd(d)); tr.clips.push(d); ids.add(d.id); });
  SEL.clips=ids; if(e0+L>S.len){ S.len=Math.ceil((e0+L)/16)*16; renderSongLen(); } markDirty(); persist(); sizeLanes();
}
function cmdSplit(){
  const at=snapTo(curStep(),1); let targets=selClips().filter(x=>at>x.c.start&&at<clipEnd(x.c));
  if(!targets.length){ const tr=trackById(FOCUS); const pool=tr?[tr]:S.tracks; pool.forEach(t=>t.clips.forEach(c=>{ if(at>c.start&&at<clipEnd(c)) targets.push({tr:t,c}); })); }
  if(!targets.length){ toast('Put the playhead over a clip to split it'); return; }
  pushHist(); targets.forEach(({tr,c})=>{ const b=splitClip(tr,c,at); if(b) SEL.clips.add(b.id); }); persist(); requestDraw(); toast(`Split ${targets.length} clip${targets.length>1?'s':''} at ${fmtMS(at*stepDur())}`);
}
function cmdDelete(){
  if(SEL.notes.size){ pushHist(); S.tracks.forEach(t=>t.clips.forEach(c=>c.notes=c.notes.filter(n=>!SEL.notes.has(n)))); SEL.notes.clear(); }
  else if(RANGE&&RANGE.b>RANGE.a){ pushHist(); S.tracks.slice(RANGE.t0,RANGE.t1+1).forEach(t=>eraseRange(t,RANGE.a,RANGE.b)); }
  else if(SEL.clips.size){ pushHist(); selClips().forEach(({tr,c})=>tr.clips.splice(tr.clips.indexOf(c),1)); SEL.clips.clear(); }
  else return;
  markDirty(); persist(); requestDraw(); toast('Deleted',[{label:'Undo',fn:undo}]);
}
function nudge(dx,dy){
  if(SEL.notes.size){ pushHistOnce(); S.tracks.forEach(t=>t.clips.forEach(c=>c.notes.forEach(n=>{ if(!SEL.notes.has(n)) return; n.t=Math.max(0,n.t+dx*(t.kind==='drum'?1:(t.quant||1))); n.n=t.kind==='drum'?clamp(n.n+dy,0,PIECES.length-1):n.n+dy; })));
    markDirty(); persist(); requestDraw(); return true; }
  if(SEL.clips.size&&dx){ pushHistOnce(); selClips().forEach(({c})=>c.start=Math.max(0,c.start+dx*UI.snap)); markDirty(); persist(); sizeLanes(); return true; }
  return false;
}
function setSongLen(steps){ pushHist(); S.len=clamp(Math.round(steps),16,16*400); markDirty(); persist(); renderSongLen(); sizeLanes(); }
function renderSongLen(){ const sd=stepDur(); if(document.activeElement!==$('songLenIn')) $('songLenIn').value=fmtMS(S.len*sd); $('songBars').textContent=`${(S.len/16).toFixed(S.len%16?2:0)} bars · ${S.bpm} BPM`; }
function updateToolbar(){
  const n=SEL.clips.size; $('blendBtn').disabled=n!==2; $('blendBtn').title=n===2?'Blend the two selected clips with a transition':'Select two clips (Shift-click) to blend them';
  $('pasteBtn').disabled=!CLIPBOARD;
}

/* =========================================================
   CLIP MENU, TRACK MENU (popovers)
   ========================================================= */
function clipMenu(tr,c,x,y){
  const p=$('pop'); p.className='pop clipmenu'; pushHist();
  const lens=[[0,'none'],[2,'⅛ bar'],[4,'1 beat'],[8,'2 beats'],[16,'1 bar'],[32,'2 bars']];
  const sel=(o,cur)=>Object.entries(o).map(([k,v])=>`<option value="${k}"${k===cur?' selected':''}>${v}</option>`).join('');
  const lsel=cur=>lens.map(([v,l])=>`<option value="${v}"${v===cur?' selected':''}>${l}</option>`).join('');
  p.innerHTML=`<div class="rackhead"><span class="lbl">Clip</span><button class="btn ghost" data-a="close">Done</button></div>
    <label class="fld"><span>Name</span><input class="pin" data-k="name" spellcheck="false"></label>
    <label class="check"><input type="checkbox" data-k="loop"${c.loop?' checked':''}> <span>Loop the pattern when the clip is extended</span></label>
    <div class="prow"><label class="fld"><span>Transition in</span><select class="sel" data-k="fint">${sel(TRANS_IN,c.fin.type)}</select></label><label class="fld"><span>Length</span><select class="sel" data-k="finl">${lsel(c.fin.len)}</select></label></div>
    <div class="prow"><label class="fld"><span>Transition out</span><select class="sel" data-k="foutt">${sel(TRANS_OUT,c.fout.type)}</select></label><label class="fld"><span>Length</span><select class="sel" data-k="foutl">${lsel(c.fout.len)}</select></label></div>
    <div class="hint">${fmtMS(c.start*stepDur())} → ${fmtMS(clipEnd(c)*stepDur())} · ${c.notes.length} notes${c.loop?' · pattern '+(c.loopLen/16).toFixed(c.loopLen%16?2:0)+' bars':''}</div>
    <div class="pact"><button class="btn" data-a="split">Split at playhead</button><button class="btn" data-a="dup">Duplicate</button>${c.loop?'<button class="btn" data-a="bake">Make notes editable one by one</button>':''}<button class="btn" data-a="next">Blend with next clip</button><button class="btn danger" data-a="del">Delete</button></div>`;
  p.querySelector('[data-k="name"]').value=c.name||'';
  const upd=()=>{ markDirty(); persist(); requestDraw(); };
  p.querySelector('[data-k="name"]').oninput=e=>{ c.name=e.target.value.slice(0,40); upd(); };
  p.querySelector('[data-k="loop"]').onchange=e=>{ if(e.target.checked){ c.loop=true; c.loopLen=Math.max(1,c.loopLen||c.len); } else { bakeClip(c); } upd(); clipMenu(tr,c,x,y); hist.pop(); };
  const setT=(side,k,v)=>{ c[side][k]=v; if(k==='type'&&v!=='cut'&&!c[side].len) c[side].len=4; if(k==='type'&&v==='cut') c[side].len=0; if(k==='len'&&v>0&&c[side].type==='cut') c[side].type='fade'; upd(); clipMenu(tr,c,x,y); hist.pop(); };
  p.querySelector('[data-k="fint"]').onchange=e=>setT('fin','type',e.target.value);
  p.querySelector('[data-k="finl"]').onchange=e=>setT('fin','len',+e.target.value);
  p.querySelector('[data-k="foutt"]').onchange=e=>setT('fout','type',e.target.value);
  p.querySelector('[data-k="foutl"]').onchange=e=>setT('fout','len',+e.target.value);
  p.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ const a=b.dataset.a; closePop();
    if(a==='split'){ hist.pop(); SEL.clips=new Set([c.id]); cmdSplit(); }
    else if(a==='dup'){ hist.pop(); SEL.clips=new Set([c.id]); cmdDuplicate(); }
    else if(a==='bake'){ bakeClip(c); upd(); }
    else if(a==='del'){ tr.clips.splice(tr.clips.indexOf(c),1); SEL.clips.delete(c.id); upd(); toast('Clip deleted',[{label:'Undo',fn:undo}]); }
    else if(a==='next'){ hist.pop(); const nx=nextClipAfter(c); if(!nx){ toast('No clip after this one'); return; } SEL.clips=new Set([c.id,nx.c.id]); openBlend(); }
    else hist.length&&JSON.stringify(S)===hist[hist.length-1]&&hist.pop(); });
  placePop(p,x+8,y+8);
}
function nextClipAfter(c){ let best=null; S.tracks.forEach(tr=>tr.clips.forEach(x=>{ if(x!==c&&x.start>=c.start&&x.id!==c.id&&(x.start>c.start||clipEnd(x)>clipEnd(c))){ if(!best||x.start<best.c.start) best={tr,c:x}; } })); return best; }

/* =========================================================
   BLEND (smart transitions between two clips)
   ========================================================= */
const BLENDS={
  smart:{label:'Smart',desc:'Picks a transition from the two instruments and the tempo'},
  crossfade:{label:'Crossfade',desc:'Overlap the clips; one fades out while the other fades in',out:'fade',in:'fade',overlap:true},
  filter:{label:'Filter swap',desc:'The first closes into a low-pass, the second opens up from a high-pass',out:'filter',in:'filter',overlap:true},
  echo:{label:'Echo out',desc:'The first clip throws into tape echoes; the second fades in under them',out:'echo',in:'fade',overlap:false},
  tape:{label:'Tape stop',desc:'The first clip spins down to a stop; the second drops in hard',out:'tape',in:'cut',overlap:false},
  riser:{label:'Stutter → riser',desc:'The first clip stutters while a noise riser lifts into the second',out:'stutter',in:'riser',overlap:false},
  wash:{label:'Reverb wash',desc:'The first dissolves into reverb while the second swells out of it',out:'wash',in:'swell',overlap:true},
  cut:{label:'Hard cut',desc:'Butt the clips together with no transition',out:'cut',in:'cut',overlap:false},
};
const BL={type:'smart',len:16,move:true};
function smartBlend(A,B){
  const ia=INST[A.tr.inst], ib=INST[B.tr.inst];
  if(A.tr===B.tr||ia.id===ib.id) return 'crossfade';
  if(B.tr.kind==='drum') return 'riser';
  if(A.tr.kind==='drum') return 'echo';
  if(S.bpm<80) return 'wash';
  return 'filter';
}
function openBlend(){
  const cl=selClips(); if(cl.length!==2){ toast('Select exactly two clips (Shift-click) to blend'); return; }
  const box=$('blendList'); box.innerHTML='';
  Object.entries(BLENDS).forEach(([k,b])=>{ const l=document.createElement('label'); l.className='bopt'; l.innerHTML=`<input type="radio" name="blend" value="${k}"${BL.type===k?' checked':''}><span><b>${b.label}</b><small>${b.desc}</small></span>`; l.querySelector('input').onchange=()=>{ BL.type=k; blendPreviewText(); }; box.appendChild(l); });
  $('blendLen').querySelectorAll('button').forEach(b=>{ b.setAttribute('aria-pressed',+b.dataset.v===BL.len); b.onclick=()=>{ BL.len=+b.dataset.v; $('blendLen').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); blendPreviewText(); }; });
  $('blendMove').checked=BL.move; $('blendSheet').hidden=false; blendPreviewText();
}
function blendPreviewText(){ const cl=selClips().sort((a,b)=>a.c.start-b.c.start); if(cl.length!==2) return; const [A,B]=cl; const k=BL.type==='smart'?smartBlend(A,B):BL.type;
  $('blendInfo').textContent=`${A.tr.name}: “${A.c.name||'Clip'}” → ${B.tr.name}: “${B.c.name||'Clip'}”. ${BL.type==='smart'?'Smart picks '+BLENDS[k].label+'. ':''}${BLENDS[k].desc}.`; }
function applyBlend(){
  const cl=selClips().sort((a,b)=>a.c.start-b.c.start||clipEnd(a.c)-clipEnd(b.c)); if(cl.length!==2) return; const [A,B]=cl;
  const k=BL.type==='smart'?smartBlend(A,B):BL.type, bd=BLENDS[k], L=Math.min(BL.len,A.c.len,B.c.len);
  pushHist();
  if(BL.move){ const want=bd.overlap?clipEnd(A.c)-L:clipEnd(A.c); if(A.tr===B.tr&&bd.overlap){ /* same lane: overlap allowed, later clip drawn on top */ } B.c.start=Math.max(0,want); }
  A.c.fout={type:bd.out,len:bd.out==='cut'?0:L}; B.c.fin={type:bd.in,len:bd.in==='cut'?0:(bd.in==='fade'&&k==='echo'?Math.max(2,L/2):L)};
  markDirty(); persist(); $('blendSheet').hidden=true; sizeLanes();
  toast(`${BLENDS[k].label} between the two clips. Press play a little before ${fmtMS(clipEnd(A.c)*stepDur())} to hear it.`,[{label:'Undo',fn:undo},{label:'Hear it',fn:()=>seekTo(Math.max(0,B.c.start-16))}]);
}

/* =========================================================
   INSTRUMENT BROWSER
   ========================================================= */
const BR={mode:'new',track:null,cat:'All',q:'',pick:null};
function openBrowser(mode,trackId){
  BR.mode=mode; BR.track=trackId||null; BR.pick=trackId?trackById(trackId)?.inst:null;
  $('brTitle').textContent=mode==='new'?'Add an instrument track':'Change instrument for '+(trackById(trackId)?.name||'track');
  $('brUse').textContent=mode==='new'?'Add track':'Use instrument'; $('brNote').textContent=mode==='new'?'':'Notes stay. Drum ↔ melodic swaps map notes to the nearest pads or pitches.';
  $('browser').hidden=false; $('brSearch').value=BR.q; renderBrowser(); setTimeout(()=>$('brSearch').focus(),30);
}
function renderBrowser(){
  const cats=$('brCats'); cats.innerHTML='';
  CATS.forEach(c=>{ const n=c==='All'?INSTS.length:c==='World'?INSTS.filter(i=>i.tags.includes('world')).length:INSTS.filter(i=>i.cat===c).length; if(!n) return;
    const b=document.createElement('button'); b.className='brcat'; b.setAttribute('aria-pressed',BR.cat===c); b.innerHTML=`<span></span><small>${n}</small>`; b.querySelector('span').textContent=c; b.onclick=()=>{ BR.cat=c; renderBrowser(); }; cats.appendChild(b); });
  const q=BR.q.trim().toLowerCase(), list=$('brList'); list.innerHTML='';
  const items=INSTS.filter(i=>(BR.cat==='All'||(BR.cat==='World'?i.tags.includes('world'):i.cat===BR.cat))&&(!q||(i.name+' '+i.cat+' '+i.engine+' '+i.tags.join(' ')).toLowerCase().includes(q)));
  items.forEach(I=>{ const b=document.createElement('button'); b.className='britem'; b.setAttribute('aria-pressed',BR.pick===I.id); b.innerHTML='<b></b><small></small>'; b.querySelector('b').textContent=I.name; b.querySelector('small').textContent=I.cat+(I.tags.includes('world')?' · world':'');
    b.onclick=()=>{ BR.pick=I.id; list.querySelectorAll('.britem').forEach(x=>x.setAttribute('aria-pressed',x===b)); previewInst(I); $('brSel').textContent=I.name+' · '+I.cat; };
    b.ondblclick=()=>{ BR.pick=I.id; useBrowser(); }; list.appendChild(b); });
  $('brCount').textContent=`${items.length} of ${INSTS.length} instruments`;
  if(!items.length) list.innerHTML='<p class="hint">Nothing matches. Try “guitar”, “flute”, “bell” or “808”.</p>';
}
function previewInst(I){
  ensureAudio(); if(ac.state!=='running') ac.resume();
  const t=ac.currentTime+.03, sd=60/Math.max(90,S.bpm)/4, out=G.sum, fn=VOICES[I.engine];
  try{ if(I.kind==='drum') [[0,0],[4,4],[8,1],[12,4],[16,0],[20,5],[24,1],[26,12]].forEach(([s,pc])=>fn(ac,out,I.p,t+s*sd,.85,sd,pc,G.R));
    else [0,2,4,7].forEach((d,i)=>fn(ac,out,I.p,t+i*sd*2,.8,sd*(i===3?6:2),degToMidi(d,I.oct),G.R)); }catch(e){ console.warn(e); }
}
function setTrackInst(tr,I){
  const old=INST[tr.inst]||I; if(I.kind!==tr.kind) tr.clips.forEach(c=>c.notes=mapNotesKind(c.notes,tr.kind,I.kind));
  if(tr.name===old.name||tr.name.endsWith(' · '+old.name)) tr.name=tr.name===old.name?I.name:tr.name.replace(old.name,I.name);
  tr.inst=I.id; tr.p={...I.p}; tr.oct=I.oct; tr.kind=I.kind; markDirty(); if(G) applyGraph(G);
}
function useBrowser(){
  const I=INST[BR.pick]; if(!I){ toast('Pick an instrument first'); return; }
  pushHist();
  if(BR.mode==='new'){ const tr=newTrack(I.id); S.tracks.push(tr); FOCUS=tr.id; tr.open=true; if(G) applyGraph(G); toast(`Added ${I.name}. Double-click its lane to make a clip, or press the mic to hum.`); }
  else { const tr=trackById(BR.track); if(tr){ setTrackInst(tr,I); toast(`${tr.name} now plays ${I.name}. Same notes.`,[{label:'Undo',fn:undo}]); } }
  $('browser').hidden=true; persist(); renderTracks();
}

/* ---------- timeline frame: follow the playhead, flash heads that sound ---------- */
function timelineFrame(now){
  document.querySelectorAll('.thead[data-id]').forEach(r=>r.classList.toggle('hit',now-(lastHit[r.dataset.id]||0)<110));
  if(playing||HUM.recording){ const L=$('lanes'), x=curStep()*pps(); if(UI.follow!==false&&(x<L.scrollLeft||x>L.scrollLeft+L.clientWidth-40)) L.scrollLeft=Math.max(0,x-60); }
  drawFrame();
}

/* ---------- wiring ---------- */
/* the timeline's controls for the dock and header pins (Compose and Video) */
function registerTimelineControls(){
  const G1='Timeline';
  control({id:'addtrack',group:G1,label:'Add track',icon:'track',tip:'Pick an instrument for a new track',run:()=>openBrowser('new')});
  control({id:'hum',group:G1,label:'Hum',icon:'mic',keys:'H',tip:'Hum or beatbox into the selected track',hot:()=>HUM.recording,run:()=>$('humBtn').click()});
  control({id:'split',group:G1,label:'Split',icon:'split',keys:'S',run:()=>cmdSplit()});
  control({id:'copy',group:G1,label:'Copy',icon:'copy',keys:'⌘C',run:()=>cmdCopy(false)});
  control({id:'paste',group:G1,label:'Paste',icon:'paste',keys:'⌘V',run:()=>cmdPaste(),disabled:()=>!CLIPBOARD});
  control({id:'dup',group:G1,label:'Duplicate',icon:'duplicate',keys:'⌘D',run:()=>cmdDuplicate()});
  control({id:'del',group:G1,label:'Delete',icon:'trash',keys:'Delete',run:()=>cmdDelete()});
  control({id:'fit',group:G1,label:'Fit song',icon:'fit',tip:'Zoom to fit the whole song',run:()=>$('zoomFit').click()});
  control({id:'follow',group:G1,kind:'toggle',label:'Follow',icon:'follow',tip:'Scroll with the playhead while playing',run:()=>{ UI.follow=UI.follow===false; saveUI(); },pressed:()=>UI.follow!==false});
  control({id:'loopsel',group:G1,kind:'toggle',label:'Loop selection',icon:'cycle',tip:'Loop the selected range',run:()=>$('loopSel').click(),pressed:()=>!!UI.loopSel});
  control({id:'snap',group:G1,label:()=>'Snap '+({1:'1/16',4:'beat',16:'bar'})[UI.snap],icon:'magnet',tip:'Step through 1/16, beat and bar',run:()=>{ const order=[1,4,16], n=order[(order.indexOf(UI.snap)+1)%3]; $('snapSeg').querySelector(`button[data-v="${n}"]`).click(); }});
}
function initTimeline(){
  registerTimelineControls(); initHum();
  initLanes();
  on('draw',()=>{ staticDirty=true; });
  on('tracks',()=>{ renderHeads(); sizeLanes(); updateToolbar(); });
  on('header',renderSongLen);
  on('frame',timelineFrame);
  on('song',()=>{ fitZoom(); $('lanes').scrollLeft=0; });
  on('all',()=>{ if(!UI.pps) fitZoom(); });
  $('addTrack').onclick=()=>openBrowser('new');
  $('copyBtn').onclick=()=>cmdCopy(false); $('pasteBtn').onclick=cmdPaste; $('dupBtn').onclick=cmdDuplicate; $('splitBtn').onclick=cmdSplit; $('delBtn').onclick=cmdDelete; $('blendBtn').onclick=openBlend;
  $('snapSeg').querySelectorAll('button').forEach(b=>{ b.setAttribute('aria-pressed',+b.dataset.v===UI.snap); b.onclick=()=>{ UI.snap=+b.dataset.v; saveUI(); $('snapSeg').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); }; });
  $('zoom').oninput=e=>{ const L=$('lanes'), mid=(L.scrollLeft+L.clientWidth/2)/pps(); UI.pps=1.2*Math.pow(40,e.target.value/100); sizeLanes(); L.scrollLeft=mid*pps()-L.clientWidth/2; saveUI(); };
  $('zoomFit').onclick=()=>{ fitZoom(); $('lanes').scrollLeft=0; };
  $('songLenIn').addEventListener('change',e=>{ const m=String(e.target.value).trim().match(/^(\d+)(?::(\d{1,2}))?$/); if(!m){ toast('Type a length like 1:00 or 90'); renderSongLen(); return; } const sec=m[2]!=null?(+m[1])*60+(+m[2]):(+m[1]); setSongLen(Math.max(1,Math.round(sec/stepDur()/16))*16); toast(`Song is now ${fmtMS(S.len*stepDur())}. Drag clip edges to fill it, or drag the orange END flag.`); });
  $('loopSel').checked=!!UI.loopSel; $('loopSel').onchange=e=>{ UI.loopSel=e.target.checked; saveUI(); };
  $('brClose').onclick=()=>$('browser').hidden=true; $('browser').addEventListener('click',e=>{ if(e.target.id==='browser') $('browser').hidden=true; });
  $('brSearch').oninput=e=>{ BR.q=e.target.value; renderBrowser(); }; $('brUse').onclick=useBrowser;
  $('blendClose').onclick=()=>$('blendSheet').hidden=true; $('blendApply').onclick=applyBlend; $('blendMove').onchange=e=>BL.move=e.target.checked;
  $('blendSheet').addEventListener('click',e=>{ if(e.target.id==='blendSheet') $('blendSheet').hidden=true; });
  on('key',(e,{typing,sheetOpen,mod,k})=>{
    if(HUM.recording&&(e.key==='Escape'||e.code==='Space')&&!typing){ e.preventDefault(); if(!HUM.counting) HUM.finish(false); return true; }
    if(typing||sheetOpen) return false;
    if(mod&&k==='c'){ e.preventDefault(); cmdCopy(false); return true; } if(mod&&k==='x'){ e.preventDefault(); cmdCopy(true); return true; }
    if(mod&&k==='v'){ e.preventDefault(); cmdPaste(); return true; } if(mod&&k==='d'){ e.preventDefault(); cmdDuplicate(); return true; }
    if(mod&&k==='a'){ e.preventDefault(); SEL.clips=new Set(S.tracks.flatMap(t=>t.clips.map(c=>c.id))); requestDraw(); updateToolbar(); return true; }
    if(mod) return false;
    if(k==='delete'||k==='backspace'){ e.preventDefault(); cmdDelete(); return true; }
    if(k==='arrowleft'||k==='arrowright'||k==='arrowup'||k==='arrowdown'){ const dx=k==='arrowleft'?-1:k==='arrowright'?1:0, dy=k==='arrowup'?1:k==='arrowdown'?-1:0; if(nudge(dx,dy)){ e.preventDefault(); return true; } return false; }
    if(k==='s'&&!e.repeat){ cmdSplit(); return true; }
    if(k==='b'&&!e.repeat){ openBlend(); return true; }
    if(k==='h'&&!e.repeat){ const tr=focusTrack(); if(tr) humTrack(tr); return true; }
    return false;
  });
  new ResizeObserver(()=>{ sizeLanes(); }).observe($('lanes'));
}
