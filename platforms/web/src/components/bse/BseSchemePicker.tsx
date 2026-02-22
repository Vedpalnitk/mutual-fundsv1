/**
 * BSE Scheme Picker
 *
 * Thin wrapper around the shared ExchangeSchemePicker,
 * pre-configured with the BSE scheme search API.
 */

import ExchangeSchemePicker from '@/components/exchange/ExchangeSchemePicker'
import type { SchemeFilterType } from '@/components/exchange/ExchangeSchemePicker'
import { bseApi } from '@/services/api'
import type { BseScheme } from '@/services/api'

interface BseSchemePickerProps {
  onSelect: (scheme: BseScheme) => void
  filterType?: SchemeFilterType
  placeholder?: string
}

export default function BseSchemePicker({ onSelect, filterType, placeholder }: BseSchemePickerProps) {
  return (
    <ExchangeSchemePicker<BseScheme>
      searchFn={(q, page, limit) => bseApi.masters.searchSchemes(q, page, limit)}
      onSelect={onSelect}
      filterType={filterType}
      placeholder={placeholder || 'Search BSE schemes...'}
    />
  )
}
