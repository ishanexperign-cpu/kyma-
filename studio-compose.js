/* KYMA · studio/compose — the Compose studio
   Magic patches and full-track generation above a multitrack timeline, plus eight demo songs.
   Everything here edits the open project; it autosaves as you go. */
function renderVibes(){
  const g=$('vibeGrid'); g.innerHTML='';
  Object.entries(VIBES).forEach(([name,V])=>{ const b=document.createElement('button'); b.className='vibe vc-'+name; b.setAttribute('aria-pressed',S.vibe===name);
    b.innerHTML='<span class="vname"></span><span class="vtag"></span>'; b.querySelector('.vname').textContent=name; b.querySelector('.vtag').textContent=V.tag+' · '+V.bpm[0]+'–'+V.bpm[1]+' BPM'; b.title='Start a '+name+' song (replaces the current song; undo brings it back)';
    b.onclick=()=>loadSong(vibeSong(name,false),`${name}: “${STARTERS[V.demo]?V.demo:name}”`); g.appendChild(b); });
}
function surprise(){ const v=S.vibe&&VIBES[S.vibe]?S.vibe:rnd(Object.keys(VIBES)); const song=vibeSong(v,true); loadSong(song,`New ${v} song “${song.name}”`); }
function blankSong(){ const s=newSong(); s.name=S.name; s.bpm=S.bpm; s.root=S.root; s.scale=S.scale; s.len=16*16; s.master={...S.master};
  const prev=S; S=s; ['Drums','Bass','Keys'].map(c=>INSTS.find(i=>i.cat===c)).filter(Boolean).forEach(I=>s.tracks.push(newTrack(I.id))); S=prev; return s; }
panelDefaults('compose',{dock:['play','restart','loop','undo','redo','hum','chords','addtrack','split','mgmake','m_space','mac_warmth','m_out','meter'],head:['undo','redo']});
/* the demo grid opens under the start bar */
function setDemos(open){ $('vibeBody').hidden=!open; $('demoBtn').setAttribute('aria-expanded',open); $('demoBtn').classList.toggle('open',open); }
function initCompose(){
  $('demoBtn').onclick=()=>setDemos($('vibeBody').hidden);
  control({id:'surprise',group:'Compose',label:'Surprise me',icon:'dice',tip:'Write a brand-new song in this vibe',run:surprise});
  $('ideaBtn').onclick=surprise;
  $('blankBtn').onclick=()=>loadSong(blankSong(),'Empty song with three tracks');
  on('header',()=>{ $('desc').textContent=S.desc||''; $('desc').hidden=!S.desc; });
  on('song',renderVibes);
  renderVibes();
}
boot({
  init(){ initTimeline(); initMagic(); initCompose(); initChords(); },
  fresh(){ if(innerWidth>760) setDemos(true); },
});
