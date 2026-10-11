import { useEffect, useRef, useState } from 'react'
import { vendorLink } from '../api/client'
import { usePrefs } from '../context/PrefsContext'
import { PRICING_LABELS, cycleOf, formatMoney, moneyIn, planKey } from '../format'
import { Link } from '../router'
import { visitorId } from '../visitor'
import { Icon } from './Icons'
import ToolLogo from './ToolLogo'

const SLIDES = 5
const SWIPE_PX = 50

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Splits a name into a red and a white half, at the space nearest the middle if it has one. */
function splitName(name) {
  const middle = name.length / 2
  let best = -1
  for (let index = name.indexOf(' '); index !== -1; index = name.indexOf(' ', index + 1)) {
    if (best === -1 || Math.abs(index - middle) < Math.abs(best - middle)) best = index
  }
  const cut = best > 0 ? best : Math.ceil(middle)
  return [name.slice(0, cut), name.slice(cut)]
}

/** One span per letter, so the headline can cascade in letter by letter. */
function Letters({ text, offset = 0 }) {
  return [...text].map((letter, index) => (
    <span key={index} className="spot-letter" style={{ '--i': index + offset }}>
      {letter === ' ' ? ' ' : letter}
    </span>
  ))
}

/** Counts up to the target whenever the slide changes; jumps straight there for reduced motion. */
function useCountUp(target, replayKey) {
  const [value, setValue] = useState(target ?? 0)
  useEffect(() => {
    if (target === null || target === undefined || prefersReducedMotion()) return undefined
    let frame
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 900)
      setValue(target * (1 - (1 - progress) ** 3))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, replayKey])
  return prefersReducedMotion() ? target : value
}

/**
 * The home hero, laid out like a sneaker launch: the trending tool's name in giant split type,
 * its tile floating over the middle of the name, the price on the right, a "choose a tool"
 * picker, a vertical pager and a thin progress line that advances the carousel.
 */
export default function HeroSpotlight({ tools }) {
  const { currency, cycle } = usePrefs()
  const slides = tools.slice(0, SLIDES)
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const cardRef = useRef(null)
  const touchX = useRef(null)

  const current = count ? index % count : 0
  const tool = slides[current]
  const go = (next) => count && setIndex(((next % count) + count) % count)

  const amount = tool?.plans?.paidPlanAvailable ? moneyIn(tool.plans[planKey(cycle)], currency) : null
  const shown = useCountUp(amount, `${tool?.slug}-${currency}-${cycle}`)

  // Pointer parallax: the tile, the ghost word and the lines drift at different depths.
  useEffect(() => {
    const card = cardRef.current
    if (!card || prefersReducedMotion()) return undefined
    const move = (event) => {
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--px', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3))
      card.style.setProperty('--py', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3))
    }
    const reset = () => {
      card.style.setProperty('--px', '0')
      card.style.setProperty('--py', '0')
    }
    card.addEventListener('pointermove', move)
    card.addEventListener('pointerleave', reset)
    return () => {
      card.removeEventListener('pointermove', move)
      card.removeEventListener('pointerleave', reset)
    }
  }, [])

  if (!tool) {
    return (
      <section className="spotlight is-loading" aria-busy="true" aria-label="Loading trending tools">
        <span className="spot-ghost" aria-hidden="true">HandyAI</span>
        <div className="spot-skeleton" />
      </section>
    )
  }

  const [left, right] = splitName(tool.name)
  const price = tool.plans?.paidPlanAvailable
    ? formatMoney(currency === 'INR' ? Math.round(shown) : Math.round(shown * 100) / 100, currency)
    : tool.hasFreePlan || tool.pricingModel === 'FREE'
      ? 'Free'
      : '—'

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') go(current + 1)
    if (event.key === 'ArrowLeft') go(current - 1)
  }

  return (
    <section
      ref={cardRef}
      className="spotlight"
      aria-roledescription="carousel"
      aria-label="Trending AI tools"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setPaused(false)}
      onTouchStart={(event) => (touchX.current = event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (touchX.current === null) return
        const dx = event.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > SWIPE_PX) go(current + (dx < 0 ? 1 : -1))
        touchX.current = null
      }}
    >
      <span className="spot-ghost" aria-hidden="true">HandyAI</span>
      <svg className="spot-lines" viewBox="0 0 1200 640" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="1" d="M-40 520C220 330 430 690 690 470S1010 120 1240 260" />
        <path pathLength="1" d="M-60 140c260 110 420-90 650 30s420 330 650 120" />
        <path pathLength="1" d="M120 680c120-210 340-300 560-220s380 40 560-160" />
      </svg>

      <h1 className="spot-heading">
        Every AI tool, <span>matched to you</span>
      </h1>

      {/* Keyed by tool, so every slide change replays the entrance animations. */}
      <div className="spot-stage" key={tool.slug} aria-live={paused ? 'polite' : 'off'}>
        <p className="spot-kicker">
          No.&nbsp;{String(current + 1).padStart(2, '0')} <span>Trending</span>
        </p>

        <p className="spot-title" style={{ '--len': Math.max(tool.name.length, 5) }}>
          <span className="sr-only">
            Slide {current + 1} of {count}: {tool.name}
          </span>
          <span className="spot-left" aria-hidden="true">
            <Letters text={left} />
          </span>
          <span className="spot-right" aria-hidden="true">
            <Letters text={right} offset={left.length} />
          </span>
        </p>

        <p className="spot-sub">{tool.categoryName}</p>

        <div className="spot-product" aria-hidden="true">
          <span className="spot-disc" />
          <span className="spot-float">
            <span className="spot-tile">
              <ToolLogo tool={tool} size={128} />
            </span>
          </span>
          <span className="spot-shadow" />
        </div>

        <div className="spot-price">
          <span className="spot-tag">{tool.hasFreePlan ? 'Free plan' : 'Hot'}</span>
          <p className="spot-amount">
            <strong>{price}</strong>
            {amount !== null && <span>{cycleOf(cycle).short}</span>}
          </p>
          <p className="spot-name">
            <span>{tool.name}</span>
            <span>{tool.rating > 0 ? `★ ${tool.rating} rated` : PRICING_LABELS[tool.pricingModel]}</span>
          </p>
        </div>

        <div className="spot-why">
          <h3>Why it&apos;s here</h3>
          <p>{tool.tagline}</p>
        </div>
      </div>

      <div className="spot-actions">
        <a
          className="btn btn-lg spot-btn-solid"
          href={vendorLink(tool.slug, 'hero', visitorId())}
          target="_blank"
          rel="noreferrer noopener"
        >
          {tool.hasFreePlan ? 'Try it now' : 'Buy now'}
        </a>
        <Link to={`/tools/${tool.slug}`} className="btn btn-lg spot-btn-outline">
          View details <Icon name="external" size={16} />
        </Link>
      </div>

      <div className="spot-picker" role="group" aria-label="Choose a tool">
        <span className="spot-picker-label">Choose a tool:</span>
        <div className="spot-picker-row">
          {slides.map((item, itemIndex) => (
            <button
              key={item.slug}
              type="button"
              className={`spot-pick ${itemIndex === current ? 'is-active' : ''}`}
              aria-pressed={itemIndex === current}
              aria-label={`Show ${item.name}`}
              onClick={() => go(itemIndex)}
            >
              <ToolLogo tool={item} size={36} />
            </button>
          ))}
        </div>
      </div>

      <div className="spot-dots" role="group" aria-label="Slides">
        {slides.map((item, itemIndex) => (
          <button
            key={item.slug}
            type="button"
            className={itemIndex === current ? 'is-active' : ''}
            aria-label={`Slide ${itemIndex + 1}: ${item.name}`}
            aria-current={itemIndex === current ? 'true' : undefined}
            onClick={() => go(itemIndex)}
          />
        ))}
      </div>

      {count > 1 && (
        <span className="spot-progress" aria-hidden="true">
          {/* The bar's animation is the autoplay timer: it pauses on hover and advances on end. */}
          <span
            key={`${tool.slug}-${current}`}
            className={paused ? 'is-paused' : ''}
            onAnimationEnd={() => !prefersReducedMotion() && go(current + 1)}
          />
        </span>
      )}
    </section>
  )
}
