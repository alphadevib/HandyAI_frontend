import { describe, expect, it } from 'vitest'
import { annualSaving, cycleOf, formatMoney, priceLabel } from '../src/format'

const paid = {
  plans: {
    paidPlanAvailable: true,
    monthly: { usd: 20, inr: 1760 },
    quarterly: { usd: 60, inr: 5280 },
    annual: { usd: 204, inr: 17952 },
  },
}

describe('prices', () => {
  it('formats rupees without decimals and dollars with cents when needed', () => {
    expect(formatMoney(1760, 'INR')).toBe('₹1,760')
    expect(formatMoney(19.5, 'USD')).toBe('$19.5')
    expect(formatMoney(null, 'INR')).toBe('—')
  })

  it('labels a plan in the chosen currency and cycle', () => {
    expect(priceLabel(paid, 'INR', 'MONTHLY')).toBe('₹1,760/mo')
    expect(priceLabel(paid, 'USD', 'ANNUAL')).toBe('$204/yr')
    expect(priceLabel({ plans: { paidPlanAvailable: false } }, 'INR', 'MONTHLY')).toBe('Free')
    expect(priceLabel({}, 'INR', 'MONTHLY')).toBeNull()
  })

  it('works out the annual saving against twelve monthly payments', () => {
    expect(annualSaving(paid)).toBe(15)
    expect(annualSaving({ plans: { paidPlanAvailable: false } })).toBe(0)
  })

  it('falls back to monthly for an unknown cycle', () => {
    expect(cycleOf('WEEKLY').value).toBe('MONTHLY')
  })
})
