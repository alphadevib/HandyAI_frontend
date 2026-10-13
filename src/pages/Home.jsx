import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { CategoryIcon, Icon } from '../components/Icons'
import Message from '../components/Message'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import ToolLogo from '../components/ToolLogo'
import { useAuth } from '../context/AuthContext'
import { usePrefs } from '../context/PrefsContext'
import { useFavoriteToggle } from '../hooks'
import { Link, navigate } from '../router'

const STEPS = [
  {
    title: 'Line them up',
    text: 'Monthly, quarterly and annual plans side by side, in rupees or dollars. No “contact sales” maze.',
  },
  {
    title: 'Say what you need',
    text: 'Describe the job out loud or in a sentence. The concierge narrows thirty-nine tools down to four.',
  },
  {
    title: 'Keep the receipts',
    text: 'Log what you pay for and see every renewal coming before it quietly charges your card.',
  },
]

/** The giant wordmark behind the hero, one span per letter so the letters can rise in turn. */
const HERO_WORD = [...'HANDYAI']

/** The pitch, lit word by word as it scrolls past (see .scrub in effects.js). */
const STATEMENT =
  'The AI tools store that shows its prices. Compare, choose and keep every subscription in check.'.split(' ')

/** A four-pointed sparkle, like the stars scattered around a storefront hero. */
function Sparkle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z" />
    </svg>
  )
}

/** Thin spokes turning slowly behind the concierge band, like a wheel at speed. */
function Wheel() {
  const spokes = Array.from({ length: 36 }, (_, index) => index * 10)
  return (
    <svg className="band-wheel" viewBox="-100 -100 200 200" aria-hidden="true">
      <circle r="96" />
      <circle r="88" />
      <circle r="10" />
      {spokes.map((angle) => (
        <line key={angle} x1="0" y1="-10" x2="0" y2="-88" transform={`rotate(${angle} 0 0) rotate(8 0 -10)`} />
      ))}
    </svg>
  )
}

/** The storefront: hero, best sellers, free picks, aisles and the concierge. */
export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const { currency } = usePrefs()
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [trending, setTrending] = useState([])
  const [freeTools, setFreeTools] = useState([])
  const [forYou, setForYou] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [job, setJob] = useState('')

  // Each shelf fills in as soon as its own data arrives, so one slow request holds up nothing.
  useEffect(() => {
    const controller = new AbortController()
    const fail = (loadError) => {
      if (loadError.name !== 'AbortError') setError(loadError.message)
    }
    api.stats(controller.signal).then(setStats).catch(fail)
    api.categories(controller.signal).then(setCategories).catch(fail)
    api
      .tools({ freePlan: true, size: 4, sort: 'popular' }, controller.signal)
      .then((result) => setFreeTools(result.content))
      .catch(fail)
    api
      .trending(12, controller.signal)
      .then(setTrending)
      .catch(fail)
      .finally(() => !controller.signal.aborted && setLoading(false))
    return () => controller.abort()
  }, [isAuthenticated])

  const profession = user?.profession
  useEffect(() => {
    if (!profession) return undefined
    const controller = new AbortController()
    api
      .recommend({ profession, limit: 4 }, controller.signal)
      .then((result) => setForYou(result.recommendations))
      .catch(() => setForYou([]))
    return () => controller.abort()
  }, [profession])

  const applyEverywhere = useCallback((update) => {
    setTrending((items) => items.map(update))
    setFreeTools((items) => items.map(update))
    setForYou((items) => items?.map((entry) => ({ ...entry, tool: update(entry.tool) })))
  }, [])
  const favorites = useFavoriteToggle(applyEverywhere)

  const askConcierge = (event) => {
    event.preventDefault()
    const text = job.trim()
    navigate(text ? `/chat?q=${encodeURIComponent(text)}` : '/chat')
  }

  const stack = trending.slice(0, 3)
  const featuredAisles = [...categories].sort((a, b) => b.toolCount - a.toolCount).slice(0, 4)
  const otherAisles = categories.filter((item) => !featuredAisles.includes(item))

  return (
    <>
      <section className="shop-hero">
        <p className="hero-wordmark" aria-hidden="true">
          {HERO_WORD.map((letter, index) => (
            <span key={index} style={{ '--i': index }}>
              {letter}
            </span>
          ))}
        </p>

        <div className="shop-hero-art" aria-hidden="true">
          <Sparkle className="sparkle sparkle-lg" />
          <Sparkle className="sparkle sparkle-sm" />
          <div className="tile-stack">
            {(stack.length ? stack : [null, null, null]).map((tool, index) => (
              <span key={tool?.slug ?? index} className="stack-tile" style={{ '--i': index }}>
                {tool ? (
                  <>
                    <ToolLogo tool={tool} size={96} />
                    <span className="stack-name">{tool.name}</span>
                  </>
                ) : (
                  <span className="stack-skeleton" />
                )}
              </span>
            ))}
          </div>
          <span className="price-chip">
            <small>Plans from</small> {currency === 'USD' ? '$0' : '₹0'}
            <small>/mo</small>
          </span>
        </div>

        <div className="shop-hero-copy">
          <h1>
            Find the AI that works <span className="hero-outline">the way</span> you do
          </h1>
          <p className="lede">
            Every tool priced side by side, sorted by the work it does and matched to your
            profession. Shop smart, subscribe once, and stop paying for the ones you forgot.
          </p>
          <div className="hero-actions">
            <Link to="/marketplace" className="btn btn-primary btn-lg">
              Start shopping <Icon name="arrow" size={18} />
            </Link>
            <Link to="/chat" className="btn btn-secondary btn-lg">
              Describe a task
            </Link>
          </div>
        </div>

        <dl className="hero-stats">
          <div>
            <dt>{stats?.toolCount ?? '39'}+</dt>
            <dd>Tools on the shelf</dd>
          </div>
          <div>
            <dt>{stats?.categoryCount ?? '13'}</dt>
            <dd>Aisles to browse</dd>
          </div>
          <div>
            <dt>3</dt>
            <dd>Ways to pay, compared</dd>
          </div>
        </dl>
      </section>

      <div className="brand-strip" aria-hidden="true">
        <div className="brand-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="brand-group">
              {(trending.length ? trending : [{ slug: 'x', name: 'HandyAI' }]).map((tool) => (
                <span key={`${copy}-${tool.slug}`} className="brand-name">
                  {tool.name}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="statement">
        <p className="statement-text scrub" style={{ '--n': STATEMENT.length }}>
          {STATEMENT.map((word, index) => (
            <span key={index} style={{ '--i': index }}>
              {word}{' '}
            </span>
          ))}
        </p>
        <figure className="statement-frame">
          <div className="statement-logos">
            {(trending.length ? trending.slice(0, 9) : Array.from({ length: 9 }, () => null)).map(
              (tool, index) =>
                tool ? (
                  <Link key={tool.slug} to={`/tools/${tool.slug}`} className="statement-logo" title={tool.name}>
                    <ToolLogo tool={tool} size={64} />
                  </Link>
                ) : (
                  <span key={index} className="statement-logo">
                    <span className="stack-skeleton" />
                  </span>
                ),
            )}
          </div>
          <figcaption>Thirty-nine AI tools, one honest price tag each.</figcaption>
        </figure>
      </section>

      <Message>{error || favorites.error}</Message>

      {isAuthenticated && profession && (
        <section className="shelf">
          <header className="shelf-head">
            <h2>Picked for a {profession.toLowerCase()}</h2>
            <p>Tools that earn their keep in your kind of work.</p>
          </header>
          {forYou === null ? (
            <Spinner label="Matching tools to your work" />
          ) : (
            <div className="product-grid">
              {forYou.map((entry) => (
                <ProductCard
                  key={entry.tool.slug}
                  tool={entry.tool}
                  reasons={entry.reasons}
                  busy={favorites.busySlug === entry.tool.slug}
                  onToggleFavorite={favorites.toggle}
                />
              ))}
            </div>
          )}
          <div className="shelf-foot">
            <Link to="/profile" className="btn btn-secondary">
              Change my profession
            </Link>
          </div>
        </section>
      )}

      <section className="shelf">
        <header className="shelf-head">
          <h2>What everyone&apos;s adding</h2>
          <p>The tools people open most, this week.</p>
        </header>
        {loading ? (
          <Spinner label="Stocking the shelf" />
        ) : (
          <div className="product-grid">
            {trending.slice(0, 4).map((tool) => (
              <ProductCard
                key={tool.slug}
                tool={tool}
                busy={favorites.busySlug === tool.slug}
                onToggleFavorite={favorites.toggle}
              />
            ))}
          </div>
        )}
        <div className="shelf-foot">
          <Link to="/marketplace" className="btn btn-secondary">
            View all tools
          </Link>
        </div>
      </section>

      {freeTools.length > 0 && (
        <section className="shelf">
          <header className="shelf-head">
            <h2>Free to start, hard to quit</h2>
            <p>Popular tools you can try without a card.</p>
          </header>
          <div className="product-grid">
            {freeTools.map((tool) => (
              <ProductCard
                key={tool.slug}
                tool={tool}
                busy={favorites.busySlug === tool.slug}
                onToggleFavorite={favorites.toggle}
              />
            ))}
          </div>
          <div className="shelf-foot">
            <Link to="/marketplace?freePlan=true" className="btn btn-secondary">
              View all free tools
            </Link>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="aisles">
          <h2>Shop by the job</h2>
          <div className="bento">
            {featuredAisles.map((category, index) => (
              <Link
                key={category.slug}
                to={`/marketplace?category=${category.slug}`}
                className={`bento-tile ${index === 1 || index === 2 ? 'is-wide' : ''}`}
              >
                <span className="bento-name">{category.name}</span>
                <span className="bento-count">{category.toolCount} tools</span>
                <span className="bento-icon">
                  <CategoryIcon slug={category.slug} size={120} />
                </span>
                <span className="bento-go">
                  <Icon name="arrow" size={18} />
                </span>
              </Link>
            ))}
          </div>
          <div className="aisle-chips">
            {otherAisles.map((category) => (
              <Link key={category.slug} to={`/marketplace?category=${category.slug}`} className="chip">
                <CategoryIcon slug={category.slug} size={16} /> {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="steps">
        <h2>Three moves to a leaner stack</h2>
        <ol>
          {STEPS.map((step, index) => (
            <li key={step.title} className="step">
              <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="concierge-band">
        <Wheel />
        <h2>Can&apos;t name the tool? Name the job.</h2>
        <form className="concierge-form" onSubmit={askConcierge}>
          <label htmlFor="concierge-job" className="sr-only">
            Describe what you want to get done
          </label>
          <span className="concierge-input">
            <Icon name="spark" size={18} />
            <input
              id="concierge-job"
              value={job}
              onChange={(event) => setJob(event.target.value)}
              placeholder="e.g. turn my podcast into short clips"
            />
          </span>
          <button type="submit" className="btn btn-dark">
            Find my tool
          </button>
        </form>
      </section>
    </>
  )
}
