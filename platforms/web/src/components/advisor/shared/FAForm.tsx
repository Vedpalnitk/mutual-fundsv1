/**
 * FA Portal Form Components
 *
 * Reusable form elements with consistent styling for the FA portal.
 * Import with: import { FAInput, FASelect, FAButton } from '@/components/advisor/shared/FAForm'
 */

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useFATheme } from '@/utils/faHooks'
import { FASpinner } from './FACard'

/**
 * Form Label
 */
export const FALabel = ({
  children,
  htmlFor,
  required,
  className = '',
}: {
  children: ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}) => {
  const { colors } = useFATheme()

  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${className}`}
      style={{ color: colors.primary }}
    >
      {children}
      {required && <span style={{ color: colors.error }}> *</span>}
    </label>
  )
}

/**
 * Text Input
 */
export const FAInput = ({
  label,
  error,
  helperText,
  required,
  className = '',
  containerClassName = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
}) => {
  const { isDark, colors } = useFATheme()

  return (
    <div className={containerClassName}>
      {label && (
        <FALabel htmlFor={props.id} required={required}>
          {label}
        </FALabel>
      )}
      <input
        className={`w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${className}`}
        style={{
          background: isDark ? colors.inputBg : '#FFFFFF',
          border: `1px solid ${error ? colors.error : colors.inputBorder}`,
          color: colors.textPrimary,
          // @ts-ignore
          '--tw-ring-color': colors.primary,
        }}
        {...props}
      />
      {error && (
        <p className="text-xs mt-1" style={{ color: colors.error }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
          {helperText}
        </p>
      )}
    </div>
  )
}

/**
 * Textarea
 */
export const FATextarea = ({
  label,
  error,
  helperText,
  required,
  rows = 3,
  className = '',
  containerClassName = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
}) => {
  const { isDark, colors } = useFATheme()

  return (
    <div className={containerClassName}>
      {label && (
        <FALabel htmlFor={props.id} required={required}>
          {label}
        </FALabel>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 resize-none ${className}`}
        style={{
          background: isDark ? colors.inputBg : '#FFFFFF',
          border: `1px solid ${error ? colors.error : colors.inputBorder}`,
          color: colors.textPrimary,
        }}
        {...props}
      />
      {error && (
        <p className="text-xs mt-1" style={{ color: colors.error }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
          {helperText}
        </p>
      )}
    </div>
  )
}

/**
 * Select Dropdown
 */
export const FASelect = ({
  label,
  error,
  helperText,
  required,
  options,
  placeholder,
  className = '',
  containerClassName = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
  containerClassName?: string
}) => {
  const { isDark, colors } = useFATheme()

  return (
    <div className={containerClassName}>
      {label && (
        <FALabel htmlFor={props.id} required={required}>
          {label}
        </FALabel>
      )}
      <select
        className={`w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 appearance-none ${className}`}
        style={{
          backgroundColor: isDark ? colors.inputBg : '#FFFFFF',
          border: `1px solid ${error ? colors.error : colors.inputBorder}`,
          color: colors.textPrimary,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
          backgroundRepeat: 'no-repeat',
          paddingRight: '40px',
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs mt-1" style={{ color: colors.error }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
          {helperText}
        </p>
      )}
    </div>
  )
}

/**
 * Primary Button
 */
export const FAButton = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}) => {
  const { colors } = useFATheme()

  const sizeClass = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size]

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          color: 'white',
          boxShadow: `0 4px 14px ${colors.glassShadow}`,
        }
      case 'secondary':
        return {
          background: colors.chipBg,
          color: colors.primary,
          border: `1px solid ${colors.chipBorder}`,
        }
      case 'ghost':
        return {
          background: 'transparent',
          color: colors.primary,
        }
      case 'danger':
        return {
          background: `linear-gradient(135deg, ${colors.error} 0%, #DC2626 100%)`,
          color: 'white',
          boxShadow: `0 4px 14px rgba(239, 68, 68, 0.2)`,
        }
      default:
        return {}
    }
  }

  return (
    <button
      className={`rounded-full font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${sizeClass} ${className}`}
      style={getVariantStyle()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <FASpinner size="sm" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}

/**
 * Icon Button
 */
export const FAIconButton = ({
  children,
  variant = 'ghost',
  size = 'md',
  title,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}) => {
  const { colors } = useFATheme()

  const sizeClass = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size]

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          color: 'white',
        }
      case 'secondary':
        return {
          background: colors.chipBg,
          color: colors.primary,
        }
      case 'ghost':
      default:
        return {
          background: 'transparent',
          color: colors.primary,
        }
    }
  }

  return (
    <button
      className={`rounded-lg flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${className}`}
      style={getVariantStyle()}
      title={title}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Checkbox
 */
export const FACheckbox = ({
  label,
  checked,
  onChange,
  disabled,
  className = '',
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) => {
  const { colors } = useFATheme()

  return (
    <label
      className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center transition-all"
        style={{
          background: checked ? colors.primary : colors.inputBg,
          border: `1px solid ${checked ? colors.primary : colors.inputBorder}`,
        }}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="text-sm" style={{ color: colors.textPrimary }}>
        {label}
      </span>
    </label>
  )
}

/**
 * Radio Group
 */
export const FARadioGroup = ({
  label,
  options,
  value,
  onChange,
  direction = 'horizontal',
  className = '',
}: {
  label?: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  direction?: 'horizontal' | 'vertical'
  className?: string
}) => {
  const { colors } = useFATheme()

  return (
    <div className={className}>
      {label && <FALabel>{label}</FALabel>}
      <div className={`flex ${direction === 'vertical' ? 'flex-col gap-2' : 'gap-4'}`}>
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
              style={{
                border: `2px solid ${value === opt.value ? colors.primary : colors.inputBorder}`,
              }}
            >
              {value === opt.value && (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: colors.primary }}
                />
              )}
            </div>
            <input
              type="radio"
              className="sr-only"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="text-sm" style={{ color: colors.textPrimary }}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

/**
 * Search Input with icon
 */
export const FASearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) => {
  const { isDark, colors } = useFATheme()

  return (
    <div className={`relative ${className}`}>
      <svg
        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: colors.textTertiary }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 h-10 rounded-lg text-sm transition-all focus:outline-none focus:ring-2"
        style={{
          background: isDark ? colors.inputBg : '#FFFFFF',
          border: `1px solid ${colors.inputBorder}`,
          color: colors.textPrimary,
        }}
      />
    </div>
  )
}

/**
 * Form Section wrapper
 */
export const FAFormSection = ({
  title,
  description,
  children,
  className = '',
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) => {
  const { colors } = useFATheme()

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs mb-4" style={{ color: colors.textSecondary }}>
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

export default FAInput
