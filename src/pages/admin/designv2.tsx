import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';

// Dynamic import for ECharts (SSR disabled)
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// V2 Color Palette - Purple/Violet Theme (Light Mode)
const V2_COLORS_LIGHT = {
  primary: '#7C3AED',
  primaryDark: '#5B21B6',
  primaryDeep: '#4C1D95',
  accent: '#A855F7',
  secondary: '#EC4899',
  secondaryDark: '#DB2777',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8F5FF',
  backgroundTertiary: '#F3EEFF',
  // Glass
  glassBackground: 'rgba(255, 255, 255, 0.78)',
  glassBorder: 'rgba(124, 58, 237, 0.15)',
  glassShadow: 'rgba(124, 58, 237, 0.1)',
  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  // Table
  tableHeaderBg: 'linear-gradient(90deg, rgba(124, 58, 237, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
  tableRowHover: 'rgba(124, 58, 237, 0.04)',
  tableBorder: 'rgba(124, 58, 237, 0.1)',
  // Input
  inputBg: 'rgba(124, 58, 237, 0.03)',
  inputBorder: 'rgba(124, 58, 237, 0.15)',
  inputFocusShadow: 'rgba(124, 58, 237, 0.1)',
  inputBackground: '#FFFFFF',
  // Card
  cardBg: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
  cardBorder: 'rgba(124, 58, 237, 0.15)',
  cardBackground: '#FFFFFF',
  // Progress
  progressBg: 'rgba(124, 58, 237, 0.12)',
  // Badge/Chip
  badgeBg: 'rgba(124, 58, 237, 0.1)',
  chipBg: 'rgba(124, 58, 237, 0.08)',
  chipBorder: 'rgba(124, 58, 237, 0.15)',
};

// V2 Color Palette - Purple/Violet Theme (Dark Mode)
const V2_COLORS_DARK = {
  primary: '#A78BFA',
  primaryDark: '#8B5CF6',
  primaryDeep: '#7C3AED',
  accent: '#C4B5FD',
  secondary: '#F472B6',
  secondaryDark: '#EC4899',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  // Backgrounds - Deep purple-navy
  background: '#0D0A1A',
  backgroundSecondary: '#1A1428',
  backgroundTertiary: '#251D3A',
  // Glass
  glassBackground: 'rgba(26, 20, 40, 0.85)',
  glassBorder: 'rgba(167, 139, 250, 0.15)',
  glassShadow: 'rgba(0, 0, 0, 0.4)',
  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  // Table
  tableHeaderBg: 'linear-gradient(90deg, rgba(167, 139, 250, 0.12) 0%, rgba(196, 181, 253, 0.08) 100%)',
  tableRowHover: 'rgba(167, 139, 250, 0.08)',
  tableBorder: 'rgba(167, 139, 250, 0.15)',
  // Input
  inputBg: 'rgba(167, 139, 250, 0.08)',
  inputBorder: 'rgba(167, 139, 250, 0.2)',
  inputFocusShadow: 'rgba(167, 139, 250, 0.15)',
  inputBackground: '#1A1428',
  // Card
  cardBg: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(196, 181, 253, 0.05) 100%)',
  cardBorder: 'rgba(167, 139, 250, 0.2)',
  cardBackground: '#1A1428',
  // Progress
  progressBg: 'rgba(167, 139, 250, 0.2)',
  // Badge/Chip
  badgeBg: 'rgba(167, 139, 250, 0.15)',
  chipBg: 'rgba(167, 139, 250, 0.1)',
  chipBorder: 'rgba(167, 139, 250, 0.2)',
};

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for class-based dark mode
    const checkDarkMode = () => {
      const isDarkClass = document.documentElement.classList.contains('dark');
      const isDarkMedia = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isLightClass = document.documentElement.classList.contains('light');

      setIsDark(isDarkClass || (isDarkMedia && !isLightClass));
    };

    checkDarkMode();

    // Listen for class changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Listen for media query changes
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
const useV2Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V2_COLORS_DARK : V2_COLORS_LIGHT;
};

// Financial Glass Card Component - V2 Theme
const FinancialGlassCard = ({ title, balance, trend, colors }: { title: string; balance: string; trend: number; colors: typeof V2_COLORS_LIGHT }) => {
  return (
    <div className="p-6 rounded-2xl max-w-xs relative overflow-hidden group" style={{
      background: colors.cardBg,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${colors.cardBorder}`,
      boxShadow: `0 8px 32px ${colors.glassShadow}`
    }}>
      {/* Refractive Highlight */}
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-400/10 to-transparent rotate-12 pointer-events-none" />

      <div className="relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>{title}</span>

        <div className="flex items-baseline gap-0.5 mt-1">
          <span className="text-lg font-bold tabular-data" style={{ color: colors.textPrimary }}>$</span>
          <span className="text-2xl font-bold tracking-tight tabular-data" style={{ color: colors.textPrimary }}>{balance}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full text-xs font-medium tabular-data" style={{
            background: `rgba(${colors.success === '#34D399' ? '52, 211, 153' : '16, 185, 129'}, 0.2)`,
            border: `1px solid rgba(${colors.success === '#34D399' ? '52, 211, 153' : '16, 185, 129'}, 0.3)`,
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
const DesignTabs = ({ active, colors }: { active: 'v1' | 'v2' | 'v3' | 'v4' | 'ios' | 'android'; colors: typeof V2_COLORS_LIGHT }) => {
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
            ? 'text-white shadow-lg'
            : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`} style={active === 'v2' ? {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          boxShadow: `0 4px 14px ${colors.glassShadow}`
        } : {}}>
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
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
            : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
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

const DesignPageV2 = () => {
  const [inputValue, setInputValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectValue, setSelectValue] = useState('option1');
  const colors = useV2Colors();
  const isDark = useDarkMode();

  return (
    <div className="page-shell" style={isDark ? {
      background: `
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(167, 139, 250, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse 60% 40% at 80% 10%, rgba(196, 181, 253, 0.1) 0%, transparent 40%),
        radial-gradient(ellipse 50% 30% at 20% 80%, rgba(244, 114, 182, 0.08) 0%, transparent 40%),
        linear-gradient(180deg, #0D0A1A 0%, #1A1428 50%, #0D0A1A 100%)`
    } : {
      background: `
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse 60% 40% at 80% 10%, rgba(168, 85, 247, 0.08) 0%, transparent 40%),
        radial-gradient(ellipse 50% 30% at 20% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 40%),
        linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 50%, #FAF5FF 100%)`
    }}>
      <Navbar mode="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title="Design System"
          subtitle="Inter Font + Liquid Glass UI — Purple/Violet variant for premium fintech"
          badge="v2.0"
        />

        <DesignTabs active="v2" colors={colors} />

        {/* Typography Scale */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-4">Typography Scale</h2>
          <p className="text-secondary mb-6">Compact scale with 14px base, 24px max</p>

          <div className="glass-card p-6">
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-4">
                <span className="h1 text-primary">Heading 1 — Page Titles</span>
                <p className="text-xs text-tertiary mt-1">24px / 700 — Maximum size, hero sections</p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <span className="h2 text-primary">Heading 2 — Section Headers</span>
                <p className="text-xs text-tertiary mt-1">20px / 600 — Section titles</p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <span className="h3 text-primary">Heading 3 — Card Titles</span>
                <p className="text-xs text-tertiary mt-1">18px / 600 — Subsections, card headers</p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <p className="text-lg text-primary">Large Text — Emphasis</p>
                <p className="text-xs text-tertiary mt-1">16px — Important body copy, lead text</p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <p className="text-base text-primary">Base Text — Default Body</p>
                <p className="text-xs text-tertiary mt-1">14px — Standard paragraph text</p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-primary">Small Text — Secondary</p>
                <p className="text-xs text-tertiary mt-1">12px — Supporting text, captions</p>
              </div>

              <div>
                <p className="text-xs text-primary">Extra Small — Fine Print</p>
                <p className="text-xs text-tertiary mt-1">10px — Labels, timestamps, legal</p>
              </div>
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
                <div className="flex justify-between">
                  <span className="text-secondary">Portfolio Value</span>
                  <span className="font-semibold">$124,567.89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Today's Gain</span>
                  <span className="font-semibold text-green">+$1,234.56</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Total Returns</span>
                  <span className="font-semibold">$45,678.90</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Labels</h3>
              <p className="text-sm text-secondary mb-4">Use <code className="px-2 py-0.5 rounded text-white" style={{ background: colors.primary }}>.label</code> for microcopy</p>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Account Balance</span>
                  <p className="text-2xl font-bold tabular-data mt-1">$52,847.32</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Monthly Returns</span>
                  <p className="text-2xl font-bold tabular-data mt-1 text-green">+12.4%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Glass Card Example */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Financial Glass Card</h2>
          <p className="text-secondary mb-6">Premium glass morphism card with purple theme</p>

          <div className="flex flex-wrap gap-6">
            <FinancialGlassCard
              title="Total Balance"
              balance="127,432"
              trend={8.4}
              colors={colors}
            />
            <FinancialGlassCard
              title="Monthly Returns"
              balance="4,892"
              trend={12.7}
              colors={colors}
            />
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Color Palette</h2>

          <div className="glass-card p-6 mb-6">
            <h3 className="h3 text-primary mb-4">Primary Purple Gradient</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: colors.primary }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Primary<br />{colors.primary}</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: colors.primaryDark }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Primary Dark<br />{colors.primaryDark}</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: colors.primaryDeep }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Primary Deep<br />{colors.primaryDeep}</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Purple Gradient</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 mb-6">
            <h3 className="h3 text-primary mb-4">Secondary Pink Accent</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: colors.secondary }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Secondary<br />{colors.secondary}</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: colors.secondaryDark }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Secondary Dark<br />{colors.secondaryDark}</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: colors.accent }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Accent<br />{colors.accent}</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)` }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Pink-Purple Gradient</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="h3 text-primary mb-4">Semantic Colors</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <div className="h-16 rounded-xl" style={{ background: colors.success }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl" style={{ background: colors.warning }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Warning</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl" style={{ background: colors.error }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Error</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl" style={{ background: colors.primary }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Purple</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl" style={{ background: colors.secondary }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Pink</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl" style={{ background: isDark ? '#818CF8' : '#6366F1' }} />
                <p className="text-xs" style={{ color: colors.textSecondary }}>Indigo</p>
              </div>
            </div>
          </div>
        </section>

        {/* Icons */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Icons</h2>
          <p className="text-secondary mb-6">Common fintech icons with purple theme styling</p>

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
          <p className="text-secondary mb-6">All buttons use pill shape with purple gradient theme</p>

          <div className="glass-card p-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="h3 text-primary">Primary Buttons</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-5 py-2 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl" style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    borderRadius: '9999px',
                    boxShadow: `0 4px 14px ${colors.glassShadow}`
                  }}>Primary Action</button>
                  <button className="px-5 py-2 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl" style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    borderRadius: '9999px',
                    boxShadow: `0 4px 14px ${colors.glassShadow}`
                  }}>Get Started</button>
                  <button className="px-5 py-2 text-white font-semibold text-sm opacity-50 cursor-not-allowed" style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    borderRadius: '9999px'
                  }}>Disabled</button>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Purple gradient with shadow — Main CTA actions</p>
              </div>

              <div className="border-t border-separator pt-8 space-y-4">
                <h3 className="h3 text-primary">Secondary Buttons</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-5 py-2 font-semibold text-sm transition-all duration-200" style={{
                    background: colors.badgeBg,
                    color: colors.primary,
                    borderRadius: '9999px',
                    border: `1px solid ${colors.chipBorder}`
                  }}>Learn More</button>
                  <button className="px-5 py-2 font-semibold text-sm transition-all duration-200" style={{
                    background: colors.badgeBg,
                    color: colors.primary,
                    borderRadius: '9999px',
                    border: `1px solid ${colors.chipBorder}`
                  }}>View Details</button>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Light purple background — Secondary actions</p>
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
                <h3 className="h3 text-primary">Accent Buttons (Pink)</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-5 py-2 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl" style={{
                    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryDark} 100%)`,
                    borderRadius: '9999px',
                    boxShadow: `0 4px 14px ${isDark ? 'rgba(244, 114, 182, 0.3)' : 'rgba(236, 72, 153, 0.4)'}`
                  }}>Start Investing</button>
                  <button className="px-5 py-2 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl" style={{
                    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
                    borderRadius: '9999px',
                    boxShadow: `0 4px 14px ${colors.glassShadow}`
                  }}>Create Portfolio</button>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Pink accent style — Hero sections, prominent CTAs</p>
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
                <span style={{ color: colors.textSecondary }}>Purple Tinted Card</span>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>Subtle purple tint, hover lift</p>
            </div>

            <div>
              <div className="rounded-3xl p-6 h-40 flex items-center justify-center" style={{
                background: `linear-gradient(135deg, ${isDark ? 'rgba(167, 139, 250, 0.1)' : 'rgba(124, 58, 237, 0.1)'} 0%, ${isDark ? 'rgba(244, 114, 182, 0.05)' : 'rgba(236, 72, 153, 0.05)'} 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.cardBorder}`
              }}>
                <span style={{ color: colors.textSecondary }}>Liquid Purple Glass</span>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>Maximum blur with purple-pink gradient</p>
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
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full" style={{
                    background: colors.badgeBg,
                    color: colors.primary
                  }}>Default</span>
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full" style={{
                    background: colors.chipBg,
                    color: colors.primary
                  }}>Active</span>
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full" style={{
                    background: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                    color: colors.success
                  }}>Profit</span>
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full" style={{
                    background: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.12)',
                    color: colors.error
                  }}>Loss</span>
                </div>
              </div>

              <div>
                <h3 className="h3 text-primary mb-4">Chips</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full" style={{
                    background: colors.chipBg,
                    color: colors.primaryDark,
                    border: `1px solid ${colors.chipBorder}`
                  }}>Large Cap</span>
                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full" style={{
                    background: isDark ? 'rgba(244, 114, 182, 0.1)' : 'rgba(236, 72, 153, 0.08)',
                    color: colors.secondary,
                    border: `1px solid ${isDark ? 'rgba(244, 114, 182, 0.2)' : 'rgba(236, 72, 153, 0.15)'}`
                  }}>Equity</span>
                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full" style={{
                    background: isDark ? 'rgba(196, 181, 253, 0.1)' : 'rgba(168, 85, 247, 0.08)',
                    color: colors.accent,
                    border: `1px solid ${isDark ? 'rgba(196, 181, 253, 0.2)' : 'rgba(168, 85, 247, 0.15)'}`
                  }}>Hybrid</span>
                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full" style={{
                    background: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(99, 102, 241, 0.08)',
                    color: isDark ? '#818CF8' : '#6366F1',
                    border: `1px solid ${isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`
                  }}>Debt</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modals & Dropdowns */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Modals & Dropdowns</h2>
          <p className="text-secondary mb-6">Interactive overlay components with purple theme</p>

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
          <p className="text-secondary mb-6">Financial data tables with purple theme</p>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: colors.tableHeaderBg, borderBottom: `1px solid ${colors.tableBorder}` }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primaryDark }}>Fund Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primaryDark }}>Category</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primaryDark }}>NAV</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primaryDark }}>Units</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primaryDark }}>Value</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primaryDark }}>Returns</th>
                  </tr>
                </thead>
                <tbody className="tabular-data">
                  <tr className="transition-colors" style={{ borderBottom: `1px solid ${colors.tableBorder}` }} onMouseEnter={(e) => e.currentTarget.style.background = colors.tableRowHover} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3 font-medium" style={{ color: colors.textPrimary }}>HDFC Mid-Cap Opportunities</td>
                    <td className="px-5 py-3" style={{ color: colors.textSecondary }}>Mid Cap</td>
                    <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>₹142.35</td>
                    <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>245.678</td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: colors.textPrimary }}>₹34,967.42</td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: colors.success }}>+18.4%</td>
                  </tr>
                  <tr className="transition-colors" style={{ borderBottom: `1px solid ${colors.tableBorder}` }} onMouseEnter={(e) => e.currentTarget.style.background = colors.tableRowHover} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3 font-medium" style={{ color: colors.textPrimary }}>Axis Bluechip Fund</td>
                    <td className="px-5 py-3" style={{ color: colors.textSecondary }}>Large Cap</td>
                    <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>₹56.78</td>
                    <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>1,234.567</td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: colors.textPrimary }}>₹70,098.76</td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: colors.success }}>+12.7%</td>
                  </tr>
                  <tr className="transition-colors" style={{ borderBottom: `1px solid ${colors.tableBorder}` }} onMouseEnter={(e) => e.currentTarget.style.background = colors.tableRowHover} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3 font-medium" style={{ color: colors.textPrimary }}>SBI Small Cap Fund</td>
                    <td className="px-5 py-3" style={{ color: colors.textSecondary }}>Small Cap</td>
                    <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>₹89.23</td>
                    <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>567.890</td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: colors.textPrimary }}>₹50,678.12</td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: colors.error }}>-3.2%</td>
                  </tr>
                  <tr className="transition-colors" style={{ borderBottom: `1px solid ${colors.tableBorder}` }} onMouseEnter={(e) => e.currentTarget.style.background = colors.tableRowHover} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3 font-medium" style={{ color: colors.textPrimary }}>ICICI Pru Liquid Fund</td>
                    <td className="px-5 py-3" style={{ color: colors.textSecondary }}>Debt</td>
                    <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>₹312.45</td>
                    <td className="px-5 py-3 text-right" style={{ color: colors.textPrimary }}>89.234</td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: colors.textPrimary }}>₹27,876.54</td>
                    <td className="px-5 py-3 text-right font-medium" style={{ color: colors.success }}>+6.8%</td>
                  </tr>
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
          <p className="text-secondary mb-6">ECharts with purple/pink theme</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* NAV Trendline */}
            <div className="glass-card p-5">
              <h3 className="h3 text-primary mb-1">NAV Trend</h3>
              <p className="text-xs text-secondary mb-4">12-month performance</p>
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    borderColor: 'rgba(124, 58, 237, 0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#1F2937', fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15); border-radius: 10px;',
                  },
                  grid: { top: 20, right: 20, bottom: 30, left: 50 },
                  xAxis: {
                    type: 'category',
                    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    axisLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.1)' } },
                    axisLabel: { color: '#6B7280', fontSize: 11 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.06)', type: 'dashed' } },
                    axisLabel: { color: '#6B7280', fontSize: 11 },
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
                      color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                          { offset: 0, color: colors.primary },
                          { offset: 0.5, color: colors.primaryDark },
                          { offset: 1, color: colors.secondary }
                        ]
                      },
                      shadowColor: 'rgba(124, 58, 237, 0.3)',
                      shadowBlur: 10,
                      shadowOffsetY: 5
                    },
                    itemStyle: { color: colors.primary, borderWidth: 2, borderColor: '#fff' },
                    areaStyle: {
                      color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(124, 58, 237, 0.2)' },
                          { offset: 0.5, color: 'rgba(124, 58, 237, 0.08)' },
                          { offset: 1, color: 'rgba(124, 58, 237, 0)' }
                        ]
                      }
                    },
                    emphasis: { focus: 'series', itemStyle: { shadowBlur: 15, shadowColor: 'rgba(124, 58, 237, 0.5)' } }
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
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    borderColor: 'rgba(124, 58, 237, 0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#1F2937', fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15); border-radius: 10px;',
                    formatter: '{b}: <strong>{d}%</strong>'
                  },
                  legend: {
                    orient: 'vertical',
                    right: 10,
                    top: 'center',
                    textStyle: { color: '#64748B', fontSize: 11 },
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
                      borderColor: '#fff',
                      borderWidth: 2,
                      shadowBlur: 10,
                      shadowColor: 'rgba(0, 0, 0, 0.1)'
                    },
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(124, 58, 237, 0.3)'
                      }
                    },
                    data: [
                      { value: 40, name: 'Large Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: colors.primary }, { offset: 1, color: colors.primaryDark }] } } },
                      { value: 25, name: 'Mid Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: colors.secondary }, { offset: 1, color: colors.secondaryDark }] } } },
                      { value: 20, name: 'Small Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: colors.accent }, { offset: 1, color: '#9333EA' }] } } },
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
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    borderColor: 'rgba(124, 58, 237, 0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#1F2937', fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15); border-radius: 10px;',
                    formatter: '{b}: <strong>{c}%</strong>'
                  },
                  grid: { top: 20, right: 20, bottom: 40, left: 50 },
                  xAxis: {
                    type: 'category',
                    data: ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'Debt'],
                    axisLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.1)' } },
                    axisLabel: { color: '#6B7280', fontSize: 10 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.06)', type: 'dashed' } },
                    axisLabel: { color: '#6B7280', fontSize: 11, formatter: '{value}%' },
                  },
                  series: [{
                    data: [
                      { value: 14.2, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors.primary }, { offset: 1, color: colors.primaryDark }] }, shadowColor: 'rgba(124, 58, 237, 0.3)', shadowBlur: 8 } },
                      { value: 18.5, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors.secondary }, { offset: 1, color: colors.secondaryDark }] }, shadowColor: 'rgba(236, 72, 153, 0.3)', shadowBlur: 8 } },
                      { value: 22.8, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors.accent }, { offset: 1, color: '#9333EA' }] }, shadowColor: 'rgba(168, 85, 247, 0.3)', shadowBlur: 8 } },
                      { value: 16.4, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366F1' }, { offset: 1, color: '#4F46E5' }] }, shadowColor: 'rgba(99, 102, 241, 0.3)', shadowBlur: 8 } },
                      { value: 7.2, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#818CF8' }, { offset: 1, color: '#6366F1' }] }, shadowColor: 'rgba(129, 140, 248, 0.3)', shadowBlur: 8 } },
                    ],
                    type: 'bar',
                    barWidth: '55%',
                    itemStyle: { borderRadius: [6, 6, 0, 0] },
                    emphasis: { itemStyle: { shadowBlur: 15, shadowColor: 'rgba(124, 58, 237, 0.4)' } }
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
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    borderColor: 'rgba(124, 58, 237, 0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#1F2937', fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15); border-radius: 10px;',
                  },
                  legend: {
                    data: ['Fund', 'Benchmark', 'Nifty 50'],
                    bottom: 0,
                    textStyle: { color: '#64748B', fontSize: 11 },
                    itemWidth: 20,
                    itemHeight: 3,
                    itemGap: 20
                  },
                  grid: { top: 20, right: 20, bottom: 50, left: 50 },
                  xAxis: {
                    type: 'category',
                    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    axisLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.1)' } },
                    axisLabel: { color: '#6B7280', fontSize: 11 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.06)', type: 'dashed' } },
                    axisLabel: { color: '#6B7280', fontSize: 11 },
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
                      lineStyle: {
                        color: colors.primary,
                        width: 3,
                        shadowColor: 'rgba(124, 58, 237, 0.3)',
                        shadowBlur: 8,
                        shadowOffsetY: 4
                      },
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
                      lineStyle: {
                        color: colors.secondary,
                        width: 2.5,
                        shadowColor: 'rgba(236, 72, 153, 0.2)',
                        shadowBlur: 6,
                        shadowOffsetY: 3
                      },
                      itemStyle: { color: colors.secondary },
                      emphasis: { focus: 'series' }
                    },
                    {
                      name: 'Nifty 50',
                      data: [100, 102, 104, 107, 110, 114],
                      type: 'line',
                      smooth: true,
                      symbol: 'none',
                      lineStyle: { color: '#94A3B8', width: 2, type: 'dashed' },
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
              <div className="h-2 rounded-full bg-purple-100 overflow-hidden">
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
              <div className="h-2 rounded-full bg-purple-100 overflow-hidden">
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
                  <span className="w-16 text-xs text-tertiary tabular-data">{px}px</span>
                  <div
                    className="h-4 rounded"
                    style={{
                      width: `${px * 3}px`,
                      background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                    }}
                  />
                  <span className="text-xs text-secondary">p-{size}, m-{size}, gap-{size}</span>
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

export default DesignPageV2;
