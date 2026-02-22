/**
 * FA Portal Custom Hooks
 *
 * Shared hooks for the Financial Advisor portal.
 * Import with: import { useDarkMode, useFAColors } from '@/utils/faHooks'
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { FA_COLORS_LIGHT, FA_COLORS_DARK, FAColorPalette } from './faColors'
import { useTheme } from '@/context/ThemeContext'

/**
 * Hook to detect dark mode via ThemeContext (no MutationObserver needed).
 * Falls back to checking the document class when used outside ThemeProvider.
 */
export const useDarkMode = (): boolean => {
  try {
    const { resolvedTheme } = useTheme()
    return resolvedTheme === 'dark'
  } catch {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  }
}

/**
 * Hook to get current FA color palette based on dark/light mode
 */
export const useFAColors = (): FAColorPalette => {
  const isDark = useDarkMode()
  return isDark ? FA_COLORS_DARK : FA_COLORS_LIGHT
}

/**
 * Hook to get both isDark and colors together
 * Useful when you need both values
 */
export const useFATheme = (): { isDark: boolean; colors: FAColorPalette } => {
  const isDark = useDarkMode()
  const colors = isDark ? FA_COLORS_DARK : FA_COLORS_LIGHT
  return { isDark, colors }
}

/**
 * Hook for debounced value
 * Useful for search inputs
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for local storage state
 * Persists state to localStorage
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}

/**
 * Hook for managing filter state
 * Commonly used pattern in FA portal list pages
 */
export interface FilterState {
  search: string
  sortBy: string
  sortDirection: 'asc' | 'desc'
  filters: Record<string, string>
}

export const useFilters = (initialState?: Partial<FilterState>) => {
  const [state, setState] = useState<FilterState>({
    search: '',
    sortBy: '',
    sortDirection: 'desc',
    filters: {},
    ...initialState,
  })

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({ ...prev, search }))
  }, [])

  const setSort = useCallback((sortBy: string, sortDirection?: 'asc' | 'desc') => {
    setState((prev) => ({
      ...prev,
      sortBy,
      sortDirection: sortDirection ?? (prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc'),
    }))
  }, [])

  const setFilter = useCallback((key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      search: '',
      filters: {},
    }))
  }, [])

  const debouncedSearch = useDebounce(state.search, 300)

  return {
    ...state,
    debouncedSearch,
    setSearch,
    setSort,
    setFilter,
    clearFilters,
  }
}

/**
 * Hook for pagination
 */
export const usePagination = (totalItems: number, itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    },
    [totalPages]
  )

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  // Reset to page 1 when total items changes significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}

/**
 * Hook for modal/dialog state
 */
export const useModal = (initialOpen: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [data, setData] = useState<any>(null)

  const open = useCallback((modalData?: any) => {
    setData(modalData ?? null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // Clear data after animation
    setTimeout(() => setData(null), 200)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return { isOpen, data, open, close, toggle }
}

/**
 * Hook for async operations with loading and error state
 */
export const useAsync = <T, E = Error>() => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<E | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await asyncFunction()
      setData(result)
      return result
    } catch (e) {
      setError(e as E)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return { loading, error, data, execute, reset }
}

/**
 * Hook to track window size
 */
export const useWindowSize = () => {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

/**
 * Hook to detect mobile viewport
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const { width } = useWindowSize()
  return width < breakpoint
}
