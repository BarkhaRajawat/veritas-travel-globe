import { useState, useMemo, useEffect, useRef } from 'react'
import FALLBACK from '../data/fallback'
import { fetchWikiImage, getScenicQuery } from '../utils/wikiImage'
import { COUNTRY_LIST } from '../utils/iso2map'
import useGlobeStore from '../store'

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getBestNow() {
  const key = `bt_${MONTHS[new Date().getMonth()]}`
  const preferred = ['JP','CH','IT','FR','GR','PE','IS','TH','NZ','NO','AU','ES','PT','AT']
  const picks = Object.values(FALLBACK).filter(c => c[key] === '1')
  return [
    ...preferred.map(iso2 => picks.find(c => c.iso2 === iso2)).filter(Boolean),
    ...picks.filter(c => !preferred.includes(c.iso2)),
  ].slice(0, 4)
}

// Country → flag emoji
const FLAGS = {
  JP:'🇯🇵',CH:'🇨🇭',IT:'🇮🇹',FR:'🇫🇷',GR:'🇬🇷',PE:'🇵🇪',IS:'🇮🇸',
  TH:'🇹🇭',NZ:'🇳🇿',NO:'🇳🇴',AU:'🇦🇺',ES:'🇪🇸',PT:'🇵🇹',AT:'🇦🇹',
  DE:'🇩🇪',GB:'🇬🇧',US:'🇺🇸',CA:'🇨🇦',IN:'🇮🇳',MX:'🇲🇽',BR:'🇧🇷',
  JP2:'🇯🇵',TW:'🇹🇼',KR:'🇰🇷',SG:'🇸🇬',
}

// Country-specific seasonal description
function getSeasonDesc(c) {
  const m = new Date().getMonth()
  const season = m >= 2 && m <= 4 ? 'Spring bloom' :
                 m >= 5 && m <= 7 ? 'Summer peak' :
                 m >= 8 && m <= 10 ? 'Autumn colours' : 'Winter escape'
  const specifics = {
    JP:'Cherry blossom season 🌸', CH:'Alpine meadows & clear skies ⛰',
    IT:'Perfect Mediterranean weather ☀', FR:'Lavender & vineyard season 🌿',
    GR:'Aegean paradise weather 🏛', IS:'Midnight sun & puffins 🌅',
    PE:'Dry season at Machu Picchu 🏔', TH:'Coolest & driest months 🌴',
    NO:'Northern lights season 🌌', AT:'Alpine spring hiking 🌷',
    PT:'Sunny Algarve coast 🏖', NZ:`${season} in the southern hemisphere`,
  }
  return specifics[c.iso2] ?? season
}

const GRADIENTS = {
  JP:'linear-gradient(155deg,#1a0a2e,#4a1060,#8b3a62,#c4607a)',
  CH:'linear-gradient(155deg,#0a1628,#0d3050,#1a5e40,#3a9b6a)',
  IT:'linear-gradient(155deg,#1a0e08,#4a2010,#8b5020,#c4882a)',
  FR:'linear-gradient(155deg,#120a28,#3a1860,#6a3890,#9a68c0)',
  GR:'linear-gradient(155deg,#04142a,#062840,#0a5080,#1e8abf)',
  PE:'linear-gradient(155deg,#0a1808,#1a3810,#3a6820,#6a9840)',
  IS:'linear-gradient(155deg,#020a18,#041828,#0a3040,#1a7060)',
  TH:'linear-gradient(155deg,#0a1828,#082840,#105870,#20a09a)',
  NO:'linear-gradient(155deg,#020810,#041420,#082438,#104868)',
  AT:'linear-gradient(155deg,#0a0818,#180828,#301850,#506098)',
  PT:'linear-gradient(155deg,#1a0808,#3a1010,#6a2020,#b04040)',
  NZ:'linear-gradient(155deg,#04102a,#081e38,#103058,#206090)',
  DEFAULT:'linear-gradient(155deg,#080c1e,#101828,#1a2840,#243858)',
}

const CATEGORIES = [
  { icon:'🏖', label:'Beaches',      color:'#00d4aa' },
  { icon:'⛰',  label:'Mountains',   color:'#f59e0b' },
  { icon:'🏙',  label:'City Escapes',color:'#a78bfa' },
  { icon:'💎',  label:'Hidden Gems', color:'#4caf7d' },
]

const HOW_TO = [
  { icon:'↺',  label:'Rotate',         desc:'Drag to spin the globe',       color:'#00d4aa' },
  { icon:'⊕',  label:'Zoom',           desc:'Scroll to zoom in/out',        color:'#4caf7d' },
  { icon:'◎',  label:'Select Country', desc:'Click a country',              color:'#7b8fff' },
  { icon:'⌕',  label:'Search',         desc:'Find cities or states',        color:'#e09050' },
  { icon:'❯❯', label:'Drill Down',     desc:'Explore regions & local info', color:'#e05070' },
]

const STATS = [
  { icon:'⊞',  value:'195',       label:'Countries' },
  { icon:'📅', value:'12',        label:'Months Insights' },
  { icon:'✦',  value:'Smart',     label:'Travel Intelligence' },
  { icon:'⏱',  value:'Real time', label:'Seasonal Updates' },
]

export default function LandingOverlay() {
  const bestNow  = useMemo(() => getBestNow(), [])
  const featured = bestNow[0]
  const picks    = bestNow.slice(1)
  const [slide, setSlide]       = useState(0)
  const [featImg, setFeatImg]   = useState(null)
  const [featLoaded, setFeatLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Cycle featured country by slide index
  const feat = bestNow[slide] ?? featured

  // Load scenic image on desktop only
  useEffect(() => {
    if (isMobile) return
    let cancelled = false
    if (!feat?.name) return
    setFeatLoaded(false)
    setFeatImg(null)
    fetchWikiImage(getScenicQuery(feat.name)).then(url => {
      if (!cancelled) setFeatImg(url ?? null)
    })
    return () => { cancelled = true }
  }, [feat?.name, isMobile])

  if (isMobile) return <MobileSheet bestNow={bestNow} />

  return (
    <>

       
      {/* ══ LHS ══ */}
      <div
        className="overlay-lhs"
        style={{
          position: 'fixed',
          left: 28,
          top: 64,
          bottom: 70,
          width: 325,
          zIndex: 5,
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          paddingTop: 9,
        }}
      >
        <p style={{ ...blueLabel, marginBottom: 12 }}>
          Explore the World
        </p>

        <h1
          style={{
            margin: '0 0 13px',
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.2,
            color: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 2px 20px rgba(0,0,0,0.90)',
            whiteSpace: 'nowrap',
          }}
        >
          Click the world,
          <br />
          discover your
          <br />
          next{' '}
          <span
            style={{
              fontStyle: 'italic',
              background: 'linear-gradient(90deg,#4ea8ff,#a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            story.
          </span>
        </h1>

        <p
          style={{
            margin: '0 0 19px',
            fontSize: 14,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.78)',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 1px 10px rgba(0,0,0,0.80)',
          }}
        >
          Tap any country on the globe to discover the best time to visit,
          travel insights, and unforgettable experiences.
        </p>

        <p style={{ ...sectionLabel, marginBottom: 9 }}>
          What Will You Find?
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 19,
          }}
        >
          {CATEGORIES.map((c) => (
            <div
              key={c.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 27,
                  height: 27,
                  borderRadius: '50%',
                  background: `${c.color}22`,
                  border: `1.5px solid ${c.color}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${c.color}22`,
                }}
              >
                {c.icon}
              </span>

              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: c.color,
                  fontFamily: 'system-ui, sans-serif',
                  textShadow: `0 0 12px ${c.color}44, 0 1px 8px rgba(0,0,0,0.70)`,
                }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>

        <p style={{ ...sectionLabel, marginBottom: 9 }}>
          How to Explore
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HOW_TO.map((tip) => (
            <div
              key={tip.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: '50%',
                  background: `${tip.color}20`,
                  border: `1.5px solid ${tip.color}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: tip.color,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${tip.color}22`,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {tip.icon}
              </span>

              <span
                style={{
                  fontSize: 14,
                  fontFamily: 'system-ui, sans-serif',
                  textShadow: '0 1px 8px rgba(0,0,0,0.80)',
                }}
              >
                <strong style={{ color: '#fff', fontWeight: 700 }}>
                  {tip.label}
                </strong>
                <span style={{ color: 'rgba(255,255,255,0.58)' }}>
                  {' '}— {tip.desc}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* Trip Budget Calculator shortcut */}
        <button
          type="button"
          onClick={() => {
            document
              .getElementById('trip-budget-calculator')
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
          }}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 18,
            padding: '11px 14px',
            width: 'fit-content',
            maxWidth: '100%',
            borderRadius: 12,
            border: '1px solid rgba(0,212,170,0.35)',
            background: 'rgba(0,212,170,0.10)',
            color: '#00d4aa',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'system-ui, sans-serif',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 19 }}>🧮</span>
          <span>Trip Budget Calculator</span>
          <span style={{ fontSize: 17 }}>↓</span>
        </button>
      </div>

      {/* ══ RHS ══ */}
      <div className="no-scrollbar overlay-rhs" style={{
        position:'fixed', right:17, top:64, bottom:70,
        width:340, zIndex:5, userSelect:'none',
        overflowY:'auto',
        display:'flex', flexDirection:'column', gap:14,
      }}>

        {/* ─ BEST RIGHT NOW ─ */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <span style={{ fontSize:13 }}>🌿</span>
            <p style={{ ...blueLabel, fontSize:11 }}>Best Right Now</p>
          </div>

          {/* Featured card — photo on top, info below */}
          <div style={{
            borderRadius:14, overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.12)',
            background:'rgba(6,10,24,0.85)',
            backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
            boxShadow:'0 10px 40px rgba(0,0,0,0.60)',
          }}>
            {/* Full-width photo area on top */}
            <div style={{
              width:'100%', height:166,
              background: GRADIENTS[feat?.iso2] ?? GRADIENTS.DEFAULT,
              position:'relative', overflow:'hidden',
            }}>
              {featImg && (
                <img
                  src={featImg}
                  alt={feat?.name}
                  loading="eager"
                  decoding="async"
                  onLoad={() => setFeatLoaded(true)}
                  style={{
                    position:'absolute',
                    top:0, left:0, right:0, bottom:0,
                    width:'100%', height:'100%',
                    objectFit:'cover', objectPosition:'center center',
                    display:'block',
                    opacity: featLoaded ? 1 : 0,
                    transition:'opacity 0.7s ease',
                  }}
                />
              )}
              {/* Petal dots for JP */}
              {feat?.iso2 === 'JP' && [
                {top:20,left:30,s:9},{top:10,left:90,s:7},{top:35,left:160,s:8},
                {top:14,left:220,s:6},{top:28,left:270,s:9},{top:8,left:50,s:5},
                {top:42,left:120,s:6},{top:18,left:190,s:7},
              ].map((d,i)=>(
                <div key={i} style={{
                  position:'absolute', top:d.top, left:d.left,
                  width:d.s, height:d.s, borderRadius:'50%',
                  background:'rgba(255,175,200,0.65)',
                }}/>
              ))}
              {/* Country name overlay on photo */}
              <div style={{
                position:'absolute', bottom:0, left:0, right:0,
                padding:'28px 14px 10px',
                background:'linear-gradient(to top, rgba(4,8,20,0.90) 0%, transparent 100%)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:24, fontWeight:800, color:'#fff', fontFamily:'system-ui,sans-serif' }}>
                    {feat?.name}
                  </span>
                  <span style={{ fontSize:19 }}>{FLAGS[feat?.iso2] ?? '🌍'}</span>
                </div>
              </div>
            </div>

            {/* Info below photo */}
            <div style={{ padding:'12px 15px 14px', display:'flex', flexDirection:'column', gap:5 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:500, color:'rgba(220,235,255,0.80)', fontFamily:'system-ui,sans-serif', lineHeight:1.45 }}>
                {feat ? getSeasonDesc(feat) : ''}
              </p>
              <p style={{ margin:0, fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'#00d4aa', fontFamily:'system-ui,sans-serif', textShadow:'0 0 10px rgba(0,212,170,0.40)' }}>
                ✦ Peak month · {MONTH_LABELS[new Date().getMonth()]}
              </p>
            </div>
          </div>

          {/* Arrows + dots */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:9, padding:'0 2px' }}>
            <button onClick={() => setSlide(s => (s - 1 + bestNow.length) % bestNow.length)}
              style={arrowBtn}>‹</button>
            <div style={{ display:'flex', gap:6 }}>
              {bestNow.map((_,i) => (
                <span key={i} onClick={()=>setSlide(i)} style={{
                  width: i === slide ? 17 : 7, height:7, borderRadius:4,
                  background: i === slide ? 'rgba(80,160,255,0.90)' : 'rgba(255,255,255,0.22)',
                  cursor:'pointer', transition:'all 0.20s ease', display:'inline-block',
                }}/>
              ))}
            </div>
            <button onClick={() => setSlide(s => (s + 1) % bestNow.length)}
              style={arrowBtn}>›</button>
          </div>
        </div>

        {/* ─ QUICK PICKS ─ */}
        <div style={{ marginTop:19 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <span style={{ fontSize:13 }}>⭐</span>
            <p style={{ ...blueLabel, fontSize:11 }}>Quick Picks</p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {picks.map(c => (
              <QuickPickRow key={c.iso2} country={c} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ Bottom stats bar ══ */}
      <div className="overlay-stats" style={{
        position:'fixed', bottom:9, left:353, right:357,
        zIndex:5, display:'flex',
        background:'rgba(4,8,22,0.92)',
        border:'1px solid rgba(255,255,255,0.09)',
        borderRadius:9,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        boxShadow:'0 4px 20px rgba(0,0,0,0.45)',
        userSelect:'none', overflow:'hidden',
      }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{
            flex:1,
            padding:'5px 0',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            borderRight: i < STATS.length-1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}>
            <span style={{ fontSize:14, opacity:0.65 }}>{s.icon}</span>
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              <span style={{ fontSize:14, fontWeight:800, color:'#fff', fontFamily:'system-ui,sans-serif', lineHeight:1 }}>{s.value}</span>
              <span style={{ fontSize:9, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'rgba(200,215,255,0.40)', fontFamily:'system-ui,sans-serif' }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

    </>
  )
}

// ── Flag emoji utility ────────────────────────────────────────────────────────
const toFlag = (iso2) => {
  if (!iso2 || iso2.length !== 2) return '🌍'
  const o = 0x1F1E6 - 65
  return String.fromCodePoint(iso2.charCodeAt(0) + o, iso2.charCodeAt(1) + o)
}

// ── Mobile country search bar ─────────────────────────────────────────────────
function MobileSearchBar() {
  const setSelectedCountry = useGlobeStore((s) => s.setSelectedCountry)
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen]     = useState(false)

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setResults(
      COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    )
  }

  const handleSelect = (country) => {
    setSelectedCountry({ properties: { name: country.name }, __type: 'country' })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div style={{ position: 'fixed', top: 76, left: 36, right: 36, zIndex: 10 }}>
      {/* Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* SVG magnifying glass icon */}
        <svg style={{ position: 'absolute', left: 14, zIndex: 2, pointerEvents: 'none' }}
          width="19" height="19" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.70)" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="17" y1="17" x2="22" y2="22" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Search countries, cities, places..."
          style={{
            width: '100%', padding: '12px 16px 12px 46px',
            borderRadius: 14,
            background: 'rgba(20,26,48,0.82)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff', fontSize: 14,
            fontFamily: 'system-ui,sans-serif',
            outline: 'none',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.40)',
          }}
        />
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          marginTop: 8,
          background: 'rgba(10,14,26,0.97)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)',
          overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.50)',
        }}>
          {results.map((c, i) => (
            <div
              key={c.iso2}
              onPointerDown={() => handleSelect(c)}
              style={{
                padding: '13px 18px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                background: 'transparent',
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{toFlag(c.iso2)}</span>
              <span style={{ fontSize: 15, color: '#fff', fontFamily: 'system-ui,sans-serif' }}>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Mobile bottom sheet ───────────────────────────────────────────────────────

function MobileSheet({ bestNow }) {
  const [open, setOpen]     = useState(false)
  const [images, setImages] = useState({})
  const MONTH_NAME = MONTH_LABELS[new Date().getMonth()]
  const startY = useRef(null)

  // Fetch Wikipedia photos on mount (load in background, show when ready)
  useEffect(() => {
    bestNow.forEach(c => {
      if (!c?.name) return
      fetchWikiImage(getScenicQuery(c.name)).then(url => {
        if (url) setImages(prev => ({ ...prev, [c.iso2]: url }))
      })
    })
  }, []) // eslint-disable-line

  const handleTouchStart = (e) => { startY.current = e.touches[0].clientY }
  const handleTouchEnd   = (e) => {
    if (startY.current === null) return
    const dy = startY.current - e.changedTouches[0].clientY
    if (dy > 28) setOpen(true)
    if (dy < -28) setOpen(false)
    startY.current = null
  }

  const SHEET_OPEN_H = 290

  return (
    <>
      {/* Search bar — below TopNav */}
      <MobileSearchBar />

      {/* Tagline — below search bar */}
      <div style={{
        position: 'fixed', top: 132, left: 0, right: 0,
        zIndex: 5, textAlign: 'left',
        padding: '10px 24px',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        <p style={{
          margin: 0,
          fontSize: 26, fontWeight: 800, lineHeight: 1.25,
          color: '#ffffff', fontFamily: 'system-ui, sans-serif',
        }}>Click the world,</p>
        <p style={{
          margin: 0,
          fontSize: 26, fontWeight: 800, lineHeight: 1.25,
          fontFamily: 'system-ui, sans-serif',
          background: 'linear-gradient(90deg,#4ea8ff,#a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>discover your story.</p>
      </div>

      {/* Drag to explore hint — floats above the sheet */}
      <div style={{
        position: 'fixed',
        bottom: open ? SHEET_OPEN_H + 14 : 78,
        left: 0, right: 0,
        zIndex: 5, textAlign: 'center',
        pointerEvents: 'none', userSelect: 'none',
        transition: 'bottom 0.32s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.28)',
          fontFamily: 'system-ui, sans-serif', letterSpacing: '0.12em',
        }}>✦ Drag to explore</span>
      </div>

      {/* Bottom sheet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 5,
          background: 'rgba(6,10,24,0.95)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden',
          transition: 'height 0.32s cubic-bezier(0.4,0,0.2,1)',
          height: open ? SHEET_OPEN_H : 64,
        }}
      >
        {/* Handle + header */}
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            height: 64, display: 'flex', alignItems: 'center',
            padding: '0 20px', gap: 10, cursor: 'pointer',
            position: 'relative', userSelect: 'none', flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.22)',
          }} />
          <span style={{ fontSize: 15 }}>🌿</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#00d4aa',
              fontFamily: 'system-ui,sans-serif',
              letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 1,
            }}>Best Right Now</div>
            <div style={{
              fontSize: 15, fontWeight: 700, color: '#fff',
              fontFamily: 'system-ui,sans-serif',
            }}>{MONTH_NAME}</div>
          </div>
          <span style={{
            fontSize: 14, color: 'rgba(255,255,255,0.40)',
            transition: 'transform 0.25s ease',
            transform: open ? 'rotate(180deg)' : 'none',
            display: 'inline-block',
          }}>∨</span>
        </div>

        {/* Description row */}
        <div style={{
          padding: '0 20px 12px',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.15s ease',
          pointerEvents: 'none',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.40)', fontFamily: 'system-ui,sans-serif', lineHeight: 1.5 }}>
            Perfect destinations based on weather, season &amp; crowd.
          </p>
        </div>

        {/* Photo cards — horizontal scroll */}
        <div style={{
          display: 'flex', gap: 12,
          overflowX: 'auto', overflowY: 'hidden',
          padding: '0 16px 20px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.20s ease',
          pointerEvents: open ? 'auto' : 'none',
        }}>
          {bestNow.map(c => (
            <div
              key={c.iso2}
              onClick={() => setOpen(false)}
              style={{
                flexShrink: 0, width: 144, height: 152,
                borderRadius: 16, overflow: 'hidden',
                background: GRADIENTS[c.iso2] ?? GRADIENTS.DEFAULT,
                border: '1px solid rgba(255,255,255,0.12)',
                position: 'relative', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0,0,0,0.50)',
              }}
            >
              {/* Wikipedia photo */}
              {images[c.iso2] && (
                <img
                  src={images[c.iso2]}
                  alt={c.name}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                  }}
                />
              )}
              {/* Bottom gradient */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.10) 55%, transparent 100%)',
              }} />
              {/* Info overlay */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 5 }}>{FLAGS[c.iso2] ?? '🌍'}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'system-ui,sans-serif', lineHeight: 1.2 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'system-ui,sans-serif', marginTop: 3, lineHeight: 1.3 }}>
                  {getSeasonDesc(c).slice(0, 24)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function QuickPickRow({ country }) {
  const [hov, setHov] = useState(false)
  const [img, setImg]       = useState(null)
  const [loaded, setLoaded] = useState(false)
  const grad = GRADIENTS[country.iso2] ?? GRADIENTS.DEFAULT

  useEffect(() => {
    let cancelled = false
    if (!country?.name) return
    setLoaded(false)
    setImg(null)
    fetchWikiImage(getScenicQuery(country.name)).then(url => {
      if (!cancelled) setImg(url ?? null)
    })
    return () => { cancelled = true }
  }, [country?.name])

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:0,
        borderRadius:11,
        background: hov ? 'rgba(80,140,255,0.10)' : 'rgba(6,10,24,0.80)',
        border:`1px solid ${hov ? 'rgba(80,140,255,0.40)' : 'rgba(255,255,255,0.10)'}`,
        overflow:'hidden',
        backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
        boxShadow:'0 4px 16px rgba(0,0,0,0.40)',
        transition:'all 0.18s ease', cursor:'default',
      }}
    >
      {/* Thumbnail with Wikipedia image */}
      <div style={{ width:94, height:78, background:grad, flexShrink:0, position:'relative', overflow:'hidden' }}>
        {img && (
          <img
            src={img}
            alt={country.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            style={{
              position:'absolute',
              top:0, left:0, right:0, bottom:0,
              width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center center',
              display:'block',
              opacity: loaded ? 1 : 0,
              transition:'opacity 0.5s ease',
            }}
          />
        )}
      </div>
      {/* Info */}
      <div style={{ flex:1, padding:'0 15px' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#ffffff', fontFamily:'system-ui,sans-serif' }}>
          {country.name}
        </div>
        <div style={{ fontSize:13, color:'rgba(200,215,255,0.65)', fontFamily:'system-ui,sans-serif', marginTop:4 }}>
          Best time: {country.peak_months}
        </div>
      </div>
      <span style={{ fontSize:20, color:'rgba(140,190,255,0.65)', flexShrink:0, paddingRight:15 }}>›</span>
    </div>
  )
}

const blueLabel = {
  margin:0,
  fontSize:11, fontWeight:700, letterSpacing:'0.17em',
  textTransform:'uppercase',
  color:'#00d4aa',
  fontFamily:'system-ui,sans-serif',
  textShadow:'0 0 16px rgba(0,212,170,0.55), 0 0 6px rgba(0,212,170,0.30)',
}

const sectionLabel = {
  margin:'0 0 0',
  fontSize:11, fontWeight:700, letterSpacing:'0.15em',
  textTransform:'uppercase',
  color:'#00d4aa',
  fontFamily:'system-ui,sans-serif',
  textShadow:'0 0 12px rgba(0,212,170,0.45)',
}

const arrowBtn = {
  background:'rgba(255,255,255,0.07)',
  border:'1px solid rgba(255,255,255,0.12)',
  borderRadius:8, color:'rgba(255,255,255,0.70)',
  fontSize:15, lineHeight:1, padding:'3px 8px',
  cursor:'pointer', fontFamily:'system-ui,sans-serif',
}
