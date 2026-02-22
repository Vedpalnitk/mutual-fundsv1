/**
 * Shared Exchange Scheme Picker
 *
 * Autocomplete search component used by both BSE and NMF pages.
 * Accepts a search function and renders a debounced dropdown with
 * scheme name, code, ISIN, and minimum purchase amount.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useFATheme } from '@/utils/fa'

// ---------------------------------------------------------------------------
// Shared scheme shape — the minimum fields both BseScheme and NmfScheme have
// ---------------------------------------------------------------------------

export interface ExchangeSchemeBase {
  schemeCode: string
  schemeName: string
  isin?: string | null
  minPurchaseAmt?: number | null
  purchaseAllowed?: boolean
  sipAllowed?: boolean
  switchAllowed?: boolean
  redemptionAllowed?: boolean
}

export type SchemeFilterType = 'purchase' | 'sip' | 'switch' | 'redemption'

export interface ExchangeSchemePickerProps<T extends ExchangeSchemeBase = ExchangeSchemeBase> {
  /** Function that performs the API search and returns an array of schemes */
  searchFn: (query: string, page: number, limit: number) => Promise<{ data: T[] } | T[]>
  /** Callback when a scheme is selected */
  onSelect: (scheme: T) => void
  /** Optional filter to narrow results by transaction type */
  filterType?: SchemeFilterType
  /** Placeholder text for the input */
  placeholder?: string
  /** Optional label rendered above the input */
  label?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExchangeSchemePicker<T extends ExchangeSchemeBase = ExchangeSchemeBase>({
  searchFn,
  onSelect,
  filterType,
  placeholder = 'Search schemes...',
  label,
}: ExchangeSchemePickerProps<T>) {
  const { colors } = useFATheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Search with optional client-side filtering ─────────────────────────
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await searchFn(q, 1, 15)
      let schemes: T[] = Array.isArray(response) ? response : (response.data || [])

      // Client-side filter by transaction type
      if (filterType === 'purchase') {
        schemes = schemes.filter(s => s.purchaseAllowed)
      } else if (filterType === 'sip') {
        schemes = schemes.filter(s => s.sipAllowed)
      } else if (filterType === 'switch') {
        schemes = schemes.filter(s => s.switchAllowed)
      } else if (filterType === 'redemption') {
        schemes = schemes.filter(s => s.redemptionAllowed)
      }

      setResults(schemes)
      setIsOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [searchFn, filterType])

  // ── Debounced input handler ────────────────────────────────────────────
  const handleInputChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  // ── Selection ──────────────────────────────────────────────────────────
  const handleSelect = (scheme: T) => {
    setQuery(scheme.schemeName)
    setIsOpen(false)
    onSelect(scheme)
  }

  // ── Clear ──────────────────────────────────────────────────────────────
  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  // ── Click outside to close ─────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Cleanup debounce on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textPrimary,
            paddingRight: query ? '4.5rem' : '2.5rem',
          }}
        />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-3 top-2.5" style={{ right: query ? '2rem' : '0.75rem' }}>
            <div
              className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {/* Clear button */}
        {query && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2.5 w-5 h-5 flex items-center justify-center rounded-full transition-colors"
            style={{ background: colors.chipBg }}
          >
            <svg className="w-3 h-3" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-xl shadow-lg"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          {results.map((scheme) => (
            <button
              key={scheme.schemeCode}
              onClick={() => handleSelect(scheme)}
              className="w-full text-left px-4 py-2.5 transition-colors hover:opacity-80"
              style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
            >
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {scheme.schemeName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                {scheme.schemeCode}
                {scheme.isin ? ` | ${scheme.isin}` : ''}
                {scheme.minPurchaseAmt ? ` | Min: \u20B9${scheme.minPurchaseAmt}` : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
