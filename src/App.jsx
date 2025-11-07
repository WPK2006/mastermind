import React, { useMemo, useState } from 'react'

const PEGS = 4
const COLORS = [
  { name: 'Röd', value: '#ef4444' },
  { name: 'Blå', value: '#3b82f6' },
  { name: 'Grön', value: '#22c55e' },
  { name: 'Gul', value: '#eab308' },
  { name: 'Lila', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
]
const MAX_TRIES = 10

function randomSecret () {
  return Array.from({ length: PEGS }, () => Math.floor(Math.random() * COLORS.length))
}

function scoreGuess (guess, secret) {
  const usedSecret = Array(PEGS).fill(false)
  const usedGuess = Array(PEGS).fill(false)
  let black = 0

  for (let i = 0; i < PEGS; i++) {
    if (guess[i] === secret[i]) {
      black++
      usedSecret[i] = true
      usedGuess[i] = true
    }
  }

  let white = 0
  for (let i = 0; i < PEGS; i++) {
    if (usedGuess[i]) continue
    for (let j = 0; j < PEGS; j++) {
      if (usedSecret[j]) continue
      if (guess[i] === secret[j]) {
        white++
        usedSecret[j] = true
        usedGuess[i] = true
        break
      }
    }
  }
  return { black, white }
}

function Peg ({ color, subdued=false, onClick }) {
  const className = 'peg' + (subdued ? ' subdued' : '')
  return <button className={className} style={{ background: color }} onClick={onClick} aria-label="Färg" />
}

function FeedbackDot ({ type }) {
  const cls = 'dot ' + (type || '')
  return <div className={cls} />
}

export default function App () {
  const [secret, setSecret] = useState(randomSecret)
  const [guesses, setGuesses] = useState([]) // { pegs:number[], black:number, white:number }
  const [current, setCurrent] = useState(Array(PEGS).fill(null))
  const [selected, setSelected] = useState(0)
  const [reveal, setReveal] = useState(false)

  const gameOver = useMemo(() => {
    if (guesses.some(g => g.black === PEGS)) return 'win'
    if (guesses.length >= MAX_TRIES) return 'lose'
    return null
  }, [guesses])

  function reset (newSecret=true) {
    setGuesses([])
    setCurrent(Array(PEGS).fill(null))
    setReveal(false)
    if (newSecret) setSecret(randomSecret())
  }

  function placeColor (index) {
    if (gameOver) return
    const next = current.slice()
    next[index] = selected
    setCurrent(next)
  }

  function clearSlot (index) {
    if (gameOver) return
    const next = current.slice()
    next[index] = null
    setCurrent(next)
  }

  function submitGuess () {
    if (gameOver) return
    if (current.some(c => c === null)) return
    const { black, white } = scoreGuess(current, secret)
    const g = { pegs: current, black, white }
    setGuesses(prev => [g, ...prev])
    setCurrent(Array(PEGS).fill(null))
  }

  function fillRowRandom () {
    if (gameOver) return
    setCurrent(Array.from({ length: PEGS }, () => Math.floor(Math.random() * COLORS.length)))
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Mastermind</h1>
        <div className="row">
          <button className="btn" onClick={() => setReveal(r => !r)}>{reveal ? 'Göm kod' : 'Visa kod'}</button>
          <button className="btn" onClick={() => reset(false)}>Rensa rad</button>
          <button className="btn primary" onClick={() => reset(true)}>Nytt spel</button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="status">
            <span className="muted">Försök kvar:</span>
            <strong>{Math.max(0, MAX_TRIES - guesses.length)}</strong>
          </div>

          <div>
            <span className="muted" style={{marginRight:8}}>Aktiv färg:</span>
            <div className="colors">
              {COLORS.map((c, i) => (
                <div key={i} style={{ position:'relative' }}>
                  <Peg color={c.value} subdued={i !== selected} onClick={() => setSelected(i)} />
                  {i === selected && (
                    <div style={{ position:'absolute', inset:-4, border:'2px solid #94a3b8', borderRadius:'999px' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="row">
            <button className="btn" onClick={fillRowRandom}>Fyll slumpmässigt</button>
            <button className="btn primary" onClick={submitGuess} disabled={current.some(c => c === null)}>Gissa</button>
          </div>
        </div>
      </div>

      {(reveal || gameOver) && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="secret">
            <span className="muted">Hemlig kod:</span>
            <div className="row">
              {secret.map((idx, i) => <Peg key={i} color={COLORS[idx].value} />)}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {gameOver === 'win' && <span style={{ color:'#16a34a', fontWeight:600 }}>Du klarade det! 🎉</span>}
              {gameOver === 'lose' && <span style={{ color:'#dc2626', fontWeight:600 }}>Slut på försök. Försök igen!</span>}
            </div>
          </div>
        </div>
      )}

      {!gameOver && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent:'space-between' }}>
            <div className="row">
              {current.map((idx, i) => (
                <div key={i} className="slot">
                  <Peg color={idx === null ? '#fff' : COLORS[idx].value} onClick={() => placeColor(i)} />
                  <button className="clear-btn" onClick={() => clearSlot(i)} title="Töm plats">×</button>
                </div>
              ))}
            </div>
            <div className="feedback">
              {Array.from({ length: PEGS }).map((_, i) => <FeedbackDot key={i} />)}
            </div>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>Svarta prickar = rätt färg & rätt plats. Vita prickar = rätt färg, fel plats.</p>
        </div>
      )}

      <div className="history">
        {guesses.map((g, rowIdx) => (
          <div key={rowIdx} className="card">
            <div className="row" style={{ justifyContent:'space-between' }}>
              <div className="row">
                <span className="muted" style={{ width: 80 }}>Försök {guesses.length - rowIdx}</span>
                <div className="row">
                  {g.pegs.map((idx, i) => <Peg key={i} color={COLORS[idx].value} subdued />)}
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <div className="feedback">
                  {Array.from({ length: g.black }).map((_, i) => <FeedbackDot key={'b'+i} type='black' />)}
                  {Array.from({ length: g.white }).map((_, i) => <FeedbackDot key={'w'+i} type='white' />)}
                  {Array.from({ length: (PEGS - g.black - g.white) }).map((_, i) => <FeedbackDot key={'e'+i} />)}
                </div>
                <span><strong>{g.black}</strong> svarta • <strong>{g.white}</strong> vita</span>
              </div>
            </div>
          </div>
        ))}
        {guesses.length === 0 && <p className="muted" style={{ textAlign:'center' }}>Inga gissningar ännu – gör din första ovan! ✨</p>}
      </div>

      <div className="footer">
        Regler: Datorn väljer en hemlig kod med {PEGS} pinnar i {COLORS.length} färger (dubbletter kan förekomma). Du har {MAX_TRIES} försök.
      </div>
    </div>
  )
}
