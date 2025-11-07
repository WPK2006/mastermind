import React, { useEffect, useMemo, useRef, useState } from 'react'

// Basfärger (välj färgantal via settings)
const BASE_COLORS = [
  { name: 'Röd', value: '#ef4444' },
  { name: 'Blå', value: '#3b82f6' },
  { name: 'Grön', value: '#22c55e' },
  { name: 'Gul', value: '#eab308' },
  { name: 'Lila', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Rosa', value: '#ec4899' }
]

// ----- Hjälpfunktioner -----
function sampleNoDuplicates(n, max) {
  const arr = [...Array(max).keys()]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, n)
}

function makeSecret(pegs, colorCount, allowDuplicates) {
  if (allowDuplicates) {
    return Array.from({ length: pegs }, () => Math.floor(Math.random() * colorCount))
  }
  // no duplicates
  const picks = sampleNoDuplicates(pegs, colorCount)
  return picks
}

function scoreGuess(guess, secret) {
  const n = secret.length
  const usedSecret = Array(n).fill(false)
  const usedGuess = Array(n).fill(false)
  let black = 0
  for (let i = 0; i < n; i++) {
    if (guess[i] === secret[i]) {
      black++; usedSecret[i] = true; usedGuess[i] = true
    }
  }
  let white = 0
  for (let i = 0; i < n; i++) {
    if (usedGuess[i]) continue
    for (let j = 0; j < n; j++) {
      if (usedSecret[j]) continue
      if (guess[i] === secret[j]) {
        white++; usedSecret[j] = true; usedGuess[i] = true; break
      }
    }
  }
  return { black, white }
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ----- UI-komponenter -----
function Peg({ color, subdued=false, onClick, title }) {
  const cls = 'peg' + (subdued ? ' subdued' : '')
  return <button className={cls} style={{ background: color }} onClick={onClick} title={title} />
}

function FeedbackDot({ type }) {
  const cls = 'dot ' + (type || '')
  return <div className={cls} />
}

// ----- Huvudkomponent -----
export default function App () {
  // Tema
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme-dark')
    return saved ? saved === '1' : true
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme-dark', dark ? '1' : '0')
  }, [dark])

  // Settings / svårighet
  const DIFFICULTIES = {
    easy:   { pegs: 4, colorCount: 6, maxTries: 10, allowDuplicates: true },
    normal: { pegs: 4, colorCount: 6, maxTries: 8,  allowDuplicates: true },
    hard:   { pegs: 5, colorCount: 7, maxTries: 8,  allowDuplicates: false },
    custom: null
  }
  const [mode, setMode] = useState('normal')
  const [settings, setSettings] = useState(DIFFICULTIES.normal)

  useEffect(() => {
    if (mode === 'custom') return
    setSettings(DIFFICULTIES[mode])
  }, [mode])

  const COLORS = useMemo(() => BASE_COLORS.slice(0, settings.colorCount), [settings.colorCount])

  // Spelstate
  const [secret, setSecret] = useState(() => makeSecret(settings.pegs, settings.colorCount, settings.allowDuplicates))
  const [guesses, setGuesses] = useState([]) // {pegs:number[], black, white}
  const [current, setCurrent] = useState(() => Array(settings.pegs).fill(null))
  const [selected, setSelected] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)

  // Timer
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef(null)
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])
  const resetTimer = () => { setSeconds(0); clearInterval(timerRef.current); timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000) }

  // Game over
  const gameOver = useMemo(() => {
    if (guesses.some(g => g.black === settings.pegs)) return 'win'
    if (guesses.length >= settings.maxTries) return 'lose'
    return null
  }, [guesses, settings.pegs, settings.maxTries])

  useEffect(() => {
    if (gameOver) clearInterval(timerRef.current)
  }, [gameOver])

  // Statistik
  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mm-stats') || '{}') } catch { return {} }
  })
  const updateStats = (result) => {
    const total = (stats.total || 0) + 1
    const wins  = (stats.wins  || 0) + (result === 'win' ? 1 : 0)
    const bestTime = result === 'win'
      ? Math.min(stats.bestTime ?? Infinity, seconds)
      : (stats.bestTime ?? null)
    const bestTries = result === 'win'
      ? Math.min(stats.bestTries ?? Infinity, guesses.length)
      : (stats.bestTries ?? null)
    const next = { total, wins, bestTime: Number.isFinite(bestTime) ? bestTime : stats.bestTime ?? null, bestTries: Number.isFinite(bestTries) ? bestTries : stats.bestTries ?? null }
    setStats(next)
    localStorage.setItem('mm-stats', JSON.stringify(next))
  }

  useEffect(() => {
    if (gameOver) updateStats(gameOver)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver])

  // Återställ spel
  function newGame(keepSettings = true) {
    const s = keepSettings ? settings : DIFFICULTIES.normal
    setMode(keepSettings ? mode : 'normal')
    setSettings(s)
    setSecret(makeSecret(s.pegs, s.colorCount, s.allowDuplicates))
    setGuesses([])
    setCurrent(Array(s.pegs).fill(null))
    setSelected(0)
    setHintUsed(false)
    resetTimer()
  }

  // Interaktion
  function placeColor(i) {
    if (gameOver) return
    const next = current.slice()
    next[i] = selected
    setCurrent(next)
  }
  function clearSlot(i) {
    if (gameOver) return
    const next = current.slice()
    next[i] = null
    setCurrent(next)
  }
  function fillRandom() {
    if (gameOver) return
    setCurrent(Array.from({ length: settings.pegs }, () => Math.floor(Math.random() * settings.colorCount)))
  }
  function submitGuess() {
    if (gameOver) return
    if (current.some(c => c === null)) return
    const res = scoreGuess(current, secret)
    const g = { pegs: current, black: res.black, white: res.white }
    setGuesses(prev => [g, ...prev])
    setCurrent(Array(settings.pegs).fill(null))
  }
  function useHint() {
    if (gameOver || hintUsed) return
    // hitta en position som inte redan visas korrekt i current
    const options = []
    for (let i = 0; i < settings.pegs; i++) {
      if (current[i] !== secret[i]) options.push(i)
    }
    if (options.length === 0) return
    const pos = options[Math.floor(Math.random() * options.length)]
    const next = current.slice()
    next[pos] = secret[pos]
    setCurrent(next)
    setHintUsed(true)
    // hint kostar ett försök
    setGuesses(prev => [...prev])
  }

  // Render
  const solved = guesses.find(g => g.black === settings.pegs)

  return (
    <div className="container">
      {/* Topbar */}
      <div className="topbar card">
        <div className="row">
          <h1>Mastermind</h1>
          <span className="chip">{mode === 'custom' ? 'Custom' : mode.charAt(0).toUpperCase()+mode.slice(1)}</span>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setDark(d => !d)}>{dark ? '☀️ Light' : '🌙 Dark'}</button>
          <button className="btn" onClick={() => newGame(true)}>Nytt spel</button>
        </div>
      </div>

      {/* Settings */}
      <div className="card settings">
        <div className="row wrap">
          <div className="field">
            <label>Svårighet</label>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="easy">Enkel (4/6/10, dub tillåtna)</option>
              <option value="normal">Normal (4/6/8, dub tillåtna)</option>
              <option value="hard">Svår (5/7/8, inga dub)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {mode === 'custom' && (
            <>
              <div className="field">
                <label>Pinnar</label>
                <input type="number" min="3" max="6" value={settings.pegs}
                  onChange={e => setSettings(s => ({...s, pegs: Number(e.target.value)}))} />
              </div>
              <div className="field">
                <label>Färger</label>
                <input type="number" min="4" max={BASE_COLORS.length} value={settings.colorCount}
                  onChange={e => setSettings(s => ({...s, colorCount: Number(e.target.value)}))} />
              </div>
              <div className="field">
                <label>Försök</label>
                <input type="number" min="5" max="12" value={settings.maxTries}
                  onChange={e => setSettings(s => ({...s, maxTries: Number(e.target.value)}))} />
              </div>
              <div className="field checkbox">
                <label><input type="checkbox" checked={settings.allowDuplicates}
                  onChange={e => setSettings(s => ({...s, allowDuplicates: e.target.checked}))} /> Tillåt dubbletter</label>
              </div>
              <button className="btn" onClick={() => newGame(true)}>Starta med Custom</button>
            </>
          )}
        </div>
        <div className="row stats">
          <span>⏱ {fmtTime(seconds)}</span>
          <span>Försök kvar: <b>{Math.max(0, settings.maxTries - guesses.length)}</b></span>
          <span>Spelade: <b>{stats.total || 0}</b></span>
          <span>Vinster: <b>{stats.wins || 0}</b></span>
          {stats.bestTime != null && <span>Bästa tid: <b>{fmtTime(stats.bestTime)}</b></span>}
          {stats.bestTries != null && <span>Bäst försök: <b>{stats.bestTries}</b></span>}
        </div>
      </div>

      {/* Aktiva färger och actions */}
      <div className="card">
        <div className="toolbar">
          <div className="row">
            <span className="muted">Aktiv färg:</span>
            <div className="colors">
              {COLORS.map((c, i) => (
                <div key={i} className="peg-wrap">
                  <Peg color={c.value} subdued={i !== selected} onClick={() => setSelected(i)} title={c.name}/>
                  {i === selected && <div className="peg-ring" />}
                </div>
              ))}
            </div>
          </div>
          <div className="row">
            <button className="btn" onClick={fillRandom} disabled={!!gameOver}>Fyll slump</button>
            <button className="btn" onClick={useHint} disabled={!!gameOver || hintUsed}>Hint {hintUsed ? '✓' : '•'}</button>
            <button className="btn primary" onClick={submitGuess} disabled={!!gameOver || current.some(c => c === null)}>Gissa</button>
          </div>
        </div>
      </div>

      {/* Hemlig kod + status */}
      {(gameOver) && (
        <div className="card secret">
          <div className="row">
            <span className="muted">Hemlig kod:</span>
            <div className="row">
              {secret.map((idx, i) => <Peg key={i} color={COLORS[idx].value} />)}
            </div>
          </div>
          <div className="result">
            {gameOver === 'win'
              ? <span className="good">Du klarade det! 🎉</span>
              : <span className="bad">Slut på försök. Försök igen!</span>}
          </div>
        </div>
      )}

      {/* Nuvarande rad */}
      {!gameOver && (
        <div className="card current">
          <div className="row between">
            <div className="row">
              {current.map((idx, i) => (
                <div key={i} className="slot">
                  <Peg color={idx === null ? 'var(--slot-bg)' : COLORS[idx].value} onClick={() => placeColor(i)} />
                  <button className="clear" onClick={() => clearSlot(i)} title="Töm plats">×</button>
                </div>
              ))}
            </div>
            <div className="feedback">
              {Array.from({ length: settings.pegs }).map((_, i) => <FeedbackDot key={i} />)}
            </div>
          </div>
          <p className="muted small">Svarta = rätt färg på rätt plats. Vita = rätt färg, fel plats. Hint avslöjar 1 position men kostar 1 försök.</p>
        </div>
      )}

      {/* Historik */}
      <div className="history">
        {guesses.map((g, rowIdx) => (
          <div key={rowIdx} className="card row between history-row">
            <div className="row">
              <span className="muted w90">Försök {guesses.length - rowIdx}</span>
              <div className="row">
                {g.pegs.map((idx, i) => <Peg key={i} color={COLORS[idx].value} subdued />)}
              </div>
            </div>
            <div className="row">
              <div className="feedback">
                {Array.from({ length: g.black }).map((_, i) => <FeedbackDot key={'b'+i} type='black' />)}
                {Array.from({ length: g.white }).map((_, i) => <FeedbackDot key={'w'+i} type='white' />)}
                {Array.from({ length: (settings.pegs - g.black - g.white) }).map((_, i) => <FeedbackDot key={'e'+i} />)}
              </div>
              <span className="score"><b>{g.black}</b> sv • <b>{g.white}</b> vi</span>
            </div>
          </div>
        ))}
        {guesses.length === 0 && <p className="muted center">Inga gissningar ännu – gör din första ovan! ✨</p>}
      </div>

      <div className="footer">Regler: Välj {settings.pegs} pinnar i {settings.colorCount} färger{settings.allowDuplicates ? '' : ' (inga dubbletter)'} på högst {settings.maxTries} försök.</div>
    </div>
  )
}
