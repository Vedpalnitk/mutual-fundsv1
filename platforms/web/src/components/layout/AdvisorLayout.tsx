import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useMemo, ReactNode } from 'react'
import NotificationCenter from '@/components/advisor/NotificationCenter'
import { FANotificationProvider } from '@/components/advisor/shared/FANotification'
import { getAuthToken, clearAuthToken, authProfileApi, AuthProfile } from '@/services/api'

// FA Portal color palette - Main Design (Blue/Cyan)
const COLORS_LIGHT = {
  // Primary Blue
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryDeep: '#1D4ED8',
  accent: '#60A5FA',

  // Secondary Cyan
  secondary: '#38BDF8',
  secondaryDark: '#0EA5E9',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  sidebarBg: 'rgba(255, 255, 255, 0.85)',
  cardBg: 'rgba(255, 255, 255, 0.9)',

  // Glass (Subtle)
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(59, 130, 246, 0.1)',
  glassShadow: 'rgba(59, 130, 246, 0.06)',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  // Borders & Effects
  separator: 'rgba(59, 130, 246, 0.1)',

  // States
  hoverBg: 'rgba(59, 130, 246, 0.08)',
  activeBg: 'rgba(59, 130, 246, 0.15)',

  // Cards
  cardBorder: 'rgba(59, 130, 246, 0.08)',
  cardGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(56, 189, 248, 0.01) 100%)',

  // Inputs
  inputBg: 'rgba(59, 130, 246, 0.02)',
  inputBorder: 'rgba(59, 130, 246, 0.1)',

  // Chips/Badges
  chipBg: 'rgba(59, 130, 246, 0.04)',
  chipBorder: 'rgba(59, 130, 246, 0.1)',
}

const COLORS_DARK = {
  // Primary Blue (Soft for dark mode)
  primary: '#93C5FD',
  primaryDark: '#60A5FA',
  primaryDeep: '#3B82F6',
  accent: '#BFDBFE',

  // Secondary Cyan
  secondary: '#7DD3FC',
  secondaryDark: '#38BDF8',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',

  // Backgrounds - Deep navy
  background: '#0B1120',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1E293B',
  sidebarBg: 'rgba(17, 24, 39, 0.85)',
  cardBg: 'rgba(17, 24, 39, 0.65)',

  // Glass (Subtle)
  glassBackground: 'rgba(17, 24, 39, 0.85)',
  glassBorder: 'rgba(147, 197, 253, 0.1)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textTertiary: '#94A3B8',

  // Borders & Effects
  separator: 'rgba(147, 197, 253, 0.1)',

  // States
  hoverBg: 'rgba(147, 197, 253, 0.1)',
  activeBg: 'rgba(147, 197, 253, 0.2)',

  // Cards
  cardBorder: 'rgba(147, 197, 253, 0.12)',
  cardGradient: 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(125, 211, 252, 0.03) 100%)',

  // Inputs
  inputBg: 'rgba(147, 197, 253, 0.04)',
  inputBorder: 'rgba(147, 197, 253, 0.12)',

  // Chips/Badges
  chipBg: 'rgba(147, 197, 253, 0.06)',
  chipBorder: 'rgba(147, 197, 253, 0.12)',
}

// Navigation items for Financial Advisor
const ADVISOR_NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/advisor/dashboard', icon: 'home' },
    ]
  },
  {
    section: 'Client Management',
    items: [
      { label: 'Clients', href: '/advisor/clients', icon: 'users' },
      { label: 'Pipeline', href: '/advisor/pipeline', icon: 'user-plus' },
      { label: 'Transactions', href: '/advisor/transactions', icon: 'arrows' },
      { label: 'Command Center', href: '/advisor/command-center', icon: 'clipboard' },
      { label: 'Insights', href: '/advisor/insights', icon: 'insights' },
    ]
  },
  {
    section: 'Business',
    items: [
      { label: 'AUM & Analytics', href: '/advisor/business', icon: 'chart-bar' },
      { label: 'Commissions', href: '/advisor/commissions', icon: 'banknotes' },
      { label: 'Team', href: '/advisor/team', icon: 'user-group' },
      { label: 'Branches', href: '/advisor/branches', icon: 'building' },
      { label: 'Compliance', href: '/advisor/compliance', icon: 'shield-check' },
    ]
  },
  {
    section: 'Research',
    items: [
      { label: 'Funds', href: '/advisor/funds', icon: 'trending-up' },
      { label: 'Compare', href: '/advisor/compare', icon: 'scale' },
      { label: 'My Picks', href: '/advisor/my-picks', icon: 'star' },
      { label: 'Deep Analysis', href: '/advisor/analysis', icon: 'chart' },
      { label: 'Calculators', href: '/advisor/calculators', icon: 'calculator' },
      { label: 'Reports', href: '/advisor/reports', icon: 'document' },
    ]
  },
  {
    section: 'Account',
    items: [
      { label: 'Settings', href: '/advisor/settings', icon: 'settings' },
    ]
  },
]

// Icon component
const NavIcon = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    'home': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    'users': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    'user-plus': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    ),
    'arrows': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    'insights': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    'trending-up': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    'chart': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    'document': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    'scale': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
    'calculator': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm1.498 2.25h.008v.008h-.008v-.008zm-1.498-9h7.5a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75v-.75a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H6.75A.75.75 0 016 8.25v-1.5z" />
      </svg>
    ),
    'message': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    'star': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    'bell-alert': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    'clipboard': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    'chart-bar': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    'banknotes': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    'user-group': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    'building': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    'shield-check': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    'sparkles': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    'settings': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'chevron-left': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    ),
    'chevron-right': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    ),
    'sun': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    'moon': (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    ),
  }
  return icons[name] || null
}

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

interface AdvisorLayoutProps {
  children: ReactNode
  title?: string
}

export default function AdvisorLayout({ children, title }: AdvisorLayoutProps) {
  const router = useRouter()
  const isDark = useDarkMode()
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasToken, setHasToken] = useState(true) // Assume true initially to avoid flash
  const [advisorProfile, setAdvisorProfile] = useState<AuthProfile | null>(null)

  // Auth check - redirect to login if no token or wrong role
  useEffect(() => {
    // Portal boundary check
    const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOSTNAME?.split(':')[0] || ''
    if (adminHost && window.location.hostname === adminHost) {
      window.location.href = '/404'
      return
    }

    const token = getAuthToken()
    if (!token) {
      setHasToken(false)
      window.location.href = '/advisor/login'
      return
    }
    // Verify user has advisor/fa_staff role (not admin)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const validRoles = ['advisor', 'fa_staff']
      if (!validRoles.includes(payload.role)) {
        clearAuthToken()
        setHasToken(false)
        window.location.href = '/advisor/login'
      }
    } catch {
      clearAuthToken()
      setHasToken(false)
      window.location.href = '/advisor/login'
    }
  }, [])

  // Fetch advisor profile for sidebar
  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    authProfileApi.get()
      .then(data => setAdvisorProfile(data))
      .catch(() => {}) // Silently fail — non-critical for layout
  }, [])

  const handleLogout = () => {
    clearAuthToken()
    window.location.href = '/advisor/login'
  }

  // Decode JWT to check if user is staff
  const staffInfo = useMemo(() => {
    try {
      const token = getAuthToken()
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role === 'fa_staff') {
        return {
          allowedPages: (payload.allowedPages as string[]) || [],
        }
      }
    } catch {}
    return null
  }, [])

  // Filter nav items for staff users
  const navItems = useMemo(() => {
    if (!staffInfo) return ADVISOR_NAV_ITEMS
    const allowed = new Set(staffInfo.allowedPages)
    return ADVISOR_NAV_ITEMS
      .map(section => ({
        ...section,
        items: section.items.filter(item => allowed.has(item.href)),
      }))
      .filter(section => section.items.length > 0)
  }, [staffInfo])

  // Route guard: redirect staff to first allowed page if on disallowed page
  useEffect(() => {
    if (!staffInfo) return
    const currentPath = router.asPath.split('?')[0]
    const isAllowed = staffInfo.allowedPages.some(
      page => currentPath === page || currentPath.startsWith(page + '/')
    )
    if (!isAllowed) {
      const firstAllowed = staffInfo.allowedPages[0] || '/advisor/dashboard'
      router.replace(firstAllowed)
    }
  }, [router.asPath, staffInfo])

  // Don't render anything while redirecting
  if (!hasToken) {
    return null
  }

  const isActiveLink = (href: string) => {
    return router.pathname === href || router.asPath.startsWith(href + '?')
  }

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [router.pathname])

  return (
    <FANotificationProvider>
    <div className="min-h-screen flex" style={{ background: colors.background, fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-64 transition-all duration-300 flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-40 ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
        style={{
          background: colors.sidebarBg,
          backdropFilter: 'blur(50px) saturate(180%)',
          WebkitBackdropFilter: 'blur(50px) saturate(180%)',
          borderRight: `0.5px solid ${colors.glassBorder}`,
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center justify-between px-4"
          style={{ borderBottom: `0.5px solid ${colors.separator}` }}
        >
          <Link href="/advisor/dashboard" className="flex items-center gap-3">
            <img
              src="/icon-192.png"
              alt="Sparrow"
              className="w-10 h-10 rounded-xl flex-shrink-0"
              style={{
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
                filter: isDark
                  ? 'brightness(1.25) saturate(1.1)'
                  : undefined,
              }}
            />
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  Sparrow
                </p>
                <p className="text-xs font-medium" style={{ color: staffInfo ? colors.warning : colors.primary }}>
                  {staffInfo ? 'Staff Access' : 'Financial Advisor'}
                </p>
              </div>
            )}
          </Link>
          {/* Collapse button - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-colors hidden lg:block"
            style={{ color: colors.textSecondary }}
          >
            <NavIcon name={collapsed ? 'chevron-right' : 'chevron-left'} className="w-4 h-4" />
          </button>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg transition-colors lg:hidden"
            style={{ color: colors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map((section, idx) => (
            <div key={section.section} className={idx > 0 ? 'mt-6' : ''}>
              {!collapsed && (
                <p
                  className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: colors.textTertiary }}
                >
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isActiveLink(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        collapsed ? 'lg:justify-center' : ''
                      }`}
                      style={{
                        background: isActive ? colors.activeBg : 'transparent',
                        color: isActive ? colors.primary : colors.textSecondary,
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <NavIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                      {/* Always show labels on mobile sidebar */}
                      {collapsed && (
                        <span className="text-sm font-medium lg:hidden">{item.label}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* FA Profile Card */}
        {advisorProfile && (
          <div
            className="px-3 pb-4"
            style={{ borderTop: `0.5px solid ${colors.separator}` }}
          >
            <Link
              href="/advisor/settings"
              className={`flex items-center gap-3 px-3 py-3 mt-3 rounded-xl transition-all hover:scale-[1.01] ${
                collapsed ? 'lg:justify-center' : ''
              }`}
              style={{
                background: colors.chipBg,
                border: `1px solid ${colors.chipBorder}`,
              }}
              title={collapsed ? `${advisorProfile.advisorProfile?.companyName || advisorProfile.advisorProfile?.displayName || advisorProfile.name}` : undefined}
            >
              {/* Logo / Avatar / Initials */}
              {advisorProfile.advisorProfile?.companyLogoUrl ? (
                <img
                  src={advisorProfile.advisorProfile.companyLogoUrl}
                  alt="Company logo"
                  className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                  style={{ border: `1px solid ${colors.chipBorder}` }}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    color: '#FFFFFF',
                  }}
                >
                  {(advisorProfile.advisorProfile?.displayName || advisorProfile.name || 'A')
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              {!collapsed && (
                <div className="overflow-hidden min-w-0">
                  {advisorProfile.advisorProfile?.companyName && (
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: colors.textPrimary }}
                    >
                      {advisorProfile.advisorProfile.companyName}
                    </p>
                  )}
                  <p
                    className="text-xs truncate"
                    style={{ color: colors.textTertiary }}
                  >
                    {advisorProfile.advisorProfile?.displayName || advisorProfile.name}
                  </p>
                </div>
              )}
              {/* Always show name on mobile sidebar */}
              {collapsed && (
                <div className="overflow-hidden min-w-0 lg:hidden">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: colors.textPrimary }}
                  >
                    {advisorProfile.advisorProfile?.companyName || advisorProfile.advisorProfile?.displayName || advisorProfile.name}
                  </p>
                </div>
              )}
            </Link>
          </div>
        )}

      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{
            background: colors.sidebarBg,
            backdropFilter: 'blur(50px) saturate(180%)',
            WebkitBackdropFilter: 'blur(50px) saturate(180%)',
            borderBottom: `0.5px solid ${colors.glassBorder}`,
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger - mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg transition-colors lg:hidden"
              style={{ color: colors.textSecondary }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            {title && (
              <h1 className="text-lg sm:text-xl font-semibold" style={{ color: colors.textPrimary }}>
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Client count badge - hidden on small screens */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: colors.chipBg,
                border: `1px solid ${colors.chipBorder}`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: colors.success }}
              />
              <span className="text-xs font-medium" style={{ color: colors.primary }}>
                12 Active Clients
              </span>
            </div>
            {/* Notification Center */}
            <NotificationCenter colors={colors} />
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all hover:shadow-lg hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: '#FFFFFF',
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
    </FANotificationProvider>
  )
}

// Export colors for use in pages
export { COLORS_LIGHT, COLORS_DARK, useDarkMode }
export type { AdvisorLayoutProps }
