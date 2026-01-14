import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';

// Material Design 3 Color Palette (Light Mode)
const MD3_COLORS_LIGHT = {
  // Primary
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  // Secondary
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',
  // Tertiary
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',
  // Error
  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',
  // Surface
  surface: '#FEF7FF',
  onSurface: '#1D1B20',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  // Outline
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  // Background
  background: '#FEF7FF',
  onBackground: '#1D1B20',
  // Inverse
  inverseSurface: '#322F35',
  inverseOnSurface: '#F5EFF7',
  inversePrimary: '#D0BCFF',
  // Misc
  shadow: 'rgba(0, 0, 0, 0.15)',
  scrim: 'rgba(0, 0, 0, 0.32)',
  surfaceTint: '#6750A4',
  // Extended
  success: '#386A20',
  successContainer: '#B8F396',
};

// Material Design 3 Color Palette (Dark Mode)
const MD3_COLORS_DARK = {
  // Primary
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  // Secondary
  secondary: '#CCC2DC',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  // Tertiary
  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  // Error
  error: '#F2B8B5',
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',
  // Surface
  surface: '#141218',
  onSurface: '#E6E0E9',
  surfaceVariant: '#49454F',
  onSurfaceVariant: '#CAC4D0',
  // Outline
  outline: '#938F99',
  outlineVariant: '#49454F',
  // Background
  background: '#141218',
  onBackground: '#E6E0E9',
  // Inverse
  inverseSurface: '#E6E0E9',
  inverseOnSurface: '#322F35',
  inversePrimary: '#6750A4',
  // Misc
  shadow: 'rgba(0, 0, 0, 0.3)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  surfaceTint: '#D0BCFF',
  // Extended
  success: '#9CD67D',
  successContainer: '#255D0A',
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
const useMD3Colors = () => {
  const isDark = useDarkMode();
  return isDark ? MD3_COLORS_DARK : MD3_COLORS_LIGHT;
};

// Tab Navigation Component
const DesignTabs = ({ active, colors }: { active: 'v1' | 'v2' | 'v3' | 'v4' | 'ios' | 'android'; colors: typeof MD3_COLORS_LIGHT }) => {
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

// MD3 Top App Bar Component
const MD3TopAppBar = ({ title, colors, variant = 'small' }: { title: string; colors: typeof MD3_COLORS_LIGHT; variant?: 'small' | 'medium' | 'large' }) => (
  <div className="rounded-t-2xl overflow-hidden" style={{
    background: colors.surface,
    borderBottom: `1px solid ${colors.outlineVariant}`
  }}>
    <div className="flex items-center gap-4 px-4" style={{ height: variant === 'small' ? 64 : variant === 'medium' ? 112 : 152 }}>
      <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke={colors.onSurface} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className={`font-medium ${variant === 'small' ? 'text-[22px]' : variant === 'medium' ? 'text-[24px]' : 'text-[28px]'}`} style={{ color: colors.onSurface }}>
        {title}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke={colors.onSurface} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke={colors.onSurface} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

// MD3 Navigation Bar Component
const MD3NavigationBar = ({ colors, isDark }: { colors: typeof MD3_COLORS_LIGHT; isDark: boolean }) => (
  <div className="rounded-b-2xl overflow-hidden" style={{
    background: colors.surface,
    borderTop: `1px solid ${colors.outlineVariant}`
  }}>
    <div className="flex items-center justify-around py-3">
      {[
        { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home', active: true },
        { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Funds', active: false },
        { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Watchlist', active: false },
        { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile', active: false }
      ].map((tab, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-[64px]">
          <div className={`w-16 h-8 rounded-full flex items-center justify-center transition-colors ${tab.active ? '' : ''}`} style={{
            background: tab.active ? colors.secondaryContainer : 'transparent'
          }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
              color: tab.active ? colors.onSecondaryContainer : colors.onSurfaceVariant
            }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
          </div>
          <span className="text-[12px] font-medium" style={{
            color: tab.active ? colors.onSurface : colors.onSurfaceVariant
          }}>{tab.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// MD3 FAB Component
const MD3FAB = ({ colors, variant = 'primary' }: { colors: typeof MD3_COLORS_LIGHT; variant?: 'primary' | 'secondary' | 'tertiary' | 'surface' }) => {
  const styles = {
    primary: { bg: colors.primaryContainer, color: colors.onPrimaryContainer },
    secondary: { bg: colors.secondaryContainer, color: colors.onSecondaryContainer },
    tertiary: { bg: colors.tertiaryContainer, color: colors.onTertiaryContainer },
    surface: { bg: colors.surface, color: colors.primary }
  };

  return (
    <button className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:shadow-lg" style={{
      background: styles[variant].bg,
      boxShadow: `0 3px 5px ${colors.shadow}`
    }}>
      <svg className="w-6 h-6" fill="none" stroke={styles[variant].color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </button>
  );
};

// MD3 Extended FAB Component
const MD3ExtendedFAB = ({ label, colors }: { label: string; colors: typeof MD3_COLORS_LIGHT }) => (
  <button className="h-14 px-4 rounded-2xl flex items-center gap-3 transition-all hover:shadow-lg" style={{
    background: colors.primaryContainer,
    boxShadow: `0 3px 5px ${colors.shadow}`
  }}>
    <svg className="w-6 h-6" fill="none" stroke={colors.onPrimaryContainer} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
    <span className="text-[14px] font-medium pr-2" style={{ color: colors.onPrimaryContainer }}>{label}</span>
  </button>
);

// MD3 Filled Button Component
const MD3Button = ({ label, colors, variant = 'filled' }: { label: string; colors: typeof MD3_COLORS_LIGHT; variant?: 'filled' | 'tonal' | 'elevated' | 'outlined' | 'text' }) => {
  const styles = {
    filled: {
      bg: colors.primary,
      color: colors.onPrimary,
      border: 'none',
      shadow: 'none'
    },
    tonal: {
      bg: colors.secondaryContainer,
      color: colors.onSecondaryContainer,
      border: 'none',
      shadow: 'none'
    },
    elevated: {
      bg: colors.surface,
      color: colors.primary,
      border: 'none',
      shadow: `0 1px 3px ${colors.shadow}`
    },
    outlined: {
      bg: 'transparent',
      color: colors.primary,
      border: `1px solid ${colors.outline}`,
      shadow: 'none'
    },
    text: {
      bg: 'transparent',
      color: colors.primary,
      border: 'none',
      shadow: 'none'
    }
  };

  return (
    <button className="h-10 px-6 rounded-full text-[14px] font-medium transition-all hover:opacity-90" style={{
      background: styles[variant].bg,
      color: styles[variant].color,
      border: styles[variant].border,
      boxShadow: styles[variant].shadow
    }}>
      {label}
    </button>
  );
};

// MD3 Card Component
const MD3Card = ({ children, colors, variant = 'elevated' }: { children: React.ReactNode; colors: typeof MD3_COLORS_LIGHT; variant?: 'elevated' | 'filled' | 'outlined' }) => {
  const styles = {
    elevated: {
      bg: colors.surface,
      border: 'none',
      shadow: `0 2px 6px ${colors.shadow}`
    },
    filled: {
      bg: colors.surfaceVariant,
      border: 'none',
      shadow: 'none'
    },
    outlined: {
      bg: colors.surface,
      border: `1px solid ${colors.outlineVariant}`,
      shadow: 'none'
    }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: styles[variant].bg,
      border: styles[variant].border,
      boxShadow: styles[variant].shadow
    }}>
      {children}
    </div>
  );
};

// MD3 List Item Component
const MD3ListItem = ({ title, subtitle, leading, trailing, colors }: {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  colors: typeof MD3_COLORS_LIGHT;
}) => (
  <div className="flex items-center gap-4 px-4 py-3 hover:bg-black/5 transition-colors cursor-pointer">
    {leading && <div className="flex-shrink-0">{leading}</div>}
    <div className="flex-1 min-w-0">
      <p className="text-[16px]" style={{ color: colors.onSurface }}>{title}</p>
      {subtitle && <p className="text-[14px] mt-0.5" style={{ color: colors.onSurfaceVariant }}>{subtitle}</p>}
    </div>
    {trailing && <div className="flex-shrink-0">{trailing}</div>}
  </div>
);

// MD3 Chip Component
const MD3Chip = ({ label, colors, selected = false, variant = 'assist' }: {
  label: string;
  colors: typeof MD3_COLORS_LIGHT;
  selected?: boolean;
  variant?: 'assist' | 'filter' | 'input' | 'suggestion';
}) => (
  <div className="inline-flex items-center gap-2 h-8 px-4 rounded-lg cursor-pointer transition-all" style={{
    background: selected ? colors.secondaryContainer : 'transparent',
    border: `1px solid ${selected ? 'transparent' : colors.outline}`,
    color: selected ? colors.onSecondaryContainer : colors.onSurfaceVariant
  }}>
    {variant === 'filter' && selected && (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )}
    <span className="text-[14px]">{label}</span>
  </div>
);

// MD3 Switch Component
const MD3Switch = ({ checked, colors }: { checked: boolean; colors: typeof MD3_COLORS_LIGHT }) => (
  <div className="relative w-[52px] h-8 rounded-full cursor-pointer transition-colors" style={{
    background: checked ? colors.primary : colors.surfaceVariant,
    border: checked ? 'none' : `2px solid ${colors.outline}`
  }}>
    <div className="absolute w-6 h-6 rounded-full top-1 transition-all flex items-center justify-center" style={{
      background: checked ? colors.onPrimary : colors.outline,
      transform: checked ? 'translateX(22px)' : 'translateX(2px)',
      boxShadow: `0 2px 4px ${colors.shadow}`
    }}>
      {checked && (
        <svg className="w-4 h-4" fill="none" stroke={colors.onPrimaryContainer} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  </div>
);

// MD3 Dialog Component
const MD3Dialog = ({ title, content, colors }: { title: string; content: string; colors: typeof MD3_COLORS_LIGHT }) => (
  <div className="w-80 rounded-3xl overflow-hidden" style={{
    background: colors.surface,
    boxShadow: `0 8px 32px ${colors.shadow}`
  }}>
    <div className="p-6">
      <h3 className="text-[24px] font-normal mb-4" style={{ color: colors.onSurface }}>{title}</h3>
      <p className="text-[14px] leading-relaxed" style={{ color: colors.onSurfaceVariant }}>{content}</p>
    </div>
    <div className="flex justify-end gap-2 px-6 pb-6">
      <MD3Button label="Cancel" variant="text" colors={colors} />
      <MD3Button label="Confirm" variant="text" colors={colors} />
    </div>
  </div>
);

// MD3 Snackbar Component
const MD3Snackbar = ({ message, colors }: { message: string; colors: typeof MD3_COLORS_LIGHT }) => (
  <div className="flex items-center gap-4 px-4 py-3.5 rounded-lg" style={{
    background: colors.inverseSurface,
    boxShadow: `0 4px 12px ${colors.shadow}`
  }}>
    <span className="text-[14px] flex-1" style={{ color: colors.inverseOnSurface }}>{message}</span>
    <button className="text-[14px] font-medium" style={{ color: colors.inversePrimary }}>Dismiss</button>
  </div>
);

const DesignPageAndroid = () => {
  const [switchChecked, setSwitchChecked] = useState(true);
  const [deviceDarkMode, setDeviceDarkMode] = useState(true);
  const colors = useMD3Colors();
  const isDark = useDarkMode();

  // Colors for device preview (independent of page theme)
  const deviceColors = deviceDarkMode ? MD3_COLORS_DARK : MD3_COLORS_LIGHT;

  return (
    <div className="min-h-screen" style={{
      background: colors.background
    }}>
      <Navbar mode="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title="Android Design System"
          subtitle="Roboto Font + Material Design 3 — Native Android components for React Native"
          badge="MD3"
        />

        <DesignTabs active="android" colors={colors} />

        {/* Pixel 8 Pro Device Preview - Actual Dimensions */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: colors.onSurface }}>Pixel 8 Pro Preview</h2>
              <p className="text-sm mt-1" style={{ color: colors.onSurfaceVariant }}>Actual device dimensions: 412 x 915 dp (20:9 aspect ratio)</p>
            </div>
            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full" style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}>
              {/* Sun Icon */}
              <svg className="w-5 h-5" style={{ color: deviceDarkMode ? colors.onSurfaceVariant : '#F59E0B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {/* Toggle Switch */}
              <button
                onClick={() => setDeviceDarkMode(!deviceDarkMode)}
                className="relative w-14 h-8 rounded-full transition-colors duration-300"
                style={{
                  background: deviceDarkMode
                    ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
                    : 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
                }}
              >
                <div
                  className="absolute w-[27px] h-[27px] rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center"
                  style={{
                    top: '2px',
                    transform: deviceDarkMode ? 'translateX(30px)' : 'translateX(2px)'
                  }}
                >
                  {deviceDarkMode ? (
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
              {/* Moon Icon */}
              <svg className="w-5 h-5" style={{ color: deviceDarkMode ? '#A78BFA' : colors.onSurfaceVariant }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              {/* Pixel 8 Pro Frame - Actual dimensions */}
              <div style={{
                width: 412,
                height: 915,
                background: deviceDarkMode ? '#1C1C1E' : '#E5E5E5',
                borderRadius: 48,
                padding: 4,
                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.4), 0 30px 60px -30px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
              }}>
                {/* Camera Punch Hole */}
                <div style={{
                  position: 'absolute',
                  top: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 28,
                  background: '#000000',
                  borderRadius: '50%',
                  zIndex: 10,
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.8)'
                }} />

                {/* Screen */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 44,
                  overflow: 'hidden',
                  background: deviceColors.background
                }}>
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6" style={{
                    paddingTop: 12,
                    paddingBottom: 8,
                    background: deviceColors.surface
                  }}>
                    <span className="text-[14px] font-medium" style={{ color: deviceColors.onSurface }}>9:41</span>
                    <div className="flex items-center gap-2">
                      <svg className="w-[18px] h-[18px]" fill="currentColor" style={{ color: deviceColors.onSurface }} viewBox="0 0 24 24">
                        <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/>
                      </svg>
                      <svg className="w-[18px] h-[18px]" fill="currentColor" style={{ color: deviceColors.onSurface }} viewBox="0 0 24 24">
                        <path d="M2 22h20V2z"/>
                      </svg>
                      <div className="flex items-center" style={{ width: 28, height: 14, border: `2px solid ${deviceColors.onSurface}`, borderRadius: 4, padding: 1 }}>
                        <div style={{ width: '80%', height: '100%', background: deviceColors.success, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>

                  {/* Top App Bar */}
                  <div className="px-4 py-4" style={{ background: deviceColors.surface }}>
                    <div className="flex items-center gap-4">
                      <button className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'transparent' }}>
                        <svg className="w-6 h-6" fill="none" stroke={deviceColors.onSurface} viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <span className="text-[22px] font-medium" style={{ color: deviceColors.onSurface }}>Portfolio</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4 overflow-auto" style={{
                    background: deviceColors.background,
                    height: 650
                  }}>
                    {/* Balance Card */}
                    <div className="rounded-3xl p-5" style={{
                      background: deviceColors.surface,
                      boxShadow: `0 2px 8px ${deviceColors.shadow}`
                    }}>
                      <p className="text-[14px]" style={{ color: deviceColors.onSurfaceVariant }}>Total Balance</p>
                      <p className="text-[36px] font-normal mt-1" style={{ color: deviceColors.onSurface }}>$42,850.00</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="px-3 py-1 rounded-full" style={{ background: `${deviceColors.success}20` }}>
                          <span className="text-[14px] font-medium" style={{ color: deviceColors.success }}>+$1,250.00 (2.9%)</span>
                        </div>
                        <span className="text-[12px]" style={{ color: deviceColors.onSurfaceVariant }}>Today</span>
                      </div>
                    </div>

                    {/* Chart Card */}
                    <div className="rounded-3xl p-4" style={{
                      background: deviceColors.surfaceVariant
                    }}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[14px] font-medium" style={{ color: deviceColors.onSurface }}>Performance</span>
                        <div className="flex gap-1">
                          {['1D', '1W', '1M', '1Y'].map((period, i) => (
                            <span key={i} className="text-[12px] px-3 py-1.5 rounded-full font-medium" style={{
                              background: i === 2 ? deviceColors.primaryContainer : 'transparent',
                              color: i === 2 ? deviceColors.onPrimaryContainer : deviceColors.onSurfaceVariant
                            }}>{period}</span>
                          ))}
                        </div>
                      </div>
                      <div className="h-28 flex items-end justify-around gap-1.5">
                        {[40, 55, 45, 70, 65, 80, 75, 85, 90, 88, 95, 92].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-lg" style={{
                            height: `${h}%`,
                            background: i === 11 ? deviceColors.primary : deviceColors.primaryContainer
                          }} />
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-3">
                      {[
                        { icon: 'M12 4v16m8-8H4', label: 'Invest' },
                        { icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', label: 'Withdraw' },
                        { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label: 'SIP' }
                      ].map((action, i) => (
                        <div key={i} className="flex-1 rounded-2xl p-4 text-center" style={{ background: deviceColors.surfaceVariant }}>
                          <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: deviceColors.primaryContainer }}>
                            <svg className="w-6 h-6" fill="none" stroke={deviceColors.onPrimaryContainer} viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                            </svg>
                          </div>
                          <span className="text-[12px] font-medium" style={{ color: deviceColors.onSurface }}>{action.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Holdings Section */}
                    <div>
                      <div className="flex justify-between items-center mb-3 px-1">
                        <span className="text-[16px] font-medium" style={{ color: deviceColors.onSurface }}>Holdings</span>
                        <span className="text-[14px] font-medium" style={{ color: deviceColors.primary }}>See All</span>
                      </div>
                      <div className="rounded-3xl overflow-hidden" style={{
                        background: deviceColors.surface,
                        boxShadow: `0 1px 3px ${deviceColors.shadow}`
                      }}>
                        {[
                          { name: 'HDFC Balanced Advantage', category: 'Hybrid Fund', value: '$12,450', change: '+12.4%', positive: true },
                          { name: 'SBI Blue Chip Fund', category: 'Equity Fund', value: '$8,200', change: '+8.2%', positive: true },
                          { name: 'Axis Small Cap Fund', category: 'Equity Fund', value: '$6,100', change: '-2.1%', positive: false }
                        ].map((fund, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-4" style={{
                            borderBottom: i < 2 ? `1px solid ${deviceColors.outlineVariant}` : 'none'
                          }}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
                                background: deviceColors.primaryContainer
                              }}>
                                <span className="text-[14px] font-medium" style={{ color: deviceColors.onPrimaryContainer }}>
                                  {fund.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="text-[16px] font-medium" style={{ color: deviceColors.onSurface }}>{fund.name}</p>
                                <p className="text-[12px]" style={{ color: deviceColors.onSurfaceVariant }}>{fund.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[14px] font-medium" style={{ color: deviceColors.onSurface }}>{fund.value}</p>
                              <p className="text-[12px] font-medium" style={{ color: fund.positive ? deviceColors.success : deviceColors.error }}>
                                {fund.change}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Bar */}
                  <div style={{
                    background: deviceColors.surface,
                    borderTop: `1px solid ${deviceColors.outlineVariant}`,
                    paddingBottom: 24
                  }}>
                    <div className="flex items-center justify-around py-3">
                      {[
                        { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home', active: true },
                        { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Funds', active: false },
                        { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Watchlist', active: false },
                        { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile', active: false }
                      ].map((tab, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 min-w-[64px]">
                          <div className="w-16 h-8 rounded-full flex items-center justify-center" style={{
                            background: tab.active ? deviceColors.secondaryContainer : 'transparent'
                          }}>
                            <svg className="w-6 h-6" fill="none" stroke={tab.active ? deviceColors.onSecondaryContainer : deviceColors.onSurfaceVariant} viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                            </svg>
                          </div>
                          <span className="text-[12px] font-medium" style={{
                            color: tab.active ? deviceColors.onSurface : deviceColors.onSurfaceVariant
                          }}>{tab.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gesture Bar */}
                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 134,
                    height: 5,
                    background: deviceColors.onSurface,
                    borderRadius: 3,
                    opacity: 0.2
                  }} />
                </div>
              </div>

              {/* FAB */}
              <div style={{
                position: 'absolute',
                bottom: 120,
                right: 20
              }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                  background: deviceColors.primaryContainer,
                  boxShadow: `0 4px 12px ${deviceColors.shadow}`
                }}>
                  <svg className="w-6 h-6" fill="none" stroke={deviceColors.onPrimaryContainer} viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Scale */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.onSurface }}>Material Typography</h2>
          <p className="text-sm mb-6" style={{ color: colors.onSurfaceVariant }}>MD3 type scale with Roboto font family</p>

          <MD3Card colors={colors} variant="outlined">
            <div className="p-6 space-y-5">
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[57px] font-normal tracking-tight" style={{ color: colors.onSurface }}>Display Large</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>57sp / Regular — Hero text</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[45px] font-normal" style={{ color: colors.onSurface }}>Display Medium</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>45sp / Regular — Large headers</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[36px] font-normal" style={{ color: colors.onSurface }}>Display Small</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>36sp / Regular — Section headers</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[32px] font-normal" style={{ color: colors.onSurface }}>Headline Large</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>32sp / Regular — Page titles</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[28px] font-normal" style={{ color: colors.onSurface }}>Headline Medium</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>28sp / Regular — Card titles</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[24px] font-normal" style={{ color: colors.onSurface }}>Headline Small</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>24sp / Regular — Subsections</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[22px] font-medium" style={{ color: colors.onSurface }}>Title Large</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>22sp / Medium — Top app bar</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[16px] font-medium" style={{ color: colors.onSurface }}>Title Medium</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>16sp / Medium — List titles</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[14px] font-medium" style={{ color: colors.onSurface }}>Title Small</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>14sp / Medium — Tabs</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[16px]" style={{ color: colors.onSurface }}>Body Large</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>16sp / Regular — Primary content</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[14px]" style={{ color: colors.onSurface }}>Body Medium</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>14sp / Regular — Secondary content</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[12px]" style={{ color: colors.onSurface }}>Body Small</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>12sp / Regular — Captions</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[14px] font-medium" style={{ color: colors.onSurface }}>Label Large</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>14sp / Medium — Buttons</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.outlineVariant }}>
                <span className="text-[12px] font-medium" style={{ color: colors.onSurface }}>Label Medium</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>12sp / Medium — Labels</p>
              </div>
              <div>
                <span className="text-[11px] font-medium" style={{ color: colors.onSurface }}>Label Small</span>
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>11sp / Medium — Small labels</p>
              </div>
            </div>
          </MD3Card>
        </section>

        {/* Color System */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.onSurface }}>Color System</h2>
          <p className="text-sm mb-6" style={{ color: colors.onSurfaceVariant }}>Material Design 3 tonal palettes with dynamic color support</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Primary', bg: colors.primary, fg: colors.onPrimary },
              { name: 'On Primary', bg: colors.onPrimary, fg: colors.primary },
              { name: 'Primary Container', bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
              { name: 'On Primary Container', bg: colors.onPrimaryContainer, fg: colors.primaryContainer },
              { name: 'Secondary', bg: colors.secondary, fg: colors.onSecondary },
              { name: 'Secondary Container', bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
              { name: 'Tertiary', bg: colors.tertiary, fg: colors.onTertiary },
              { name: 'Tertiary Container', bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer },
              { name: 'Error', bg: colors.error, fg: colors.onError },
              { name: 'Error Container', bg: colors.errorContainer, fg: colors.onErrorContainer },
              { name: 'Surface', bg: colors.surface, fg: colors.onSurface },
              { name: 'Surface Variant', bg: colors.surfaceVariant, fg: colors.onSurfaceVariant },
            ].map((c, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: c.bg, border: `1px solid ${colors.outlineVariant}` }}>
                <p className="text-[12px] font-medium" style={{ color: c.fg }}>{c.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation Components */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.onSurface }}>Navigation</h2>
          <p className="text-sm mb-6" style={{ color: colors.onSurfaceVariant }}>Top app bar and navigation bar components</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top App Bar */}
            <div>
              <p className="text-[12px] font-medium mb-3" style={{ color: colors.onSurfaceVariant }}>TOP APP BAR</p>
              <div className="rounded-2xl overflow-hidden" style={{ boxShadow: `0 2px 8px ${colors.shadow}` }}>
                <MD3TopAppBar title="Portfolio" colors={colors} />
                <div className="h-48 flex items-center justify-center" style={{ background: colors.surface, color: colors.onSurfaceVariant }}>
                  Content Area
                </div>
              </div>
            </div>

            {/* Navigation Bar */}
            <div>
              <p className="text-[12px] font-medium mb-3" style={{ color: colors.onSurfaceVariant }}>NAVIGATION BAR</p>
              <div className="rounded-2xl overflow-hidden" style={{ boxShadow: `0 2px 8px ${colors.shadow}` }}>
                <div className="h-48 flex items-center justify-center" style={{ background: colors.surface, color: colors.onSurfaceVariant }}>
                  Content Area
                </div>
                <MD3NavigationBar colors={colors} isDark={isDark} />
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.onSurface }}>Buttons</h2>
          <p className="text-sm mb-6" style={{ color: colors.onSurfaceVariant }}>Common button styles and FABs</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Common Buttons */}
            <MD3Card colors={colors} variant="outlined">
              <div className="p-6">
                <p className="text-[12px] font-medium mb-4" style={{ color: colors.onSurfaceVariant }}>COMMON BUTTONS</p>
                <div className="flex flex-wrap gap-3">
                  <MD3Button label="Filled" variant="filled" colors={colors} />
                  <MD3Button label="Tonal" variant="tonal" colors={colors} />
                  <MD3Button label="Elevated" variant="elevated" colors={colors} />
                  <MD3Button label="Outlined" variant="outlined" colors={colors} />
                  <MD3Button label="Text" variant="text" colors={colors} />
                </div>
              </div>
            </MD3Card>

            {/* FABs */}
            <MD3Card colors={colors} variant="outlined">
              <div className="p-6">
                <p className="text-[12px] font-medium mb-4" style={{ color: colors.onSurfaceVariant }}>FLOATING ACTION BUTTONS</p>
                <div className="flex flex-wrap items-center gap-4">
                  <MD3FAB colors={colors} variant="primary" />
                  <MD3FAB colors={colors} variant="secondary" />
                  <MD3FAB colors={colors} variant="tertiary" />
                  <MD3FAB colors={colors} variant="surface" />
                  <MD3ExtendedFAB label="New Investment" colors={colors} />
                </div>
              </div>
            </MD3Card>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.onSurface }}>Cards</h2>
          <p className="text-sm mb-6" style={{ color: colors.onSurfaceVariant }}>Elevated, filled, and outlined card variants</p>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-[12px] font-medium mb-3" style={{ color: colors.onSurfaceVariant }}>ELEVATED</p>
              <MD3Card colors={colors} variant="elevated">
                <div className="p-4">
                  <p className="text-[16px] font-medium" style={{ color: colors.onSurface }}>Portfolio Value</p>
                  <p className="text-[32px] font-normal mt-2" style={{ color: colors.onSurface }}>$42,850</p>
                  <p className="text-[14px] mt-1" style={{ color: colors.success }}>+2.4% today</p>
                </div>
              </MD3Card>
            </div>

            <div>
              <p className="text-[12px] font-medium mb-3" style={{ color: colors.onSurfaceVariant }}>FILLED</p>
              <MD3Card colors={colors} variant="filled">
                <div className="p-4">
                  <p className="text-[16px] font-medium" style={{ color: colors.onSurface }}>Total Investments</p>
                  <p className="text-[32px] font-normal mt-2" style={{ color: colors.onSurface }}>12</p>
                  <p className="text-[14px] mt-1" style={{ color: colors.onSurfaceVariant }}>Across 4 categories</p>
                </div>
              </MD3Card>
            </div>

            <div>
              <p className="text-[12px] font-medium mb-3" style={{ color: colors.onSurfaceVariant }}>OUTLINED</p>
              <MD3Card colors={colors} variant="outlined">
                <div className="p-4">
                  <p className="text-[16px] font-medium" style={{ color: colors.onSurface }}>Monthly SIP</p>
                  <p className="text-[32px] font-normal mt-2" style={{ color: colors.onSurface }}>$500</p>
                  <p className="text-[14px] mt-1" style={{ color: colors.onSurfaceVariant }}>Next: Jan 15</p>
                </div>
              </MD3Card>
            </div>
          </div>
        </section>

        {/* List & Chips */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.onSurface }}>Lists & Chips</h2>
          <p className="text-sm mb-6" style={{ color: colors.onSurfaceVariant }}>List items with leading/trailing elements and filter chips</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* List */}
            <MD3Card colors={colors} variant="outlined">
              <MD3ListItem
                title="HDFC Balanced Advantage"
                subtitle="Hybrid Fund • High Risk"
                leading={
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.primaryContainer }}>
                    <span className="text-[14px] font-medium" style={{ color: colors.onPrimaryContainer }}>HB</span>
                  </div>
                }
                trailing={
                  <span className="text-[14px] font-medium" style={{ color: colors.success }}>+12.4%</span>
                }
                colors={colors}
              />
              <div style={{ height: 1, background: colors.outlineVariant, marginLeft: 72 }} />
              <MD3ListItem
                title="SBI Blue Chip Fund"
                subtitle="Equity Fund • Moderate Risk"
                leading={
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.secondaryContainer }}>
                    <span className="text-[14px] font-medium" style={{ color: colors.onSecondaryContainer }}>SB</span>
                  </div>
                }
                trailing={
                  <span className="text-[14px] font-medium" style={{ color: colors.success }}>+8.2%</span>
                }
                colors={colors}
              />
              <div style={{ height: 1, background: colors.outlineVariant, marginLeft: 72 }} />
              <MD3ListItem
                title="Axis Small Cap Fund"
                subtitle="Equity Fund • Very High Risk"
                leading={
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.tertiaryContainer }}>
                    <span className="text-[14px] font-medium" style={{ color: colors.onTertiaryContainer }}>AS</span>
                  </div>
                }
                trailing={
                  <span className="text-[14px] font-medium" style={{ color: colors.error }}>-2.1%</span>
                }
                colors={colors}
              />
            </MD3Card>

            {/* Chips */}
            <MD3Card colors={colors} variant="outlined">
              <div className="p-4">
                <p className="text-[12px] font-medium mb-4" style={{ color: colors.onSurfaceVariant }}>FILTER CHIPS</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <MD3Chip label="All Funds" colors={colors} selected variant="filter" />
                  <MD3Chip label="Equity" colors={colors} variant="filter" />
                  <MD3Chip label="Debt" colors={colors} variant="filter" />
                  <MD3Chip label="Hybrid" colors={colors} variant="filter" />
                </div>

                <p className="text-[12px] font-medium mb-4" style={{ color: colors.onSurfaceVariant }}>SUGGESTION CHIPS</p>
                <div className="flex flex-wrap gap-2">
                  <MD3Chip label="Tax Saver" colors={colors} variant="suggestion" />
                  <MD3Chip label="High Returns" colors={colors} variant="suggestion" />
                  <MD3Chip label="Low Risk" colors={colors} variant="suggestion" />
                </div>
              </div>
            </MD3Card>
          </div>
        </section>

        {/* Switch & Dialog */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.onSurface }}>Controls & Dialogs</h2>
          <p className="text-sm mb-6" style={{ color: colors.onSurfaceVariant }}>Switches, dialogs, and snackbars</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Switch */}
            <MD3Card colors={colors} variant="outlined">
              <div className="p-6">
                <p className="text-[12px] font-medium mb-4" style={{ color: colors.onSurfaceVariant }}>SWITCH</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[16px]" style={{ color: colors.onSurface }}>Push Notifications</p>
                    <p className="text-[14px]" style={{ color: colors.onSurfaceVariant }}>Get alerts for NAV updates</p>
                  </div>
                  <MD3Switch checked={switchChecked} colors={colors} />
                </div>
              </div>
            </MD3Card>

            {/* Snackbar */}
            <div className="flex items-center justify-center p-6 rounded-xl" style={{ background: colors.surfaceVariant }}>
              <MD3Snackbar message="Investment successful!" colors={colors} />
            </div>
          </div>

          {/* Dialog */}
          <div className="mt-6 flex justify-center p-8 rounded-xl" style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(20, 18, 24, 0.8) 0%, rgba(20, 18, 24, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%)'
          }}>
            <MD3Dialog
              title="Confirm Investment"
              content="You are about to invest $1,000 in HDFC Balanced Advantage Fund. This investment will be processed within 2 business days."
              colors={colors}
            />
          </div>
        </section>

        {/* Elevation */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.onSurface }}>Elevation</h2>
          <p className="text-sm mb-6" style={{ color: colors.onSurfaceVariant }}>Material Design 3 elevation levels</p>

          <div className="flex flex-wrap gap-6">
            {[
              { level: 0, dp: '0dp', shadow: 'none' },
              { level: 1, dp: '1dp', shadow: `0 1px 2px ${colors.shadow}` },
              { level: 2, dp: '3dp', shadow: `0 2px 6px ${colors.shadow}` },
              { level: 3, dp: '6dp', shadow: `0 4px 12px ${colors.shadow}` },
              { level: 4, dp: '8dp', shadow: `0 6px 16px ${colors.shadow}` },
              { level: 5, dp: '12dp', shadow: `0 8px 24px ${colors.shadow}` },
            ].map((e, i) => (
              <div key={i} className="w-24 h-24 rounded-xl flex flex-col items-center justify-center" style={{
                background: colors.surface,
                boxShadow: e.shadow
              }}>
                <span className="text-[14px] font-medium" style={{ color: colors.onSurface }}>Level {e.level}</span>
                <span className="text-[12px]" style={{ color: colors.onSurfaceVariant }}>{e.dp}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default DesignPageAndroid;
