import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';

// Dynamic import for ECharts (SSR disabled)
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// V4 Color Palette - Refined Blue Theme (Light Mode)
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryDeep: '#1E40AF',
  accent: '#3B82F6',
  secondary: '#0EA5E9',
  secondaryDark: '#0284C7',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  // Glass
  glassBackground: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(37, 99, 235, 0.12)',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  // Table
  tableHeaderBg: 'linear-gradient(90deg, rgba(37, 99, 235, 0.06) 0%, rgba(59, 130, 246, 0.03) 100%)',
  tableRowHover: 'rgba(37, 99, 235, 0.04)',
  tableBorder: 'rgba(37, 99, 235, 0.08)',
  // Input
  inputBg: 'rgba(37, 99, 235, 0.02)',
  inputBorder: 'rgba(37, 99, 235, 0.12)',
  inputFocusShadow: 'rgba(37, 99, 235, 0.12)',
  // Card
  cardBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  // Progress
  progressBg: 'rgba(37, 99, 235, 0.1)',
  // Badge/Chip
  badgeBg: 'rgba(37, 99, 235, 0.08)',
  chipBg: 'rgba(37, 99, 235, 0.06)',
  chipBorder: 'rgba(37, 99, 235, 0.12)',
  // Modal
  cardBackground: '#FFFFFF',
  inputBackground: '#FFFFFF',
};

// V4 Color Palette - Refined Blue Theme (Dark Mode)
const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryDeep: '#2563EB',
  accent: '#93C5FD',
  secondary: '#38BDF8',
  secondaryDark: '#0EA5E9',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  // Backgrounds - Deep navy blue
  background: '#0B1120',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1E293B',
  // Glass
  glassBackground: 'rgba(17, 24, 39, 0.88)',
  glassBorder: 'rgba(96, 165, 250, 0.12)',
  glassShadow: 'rgba(0, 0, 0, 0.35)',
  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  // Table
  tableHeaderBg: 'linear-gradient(90deg, rgba(96, 165, 250, 0.1) 0%, rgba(147, 197, 253, 0.06) 100%)',
  tableRowHover: 'rgba(96, 165, 250, 0.06)',
  tableBorder: 'rgba(96, 165, 250, 0.12)',
  // Input
  inputBg: 'rgba(96, 165, 250, 0.06)',
  inputBorder: 'rgba(96, 165, 250, 0.15)',
  inputFocusShadow: 'rgba(96, 165, 250, 0.15)',
  // Card
  cardBg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  // Progress
  progressBg: 'rgba(96, 165, 250, 0.15)',
  // Badge/Chip
  badgeBg: 'rgba(96, 165, 250, 0.12)',
  chipBg: 'rgba(96, 165, 250, 0.08)',
  chipBorder: 'rgba(96, 165, 250, 0.15)',
  // Modal
  cardBackground: '#111827',
  inputBackground: '#111827',
};

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkClass = document.documentElement.classList.contains('dark');
      const isDarkMedia = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isLightClass = document.documentElement.classList.contains('light');
      setIsDark(isDarkClass || (isDarkMedia && !isLightClass));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  return isDark;
};

// Get colors based on dark mode
const useV4Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT;
};

// Financial Glass Card Component - V4 Theme
const FinancialGlassCard = ({ title, balance, trend, colors }: { title: string; balance: string; trend: number; colors: typeof V4_COLORS_LIGHT }) => {
  return (
    <div className="p-6 rounded-2xl max-w-xs relative overflow-hidden group" style={{
      background: colors.cardBg,
      backdropFilter: 'blur(24px)',
      border: `1px solid ${colors.cardBorder}`,
      boxShadow: `0 8px 32px ${colors.glassShadow}`
    }}>
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/10 to-transparent rotate-12 pointer-events-none" />

      <div className="relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>{title}</span>

        <div className="flex items-baseline gap-0.5 mt-1">
          <span className="text-lg font-bold tabular-data" style={{ color: colors.textPrimary }}>$</span>
          <span className="text-2xl font-bold tracking-tight tabular-data" style={{ color: colors.textPrimary }}>{balance}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full text-xs font-medium tabular-data" style={{
            background: `rgba(${colors.success === '#34D399' ? '52, 211, 153' : '16, 185, 129'}, 0.15)`,
            border: `1px solid rgba(${colors.success === '#34D399' ? '52, 211, 153' : '16, 185, 129'}, 0.25)`,
            color: colors.success
          }}>
            +{trend}%
          </div>
          <span className="text-xs" style={{ color: colors.textSecondary }}>vs last month</span>
        </div>

        <button className="w-full mt-5 px-5 py-2.5 text-white font-semibold text-sm transition-all duration-200" style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          borderRadius: '9999px',
          boxShadow: `0 4px 14px ${colors.glassShadow}`
        }}>
          View Portfolio
        </button>
      </div>
    </div>
  );
};

// Tab Navigation Component
const DesignTabs = ({ active, colors }: { active: 'v1' | 'v2' | 'v3' | 'v4' | 'ios' | 'android'; colors: typeof V4_COLORS_LIGHT }) => {
  const isDark = useDarkMode();
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Link href="/admin/design">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
          active === 'v1'
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
            : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
          v1 — Blue
        </span>
      </Link>
      <Link href="/admin/designv2">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
          active === 'v2'
            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
            : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
          v2 — Purple
        </span>
      </Link>
      <Link href="/admin/designv3">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
          active === 'v3'
            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
            : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
          v3 — Cyan
        </span>
      </Link>
      <Link href="/admin/designv4">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
          active === 'v4'
            ? 'text-white shadow-lg'
            : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`} style={active === 'v4' ? {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          boxShadow: `0 4px 14px ${colors.glassShadow}`
        } : {}}>
          v4 — Refined Blue
        </span>
      </Link>
      <div className="w-px h-8 bg-gray-300 dark:bg-slate-600 mx-1" />
      <Link href="/admin/design-ios">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
          active === 'ios'
            ? 'text-white shadow-lg'
            : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`} style={active === 'ios' ? {
          background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
          boxShadow: '0 4px 14px rgba(0, 122, 255, 0.3)'
        } : {}}>
          iOS
        </span>
      </Link>
      <Link href="/admin/design-android">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
          active === 'android'
            ? 'text-white shadow-lg'
            : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`} style={active === 'android' ? {
          background: 'linear-gradient(135deg, #34A853 0%, #4285F4 100%)',
          boxShadow: '0 4px 14px rgba(52, 168, 83, 0.3)'
        } : {}}>
          Android
        </span>
      </Link>
    </div>
  );
};

const DesignPageV4 = () => {
  const [inputValue, setInputValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectValue, setSelectValue] = useState('option1');
  const colors = useV4Colors();
  const isDark = useDarkMode();

  return (
    <div className="page-shell" style={isDark ? {
      background: `
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(96, 165, 250, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse 60% 40% at 80% 10%, rgba(147, 197, 253, 0.08) 0%, transparent 40%),
        radial-gradient(ellipse 50% 30% at 20% 80%, rgba(56, 189, 248, 0.06) 0%, transparent 40%),
        linear-gradient(180deg, #0B1120 0%, #111827 50%, #0B1120 100%)`
    } : {
      background: `
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse 60% 40% at 80% 10%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
        radial-gradient(ellipse 50% 30% at 20% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 40%),
        linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 50%, #F8FAFC 100%)`
    }}>
      <Navbar mode="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title="Design System"
          subtitle="Manrope Font + Liquid Glass UI — Refined blue for professional fintech"
          badge="v4.0"
        />

        <DesignTabs active="v4" colors={colors} />

        {/* Typography Scale */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-4">Typography Scale</h2>
          <p className="text-secondary mb-6">Compact scale with 14px base, 24px max</p>

          <div className="glass-card p-6">
            <div className="space-y-5">
              {[
                { label: 'Heading 1 — Page Titles', size: '24px / 700', desc: 'Maximum size, hero sections', className: 'h1' },
                { label: 'Heading 2 — Section Headers', size: '20px / 600', desc: 'Section titles', className: 'h2' },
                { label: 'Heading 3 — Card Titles', size: '18px / 600', desc: 'Subsections, card headers', className: 'h3' },
                { label: 'Large Text — Emphasis', size: '16px', desc: 'Important body copy, lead text', className: 'text-lg' },
                { label: 'Base Text — Default Body', size: '14px', desc: 'Standard paragraph text', className: 'text-base' },
                { label: 'Small Text — Secondary', size: '12px', desc: 'Supporting text, captions', className: 'text-sm' },
                { label: 'Extra Small — Fine Print', size: '10px', desc: 'Labels, timestamps, legal', className: 'text-xs' },
              ].map((item, i, arr) => (
                <div key={i} className={i < arr.length - 1 ? 'pb-4' : ''} style={i < arr.length - 1 ? { borderBottom: `1px solid ${colors.tableBorder}` } : {}}>
                  <span className={`${item.className} text-primary`}>{item.label}</span>
                  <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>{item.size} — {item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Financial Utilities */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Financial Utilities</h2>
          <p className="text-secondary mb-6">Specialized typography for financial data</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Tabular Numbers</h3>
              <p className="text-sm text-secondary mb-4">Use <code className="px-2 py-0.5 rounded text-white" style={{ background: colors.primary }}>.tabular-data</code> for aligned figures</p>

              <div className="space-y-2 tabular-data">
                {[
                  { label: 'Portfolio Value', value: '$124,567.89', color: colors.textPrimary },
                  { label: "Today's Gain", value: '+$1,234.56', color: colors.success },
                  { label: 'Total Returns', value: '$45,678.90', color: colors.textPrimary },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>{item.label}</span>
                    <span className="font-semibold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Labels</h3>
              <p className="text-sm text-secondary mb-4">Use <code className="px-2 py-0.5 rounded text-white" style={{ background: colors.primary }}>.label</code> for microcopy</p>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Account Balance</span>
                  <p className="text-2xl font-bold tabular-data mt-1" style={{ color: colors.textPrimary }}>$52,847.32</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Monthly Returns</span>
                  <p className="text-2xl font-bold tabular-data mt-1" style={{ color: colors.success }}>+12.4%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Glass Card Example */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Financial Glass Card</h2>
          <p className="text-secondary mb-6">Premium glass morphism card with refined blue theme</p>

          <div className="flex flex-wrap gap-6">
            <FinancialGlassCard title="Total Balance" balance="127,432" trend={8.4} colors={colors} />
            <FinancialGlassCard title="Monthly Returns" balance="4,892" trend={12.7} colors={colors} />
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Color Palette</h2>

          <div className="glass-card p-6 mb-6">
            <h3 className="h3 text-primary mb-4">Primary Blue Gradient</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { color: colors.primary, label: 'Primary', hex: colors.primary },
                { color: colors.primaryDark, label: 'Primary Dark', hex: colors.primaryDark },
                { color: colors.primaryDeep, label: 'Primary Deep', hex: colors.primaryDeep },
                { color: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, label: 'Blue Gradient', hex: '' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-20 rounded-2xl" style={{ background: item.color }} />
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{item.label}{item.hex && <><br />{item.hex}</>}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 mb-6">
            <h3 className="h3 text-primary mb-4">Secondary Sky Blue</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { color: colors.secondary, label: 'Secondary', hex: colors.secondary },
                { color: colors.secondaryDark, label: 'Secondary Dark', hex: colors.secondaryDark },
                { color: colors.accent, label: 'Accent', hex: colors.accent },
                { color: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`, label: 'Sky-Blue Gradient', hex: '' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-20 rounded-2xl" style={{ background: item.color }} />
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{item.label}{item.hex && <><br />{item.hex}</>}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="h3 text-primary mb-4">Semantic Colors</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { color: colors.success, label: 'Success' },
                { color: colors.warning, label: 'Warning' },
                { color: colors.error, label: 'Error' },
                { color: colors.primary, label: 'Blue' },
                { color: colors.secondary, label: 'Sky' },
                { color: isDark ? '#818CF8' : '#6366F1', label: 'Indigo' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-16 rounded-xl" style={{ background: item.color }} />
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Icons */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Icons</h2>
          <p className="text-secondary mb-6">Common fintech icons with refined blue theme styling</p>

          <div className="glass-card p-8">
            <div className="space-y-8">
              {/* Navigation Icons */}
              <div className="space-y-4">
                <h3 className="h3 text-primary">Navigation Icons</h3>
                <div className="flex flex-wrap items-center gap-6">
                  {[
                    { name: 'Home', path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { name: 'Portfolio', path: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                    { name: 'Analytics', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                    { name: 'Wallet', path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                    { name: 'Settings', path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                    { name: 'User', path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  ].map((icon) => (
                    <div key={icon.name} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: isDark ? colors.backgroundTertiary : `${colors.primary}15` }}>
                        <svg className="w-6 h-6" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{icon.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Icons */}
              <div className="space-y-4">
                <h3 className="h3 text-primary">Action Icons</h3>
                <div className="flex flex-wrap items-center gap-6">
                  {[
                    { name: 'Add', path: 'M12 4v16m8-8H4' },
                    { name: 'Search', path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
                    { name: 'Bell', path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                    { name: 'Download', path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
                    { name: 'Upload', path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
                    { name: 'Refresh', path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
                  ].map((icon) => (
                    <div key={icon.name} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: isDark ? colors.backgroundTertiary : `${colors.primary}15` }}>
                        <svg className="w-6 h-6" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{icon.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Icons */}
              <div className="space-y-4">
                <h3 className="h3 text-primary">Status Icons</h3>
                <div className="flex flex-wrap items-center gap-6">
                  {[
                    { name: 'Trending Up', path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: colors.success, bg: isDark ? `${colors.success}20` : `${colors.success}15` },
                    { name: 'Trending Down', path: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6', color: colors.error, bg: isDark ? `${colors.error}20` : `${colors.error}15` },
                    { name: 'Check', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: colors.success, bg: isDark ? `${colors.success}20` : `${colors.success}15` },
                    { name: 'Warning', path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: colors.warning, bg: isDark ? `${colors.warning}20` : `${colors.warning}15` },
                    { name: 'Error', path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: colors.error, bg: isDark ? `${colors.error}20` : `${colors.error}15` },
                    { name: 'Info', path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: colors.primary, bg: isDark ? `${colors.primary}20` : `${colors.primary}15` },
                  ].map((icon) => (
                    <div key={icon.name} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: icon.bg }}>
                        <svg className="w-6 h-6" style={{ color: icon.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{icon.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finance Icons */}
              <div className="space-y-4">
                <h3 className="h3 text-primary">Finance Icons</h3>
                <div className="flex flex-wrap items-center gap-6">
                  {[
                    { name: 'Currency', path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { name: 'Credit Card', path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                    { name: 'Bank', path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                    { name: 'Receipt', path: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z' },
                    { name: 'Calendar', path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                    { name: 'Document', path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  ].map((icon) => (
                    <div key={icon.name} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: isDark ? colors.backgroundTertiary : `${colors.primary}15` }}>
                        <svg className="w-6 h-6" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{icon.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Buttons</h2>
          <p className="text-secondary mb-6">All buttons use pill shape with refined blue gradient</p>

          <div className="glass-card p-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="h3 text-primary">Primary Buttons</h3>
                <div className="flex flex-wrap items-center gap-4">
                  {['Primary Action', 'Get Started'].map((label, i) => (
                    <button key={i} className="px-5 py-2 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl" style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      borderRadius: '9999px',
                      boxShadow: `0 4px 14px ${colors.glassShadow}`
                    }}>{label}</button>
                  ))}
                  <button className="px-5 py-2 text-white font-semibold text-sm opacity-50 cursor-not-allowed" style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    borderRadius: '9999px'
                  }}>Disabled</button>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Blue gradient with shadow — Main CTA actions</p>
              </div>

              <div className="border-t border-separator pt-8 space-y-4">
                <h3 className="h3 text-primary">Secondary Buttons</h3>
                <div className="flex flex-wrap items-center gap-4">
                  {['Learn More', 'View Details'].map((label, i) => (
                    <button key={i} className="px-5 py-2 font-semibold text-sm transition-all duration-200" style={{
                      background: colors.badgeBg,
                      color: colors.primary,
                      borderRadius: '9999px',
                      border: `1px solid ${colors.chipBorder}`
                    }}>{label}</button>
                  ))}
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Light blue background — Secondary actions</p>
              </div>

              <div className="border-t border-separator pt-8 space-y-4">
                <h3 className="h3 text-primary">Ghost & Glass Buttons</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-5 py-2 font-semibold text-sm transition-all duration-200" style={{
                    color: colors.primary,
                    borderRadius: '9999px'
                  }}>Ghost Button</button>
                  <button className="px-5 py-2 font-semibold text-sm transition-all duration-200" style={{
                    background: colors.chipBg,
                    backdropFilter: 'blur(10px)',
                    color: colors.primary,
                    borderRadius: '9999px',
                    border: `1px solid ${colors.chipBorder}`
                  }}>Glass Button</button>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Subtle options — Tertiary actions, navigation</p>
              </div>

              <div className="border-t border-separator pt-8 space-y-4">
                <h3 className="h3 text-primary">Accent Buttons (Sky)</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-5 py-2 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl" style={{
                    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryDark} 100%)`,
                    borderRadius: '9999px',
                    boxShadow: `0 4px 14px ${isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.3)'}`
                  }}>Start Investing</button>
                  <button className="px-5 py-2 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl" style={{
                    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
                    borderRadius: '9999px',
                    boxShadow: `0 4px 14px ${colors.glassShadow}`
                  }}>Create Portfolio</button>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Sky blue accent — Hero sections, prominent CTAs</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Cards</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="glass-card p-6 h-40 flex items-center justify-center">
                <span className="text-secondary">Glass Card</span>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>Frosted glass with specular highlight</p>
            </div>

            <div>
              <div className="p-6 h-40 flex items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-1" style={{
                background: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 20px ${colors.glassShadow}`
              }}>
                <span style={{ color: colors.textSecondary }}>Blue Tinted Card</span>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>Subtle blue tint, hover lift</p>
            </div>

            <div>
              <div className="rounded-3xl p-6 h-40 flex items-center justify-center" style={{
                background: `linear-gradient(135deg, ${isDark ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.06)'} 0%, ${isDark ? 'rgba(56, 189, 248, 0.04)' : 'rgba(14, 165, 233, 0.03)'} 100%)`,
                backdropFilter: 'blur(24px)',
                border: `1px solid ${colors.cardBorder}`
              }}>
                <span style={{ color: colors.textSecondary }}>Liquid Blue Glass</span>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>Maximum blur with blue-sky gradient</p>
            </div>
          </div>
        </section>

        {/* Information Tiles */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Information Tiles</h2>
          <p className="text-secondary mb-6">Panel backgrounds based on information hierarchy and semantic meaning</p>

          {/* Hierarchy-Based Tiles */}
          <div className="glass-card p-6 mb-6">
            <h3 className="h3 text-primary mb-4">Hierarchy Levels</h3>
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>Use visual weight to establish information importance</p>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Primary - Highest Priority */}
              <div className="p-4 rounded-2xl" style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 8px 32px ${isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.25)'}`
              }}>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">Primary</p>
                <p className="text-xl font-bold text-white">₹12.4 Cr</p>
                <p className="text-sm text-white/80 mt-2">Hero metrics, critical alerts, main CTAs</p>
              </div>

              {/* Secondary - Medium Priority */}
              <div className="p-4 rounded-2xl" style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(56, 189, 248, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)',
                border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.15)'}`,
                boxShadow: `0 4px 20px ${colors.glassShadow}`
              }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.primary }}>Secondary</p>
                <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>₹8.2 Cr</p>
                <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>Supporting stats, section highlights</p>
              </div>

              {/* Tertiary - Lower Priority */}
              <div className="p-4 rounded-2xl" style={{
                background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)'}`
              }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>Tertiary</p>
                <p className="text-xl font-bold" style={{ color: colors.textSecondary }}>₹3.1 Cr</p>
                <p className="text-sm mt-2" style={{ color: colors.textTertiary }}>Background info, metadata, footnotes</p>
              </div>
            </div>
          </div>

          {/* Semantic Tiles */}
          <div className="glass-card p-6 mb-6">
            <h3 className="h3 text-primary mb-4">Semantic Backgrounds</h3>
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>Color-coded panels for different information types</p>

            <div className="grid md:grid-cols-4 gap-4">
              {/* Info */}
              <div className="p-4 rounded-2xl" style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.12) 0%, rgba(96, 165, 250, 0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)',
                border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.12)'}`
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.1)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.primary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold uppercase" style={{ color: colors.primary }}>Info</span>
                </div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Neutral information, tips, guidance</p>
              </div>

              {/* Success */}
              <div className="p-4 rounded-2xl" style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(52, 211, 153, 0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
                border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.12)'}`
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.1)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.success }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold uppercase" style={{ color: colors.success }}>Success</span>
                </div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Positive outcomes, gains, completions</p>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-2xl" style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)',
                border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.12)'}`
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.1)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.warning }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold uppercase" style={{ color: colors.warning }}>Warning</span>
                </div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Cautions, pending actions, reviews</p>
              </div>

              {/* Error */}
              <div className="p-4 rounded-2xl" style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.12) 0%, rgba(248, 113, 113, 0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.03) 100%)',
                border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.12)'}`
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.1)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.error }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold uppercase" style={{ color: colors.error }}>Error</span>
                </div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Alerts, losses, critical issues</p>
              </div>
            </div>
          </div>

          {/* Data Panel Hierarchy */}
          <div className="glass-card p-6">
            <h3 className="h3 text-primary mb-4">Data Panel Hierarchy</h3>
            <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>Nested panels showing parent-child relationships</p>

            <div className="space-y-4">
              {/* Level 1 - Container */}
              <div className="p-5 rounded-2xl" style={{
                background: colors.glassBackground,
                border: `1px solid ${colors.glassBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Level 1 — Section Container</span>
                </div>

                {/* Level 2 - Subsections */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl" style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: `1px solid ${colors.cardBorder}`
                  }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.primaryDark }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primaryDark }}>Level 2 — Subsection</span>
                    </div>

                    {/* Level 3 - Items */}
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5" style={{
                        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                        border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.2)' : 'rgba(226, 232, 240, 0.6)'}`
                      }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: colors.textPrimary }}>Level 3 Item A</span>
                          <span className="text-sm font-bold" style={{ color: colors.primary }}>₹2.4L</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5" style={{
                        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                        border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.2)' : 'rgba(226, 232, 240, 0.6)'}`
                      }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: colors.textPrimary }}>Level 3 Item B</span>
                          <span className="text-sm font-bold" style={{ color: colors.primary }}>₹1.8L</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl" style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: `1px solid ${colors.cardBorder}`
                  }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.primaryDark }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primaryDark }}>Level 2 — Metrics</span>
                    </div>

                    {/* Level 3 - Metric Items */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg text-center" style={{
                        background: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.06)',
                        border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)'}`
                      }}>
                        <p className="text-lg font-bold" style={{ color: colors.success }}>+12.4%</p>
                        <p className="text-xs" style={{ color: colors.textTertiary }}>Returns</p>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{
                        background: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.06)',
                        border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)'}`
                      }}>
                        <p className="text-lg font-bold" style={{ color: colors.primary }}>94.2%</p>
                        <p className="text-xs" style={{ color: colors.textTertiary }}>Accuracy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Opacity Guide */}
            <div className="mt-6 p-4 rounded-xl" style={{ background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.6)' }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>Background Opacity Guide</h4>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'Highest', opacity: isDark ? '0.15' : '0.1', desc: 'KPIs' },
                  { label: 'High', opacity: isDark ? '0.1' : '0.06', desc: 'Sections' },
                  { label: 'Medium', opacity: isDark ? '0.08' : '0.04', desc: 'Cards' },
                  { label: 'Low', opacity: isDark ? '0.05' : '0.02', desc: 'Items' },
                  { label: 'Subtle', opacity: isDark ? '0.03' : '0.01', desc: 'Hover' },
                ].map((level, i) => (
                  <div key={i} className="text-center">
                    <div className="h-12 rounded-lg mb-2" style={{
                      background: isDark
                        ? `rgba(96, 165, 250, ${level.opacity})`
                        : `rgba(37, 99, 235, ${level.opacity})`,
                      border: `1px solid ${colors.cardBorder}`
                    }} />
                    <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>{level.label}</p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>{level.opacity}</p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>{level.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Form Elements</h2>

          <div className="glass-card p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: colors.primary }}>Investment Amount</span>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border transition-all duration-200 tabular-data"
                    style={{
                      background: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.textPrimary,
                      outline: 'none'
                    }}
                    placeholder="$10,000"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${colors.inputFocusShadow}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.inputBorder;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: colors.primary }}>Fund Category</span>
                  <select className="w-full px-4 py-2.5 rounded-xl border" style={{
                    background: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary
                  }}>
                    <option>Large Cap Equity</option>
                    <option>Mid Cap Equity</option>
                    <option>Debt Funds</option>
                  </select>
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: colors.primary }}>Investment Goal</span>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-xl border resize-none"
                    style={{
                      background: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.textPrimary
                    }}
                    rows={4}
                    placeholder="Describe your investment objectives..."
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Badges & Chips */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Badges & Status</h2>

          <div className="glass-card p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="h3 text-primary mb-4">Badges</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Default', bg: colors.badgeBg, color: colors.primary },
                    { label: 'Active', bg: colors.chipBg, color: colors.primary },
                    { label: 'Profit', bg: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: colors.success },
                    { label: 'Loss', bg: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: colors.error },
                  ].map((item, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full" style={{
                      background: item.bg,
                      color: item.color
                    }}>{item.label}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="h3 text-primary mb-4">Chips</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Large Cap', bg: colors.chipBg, color: colors.primaryDark, border: colors.chipBorder },
                    { label: 'Equity', bg: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 165, 233, 0.06)', color: colors.secondary, border: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.12)' },
                    { label: 'Hybrid', bg: isDark ? 'rgba(147, 197, 253, 0.08)' : 'rgba(59, 130, 246, 0.06)', color: colors.accent, border: isDark ? 'rgba(147, 197, 253, 0.15)' : 'rgba(59, 130, 246, 0.12)' },
                    { label: 'Debt', bg: isDark ? 'rgba(129, 140, 248, 0.08)' : 'rgba(99, 102, 241, 0.06)', color: isDark ? '#818CF8' : '#6366F1', border: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.12)' },
                  ].map((item, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full" style={{
                      background: item.bg,
                      color: item.color,
                      border: `1px solid ${item.border}`
                    }}>{item.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modals & Dropdowns */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Modals & Dropdowns</h2>
          <p className="text-secondary mb-6">Interactive overlay components with refined blue theme</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Modal Triggers */}
            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Modals</h3>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>Click buttons to preview modal styles</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    borderRadius: '9999px',
                    boxShadow: `0 4px 14px ${colors.glassShadow}`
                  }}
                >
                  Open Modal
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ background: colors.error }}
                >
                  Confirm Dialog
                </button>
              </div>
            </div>

            {/* Dropdowns */}
            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Dropdowns</h3>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>Menu and select dropdown variants</p>
              <div className="flex flex-wrap gap-4">
                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                    style={{
                      background: colors.inputBackground,
                      border: `1px solid ${dropdownOpen ? colors.primary : colors.inputBorder}`,
                      color: colors.textPrimary
                    }}
                  >
                    <span>Actions</span>
                    <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 rounded-xl shadow-xl py-2 z-50" style={{
                      background: colors.cardBackground,
                      border: `1px solid ${colors.tableBorder}`
                    }}>
                      <button className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors" style={{ color: colors.textPrimary }} onMouseEnter={(e) => e.currentTarget.style.background = `${colors.primary}10`} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View Details
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors" style={{ color: colors.textPrimary }} onMouseEnter={(e) => e.currentTarget.style.background = `${colors.primary}10`} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <div style={{ borderTop: `1px solid ${colors.tableBorder}`, margin: '8px 0' }}></div>
                      <button className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors" style={{ color: colors.error }} onMouseEnter={(e) => e.currentTarget.style.background = `${colors.error}10`} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Native Select */}
                <select
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  className="px-4 py-2 rounded-xl text-sm font-medium focus:outline-none"
                  style={{
                    background: colors.inputBackground,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textPrimary
                  }}
                >
                  <option value="option1">Select Fund Type</option>
                  <option value="equity">Equity Funds</option>
                  <option value="debt">Debt Funds</option>
                  <option value="hybrid">Hybrid Funds</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Preview Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Modal Preview (Static)</h3>
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div className="rounded-2xl shadow-2xl max-w-sm mx-auto overflow-hidden" style={{ background: colors.cardBackground }}>
                  <div className="p-6">
                    <h4 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>Add Investment</h4>
                    <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>Enter the amount you want to invest.</p>
                    <input type="text" placeholder="₹10,000" className="w-full px-4 py-2 rounded-xl text-sm mb-4" style={{ background: colors.inputBackground, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }} />
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: colors.backgroundTertiary, color: colors.textSecondary }}>Cancel</button>
                      <button className="flex-1 px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}>Invest</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Confirm Dialog Preview (Static)</h3>
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div className="rounded-2xl shadow-2xl max-w-sm mx-auto overflow-hidden" style={{ background: colors.cardBackground }}>
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${colors.error}20` }}>
                      <svg className="w-6 h-6" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>Confirm Redemption</h4>
                    <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>Are you sure you want to redeem ₹50,000?</p>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: colors.backgroundTertiary, color: colors.textSecondary }}>Cancel</button>
                      <button className="flex-1 px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: colors.error }}>Redeem</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modal Overlays */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ background: colors.cardBackground }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Add Investment</h4>
                  <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors" style={{ color: colors.textSecondary }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>Enter the amount you want to invest. Minimum investment is ₹500.</p>
                <input type="text" placeholder="₹10,000" className="w-full px-4 py-3 rounded-xl text-sm mb-4 focus:outline-none" style={{ background: colors.inputBackground, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }} />
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors" style={{ background: colors.backgroundTertiary, color: colors.textSecondary }}>Cancel</button>
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}>Invest Now</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <div className="relative rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" style={{ background: colors.cardBackground }}>
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${colors.error}20` }}>
                  <svg className="w-7 h-7" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h4 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>Confirm Redemption</h4>
                <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>Are you sure you want to redeem ₹50,000? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors" style={{ background: colors.backgroundTertiary, color: colors.textSecondary }}>Cancel</button>
                  <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-colors" style={{ background: colors.error }}>Confirm Redeem</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Tables</h2>
          <p className="text-secondary mb-6">Financial data tables with refined blue theme</p>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: colors.tableHeaderBg, borderBottom: `1px solid ${colors.tableBorder}` }}>
                    {['Fund Name', 'Category', 'NAV', 'Units', 'Value', 'Returns'].map((header, i) => (
                      <th key={i} className={`${i < 2 ? 'text-left' : 'text-right'} px-5 py-3 text-xs font-semibold uppercase tracking-wide`} style={{ color: colors.primaryDark }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular-data">
                  {[
                    { name: 'HDFC Mid-Cap Opportunities', category: 'Mid Cap', nav: '142.35', units: '245.678', value: '34,967.42', returns: '+18.4%', positive: true },
                    { name: 'Axis Bluechip Fund', category: 'Large Cap', nav: '56.78', units: '1,234.567', value: '70,098.76', returns: '+12.7%', positive: true },
                    { name: 'SBI Small Cap Fund', category: 'Small Cap', nav: '89.23', units: '567.890', value: '50,678.12', returns: '-3.2%', positive: false },
                    { name: 'ICICI Pru Liquid Fund', category: 'Debt', nav: '312.45', units: '89.234', value: '27,876.54', returns: '+6.8%', positive: true },
                  ].map((row, i) => (
                    <tr key={i} className="transition-colors" style={{ borderBottom: `1px solid ${colors.tableBorder}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.tableRowHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-5 py-3 font-medium" style={{ color: colors.textPrimary }}>{row.name}</td>
                      <td className="px-5 py-3" style={{ color: colors.textSecondary }}>{row.category}</td>
                      <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>₹{row.nav}</td>
                      <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>{row.units}</td>
                      <td className="px-5 py-3 text-right font-medium" style={{ color: colors.textPrimary }}>₹{row.value}</td>
                      <td className="px-5 py-3 text-right font-medium" style={{ color: row.positive ? colors.success : colors.error }}>{row.returns}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: colors.tableHeaderBg, borderTop: `1px solid ${colors.tableBorder}` }}>
                    <td colSpan={4} className="px-5 py-3 font-semibold" style={{ color: colors.textPrimary }}>Total Portfolio Value</td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: colors.primary }}>₹1,83,620.84</td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: colors.success }}>+14.2%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Charts & Visualizations</h2>
          <p className="text-secondary mb-6">ECharts with refined blue theme</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* NAV Trendline */}
            <div className="glass-card p-5">
              <h3 className="h3 text-primary mb-1">NAV Trend</h3>
              <p className="text-xs text-secondary mb-4">12-month performance</p>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255,255,255,0.98)',
                    borderColor: 'rgba(37, 99, 235, 0.15)',
                    borderWidth: 1,
                    textStyle: { color: colors.textPrimary, fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); border-radius: 10px;',
                  },
                  grid: { top: 20, right: 20, bottom: 30, left: 50 },
                  xAxis: {
                    type: 'category',
                    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    axisLine: { lineStyle: { color: 'rgba(37, 99, 235, 0.08)' } },
                    axisLabel: { color: colors.textSecondary, fontSize: 11 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(37, 99, 235, 0.05)', type: 'dashed' } },
                    axisLabel: { color: colors.textSecondary, fontSize: 11 },
                  },
                  series: [{
                    data: [142, 145, 148, 144, 152, 158, 162, 168, 172, 178, 182, 189],
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    showSymbol: false,
                    lineStyle: {
                      width: 3,
                      color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                          { offset: 0, color: colors.primary },
                          { offset: 0.5, color: colors.primaryDark },
                          { offset: 1, color: colors.secondary }
                        ]
                      },
                      shadowColor: 'rgba(37, 99, 235, 0.25)',
                      shadowBlur: 10,
                      shadowOffsetY: 5
                    },
                    itemStyle: { color: colors.primary, borderWidth: 2, borderColor: isDark ? '#111827' : '#fff' },
                    areaStyle: {
                      color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                          { offset: 0, color: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.12)' },
                          { offset: 0.5, color: isDark ? 'rgba(96, 165, 250, 0.05)' : 'rgba(37, 99, 235, 0.04)' },
                          { offset: 1, color: 'rgba(37, 99, 235, 0)' }
                        ]
                      }
                    },
                    emphasis: { focus: 'series', itemStyle: { shadowBlur: 15, shadowColor: 'rgba(37, 99, 235, 0.4)' } }
                  }]
                }}
                style={{ height: 240 }}
              />
            </div>

            {/* Portfolio Allocation Donut */}
            <div className="glass-card p-5">
              <h3 className="h3 text-primary mb-1">Allocation</h3>
              <p className="text-xs text-secondary mb-4">By fund category</p>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255,255,255,0.98)',
                    borderColor: 'rgba(37, 99, 235, 0.15)',
                    borderWidth: 1,
                    textStyle: { color: colors.textPrimary, fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); border-radius: 10px;',
                    formatter: '{b}: <strong>{d}%</strong>'
                  },
                  legend: {
                    orient: 'vertical',
                    right: 10,
                    top: 'center',
                    textStyle: { color: colors.textSecondary, fontSize: 11 },
                    itemWidth: 12,
                    itemHeight: 12,
                    itemGap: 12
                  },
                  series: [{
                    type: 'pie',
                    radius: ['48%', '72%'],
                    center: ['35%', '50%'],
                    avoidLabelOverlap: false,
                    label: { show: false },
                    itemStyle: {
                      borderRadius: 6,
                      borderColor: isDark ? '#111827' : '#fff',
                      borderWidth: 2,
                      shadowBlur: 8,
                      shadowColor: 'rgba(0, 0, 0, 0.08)'
                    },
                    emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(37, 99, 235, 0.25)' } },
                    data: [
                      { value: 40, name: 'Large Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: colors.primary }, { offset: 1, color: colors.primaryDark }] } } },
                      { value: 25, name: 'Mid Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: colors.secondary }, { offset: 1, color: colors.secondaryDark }] } } },
                      { value: 20, name: 'Small Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: colors.accent }, { offset: 1, color: '#60A5FA' }] } } },
                      { value: 15, name: 'Debt', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#6366F1' }, { offset: 1, color: '#4F46E5' }] } } },
                    ]
                  }]
                }}
                style={{ height: 240 }}
              />
            </div>

            {/* Returns Comparison Bar */}
            <div className="glass-card p-5">
              <h3 className="h3 text-primary mb-1">Returns Comparison</h3>
              <p className="text-xs text-secondary mb-4">CAGR by fund type</p>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255,255,255,0.98)',
                    borderColor: 'rgba(37, 99, 235, 0.15)',
                    borderWidth: 1,
                    textStyle: { color: colors.textPrimary, fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); border-radius: 10px;',
                    formatter: '{b}: <strong>{c}%</strong>'
                  },
                  grid: { top: 20, right: 20, bottom: 40, left: 50 },
                  xAxis: {
                    type: 'category',
                    data: ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'Debt'],
                    axisLine: { lineStyle: { color: 'rgba(37, 99, 235, 0.08)' } },
                    axisLabel: { color: colors.textSecondary, fontSize: 10 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(37, 99, 235, 0.05)', type: 'dashed' } },
                    axisLabel: { color: colors.textSecondary, fontSize: 11, formatter: '{value}%' },
                  },
                  series: [{
                    data: [
                      { value: 14.2, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors.primary }, { offset: 1, color: colors.primaryDark }] }, shadowColor: 'rgba(37, 99, 235, 0.25)', shadowBlur: 8 } },
                      { value: 18.5, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors.secondary }, { offset: 1, color: colors.secondaryDark }] }, shadowColor: 'rgba(14, 165, 233, 0.25)', shadowBlur: 8 } },
                      { value: 22.8, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors.accent }, { offset: 1, color: '#60A5FA' }] }, shadowColor: 'rgba(59, 130, 246, 0.25)', shadowBlur: 8 } },
                      { value: 16.4, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366F1' }, { offset: 1, color: '#4F46E5' }] }, shadowColor: 'rgba(99, 102, 241, 0.25)', shadowBlur: 8 } },
                      { value: 7.2, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#64748B' }, { offset: 1, color: '#475569' }] }, shadowColor: 'rgba(100, 116, 139, 0.25)', shadowBlur: 8 } },
                    ],
                    type: 'bar',
                    barWidth: '55%',
                    itemStyle: { borderRadius: [6, 6, 0, 0] },
                    emphasis: { itemStyle: { shadowBlur: 15, shadowColor: 'rgba(37, 99, 235, 0.35)' } }
                  }]
                }}
                style={{ height: 240 }}
              />
            </div>

            {/* Multi-line Performance */}
            <div className="glass-card p-5">
              <h3 className="h3 text-primary mb-1">Performance Comparison</h3>
              <p className="text-xs text-secondary mb-4">Fund vs Benchmark vs Index</p>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255,255,255,0.98)',
                    borderColor: 'rgba(37, 99, 235, 0.15)',
                    borderWidth: 1,
                    textStyle: { color: colors.textPrimary, fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); border-radius: 10px;',
                  },
                  legend: {
                    data: ['Fund', 'Benchmark', 'Nifty 50'],
                    bottom: 0,
                    textStyle: { color: colors.textSecondary, fontSize: 11 },
                    itemWidth: 20,
                    itemHeight: 3,
                    itemGap: 20
                  },
                  grid: { top: 20, right: 20, bottom: 50, left: 50 },
                  xAxis: {
                    type: 'category',
                    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    axisLine: { lineStyle: { color: 'rgba(37, 99, 235, 0.08)' } },
                    axisLabel: { color: colors.textSecondary, fontSize: 11 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(37, 99, 235, 0.05)', type: 'dashed' } },
                    axisLabel: { color: colors.textSecondary, fontSize: 11 },
                  },
                  series: [
                    {
                      name: 'Fund',
                      data: [100, 105, 108, 112, 118, 124],
                      type: 'line',
                      smooth: true,
                      symbol: 'circle',
                      symbolSize: 6,
                      showSymbol: false,
                      lineStyle: { color: colors.primary, width: 3, shadowColor: 'rgba(37, 99, 235, 0.25)', shadowBlur: 8, shadowOffsetY: 4 },
                      itemStyle: { color: colors.primary },
                      emphasis: { focus: 'series' }
                    },
                    {
                      name: 'Benchmark',
                      data: [100, 103, 106, 109, 113, 117],
                      type: 'line',
                      smooth: true,
                      symbol: 'circle',
                      symbolSize: 6,
                      showSymbol: false,
                      lineStyle: { color: colors.secondary, width: 2.5, shadowColor: 'rgba(14, 165, 233, 0.2)', shadowBlur: 6, shadowOffsetY: 3 },
                      itemStyle: { color: colors.secondary },
                      emphasis: { focus: 'series' }
                    },
                    {
                      name: 'Nifty 50',
                      data: [100, 102, 104, 107, 110, 114],
                      type: 'line',
                      smooth: true,
                      symbol: 'none',
                      lineStyle: { color: colors.textTertiary, width: 2, type: 'dashed' },
                      emphasis: { focus: 'series' }
                    }
                  ]
                }}
                style={{ height: 240 }}
              />
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Progress Indicators</h2>

          <div className="glass-card p-6 space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Goal Progress</span>
                <span className="text-sm font-semibold tabular-data" style={{ color: colors.primary }}>65%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                <div className="h-full rounded-full" style={{
                  width: '65%',
                  background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Portfolio Allocation</span>
                <span className="text-sm font-semibold tabular-data" style={{ color: colors.primary }}>80%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                <div className="h-full rounded-full" style={{
                  width: '80%',
                  background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 50%, ${colors.secondary} 100%)`
                }} />
              </div>
            </div>
          </div>
        </section>

        {/* Spacing Reference */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Spacing Scale</h2>
          <p className="text-secondary mb-6">Use Tailwind spacing utilities: p-*, m-*, gap-*</p>

          <div className="glass-card p-6">
            <div className="space-y-3">
              {[
                { size: 1, px: 4 },
                { size: 2, px: 8 },
                { size: 4, px: 16 },
                { size: 6, px: 24 },
                { size: 8, px: 32 },
                { size: 12, px: 48 },
              ].map(({ size, px }) => (
                <div key={size} className="flex items-center gap-4">
                  <span className="w-16 text-xs tabular-data" style={{ color: colors.textTertiary }}>{px}px</span>
                  <div
                    className="h-4 rounded"
                    style={{
                      width: `${px * 3}px`,
                      background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                    }}
                  />
                  <span className="text-xs" style={{ color: colors.textSecondary }}>p-{size}, m-{size}, gap-{size}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default DesignPageV4;
