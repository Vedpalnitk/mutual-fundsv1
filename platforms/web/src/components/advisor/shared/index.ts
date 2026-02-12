/**
 * FA Portal Shared Components
 *
 * Central export for all shared FA portal components.
 * Import with: import { FACard, FAButton, etc } from '@/components/advisor/shared'
 */

// Card Components
export {
  FACard,
  FATintedCard,
  FAInfoTile,
  FAStatCard,
  FASectionHeader,
  FAChip,
  FAIconContainer,
  FAEmptyState,
  FASpinner,
  FALoadingState,
} from './FACard'

// Form Components
export {
  FALabel,
  FAInput,
  FATextarea,
  FASelect,
  FAButton,
  FAIconButton,
  FACheckbox,
  FARadioGroup,
  FASearchInput,
  FAFormSection,
} from './FAForm'

// Notification Components
export {
  FANotificationProvider,
  useNotification,
} from './FANotification'

// Communication Components
export { FAShareButton } from './FAShareButton'
