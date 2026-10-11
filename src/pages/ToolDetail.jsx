import { useCallback, useEffect, useState } from 'react'
import { api, vendorLink } from '../api/client'
import { visitorId } from '../visitor'
import { CategoryIcon, Icon } from '../components/Icons'
import Message from '../components/Message'
import Spinner from '../components/Spinner'
import SubscribeForm from '../components/SubscribeForm'
import ToolLogo from '../components/ToolLogo'
import { Stars } from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import { usePrefs } from '../context/PrefsContext'
import { useFavoriteToggle } from '../hooks'
import { CYCLES, annualSaving, cycleOf, formatMoney, moneyIn, planKey } from '../format'
import { Link, goToSignIn } from '../router'
import NotFound from './NotFound'

export default function ToolDetail({ slug }) {
  const { user, isAuthenticated } = useAuth()
  const { currency, cycle, setCycle } = usePrefs()
  const [tool, setTool] = useState(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState([])
  const [subscribing, setSubscribing] = useState(false)
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState('details')

  // The router mounts a fresh page per slug, so there is no previous tool to clear here; this
  // only reloads when signing in or out changes the saved flag.
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([api.tool(slug, controller.signal), api.reviews(slug, controller.signal)])
      .then(([toolResult, reviewResult]) => {
        setTool(toolResult)
        setReviews(reviewResult)
      })
      .catch((loadError) => {
        if (loadError.name === 'AbortError') return
        if (loadError.status === 404) setMissing(true)
        else setError(loadError.message)
      })
    return () => controller.abort()
  }, [slug, isAuthenticated])

  const apply = useCallback((update) => setTool((current) => (current ? update(current) : current)), [])
  const favorites = useFavoriteToggle(apply)

  if (missing) return <NotFound />
  if (!tool) return error ? <Message>{error}</Message> : <Spinner label="Loading tool" />

  const saving = annualSaving(tool)
  const startSubscribing = () => {
    if (!isAuthenticated) {
      goToSignIn(`Sign in to add ${tool.name} to your subscriptions.`)
      return
    }
    setSubscribing(true)
    setNotice('')
  }

  const plan = tool.plans?.paidPlanAvailable ? moneyIn(tool.plans[planKey(cycle)], currency) : null
  const monthly = moneyIn(tool.plans?.monthly, currency)
  const fullPrice = monthly ? monthly * cycleOf(cycle).months : null
  const discounted = cycle === 'ANNUAL' && saving > 0

  return (
    <article className="page tool-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <Icon name="chevron-right" size={14} />
        <Link to={`/marketplace?category=${tool.categorySlug}`}>{tool.categoryName}</Link>
        <Icon name="chevron-right" size={14} />
        <span>{tool.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-stage">
            <span className="pdp-glow" aria-hidden="true" />
            <ToolLogo tool={tool} size={128} />
          </div>
          <div className="pdp-thumbs" aria-hidden="true">
            <span className="pdp-thumb">
              <CategoryIcon slug={tool.categorySlug} size={22} />
            </span>
            {tool.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="pdp-thumb">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="pdp-info">
          <p className="product-category">{tool.categoryName}</p>
          <h1>{tool.name}</h1>
          <Stars rating={tool.rating} count={tool.ratingCount} />

          <p className="pdp-price">
            {plan !== null ? (
              <>
                <strong>{formatMoney(plan, currency)}</strong>
                <span className="per">{cycleOf(cycle).short}</span>
                {discounted && fullPrice ? <s>{formatMoney(fullPrice, currency)}</s> : null}
                {discounted && <span className="badge badge-sale">-{saving}%</span>}
              </>
            ) : (
              <strong>Free</strong>
            )}
          </p>
          <p className="pdp-tagline">{tool.tagline}</p>

          {tool.plans?.paidPlanAvailable && (
            <fieldset className="option-group">
              <legend>Billing</legend>
              <div className="option-pills">
                {CYCLES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`option-pill ${cycle === option.value ? 'is-active' : ''}`}
                    aria-pressed={cycle === option.value}
                    onClick={() => setCycle(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <p className="pdp-note">
            {tool.hasFreePlan && (
              <>
                <Icon name="check" size={16} /> Free plan to start with.{' '}
              </>
            )}
            {tool.priceNote ? `${tool.priceNote}. ` : ''}Indicative prices; the maker&apos;s site has
            the final word.
          </p>

          <div className="pdp-actions">
            <a
              className="btn btn-primary btn-lg"
              href={vendorLink(tool.slug, 'detail', visitorId())}
              target="_blank"
              rel="noreferrer noopener"
            >
              Take me to {tool.name} <Icon name="arrow" size={18} />
            </a>
            <button
              type="button"
              className={`icon-btn pdp-heart ${tool.favorite ? 'is-active' : ''}`}
              onClick={() => favorites.toggle(tool)}
              disabled={favorites.busySlug === tool.slug}
              aria-pressed={tool.favorite}
              title={tool.favorite ? 'Saved for later' : 'Save for later'}
            >
              <Icon name="heart" size={20} />
              <span className="sr-only">{tool.favorite ? 'Remove from saved' : 'Save for later'}</span>
            </button>
          </div>
          <button type="button" className="btn btn-secondary btn-block" onClick={startSubscribing}>
            <Icon name="layers" size={18} /> I already pay for this: add to my stack
          </button>
          <p className="fine-print">You will finish on {new URL(tool.websiteUrl).hostname}</p>

          <Message>{favorites.error}</Message>
          <Message tone="success">{notice}</Message>
          {subscribing && (
            <div className="subscribe-box">
              <h3>Add to my stack</h3>
              <SubscribeForm
                tool={tool}
                onCancel={() => setSubscribing(false)}
                onDone={() => {
                  setSubscribing(false)
                  setNotice(`${tool.name} is on your receipt now.`)
                }}
              />
            </div>
          )}
          {notice && (
            <Link to="/subscriptions" className="text-link">
              See my stack
            </Link>
          )}
        </div>
      </div>

      <div className="pdp-tabs" role="tablist" aria-label="About this tool">
        {[
          ['details', 'The details'],
          ['reviews', `Reviews (${reviews.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            className={tab === key ? 'is-active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'details' ? (
        <section className="panel pdp-panel" role="tabpanel" id="panel-details" aria-labelledby="tab-details">
          <h2>What {tool.name} is good at</h2>
          <p>{tool.description}</p>
          <div className="tag-list">
            {tool.tags.map((tag) => (
              <Link key={tag} to={`/marketplace?q=${encodeURIComponent(tag)}`} className="chip">
                #{tag}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews">
          <Reviews tool={tool} reviews={reviews} setReviews={setReviews} user={user} />
        </div>
      )}
    </article>
  )
}

function Reviews({ tool, reviews, setReviews, user }) {
  const mine = user ? reviews.find((review) => review.userId === user.id) : null
  const [rating, setRating] = useState(mine?.rating ?? 5)
  const [comment, setComment] = useState(mine?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await api.saveReview(tool.slug, { rating, comment })
      setReviews((current) => [saved, ...current.filter((review) => review.id !== saved.id)])
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await api.deleteReview(tool.slug, mine.id)
      setReviews((current) => current.filter((review) => review.id !== mine.id))
      setComment('')
      setRating(5)
    } catch (removeError) {
      setError(removeError.message)
    }
  }

  return (
    <section className="panel">
      <h2>What people say</h2>
      {user ? (
        <form className="review-form" onSubmit={submit}>
          <div className="star-input" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                className={value <= rating ? 'is-on' : ''}
                onClick={() => setRating(value)}
              >
                ★<span className="sr-only">{value} stars</span>
              </button>
            ))}
          </div>
          <label className="field">
            <span className="sr-only">Your review</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={`Where does ${tool.name} shine, and where does it stumble?`}
            />
          </label>
          <Message>{error}</Message>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {mine ? 'Update review' : 'Post review'}
            </button>
            {mine && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={remove}>
                Delete my review
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="muted">
          <button type="button" className="text-link" onClick={() => goToSignIn('Sign in to review tools.')}>
            Sign in
          </button>{' '}
          to rate {tool.name}.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="muted">No reviews yet. Be the first to call it.</p>
      ) : (
        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.id}>
              <p className="review-head">
                <strong>{review.userName}</strong>
                <span className="stars" aria-label={`${review.rating} out of 5`}>
                  {'★'.repeat(review.rating)}
                  <span className="stars-off">{'★'.repeat(5 - review.rating)}</span>
                </span>
              </p>
              {review.comment && <p>{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
