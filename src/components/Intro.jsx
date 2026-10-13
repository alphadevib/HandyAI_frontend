import { useEffect, useState } from 'react'
import { finishIntro, introPending } from '../intro'

const WORD = [...'HANDY.AI']
const COUNT_MS = 1900
const PART_MS = 1100

/**
 * The launch sequence a first-time visitor sees on the home page: the wordmark rises letter by
 * letter over a counter, then the stage splits like a curtain to reveal the storefront. It waits
 * for the fonts so the wide letters never flash in a fallback face.
 */
export default function Intro() {
  const [active] = useState(introPending)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState('count')

  useEffect(() => {
    if (!active) return undefined
    let frame = 0
    let start = 0
    let cancelled = false
    const ease = (t) => 1 - Math.pow(1 - t, 3)

    const tick = (now) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / COUNT_MS)
      setCount(Math.round(ease(t) * 100))
      if (t < 1) frame = requestAnimationFrame(tick)
      else setPhase('part')
    }
    // Start counting once the fonts are in, but never wait more than a moment for them.
    Promise.race([document.fonts?.ready, new Promise((resolve) => setTimeout(resolve, 600))]).then(
      () => !cancelled && (frame = requestAnimationFrame(tick)),
    )
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [active])

  useEffect(() => {
    if (phase !== 'part') return undefined
    // The storefront starts its own entrance while the curtains are still opening.
    const release = setTimeout(finishIntro, PART_MS * 0.35)
    const done = setTimeout(() => setPhase('done'), PART_MS)
    return () => {
      clearTimeout(release)
      clearTimeout(done)
    }
  }, [phase])

  useEffect(() => {
    if (!active || phase === 'done') return undefined
    const onKey = (event) => event.key === 'Escape' && setPhase('part')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, phase])

  if (!active || phase === 'done') return null

  return (
    <div className={`intro is-${phase}`} role="presentation">
      <div className="intro-curtain intro-curtain-top" />
      <div className="intro-curtain intro-curtain-bottom" />
      <div className="intro-stage" aria-hidden="true">
        <p className="intro-word">
          {WORD.map((letter, index) => (
            <span
              key={index}
              className={`intro-letter ${letter === '.' ? 'intro-dot' : ''}`}
              style={{ '--i': index }}
            >
              <span>{letter}</span>
            </span>
          ))}
        </p>
        <div className="intro-meter">
          <span className="intro-caption">The AI tools marketplace</span>
          <span className="intro-count">{String(count).padStart(3, '0')}</span>
        </div>
        <span className="intro-line" style={{ '--p': count / 100 }} />
      </div>
      <button type="button" className="intro-skip" onClick={() => setPhase('part')}>
        Skip intro
      </button>
    </div>
  )
}
