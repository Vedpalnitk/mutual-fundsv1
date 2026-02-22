/**
 * NMF Scheme Picker
 *
 * Thin wrapper around the shared ExchangeSchemePicker,
 * pre-configured with the NMF scheme search API.
 */

import ExchangeSchemePicker from '@/components/exchange/ExchangeSchemePicker'
import type { SchemeFilterType } from '@/components/exchange/ExchangeSchemePicker'
import { nmfApi } from '@/services/api'
import type { NmfScheme } from '@/services/api'

interface NmfSchemePickerProps {
  onSelect: (scheme: NmfScheme) => void
  filterType?: SchemeFilterType
  placeholder?: string
}

export default function NmfSchemePicker({ onSelect, filterType, placeholder }: NmfSchemePickerProps) {
  return (
    <ExchangeSchemePicker<NmfScheme>
      searchFn={(q, page, limit) => nmfApi.masters.searchSchemes(q, page, limit)}
      onSelect={onSelect}
      filterType={filterType}
      placeholder={placeholder || 'Search NMF schemes...'}
    />
  )
}
