import { vendorLink } from '../api/client'
import { usePrefs } from '../context/PrefsContext'
import { visitorId } from '../visitor'
import { PRICING_LABELS, annualSaving, formatMoney, moneyIn, priceLabel } from '../format'
import { Link } from '../router'
import { Icon } from './Icons'
import ToolLogo from './ToolLogo'

/** Five stars filled to the rating, like a shop listing; "New on the shelf" before any reviews. */
export function Stars({ rating, count }) {
  if (!count) return <span className="stars-new">New on the shelf</span>
  return (
    <span className="stars-row">
      <span className="stars-meter" style={{ '--fill': `${(rating / 5) * 100}%` }} aria-hidden="true">
        ★★★★★
      </span>
      <span className="stars-text">
        {rating}
        <span>/5</span>
      </span>
      <span className="sr-only">Rated {rating} out of 5</span>
    </span>
  )
}

/**
 * A storefront listing: the logo on a large tile, a discount badge when the annual plan saves,
 * a save heart and a "try it" button that rises out of the tile on hover. Guests see the same card
 * as members, priced in their chosen currency and billing cycle.
 */
export default function ProductCard({
  tool,
  reasons,
  matchScore,
  onToggleFavorite,
  busy,
  compact,
  source = 'card',
}) {
  const { currency, cycle } = usePrefs()
  const price = priceLabel(tool, currency, cycle)
  const saving = annualSaving(tool)
  const showSaving = cycle === 'ANNUAL' && saving > 0
  const monthly = moneyIn(tool.plans?.monthly, currency)
  const href = vendorLink(tool.slug, source, visitorId())

  return (
    <article className={`product-card ${compact ? 'is-compact' : ''}`}>
      <div className="product-media">
        {showSaving ? (
          <span className="badge badge-sale">-{saving}%</span>
        ) : (
          tool.hasFreePlan && <span className="badge">{PRICING_LABELS[tool.pricingModel] ?? 'Free plan'}</span>
        )}
        <span className="product-logo">
          <ToolLogo tool={tool} size={compact ? 64 : 76} />
        </span>
        {onToggleFavorite && (
          <button
            type="button"
            className={`icon-btn save-btn ${tool.favorite ? 'is-active' : ''}`}
            onClick={() => onToggleFavorite(tool)}
            disabled={busy}
            aria-pressed={tool.favorite}
            title={tool.favorite ? 'Saved for later' : 'Save for later'}
          >
            <Icon name="heart" size={18} />
            <span className="sr-only">
              {tool.favorite ? 'Remove' : 'Save'} {tool.name}
            </span>
          </button>
        )}
        <a className="product-quick" href={href} target="_blank" rel="noreferrer noopener">
          {tool.hasFreePlan ? 'Try it free' : 'Get it'} <Icon name="arrow" size={16} />
        </a>
      </div>

      <div className="product-body">
        <p className="product-category">{tool.categoryName}</p>
        <h3>
          <Link to={`/tools/${tool.slug}`} className="stretched">
            {tool.name}
          </Link>
        </h3>
        <Stars rating={tool.rating} count={tool.ratingCount} />
        {!compact && <p className="product-tagline">{tool.tagline}</p>}

        {typeof matchScore === 'number' && (
          <p className="match-line">
            <span className="match-score">{matchScore}% match</span>
            {reasons?.[0] && <span className="match-reason">{reasons[0]}</span>}
          </p>
        )}

        <p className="product-price">
          {price ? (
            <>
              <strong>{price}</strong>
              {showSaving && monthly ? <s>{formatMoney(monthly * 12, currency)}</s> : null}
            </>
          ) : (
            <span className="price-from">Price on the maker&apos;s site</span>
          )}
        </p>
      </div>
    </article>
  )
}
