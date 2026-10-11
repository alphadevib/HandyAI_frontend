import { usePrefs } from '../context/PrefsContext'

/** ₹ / $ toggle with a sliding thumb. Used in the side rail and, on phones, in the header. */
export default function CurrencySwitch({ vertical = false }) {
  const { currency, setCurrency } = usePrefs()
  return (
    <div
      className={`currency-switch ${vertical ? 'is-vertical' : ''}`}
      role="group"
      aria-label="Show prices in"
      style={{ '--on': currency === 'USD' ? 1 : 0 }}
    >
      <span className="currency-thumb" aria-hidden="true" />
      {[
        ['INR', '₹', 'Rupees'],
        ['USD', '$', 'Dollars'],
      ].map(([code, symbol, label]) => (
        <button
          key={code}
          type="button"
          className={currency === code ? 'is-active' : ''}
          aria-pressed={currency === code}
          title={label}
          onClick={() => setCurrency(code)}
        >
          <span aria-hidden="true">{symbol}</span>
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}
