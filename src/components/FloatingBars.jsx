import { Link, useRoute } from '../router'
import CurrencySwitch from './CurrencySwitch'
import { Icon } from './Icons'
import ThemeToggle from './ThemeToggle'

const RAIL = [
  { to: '/', label: 'Home', icon: 'home', exact: true },
  { to: '/marketplace', label: 'Shop all tools', short: 'Shop', icon: 'bag' },
  { to: '/categories', label: 'Browse aisles', short: 'Aisles', icon: 'grid' },
  { to: '/chat', label: 'Ask the concierge', short: 'Concierge', icon: 'chat' },
]

/**
 * The site's navigation, docked to the right edge on wide screens and to the bottom on phones.
 * A lime blob slides to the current section; on the rail, each label slides out on hover. Price
 * currency and the theme live at the foot of the rail (in the header on phones).
 */
export default function FloatingBars() {
  const path = useRoute()
  const active = RAIL.findIndex((item) => (item.exact ? path === item.to : path.startsWith(item.to)))

  return (
    <nav className="rail" aria-label="Main">
      <div className="rail-links" style={{ '--active': active }}>
        {active >= 0 && <span className="rail-blob" aria-hidden="true" />}
        {RAIL.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className={`rail-link ${index === active ? 'is-active' : ''}`}
            aria-current={index === active ? 'page' : undefined}
          >
            <Icon name={item.icon} size={20} />
            <span className="rail-label">{item.label}</span>
            <span className="rail-short" aria-hidden="true">
              {item.short ?? item.label}
            </span>
          </Link>
        ))}
      </div>
      <div className="rail-prefs">
        <CurrencySwitch vertical />
        <ThemeToggle />
      </div>
    </nav>
  )
}
