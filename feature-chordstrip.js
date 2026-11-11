/* KYMA · features/chordstrip — chord strips
   One strip per chord in the key. Tap a strip's head for the whole chord, touch its body for single
   notes, and drag across the bodies to strum. Dragging across the heads plays each chord in turn.
   The strips only report what was played; each studio decides what to sound and what to write.
     ChordStrip(host,{colour:()=>0..3, onChord(deg,degs,e), onNote(deg,noteDeg,e), onUp()})
     .render()      redraw for the current key, scale and colour
     .play(deg)     play a chord as if its head was tapped (number keys)
     .mark(deg)     highlight the current chord (null clears) */
function ChordStrip(host,o){
  const S2={deg:null,last:null,down:false};
  const n=()=>scaleLen();
  function cellsFor(deg){ const ds=chordDegs(deg,o.colour()), N=n(), out=[]; for(let k=0;k<2;k++) ds.forEach(d=>out.push(d+k*N)); out.push(deg+2*N); return out; }
  function render(){
    host.innerHTML=''; host.classList.add('cstrips'); host.style.setProperty('--n',n());
    for(let d=0;d<n();d++){
      const info=chordInfo(d,o.colour()), col=document.createElement('div'); col.className='cstrip'; col.dataset.d=d; col.setAttribute('role','group'); col.setAttribute('aria-label',info.name+' strip');
      const head=document.createElement('button'); head.type='button'; head.className='cs-head'; head.dataset.d=d; head.title=`${info.name} (${info.notes.join(' ')}) · key ${d+1}`;
      head.innerHTML='<small></small><b></b><kbd></kbd>'; head.querySelector('small').textContent=info.roman; head.querySelector('b').textContent=info.name; head.querySelector('kbd').textContent=d+1;
      if(!info.known) head.classList.add('long');
      const body=document.createElement('div'); body.className='cs-body'; body.setAttribute('aria-hidden','true');
      cellsFor(d).forEach((nd,i)=>{ const c=document.createElement('i'); c.dataset.d=d; c.dataset.nd=nd; c.dataset.name=NOTE_NAMES[((S.root+degSemi(nd))%12+12)%12]; if(i%chordDegs(d,o.colour()).length===0) c.className='root'; body.appendChild(c); });
      col.append(head,body); host.appendChild(col);
    }
    mark(S2.deg);
  }
  function mark(deg){ S2.deg=deg; host.querySelectorAll('.cstrip').forEach(s=>s.classList.toggle('on',deg!=null&&+s.dataset.d===deg)); }
  const flash=el=>{ el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); };
  function chord(d,e){ mark(d); const col=host.querySelector(`.cstrip[data-d="${d}"]`); if(col){ flash(col.querySelector('.cs-head')); col.querySelectorAll('.cs-body i').forEach((c,i)=>setTimeout(()=>flash(c),i*14)); }
    o.onChord&&o.onChord(d,chordDegs(d,o.colour()),e||{}); }
  function note(cell,e){ const d=+cell.dataset.d; if(S2.deg!==d) mark(d); flash(cell); o.onNote&&o.onNote(d,+cell.dataset.nd,e||{}); }
  function hitAt(x,y){ const el=document.elementFromPoint(x,y); if(!el||!host.contains(el)) return null; return el.closest('.cs-head')||(el.matches('.cs-body i')?el:null); }
  function fire(t,e){ if(!t||t===S2.last) return; S2.last=t; if(t.classList.contains('cs-head')) chord(+t.dataset.d,e); else note(t,e); }
  host.addEventListener('pointerdown',e=>{ const t=hitAt(e.clientX,e.clientY); if(!t) return; e.preventDefault(); S2.down=true; S2.last=null; try{ host.setPointerCapture(e.pointerId); }catch(err){} fire(t,{first:true}); });
  host.addEventListener('pointermove',e=>{ if(!S2.down) return; fire(hitAt(e.clientX,e.clientY),{first:false}); });
  const up=()=>{ if(!S2.down) return; S2.down=false; S2.last=null; o.onUp&&o.onUp(); };
  host.addEventListener('pointerup',up); host.addEventListener('pointercancel',up); host.addEventListener('lostpointercapture',up);
  /* the heads are buttons, so Enter and Space play them too */
  host.addEventListener('keydown',e=>{ const h=e.target.closest&&e.target.closest('.cs-head'); if(h&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); e.stopPropagation(); if(!e.repeat){ chord(+h.dataset.d,{first:true}); o.onUp&&setTimeout(o.onUp,300); } } });
  return {render,mark,play:(d,e)=>{ if(d<n()) chord(d,e); },get deg(){ return S2.deg; }};
}
