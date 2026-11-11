/* KYMA · core/harmony — chords built from the song's key
   A chord is a scale degree plus a colour (triad, seventh, sus2, sus4) and an optional open voicing.
   Notes are scale degrees, like everywhere else in Kyma, so a chord always fits the key and moves
   with it. Used by the chord strips (features/chordstrip) and the atmosphere engine. */
const CHORD_COLOURS=['Triad','7th','Sus2','Sus4'];
const ROMANS=['I','II','III','IV','V','VI','VII','VIII','IX'];
const scaleLen=()=>(SCALES[S.scale]||SCALES.Minor).length;
/* semitones above the key's root for a scale degree (degrees past the octave climb) */
function degSemi(d){ const sc=SCALES[S.scale]||SCALES.Minor, n=sc.length; return sc[((d%n)+n)%n]+12*Math.floor(d/n); }
/* the degrees that make a chord, lowest first */
function chordDegs(deg,col=0,spread=0){
  const n=scaleLen(); let ds=col===1?[deg,deg+2,deg+4,deg+6]:col===2?[deg,deg+1,deg+4]:col===3?[deg,deg+3,deg+4]:[deg,deg+2,deg+4];
  if(spread){ ds=[ds[0]-n,ds[2],ds[1]+n,...ds.slice(3).map(d=>d+n)]; }
  return ds;
}
/* the chord's notes as semitones above the key root (unspread, for engines) */
const chordSemis=(deg,col=0)=>chordDegs(deg,col).map(degSemi);
const CHORD_SUFFIX={'4,7':'','3,7':'m','3,6':'dim','4,8':'aug','5,7':'sus4','2,7':'sus2','4,7,11':'maj7','4,7,10':'7','3,7,10':'m7','3,6,10':'m7♭5','3,6,9':'dim7','3,7,11':'m(maj7)','4,8,11':'maj7♯5','4,8,10':'7♯5','5,7,10':'7sus4','5,7,11':'maj7sus4','2,7,10':'7sus2','2,7,11':'maj7sus2','4,6':'♭5','4,6,11':'maj7♭5','4,6,10':'7♭5','1,7':'sus♭2','3,8':'m♯5'};
/* "Am7", plus its roman numeral in the key ("vi7") and the note names */
function chordInfo(deg,col=0){
  const semis=chordSemis(deg,col), root=semis[0], rootPc=((S.root+root)%12+12)%12;
  const iv=[...new Set(semis.slice(1).map(s=>((s-root)%12+12)%12))].filter(x=>x).sort((a,b)=>a-b), key=iv.join(',');
  const notes=semis.map(s=>NOTE_NAMES[((S.root+s)%12+12)%12]);
  const suf=CHORD_SUFFIX[key];
  const minorish=iv.includes(3)&&!iv.includes(4), dim=key.startsWith('3,6'), aug=key.startsWith('4,8');
  const n=scaleLen(), base=ROMANS[((deg%n)+n)%n]||String(deg+1);
  let roman=minorish?base.toLowerCase():base; if(dim) roman+='°'; else if(aug) roman+='+';
  if(col===1) roman=key==='3,6,10'?base.toLowerCase()+'ø7':roman+(key==='4,7,11'||key==='3,7,11'?'maj7':'7'); else if(col===2) roman+='sus2'; else if(col===3) roman+='sus4';
  return {name:suf==null?NOTE_NAMES[rootPc]+'·'+notes.slice(1).join('·'):NOTE_NAMES[rootPc]+suf, roman, notes, known:suf!=null};
}
