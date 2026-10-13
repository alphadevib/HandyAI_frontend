import { BrandMark, Wordmark } from './Brand'
import { openSuggestions } from './SuggestionDialog'
import { Link } from '../router'

/* global __APP_BUILD__ */

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['/marketplace', 'The full shelf'],
      ['/marketplace?freePlan=true', 'Free to start'],
      ['/marketplace?sort=rating', 'Best rated'],
      ['/categories', 'Every aisle'],
    ],
  },
  {
    title: 'Your account',
    links: [
      ['/profile', 'Profile & saved tools'],
      ['/subscriptions', 'My stack'],
      ['/signup', 'Join free'],
    ],
  },
  {
    title: 'Help',
    links: [['/chat', 'Ask the concierge']],
  },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <p className="footer-wordmark" aria-hidden="true">
        HANDYAI
      </p>
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand">
            <BrandMark size={32} />
            <Wordmark />
          </span>
          <p className="footer-note">
            The AI tools store that shows its prices. Compare, choose and keep every subscription
            in check.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} className="footer-col" aria-label={column.title}>
            <h3>{column.title}</h3>
            {column.links.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
            {column.title === 'Help' && (
              <button type="button" className="footer-link-button" onClick={openSuggestions}>
                Suggest a feature
              </button>
            )}
          </nav>
        ))}
      </div>
      <p className="footer-copy">
        <span>
          HandyAI © {new Date().getFullYear()} · v{__APP_BUILD__.version}
          <span className="footer-credit">
            © {new Date().getFullYear()} ikhlas.in creations. All rights reserved.
          </span>
        </span>
        <span>
          Prices are indicative list prices of each tool&apos;s entry plan; rupee amounts use a fixed
          rate. You buy on the maker&apos;s own website.
        </span>
      </p>
    </footer>
  )
}
