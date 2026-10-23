/* KYMA · app/timeline — the multitrack timeline used by Compose and Video
   Track heads, the lanes canvas (clips, piano roll, range selection), edit commands, clip menu,
   blends, the instrument browser and humming into a track. Studios can add lanes above the
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
  (ESCHEMA[I.engine]||[]).forEach(spec=>{
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

/* =========================================================
   HUM OR BEATBOX INTO A TRACK (any length)
   ========================================================= */
const HUMPOP={mode:'song'};
const HUM_VOICES=['Choir Mmm','Theremin','Bansuri','Cello','String Ensemble','Soft Lead','Saxophone','Flute'];
const DECAYS=new Set(['keys','pluck','mallet','kit','sample']);
function humOptions(){
  const opts=[{k:'song',label:'Whole song',a:0,b:S.len}], p=Math.floor(curStep()/16)*16;
  if(p>0&&p<S.len-4) opts.push({k:'head',label:'From the playhead to the end',a:p,b:S.len});
  if(RANGE&&RANGE.b-RANGE.a>=4) opts.push({k:'sel',label:'Only the selected range',a:RANGE.a,b:RANGE.b});
  return opts;
}
function humTrack(tr,anchor){
  if(!tr) return;
  if(HUM.busy) return;
  if(HUM.recording){ if(HUM.counting){ toast('Recording starts after the count-in. Press Cancel to back out.'); return; } HUM.finish(false); return; }
  FOCUS=tr.id; markFocus();
  const p=$('pop'), sd=stepDur(), opts=humOptions(), drum=tr.kind==='drum';
  if(!opts.some(o=>o.k===HUMPOP.mode)) HUMPOP.mode='song';
  p.className='pop clipmenu humpop';
  p.innerHTML=`<div class="rackhead"><span class="lbl">${drum?'Beatbox':'Hum'} into</span><b class="hp-t"></b></div>
    <div class="hp-opts" role="radiogroup" aria-label="How much to record">${opts.map(o=>`<label class="bopt"><input type="radio" name="hmode" value="${o.k}"${o.k===HUMPOP.mode?' checked':''}><span><b>${o.label}</b><small>${fmtMS(o.a*sd)} → ${fmtMS(o.b*sd)} · records ${fmtMS((o.b-o.a)*sd)} without stopping</small></span></label>`).join('')}</div>
    ${drum?'':`<div class="hp-row"><span class="lbl">Notes</span><div class="seg" data-style role="group" aria-label="Note style"><button data-v="smooth" aria-pressed="${UI.humStyle!=='detail'}" title="Long held notes that glide into each other, like your voice">Smooth</button><button data-v="detail" aria-pressed="${UI.humStyle==='detail'}" title="A separate note for every syllable">Every syllable</button></div></div>
    <div class="hp-row hp-inst"><span class="lbl">Play as</span><span class="hp-cur"></span></div>
    <div class="hp-chips">${HUM_VOICES.map(n=>INSTS.find(i=>i.name===n)).filter(Boolean).map(I=>`<button class="chip" data-inst="${I.id}" aria-pressed="${tr.inst===I.id}">${I.name}</button>`).join('')}</div>`}
    <label class="check"><input type="checkbox" data-k="humOpen"${UI.humOpen?' checked':''}> <span>Keep recording past the end. The song grows until I press Stop.</span></label>
    <label class="check"><input type="checkbox" data-k="humBacking"${UI.humBacking?' checked':''}> <span>Play the other tracks while I ${drum?'beatbox':'hum'} (headphones help)</span></label>
    <label class="check"><input type="checkbox" data-k="humReplace"${UI.humReplace?' checked':''}> <span>Replace what’s already on this track in that stretch</span></label>
    <p class="hint" style="margin:0">${drum?'Short sounds work best: “boom” for kick, “ka” or “psh” for snare, “ts” for hats.':'Hum on “mmm” or “doo”. Smooth keeps held notes held and glides between them; Every syllable gives each “da” its own note. Pauses are fine; the recording runs to the end.'}</p>
    <div class="pact" style="justify-content:flex-end"><button class="btn ghost" data-a="x">Cancel</button><button class="btn rec" data-a="go"><span class="rdot"></span>Start ${drum?'beatboxing':'humming'}</button></div>`;
  p.querySelector('.hp-t').textContent=tr.name;
  const showCur=()=>{ const el=p.querySelector('.hp-cur'); if(!el) return; const I=INST[tr.inst]; el.textContent=I.name+(DECAYS.has(I.engine)?' · fades out on long notes; pick a sustaining sound below for held notes':' · sustains'); el.classList.toggle('warn',DECAYS.has(I.engine)); p.querySelectorAll('[data-inst]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.inst===tr.inst)); };
  showCur();
  p.querySelectorAll('[data-style] button').forEach(b=>b.onclick=()=>{ UI.humStyle=b.dataset.v; saveUI(); p.querySelectorAll('[data-style] button').forEach(x=>x.setAttribute('aria-pressed',x===b)); });
  p.querySelectorAll('[data-inst]').forEach(b=>b.onclick=()=>{ const I=INST[b.dataset.inst]; if(!I||tr.inst===I.id) return; pushHist(); setTrackInst(tr,I); persist(); renderTracks(); showCur(); p.querySelector('.hp-t').textContent=tr.name; previewInst(I); });
  p.querySelectorAll('input[name=hmode]').forEach(r=>r.onchange=()=>{ HUMPOP.mode=r.value; });
  p.querySelectorAll('[data-k]').forEach(c=>c.onchange=()=>{ UI[c.dataset.k]=c.checked; saveUI(); });
  p.querySelector('[data-a=x]').onclick=closePop;
  p.querySelector('[data-a=go]').onclick=()=>{ const o=opts.find(x=>x.k===HUMPOP.mode)||opts[0]; closePop(); startHum(tr,o); };
  const an=anchor||document.querySelector(`.thead[data-id="${tr.id}"] .thum`)||$('humBtn'), r=an.getBoundingClientRect(); placePop(p,r.left,r.bottom+6);
  setTimeout(()=>p.querySelector('[data-a=go]').focus(),20);
}
function hud(title,time,frac,state){
  const h=$('humHud'); h.hidden=false; h.dataset.state=state||'rec';
  $('hhTitle').textContent=title; $('hhTime').textContent=time; $('hhFill').style.width=(frac==null?0:clamp(frac,0,1)*100)+'%';
  $('hhStop').hidden=state==='busy'||(state==='count'&&!!UI.humBacking); $('hhCancel').hidden=state==='busy';
  $('hhStop').textContent=state==='count'?'Skip count-in':'■ Stop and make notes';
}
function hideHud(){ $('humHud').hidden=true; }
async function startHum(tr,o){
  const sd=stepDur(), open=!!UI.humOpen, maxSec=600;
  ensureAudio(); try{ await ac.resume(); }catch(e){}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ humFail(tr,'unsupported'); return; }
  let stream; try{ stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!!UI.humBacking,noiseSuppression:false,autoGainControl:false}}); }catch(e){ humFail(tr,'blocked'); return; }
  if(playing) stopPlay();
  const pre=16, srIn=ac.sampleRate, a=o.a, b=open?a+Math.ceil(maxSec/sd):o.b, totalSec=(b-a)*sd;
  Object.assign(HUM,{recording:true,counting:true,target:tr.id,a,b,open,trace:[],chunks:[],firstT:null,stream,cur:a,nextClick:null,stopT:null});
  HUM.src=ac.createMediaStreamSource(stream); HUM.proc=ac.createScriptProcessor(2048,1,1); const z=gainN(ac,0); HUM.src.connect(HUM.proc); HUM.proc.connect(z).connect(ac.destination);
  const now=ac.currentTime+.25; HUM.t0=now+pre*sd;
  if(UI.humBacking){ HUM.exclude=tr.id; const from=Math.max(0,a-pre), missing=pre-(a-from); for(let i=0;i<missing/4;i++) click(now+i*4*sd,i===0); PH.step=from; startPlay(now+missing*sd); }
  else for(let i=0;i<4;i++) click(now+i*4*sd,i===0);
  renderHeads(); const what=tr.kind==='drum'?'Beatboxing':'Humming';
  hud(`Get ready · ${tr.name}`,'4',0,'count');
  let lastDraw=0;
  HUM.proc.onaudioprocess=e=>{
    if(!HUM.recording) return;
    const d=e.inputBuffer.getChannelData(0); if(HUM.firstT==null) HUM.firstT=ac.currentTime-d.length/srIn;
    HUM.chunks.push(new Float32Array(d));
    const t=ac.currentTime-HUM.t0;
    if(t<0){ HUM.counting=true; if(performance.now()-lastDraw>100){ lastDraw=performance.now(); hud(`Get ready · ${what} into ${tr.name} starts in`,String(Math.ceil(-t/(4*sd))),0,'count'); } return; }
    HUM.counting=false;
    if(tr.kind==='drum'){ let e2=0; for(let i=0;i<d.length;i++) e2+=d[i]*d[i]; if(Math.sqrt(e2/d.length)>.03) HUM.trace.push({s:a+t/sd,m:null}); }
    else { const m=liveYin(d,srIn); if(m!=null) HUM.trace.push({s:a+t/sd,m}); }
    HUM.cur=a+t/sd;
    if(!playing){ PH.step=Math.floor(HUM.cur);
      if(HUM.nextClick==null||HUM.nextClick<ac.currentTime) HUM.nextClick=HUM.t0+Math.ceil((ac.currentTime-HUM.t0)/(4*sd)+.05)*4*sd;
      while(HUM.nextClick<ac.currentTime+.4){ const k=Math.round((HUM.nextClick-HUM.t0)/(4*sd)); click(HUM.nextClick,k%4===0); HUM.nextClick+=4*sd; } }
    if(HUM.cur>=b){ HUM.finish(false); return; }
    if(performance.now()-lastDraw>100){ lastDraw=performance.now(); if(HUM.cur>S.len) sizeLanes(); else requestDraw();
      hud(`● ${what} into ${tr.name}`,`${fmtMS(t)} / ${open?'until you stop':fmtMS(totalSec)}`,open?null:t/totalSec,'rec'); }
  };
  HUM.finish=async(cancel)=>{
    if(!HUM.recording) return; HUM.recording=false; HUM.counting=false; clearTimeout(HUM.timer); HUM.stopT=ac.currentTime;
    try{ HUM.proc.onaudioprocess=null; HUM.src.disconnect(); HUM.proc.disconnect(); }catch(e){}
    HUM.stream.getTracks().forEach(x=>x.stop()); if(HUM.exclude){ HUM.exclude=null; if(playing) stopPlay(); }
    renderHeads();
    if(cancel){ HUM.chunks=[]; HUM.trace=[]; hideHud(); requestDraw(); toast('Recording discarded'); return; }
    const total=HUM.chunks.reduce((q,c)=>q+c.length,0), all=new Float32Array(total); let off=0; HUM.chunks.forEach(c=>{ all.set(c,off); off+=c.length; }); HUM.chunks=[];
    const lat=(ac.outputLatency||ac.baseLatency||.01)+.025, i0=clamp(Math.round((HUM.t0+lat-HUM.firstT)*srIn),0,total), i1=Math.min(total,i0+Math.round((HUM.b-HUM.a)*sd*srIn));
    if(i1-i0<srIn*.4){ hideHud(); HUM.trace=[]; requestDraw(); toast('That take was too short. Start again and keep going through the count-in.'); return; }
    const buf=new AudioBuffer({length:i1-i0,numberOfChannels:1,sampleRate:srIn}); buf.copyToChannel(all.subarray(i0,i1),0);
    HUM.busy=true; hud(`Turning your ${tr.kind==='drum'?'beatbox':'humming'} into ${INST[tr.inst]?.name||tr.name}`,fmtMS(buf.duration)+' recorded',0,'busy');
    try{ await humApply(tr,buf,HUM.a,f=>hud(`Turning your ${tr.kind==='drum'?'beatbox':'humming'} into ${INST[tr.inst]?.name||tr.name}`,Math.round(f*100)+'%',f,'busy')); }
    catch(err){ console.error(err); toast('Something went wrong converting that take. Try again.'); }
    HUM.busy=false; hideHud();
  };
  HUM.timer=setTimeout(()=>HUM.finish&&HUM.finish(false),(HUM.t0+(b-a)*sd-ac.currentTime)*1000+500);
}
function humFail(tr,code){
  const msg={blocked:'The microphone is blocked here. Open the downloaded HTML file in Chrome, Edge or Firefox and allow the mic, or use a recording.',unsupported:'This browser can’t record here. Use a recording of your humming.'}[code];
  toast(msg,[{label:'Use a recording',fn:()=>{ HUM.fileTarget=tr.id; $('humFile').click(); }}],9000);
}
async function humFromFile(file){
  const tr=trackById(HUM.fileTarget); HUM.fileTarget=null; if(!tr) return;
  try{ ensureAudio(); const b=await ac.decodeAudioData(await file.arrayBuffer()); const r=humOptions().find(o=>o.k===HUMPOP.mode)||{a:0,b:S.len}, sd=stepDur(), n=Math.min(b.length,UI.humOpen?b.length:Math.round((r.b-r.a)*sd*b.sampleRate)), m=new AudioBuffer({length:n,numberOfChannels:1,sampleRate:b.sampleRate}), md=m.getChannelData(0);
    for(let c=0;c<b.numberOfChannels;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) md[i]+=d[i]/b.numberOfChannels; }
    HUM.busy=true; hud('Turning your recording into '+tr.name,'',0,'busy'); try{ await humApply(tr,m,r.a,f=>hud('Turning your recording into '+tr.name,Math.round(f*100)+'%',f,'busy')); } finally { HUM.busy=false; hideHud(); } }
  catch(e){ toast('That file could not be decoded. Try a WAV, MP3 or M4A.'); }
}
function beatboxNotes(x,sr,sd,q){
  const hop=128, W=256, E=[]; for(let off=0;off+W<x.length;off+=hop){ let e=0; for(let i=off;i<off+W;i++) e+=x[i]*x[i]; E.push(Math.sqrt(e/W)); }
  const sorted=[...E].sort((a,b)=>a-b), gate=Math.max(.01,(sorted[Math.floor(sorted.length*.9)]||0)*.18), maxE=sorted[sorted.length-1]||1, hits=[]; let last=-1e9;
  for(let i=0;i<E.length;i++){ const t=i*hop/sr; let avg=0,n=0; for(let j=Math.max(0,i-4);j<i;j++){ avg+=E[j]; n++; } avg=n?avg/n:0; avg=Math.max(avg,gate*.25);
    if(E[i]>gate&&E[i]>avg*2&&(i===0||E[i]>=E[i-1])&&t-last>.07){ last=t;
      const s0=Math.max(0,i*hop-64), s1=Math.min(x.length,s0+Math.round(sr*.05)); let lpv=0,lo=0,tot=0,df=0;
      for(let j=s0;j<s1;j++){ lpv+=.06*(x[j]-lpv); lo+=lpv*lpv; tot+=x[j]*x[j]; if(j>s0){ const d=x[j]-x[j-1]; df+=d*d; } }
      hits.push({t,lowR:lo/(tot+1e-9),bright:df/(tot+1e-9),e:E[i]}); } }
  // kicks are mostly low end; the rest split into darker (snare) and brighter (hat) groups, adapted to this voice
  const rest=hits.filter(h=>h.lowR<=.35);
  let cut=2.6; if(rest.length>=4){ const b=rest.map(h=>h.bright).sort((a,c)=>a-c); let c1=b[0], c2=b[b.length-1];
    if(c2-c1>.35){ for(let it=0;it<12;it++){ let s1=0,n1=0,s2=0,n2=0; b.forEach(v=>{ if(Math.abs(v-c1)<=Math.abs(v-c2)){ s1+=v; n1++; } else { s2+=v; n2++; } }); c1=n1?s1/n1:c1; c2=n2?s2/n2:c2; } cut=(c1+c2)/2; }
    else cut=(b[0]+b[b.length-1])/2>2.2?-1:99; }
  const out=hits.map(h=>({t:Math.round(h.t/sd/q)*q,d:1,n:h.lowR>.35?0:h.bright>cut?4:1,v:clamp(h.e/maxE*1.25,.45,1)}));
  const seen=new Set(); return out.filter(n=>{ const k=n.t+':'+n.n; if(seen.has(k)) return false; seen.add(k); return true; });
}
async function pitchTrackAsync(x,sr,onP){
  const hop=Math.round(sr*.01), W=Math.round(sr*.025), tauMin=Math.floor(sr/FMAX), tauMax=Math.ceil(sr/FMIN), rmsAll=[];
  for(let off=0;off+W+tauMax+2<x.length;off+=hop){ let e=0; for(let j=0;j<W;j++) e+=x[off+j]*x[off+j]; rmsAll.push(Math.sqrt(e/W)); }
  const p90=arr=>{ const q=[...arr].sort((u,v)=>u-v); return q[Math.floor(q.length*.9)]||0; }, gP=p90(rmsAll), B=600, gates=[];
  for(let k=0;k<rmsAll.length;k+=B) gates.push(Math.max(.0025,.14*Math.max(p90(rmsAll.slice(k,k+B)),gP*.35)));
  const frames=[]; let i=0;
  for(let off=0;off+W+tauMax+2<x.length;off+=hop,i++){
    const t=(off+W/2)/sr, rms=rmsAll[i]; let midi=null;
    if(rms>=gates[Math.floor(i/B)]){ const y=yin(x,off,W,tauMin,tauMax,sr,.16); if(y&&y.f>=FMIN&&y.f<=FMAX) midi=hz2m(y.f); }
    frames.push({t,rms,midi});
    if(i%1200===0){ onP&&onP(.9*i/rmsAll.length); await new Promise(r=>setTimeout(r,0)); }
  }
  const out=frames.map((f,k)=>{ if(f.midi==null) return f; const w=[]; for(let j=k-2;j<=k+2;j++) if(frames[j]&&frames[j].midi!=null) w.push(frames[j].midi); return {...f,midi:median(w)}; });
  for(let k=1;k<out.length;k++){ const p=out[k-1].midi,q=out[k].midi; if(p!=null&&q!=null){ const dd=q-p; if(Math.abs(Math.abs(dd)-12)<1.2) out[k]={...out[k],midi:q-12*Math.sign(dd)}; } }
  return out;
}
/* Smooth hum → notes: bridges breath gaps, ignores vibrato and slides, keeps held notes held,
   joins touching notes (they glide on playback) and takes velocity from how loud you hummed. */
function humNotesSmooth(fr,sd,q,oct){
  const N=fr.length, dt=.01; if(!N) return {notes:[],key:null};
  const m=fr.map(f=>f.midi), voiced=m.filter(v=>v!=null); if(voiced.length<8) return {notes:[],key:null};
  const center=degToMidi(0,oct)+(oct<=2?5:7), shift=12*Math.round((center-median(voiced))/12);
  // bridge short unvoiced gaps (breaths, consonants) up to 160 ms
  const gapFill=new Uint8Array(N);
  for(let i=0;i<N;){ if(m[i]!=null){ i++; continue; } let j=i; while(j<N&&m[j]==null) j++; if(i>0&&j<N&&j-i<=16){ for(let k=i;k<j;k++){ m[k]=m[i-1]; gapFill[k]=1; } } i=j; }
  const sm=m.map((v,k)=>{ if(v==null) return null; const w=[]; for(let j=k-5;j<=k+5;j++) if(m[j]!=null) w.push(m[j]); return median(w); });
  const deg=sm.map(v=>v==null?null:nearestDeg(v+shift,oct)), rms=fr.map(f=>f.rms);
  const segs=[]; let cur=null, pend=null;
  const close=k=>{ if(cur){ cur.end=k; segs.push(cur); cur=null; } pend=null; };
  for(let k=0;k<N;k++){
    const d=deg[k]; if(d==null){ close(k); continue; }
    if(!cur){ cur={d,start:k,end:k,art:true}; continue; }
    // re-articulation on the same pitch: a clear dip then a fresh attack ("doo-doo")
    if(k>=6&&k-cur.start>14&&!gapFill[k]){ let mn=1e9; for(let j=k-6;j<k;j++) mn=Math.min(mn,rms[j]); let pk=0; for(let j=cur.start;j<k;j++) pk=Math.max(pk,rms[j]); if(mn<pk*.38&&rms[k]>mn*2.4){ close(k); cur={d,start:k,end:k,art:true}; continue; } }
    if(d===cur.d){ pend=null; cur.end=k; continue; }
    if(pend&&pend.d===d) pend.n++; else pend={d,n:1,start:k};
    if(pend.n>=7){ const st=pend.start; cur.end=st; segs.push(cur); cur={d,start:st,end:k,art:false}; pend=null; }
  }
  close(N);
  // fold blips (< 90 ms) into the previous note when they touch it
  const S2=[]; for(const g of segs){ const len=g.end-g.start, prev=S2[S2.length-1];
    if(len<9){ if(prev&&g.start-prev.end<=2&&!g.art) prev.end=g.end; else if(len>=6) S2.push(g); continue; }
    if(prev&&prev.d===g.d&&!g.art&&g.start-prev.end<=3){ prev.end=g.end; continue; } S2.push(g); }
  // loudness → velocity
  const loud=S2.map(g=>{ let a=0; for(let k=g.start;k<g.end;k++) a+=rms[k]; return a/Math.max(1,g.end-g.start); });
  const ref=[...loud].sort((u,v)=>u-v)[Math.floor(loud.length*.85)]||1;
  let notes=S2.map((g,i)=>{ const t=Math.round(g.start*dt/sd/q)*q, e=Math.round(g.end*dt/sd/q)*q; return {t,e:Math.max(t+q,e),n:g.d,v:clamp(.5+.5*loud[i]/ref,.45,1),touch:i>0&&g.start-S2[i-1].end<=2,art:g.art}; });
  notes.sort((a,b)=>a.t-b.t); notes=notes.filter((n,i)=>i===0||n.t>notes[i-1].t);
  const hold=Math.max(.2/sd,1);
  for(let i=0;i<notes.length;i++){ const n=notes[i], nx=notes[i+1]; if(nx){ if(nx.t-n.e<=hold) n.e=nx.t; n.e=Math.min(n.e,nx.t); } if(n.e<=n.t) n.e=n.t+q; }
  const out=notes.map((n,i)=>{ const o={t:n.t,d:n.e-n.t,n:n.n,v:+n.v.toFixed(2)}; if(i>0&&n.touch&&!n.art&&notes[i-1].e===n.t&&notes[i-1].n!==n.n) o.l=1; return o; });
  const key=detectKey(S2.map(g=>({start:g.start*dt,end:g.end*dt,midi:median(sm.slice(g.start,g.end).filter(v=>v!=null))})).filter(x=>isFinite(x.midi)));
  return {notes:out,key};
}
async function humApply(tr,buf,a,onP){
  const sd=stepDur(); onP&&onP(.02); const x=await toMono16k(buf), q=tr.kind==='drum'?1:(tr.quant||1), lenSteps=Math.max(4,Math.ceil(buf.duration/sd/4)*4);
  let notes=[], keyGuess=null;
  if(tr.kind==='drum') notes=beatboxNotes(x,16000,sd,q);
  else if(UI.humStyle!=='detail'){ const fr=await pitchTrackAsync(x,16000,onP); const r=humNotesSmooth(fr,sd,q,tr.oct); notes=r.notes.filter(n=>n.t<lenSteps); keyGuess=r.key; }
  else { const raw=segmentNotes(await pitchTrackAsync(x,16000,onP)); keyGuess=detectKey(raw);
    if(raw.length){ const center=degToMidi(0,tr.oct)+(tr.oct<=2?5:7), w=[]; raw.forEach(r=>{ for(let i=0;i<Math.max(1,Math.round((r.end-r.start)*20));i++) w.push(r.midi); });
      const shift=12*Math.round((center-median(w))/12);
      notes=raw.map(r=>{ const t=Math.round(r.start/sd/q)*q, e=Math.round(r.end/sd/q)*q; return {t,d:Math.max(q,e-t),n:nearestDeg(r.midi+shift,tr.oct),v:.85}; }).filter(n=>n.t<lenSteps);
      notes.sort((p,r)=>p.t-r.t); notes=notes.filter((n,i)=>i===0||n.t!==notes[i-1].t); for(let i=0;i<notes.length-1;i++) notes[i].d=Math.max(q,Math.min(notes[i].d,notes[i+1].t-notes[i].t)); } }
  onP&&onP(1);
  HUM.trace=[];
  if(!notes.length){ requestDraw(); toast(tr.kind==='drum'?'No clear hits came through. Try short “boom”, “ka” and “tss” sounds, close to the mic.':'No clear notes came through. Hum a little louder and closer, on “doo”.'); return; }
  pushHist(); HUM.count++;
  if(UI.humReplace) eraseRange(tr,a,a+lenSteps);
  const c=newClip(a,lenSteps,notes,{name:(tr.kind==='drum'?'Beatbox ':'Hum ')+HUM.count}); tr.clips.push(c); SEL={clips:new Set([c.id]),notes:new Set()}; tr.open=true;
  if(a+lenSteps>S.len){ S.len=Math.ceil((a+lenSteps)/16)*16; renderSongLen(); }
  markDirty(); persist(); renderTracks();
  const acts=[{label:'Undo',fn:undo},{label:'Play again',fn:()=>{ seekTo(a); if(!playing) startPlay(); }}];
  PH.step=a; startPlay();
  if(keyGuess&&(keyGuess.root!==S.root||keyGuess.scale!==S.scale)) acts.push({label:'Use my key: '+NOTE_NAMES[keyGuess.root]+' '+keyGuess.scale.toLowerCase(),fn:()=>{ pushHist(); S.root=keyGuess.root; S.scale=keyGuess.scale; renderHeader(); requestDraw(); persist(); }});
  toast(`${notes.length} ${tr.kind==='drum'?'hits':'notes'} over ${fmtMS(lenSteps*sd)}, now playing as ${INST[tr.inst]?.name||tr.name}. Drag notes to move them, double-click to delete.`,acts,10000);
}


/* ---------- timeline frame: follow the playhead, flash heads that sound ---------- */
function timelineFrame(now){
  document.querySelectorAll('.thead[data-id]').forEach(r=>r.classList.toggle('hit',now-(lastHit[r.dataset.id]||0)<110));
  if(playing||HUM.recording){ const L=$('lanes'), x=curStep()*pps(); if(UI.follow!==false&&(x<L.scrollLeft||x>L.scrollLeft+L.clientWidth-40)) L.scrollLeft=Math.max(0,x-60); }
  drawFrame();
}

/* ---------- wiring ---------- */
function initTimeline(){
  initLanes();
  on('draw',()=>{ staticDirty=true; });
  on('tracks',()=>{ renderHeads(); sizeLanes(); updateToolbar(); });
  on('header',renderSongLen);
  on('frame',timelineFrame);
  on('song',()=>{ fitZoom(); $('lanes').scrollLeft=0; });
  on('all',()=>{ if(!UI.pps) fitZoom(); });
  $('addTrack').onclick=()=>openBrowser('new');
  $('humBtn').onclick=()=>{ const tr=focusTrack(); if(!tr){ toast('Add a track first'); return; } humTrack(tr,$('humBtn')); };
  $('hhStop').onclick=()=>{ if(!HUM.recording) return; if(HUM.counting){ HUM.t0=ac.currentTime+.02; return; } HUM.finish(false); }; $('hhCancel').onclick=()=>HUM.finish&&HUM.finish(true);
  $('copyBtn').onclick=()=>cmdCopy(false); $('pasteBtn').onclick=cmdPaste; $('dupBtn').onclick=cmdDuplicate; $('splitBtn').onclick=cmdSplit; $('delBtn').onclick=cmdDelete; $('blendBtn').onclick=openBlend;
  $('snapSeg').querySelectorAll('button').forEach(b=>{ b.setAttribute('aria-pressed',+b.dataset.v===UI.snap); b.onclick=()=>{ UI.snap=+b.dataset.v; saveUI(); $('snapSeg').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b)); }; });
  $('zoom').oninput=e=>{ const L=$('lanes'), mid=(L.scrollLeft+L.clientWidth/2)/pps(); UI.pps=1.2*Math.pow(40,e.target.value/100); sizeLanes(); L.scrollLeft=mid*pps()-L.clientWidth/2; saveUI(); };
  $('zoomFit').onclick=()=>{ fitZoom(); $('lanes').scrollLeft=0; };
  $('songLenIn').addEventListener('change',e=>{ const m=String(e.target.value).trim().match(/^(\d+)(?::(\d{1,2}))?$/); if(!m){ toast('Type a length like 1:00 or 90'); renderSongLen(); return; } const sec=m[2]!=null?(+m[1])*60+(+m[2]):(+m[1]); setSongLen(Math.max(1,Math.round(sec/stepDur()/16))*16); toast(`Song is now ${fmtMS(S.len*stepDur())}. Drag clip edges to fill it, or drag the orange END flag.`); });
  $('loopSel').checked=!!UI.loopSel; $('loopSel').onchange=e=>{ UI.loopSel=e.target.checked; saveUI(); };
  $('humFile').onchange=e=>{ const f=e.target.files[0]; e.target.value=''; if(f) humFromFile(f); else HUM.fileTarget=null; };
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
