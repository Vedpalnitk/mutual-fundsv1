/**
 * Newton-Raphson XIRR (Extended Internal Rate of Return) calculator
 * Computes the annualized rate of return for irregular cash flows.
 */

interface Cashflow {
  date: Date
  amount: number
}

function daysBetween(d1: Date, d2: Date): number {
  return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
}

function npv(rate: number, cashflows: Cashflow[], d0: Date): number {
  let total = 0
  for (const cf of cashflows) {
    const years = daysBetween(d0, cf.date) / 365.0
    total += cf.amount / Math.pow(1 + rate, years)
  }
  return total
}

function npvDerivative(rate: number, cashflows: Cashflow[], d0: Date): number {
  let total = 0
  for (const cf of cashflows) {
    const years = daysBetween(d0, cf.date) / 365.0
    if (years === 0) continue
    total -= (years * cf.amount) / Math.pow(1 + rate, years + 1)
  }
  return total
}

/**
 * Compute XIRR using Newton-Raphson method.
 * Returns annualized rate as a decimal (e.g. 0.12 = 12%) or null if no convergence.
 */
export function xirr(cashflows: Cashflow[]): number | null {
  if (cashflows.length < 2) return null

  const hasPositive = cashflows.some(cf => cf.amount > 0)
  const hasNegative = cashflows.some(cf => cf.amount < 0)
  if (!hasPositive || !hasNegative) return null

  const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime())
  const d0 = sorted[0].date

  let rate = 0.1 // initial guess 10%
  const maxIterations = 100
  const tolerance = 1e-7

  for (let i = 0; i < maxIterations; i++) {
    const f = npv(rate, sorted, d0)
    const df = npvDerivative(rate, sorted, d0)

    if (Math.abs(df) < 1e-10) break

    const newRate = rate - f / df

    if (Math.abs(newRate - rate) < tolerance) {
      return Math.round(newRate * 10000) / 10000
    }

    rate = newRate

    // Guard against divergence
    if (rate < -0.99 || rate > 100) break
  }

  return null
}
