import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  personasApi,
  mlApi,
  ClassificationLog,
  BlendedRecommendResponse,
  AllocationBreakdown,
  Persona,
} from '@/services/api'

// V4 Color Palette - Refined Blue Theme (Light Mode)
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryDeep: '#1E40AF',
  accent: '#3B82F6',
  secondary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  glassBackground: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(37, 99, 235, 0.12)',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  inputBg: 'rgba(37, 99, 235, 0.02)',
  inputBorder: 'rgba(37, 99, 235, 0.12)',
  cardBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.06)',
  chipBorder: 'rgba(37, 99, 235, 0.12)',
  progressBg: 'rgba(37, 99, 235, 0.1)',
  cardBackground: '#FFFFFF',
}

// V4 Color Palette - Refined Blue Theme (Dark Mode)
const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryDeep: '#2563EB',
  accent: '#93C5FD',
  secondary: '#38BDF8',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  background: '#0B1120',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1E293B',
  glassBackground: 'rgba(17, 24, 39, 0.88)',
  glassBorder: 'rgba(96, 165, 250, 0.12)',
  glassShadow: 'rgba(0, 0, 0, 0.35)',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  inputBg: 'rgba(96, 165, 250, 0.06)',
  inputBorder: 'rgba(96, 165, 250, 0.15)',
  cardBg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.08)',
  chipBorder: 'rgba(96, 165, 250, 0.15)',
  progressBg: 'rgba(96, 165, 250, 0.15)',
  cardBackground: '#111827',
}

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkClass = document.documentElement.classList.contains('dark')
      const isDarkMedia = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isLightClass = document.documentElement.classList.contains('light')
      setIsDark(isDarkClass || (isDarkMedia && !isLightClass))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  return isDark
}

// Get colors based on dark mode
const useV4Colors = () => {
  const isDark = useDarkMode()
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT
}

interface ProfileRecommendation {
  profile: ClassificationLog
  recommendations: BlendedRecommendResponse | null
  loading: boolean
  error: string | null
}

// Test profiles based on onboarding flow data - 20 diverse investor profiles with full details
const testProfiles: ClassificationLog[] = [
  // === AGGRESSIVE / ACCELERATED BUILDER PROFILES (Young, Long Horizon) ===
  {
    id: 'test-001',
    inputFeatures: { horizonYears: 20, liquidity: 'Low', riskTolerance: 'Aggressive', volatility: 'High', knowledge: 'Advanced' },
    prediction: {
      personaId: 'accelerated-builder', personaSlug: 'accelerated-builder',
      distribution: { 'accelerated-builder': 0.82, 'balanced-voyager': 0.15, 'capital-guardian': 0.03 },
      blendedAllocation: { equity: 0.75, debt: 0.10, hybrid: 0.05, gold: 0.03, international: 0.07, liquid: 0 },
    },
    confidence: 0.82, latencyMs: 12, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-001', email: 'arjun.mehta@example.com', profile: {
      id: 'up-001', name: 'Arjun Mehta', age: 25, goal: 'Wealth Creation', targetAmount: 50000000, monthlySip: 75000, horizonYears: 20, riskTolerance: 'Aggressive',
      gender: 'Male', city: 'Bangalore', occupation: 'Software Engineer', employmentType: 'Salaried',
      monthlyIncome: 250000, monthlyExpenses: 80000, existingSavings: 1500000, emergencyFundMonths: 6, dependents: 0,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '3-5 years', investmentKnowledge: 'Advanced',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: false, ppf: true, nps: true, realEstate: false, gold: false, crypto: true },
      riskAppetite: 'Very Aggressive', marketDropReaction: 'Buy more', preferredReturns: 'Maximum possible', volatilityComfort: 'High', drawdownTolerance: '30%+', lumpSumAvailable: 500000
    }},
  },
  {
    id: 'test-002',
    inputFeatures: { horizonYears: 18, liquidity: 'Low', riskTolerance: 'Aggressive', volatility: 'High', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'accelerated-builder', personaSlug: 'accelerated-builder',
      distribution: { 'accelerated-builder': 0.78, 'balanced-voyager': 0.18, 'capital-guardian': 0.04 },
      blendedAllocation: { equity: 0.72, debt: 0.12, hybrid: 0.06, gold: 0.04, international: 0.06, liquid: 0 },
    },
    confidence: 0.78, latencyMs: 14, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-002', email: 'kavya.reddy@example.com', profile: {
      id: 'up-002', name: 'Kavya Reddy', age: 27, goal: 'Retirement', targetAmount: 30000000, monthlySip: 50000, horizonYears: 18, riskTolerance: 'Aggressive',
      gender: 'Female', city: 'Hyderabad', occupation: 'Product Manager', employmentType: 'Salaried',
      monthlyIncome: 180000, monthlyExpenses: 60000, existingSavings: 800000, emergencyFundMonths: 4, dependents: 0,
      hasLoans: true, totalEmi: 15000, hasHealthInsurance: true, hasLifeInsurance: false,
      investmentExperience: '1-3 years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: true, ppf: false, nps: false, realEstate: false, gold: true, crypto: false },
      riskAppetite: 'Aggressive', marketDropReaction: 'Buy more', preferredReturns: 'High 18-22%', volatilityComfort: 'High', drawdownTolerance: '20%', lumpSumAvailable: 200000
    }},
  },
  {
    id: 'test-003',
    inputFeatures: { horizonYears: 15, liquidity: 'Low', riskTolerance: 'Aggressive', volatility: 'High', knowledge: 'Advanced' },
    prediction: {
      personaId: 'accelerated-builder', personaSlug: 'accelerated-builder',
      distribution: { 'accelerated-builder': 0.75, 'balanced-voyager': 0.20, 'capital-guardian': 0.05 },
      blendedAllocation: { equity: 0.70, debt: 0.12, hybrid: 0.08, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.75, latencyMs: 11, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-003', email: 'rohan.joshi@example.com', profile: {
      id: 'up-003', name: 'Rohan Joshi', age: 28, goal: 'Wealth Creation', targetAmount: 25000000, monthlySip: 60000, horizonYears: 15, riskTolerance: 'Aggressive',
      gender: 'Male', city: 'Mumbai', occupation: 'Investment Banker', employmentType: 'Salaried',
      monthlyIncome: 350000, monthlyExpenses: 120000, existingSavings: 2500000, emergencyFundMonths: 8, dependents: 0,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '5+ years', investmentKnowledge: 'Advanced',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: false, ppf: true, nps: true, realEstate: true, gold: false, crypto: true },
      riskAppetite: 'Very Aggressive', marketDropReaction: 'Buy more', preferredReturns: 'Maximum possible', volatilityComfort: 'High', drawdownTolerance: '30%+', lumpSumAvailable: 1000000
    }},
  },
  {
    id: 'test-004',
    inputFeatures: { horizonYears: 25, liquidity: 'Low', riskTolerance: 'Aggressive', volatility: 'High', knowledge: 'Advanced' },
    prediction: {
      personaId: 'accelerated-builder', personaSlug: 'accelerated-builder',
      distribution: { 'accelerated-builder': 0.88, 'balanced-voyager': 0.10, 'capital-guardian': 0.02 },
      blendedAllocation: { equity: 0.80, debt: 0.08, hybrid: 0.04, gold: 0.02, international: 0.06, liquid: 0 },
    },
    confidence: 0.88, latencyMs: 10, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-004', email: 'neha.kapoor@example.com', profile: {
      id: 'up-004', name: 'Neha Kapoor', age: 23, goal: 'Retirement', targetAmount: 100000000, monthlySip: 40000, horizonYears: 25, riskTolerance: 'Aggressive',
      gender: 'Female', city: 'Delhi', occupation: 'Data Scientist', employmentType: 'Salaried',
      monthlyIncome: 120000, monthlyExpenses: 40000, existingSavings: 300000, emergencyFundMonths: 3, dependents: 0,
      hasLoans: true, totalEmi: 8000, hasHealthInsurance: true, hasLifeInsurance: false,
      investmentExperience: '1-3 years', investmentKnowledge: 'Advanced',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: false, ppf: false, nps: true, realEstate: false, gold: false, crypto: true },
      riskAppetite: 'Very Aggressive', marketDropReaction: 'Buy more', preferredReturns: 'Maximum possible', volatilityComfort: 'High', drawdownTolerance: '30%+', lumpSumAvailable: 100000
    }},
  },
  {
    id: 'test-005',
    inputFeatures: { horizonYears: 12, liquidity: 'Medium', riskTolerance: 'Aggressive', volatility: 'High', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'accelerated-builder', personaSlug: 'accelerated-builder',
      distribution: { 'accelerated-builder': 0.68, 'balanced-voyager': 0.25, 'capital-guardian': 0.07 },
      blendedAllocation: { equity: 0.65, debt: 0.15, hybrid: 0.10, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.68, latencyMs: 13, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-005', email: 'vikram.singh@example.com', profile: {
      id: 'up-005', name: 'Vikram Singh', age: 30, goal: 'House Purchase', targetAmount: 15000000, monthlySip: 45000, horizonYears: 12, riskTolerance: 'Aggressive',
      gender: 'Male', city: 'Pune', occupation: 'Entrepreneur', employmentType: 'Self-employed',
      monthlyIncome: 200000, monthlyExpenses: 70000, existingSavings: 1200000, emergencyFundMonths: 6, dependents: 0,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '3-5 years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: true, ppf: true, nps: false, realEstate: false, gold: true, crypto: false },
      riskAppetite: 'Aggressive', marketDropReaction: 'Do nothing', preferredReturns: 'High 18-22%', volatilityComfort: 'High', drawdownTolerance: '20%', lumpSumAvailable: 300000
    }},
  },

  // === BALANCED / BALANCED VOYAGER PROFILES (Mid-age, Medium Horizon) ===
  {
    id: 'test-006',
    inputFeatures: { horizonYears: 10, liquidity: 'Medium', riskTolerance: 'Moderate', volatility: 'Medium', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.20, 'balanced-voyager': 0.65, 'capital-guardian': 0.15 },
      blendedAllocation: { equity: 0.50, debt: 0.28, hybrid: 0.12, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.65, latencyMs: 15, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-006', email: 'priya.sharma@example.com', profile: {
      id: 'up-006', name: 'Priya Sharma', age: 35, goal: 'Child Education', targetAmount: 8000000, monthlySip: 30000, horizonYears: 10, riskTolerance: 'Moderate',
      gender: 'Female', city: 'Chennai', occupation: 'Doctor', employmentType: 'Salaried',
      monthlyIncome: 150000, monthlyExpenses: 60000, existingSavings: 2000000, emergencyFundMonths: 6, dependents: 2,
      hasLoans: true, totalEmi: 25000, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '3-5 years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: false, fixedDeposits: true, ppf: true, nps: true, realEstate: false, gold: true, crypto: false },
      riskAppetite: 'Moderate', marketDropReaction: 'Do nothing', preferredReturns: 'Moderate 12-15%', volatilityComfort: 'Medium', drawdownTolerance: '10%', lumpSumAvailable: 200000
    }},
  },
  {
    id: 'test-007',
    inputFeatures: { horizonYears: 8, liquidity: 'Medium', riskTolerance: 'Moderate', volatility: 'Medium', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.18, 'balanced-voyager': 0.62, 'capital-guardian': 0.20 },
      blendedAllocation: { equity: 0.45, debt: 0.30, hybrid: 0.15, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.62, latencyMs: 14, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-007', email: 'amit.verma@example.com', profile: {
      id: 'up-007', name: 'Amit Verma', age: 38, goal: 'Child Education', targetAmount: 5000000, monthlySip: 25000, horizonYears: 8, riskTolerance: 'Moderate',
      gender: 'Male', city: 'Kolkata', occupation: 'Bank Manager', employmentType: 'Salaried',
      monthlyIncome: 120000, monthlyExpenses: 50000, existingSavings: 1500000, emergencyFundMonths: 8, dependents: 3,
      hasLoans: true, totalEmi: 20000, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '5+ years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: false, fixedDeposits: true, ppf: true, nps: true, realEstate: true, gold: true, crypto: false },
      riskAppetite: 'Moderate', marketDropReaction: 'Do nothing', preferredReturns: 'Moderate 12-15%', volatilityComfort: 'Medium', drawdownTolerance: '10%', lumpSumAvailable: 150000
    }},
  },
  {
    id: 'test-008',
    inputFeatures: { horizonYears: 7, liquidity: 'Medium', riskTolerance: 'Moderate', volatility: 'Medium', knowledge: 'Beginner' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.15, 'balanced-voyager': 0.58, 'capital-guardian': 0.27 },
      blendedAllocation: { equity: 0.42, debt: 0.32, hybrid: 0.15, gold: 0.06, international: 0.05, liquid: 0 },
    },
    confidence: 0.58, latencyMs: 16, createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-008', email: 'sunita.gupta@example.com', profile: {
      id: 'up-008', name: 'Sunita Gupta', age: 40, goal: 'Retirement', targetAmount: 12000000, monthlySip: 35000, horizonYears: 7, riskTolerance: 'Moderate',
      gender: 'Female', city: 'Ahmedabad', occupation: 'Teacher', employmentType: 'Salaried',
      monthlyIncome: 80000, monthlyExpenses: 35000, existingSavings: 800000, emergencyFundMonths: 6, dependents: 2,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: 'Less than 1 year', investmentKnowledge: 'Beginner',
      currentInvestments: { mutualFunds: false, stocks: false, fixedDeposits: true, ppf: true, nps: false, realEstate: false, gold: true, crypto: false },
      riskAppetite: 'Moderate', marketDropReaction: 'Sell some', preferredReturns: 'Moderate 12-15%', volatilityComfort: 'Medium', drawdownTolerance: '10%', lumpSumAvailable: 100000
    }},
  },
  {
    id: 'test-009',
    inputFeatures: { horizonYears: 12, liquidity: 'Medium', riskTolerance: 'Moderate', volatility: 'Medium', knowledge: 'Advanced' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.30, 'balanced-voyager': 0.55, 'capital-guardian': 0.15 },
      blendedAllocation: { equity: 0.52, debt: 0.25, hybrid: 0.12, gold: 0.05, international: 0.06, liquid: 0 },
    },
    confidence: 0.55, latencyMs: 12, createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-009', email: 'rajesh.iyer@example.com', profile: {
      id: 'up-009', name: 'Rajesh Iyer', age: 33, goal: 'House Purchase', targetAmount: 20000000, monthlySip: 55000, horizonYears: 12, riskTolerance: 'Moderate',
      gender: 'Male', city: 'Bangalore', occupation: 'Architect', employmentType: 'Self-employed',
      monthlyIncome: 200000, monthlyExpenses: 80000, existingSavings: 1800000, emergencyFundMonths: 5, dependents: 1,
      hasLoans: true, totalEmi: 30000, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '3-5 years', investmentKnowledge: 'Advanced',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: true, ppf: true, nps: false, realEstate: true, gold: false, crypto: false },
      riskAppetite: 'Moderate', marketDropReaction: 'Buy more', preferredReturns: 'Moderate 12-15%', volatilityComfort: 'Medium', drawdownTolerance: '20%', lumpSumAvailable: 400000
    }},
  },
  {
    id: 'test-010',
    inputFeatures: { horizonYears: 6, liquidity: 'Medium', riskTolerance: 'Moderate', volatility: 'Low', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.12, 'balanced-voyager': 0.55, 'capital-guardian': 0.33 },
      blendedAllocation: { equity: 0.40, debt: 0.35, hybrid: 0.15, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.55, latencyMs: 14, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-010', email: 'meera.nair@example.com', profile: {
      id: 'up-010', name: 'Meera Nair', age: 42, goal: 'Child Education', targetAmount: 3000000, monthlySip: 20000, horizonYears: 6, riskTolerance: 'Moderate',
      gender: 'Female', city: 'Kochi', occupation: 'Government Employee', employmentType: 'Salaried',
      monthlyIncome: 90000, monthlyExpenses: 40000, existingSavings: 1200000, emergencyFundMonths: 12, dependents: 2,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '3-5 years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: false, fixedDeposits: true, ppf: true, nps: true, realEstate: false, gold: true, crypto: false },
      riskAppetite: 'Conservative', marketDropReaction: 'Do nothing', preferredReturns: 'Steady 8-10%', volatilityComfort: 'Low', drawdownTolerance: '5%', lumpSumAvailable: 100000
    }},
  },
  {
    id: 'test-011',
    inputFeatures: { horizonYears: 9, liquidity: 'Low', riskTolerance: 'Moderate', volatility: 'Medium', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.25, 'balanced-voyager': 0.60, 'capital-guardian': 0.15 },
      blendedAllocation: { equity: 0.48, debt: 0.28, hybrid: 0.14, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.60, latencyMs: 13, createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-011', email: 'sanjay.das@example.com', profile: {
      id: 'up-011', name: 'Sanjay Das', age: 36, goal: 'Wealth Creation', targetAmount: 10000000, monthlySip: 40000, horizonYears: 9, riskTolerance: 'Moderate',
      gender: 'Male', city: 'Jaipur', occupation: 'Business Owner', employmentType: 'Self-employed',
      monthlyIncome: 180000, monthlyExpenses: 70000, existingSavings: 2500000, emergencyFundMonths: 6, dependents: 2,
      hasLoans: true, totalEmi: 35000, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '5+ years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: true, ppf: false, nps: false, realEstate: true, gold: true, crypto: false },
      riskAppetite: 'Moderate', marketDropReaction: 'Do nothing', preferredReturns: 'Moderate 12-15%', volatilityComfort: 'Medium', drawdownTolerance: '10%', lumpSumAvailable: 500000
    }},
  },

  // === CONSERVATIVE / CAPITAL GUARDIAN PROFILES (Older, Short Horizon) ===
  {
    id: 'test-012',
    inputFeatures: { horizonYears: 3, liquidity: 'High', riskTolerance: 'Conservative', volatility: 'Low', knowledge: 'Beginner' },
    prediction: {
      personaId: 'capital-guardian', personaSlug: 'capital-guardian',
      distribution: { 'accelerated-builder': 0.05, 'balanced-voyager': 0.18, 'capital-guardian': 0.77 },
      blendedAllocation: { equity: 0.20, debt: 0.50, hybrid: 0.15, gold: 0.05, international: 0, liquid: 0.10 },
    },
    confidence: 0.77, latencyMs: 10, createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-012', email: 'ramesh.agarwal@example.com', profile: {
      id: 'up-012', name: 'Ramesh Agarwal', age: 55, goal: 'Emergency Fund', targetAmount: 1500000, monthlySip: 15000, horizonYears: 3, riskTolerance: 'Conservative',
      gender: 'Male', city: 'Lucknow', occupation: 'Retired', employmentType: 'Retired',
      monthlyIncome: 60000, monthlyExpenses: 35000, existingSavings: 5000000, emergencyFundMonths: 24, dependents: 1,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '5+ years', investmentKnowledge: 'Beginner',
      currentInvestments: { mutualFunds: false, stocks: false, fixedDeposits: true, ppf: true, nps: false, realEstate: true, gold: true, crypto: false },
      riskAppetite: 'Very Conservative', marketDropReaction: 'Sell everything', preferredReturns: 'Steady 8-10%', volatilityComfort: 'Low', drawdownTolerance: '5%', lumpSumAvailable: 500000
    }},
  },
  {
    id: 'test-013',
    inputFeatures: { horizonYears: 4, liquidity: 'High', riskTolerance: 'Conservative', volatility: 'Low', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'capital-guardian', personaSlug: 'capital-guardian',
      distribution: { 'accelerated-builder': 0.08, 'balanced-voyager': 0.22, 'capital-guardian': 0.70 },
      blendedAllocation: { equity: 0.25, debt: 0.48, hybrid: 0.15, gold: 0.05, international: 0, liquid: 0.07 },
    },
    confidence: 0.70, latencyMs: 11, createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-013', email: 'kamala.devi@example.com', profile: {
      id: 'up-013', name: 'Kamala Devi', age: 58, goal: 'Retirement', targetAmount: 5000000, monthlySip: 25000, horizonYears: 4, riskTolerance: 'Conservative',
      gender: 'Female', city: 'Indore', occupation: 'Homemaker', employmentType: 'Homemaker',
      monthlyIncome: 0, monthlyExpenses: 30000, existingSavings: 3000000, emergencyFundMonths: 36, dependents: 0,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: false,
      investmentExperience: '1-3 years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: false, fixedDeposits: true, ppf: false, nps: false, realEstate: true, gold: true, crypto: false },
      riskAppetite: 'Conservative', marketDropReaction: 'Sell some', preferredReturns: 'Steady 8-10%', volatilityComfort: 'Low', drawdownTolerance: '5%', lumpSumAvailable: 1000000
    }},
  },
  {
    id: 'test-014',
    inputFeatures: { horizonYears: 2, liquidity: 'High', riskTolerance: 'Conservative', volatility: 'Low', knowledge: 'Beginner' },
    prediction: {
      personaId: 'capital-guardian', personaSlug: 'capital-guardian',
      distribution: { 'accelerated-builder': 0.02, 'balanced-voyager': 0.12, 'capital-guardian': 0.86 },
      blendedAllocation: { equity: 0.15, debt: 0.55, hybrid: 0.12, gold: 0.05, international: 0, liquid: 0.13 },
    },
    confidence: 0.86, latencyMs: 9, createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-014', email: 'suresh.pillai@example.com', profile: {
      id: 'up-014', name: 'Suresh Pillai', age: 60, goal: 'Emergency Fund', targetAmount: 1000000, monthlySip: 20000, horizonYears: 2, riskTolerance: 'Conservative',
      gender: 'Male', city: 'Trivandrum', occupation: 'Retired', employmentType: 'Retired',
      monthlyIncome: 45000, monthlyExpenses: 25000, existingSavings: 8000000, emergencyFundMonths: 48, dependents: 0,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '5+ years', investmentKnowledge: 'Beginner',
      currentInvestments: { mutualFunds: false, stocks: false, fixedDeposits: true, ppf: true, nps: false, realEstate: true, gold: true, crypto: false },
      riskAppetite: 'Very Conservative', marketDropReaction: 'Sell everything', preferredReturns: 'Steady 8-10%', volatilityComfort: 'Low', drawdownTolerance: '5%', lumpSumAvailable: 2000000
    }},
  },
  {
    id: 'test-015',
    inputFeatures: { horizonYears: 5, liquidity: 'High', riskTolerance: 'Conservative', volatility: 'Low', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'capital-guardian', personaSlug: 'capital-guardian',
      distribution: { 'accelerated-builder': 0.10, 'balanced-voyager': 0.28, 'capital-guardian': 0.62 },
      blendedAllocation: { equity: 0.28, debt: 0.45, hybrid: 0.15, gold: 0.05, international: 0.02, liquid: 0.05 },
    },
    confidence: 0.62, latencyMs: 12, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-015', email: 'lakshmi.menon@example.com', profile: {
      id: 'up-015', name: 'Lakshmi Menon', age: 52, goal: 'Tax Saving', targetAmount: 2000000, monthlySip: 15000, horizonYears: 5, riskTolerance: 'Conservative',
      gender: 'Female', city: 'Coimbatore', occupation: 'School Principal', employmentType: 'Salaried',
      monthlyIncome: 100000, monthlyExpenses: 45000, existingSavings: 3500000, emergencyFundMonths: 12, dependents: 1,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '5+ years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: false, fixedDeposits: true, ppf: true, nps: true, realEstate: true, gold: true, crypto: false },
      riskAppetite: 'Conservative', marketDropReaction: 'Do nothing', preferredReturns: 'Steady 8-10%', volatilityComfort: 'Low', drawdownTolerance: '5%', lumpSumAvailable: 300000
    }},
  },

  // === EDGE CASES / MIXED PROFILES ===
  {
    id: 'test-016',
    inputFeatures: { horizonYears: 5, liquidity: 'Low', riskTolerance: 'Aggressive', volatility: 'High', knowledge: 'Advanced' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.40, 'balanced-voyager': 0.45, 'capital-guardian': 0.15 },
      blendedAllocation: { equity: 0.55, debt: 0.25, hybrid: 0.10, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.45, latencyMs: 18, createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-016', email: 'ankit.bansal@example.com', profile: {
      id: 'up-016', name: 'Ankit Bansal', age: 32, goal: 'House Purchase', targetAmount: 8000000, monthlySip: 35000, horizonYears: 5, riskTolerance: 'Aggressive',
      gender: 'Male', city: 'Noida', occupation: 'Startup Founder', employmentType: 'Self-employed',
      monthlyIncome: 150000, monthlyExpenses: 60000, existingSavings: 600000, emergencyFundMonths: 3, dependents: 1,
      hasLoans: true, totalEmi: 25000, hasHealthInsurance: false, hasLifeInsurance: false,
      investmentExperience: '3-5 years', investmentKnowledge: 'Advanced',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: false, ppf: false, nps: false, realEstate: false, gold: false, crypto: true },
      riskAppetite: 'Very Aggressive', marketDropReaction: 'Buy more', preferredReturns: 'Maximum possible', volatilityComfort: 'High', drawdownTolerance: '30%+', lumpSumAvailable: 100000
    }},
  },
  {
    id: 'test-017',
    inputFeatures: { horizonYears: 15, liquidity: 'High', riskTolerance: 'Conservative', volatility: 'Low', knowledge: 'Beginner' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.15, 'balanced-voyager': 0.50, 'capital-guardian': 0.35 },
      blendedAllocation: { equity: 0.38, debt: 0.38, hybrid: 0.14, gold: 0.05, international: 0.03, liquid: 0.02 },
    },
    confidence: 0.50, latencyMs: 15, createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-017', email: 'geeta.saxena@example.com', profile: {
      id: 'up-017', name: 'Geeta Saxena', age: 45, goal: 'Retirement', targetAmount: 15000000, monthlySip: 30000, horizonYears: 15, riskTolerance: 'Conservative',
      gender: 'Female', city: 'Bhopal', occupation: 'Government Officer', employmentType: 'Salaried',
      monthlyIncome: 110000, monthlyExpenses: 50000, existingSavings: 4000000, emergencyFundMonths: 18, dependents: 2,
      hasLoans: false, totalEmi: 0, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: 'Less than 1 year', investmentKnowledge: 'Beginner',
      currentInvestments: { mutualFunds: false, stocks: false, fixedDeposits: true, ppf: true, nps: true, realEstate: true, gold: true, crypto: false },
      riskAppetite: 'Conservative', marketDropReaction: 'Sell some', preferredReturns: 'Steady 8-10%', volatilityComfort: 'Low', drawdownTolerance: '5%', lumpSumAvailable: 500000
    }},
  },
  {
    id: 'test-018',
    inputFeatures: { horizonYears: 10, liquidity: 'Low', riskTolerance: 'Moderate', volatility: 'High', knowledge: 'Advanced' },
    prediction: {
      personaId: 'accelerated-builder', personaSlug: 'accelerated-builder',
      distribution: { 'accelerated-builder': 0.52, 'balanced-voyager': 0.38, 'capital-guardian': 0.10 },
      blendedAllocation: { equity: 0.58, debt: 0.22, hybrid: 0.10, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.52, latencyMs: 14, createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-018', email: 'deepak.choudhary@example.com', profile: {
      id: 'up-018', name: 'Deepak Choudhary', age: 29, goal: 'Wealth Creation', targetAmount: 20000000, monthlySip: 50000, horizonYears: 10, riskTolerance: 'Moderate',
      gender: 'Male', city: 'Gurgaon', occupation: 'Management Consultant', employmentType: 'Salaried',
      monthlyIncome: 280000, monthlyExpenses: 100000, existingSavings: 1500000, emergencyFundMonths: 4, dependents: 0,
      hasLoans: true, totalEmi: 40000, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '3-5 years', investmentKnowledge: 'Advanced',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: false, ppf: true, nps: true, realEstate: false, gold: false, crypto: true },
      riskAppetite: 'Aggressive', marketDropReaction: 'Buy more', preferredReturns: 'High 18-22%', volatilityComfort: 'High', drawdownTolerance: '20%', lumpSumAvailable: 300000
    }},
  },
  {
    id: 'test-019',
    inputFeatures: { horizonYears: 3, liquidity: 'Medium', riskTolerance: 'Moderate', volatility: 'Low', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'capital-guardian', personaSlug: 'capital-guardian',
      distribution: { 'accelerated-builder': 0.08, 'balanced-voyager': 0.35, 'capital-guardian': 0.57 },
      blendedAllocation: { equity: 0.30, debt: 0.42, hybrid: 0.15, gold: 0.05, international: 0.03, liquid: 0.05 },
    },
    confidence: 0.57, latencyMs: 13, createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-019', email: 'pooja.bhatt@example.com', profile: {
      id: 'up-019', name: 'Pooja Bhatt', age: 48, goal: 'Emergency Fund', targetAmount: 2500000, monthlySip: 25000, horizonYears: 3, riskTolerance: 'Moderate',
      gender: 'Female', city: 'Chandigarh', occupation: 'Lawyer', employmentType: 'Self-employed',
      monthlyIncome: 200000, monthlyExpenses: 80000, existingSavings: 3000000, emergencyFundMonths: 6, dependents: 2,
      hasLoans: true, totalEmi: 30000, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '3-5 years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: false, fixedDeposits: true, ppf: true, nps: false, realEstate: true, gold: true, crypto: false },
      riskAppetite: 'Moderate', marketDropReaction: 'Do nothing', preferredReturns: 'Moderate 12-15%', volatilityComfort: 'Low', drawdownTolerance: '10%', lumpSumAvailable: 400000
    }},
  },
  {
    id: 'test-020',
    inputFeatures: { horizonYears: 7, liquidity: 'Low', riskTolerance: 'Aggressive', volatility: 'Medium', knowledge: 'Intermediate' },
    prediction: {
      personaId: 'balanced-voyager', personaSlug: 'balanced-voyager',
      distribution: { 'accelerated-builder': 0.35, 'balanced-voyager': 0.50, 'capital-guardian': 0.15 },
      blendedAllocation: { equity: 0.52, debt: 0.26, hybrid: 0.12, gold: 0.05, international: 0.05, liquid: 0 },
    },
    confidence: 0.50, latencyMs: 16, createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u-020', email: 'manish.tiwari@example.com', profile: {
      id: 'up-020', name: 'Manish Tiwari', age: 34, goal: 'Child Education', targetAmount: 6000000, monthlySip: 28000, horizonYears: 7, riskTolerance: 'Aggressive',
      gender: 'Male', city: 'Nagpur', occupation: 'CA', employmentType: 'Self-employed',
      monthlyIncome: 160000, monthlyExpenses: 65000, existingSavings: 1800000, emergencyFundMonths: 8, dependents: 2,
      hasLoans: true, totalEmi: 20000, hasHealthInsurance: true, hasLifeInsurance: true,
      investmentExperience: '5+ years', investmentKnowledge: 'Intermediate',
      currentInvestments: { mutualFunds: true, stocks: true, fixedDeposits: true, ppf: true, nps: false, realEstate: false, gold: true, crypto: false },
      riskAppetite: 'Aggressive', marketDropReaction: 'Do nothing', preferredReturns: 'High 18-22%', volatilityComfort: 'Medium', drawdownTolerance: '20%', lumpSumAvailable: 250000
    }},
  },
]

const RecommendationsPage = () => {
  const colors = useV4Colors()
  const isDark = useDarkMode()
  const [profiles, setProfiles] = useState<ProfileRecommendation[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [runningAll, setRunningAll] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState(100000)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load test profiles for model testing
      setProfiles(testProfiles.map(p => ({
        profile: p,
        recommendations: null,
        loading: false,
        error: null,
      })))

      // Try to fetch personas from API, fallback to defaults
      try {
        const personasData = await personasApi.list()
        setPersonas(personasData)
      } catch {
        setPersonas([
          { id: '1', name: 'Accelerated Builder', slug: 'accelerated-builder', riskBand: 'Accelerated Growth', displayOrder: 3, isActive: true, createdAt: '', updatedAt: '' },
          { id: '2', name: 'Balanced Voyager', slug: 'balanced-voyager', riskBand: 'Balanced Growth', displayOrder: 2, isActive: true, createdAt: '', updatedAt: '' },
          { id: '3', name: 'Capital Guardian', slug: 'capital-guardian', riskBand: 'Capital Preservation', displayOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
        ])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load test profiles')
    } finally {
      setLoading(false)
    }
  }

  const runRecommendations = async (profileId: string) => {
    const profileIndex = profiles.findIndex(p => p.profile.id === profileId)
    if (profileIndex === -1) return

    const profile = profiles[profileIndex]

    // Update loading state
    setProfiles(prev => prev.map((p, i) =>
      i === profileIndex ? { ...p, loading: true, error: null } : p
    ))

    try {
      // Get blended allocation from profile
      const blendedAllocation = profile.profile.prediction.blendedAllocation ||
        profile.profile.user?.profile?.blendedAllocation || {
          equity: 0.5,
          debt: 0.3,
          hybrid: 0.1,
          gold: 0.05,
          international: 0.05,
          liquid: 0,
        }

      // Ensure allocation values are in decimal form (0-1) - API expects decimals
      const toDecimal = (val: number) => val > 1 ? val / 100 : val
      const allocation: AllocationBreakdown = {
        equity: toDecimal(blendedAllocation.equity),
        debt: toDecimal(blendedAllocation.debt),
        hybrid: toDecimal(blendedAllocation.hybrid),
        gold: toDecimal(blendedAllocation.gold),
        international: toDecimal(blendedAllocation.international),
        liquid: toDecimal(blendedAllocation.liquid),
      }

      const result = await mlApi.recommendBlended({
        blended_allocation: allocation,
        persona_distribution: profile.profile.prediction.distribution,
        profile: {
          horizon_years: String(profile.profile.inputFeatures.horizonYears || 10),
          risk_tolerance: profile.profile.inputFeatures.riskTolerance || 'Moderate',
        },
        top_n: 6,
        investment_amount: investmentAmount,
      })

      setProfiles(prev => prev.map((p, i) =>
        i === profileIndex ? { ...p, recommendations: result, loading: false } : p
      ))
    } catch (err: any) {
      const errorMessage = err?.message || 'ML backend unavailable. Please ensure the recommendation service is running.'
      setProfiles(prev => prev.map((p, i) =>
        i === profileIndex ? { ...p, loading: false, error: errorMessage } : p
      ))
    }
  }

  const runAllRecommendations = async () => {
    setRunningAll(true)
    for (const profile of profiles) {
      if (!profile.recommendations) {
        await runRecommendations(profile.profile.id)
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    setRunningAll(false)
  }

  const getPersonaName = (slug: string) => {
    const persona = personas.find(p => p.slug === slug)
    return persona?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getPersonaColor = (slug: string) => {
    switch (slug) {
      case 'accelerated-builder': return colors.success
      case 'balanced-voyager': return colors.warning
      case 'capital-guardian': return colors.primary
      default: return colors.textSecondary
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return `₹${amount.toLocaleString()}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      <Navbar mode="admin" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary }}>Admin</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Recommendations Review</h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Review fund recommendations for classified user profiles.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Investment:</label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="w-32 h-9 px-3 rounded-xl text-sm"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                step={10000}
                min={10000}
              />
            </div>
            <button
              onClick={runAllRecommendations}
              disabled={runningAll || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              {runningAll ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run All Recommendations
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{
            background: `${colors.warning}15`,
            border: `1px solid ${colors.warning}30`,
            color: colors.warning
          }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }} />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: colors.chipBg }}>
              <svg className="w-8 h-8" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>No Classified Profiles</h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Classify some profiles in the ML Lab first to see recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map((item) => {
              const isExpanded = selectedProfile === item.profile.id
              const distribution = item.profile.prediction.distribution || {}
              const allocation = item.profile.prediction.blendedAllocation

              return (
                <div
                  key={item.profile.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: colors.cardBackground,
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: `0 4px 24px ${colors.glassShadow}`
                  }}
                >
                  {/* Profile Header */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => setSelectedProfile(isExpanded ? null : item.profile.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                          style={{ background: `linear-gradient(135deg, ${getPersonaColor(item.profile.prediction.personaSlug)} 0%, ${colors.primaryDark} 100%)` }}
                        >
                          {item.profile.user?.profile?.name?.charAt(0) || 'U'}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                              {item.profile.user?.profile?.name || item.profile.user?.email || 'Unknown User'}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${getPersonaColor(item.profile.prediction.personaSlug)}15`, color: getPersonaColor(item.profile.prediction.personaSlug) }}>
                              {getPersonaName(item.profile.prediction.personaSlug)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.textSecondary }}>
                              {(item.profile.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: colors.textSecondary }}>
                            {item.profile.user?.profile?.age && <span>{item.profile.user.profile.age} yrs</span>}
                            {item.profile.user?.profile?.gender && <span>{item.profile.user.profile.gender}</span>}
                            {item.profile.user?.profile?.city && <span>{item.profile.user.profile.city}</span>}
                            {item.profile.user?.profile?.occupation && <span>{item.profile.user.profile.occupation}</span>}
                            {item.profile.user?.profile?.goal && <span>Goal: {item.profile.user.profile.goal}</span>}
                            {item.profile.user?.profile?.monthlySip && <span>SIP: {formatCurrency(item.profile.user.profile.monthlySip)}/mo</span>}
                          </div>

                          {/* Persona Distribution */}
                          {Object.keys(distribution).length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              {Object.entries(distribution)
                                .sort(([, a], [, b]) => b - a)
                                .map(([slug, weight]) => (
                                  <div key={slug} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ background: getPersonaColor(slug) }} />
                                    <span className="text-xs" style={{ color: colors.textTertiary }}>
                                      {getPersonaName(slug).split(' ')[0]} {((weight as number) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.error ? (
                          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded" style={{ background: `${colors.error}15`, color: colors.error }}>
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Failed
                          </span>
                        ) : item.recommendations ? (
                          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded" style={{ background: `${colors.success}15`, color: colors.success }}>
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {item.recommendations.recommendations.length} funds
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); runRecommendations(item.profile.id) }}
                            disabled={item.loading}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                            style={{ background: colors.chipBg, color: colors.primary }}
                          >
                            {item.loading ? 'Running...' : 'Run'}
                          </button>
                        )}

                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform"
                          style={{ background: colors.chipBg, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <svg className="w-4 h-4" style={{ color: colors.textSecondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Error */}
                  {isExpanded && item.error && !item.recommendations && (
                    <div style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <div className="p-5">
                        <div className="p-4 rounded-xl" style={{ background: `${colors.error}10`, border: `1px solid ${colors.error}20` }}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${colors.error}15` }}>
                              <svg className="w-4 h-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold" style={{ color: colors.error }}>Recommendation Failed</p>
                              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{item.error}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); runRecommendations(item.profile.id) }}
                                className="mt-3 px-4 py-2 rounded-full text-xs font-medium text-white"
                                style={{ background: colors.primary }}
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Profile Details */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <div className="p-5">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                          Profile Details
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          {/* Financial Overview */}
                          <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>
                              Financial Profile
                            </div>
                            <div className="space-y-1.5">
                              {item.profile.user?.profile?.monthlyIncome !== undefined && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Monthly Income</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(item.profile.user.profile.monthlyIncome)}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.monthlyExpenses !== undefined && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Monthly Expenses</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(item.profile.user.profile.monthlyExpenses)}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.existingSavings !== undefined && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Existing Savings</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(item.profile.user.profile.existingSavings)}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.targetAmount !== undefined && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Target Amount</span>
                                  <span className="font-bold" style={{ color: colors.primary }}>{formatCurrency(item.profile.user.profile.targetAmount)}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.horizonYears !== undefined && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Investment Horizon</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.horizonYears} years</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.emergencyFundMonths !== undefined && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Emergency Fund</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.emergencyFundMonths} months</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.lumpSumAvailable !== undefined && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Lump Sum Available</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(item.profile.user.profile.lumpSumAvailable)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Risk Profile */}
                          <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>
                              Risk Profile
                            </div>
                            <div className="space-y-1.5">
                              {item.profile.user?.profile?.riskTolerance && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Risk Tolerance</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.riskTolerance}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.riskAppetite && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Risk Appetite</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.riskAppetite}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.marketDropReaction && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Market Drop Reaction</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.marketDropReaction}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.volatilityComfort && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Volatility Comfort</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.volatilityComfort}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.drawdownTolerance && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Drawdown Tolerance</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.drawdownTolerance}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.preferredReturns && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Preferred Returns</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.preferredReturns}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Experience & Status */}
                          <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>
                              Experience & Status
                            </div>
                            <div className="space-y-1.5">
                              {item.profile.user?.profile?.employmentType && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Employment</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.employmentType}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.dependents !== undefined && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Dependents</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.dependents}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.investmentExperience && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Inv. Experience</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.investmentExperience}</span>
                                </div>
                              )}
                              {item.profile.user?.profile?.investmentKnowledge && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: colors.textSecondary }}>Knowledge Level</span>
                                  <span className="font-medium" style={{ color: colors.textPrimary }}>{item.profile.user.profile.investmentKnowledge}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs">
                                <span style={{ color: colors.textSecondary }}>Has Loans</span>
                                <span className="font-medium" style={{ color: item.profile.user?.profile?.hasLoans ? colors.warning : colors.success }}>
                                  {item.profile.user?.profile?.hasLoans ? `Yes (EMI: ${formatCurrency(item.profile.user.profile.totalEmi || 0)})` : 'No'}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span style={{ color: colors.textSecondary }}>Health Insurance</span>
                                <span className="font-medium" style={{ color: item.profile.user?.profile?.hasHealthInsurance ? colors.success : colors.error }}>
                                  {item.profile.user?.profile?.hasHealthInsurance ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span style={{ color: colors.textSecondary }}>Life Insurance</span>
                                <span className="font-medium" style={{ color: item.profile.user?.profile?.hasLifeInsurance ? colors.success : colors.error }}>
                                  {item.profile.user?.profile?.hasLifeInsurance ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Current Investments */}
                        {item.profile.user?.profile?.currentInvestments && (
                          <div className="mt-4">
                            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>
                              Current Investments
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(item.profile.user.profile.currentInvestments).map(([inv, hasIt]) => (
                                <span
                                  key={inv}
                                  className="text-xs px-2 py-1 rounded"
                                  style={{
                                    background: hasIt ? `${colors.success}15` : `${colors.textTertiary}10`,
                                    color: hasIt ? colors.success : colors.textTertiary,
                                    border: `1px solid ${hasIt ? `${colors.success}25` : `${colors.textTertiary}15`}`,
                                    textDecoration: hasIt ? 'none' : 'line-through',
                                  }}
                                >
                                  {inv.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expanded Recommendations */}
                  {isExpanded && item.recommendations && (
                    <div style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <div className="p-5">
                        {/* Alignment Score */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                              Alignment Score
                            </span>
                            <span className="text-lg font-bold" style={{
                              color: item.recommendations.alignment_score >= 0.9 ? colors.success :
                                     item.recommendations.alignment_score >= 0.7 ? colors.warning : colors.error
                            }}>
                              {(item.recommendations.alignment_score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {item.recommendations.alignment_message}
                          </span>
                        </div>

                        {/* Asset Class Breakdown */}
                        <div className="mb-4">
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                            Asset Allocation
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            {item.recommendations.asset_class_breakdown.map((asset) => (
                              <div
                                key={asset.asset_class}
                                className="flex-1 p-3 rounded-xl text-center"
                                style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
                              >
                                <div className="text-lg font-bold" style={{ color: colors.primary }}>
                                  {(asset.actual_allocation <= 1 ? asset.actual_allocation * 100 : asset.actual_allocation).toFixed(0)}%
                                </div>
                                <div className="text-xs capitalize" style={{ color: colors.textSecondary }}>
                                  {asset.asset_class}
                                </div>
                                {asset.total_amount && (
                                  <div className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                                    {formatCurrency(asset.total_amount)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Funds */}
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                            Recommended Funds ({item.recommendations.recommendations.length})
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            {item.recommendations.recommendations.map((fund) => (
                              <div
                                key={fund.scheme_code}
                                className="p-4 rounded-xl"
                                style={{ background: isDark ? `${colors.primary}10` : `${colors.primary}05`, border: `1px solid ${colors.chipBorder}` }}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                                      {fund.scheme_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary }}>
                                        {fund.category}
                                      </span>
                                      {fund.asset_class && (
                                        <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: `${colors.success}15`, color: colors.success }}>
                                          {fund.asset_class}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right ml-3">
                                    <div className="text-base font-bold" style={{ color: colors.primary }}>
                                      {(fund.suggested_allocation * 100).toFixed(0)}%
                                    </div>
                                    {fund.suggested_amount && (
                                      <div className="text-xs" style={{ color: colors.textSecondary }}>
                                        {formatCurrency(fund.suggested_amount)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                                  {fund.reasoning}
                                </p>
                                {fund.metrics && (
                                  <div className="flex items-center gap-3 text-xs" style={{ color: colors.textTertiary }}>
                                    {fund.metrics.return_3y && <span>3Y: {fund.metrics.return_3y}%</span>}
                                    {fund.metrics.sharpe_ratio && <span>Sharpe: {fund.metrics.sharpe_ratio}</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-xs mt-4 pt-3" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                          <span>Model: {item.recommendations.model_version}</span>
                          <span>Latency: {item.recommendations.latency_ms}ms</span>
                          <span>Classified: {formatDate(item.profile.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded but no recommendations (and no error) */}
                  {isExpanded && !item.recommendations && !item.loading && !item.error && (
                    <div style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: colors.chipBg }}>
                          <svg className="w-6 h-6" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                          No recommendations generated yet
                        </p>
                        <button
                          onClick={() => runRecommendations(item.profile.id)}
                          className="px-4 py-2 rounded-full text-sm font-medium text-white"
                          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                        >
                          Generate Recommendations
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Loading state */}
                  {isExpanded && item.loading && (
                    <div style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }} />
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          Generating recommendations...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default RecommendationsPage
