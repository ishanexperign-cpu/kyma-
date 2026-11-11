/* =========================================================
   MAGIC — endless mood-driven patches that suggest what comes next
   A patch is a clip-in-waiting: notes in scale degrees (or drum pieces), a role,
   an instrument and a place on the timeline. The deck always offers what fits
   next to the anchor: a continuation, layers for the same bars, a bridge, a build.
   ========================================================= */
const MOODS={
  Joyful:{scales:['Major','Lydian'],progs:[[0,3,4,0],[0,4,5,3],[0,3,0,4],[3,4,0,0],[0,1,3,4]],energy:.75,dens:.7,reg:1,contour:'up',bpm:[112,128],genres:['Pop','Afro','House'],
    prefer:{melody:['Glockenspiel','Flute','Wood Marimba','Whistle','Ukulele'],chords:['Ukulele','Tine Piano','Steel Pan','Vapor EP'],bass:['Pluck Bass','Round Sub'],pad:['Air Pad','Warm Strings'],arp:['Kalimba','Arp Pluck','Celesta','Steel Pan'],counter:['Clarinet','Recorder'],texture:['Wind Chimes'],drums:['909 Kit','Latin Percussion','Linn Kit']}},
  Happy:{scales:['Major'],progs:[[0,4,5,3],[0,5,3,4],[3,4,0,5],[0,3,4,4]],energy:.65,dens:.62,reg:1,contour:'arch',bpm:[100,124],genres:['Pop','Folk','House'],
    prefer:{melody:['Whistle','Soft Lead','Saxophone','Flute'],chords:['Tine Piano','Ukulele','Clean Electric','Steel Guitar'],bass:['Pluck Bass','Round Sub'],pad:['Warm Strings','Air Pad'],arp:['Arp Pluck','Glockenspiel','Kalimba'],counter:['Clarinet','Oboe'],texture:['Wind Chimes'],drums:['Linn Kit','909 Kit','Boom Bap Kit']}},
  Epic:{scales:['Minor','Harmonic minor'],progs:[[0,5,2,6],[0,6,5,6],[0,5,3,4],[5,6,0,0],[0,2,6,5]],energy:.9,dens:.55,reg:0,contour:'arch',bpm:[86,110],genres:['Cinematic','Trap','Techno'],toms:true,
    prefer:{melody:['French Horn','Brass Section','Choir Aah','Trumpet','Violin'],chords:['String Ensemble','Church Organ','Brass Section'],bass:['Contrabass','Drone Bass','808 Boom'],pad:['Ethereal Ah','Choir Aah','Tremolo Strings'],arp:['Harp','Pizzicato Strings','Tremolo Strings'],counter:['Cello','Trombone'],texture:['Bowed Metal','Gong'],drums:['Techno Kit','Boom Bap Kit','Trap Kit']}},
  Emotional:{scales:['Major','Minor'],progs:[[5,3,0,4],[0,4,5,3],[3,0,4,5],[0,5,3,4]],energy:.5,dens:.45,reg:0,contour:'arch',bpm:[68,92],genres:['Cinematic','Pop','Ambient'],
    prefer:{melody:['Cello','Violin','Tine Piano','Erhu','Choir Ooh'],chords:['Tine Piano','String Ensemble','Harp'],bass:['Contrabass','Round Sub'],pad:['Warm Strings','Ethereal Ah'],arp:['Harp','Music Box','Nylon Guitar'],counter:['Viola','Cello'],texture:['Glass Harmonica'],drums:['Soft Kit','Brush Jazz Kit']}},
  Sad:{scales:['Minor','Dorian'],progs:[[0,5,2,6],[0,3,5,4],[5,3,0,4],[0,6,5,4],[0,3,0,4]],energy:.28,dens:.35,reg:-1,contour:'down',bpm:[58,80],genres:['Ambient','Lo-fi','Cinematic'],
    prefer:{melody:['Cello','Erhu','Shakuhachi','Tine Piano','Sarangi'],chords:['Tine Piano','Warm Strings','Harp','Nylon Guitar'],bass:['Round Sub','Contrabass'],pad:['Warm Strings','Vhikk Drone','Choir Mmm'],arp:['Harp','Music Box','Nylon Guitar'],counter:['Viola','Choir Mmm'],texture:['Glass Harmonica','Singing Bowl'],drums:['Brush Jazz Kit','Soft Kit','Lo-fi Kit']}},
  Dreamy:{scales:['Lydian','Major'],progs:[[0,1,0,1],[0,3,0,3],[3,0,5,4],[0,5,1,3]],energy:.32,dens:.38,reg:1,contour:'arch',bpm:[64,88],genres:['Ambient','Vaporwave','Lo-fi'],seventh:true,
    prefer:{melody:['Vibraphone','Glass Bell','Celesta','Flute','Theremin'],chords:['Vapor EP','Vibraphone','Juno Pad'],bass:['Round Sub','Drone Bass'],pad:['Dream Pad','Shimmer Pad','Air Pad'],arp:['Celesta','Music Box','Kalimba','Harp'],counter:['Choir Ooh','Ethereal Ah'],texture:['Wind Chimes','Glass Harmonica'],drums:['Soft Kit','Vapor Kit','Lo-fi Kit']}},
  Chill:{scales:['Dorian','Minor'],progs:[[0,3,0,3],[1,4,0,0],[0,5,1,4],[0,3,6,2]],energy:.4,dens:.5,reg:0,contour:'flat',bpm:[72,92],genres:['Lo-fi','Hip-hop','Jazz'],seventh:true,swing:.25,
    prefer:{melody:['Vapor EP','Muted Trumpet','Flute','Nylon Guitar'],chords:['Lofi Keys','Vapor EP','Nylon Guitar','Clean Electric'],bass:['Round Sub','Finger Bass','Contrabass'],pad:['Warm Strings','Air Pad'],arp:['Nylon Guitar','Kalimba','Vibraphone'],counter:['Saxophone','Flute'],texture:['Rain Glass','Breath Organ'],drums:['Lo-fi Kit','Boom Bap Kit','Brush Jazz Kit']}},
  Romantic:{scales:['Major'],progs:[[1,4,0,5],[0,5,1,4],[3,2,1,4],[0,3,1,4]],energy:.42,dens:.45,reg:0,contour:'arch',bpm:[66,90],genres:['Jazz','Pop','Cinematic'],seventh:true,
    prefer:{melody:['Saxophone','Violin','Muted Trumpet','Flute'],chords:['Vapor EP','Tine Piano','String Ensemble','Nylon Guitar'],bass:['Contrabass','Round Sub'],pad:['Warm Strings','Choir Ooh'],arp:['Harp','Nylon Guitar','Vibraphone'],counter:['Cello','Clarinet'],texture:['Glass Harmonica'],drums:['Brush Jazz Kit','Soft Kit']}},
  Dark:{scales:['Phrygian','Harmonic minor','Minor'],progs:[[0,1,0,6],[0,5,1,0],[0,0,5,1],[0,6,5,1]],energy:.6,dens:.45,reg:-1,contour:'down',bpm:[84,132],genres:['Techno','Trap','Cinematic'],
    prefer:{melody:['Hollow Lead','Duduk','Dark Bell','Shakuhachi'],chords:['Dark Matter','Church Organ','Tremolo Strings'],bass:['Acid-ish','808 Boom','Drone Bass','Wobble Bass'],pad:['Dark Matter','Monks','Vhikk Drone'],arp:['Dark Bell','Pizzicato Strings','Arp Pluck'],counter:['Monks','Cello'],texture:['Bowed Metal','Gong','Stutter'],drums:['Techno Kit','Trap Kit','808 Kit']}},
  Tense:{scales:['Harmonic minor','Phrygian'],progs:[[0,0,1,0],[0,6,5,4],[0,1,6,0],[0,4,0,4]],energy:.82,dens:.72,reg:0,contour:'up',bpm:[100,140],genres:['Cinematic','Techno','Trap'],ostinato:true,
    prefer:{melody:['Tremolo Strings','Violin','Square Lead','Shehnai'],chords:['Tremolo Strings','Brass Section','Church Organ'],bass:['Acid-ish','Contrabass','Synthwave Pulse'],pad:['Tremolo Strings','Dark Matter'],arp:['Pizzicato Strings','Arp Pluck','Harpsichord'],counter:['Cello','Trombone'],texture:['Stutter','Bowed Metal'],drums:['Techno Kit','Trap Kit','909 Kit']}},
  Hopeful:{scales:['Major','Lydian'],progs:[[3,4,5,0],[0,4,5,3],[5,3,0,4],[0,1,3,4]],energy:.58,dens:.52,reg:1,contour:'up',bpm:[84,112],genres:['Pop','Cinematic','Folk'],
    prefer:{melody:['Bansuri','Flute','French Horn','Violin'],chords:['Tine Piano','Steel Guitar','String Ensemble'],bass:['Round Sub','Contrabass'],pad:['Air Pad','Shimmer Pad','Choir Aah'],arp:['Harp','Glockenspiel','Kalimba'],counter:['Cello','Clarinet'],texture:['Wind Chimes'],drums:['Soft Kit','Linn Kit','Latin Percussion']}},
  Mysterious:{scales:['Dorian','Phrygian','Bhairav'],progs:[[0,1,0,1],[0,6,0,5],[0,3,1,0]],energy:.4,dens:.4,reg:0,contour:'flat',bpm:[70,100],genres:['Raga','Ambient','Techno'],
    prefer:{melody:['Shakuhachi','Theremin','Duduk','Sitar','Santoor'],chords:['Koto','Harp','Gamelan'],bass:['Drone Bass','Contrabass'],pad:['Tanpura Drone','Monks','Vhikk Drone'],arp:['Santoor','Koto','Gamelan','Kalimba'],counter:['Sarangi','Monks'],texture:['Singing Bowl','Bowed Metal'],drums:['Tabla & Percussion','Soft Kit','Latin Percussion']}},
};
// more moods, in the spirit of a creator music library: each starts from a close relative and adjusts it
const MOOD_DERIVE={
  Calm:['Dreamy',{energy:.22,dens:.3,bpm:[60,82],genres:['Ambient','Lo-fi','Classical']}],
  Peaceful:['Dreamy',{energy:.2,scales:['Major','Lydian'],genres:['Ambient','Folk','Classical']}],
  Relaxing:['Chill',{energy:.3,dens:.4,genres:['Lo-fi','Jazz','Ambient']}],
  Meditative:['Mysterious',{energy:.12,dens:.2,bpm:[54,72],genres:['Drone','Ambient','Raga'],progs:[[0,0,0,0],[0,0,3,0],[0,5,0,0]],contour:'flat'}],
  Energetic:['Joyful',{energy:.88,dens:.78,bpm:[120,140],genres:['EDM','Rock','House']}],
  Upbeat:['Happy',{energy:.75,bpm:[106,126],genres:['Pop','Disco','Funk']}],
  Uplifting:['Hopeful',{energy:.68,bpm:[96,124],genres:['Pop','EDM','Cinematic']}],
  Inspiring:['Hopeful',{energy:.6,genres:['Cinematic','Pop','Classical'],contour:'up'}],
  Powerful:['Epic',{energy:.95,bpm:[110,150],genres:['Rock','Cinematic','EDM']}],
  Hype:['Tense',{energy:.95,scales:['Minor','Phrygian'],bpm:[130,150],genres:['Trap','Phonk','EDM'],ostinato:false}],
  Exciting:['Joyful',{energy:.85,genres:['EDM','Pop','Rock']}],
  Fun:['Happy',{energy:.72,genres:['Pop','Chiptune','Funk'],prefer:{melody:['Glockenspiel','Xylophone','Ukulele','Whistle'],arp:['Xylophone','Kalimba','Glockenspiel'],chords:['Ukulele','Clavinet','Tine Piano']}}],
  Cool:['Chill',{energy:.55,scales:['Dorian'],bpm:[84,110],genres:['Synthwave','Hip-hop','Electronic']}],
  Aesthetic:['Dreamy',{energy:.38,genres:['Vaporwave','Lo-fi','Synthwave']}],
  Dramatic:['Epic',{energy:.65,dens:.45,bpm:[68,96],genres:['Cinematic','Classical'],contour:'down'}],
};
Object.entries(MOOD_DERIVE).forEach(([k,[base,o]])=>{ const B=MOODS[base]; MOODS[k]={...B,...o,prefer:{...B.prefer,...(o.prefer||{})}}; });
const MOOD_ORDER=['Happy','Joyful','Upbeat','Fun','Energetic','Exciting','Hype','Powerful','Epic','Dramatic','Inspiring','Uplifting','Hopeful','Emotional','Romantic','Sad','Chill','Relaxing','Calm','Peaceful','Meditative','Dreamy','Aesthetic','Cool','Mysterious','Dark','Tense'];
const GENRES={
  Pop:{feel:'pop',bpm:[96,122],swing:0,insts:{drums:'Linn Kit',bass:'Pluck Bass',chords:'Tine Piano',melody:'Soft Lead',arp:'Arp Pluck',pad:'Warm Strings',counter:'Clarinet',texture:'Wind Chimes'}},
  Cinematic:{feel:'cine',bpm:[70,104],swing:0,insts:{drums:'Boom Bap Kit',bass:'Contrabass',chords:'String Ensemble',melody:'French Horn',arp:'Harp',pad:'Ethereal Ah',counter:'Cello',texture:'Bowed Metal'}},
  Ambient:{feel:'slow',bpm:[54,72],swing:0,insts:{drums:'Soft Kit',bass:'Drone Bass',chords:'Vhikk Drone',melody:'Glass Bell',arp:'Celesta',pad:'Air Pad',counter:'Choir Ooh',texture:'SMR Arcs'}},
  'Lo-fi':{feel:'groove',bpm:[72,88],swing:.3,insts:{drums:'Lo-fi Kit',bass:'Round Sub',chords:'Lofi Keys',melody:'Vapor EP',arp:'Nylon Guitar',pad:'Warm Strings',counter:'Flute',texture:'Rain Glass'}},
  'Hip-hop':{feel:'boom',bpm:[82,96],swing:.18,insts:{drums:'Boom Bap Kit',bass:'Round Sub',chords:'Vapor EP',melody:'Muted Trumpet',arp:'Vibraphone',pad:'Warm Strings',counter:'Saxophone',texture:'Choir Hit'}},
  Jazz:{feel:'jazz',bpm:[84,132],swing:.4,insts:{drums:'Brush Jazz Kit',bass:'Contrabass',chords:'Vapor EP',melody:'Saxophone',arp:'Vibraphone',pad:'Warm Strings',counter:'Muted Trumpet',texture:'Glass Harmonica'}},
  Synthwave:{feel:'synth',bpm:[96,112],swing:0,insts:{drums:'Linn Kit',bass:'Synthwave Pulse',chords:'Juno Pad',melody:'Saw Lead',arp:'Arp Pluck',pad:'Juno Pad',counter:'Soft Lead',texture:'Breath Organ'}},
  Vaporwave:{feel:'vapor',bpm:[64,80],swing:.08,insts:{drums:'Vapor Kit',bass:'Vapor Bass',chords:'Vapor EP',melody:'Saxophone',arp:'Celesta',pad:'Vapor Haze',counter:'Choir Ooh',texture:'Mall Choir'}},
  House:{feel:'four',bpm:[118,126],swing:.12,insts:{drums:'909 Kit',bass:'Pluck Bass',chords:'Soft Pluck',melody:'Soft Lead',arp:'Arp Pluck',pad:'Glass Choir',counter:'Whistle',texture:'SMR Arcs'}},
  Techno:{feel:'techno',bpm:[124,134],swing:.04,insts:{drums:'Techno Kit',bass:'Acid-ish',chords:'Dark Matter',melody:'Hollow Lead',arp:'Dark Bell',pad:'Dark Matter',counter:'Monks',texture:'Stutter'}},
  Trap:{feel:'trap',bpm:[136,150],swing:0,insts:{drums:'Trap Kit',bass:'808 Slide',chords:'Dark Bell',melody:'Dark Bell',arp:'Pizzicato Strings',pad:'Trap Choir',counter:'Choir Ooh',texture:'Rain Glass'}},
  Afro:{feel:'afro',bpm:[100,114],swing:.1,insts:{drums:'Latin Percussion',bass:'Pluck Bass',chords:'Clean Electric',melody:'Kalimba',arp:'Steel Pan',pad:'Air Pad',counter:'Whistle',texture:'Wind Chimes'}},
  Folk:{feel:'folk',bpm:[80,112],swing:.06,insts:{drums:'Soft Kit',bass:'Contrabass',chords:'Steel Guitar',melody:'Whistle',arp:'Banjo',pad:'Accordion',counter:'Violin',texture:'Wind Chimes'}},
  Raga:{feel:'raga',bpm:[80,96],swing:.15,insts:{drums:'Tabla & Percussion',bass:'Drone Bass',chords:'Santoor',melody:'Bansuri',arp:'Sitar',pad:'Tanpura Drone',counter:'Sarangi',texture:'Singing Bowl'}},
  EDM:{feel:'edm',bpm:[124,130],swing:0,insts:{drums:'909 Kit',bass:'Pluck Bass',chords:'Supersaw Chords',melody:'Supersaw',arp:'Arp Pluck',pad:'Shimmer Pad',counter:'Soft Lead',texture:'Stutter'}},
  Electronic:{feel:'electro',bpm:[100,124],swing:.04,insts:{drums:'Techno Kit',bass:'Synthwave Pulse',chords:'Juno Pad',melody:'Sync Lead',arp:'Arp Pluck',pad:'Air Pad',counter:'Soft Lead',texture:'SMR Arcs'}},
  Phonk:{feel:'phonk',bpm:[130,150],swing:0,insts:{drums:'Trap Kit',bass:'808 Slide',chords:'Dark Matter',melody:'Phonk Cowbell',arp:'Phonk Cowbell',pad:'Trap Choir',counter:'Choir Hit',texture:'Stutter'}},
  Disco:{feel:'disco',bpm:[112,124],swing:.05,insts:{drums:'Linn Kit',bass:'Funk Bass',chords:'Disco Strings',melody:'Disco Strings',arp:'Clean Electric',pad:'Disco Strings',counter:'Brass Section',texture:'Choir Hit'}},
  Funk:{feel:'funk',bpm:[96,112],swing:.12,insts:{drums:'Boom Bap Kit',bass:'Funk Bass',chords:'Clavinet',melody:'Brass Section',arp:'Clean Electric',pad:'Combo Organ',counter:'Saxophone',texture:'Choir Hit'}},
  Rock:{feel:'rock',bpm:[108,140],swing:0,insts:{drums:'Boom Bap Kit',bass:'Pluck Bass',chords:'Power Chords',melody:'Crunch Guitar',arp:'Clean Electric',pad:'Combo Organ',counter:'Crunch Guitar',texture:'Bowed Metal'}},
  Classical:{feel:'classical',bpm:[66,108],swing:0,insts:{drums:'Soft Kit',bass:'Cello',chords:'String Ensemble',melody:'Violin',arp:'Harp',pad:'String Ensemble',counter:'Viola',texture:'Glass Harmonica'}},
  Tropical:{feel:'tropical',bpm:[96,110],swing:.04,insts:{drums:'Latin Percussion',bass:'Round Sub',chords:'Steel Pan',melody:'Pan Flute',arp:'Wood Marimba',pad:'Air Pad',counter:'Whistle',texture:'Wind Chimes'}},
  Chiptune:{feel:'chip',bpm:[120,150],swing:0,insts:{drums:'808 Kit',bass:'Chip Bass',chords:'Chip Arp',melody:'Chip Square',arp:'Chip Arp',pad:'Chip Square',counter:'Chip Square',texture:'Chip Arp'}},
  Medieval:{feel:'medieval',bpm:[84,112],swing:.08,insts:{drums:'Soft Kit',bass:'Drone Bass',chords:'Lute',melody:'Recorder',arp:'Harp',pad:'Harmonium',counter:'Lute',texture:'Monks'}},
  Drone:{feel:'drone',bpm:[50,70],swing:0,insts:{drums:'Soft Kit',bass:'Drone Bass',chords:'Vhikk Drone',melody:'Singing Bowl',arp:'Celesta',pad:'Tanpura Drone',counter:'Monks',texture:'Bowed Metal'}},
};
/* ---------- learned from the training set ----------
   29 reference tracks were analysed offline (tempo, key, chord movement, 16-step onset grids per band,
   energy arcs, spectrum, stereo width, endings, one-shot envelopes). Only the statistics were kept;
   no audio, melodies or lyrics from them are in this file. What changed because of it is listed in TRAINED.rules. */
const TRAINED={tracks:29,
  spectrum:{sub:-6.3,bass:-2.6,lowmid:-6.8,mid:-13.1,pres:-24.4,air:-33.6},
  cutdownArc:[.21,.25,.35,.39,.42,.46,.46,.55,.56,.6,.54,.7,.71,.79,.79,.87,.81,.71,.74,.71,.67,.55,.29,.06],
  rules:[
    'Short edits (about 30 s) build steadily, peak around 70% of the way through and end on a hit — 6 of the 9 cutdowns end on a hit, and every full song fades. Tracks of a minute or less now end on a hit; longer songs fade.',
    'Full songs take 10–14 s to arrive; short edits arrive in under 5 s. Intros are now timed in seconds, not a fixed bar count.',
    'Off-beats land late (median 0.59 of a beat) and timing is loose. Every note now gets a small timing and velocity drift; how much depends on the genre.',
    'Mixes sit warm: most energy is at 60–250 Hz, with presence about 22 dB and air about 31 dB lower. A fixed master EQ was fitted by rendering generated tracks and comparing them; they now land within 1 dB of the reference balance in every band. Parts are also panned wider and the master is widened.',
    'Moves that came up again and again — rocking I–iii, vi–V–I–IV, i–♭VII, ♭III–i–♭VI–iv, ♭VI against vi — were added to the matching moods.',
    'Pads and hopeful moods voice chords with an added 9th and an open spread.',
    'Atmospheres are very wide (side/mid about 0.95), dark (kyma centroid about 850 Hz) and sub-heavy, and some rise slowly. The Atmos studio defaults and its Rise control follow this.',
    'Risers run about 7 s and get roughly ten times brighter by the end; trailer hits swell for about 1.2 s and end dark; exhales peak halfway, low around 400 Hz. The FX one-shots are shaped the same way and placed so the peak lands on the cut.',
    'New styles from the set: Dream pop, Shoegaze, Chillwave, Brazilian funk, Slowed + reverb, Indie ballad and Trailer.'
  ]};
Object.assign(GENRES,{
  'Dream pop':{feel:'dreampop',bpm:[86,100],swing:.08,human:.55,master:{space:1,size:6,tone:-.25},insts:{drums:'Soft Kit',bass:'Round Sub',chords:'Clean Electric',melody:'Clean Electric',arp:'Clean Electric',pad:'Air Pad',counter:'Choir Ooh',texture:'Glass Harmonica'}},
  Shoegaze:{feel:'shoegaze',bpm:[110,128],swing:0,human:.5,master:{space:1.1,size:5,tape:.55,tone:-.1},insts:{drums:'Boom Bap Kit',bass:'Pluck Bass',chords:'Power Chords',melody:'Crunch Guitar',arp:'Crunch Guitar',pad:'Supersaw Chords',counter:'Choir Aah',texture:'Bowed Metal'}},
  Chillwave:{feel:'chillwave',bpm:[108,120],swing:.06,human:.35,master:{pump:.3,space:.7,tone:-.15},insts:{drums:'Linn Kit',bass:'Pluck Bass',chords:'Juno Pad',melody:'Soft Lead',arp:'Arp Pluck',pad:'Juno Pad',counter:'Clean Electric',texture:'Breath Organ'}},
  'Brazilian funk':{feel:'funkbr',bpm:[124,132],swing:0,human:.15,master:{pump:.45,glue:.6,tone:-.05},insts:{drums:'Trap Kit',bass:'808 Slide',chords:'Dark Bell',melody:'Phonk Cowbell',arp:'Phonk Cowbell',pad:'Trap Choir',counter:'Choir Hit',texture:'Stutter'}},
  'Slowed + reverb':{feel:'slowed',bpm:[66,82],swing:.04,human:.3,master:{space:1.15,size:7,tone:-.5,tape:.5,warble:.22},insts:{drums:'Trap Kit',bass:'808 Boom',chords:'Vapor EP',melody:'Vapor EP',arp:'Celesta',pad:'Vapor Haze',counter:'Choir Ooh',texture:'Rain Glass'}},
  'Indie ballad':{feel:'ballad',bpm:[64,80],swing:.05,human:.55,master:{space:.85,tone:-.2},insts:{drums:'Brush Jazz Kit',bass:'Round Sub',chords:'Tine Piano',melody:'Tine Piano',arp:'Nylon Guitar',pad:'Warm Strings',counter:'Cello',texture:'Glass Harmonica'}},
  Trailer:{feel:'cine',bpm:[90,112],swing:0,human:.2,structure:'trailer',master:{space:.9,size:6,glue:.5},insts:{drums:'Boom Bap Kit',bass:'Contrabass',chords:'String Ensemble',melody:'French Horn',arp:'Tremolo Strings',pad:'Ethereal Ah',counter:'Choir Aah',texture:'Bowed Metal'}},
});
const GENRE_ORDER=['Lo-fi','Hip-hop','Trap','Phonk','Brazilian funk','House','Disco','Funk','EDM','Techno','Electronic','Synthwave','Chillwave','Vaporwave','Slowed + reverb','Pop','Dream pop','Shoegaze','Rock','Indie ballad','Jazz','Classical','Cinematic','Trailer','Ambient','Drone','Folk','Medieval','Tropical','Afro','Raga','Chiptune'];
const LEARN_PROGS={Hopeful:[[5,4,0,3]],Uplifting:[[5,4,0,3]],Inspiring:[[5,4,0,3]],Emotional:[[5,4,0,3]],Happy:[[0,2,0,2],[5,4,0,3]],Chill:[[0,2,0,2]],Dreamy:[[0,2,0,2]],Epic:[[0,6,0,6]],Powerful:[[0,6,0,6]],Dark:[[0,6,0,6]],Cool:[[2,0,5,3]],Aesthetic:[[2,0,5,3]],Sad:[[2,0,5,3]],Mysterious:[[5,5,0,0]],Relaxing:[[0,2,0,2]]};
Object.entries(LEARN_PROGS).forEach(([m,ps])=>{ if(MOODS[m]) MOODS[m]={...MOODS[m],progs:[...MOODS[m].progs,...ps]}; });
['Hopeful','Uplifting','Inspiring','Emotional','Dreamy','Peaceful','Calm'].forEach(m=>{ if(MOODS[m]) MOODS[m]={...MOODS[m],add9:true}; });
['Sad','Dreamy','Aesthetic','Romantic','Chill','Relaxing'].forEach(m=>{ if(MOODS[m]&&!MOODS[m].genres.includes('Dream pop')) MOODS[m]={...MOODS[m],genres:[...MOODS[m].genres]}; });
MOODS.Sad={...MOODS.Sad,genres:['Indie ballad','Dream pop','Lo-fi']}; MOODS.Aesthetic={...MOODS.Aesthetic,genres:['Chillwave','Vaporwave','Slowed + reverb']}; MOODS.Hype={...MOODS.Hype,genres:['Brazilian funk','Phonk','Trap']};
const ROLE_INFO={
  drums:{label:'Drums',kind:'drum'},bass:{label:'Bass'},chords:{label:'Chords'},melody:{label:'Melody'},
  arp:{label:'Arp'},pad:{label:'Pad'},counter:{label:'Counter-line'},texture:{label:'Texture'}
};
const COMPLEMENT={melody:['chords','bass','drums','counter','pad'],chords:['melody','bass','drums','arp'],bass:['drums','chords','melody'],drums:['bass','chords','melody','arp'],
  pad:['melody','arp','bass','drums'],arp:['bass','pad','melody','drums'],counter:['chords','bass','drums'],texture:['pad','melody','bass']};
var MAGIC={mood:'Joyful',genre:'Any',energy:.6,bars:4,use:null,len:150,tab:'genre',deck:[],anchor:null,seq:0,pv:null,busy:false};
try{ const m=JSON.parse(localStorage.getItem('kyma.magic')||localStorage.getItem('ghostloop.magic')||'{}'); if(MOODS[m.mood]) MAGIC.mood=m.mood; if(m.genre==='Any'||GENRES[m.genre]) MAGIC.genre=m.genre; if(isFinite(m.energy)) MAGIC.energy=clamp(+m.energy,0,1); if([2,4,8].includes(m.bars)) MAGIC.bars=m.bars; if(typeof m.use==='string') MAGIC.use=m.use; if([15,30,60,150,210].includes(m.len)) MAGIC.len=m.len; if(m.tab==='use') MAGIC.tab='use'; }catch(e){}
function saveMagic(){ try{ localStorage.setItem('kyma.magic',JSON.stringify({mood:MAGIC.mood,genre:MAGIC.genre,energy:MAGIC.energy,bars:MAGIC.bars,use:MAGIC.use,len:MAGIC.len,tab:MAGIC.tab})); }catch(e){} }

/* ---------- helpers ---------- */
function wpick(a,w){ if(!w) return a[Math.floor(Math.random()*a.length)]; let s=0; for(const x of w) s+=x; let r=Math.random()*s; for(let i=0;i<a.length;i++){ r-=w[i]; if(r<=0) return a[i]; } return a[a.length-1]; }
const scaleN=()=>(SCALES[S.scale]||SCALES.Minor).length;
const moodP=()=>MOODS[MAGIC.mood]||MOODS.Joyful;
function genreName(){ if(MAGIC.genre!=='Any') return MAGIC.genre; if(S.vibe&&GENRES[S.vibe]) return S.vibe;
  const v={'Lo-fi':'Lo-fi',Ambient:'Ambient',Synthwave:'Synthwave',Vaporwave:'Vaporwave',House:'House',Techno:'Techno',Trap:'Trap',Raga:'Raga'}[S.vibe]; return v||moodP().genres[0]; }
const genreP=()=>GENRES[genreName()]||GENRES.Pop;
const instByNameMagic=n=>INSTS.find(i=>i.name===n);
function nearestTone(tones,x,n){ let best=tones[0],bd=1e9; for(const t of tones) for(let k=-3;k<=3;k++){ const v=t+k*n, d=Math.abs(v-x); if(d<bd){ bd=d; best=v; } } return best; }
function trackRole(tr){
  if(tr.role&&ROLE_INFO[tr.role]) return tr.role;
  if(tr.kind==='drum') return 'drums';
  const pre=(tr.name.split(' · ')[0]||'').toLowerCase();
  const map={drums:'drums',bass:'bass',chords:'chords',melody:'melody',ghost:'texture',voice:'texture',pad:'pad',arp:'arp',counter:'counter','counter-line':'counter',texture:'texture'}; if(map[pre]) return map[pre];
  const I=INST[tr.inst]; return ({Bass:'bass',Pads:'pad',Textures:'texture',Keys:'chords',Organ:'chords',Plucked:'arp',Mallets:'arp',Strings:'pad',Winds:'melody',Brass:'melody',Leads:'melody',Choir:'pad'})[I&&I.cat]||'melody';
}
function rangeHasRole(role,a,b,exceptTrack){ return S.tracks.some(tr=>tr!==exceptTrack&&trackRole(tr)===role&&tr.clips.some(c=>c.start<b&&clipEnd(c)>a&&c.notes.length)); }
function songEnd(){ return S.tracks.reduce((m,t)=>t.clips.reduce((x,c)=>c.notes.length?Math.max(x,clipEnd(c)):x,m),0); }

/* ---------- harmony ---------- */
function inferChord(bar){
  const w=new Array(7).fill(0), n=scaleN(); let any=false;
  for(const tr of S.tracks){ if(tr.kind==='drum') continue; const wt=trackRole(tr)==='bass'?2.2:1;
    for(const c of tr.clips){ if(c.start>=(bar+1)*16||clipEnd(c)<=bar*16) continue;
      for(const e of flatten(c)){ if(e.at+e.d<=bar*16||e.at>=(bar+1)*16) continue; const pc=((e.n%n)+n)%n%7; w[pc]+=Math.min(e.d,16)*(e.at%4<.01?1.5:1)*wt; any=true; } } }
  if(!any) return null;
  let best=0,bs=-1; for(let r=0;r<7;r++){ const sc=w[r]*1.35+w[(r+2)%7]+w[(r+4)%7]*.85-w[(r+1)%7]*.25; if(sc>bs){ bs=sc; best=r; } } return best;
}
function chordAtBar(bar){ const m=S.magic&&S.magic.prog; if(m&&m[bar]!=null) return m[bar]; return inferChord(bar); }
const NEXT_CH={0:[3,4,5,1,2],1:[4,6,3],2:[5,3,1],3:[4,0,1,6],4:[0,5,3],5:[3,1,4,2],6:[0,2,5]};
function planProg(start,bars,o){
  o=o||{}; const M=moodP();
  if(o.layer){ const got=[]; let last=null; for(let b=0;b<bars;b++){ let c=chordAtBar(start+b); if(c==null) c=last; got.push(c); if(c!=null) last=c; }
    if(got.some(c=>c!=null)){ const first=got.find(c=>c!=null); return got.map(c=>c==null?first:c); } }
  const prev=o.fresh?null:chordAtBar(start-1);
  let pool=M.progs; if(prev!=null){ const f=M.progs.filter(t=>(NEXT_CH[prev]||[]).includes(t[0])&&t[0]!==prev); if(f.length) pool=f; }
  let tpl=wpick(pool).slice(); if(o.contrast){ const alt=M.progs.filter(t=>t.join()!==tpl.join()); if(alt.length) tpl=wpick(alt).slice(); if(tpl[0]===0) tpl=[tpl[1],tpl[0],...tpl.slice(2)]; }
  const out=[]; for(let b=0;b<bars;b++) out.push(tpl[b%tpl.length]);
  if(o.cadence==='open'&&bars>=2) out[bars-1]=4; if(o.cadence==='home'&&bars>=2){ out[bars-1]=0; if(out[bars-2]!==4&&out[bars-2]!==3) out[bars-2]=Math.random()<.7?4:3; }
  return out;
}

/* ---------- rhythm tables ---------- */
const MEL_CELLS={
  sparse:[[[0,4]],[[0,4]],[],[[0,2],[2,2]],[[0,3],[3,1]],[[0,8]]],
  mid:[[[0,2],[2,2]],[[0,4]],[[0,3],[3,1]],[[0,1],[1,1],[2,2]],[[2,2]],[[0,2]],[[0,3],[3,1]]],
  busy:[[[0,1],[1,1],[2,1],[3,1]],[[0,2],[2,1],[3,1]],[[0,1],[1,1],[2,2]],[[0,2],[2,2]],[[1,1],[2,2]],[[0,1],[2,1],[3,1]]]
};
function motifRhythm(dens,ostinato){
  if(ostinato){ const r=[]; for(let s=0;s<32;s+=2) r.push([s,2]); return r; }
  const pool=dens<.38?MEL_CELLS.sparse:dens<.66?MEL_CELLS.mid:MEL_CELLS.busy, out=[];
  for(let b=0;b<7;b++){ let c=wpick(pool); if(c.length&&c[0][1]===8&&b%2) c=[[0,4]]; if(b===0&&!c.length) c=[[0,2]]; c.forEach(([o,d])=>{ const at=b*4+o; if(!out.length||at>=out[out.length-1][0]+out[out.length-1][1]) out.push([at,Math.min(d,32-at)]); }); }
  out.push([28,4]); // a held note closes each two-bar phrase
  for(let i=0;i<out.length-1;i++) out[i][1]=Math.min(out[i][1],out[i+1][0]-out[i][0]);
  return out.filter(x=>x[1]>0);
}
function varyRhythm(rh){ const r=rh.map(x=>x.slice()); const tail=r.filter(x=>x[0]>=20); if(tail.length>1&&Math.random()<.6){ const i=r.indexOf(tail[0]); r.splice(i,1); }
  if(Math.random()<.45){ const k=Math.floor(Math.random()*Math.max(1,r.length-2)); if(r[k]&&r[k][1]>=2&&!(r[k+1]&&r[k+1][0]===r[k][0]+1)){ const d=r[k][1]; r[k][1]=Math.floor(d/2); r.splice(k+1,0,[r[k][0]+Math.floor(d/2),d-Math.floor(d/2)]); } }
  return r; }
const BASS_RH={slow:[[[0,16]],[[0,12],[12,4,4]]],cine:[[[0,16]],[[0,8],[8,8,4]]],four:[[[2,2],[6,2],[10,2],[14,2]],[[0,3],[6,2],[10,3],[14,2]]],
  techno:[[[2,1],[3,1],[6,1],[7,1],[10,1],[11,1],[14,1],[15,1]],[[2,2],[6,1],[7,1],[10,2],[14,1],[15,1,4]]],synth:[[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]],[[0,2],[2,2,7],[4,2],[6,2,7],[8,2],[10,2,7],[12,2],[14,2,7]]],
  groove:[[[0,6],[10,3],[13,3]],[[0,3],[7,3,4],[10,6]]],boom:[[[0,4],[7,2],[10,6]],[[0,6],[10,2],[13,3]]],trap:[[[0,7],[7,3],[10,6]],[[0,10],[10,6,4]]],
  pop:[[[0,4],[6,2],[8,4],[14,2]],[[0,6],[8,6],[14,2,4]],[[0,2],[4,2],[8,2],[10,2],[12,4]]],jazz:[[[0,4],[4,4,2],[8,4,4],[12,4,5]],[[0,4],[4,4,4],[8,4,2],[12,4,1]]],
  afro:[[[0,3],[3,3],[8,3],[11,5]],[[0,2],[3,3,4],[8,2],[10,4]]],folk:[[[0,8],[8,8,4]],[[0,4],[4,4,4],[8,4],[12,4,4]]],raga:[[[0,16]],[[0,10],[10,6,4]]],vapor:[[[0,6],[8,3],[12,3]],[[0,12],[12,4,4]]]};
const CH_RH={slow:[[[0,16]]],cine:[[[0,16]],[[0,8],[8,8]]],four:[[[2,2],[6,2],[10,2],[14,2]],[[3,2],[10,2]],[[0,1],[3,2],[6,1],[10,2]]],techno:[[[10,2]],[[6,1],[14,1]],[[2,1],[10,1]]],
  synth:[[[0,8],[8,8]],[[0,16]],[[0,3],[3,3],[6,2],[8,3],[11,3],[14,2]]],groove:[[[0,10],[10,6]],[[0,6],[6,4],[10,6]]],boom:[[[0,10],[10,6]],[[0,3],[6,10]]],trap:[[[0,16]],[[0,8],[8,8]]],
  pop:[[[0,6],[6,2],[8,6],[14,2]],[[0,8],[8,8]],[[0,3],[3,3],[6,2],[8,3],[11,3],[14,2]]],jazz:[[[0,3],[6,6]],[[2,4],[10,4]],[[0,2],[3,5],[10,6]]],
  afro:[[[0,2],[3,2],[6,2],[10,2],[12,2]],[[2,2],[6,2],[9,2],[12,3]]],folk:[[[0,4],[4,4],[8,4],[12,4]],[[0,6],[6,2],[8,6],[14,2]]],raga:[[[0,16]]],vapor:[[[0,7],[10,5]],[[0,16]]]};
const DRUM_RH={ // k kick, s snare, c clap, r rim, h hat, o open hat, R ride, x shaker, t toms(low/mid/high via digits 6/7/8 written as 'l','m','u'), w cowbell, g conga, n/G tabla
  slow:[{k:'x.......x.......',r:'............o...',h:'x...x...x...x...'},{k:'x.........x.....',x:'..o...o...o...o.'}],
  cine:[{k:'x.......x.......',s:'........x.......',m:'..............x.',u:'...............x'},{k:'x..x....x.......',s:'........X.......',l:'x.......x.......'}],
  pop:[{k:'x.......x.x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},{k:'x..x....x.......',s:'....x.......x...',h:'x.xxx.x.x.xxx.x.'},{k:'x.......x..x....',c:'....x.......x...',h:'..x...x...x...x.'}],
  groove:[{k:'x.........x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},{k:'x......x..x.....',s:'....x.......x..o',h:'x.x.x.x.x.x.x.xx'},{k:'x.....x...x..x..',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'}],
  boom:[{k:'x.........x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},{k:'x......x.xx.....',s:'....x.......x...',h:'x.x.x.x.x.xxx.x.'}],
  jazz:[{k:'x...........x...',r:'....o.......o...',R:'x...x.xx..x.x.xx',h:'....x.......x...'},{k:'x.......x.......',R:'x..xx..xx..xx..x',h:'....x.......x...'}],
  synth:[{k:'x...x...x...x...',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},{k:'x.......x.x.....',s:'....x.......x...',h:'xxxxxxxxxxxxxxxx'}],
  vapor:[{k:'x.......x.......',s:'....x.......x...',h:'..x...x...x...x.'},{k:'x......x..x.....',s:'....x.......x...',h:'x...x...x...x...'}],
  four:[{k:'x...x...x...x...',c:'....x.......x...',h:'..x...x...x...x.',o:'..x...x...x...x.'},{k:'x...x...x...x...',c:'....x.......x...',h:'xxx.xxx.xxx.xxx.'},{k:'x...x...x...x...',c:'....x.......x..o',h:'..x...x...x...x.',x:'x.x.x.x.x.x.x.x.'}],
  techno:[{k:'x...x...x...x...',r:'...x..x....x..x.',h:'..x...x...x...x.'},{k:'x...x...x...x...',h:'xxxxxxxxxxxxxxxx',c:'....x.......x...'}],
  trap:[{k:'x......x..x.....',s:'........x.......',h:'x.x.x.x.x.x.xxxx'},{k:'x.....x...x..x..',s:'........x.......',h:'x.xxx.x.x.x.x.xx'}],
  afro:[{k:'x.....x...x.....',r:'...x..x....x..x.',x:'x.xxx.xxx.xxx.xx',g:'..x..x....x..x..'},{k:'x..x....x..x....',c:'....x.......x...',w:'x.x.x..x.x.x..x.',x:'x.x.x.x.x.x.x.x.'}],
  folk:[{k:'x.......x.......',s:'....x.......x...',x:'x.x.x.x.x.x.x.x.'},{k:'x.....x.x.......',s:'....x.......x...',h:'x...x...x...x...'}],
  raga:[{G:'x.....x...x.....',n:'...x..x....x..x.',x:'..o...o...o...o.'},{G:'x..x....x.......',n:'..x..x.x..x..x..'}]
};
const DRUM_PIECE={k:0,s:1,c:2,r:3,h:4,o:5,l:6,m:7,u:8,C:9,R:10,x:11,w:12,g:13,n:14,G:15};
Object.assign(BASS_RH,{edm:[[[2,2],[6,2],[10,2],[14,2]],[[0,1],[2,2],[6,2],[8,1],[10,2],[14,2]]],electro:[[[0,3],[3,3],[6,2],[10,3],[13,3]],[[0,2],[4,2,7],[8,2],[12,2,7]]],
  phonk:[[[0,10],[10,6]],[[0,7],[7,3],[10,6,7]]],disco:[[[0,2],[2,2,7],[4,2],[6,2,7],[8,2],[10,2,7],[12,2],[14,2,7]]],
  funk:[[[0,2],[3,1],[6,2],[8,1],[10,1],[11,2],[14,2,7]],[[0,3],[4,1,7],[6,2],[10,2],[13,3,4]]],rock:[[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]],[[0,4],[4,2],[6,2],[8,4],[12,2],[14,2,4]]],
  classical:[[[0,8],[8,8,4]],[[0,4],[4,4,4],[8,4,2],[12,4,4]]],tropical:[[[0,3],[3,3],[6,2],[8,3],[11,3],[14,2]]],chip:[[[0,2],[2,2,7],[4,2],[6,2,7],[8,2],[10,2,7],[12,2],[14,2,7]]],
  medieval:[[[0,16]],[[0,8],[8,8,4]]],drone:[[[0,16]]]});
Object.assign(CH_RH,{edm:[[[2,2],[6,2],[10,2],[14,2]],[[0,3],[3,3],[6,2],[8,3],[11,3],[14,2]]],electro:[[[0,6],[6,4],[10,6]],[[2,2],[6,2],[10,2],[14,2]]],phonk:[[[0,16]],[[0,8],[8,8]]],
  disco:[[[2,2],[6,2],[10,2],[14,2]],[[0,1],[2,1],[6,1],[8,1],[10,1],[14,1]]],funk:[[[0,1],[3,1],[6,1],[10,1],[12,1],[14,1]],[[2,1],[3,1],[7,1],[10,1],[11,1]]],
  rock:[[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]],[[0,6],[6,2],[8,6],[14,2]]],classical:[[[0,4],[4,4],[8,4],[12,4]],[[0,16]],[[0,8],[8,8]]],
  tropical:[[[0,3],[3,3],[6,2],[8,3],[11,3],[14,2]]],chip:[[[0,2],[4,2],[8,2],[12,2]],[[0,1],[2,1],[4,1],[6,1],[8,1],[10,1],[12,1],[14,1]]],medieval:[[[0,6],[6,2],[8,6],[14,2]],[[0,16]]],drone:[[[0,16]]]});
Object.assign(DRUM_RH,{
  edm:[{k:'x...x...x...x...',c:'....x.......x...',h:'..x...x...x...x.',o:'..x...x...x...x.'},{k:'x...x...x...x...',c:'....x.......x...',h:'xxxxxxxxxxxxxxxx',C:'x...............'}],
  electro:[{k:'x.....x...x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},{k:'x..x......x..x..',c:'....x.......x...',h:'..x...x...x...x.'}],
  phonk:[{k:'x......x..x.....',s:'....x.......x...',w:'x..x..x...x..x..',h:'x.x.x.x.x.x.x.x.'},{k:'x.....x...x..x..',c:'....x.......x...',w:'x.x..x..x.x..x..',h:'xxx.x.xxx.x.x.x.'}],
  disco:[{k:'x...x...x...x...',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.',o:'..x...x...x...x.'},{k:'x...x...x...x...',c:'....x.......x...',h:'xxxxxxxxxxxxxxxx',o:'..x...x...x...x.'}],
  funk:[{k:'x.....x...x.....',s:'....x..o.o..x...',h:'xxxxxxxxxxxxxxxx'},{k:'x..x....x.x.....',s:'....x.......x..o',h:'x.x.x.x.x.x.x.x.'}],
  rock:[{k:'x.......x.x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},{k:'x...x...x...x...',s:'....x.......x...',R:'x.x.x.x.x.x.x.x.'},{k:'x.x.....x.x.....',s:'....x.......x...',o:'x.x.x.x.x.x.x.x.'}],
  classical:[{l:'x.......x.......'},{l:'x...............',x:'....o.......o...'}],
  tropical:[{k:'x...x...x...x...',s:'...x..x....x..x.',x:'x.x.x.x.x.x.x.x.'},{k:'x...x...x...x...',r:'...x..x....x..x.',g:'..x..x....x..x..'}],
  chip:[{k:'x...x...x...x...',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},{k:'x.x.....x.x.....',s:'....x.......x...',h:'xxxxxxxxxxxxxxxx'}],
  medieval:[{l:'x.....x...x.....',x:'..x..x....x..x..',m:'....x.......x...'},{l:'x..x....x.......',x:'x.x.x.x.x.x.x.x.'}],
  drone:[{l:'x...............'},{x:'..o...o...o...o.',l:'x...............'}]});
Object.assign(BASS_RH,{dreampop:[[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]],[[0,6],[6,2],[8,8]]],shoegaze:[[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]]],
  chillwave:[[[0,3],[3,3],[6,4],[10,3],[13,3]],[[0,6],[6,2],[8,6],[14,2]]],funkbr:[[[0,6],[6,4],[10,4],[14,2]],[[0,3],[3,3],[6,4],[10,6]]],slowed:[[[0,10],[10,6]],[[0,16]]],ballad:[[[0,8],[8,8,4]],[[0,16]]]});
Object.assign(CH_RH,{dreampop:[[[0,8],[8,8]],[[0,3],[3,3],[6,2],[8,8]]],shoegaze:[[[0,16]],[[0,8],[8,8]]],chillwave:[[[0,16]],[[0,8],[8,8]]],funkbr:[[[0,16]],[[0,6],[6,10]]],slowed:[[[0,16]],[[0,8],[8,8]]],
  ballad:[[[0,4],[4,4],[8,4],[12,4]],[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]]]});
Object.assign(DRUM_RH,{
  dreampop:[{k:'x.......x.......',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'},{k:'x.......x.x.....',s:'....x.......x...',R:'x.x.x.x.x.x.x.x.'}],
  shoegaze:[{k:'x.x.....x.x.....',s:'....x.......x...',o:'x.x.x.x.x.x.x.x.'},{k:'x...x...x...x...',s:'....x.......x...',R:'xxxxxxxxxxxxxxxx'}],
  chillwave:[{k:'x....x....x.....',s:'....x.......x...',h:'..x...x...x...x.',x:'x.x.x.x.x.x.x.x.'},{k:'x.....x...x.....',s:'....x.......x...',h:'xxxxxxxxxxxxxxxx'}],
  funkbr:[{k:'x.....x...x...x.',c:'....x.......x...',h:'.o.o.o.o.o.o.o.o'},{k:'x..x..x...x..x..',c:'....x..x....x...',w:'x.x..x..x.x..x..'}],
  slowed:[{k:'x......x..x.....',s:'........x.......',h:'x.x.x.x.x.x.x.x.'},{k:'x.........x.....',s:'........x.......',h:'x...x...x...x...'}],
  ballad:[{k:'x.......x.......',r:'....x.......x...',h:'x...x...x...x...'},{k:'x...............',r:'........x.......',x:'..o...o...o...o.'}]});

/* ---------- role generators ---------- */
/* the notes a chord is heard as: a diminished triad borrows the sixth, so nothing ever rests on a tritone */
function chordTones(ch){ if(scaleN()===7&&degSemi(ch+4)-degSemi(ch)===6) return [ch,ch+2,ch+5]; return [ch,ch+2,ch+4]; }
const isTone=(tones,x,n)=>tones.some(t=>((x-t)%n+n)%n===0);
function toneBelow(tones,x,n){ for(let v=x;v>x-n-1;v--) if(isTone(tones,v,n)) return v; return x; }
function toneAbove(tones,x,n){ for(let v=x;v<x+n+1;v++) if(isTone(tones,v,n)) return v; return x; }
/* Melody is built the way a tune is written: a two-bar idea (A), the same idea answered (A'),
   a contrasting phrase that reaches the one high point (B), and the idea again brought home (A'').
   Strong beats and held notes sit on chord tones, leaps are followed by a step back,
   phrases end with room to breathe, and a closing phrase steps down onto the key note. */
function genMelody(o){
  const M=moodP(), n=scaleN(), L=o.bars*16, dens=clamp(M.dens*.55+o.energy*.5,.08,1), notes=[];
  const ost=!!(M.ostinato&&Math.random()<.6), seeded=!!(o.seed&&o.seed.rhythm&&o.rel!=='bridge');
  const base=seeded?o.seed.rhythm:motifRhythm(dens,ost);
  const units=Math.max(1,Math.ceil(o.bars/2)), center=(o.center!=null?o.center:4+M.reg*2)+(o.lift?3:0);
  const chAt=at=>o.prog[Math.floor(at/16)%o.prog.length];
  let cur=o.seed&&o.seed.last!=null?o.seed.last:nearestTone(chordTones(o.prog[0]),center,n);
  const lo=center-6, hi=center+7, closed=o.cadence!=='open';
  let shape=seeded&&Array.isArray(o.seed.shape)?new Map(o.seed.shape):null, home=null, leap=0, same=0;
  const kindOf=u=>{ if(u===0) return shape?'A2':'A'; if(units===2) return 'A1'; return ['A2','A1','B','A2'][u%4]; };
  const peakU=units>=3?2+4*Math.floor((units-3)/4):-1;
  for(let u=0;u<units;u++){
    const kind=kindOf(u), final=u===units-1, endHome=final?closed:u%2===1;
    let rh=base.map(x=>x.slice()); if(kind==='A1'||kind==='B') rh=varyRhythm(rh);
    const uc=center+(kind==='B'?2:0), follow=shape&&kind!=='A'&&kind!=='B';
    let p0=null; const made=[];
    rh.forEach(([st,d],i)=>{ const at=u*32+st; if(at>=L) return; const ch=chAt(at), tones=chordTones(ch);
      const pos=at/L, drift={up:pos*4-1,down:2-pos*4,arch:Math.sin(pos*Math.PI)*3.5-1,flat:0}[M.contour]||0, want=uc+drift;
      const dd=Math.max(1,Math.min(d,L-at)), strong=st%8===0||dd>=4||(st%4===0&&Math.random()<.4), isLast=i===rh.length-1;
      let t;
      if(p0==null){ t=follow&&home!=null?nearestTone(tones,home+(kind==='A2'?0:(Math.random()<.5?0:1)),n):nearestTone(tones,(u===0?cur:cur*.5+want*.5),n); p0=t; if(home==null) home=t; }
      else if(isLast) t=endHome?nearestTone(final?(isTone(tones,0,n)?[0]:[ch]):tones,cur,n):nearestTone([tones[2],ch+1,tones[1]],cur,n);
      else if(follow&&shape.has(st)){ t=p0+shape.get(st); if(strong&&!isTone(tones,t,n)) t=nearestTone(tones,t,n); }
      else if(strong) t=nearestTone(tones,cur*.55+want*.45,n);
      else if(Math.abs(leap)>=3) t=cur-Math.sign(leap);                       // a leap is answered by a step back
      else { t=cur+wpick([-2,-1,1,2,0,-1,1],[1,3,3,1,.5,1,1])+(want>cur+2?1:want<cur-2?-1:0); if(Math.random()<o.energy*.14) t+=wpick([-4,4,3,-3,5]); }
      if(!ost&&t===cur&&same>=2){ t=want>=cur?cur+1:cur-1; if(strong) t=want>=cur?toneAbove(tones,t,n):toneBelow(tones,t,n); } // no more than three of the same note in a row
      t=clamp(t,lo,hi+(kind==='B'?2:0)); same=t===cur?same+1:0; leap=t-cur; cur=t;
      const nt={t:at,d:dd,n:t,v:+(strong?.8+.16*o.energy:.6+.22*o.energy).toFixed(2),_s:strong,_u:u,_st:st}; notes.push(nt); made.push(nt);
    });
    if(kind==='A'&&!shape&&made.length) shape=new Map(made.map(x=>[x._st,x.n-made[0].n]));
    // leave a breath before the next phrase starts
    if(!ost&&!final&&made.length){ const x=made[made.length-1], edge=u*32+32; if(x.t+x.d>edge-2&&edge-2-x.t>=2) x.d=edge-2-x.t; }
  }
  if(notes.length>2&&!ost){
    // one high point: the contrasting phrase owns it, everything else stays a step under
    const pk=peakU>=0&&notes.some(x=>x._u===peakU)?peakU:notes.reduce((a,x)=>x.n>a.n?x:a,notes[0])._u;
    const inP=notes.filter(x=>x._u===pk), out=notes.filter(x=>x._u!==pk), oMax=out.length?Math.max(...out.map(x=>x.n)):-99;
    let top=inP.reduce((a,x)=>x.n>a.n||(x.n===a.n&&x._s&&!a._s)?x:a,inP[0]);
    if(top.n<=oMax&&peakU>=0){ const want=toneAbove(chordTones(chAt(top.t)),oMax+1,n); if(want<=hi+3) top.n=want; }
    const peak=top.n; let seen=false;
    for(const x of notes){ if(x===top) continue; if(x.n>=peak){ const tones=chordTones(chAt(x.t)); x.n=x._s?toneBelow(tones,peak-1,n):peak-1; } }
    // closing phrase: step onto the last note rather than jumping to it
    if(closed){ const f=notes[notes.length-1], pn=notes[notes.length-2]; if(pn&&pn._u===f._u&&!(pn._s&&pn.d>=4)&&Math.abs(pn.n-f.n)!==1) pn.n=f.n+(pn.n<f.n?-1:1); }
    cur=notes[notes.length-1].n;
  }
  notes.forEach(x=>{ delete x._s; delete x._u; delete x._st; });
  return {notes,motif:{rhythm:base,shape:shape?[...shape]:null},last:cur};
}
function voiceChord(ch,prev,center,seventh,n,add9){ const raw=chordTones(ch); if(seventh) raw.push(ch+6); if(add9&&!seventh) raw.push(ch+n+1);
  const ref=prev&&prev.length?prev.reduce((a,b)=>a+b,0)/prev.length:center; return raw.map(t=>nearestTone([t],ref+(t-ch)-1.5,n)).sort((a,b)=>a-b); }
function genChords(o){ const g=genreP(), M=moodP(), n=scaleN(), notes=[]; const P=CH_RH[g.feel]||CH_RH.pop, pat=wpick(P); let prev=null; const seventh=!!M.seventh||g.feel==='jazz';
  for(let b=0;b<o.bars;b++){ const ch=o.prog[b%o.prog.length], vc=voiceChord(ch,prev,4+M.reg,seventh,n,!!M.add9); prev=vc;
    const rh=o.energy>.75&&P.length>1&&b%2?P[P.length-1]:pat;
    rh.forEach(([s,d],i)=>vc.forEach(t=>notes.push({t:b*16+s,d,n:t,v:+(i===0?.8:.68).toFixed(2)}))); }
  return {notes}; }
function genBass(o){ const g=genreP(), n=scaleN(), notes=[], P=BASS_RH[g.feel]||BASS_RH.pop, pat=wpick(P);
  for(let b=0;b<o.bars;b++){ const ch=o.prog[b%o.prog.length], r=ch>=4?ch-n:ch, nx=o.prog[(b+1)%o.prog.length], rn=nx>=4?nx-n:nx;
    const rh=o.energy>.7&&P.length>1&&b%2===1?P[(P.indexOf(pat)+1)%P.length]:pat;
    const ct=chordTones(ch); rh.forEach(([s,d,iv],i)=>notes.push({t:b*16+s,d,n:r+(iv===7?n:iv===4?ct[2]-ch===4?4:2:(iv||0)),v:i===0?.95:.8}));
    if(o.energy>.42&&Math.random()<.55&&rn!==r&&b<o.bars-1){ const last=notes[notes.length-1]; if(last.t<b*16+14){ last.d=Math.min(last.d,b*16+14-last.t); notes.push({t:b*16+14,d:2,n:rn+(rn>r?-1:1),v:.72}); } } }
  return {notes}; }
function genArp(o){ const M=moodP(), n=scaleN(), notes=[], rate=o.energy>.62?1:2, shape=wpick(['up','down','updown','broken']), base=4+M.reg*2;
  for(let b=0;b<o.bars;b++){ const ch=o.prog[b%o.prog.length]; const tones=[...chordTones(ch),ch+n].map(t=>nearestTone([t],base+(t-ch),n)).sort((a,c)=>a-c);
    const seq=shape==='up'?tones:shape==='down'?[...tones].reverse():shape==='updown'?[...tones,...tones.slice(1,-1).reverse()]:[tones[0],tones[2],tones[1],tones[3]];
    for(let s=0,i=0;s<16;s+=rate,i++) notes.push({t:b*16+s,d:rate,n:seq[i%seq.length],v:+(s%4===0?.82:.6).toFixed(2)}); }
  return {notes}; }
function genPad(o){ const M=moodP(), n=scaleN(), notes=[]; let prev=null;
  for(let b=0;b<o.bars;b++){ const ch=o.prog[b%o.prog.length]; if(b>0&&o.prog[(b-1)%o.prog.length]===ch&&prev){ notes.filter(x=>x.t===prev).forEach(x=>x.d+=16); continue; }
    const vc=voiceChord(ch,null,6+M.reg,!!M.seventh,n,!!M.add9); if(vc.length>=3) vc[vc.length-2]-=n; vc.forEach(t=>notes.push({t:b*16,d:16,n:t,v:.7})); prev=b*16; }
  return {notes}; }
function genCounter(o){ const n=scaleN(), notes=[]; let cur=2;
  for(let b=0;b<o.bars;b++){ const ch=o.prog[b%o.prog.length]; const split=o.energy>.5&&Math.random()<.6;
    [[0,split?8:16],...(split?[[8,8]]:[])].forEach(([s,d],i)=>{ const ct=chordTones(ch), t=nearestTone([ct[1],ct[2],ch+(i?1:2)],cur,n); cur=t; notes.push({t:b*16+s+(i?0:wpick([0,2,4],[3,1,1])),d:d-(i?0:0),n:t,v:.66}); }); }
  return {notes}; }
function genTexture(o){ const n=scaleN(), notes=[]; for(let b=0;b<o.bars;b+=2){ const ch=o.prog[b%o.prog.length]; notes.push({t:b*16,d:Math.min(32,(o.bars-b)*16),n:ch,v:.6}); notes.push({t:b*16,d:Math.min(32,(o.bars-b)*16),n:ch+4,v:.5});
    if(Math.random()<.6) notes.push({t:b*16+wpick([6,10,20]),d:6,n:ch+n+wpick([2,4]),v:.45}); } return {notes}; }
function genDrums(o){
  const g=genreP(), M=moodP(), notes=[], P=DRUM_RH[g.feel]||DRUM_RH.pop; const main=wpick(P);
  const add=(s,pc,v)=>{ if(!notes.some(x=>x.t===s&&x.n===pc)) notes.push({t:s,d:1,n:pc,v:+v.toFixed(2)}); };
  const alt=P.length>1&&Math.random()<.5?wpick(P.filter(x=>x!==main)):null;
  const backbeat=!!(main.s||main.c||main.r), extraHat=[], ghosts=[];
  if(o.energy>.6&&(main.h||'').indexOf('xx')<0) for(let s=1;s<16;s+=2) if(Math.random()<(o.energy-.55)*.9) extraHat.push(s);
  if(backbeat&&main.s&&o.energy>.4&&!QUANTIZED.has(g.feel)&&o.rel!=='build'){ const free=[7,9,15,3,10].filter(s=>(main.s[s]||'.')==='.'&&(main.k||'')[s]!=='x'); const k=o.energy>.7?2:1; while(ghosts.length<k&&free.length) ghosts.push(free.splice(Math.floor(Math.random()*Math.min(3,free.length)),1)[0]); }
  for(let b=0;b<o.bars;b++){
    const last=b===o.bars-1, pat=(b%4===3&&alt&&o.bars>=4)?alt:main;
    if(o.rel==='build'){ // density rises toward the end
      const prog=(b+1)/o.bars; add(b*16,0,1); if(b%2===0) add(b*16+8,0,.9);
      const step=prog>.75?1:prog>.5?2:4; for(let s=0;s<16;s+=step) add(b*16+s,1,.35+.6*((b*16+s)/(o.bars*16)));
      for(let s=0;s<16;s+=2) add(b*16+s,4,.55); continue; }
    Object.entries(pat).forEach(([k,str])=>{ const pc=DRUM_PIECE[k]; if(pc==null) return; for(let s=0;s<16;s++){ const c=str[s]; if(c==='.'||!c) continue; add(b*16+s,pc,c==='X'?1:c==='o'?.45:.82); } });
    extraHat.forEach(s=>add(b*16+s,4,.4)); ghosts.forEach(s=>add(b*16+s,1,.24));
    if(o.energy<.3) for(let i=notes.length-1;i>=0;i--){ const x=notes[i]; if(x.t>=b*16&&x.n===4&&x.t%4!==0&&Math.random()<.5) notes.splice(i,1); }
    if((M.toms||o.lift)&&b%4===3){ [12,13,14,15].forEach((s,i)=>add(b*16+s,[8,7,7,6][i],.75)); }
    if(last&&o.rel!=='layer'&&o.bars>=2&&Math.random()<.55){ for(let i=notes.length-1;i>=0;i--) if(notes[i].t>=b*16+12&&notes[i].n!==0) notes.splice(i,1); [[12,8],[13,8],[14,7],[15,6]].forEach(([s,pc])=>add(b*16+s,g.feel==='raga'?14:pc,.8)); }
  }
  if(o.lift||o.rel==='bridge') add(0,9,.9);
  notes.sort((a,b)=>a.t-b.t||a.n-b.n); return {notes};
}
const GEN={melody:genMelody,chords:genChords,bass:genBass,arp:genArp,pad:genPad,counter:genCounter,texture:genTexture,drums:genDrums};

/* ---------- choosing an instrument ---------- */
function chooseInst(role){
  const M=moodP(), g=genreP(), names=[...(M.prefer[role]||[])], gi=g.insts[role];
  let pool=names.map(instByNameMagic).filter(Boolean), w=pool.map(()=>1); const gI=gi&&instByNameMagic(gi);
  if(gI){ pool.push(gI); w.push(MAGIC.genre==='Any'?1.5:pool.length*1.2); }
  if(role==='drums'){ const keep=pool.map((I,i)=>[I,w[i]]).filter(([I])=>I.kind==='drum'); pool=keep.map(x=>x[0]); w=keep.map(x=>x[1]); if(!pool.length) pool=[INSTS.find(i=>i.kind==='drum')],w=[1]; }
  else { const keep=pool.map((I,i)=>[I,w[i]]).filter(([I])=>I.kind!=='drum'); pool=keep.map(x=>x[0]); w=keep.map(x=>x[1]); if(!pool.length){ pool=[INSTS.find(i=>i.kind!=='drum')]; w=[1]; } }
  return wpick(pool,w).id;
}
function findTrackFor(role,a,b,prefer){
  if(prefer&&trackById(prefer)) return trackById(prefer);
  const kindOK=tr=>(role==='drums')===(tr.kind==='drum');
  const cands=S.tracks.filter(tr=>trackRole(tr)===role&&kindOK(tr));
  return cands.find(tr=>!tr.clips.some(c=>c.start<b&&clipEnd(c)>a&&c.notes.length))||null;
}

/* ---------- cards ---------- */
const REL_LABEL={start:'start',next:'next',layer:'layer',bridge:'bridge',build:'build-up',lift:'lift',wild:'wildcard'};
function makeCard(spec){
  const role=spec.role, bars=spec.bars||MAGIC.bars, a=spec.start, b=a+bars*16;
  const tr=spec.trackId?trackById(spec.trackId):findTrackFor(role,a,b,null);
  const inst=tr?tr.inst:(spec.inst||chooseInst(role)), I=INST[inst]||INSTS[0];
  const energy=clamp(MAGIC.energy+(spec.energyAdj||0),0,1);
  const prog=spec.prog||planProg(a,bars,{layer:spec.rel==='layer'||spec.rel==='start'&&songEnd()>a,fresh:spec.rel==='wild',contrast:spec.rel==='bridge',cadence:spec.cadence});
  const r=GEN[role]({bars,prog,energy,seed:spec.seed,rel:spec.rel,lift:spec.rel==='lift',cadence:spec.cadence,center:spec.center});
  let notes=r.notes; if(role==='drums'&&I.kind!=='drum') notes=mapNotesKind(notes,'drum','mel'); if(role!=='drums'&&I.kind==='drum') notes=mapNotesKind(notes,'mel','drum');
  const titles={start:{drums:'Groove',bass:'Bassline',chords:'Chord bed',melody:'Hook',arp:'Arpeggio',pad:'Pad wash',counter:'Counter-line',texture:'Atmosphere'},
    next:{melody:'Answer phrase',drums:'Next groove',bass:'Bass moves on',chords:'Chords continue',arp:'Arp continues',pad:'Pad continues',counter:'Line continues',texture:'Air continues'},
    layer:{drums:'Drums under it',bass:'Bass under it',chords:'Chords under it',melody:'Melody over it',arp:'Arp over it',pad:'Pad behind it',counter:'Counter-line',texture:'Air behind it'},
    bridge:'Bridge, new chords',build:'Build-up',lift:'Lift, one notch up',wild:'Wildcard'};
  const t=titles[spec.rel]; const title=typeof t==='string'?t:(t&&t[role])||ROLE_INFO[role].label;
  return {id:'k'+(++MAGIC.seq),role,rel:spec.rel,start:a,bars,len:bars*16,notes,inst,kind:I.kind,trackId:tr?tr.id:null,prog,motif:r.motif||null,last:r.last??null,
    mood:MAGIC.mood,genre:genreName(),title,energy,fin:spec.fin||null,fout:spec.fout||null,spec};
}
function rerollCard(card){ const s={...card.spec}; if(s.rel!=='layer'&&s.rel!=='next') delete s.prog; return makeCard(s); }

/* ---------- anchor + deck ---------- */
function anchorFromClip(tr,c){
  const role=c.magic&&c.magic.role||trackRole(tr); let seed=null;
  if(c.magic&&c.magic.motif) seed={rhythm:c.magic.motif.rhythm,shape:c.magic.motif.shape,last:c.magic.last};
  else if(tr.kind!=='drum'){ const fl=flatten(c); if(fl.length){ const last=fl.reduce((m,e)=>e.at>m.at?e:m,fl[0]); seed={last:last.n}; } }
  return {tr,c,role,start:c.start,end:clipEnd(c),seed};
}
function resolveAnchor(){
  if(MAGIC.anchor){ const f=findClip(MAGIC.anchor.clipId); if(f) return anchorFromClip(f.tr,f.c); MAGIC.anchor=null; }
  if(SEL.clips.size===1){ const f=findClip([...SEL.clips][0]); if(f&&f.c.notes.length) return anchorFromClip(f.tr,f.c); }
  let best=null; S.tracks.forEach(tr=>tr.clips.forEach(c=>{ if(!c.notes.length) return; const e=clipEnd(c); if(!best||e>best.e||(e===best.e&&trackRole(tr)==='melody')) best={tr,c,e}; }));
  return best?anchorFromClip(best.tr,best.c):null;
}
function buildDeck(){
  const A=resolveAnchor(), bars=MAGIC.bars, cards=[];
  try{
    if(!A){ const st=0; ['drums','chords','bass','melody','pad','arp'].forEach(role=>cards.push(makeCard({role,rel:'start',start:st,bars}))); }
    else {
      const nb=bars, end=A.end, aBars=Math.max(1,Math.round((A.end-A.start)/16));
      const lenA=Math.min(8,aBars);
      cards.push(makeCard({role:A.role,rel:'next',start:end,bars:nb,trackId:A.tr.id,seed:A.seed,cadence:'home'}));
      const miss=(COMPLEMENT[A.role]||['bass','drums']).filter(r=>!rangeHasRole(r,A.start,A.end,A.tr));
      const comp=(miss.length?miss:(COMPLEMENT[A.role]||['bass'])).slice(0,2);
      comp.forEach(role=>cards.push(makeCard({role,rel:'layer',start:A.start,bars:lenA})));
      cards.push(makeCard({role:A.role==='drums'?'melody':A.role,rel:'bridge',start:end,bars:nb,trackId:A.role==='drums'?null:A.tr.id,seed:A.seed?{last:A.seed.last}:null,cadence:'open'}));
      cards.push(makeCard({role:'drums',rel:'build',start:end,bars:Math.min(2,nb),energyAdj:.2,fout:{type:'cut',len:0}}));
      const wildRoles=Object.keys(ROLE_INFO).filter(r=>r!==A.role&&!rangeHasRole(r,end,end+nb*16));
      cards.push(makeCard({role:wpick(wildRoles.length?wildRoles:['melody','arp','counter']),rel:'lift',start:end,bars:nb,energyAdj:.25,fin:{type:'swell',len:8}}));
    }
  }catch(err){ console.error(err); }
  MAGIC.deck=cards; if(PLACE.card&&!cards.some(c=>c.id===PLACE.card.id)) cancelPlace(); PLACE.peek=null; renderDeck(); renderPlaceUI();
}

/* ---------- placing a patch ---------- */
function placeCard(card,target){
  if(!card) return null; pushHist();
  const start=target&&target.start!=null?target.start:card.start; let tr=target&&target.trackId?trackById(target.trackId):(target&&target.newTrack?null:(card.trackId?trackById(card.trackId):null));
  if(!tr){ const I=INST[card.inst]||INSTS[0]; tr=newTrack(I.id,{name:ROLE_INFO[card.role].label+' · '+I.name}); tr.role=card.role; S.tracks.push(tr); if(G) applyGraph(G); }
  let notes=card.notes.map(n=>({...n})); if(card.kind!==tr.kind) notes=mapNotesKind(notes,card.kind,tr.kind);
  eraseRange(tr,start,start+card.len);
  const c=newClip(start,card.len,notes,{name:card.title}); if(card.fin) c.fin={...card.fin}; if(card.fout) c.fout={...card.fout};
  c.magic={role:card.role,mood:card.mood,genre:card.genre,motif:card.motif,last:card.last}; tr.clips.push(c);
  if(!S.magic) S.magic={prog:{}}; const sb=Math.floor(start/16); card.prog.forEach((ch,i)=>{ if(card.rel!=='layer'||S.magic.prog[sb+i]==null) S.magic.prog[sb+i]=ch; });
  if(start+card.len>S.len){ S.len=Math.ceil((start+card.len)/16)*16; renderSongLen(); }
  MAGIC.anchor={trackId:tr.id,clipId:c.id}; FOCUS=tr.id; SEL={clips:new Set([c.id]),notes:new Set()};
  markDirty(); persist(); renderTracks(); revealStep(start);
  return {tr,c};
}
function revealStep(st){ const L=$('lanes'); if(!L) return; const x=st*pps(); if(x<L.scrollLeft||x>L.scrollLeft+L.clientWidth-80) L.scrollLeft=Math.max(0,x-120); }
function useCard(card,target){ stopCardPreview(); PLACE.peek=null; const r=placeCard(card,target); if(!r) return;
  toast(`${card.title} on ${r.tr.name} · bar ${Math.floor(r.c.start/16)+1}. Fresh ideas for what comes next.`,[{label:'Undo',fn:()=>{ undo(); buildDeck(); }},{label:'Hear it',fn:()=>{ seekTo(Math.max(0,r.c.start-16)); if(!playing) startPlay(); }}]);
  buildDeck(); }
function craftNext(){
  const A=resolveAnchor(), bars=MAGIC.bars; stopCardPreview();
  if(!A){ const order=['drums','bass','chords','melody']; pushHist(); const base=hist.length; const prog=planProg(0,bars,{fresh:true}); let last=null;
    order.forEach(role=>{ const k=makeCard({role,rel:'start',start:0,bars,prog}); last=placeCard(k)||last; while(hist.length>base) hist.pop(); });
    if(last) MAGIC.anchor={trackId:last.tr.id,clipId:last.c.id}; buildDeck(); toast(`Crafted ${bars} bars: drums, bass, chords and a hook in ${MAGIC.mood.toLowerCase()} ${genreName()}.`,[{label:'Undo',fn:()=>{ undo(); buildDeck(); }}]); return; }
  const end=songEnd(), from=Math.max(0,end-16), playing_=S.tracks.filter(tr=>tr.clips.some(c=>c.notes.length&&c.start<end&&clipEnd(c)>from));
  const prog=planProg(end,bars,{cadence:'home'}); pushHist(); const before=hist.length; let mel=null, n=0;
  playing_.forEach(tr=>{ const role=trackRole(tr), c=tr.clips.filter(x=>clipEnd(x)>from).sort((p,q)=>clipEnd(q)-clipEnd(p))[0], an=c?anchorFromClip(tr,c):null;
    const k=makeCard({role,rel:'next',start:end,bars,trackId:tr.id,seed:an&&an.seed,prog}); const r=placeCard(k); while(hist.length>before) hist.pop(); n++; if(role==='melody'||!mel) mel=r; });
  if(mel) MAGIC.anchor={trackId:mel.tr.id,clipId:mel.c.id};
  buildDeck(); toast(`Crafted bars ${Math.floor(end/16)+1}–${Math.floor(end/16)+bars} on ${n} track${n>1?'s':''}, following on from what’s there.`,[{label:'Undo',fn:()=>{ undo(); buildDeck(); }},{label:'Hear it',fn:()=>{ seekTo(Math.max(0,end-16)); if(!playing) startPlay(); }}]);
}

/* ---------- preview a card in place ---------- */
function stopCardPreview(){ const P=MAGIC.pv; if(!P) return; MAGIC.pv=null; clearTimeout(P.timer); try{ P.out.gain.setTargetAtTime(0,ac.currentTime,.03); setTimeout(()=>{ try{P.out.disconnect();}catch(e){} },300); }catch(e){} if(P.song){ HUM.exclude=null; if(playing) stopPlay(); } renderDeckStates(); }
function previewCard(card){
  if(MAGIC.pv&&MAGIC.pv.id===card.id){ stopCardPreview(); return; } stopCardPreview(); ensureAudio(); if(ac.state!=='running') ac.resume();
  const sd=stepDur(), withSong=S.tracks.some(tr=>tr.clips.some(c=>c.notes.length&&c.start<card.start+card.len&&clipEnd(c)>card.start));
  const tr=card.trackId?trackById(card.trackId):null, I=INST[card.inst]||INSTS[0], p=tr?tr.p:I.p, oct=tr?tr.oct:I.oct, fn=VOICES[I.engine];
  const out=ac.createGain(); out.gain.value=tr?Math.max(.3,tr.vol):.8; out.connect(G.sum);
  if(playing) stopPlay(); const t0=ac.currentTime+.12;
  if(withSong){ PH.step=card.start; HUM.exclude=card.trackId&&rangeOccupied(card)?card.trackId:null; startPlay(t0); }
  card.notes.forEach(nt=>{ const tt=t0+nt.t*sd; try{ if(I.kind==='drum') fn(ac,out,p,tt,nt.v,nt.d*sd,nt.n,G.R); else fn(ac,out,p,tt,nt.v,Math.max(.03,nt.d*sd-.004),degToMidi(nt.n,oct),G.R); }catch(e){} });
  const P={id:card.id,out,song:withSong,timer:setTimeout(()=>{ if(MAGIC.pv===P){ HUM.exclude=null; stopCardPreview(); } },(card.len*sd+.4)*1000)};
  MAGIC.pv=P; renderDeckStates();
}
function rangeOccupied(card){ const tr=trackById(card.trackId); return tr&&tr.clips.some(c=>c.start<card.start+card.len&&clipEnd(c)>card.start); }

/* ---------- drawing a patch as a strip of lines ---------- */
function drawPatchLines(cv,card,ink){
  const dpr=devicePixelRatio||1, W=cv.clientWidth||160, H=cv.clientHeight||56; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const L=card.len, cols=Math.min(L,Math.floor(W/3)), per=L/cols, top=new Array(cols).fill(null);
  let lo=Infinity,hi=-Infinity; card.notes.forEach(nt=>{ lo=Math.min(lo,nt.n); hi=Math.max(hi,nt.n); }); const sp=Math.max(1,hi-lo);
  card.notes.forEach(nt=>{ const a=Math.floor(nt.t/per), b=Math.max(a+1,Math.ceil((nt.t+(card.kind==='drum'?.6:nt.d))/per));
    const h=card.kind==='drum'?[1,.72,.66,.4,.32,.45,.56,.6,.64,.9,.5,.28,.38,.5,.45,.7][nt.n]||.4:.25+.75*(nt.n-lo)/sp;
    for(let i=a;i<b&&i<cols;i++) top[i]=Math.max(top[i]||0,h*(i===a?1:.92)); });
  const step=W/cols; g.fillStyle=ink;
  for(let i=0;i<cols;i++){ const x=Math.round(i*step+step/2); if(top[i]==null){ g.globalAlpha=.22; g.fillRect(x,H-4,1,4); g.globalAlpha=1; continue; } const h=Math.max(4,top[i]*(H-2)); g.fillRect(x,H-h,1,h); }
  for(let b=1;b<card.bars;b++){ g.globalAlpha=.35; g.fillRect(Math.round(b*16/per*step),0,1,3); g.globalAlpha=1; }
}

/* ---------- made for: use-case presets, like a creator music library ---------- */
const USES={
  Vlog:{genre:'Lo-fi',mood:'Chill',energy:.45,len:150,words:['Diary','Sunday','Notes','Moments','Polaroid','Weekend']},
  Study:{genre:'Lo-fi',mood:'Calm',energy:.3,len:210,noLead:false,words:['Pages','Desk Lamp','Rain','Margins','Quiet Hours']},
  Travel:{genre:'Pop',mood:'Uplifting',energy:.65,len:150,words:['Road','Atlas','Passport','Coastline','Miles','Departures']},
  Cooking:{genre:'Jazz',mood:'Happy',energy:.55,len:120,words:['Kitchen','Spice','Brunch','Honey','Citrus','Butter']},
  Morning:{genre:'Folk',mood:'Peaceful',energy:.4,len:120,words:['Sunrise','Coffee','Dew','Window','First Light']},
  Workout:{genre:'EDM',mood:'Energetic',energy:.95,len:180,words:['Adrenaline','Overdrive','Pulse','Reps','Voltage','Sprint']},
  Sports:{genre:'Rock',mood:'Powerful',energy:.92,len:120,words:['Final Lap','Glory','Stadium','Victory','Kickoff']},
  Gaming:{genre:'Chiptune',mood:'Fun',energy:.8,len:90,words:['Level Up','Pixel','Bonus Round','Power-Up','Boss']},
  'Car edit':{genre:'Phonk',mood:'Hype',energy:.95,len:60,words:['Drift','Night Run','Redline','Midnight Chase','Overtake']},
  Intro:{genre:'Electronic',mood:'Exciting',energy:.85,len:15,words:['Opening','Ignite','Logo','Spark','Arrival']},
  Advertising:{genre:'Pop',mood:'Upbeat',energy:.75,len:30,words:['Fresh','New Day','Launch','Shine','Bright Idea']},
  Corporate:{genre:'Pop',mood:'Inspiring',energy:.6,len:120,lightDrums:true,words:['Progress','Forward','Clarity','Momentum','Vision']},
  Technology:{genre:'Electronic',mood:'Cool',energy:.6,len:120,words:['Circuit','Signal','Data','Framework','Interface']},
  'How-to':{genre:'Lo-fi',mood:'Relaxing',energy:.35,len:180,noLead:true,words:['Step by Step','Easy Tone','Workbench','Simple Things']},
  Timelapse:{genre:'Cinematic',mood:'Inspiring',energy:.62,len:90,structure:'rise',words:['Skyline','City Lights','Clouds','Hours','Tides']},
  Movie:{genre:'Cinematic',mood:'Dramatic',energy:.6,len:150,words:['Last Scene','Reel','Curtain','Prologue','Third Act']},
  Action:{genre:'Cinematic',mood:'Powerful',energy:.95,len:90,words:['Pursuit','Impact','Breach','Countdown','Strike']},
  Adventure:{genre:'Cinematic',mood:'Epic',energy:.8,len:120,words:['Expedition','Frontier','Summit','Voyage','Uncharted']},
  Nature:{genre:'Ambient',mood:'Peaceful',energy:.25,len:150,words:['Forest','Meadow','Fern','Rainfall','Valley']},
  Night:{genre:'Synthwave',mood:'Cool',energy:.55,len:150,words:['Midnight','Neon','Afterhours','Streetlight','Night Drive']},
  Party:{genre:'House',mood:'Hype',energy:.9,len:150,words:['Dancefloor','Strobe','Rooftop','All Night','Confetti']},
  Summer:{genre:'Tropical',mood:'Happy',energy:.75,len:120,words:['Poolside','Mango','Sunburn','Beach Day','Palm']},
  Kids:{genre:'Pop',mood:'Fun',energy:.7,len:90,words:['Playtime','Rainbow','Bubbles','Happy Feet','Treehouse']},
  Wedding:{genre:'Classical',mood:'Romantic',energy:.45,len:150,words:['Vows','Ever After','Lace','First Dance','Promise']},
  Meditation:{genre:'Drone',mood:'Meditative',energy:.12,len:240,noDrums:true,words:['Breath','Stillness','Lotus','Inner Light','Calm Water']},
  Christmas:{genre:'Pop',mood:'Joyful',energy:.6,len:120,scale:'Major',insts:{melody:'Celesta',arp:'Glockenspiel',chords:'Tine Piano',drums:'Brush Jazz Kit',texture:'Wind Chimes'},words:['Snowfall','Sleigh','Carol','Cocoa','Tinsel','Ember']},
  Halloween:{genre:'Cinematic',mood:'Mysterious',energy:.55,len:90,scale:'Harmonic minor',insts:{melody:'Theremin',arp:'Pizzicato Strings',chords:'Church Organ',texture:'Bowed Metal'},words:['Pumpkin','Graveyard','Haunt','Cobweb','Trick or Treat']},
  Medieval:{genre:'Medieval',mood:'Mysterious',energy:.5,len:120,words:['Castle','Tavern','Bard','Ballad','Old Kingdom']},
};
const TITLE_ADJ=['Golden','Quiet','Neon','Velvet','Midnight','Paper','Silver','Slow','Bright','Hidden','Electric','Soft','Wild','Distant','Lucky','Warm','Blue','Late','Open','Little','Pastel','Easy','Cold','Endless'];
const TITLE_NOUN=['Tide','Streets','Bloom','Signal','Horizon','Postcard','Skyline','Weather','Garden','Motion','Static','Harbour','Lights','Avenue','Echo','Window','River','Daydream','Orbit','Season','Vinyl','Breeze','Days','Glow'];
const MOOD_WORDS={Sad:['Rain','Goodbye','Distant','Ashes'],Happy:['Sunshine','Good Days','Feel Good'],Epic:['Titans','Ascent','Empire'],Dark:['Shadow','Abyss','Undertow'],Romantic:['Velvet','Close','Moonlit'],Dreamy:['Cloud','Float','Pastel'],Chill:['Cold Coffee','Easy','Mellow'],Hype:['Drip','Turn It Up','Swag']};
function makeTitle(use){
  const U=USES[use]||{}, w=[...(U.words||[]),...(MOOD_WORDS[MAGIC.mood]||[])], A=wpick(TITLE_ADJ), Nn=wpick(TITLE_NOUN), uw=w.length?wpick(w):Nn;
  return wpick([()=>uw+' & '+wpick(TITLE_NOUN),()=>A+' '+uw,()=>uw,()=>A+' '+Nn,()=>uw+' '+wpick(['Groove','Theme','Loop','Song','Waltz','Run','Story','Days'])],[2,3,2,2,2])();
}

/* ---------- full-track builder: sections, an energy arc, repeating hooks ---------- */
const SECTIONS={
  intro:{name:'Intro',e:.55,roles:['pad','chords','texture','arp'],p:'A',fin:'fade'},
  verse:{name:'Verse',e:.82,roles:['drums','bass','chords','melody','arp','texture'],p:'A'},
  chorus:{name:'Chorus',e:1.15,roles:['drums','bass','chords','melody','pad','arp','counter'],p:'B',lift:true},
  bridge:{name:'Bridge',e:.6,roles:['pad','chords','melody','texture','bass'],p:'C'},
  rise:{name:'Rise',e:.7,roles:['drums','bass','chords','pad','arp'],p:'A'},
  hit:{name:'Hit',e:1.2,roles:['drums','bass','chords','melody','pad'],p:'B',lift:true},
  calm:{name:'Calm',e:.4,roles:['pad','chords','texture','melody'],p:'A',fin:'fade'},
  outro:{name:'Outro',e:.5,roles:['pad','chords','melody','texture'],p:'A',fout:'fade'},
  button:{name:'End',e:1.1,roles:['drums','bass','chords','pad','melody','counter'],p:'A',button:true},
};
// edits end on a hit, full songs fade (as the training set does); some uses always end on a hit
const BUTTON_USES=new Set(['Intro','Advertising','Corporate','Sports','Action','Adventure','Gaming','Technology','Timelapse','Car edit','Workout','Movie']);
function planSections(total,structure,o){
  o=o||{}; const S_=(k,b)=>({...SECTIONS[k],bars:b,key:k}), endB=o.button?1:0, introB=clamp(Math.round((o.introBars||4)/2)*2,2,8);
  let out;
  if(total<=4) out=[S_('rise',Math.max(1,total-1)),S_('hit',1)];
  else if(structure==='trailer'){ const body=total-endB, q=Math.max(2,Math.round(body*.4/2)*2), r=Math.min(2,Math.max(1,Math.round(body*.1))); out=[S_('calm',q),S_('rise',r),S_('hit',Math.max(2,body-q-r))]; }
  else if(total<=12) out=[S_('intro',2),S_('chorus',Math.max(2,total-2-(endB?1:2)))].concat(endB?[]:[S_('outro',2)]);
  else if(structure==='rise'){ const body=total-endB, q=Math.max(2,Math.round(body/4/2)*2); out=[S_('intro',q),S_('verse',q),S_('rise',q),S_('chorus',Math.max(2,body-3*q))]; }
  else if(total<=28){ const body=total-endB-(endB?0:4), ib=Math.min(introB,4), v=Math.max(4,Math.round((body-ib)/2/2)*2); out=[S_('intro',ib),S_('verse',v),S_('chorus',Math.max(2,body-ib-v))]; if(!endB) out.push(S_('outro',4)); }
  else { out=[S_('intro',introB)]; let left=total-introB-(endB?1:4), cyc=0;
    while(left>=16){ out.push(S_('verse',8),S_('chorus',8)); left-=16; cyc++; if(cyc===2&&left>=12){ out.push(S_('bridge',4)); left-=4; } }
    if(left>=8){ out.push(S_('chorus',8)); left-=8; }
    if(left>=4){ out.splice(out.length-1,0,S_('bridge',left)); left=0; }
    if(!endB) out.push(S_('outro',4+left)); else if(left) out[out.length-1].bars+=left; }
  if(endB) out.push(S_('button',1));
  return out;
}
// the energy curve of the 30-second edits: ramp, peak around 70%, settle
function arcAt(pos){ const A=TRAINED.cutdownArc, x=clamp(pos,0,1)*(A.length-1), i=Math.floor(x), f=x-i; return A[i]*(1-f)+(A[Math.min(A.length-1,i+1)])*f; }
const QUANTIZED=new Set(['edm','techno','four','chip','trap','funkbr','phonk','electro']);
function craftTrack(opts){
  opts=opts&&!(opts instanceof Event)?opts:{}; const use=MAGIC.use, U=USES[use]||{}, secs=opts.secs||MAGIC.len||U.len||150, M=moodP(), g=genreP(), gname=genreName();
  const song=newSong(), lo=Math.max(g.bpm[0],M.bpm[0]-8), hi=Math.min(g.bpm[1],M.bpm[1]+8);
  song.bpm=opts.bpm||Math.round(lo<=hi?lo+Math.random()*(hi-lo):(g.bpm[0]+g.bpm[1])/2); song.scale=U.scale||(gname==='Raga'?'Bhairav':M.scales[0]);
  song.root=wpick([0,2,4,5,7,9,10,1,3]); song.swing=Math.max(g.swing||0,M.swing||0);
  /* a learned taste brings its own key; its energy arc shapes the sections below */
  const LT=g.learned; if(LT&&LT.key&&!U.scale){ song.root=LT.key.r; song.scale=LT.key.mode==='minor'?(M.scales.find(x=>/Minor|Dorian|Phrygian/.test(x))||'Minor'):(M.scales.find(x=>/Major|Lydian/.test(x))||'Major'); }
  const tasteArc=pos=>{ const a=LT&&LT.arc; if(!a||!a.length) return 1; const x=clamp(pos,0,1)*(a.length-1), k=Math.floor(x), f=x-k; return .65+.55*((a[k]??1)*(1-f)+(a[k+1]??a[k]??1)*f); };
  song.human=g.human??(QUANTIZED.has(g.feel)?.12:.4);
  // the training set mixes sit warm: start a notch darker unless the genre is bright by nature
  song.master={...song.master,tone:-.1,width:1.55,...({lofi:{tape:.6,warble:.2},edm:{pump:.5,glue:.5,tone:0},four:{pump:.5,tone:0},phonk:{tape:.35,glue:.55},slow:{space:.9,size:6},drone:{space:1,size:7},cine:{space:.8,size:5}}[g.feel]||{}),...(g.master||{})};
  const barSec=240/song.bpm, short=secs<=60, button=opts.button??(short||BUTTON_USES.has(use)||g.structure==='trailer');
  const introBars=short?Math.max(1,Math.round(3/barSec)):Math.round(11/barSec);
  const secsPlan=opts.plan||planSections(clamp(Math.round(secs/barSec),2,160),g.structure||U.structure,{button,introBars}), total=secsPlan.reduce((a,x)=>a+x.bars,0);
  let roles=['drums','bass','chords','melody','pad']; if(MAGIC.energy>.5) roles.push('arp'); if(['Ambient','Drone','Cinematic','Medieval','Trailer','Dream pop'].includes(gname)||MAGIC.energy<.35) roles.push('texture'); if(MAGIC.energy>.6&&total>20) roles.push('counter');
  if(U.noLead) roles=roles.filter(r=>r!=='melody'&&r!=='counter'); if(U.noDrums||((gname==='Drone'||gname==='Classical')&&MAGIC.energy<.6)) roles=roles.filter(r=>r!=='drums');
  const wantFx=!opts.noFx&&!U.noLead&&!U.noDrums&&MAGIC.energy>.35&&!['Study','Meditation','Nature','How-to'].includes(use);
  const keep=S; S=song; let ok=false;
  try{
    const tracks={}; roles.forEach((role,i)=>{ const nm=U.insts&&U.insts[role], I=nm&&instByNameMagic(nm)?instByNameMagic(nm):INST[chooseInst(role)]; const tr=newTrack(I.id,{name:ROLE_INFO[role].label+' · '+I.name,color:i}); tr.role=role;
      tr.vol={drums:.85,bass:.8,chords:.55,melody:.78,pad:.45,arp:.5,counter:.5,texture:.45}[role]; tr.space={drums:.15,bass:.05,chords:.3,melody:.35,pad:.5,arp:.35,counter:.4,texture:.6}[role]; tr.echo=role==='melody'||role==='arp'?.2:0;
      tr.pan={chords:-.45,arp:.5,counter:-.4,melody:.08,texture:.3,pad:-.12}[role]||0; if(U.lightDrums&&role==='drums') tr.vol=.6; song.tracks.push(tr); tracks[role]=tr; });
    song.magic={prog:{}}; const progs={}, motifs={}; let bar=0;
    progs.A=planProg(0,4,{fresh:true}); progs.B=(()=>{ const t=planProg(0,4,{contrast:true}); return t.join()===progs.A.join()?[...progs.A.slice(2),...progs.A.slice(0,2)]:t; })(); progs.C=planProg(0,4,{contrast:true,cadence:'open'});
    const fxNotes=[], FXI=INST['transition-fx'];
    const dark=['Epic','Dark','Tense','Powerful','Dramatic','Mysterious','Hype'].includes(MAGIC.mood);
    secsPlan.forEach((sec,si)=>{
      const nx=secsPlan[si+1], bars=sec.bars, base=progs[sec.p], prog=[]; for(let b=0;b<bars;b++) prog.push(base[b%base.length]);
      if(nx&&(nx.key==='chorus'||nx.key==='hit'||nx.key==='button')&&bars>=2) prog[bars-1]=4;
      if(sec.button) prog[0]=0;
      if(!nx&&!sec.button&&bars>=2){ prog[bars-1]=0; if(prog[bars-2]!==4&&prog[bars-2]!==3) prog[bars-2]=4; }
      prog.forEach((ch,i)=>song.magic.prog[bar+i]=ch);
      const pos=(bar+bars/2)/total, energy=clamp((short?MAGIC.energy*(.45+arcAt(pos)*.75):MAGIC.energy*sec.e)*tasteArc(pos),0.05,1);
      roles.forEach(role=>{ if(!sec.roles.includes(role)) return; const tr=tracks[role];
        let r, notes;
        if(sec.button){ // one last downbeat, left to ring
          const n=scaleN();
          notes=role==='drums'?[{t:0,d:1,n:0,v:1},{t:0,d:1,n:9,v:.95}]:role==='bass'?[{t:0,d:16,n:0,v:.95}]:role==='melody'?[{t:0,d:16,n:n,v:.85}]:[0,2,4].map(x=>({t:0,d:16,n:x+(role==='pad'?n:0),v:.85}));
          r={notes,last:null};
        } else {
          r=GEN[role]({bars,prog,energy,seed:role==='melody'?motifs[sec.p]:null,rel:motifs[sec.p]&&role==='melody'?'next':'start',lift:!!sec.lift,cadence:nx?'open':'home'});
          if(role==='melody'&&!motifs[sec.p]) motifs[sec.p]={rhythm:r.motif.rhythm,shape:r.motif.shape,last:r.last};
          notes=r.notes;
          if(role==='drums'){ if(nx&&(nx.key==='chorus'||nx.key==='hit')&&bars>=2&&sec.key!=='intro'&&sec.key!=='calm'){ const fill=genDrums({bars:1,prog,energy:Math.min(1,energy+.2),rel:'build'}).notes.map(x=>({...x,t:x.t+(bars-1)*16})); notes=notes.filter(x=>x.t<(bars-1)*16).concat(fill); }
            if(sec.lift) notes.push({t:0,d:1,n:9,v:.9}); if(sec.key==='rise') notes=genDrums({bars,prog,energy,rel:'build'}).notes; }
        }
        if(tr.kind==='drum'&&role!=='drums') notes=mapNotesKind(notes,'mel','drum');
        const c=newClip(bar*16,bars*16,notes,{name:sec.name});
        if(sec.fin==='fade') c.fin={type:'fade',len:Math.min(16,bars*8)};
        if(sec.fout==='fade') c.fout={type:'fade',len:Math.min(32,bars*16)};
        if(sec.key==='chorus'&&role==='pad') c.fin={type:'swell',len:8};
        c.magic={role,mood:MAGIC.mood,genre:gname,motif:role==='melody'?motifs[sec.p]:null,last:r.last??null};
        tr.clips.push(c); });
      // transitions the way library edits do it: a riser into each big section, a hit on its downbeat
      if(wantFx&&si>0&&(sec.lift||sec.button||sec.key==='rise')){ const at=bar*16, lead=Math.min(si>0?secsPlan[si-1].bars*16:16,sec.button?16:32);
        if(sec.key!=='rise') fxNotes.push({t:Math.max(0,at-lead),d:lead,n:dark?15:4,v:.8});
        if(sec.key!=='rise') fxNotes.push({t:at,d:Math.max(4,Math.round(2/ (barSec/16))),n:sec.button?1:(dark?0:7),v:sec.button?1:.85}); }
      if(wantFx&&sec.key==='intro'&&nx) fxNotes.push({t:Math.max(0,(bar+bars)*16-8),d:8,n:3,v:.6});
      bar+=bars; });
    if(fxNotes.length){ const tr=newTrack(FXI.id,{name:'FX · Transitions',color:7}); tr.role='texture'; tr.vol=.7; tr.space=.35; tr.clips.push(newClip(0,bar*16,fxNotes,{name:'FX'})); song.tracks.push(tr); }
    song.len=bar*16+(button?16:0); song.loop=!button; song.name=makeTitle(use); song.vibe=null;
    song.desc=`${use?'Made for '+use.toLowerCase()+' · ':''}${gname} · ${MAGIC.mood.toLowerCase()} · ${secsPlan.map(x=>x.name).join(' → ')}`;
    ok=true;
  }catch(err){ console.error(err); }
  finally{ S=keep; }
  if(!ok){ toast('That track didn’t come together. Try again.'); return; }
  if(opts.len) song.len=Math.max(song.len,Math.ceil(opts.len/16)*16);
  loadSong(song,opts.label?`${opts.label}: “${song.name}”, ${song.bpm} BPM`:`“${song.name}” · ${fmtMS(song.len*240/song.bpm/16)} of ${gname.toLowerCase()}`);
}
// make the current song “slowed + reverb”: 20% slower, three semitones down, washed and darker
function slowedReverb(){
  pushHist(); S.bpm=Math.max(40,Math.round(S.bpm*.8)); S.root=(S.root+9)%12; const m=S.master;
  m.space=Math.min(1.5,(m.space||.5)+.45); m.size=Math.max(m.size||3,7); m.tone=Math.min(m.tone||0,-.45); m.tape=Math.max(m.tape||0,.5); m.warble=Math.max(m.warble||0,.2); S.human=Math.min(1,(S.human??.35)+.1);
  if(G) applyGraph(G); persist(); renderHeader(); renderMagicControls(); requestDraw();
  toast(`Slowed + reverb: ${S.bpm} BPM, now in ${NOTE_NAMES[S.root]}, washed in reverb and tape.`,[{label:'Undo',fn:()=>{ undo(); renderMagicControls(); }}]);
}
/* ---------- describe it: words → genre, mood, use ---------- */
const SYN={study:['Study'],homework:['Study'],focus:['Calm','Lo-fi'],rain:['Lo-fi','Calm'],rainy:['Lo-fi','Calm'],coffee:['Jazz','Chill','Cooking'],cafe:['Jazz','Chill'],car:['Car edit'],drift:['Car edit','Phonk'],edit:['Car edit'],gym:['Workout'],run:['Workout'],running:['Workout'],fitness:['Workout'],
  space:['Ambient','Mysterious'],stars:['Ambient','Dreamy'],beach:['Summer','Tropical'],pool:['Summer'],love:['Romantic'],date:['Romantic'],scary:['Halloween'],spooky:['Halloween'],horror:['Halloween','Dark'],game:['Gaming'],games:['Gaming'],retro:['Synthwave'],'80s':['Synthwave'],'8bit':['Chiptune'],'8-bit':['Chiptune'],pixel:['Chiptune'],
  sleep:['Calm','Ambient'],yoga:['Meditation'],meditate:['Meditation'],spa:['Meditation','Peaceful'],trailer:['Movie','Epic'],film:['Movie'],product:['Advertising'],ad:['Advertising'],commercial:['Advertising'],tutorial:['How-to'],podcast:['Vlog'],youtube:['Vlog'],
  club:['Party','House'],festival:['EDM','Energetic'],dance:['Party'],wedding:['Wedding'],christmas:['Christmas'],xmas:['Christmas'],holiday:['Christmas'],castle:['Medieval'],fantasy:['Medieval','Epic'],knight:['Medieval'],forest:['Nature'],ocean:['Nature','Calm'],city:['Night','Cool'],neon:['Synthwave','Night'],
  sunset:['Chill','Aesthetic'],morning:['Morning'],breakfast:['Morning','Cooking'],kids:['Kids'],cartoon:['Kids','Fun'],startup:['Corporate'],business:['Corporate'],tech:['Technology'],ai:['Technology'],timelapse:['Timelapse'],travel:['Travel'],road:['Travel'],trip:['Travel'],
  sad:['Sad'],cry:['Sad'],heartbreak:['Sad'],happy:['Happy'],party:['Party'],dark:['Dark'],tense:['Tense'],guitar:['Rock'],piano:['Emotional'],strings:['Classical'],orchestra:['Cinematic','Epic'],funky:['Funk'],groovy:['Disco'],bass:['Hip-hop'],beats:['Hip-hop'],
  slow:['Calm'],fast:['Energetic'],chill:['Chill'],calm:['Calm'],epic:['Epic'],hype:['Hype'],cool:['Cool'],dreamy:['Dreamy'],lofi:['Lo-fi'],'lo-fi':['Lo-fi'],hiphop:['Hip-hop'],'hip-hop':['Hip-hop']};
function describe(text){
  const t=String(text||'').toLowerCase(), words=t.split(/[^a-z0-9\-]+/).filter(Boolean), got={genre:null,mood:null,use:null};
  const take=name=>{ if(GENRES[name]&&!got.genre) got.genre=name; else if(MOODS[name]&&!got.mood) got.mood=name; else if(USES[name]&&!got.use) got.use=name; };
  const all=[...Object.keys(USES),...Object.keys(GENRES),...Object.keys(MOODS)];
  all.forEach(n=>{ if(t.includes(n.toLowerCase())) take(n); });
  words.forEach(w=>(SYN[w]||[]).forEach(take));
  if(got.use&&!got.genre) got.genre=USES[got.use].genre; if(got.use&&!got.mood) got.mood=USES[got.use].mood;
  return got;
}
function applyPick(o){
  if(o.use){ const U=USES[o.use]; MAGIC.use=o.use; MAGIC.len=U.len; if(!o.mood) MAGIC.mood=U.mood; if(!o.genre) MAGIC.genre=U.genre; MAGIC.energy=U.energy; }
  if(o.genre) MAGIC.genre=o.genre; if(o.mood){ MAGIC.mood=o.mood; if(!o.use) MAGIC.energy=MOODS[o.mood].energy; }
  saveMagic(); renderMagicControls(); buildDeck();
}

/* ---------- UI ---------- */
const ROLE_TONE={drums:'tile-ink',bass:'tile-cocoa',chords:'tile-sage',melody:'tile-paper',arp:'tile-sand',pad:'tile-steel',counter:'tile-orange',texture:'tile-blur'};
function renderMagicControls(){
  const M=moodP(); if(MAGIC.use&&!USES[MAGIC.use]) MAGIC.use=null;
  $('mgMood').innerHTML=''; const w=document.createElement('span'); w.textContent=MAGIC.mood; $('mgMood').appendChild(w); const dot=document.createElement('i'); dot.textContent='.'; $('mgMood').appendChild(dot);
  const box=$('mgMoods'); box.innerHTML=''; MOOD_ORDER.forEach(m=>{ const b=document.createElement('button'); b.className='mchip'; b.textContent=m; b.setAttribute('aria-pressed',m===MAGIC.mood); b.onclick=()=>{ MAGIC.mood=m; MAGIC.energy=MOODS[m].energy; saveMagic(); if(!songEnd()&&!HUM.recording){ const M=MOODS[m]; S.scale=M.scales[0]; S.bpm=Math.round((M.bpm[0]+M.bpm[1])/2); if(M.swing!=null) S.swing=M.swing; if(G) applyGraph(G); persist(); renderHeader(); } renderMagicControls(); buildDeck(); }; box.appendChild(b); });
  const gb=$('mgGenres'); gb.innerHTML=''; ['Any',...GENRE_ORDER].forEach(gn=>{ const b=document.createElement('button'); b.className='mchip'+(gn.startsWith('★')?' learned':''); b.textContent=gn==='Any'?'Any · '+genreNameAny():gn; b.setAttribute('aria-pressed',gn===MAGIC.genre); b.onclick=()=>{ MAGIC.genre=gn; saveMagic(); renderMagicControls(); buildDeck(); };
    if(gn.startsWith('★')){ b.title=`Learned from a track · ${GENRES[gn].bpm[0]+4} BPM · right-click to forget`; b.oncontextmenu=e=>{ e.preventDefault(); forgetLearned(gn); toast('Forgot '+gn); }; } gb.appendChild(b); });
  const ub=$('mgUses'); ub.innerHTML=''; Object.keys(USES).forEach(u=>{ const b=document.createElement('button'); b.className='mchip'; b.textContent=u; b.title=`${USES[u].genre} · ${USES[u].mood.toLowerCase()} · ${fmtMS(USES[u].len)}`; b.setAttribute('aria-pressed',u===MAGIC.use);
    b.onclick=()=>{ if(MAGIC.use===u){ MAGIC.use=null; saveMagic(); renderMagicControls(); return; } applyPick({use:u}); }; ub.appendChild(b); });
  $('mgGenres').hidden=MAGIC.tab!=='genre'; $('mgUses').hidden=MAGIC.tab!=='use';
  document.querySelectorAll('.mgtabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===MAGIC.tab));
  $('mgEnergy').value=Math.round(MAGIC.energy*100); $('mgEnergyN').innerHTML=Math.round(MAGIC.energy*100)+'<small>%</small>'; $('mgEnergy').style.setProperty('--v',MAGIC.energy);
  const key=NOTE_NAMES[S.root]+' '+S.scale.toLowerCase(), fits=M.scales.includes(S.scale)&&S.bpm>=M.bpm[0]-6&&S.bpm<=M.bpm[1]+6;
  $('mgFit').textContent=fits?`Song fits: ${key}, ${S.bpm} BPM`:`Mood likes ${M.scales[0].toLowerCase()} at ${M.bpm[0]}–${M.bpm[1]} BPM`; $('mgFitBtn').hidden=fits;
  $('mgBars').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===MAGIC.bars));
  $('mgLen').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===MAGIC.len));
  const ls=fmtMS(MAGIC.len); $('mgLenN').textContent=ls;
  setLabel($('mgMake'),`Make a ${ls} ${MAGIC.use?MAGIC.use.toLowerCase()+' ':''}track`);
  $('mgMatch').textContent=`${genreName()} · ${MAGIC.mood.toLowerCase()}${MAGIC.use?' · for '+MAGIC.use.toLowerCase():''}`;
}
function genreNameAny(){ const g=MAGIC.genre; MAGIC.genre='Any'; const n=genreName(); MAGIC.genre=g; return n; }
function renderDeck(){
  const D=$('mgDeck'); if(!D) return; D.innerHTML='';
  const A=resolveAnchor(); $('mgAnchor').textContent=A?`after: ${A.tr.name.toLowerCase()} · bars ${Math.floor(A.start/16)+1}–${Math.ceil(A.end/16)}`:'empty song: pick a starting patch';
  MAGIC.deck.forEach((card,i)=>{
    const I=INST[card.inst]||INSTS[0], tr=card.trackId?trackById(card.trackId):null, el=document.createElement('div');
    el.className='mcard '+(ROLE_TONE[card.role]||'tile-paper'); el.dataset.id=card.id; el.style.setProperty('--i',i);
    const sb=Math.floor(card.start/16)+1, eb=sb+card.bars-1;
    el.innerHTML=`<div class="mc-top"><span class="mc-rel">${REL_LABEL[card.rel]}: ${ROLE_INFO[card.role].label.toLowerCase()}</span><button class="mc-ico mc-re" title="Shuffle this patch" aria-label="Shuffle this patch">${ICON_DICE}</button></div>
      <div class="mc-mid"><b class="mc-bar">${String(sb).padStart(2,'0')}<i>–${String(eb).padStart(2,'0')}</i></b><canvas class="mc-cv" aria-hidden="true"></canvas></div>
      <div class="mc-name"></div><div class="mc-sub"></div>
      <div class="mc-act"><button class="mc-play" aria-label="Preview ${card.title}">${ICON_PLAY}</button><button class="mc-add">Add ↘</button><span class="mc-grip" title="Drag onto the timeline, or click the card to choose a spot">⠿ drag</span></div>`;
    el.querySelector('.mc-name').textContent=card.title; el.querySelector('.mc-sub').textContent=`${I.name} · ${tr?'on '+tr.name:'new track'}`;
    el.querySelector('.mc-play').onclick=e=>{ e.stopPropagation(); previewCard(card); };
    el.querySelector('.mc-add').onclick=e=>{ e.stopPropagation(); useCard(card); };
    el.querySelector('.mc-re').onclick=e=>{ e.stopPropagation(); if(MAGIC.pv&&MAGIC.pv.id===card.id) stopCardPreview(); MAGIC.deck[i]=rerollCard(card); renderDeck(); };
    el.addEventListener('pointerdown',e=>{ if(e.target.closest('button')) return; startCardDrag(e,card,el); });
    el.tabIndex=0; el.setAttribute('aria-label',`${card.title}, ${ROLE_INFO[card.role].label}, bars ${sb} to ${eb}. Press Enter to place it.`);
    el.addEventListener('keydown',e=>{ if(e.target!==el) return; if(e.key==='Enter'||e.key===' '){ e.preventDefault(); if(PLACE.card&&PLACE.card.id===card.id) placeAt(card,suggestedTarget(card)); else selectCard(card); } });
    el.addEventListener('pointerenter',e=>{ if(e.pointerType==='mouse') cardPeek(card,true); });
    el.addEventListener('pointerleave',()=>cardPeek(card,false));
    D.appendChild(el);
    requestAnimationFrame(()=>drawPatchLines(el.querySelector('.mc-cv'),card,getComputedStyle(el).color));
  });
  renderDeckStates();
}
function renderDeckStates(){ document.querySelectorAll('.mcard').forEach(el=>{ const on=MAGIC.pv&&MAGIC.pv.id===el.dataset.id; el.classList.toggle('playing',!!on); const b=el.querySelector('.mc-play'); if(b) b.innerHTML=on?ICON_PAUSE:ICON_PLAY; }); }

/* ---------- placing a card: select, peek, drag ----------
   PLACE.card is the card being placed; PLACE.target is where it would land right now.
   Selecting a card (click or Enter) shows its suggested slot and lets you click any lane to drop it;
   hovering a card peeks at its suggested slot; dragging shows the live target. */
var PLACE={card:null,mode:null,target:null,peek:null}; var DROP=null; let CARDDRAG=null;
const activeCard=()=>PLACE.card||PLACE.peek;
function suggestedTarget(card){ return {start:card.start,trackId:card.trackId&&trackById(card.trackId)?card.trackId:null,newTrack:!card.trackId}; }
function targetFromEvent(e,card){
  const cv=$('lanesCv'), rc=cv.getBoundingClientRect(); if(e.clientX<rc.left||e.clientX>rc.right||e.clientY<rc.top||e.clientY>rc.bottom) return null;
  const h=hit(e), snap=e.shiftKey?4:16, start=Math.max(0,Math.floor(h.step/snap)*snap);
  if(h.zone==='ruler'||h.zone==='end') return {...suggestedTarget(card),start};
  return h.tr?{start,trackId:h.tr.id,newTrack:false}:{start,trackId:null,newTrack:true};
}
function selectCard(card){
  if(PLACE.card&&PLACE.card.id===card.id){ cancelPlace(); return; }
  stopCardPreview(); PLACE.card=card; PLACE.mode='select'; PLACE.target=null;
  document.body.classList.add('placing'); renderPlaceUI(); revealTarget(suggestedTarget(card),true); requestDraw();
}
function cancelPlace(){ if(!PLACE.card&&!PLACE.target) return; PLACE.card=null; PLACE.mode=null; PLACE.target=null; document.body.classList.remove('placing'); renderPlaceUI(); requestDraw(); }
function revealTarget(t,page){
  if(!t) return; revealStep(t.start);
  if(!page) return; const R=rows(), r=t.trackId?R.find(q=>q.tr.id===t.trackId):null, cv=$('lanesCv').getBoundingClientRect();
  const y=cv.top+(r?r.y:totalH()-ADD_H), h=r?Math.min(r.h,160):ADD_H; if(y+h>innerHeight-110) window.scrollBy({top:y+h-(innerHeight-120),behavior:'smooth'}); else if(y<70) window.scrollBy({top:y-90,behavior:'smooth'});
}
function placeAt(card,t){
  let c=card; const tr=t.trackId?trackById(t.trackId):null;
  if(t.start!==card.start||(tr?tr.id:null)!==(card.trackId||null)){ const sp={...card.spec,start:t.start,trackId:tr?tr.id:null}; delete sp.prog; if(sp.rel==='next'&&(!tr||tr.id!==card.spec.trackId)) sp.seed=null; c=makeCard(sp); if(!tr) c.inst=card.inst; }
  cancelPlace(); useCard(c,{start:t.start,trackId:tr?tr.id:null,newTrack:!tr});
}
function renderPlaceUI(){
  document.querySelectorAll('.mcard').forEach(el=>el.classList.toggle('selected',!!PLACE.card&&el.dataset.id===PLACE.card.id));
  let bar=$('placeBar'); const card=PLACE.card;
  if(!card){ if(bar) bar.hidden=true; return; }
  if(!bar){ bar=document.createElement('div'); bar.id='placeBar'; bar.className='placebar'; bar.setAttribute('role','status');
    bar.innerHTML='<span class="pb-dot"></span><div class="pb-txt"><b></b><span></span></div><button class="btn pb-use">Use suggested spot ↵</button><button class="btn ghost pb-x">Cancel</button>';
    document.body.appendChild(bar); bar.querySelector('.pb-use').onclick=()=>PLACE.card&&placeAt(PLACE.card,suggestedTarget(PLACE.card)); bar.querySelector('.pb-x').onclick=cancelPlace; }
  bar.hidden=false; const t=PLACE.target||suggestedTarget(card), tr=t.trackId&&trackById(t.trackId);
  bar.querySelector('b').textContent=`Placing “${card.title}”`;
  bar.querySelector('.pb-txt span').textContent=PLACE.target?`→ ${tr?tr.name:'a new '+ROLE_INFO[card.role].label.toLowerCase()+' track'} · bar ${Math.floor(t.start/16)+1}. Click to drop here.`:`Click any lane on the timeline to drop it, or use the suggested spot (bar ${Math.floor(card.start/16)+1}).`;
}
/* lanes canvas hooks, called from the timeline's own pointer handlers */
function magicLaneMove(e){ if(!PLACE.card||PLACE.mode!=='select') return false; const t=targetFromEvent(e,PLACE.card); PLACE.target=t; $('lanesCv').style.cursor=t?'copy':'default'; renderPlaceUI(); requestDraw(); return true; }
function magicLaneDown(e){ if(!PLACE.card||PLACE.mode!=='select') return false; const t=targetFromEvent(e,PLACE.card); if(t) placeAt(PLACE.card,t); return true; }
function magicLaneLeave(){ if(PLACE.mode==='select'&&PLACE.target){ PLACE.target=null; renderPlaceUI(); requestDraw(); } }

function startCardDrag(e,card,el){
  e.preventDefault(); const r=el.getBoundingClientRect();
  CARDDRAG={card,el,x0:e.clientX,y0:e.clientY,dx:e.clientX-r.left,dy:e.clientY-r.top,moved:false,id:e.pointerId,ghost:null};
  window.addEventListener('pointermove',cardDragMove); window.addEventListener('pointerup',cardDragEnd); window.addEventListener('pointercancel',cardDragEnd);
}
function cardDragMove(e){
  const D=CARDDRAG; if(!D||e.pointerId!==D.id) return;
  if(!D.moved){ if(Math.hypot(e.clientX-D.x0,e.clientY-D.y0)<6) return; D.moved=true; const gh=D.el.cloneNode(true); gh.classList.add('mghost'); gh.style.width=D.el.offsetWidth+'px'; document.body.appendChild(gh); D.ghost=gh; D.el.classList.add('dragging'); stopCardPreview();
    PLACE.card=D.card; PLACE.mode='drag'; PLACE.target=null; PLACE.peek=null; document.body.classList.add('placing'); requestDraw(); }
  D.ghost.style.transform=`translate(${e.clientX-D.dx*.6}px,${e.clientY-D.dy*.6}px) scale(.6) rotate(-2deg)`;
  const t=targetFromEvent(e,D.card); PLACE.target=t; requestDraw();
  if(t){ const L=$('lanes'), lr=L.getBoundingClientRect(); if(e.clientX>lr.right-40) L.scrollLeft+=14; else if(e.clientX<lr.left+40) L.scrollLeft-=14; }
  if(e.clientY>innerHeight-50) window.scrollBy(0,14); else if(e.clientY<50) window.scrollBy(0,-14);
}
function cardDragEnd(e){
  const D=CARDDRAG; if(!D||e.pointerId!==D.id) return; CARDDRAG=null;
  window.removeEventListener('pointermove',cardDragMove); window.removeEventListener('pointerup',cardDragEnd); window.removeEventListener('pointercancel',cardDragEnd);
  if(D.ghost) D.ghost.remove(); D.el.classList.remove('dragging');
  if(!D.moved){ if(e.type!=='pointercancel') selectCard(D.card); return; }
  const t=PLACE.target; PLACE.card=null; PLACE.mode=null; PLACE.target=null; document.body.classList.remove('placing'); requestDraw();
  if(t&&e.type!=='pointercancel') placeAt(D.card,t);
}
function cardPeek(card,on){ if(PLACE.card) return; PLACE.peek=on?card:null; if(on) revealTarget(suggestedTarget(card),false); requestDraw(); }

/* ---------- drawing the placement on the timeline ---------- */
function slotRect(t){ const R=rows(); if(t.trackId){ const r=R.find(q=>q.tr.id===t.trackId); if(!r) return null; return {y:r.y+3,h:(r.tr.open?BAR_H:r.h)-6,tr:r.tr}; } return {y:totalH()-ADD_H+6,h:ADD_H-12,tr:null}; }
function drawPatchInRect(g,card,x0,y,w,h,color){
  if(!card.notes.length||w<8) return; const L=card.len; let lo=Infinity,hi=-Infinity; card.notes.forEach(n=>{ lo=Math.min(lo,n.n); hi=Math.max(hi,n.n); }); const sp=Math.max(4,hi-lo+1), top=y+16, hh=Math.max(6,h-20);
  g.fillStyle=color; g.globalAlpha=.85;
  card.notes.forEach(n=>{ const nx=x0+n.t/L*w, nw=Math.max(1.5,(card.kind==='drum'?.8:n.d)/L*w-1), ny=card.kind==='drum'?top+(n.n/15)*(hh-3):top+(1-(n.n-lo+.5)/sp)*hh-1.5; g.fillRect(nx,ny,nw,card.kind==='drum'?3:3); });
  g.globalAlpha=1;
}
function hatch(g,x,y,w,h,color){ g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip(); g.strokeStyle=color; g.globalAlpha=.55; g.lineWidth=1.5; for(let i=-h;i<w;i+=7){ g.beginPath(); g.moveTo(x+i,y+h); g.lineTo(x+i+h,y); g.stroke(); } g.restore(); g.lineWidth=1; }
function drawPlacement(g,X,k,W){
  const card=activeCard(); if(!card) return; const R=rows(), font=fontMono(), acc=css['--accent'], fg=css['--fg'];
  const H=totalH(), selecting=!!PLACE.card;
  // 1. dim everything, then lift lanes that suit this card (same kind; same role strongest) and the new-track row
  if(selecting){ g.fillStyle=css['--bg']; g.globalAlpha=.3; g.fillRect(0,RULER_H,W,H-RULER_H); g.globalAlpha=1;
    R.forEach(r=>{ const fit=(r.tr.kind==='drum')===(card.kind==='drum'), same=trackRole(r.tr)===card.role; if(!fit) return; g.fillStyle=acc; g.globalAlpha=same?.1:.05; g.fillRect(0,r.y,W,r.h); g.globalAlpha=1; if(same){ g.fillStyle=acc; g.fillRect(0,r.y+2,3,r.h-4); } });
    g.fillStyle=css['--surface']; g.fillRect(0,H-ADD_H,W,ADD_H); g.fillStyle=acc; g.globalAlpha=.08; g.fillRect(0,H-ADD_H,W,ADD_H); g.globalAlpha=1;
    g.fillStyle=acc; g.font='600 11px '+font; g.fillText(`+ drop here for a new ${ROLE_INFO[card.role].label.toLowerCase()} track`,12,H-ADD_H+30); }
  // 2. the suggested slot
  const sug=suggestedTarget(card), sr=slotRect(sug);
  if(sr){ const x0=X(sug.start), w=card.len*k, isTarget=!PLACE.target||(PLACE.target.start===sug.start&&PLACE.target.trackId===sug.trackId);
    g.strokeStyle=fg; g.globalAlpha=isTarget?.9:.5; g.lineWidth=1.5; g.setLineDash([4,4]); rr(g,x0+1,sr.y+1,w-2,sr.h-2,5); g.stroke(); g.setLineDash([]); g.lineWidth=1; g.globalAlpha=1;
    if(!PLACE.target){
      if(sr.tr) sr.tr.clips.forEach(c=>{ const a=Math.max(c.start,sug.start), b=Math.min(clipEnd(c),sug.start+card.len); if(b>a&&c.notes.length){ hatch(g,X(a),sr.y,(b-a)*k,sr.h,css['--warn']); g.fillStyle=css['--warn']; g.font='600 10px '+font; g.fillText('replaces',X(a)+4,sr.y+sr.h-5); } });
      g.fillStyle=acc; g.globalAlpha=selecting?.26:.2; rr(g,x0,sr.y,w,sr.h,5); g.fill(); g.globalAlpha=1;
      g.strokeStyle=acc; g.lineWidth=selecting?2:1.5; rr(g,x0+1,sr.y+1,w-2,sr.h-2,5); g.stroke(); g.lineWidth=1;
      drawPatchInRect(g,card,x0,sr.y,w,sr.h,fg); g.fillStyle=acc; g.globalAlpha=.3; g.fillRect(x0,0,w,RULER_H); g.globalAlpha=1; }
    g.font='600 10.5px '+font; const lab=(PLACE.target&&!isTarget?'suggested':'suggested · '+(sr.tr?sr.tr.name:'new track'))+` · bar ${Math.floor(sug.start/16)+1}`; const tw=g.measureText(lab).width+12;
    g.fillStyle=fg; rr(g,x0,sr.y-1,Math.min(tw,Math.max(tw,40)),15,4); g.fill(); g.fillStyle=css['--bg']; g.fillText(lab,x0+6,sr.y+10); }
  // 3. the live target (pointer or drag)
  const t=PLACE.target; if(!t) return; const tr=slotRect(t); if(!tr) return; const x0=X(t.start), w=card.len*k;
  // conflicts: clips this would replace
  if(tr.tr) tr.tr.clips.forEach(c=>{ const a=Math.max(c.start,t.start), b=Math.min(clipEnd(c),t.start+card.len); if(b>a&&c.notes.length){ hatch(g,X(a),tr.y,(b-a)*k,tr.h,css['--warn']); g.fillStyle=css['--warn']; g.font='600 10px '+font; g.fillText('replaces',X(a)+4,tr.y+tr.h-5); } });
  g.fillStyle=acc; g.globalAlpha=.3; rr(g,x0,tr.y,w,tr.h,5); g.fill(); g.globalAlpha=1;
  g.strokeStyle=acc; g.lineWidth=2; rr(g,x0+1,tr.y+1,w-2,tr.h-2,5); g.stroke(); g.lineWidth=1;
  drawPatchInRect(g,card,x0,tr.y,w,tr.h,fg);
  const mapNote=tr.tr&&((tr.tr.kind==='drum')!==(card.kind==='drum'))?' · notes convert':'';
  const lab=`${card.title} → ${tr.tr?tr.tr.name:'new '+ROLE_INFO[card.role].label.toLowerCase()+' track'} · bar ${Math.floor(t.start/16)+1}${mapNote}`;
  g.font='600 11px '+font; const lw=g.measureText(lab).width+14; g.fillStyle=acc; rr(g,x0,tr.y-16,lw,16,4); g.fill(); g.fillStyle=css['--accent-ink']||'#1a0d06'; g.fillText(lab,x0+7,tr.y-4.5);
  // bar span guide on the ruler
  g.fillStyle=acc; g.globalAlpha=.35; g.fillRect(x0,0,w,RULER_H); g.globalAlpha=1;
}
function matchMood(){ const M=moodP(); pushHist(); if(!M.scales.includes(S.scale)) S.scale=M.scales[0]; if(S.bpm<M.bpm[0]||S.bpm>M.bpm[1]) S.bpm=Math.round((M.bpm[0]+M.bpm[1])/2); if(M.swing!=null) S.swing=M.swing; if(G) applyGraph(G); persist(); renderHeader(); renderMagicControls(); requestDraw(); buildDeck(); toast(`Now ${NOTE_NAMES[S.root]} ${S.scale.toLowerCase()} at ${S.bpm} BPM. Notes keep their place in the scale.`,[{label:'Undo',fn:()=>{ undo(); renderMagicControls(); }}]); }
document.addEventListener('click',e=>{ if(PLACE.card&&PLACE.mode==='select'&&!e.target.closest('.mcard,#lanesCv,#placeBar,.mg-deckwrap,.wstool,.pop')) cancelPlace(); },true);
function registerMagicControls(){
  const G1='Magic';
  control({id:'mgmake',group:G1,label:'Make a track',icon:'magic',tip:'Write a full track in the chosen mood and length',run:()=>$('mgMake').click()});
  control({id:'mggen',group:G1,label:'Deal ideas',icon:'dice',tip:'Deal fresh Magic suggestions',run:()=>$('mgGen').click()});
  control({id:'mgcraft',group:G1,label:'Craft next',icon:'right',tip:'Write the next bars on every playing track',run:()=>$('mgCraft').click()});
  control({id:'mgslow',group:G1,label:'Slowed + reverb',icon:'wave',run:()=>$('mgSlowed').click()});
}
function initMagic(){
  registerMagicControls();
  $('mgGen').onclick=()=>{ MAGIC.anchor=MAGIC.anchor; buildDeck(); const D=$('mgDeck'); D.classList.remove('dealt'); void D.offsetWidth; D.classList.add('dealt'); };
  $('mgShuffle').onclick=()=>{ stopCardPreview(); MAGIC.deck=MAGIC.deck.map(rerollCard); renderDeck(); const D=$('mgDeck'); D.classList.remove('dealt'); void D.offsetWidth; D.classList.add('dealt'); };
  $('mgCraft').onclick=craftNext;
  $('mgFitBtn').onclick=matchMood;
  $('mgEnergy').oninput=e=>{ MAGIC.energy=e.target.value/100; $('mgEnergyN').innerHTML=e.target.value+'<small>%</small>'; e.target.style.setProperty('--v',MAGIC.energy); saveMagic(); };
  $('mgEnergy').onchange=()=>buildDeck();
  $('mgBars').querySelectorAll('button').forEach(b=>b.onclick=()=>{ MAGIC.bars=+b.dataset.v; saveMagic(); renderMagicControls(); buildDeck(); });
  $('mgFrom').onclick=()=>{ MAGIC.anchor=null; buildDeck(); };
  document.querySelectorAll('.mgtabs button').forEach(b=>b.onclick=()=>{ MAGIC.tab=b.dataset.t; saveMagic(); renderMagicControls(); });
  $('mgLen').querySelectorAll('button').forEach(b=>b.onclick=()=>{ MAGIC.len=+b.dataset.v; saveMagic(); renderMagicControls(); });
  $('mgMake').onclick=craftTrack;
  $('mgSlowed').onclick=slowedReverb;
  $('mgLearn').onclick=()=>typeof openAgent==='function'?openAgent():$('mgLearnFile').click(); $('mgLearnFile').onchange=e=>{ const f=e.target.files[0]; e.target.value=''; if(f) learnFromFile(f); };
  $('mgLearned').onclick=e=>{ const p=$('pop'); p.className='pop clipmenu learnedpop'; p.innerHTML=`<div class="rackhead"><span class="lbl">studied ${TRAINED.tracks} reference tracks</span><button class="btn ghost" data-x>Close</button></div><ol class="learnlist">${TRAINED.rules.map(r=>'<li></li>').join('')}</ol><p class="hint" style="margin:0">Learned styles you add with “Learn from a track” appear as ★ chips. Right-click one to forget it.</p>`;
    p.querySelectorAll('.learnlist li').forEach((li,i)=>li.textContent=TRAINED.rules[i]); p.querySelector('[data-x]').onclick=closePop; const r=e.currentTarget.getBoundingClientRect(); placePop(p,r.left,r.bottom+6); };
  const di=$('mgDescribe'); let dt=null;
  const preview=()=>{ const o=describe(di.value); const parts=[o.genre,o.mood&&o.mood.toLowerCase(),o.use&&'for '+o.use.toLowerCase()].filter(Boolean); $('mgMatch').textContent=di.value.trim()?(parts.length?'→ '+parts.join(' · ')+' · press Enter':'no match yet: try “lofi”, “car edit”, “wedding”'):`${genreName()} · ${MAGIC.mood.toLowerCase()}${MAGIC.use?' · for '+MAGIC.use.toLowerCase():''}`; return o; };
  di.oninput=()=>{ clearTimeout(dt); dt=setTimeout(preview,120); };
  di.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); const o=preview(); if(o.genre||o.mood||o.use){ if(o.use) MAGIC.tab='use'; applyPick(o); di.value=''; toast(`Set to ${[o.genre||genreName(),(o.mood||MAGIC.mood).toLowerCase(),o.use&&'for '+o.use.toLowerCase()].filter(Boolean).join(' · ')}. Fresh cards dealt.`,[{label:'Make a track',fn:craftTrack}]); } } else if(e.key==='Escape'){ di.value=''; preview(); di.blur(); } };
  on('header',()=>renderMagicControls());
  on('restore',()=>{ renderMagicControls(); buildDeck(); });
  on('song',()=>{ MAGIC.anchor=null; renderMagicControls(); buildDeck(); });
  on('key',(e,{typing,sheetOpen})=>{
    if(e.key==='Escape'&&PLACE.card){ cancelPlace(); return true; }
    if(e.key==='Enter'&&PLACE.card&&!typing&&!sheetOpen&&!(e.target.closest&&e.target.closest('button,.mcard'))){ e.preventDefault(); placeAt(PLACE.card,PLACE.target||suggestedTarget(PLACE.card)); return true; }
    return false; });
  renderMagicControls(); buildDeck();
}

