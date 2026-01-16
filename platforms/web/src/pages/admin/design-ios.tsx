import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';

// iOS Human Interface Guidelines Color Palette (Light Mode)
const IOS_COLORS_LIGHT = {
  // System Colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',
  // Grays
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  // Backgrounds
  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  tertiaryBackground: '#FFFFFF',
  groupedBackground: '#F2F2F7',
  // Text
  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  quaternaryLabel: 'rgba(60, 60, 67, 0.18)',
  // Separators
  separator: 'rgba(60, 60, 67, 0.29)',
  opaqueSeparator: '#C6C6C8',
  // Fills
  fill: 'rgba(120, 120, 128, 0.2)',
  secondaryFill: 'rgba(120, 120, 128, 0.16)',
  tertiaryFill: 'rgba(118, 118, 128, 0.12)',
  quaternaryFill: 'rgba(116, 116, 128, 0.08)',
};

// iOS Human Interface Guidelines Color Palette (Dark Mode)
const IOS_COLORS_DARK = {
  // System Colors (Elevated for dark mode)
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',
  // Grays
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',
  // Backgrounds
  background: '#000000',
  secondaryBackground: '#1C1C1E',
  tertiaryBackground: '#2C2C2E',
  groupedBackground: '#000000',
  // Text
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.18)',
  // Separators
  separator: 'rgba(84, 84, 88, 0.6)',
  opaqueSeparator: '#38383A',
  // Fills
  fill: 'rgba(120, 120, 128, 0.36)',
  secondaryFill: 'rgba(120, 120, 128, 0.32)',
  tertiaryFill: 'rgba(118, 118, 128, 0.24)',
  quaternaryFill: 'rgba(116, 116, 128, 0.18)',
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
const useIOSColors = () => {
  const isDark = useDarkMode();
  return isDark ? IOS_COLORS_DARK : IOS_COLORS_LIGHT;
};

// Tab Navigation Component
const DesignTabs = ({ active, colors }: { active: 'v1' | 'v2' | 'v3' | 'v4' | 'ios' | 'android'; colors: typeof IOS_COLORS_LIGHT }) => {
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

// iOS Navigation Bar Component
const IOSNavigationBar = ({ title, colors, isDark }: { title: string; colors: typeof IOS_COLORS_LIGHT; isDark: boolean }) => (
  <div className="rounded-t-2xl overflow-hidden" style={{
    background: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: `0.5px solid ${colors.separator}`
  }}>
    <div className="flex items-center justify-between px-4 h-11">
      <div className="flex items-center gap-1" style={{ color: colors.systemBlue }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-[17px]">Back</span>
      </div>
      <span className="text-[17px] font-semibold" style={{ color: colors.label }}>{title}</span>
      <div style={{ color: colors.systemBlue }}>
        <span className="text-[17px]">Done</span>
      </div>
    </div>
  </div>
);

// iOS Tab Bar Component
const IOSTabBar = ({ colors, isDark }: { colors: typeof IOS_COLORS_LIGHT; isDark: boolean }) => (
  <div className="rounded-b-2xl overflow-hidden" style={{
    background: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: `0.5px solid ${colors.separator}`
  }}>
    <div className="flex items-center justify-around py-2">
      {[
        { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard', active: true },
        { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Funds', active: false },
        { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile', active: false },
        { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Settings', active: false }
      ].map((tab, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tab.active ? colors.systemBlue : colors.systemGray }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
          </svg>
          <span className="text-[10px]" style={{ color: tab.active ? colors.systemBlue : colors.systemGray }}>{tab.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// iOS List Cell Component
const IOSListCell = ({ title, subtitle, value, showChevron = true, colors, isDark }: { title: string; subtitle?: string; value?: string; showChevron?: boolean; colors: typeof IOS_COLORS_LIGHT; isDark: boolean }) => (
  <div className="flex items-center justify-between px-4 py-3" style={{
    background: isDark ? colors.secondaryBackground : colors.tertiaryBackground,
    borderBottom: `0.5px solid ${colors.separator}`
  }}>
    <div className="flex-1">
      <span className="text-[17px]" style={{ color: colors.label }}>{title}</span>
      {subtitle && <p className="text-[13px] mt-0.5" style={{ color: colors.secondaryLabel }}>{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-[17px]" style={{ color: colors.secondaryLabel }}>{value}</span>}
      {showChevron && (
        <svg className="w-4 h-4" fill="none" stroke={colors.systemGray3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  </div>
);

// iOS Toggle Component
const IOSToggle = ({ enabled, colors }: { enabled: boolean; colors: typeof IOS_COLORS_LIGHT }) => (
  <div className="relative w-[51px] h-[31px] rounded-full transition-colors cursor-pointer" style={{
    background: enabled ? colors.systemGreen : colors.fill
  }}>
    <div className="absolute w-[27px] h-[27px] rounded-full bg-white top-[2px] shadow-md transition-transform" style={{
      transform: enabled ? 'translateX(22px)' : 'translateX(2px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }} />
  </div>
);

// iOS Segmented Control Component
const IOSSegmentedControl = ({ options, selected, colors, isDark }: { options: string[]; selected: number; colors: typeof IOS_COLORS_LIGHT; isDark: boolean }) => (
  <div className="inline-flex p-0.5 rounded-lg" style={{ background: colors.fill }}>
    {options.map((option, i) => (
      <div key={i} className="px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer" style={{
        background: selected === i ? (isDark ? colors.systemGray5 : '#FFFFFF') : 'transparent',
        color: colors.label,
        boxShadow: selected === i ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
      }}>
        {option}
      </div>
    ))}
  </div>
);

// iOS Card Component (Grouped Style)
const IOSGroupedCard = ({ children, colors, isDark }: { children: React.ReactNode; colors: typeof IOS_COLORS_LIGHT; isDark: boolean }) => (
  <div className="rounded-xl overflow-hidden" style={{
    background: isDark ? colors.secondaryBackground : colors.tertiaryBackground
  }}>
    {children}
  </div>
);

// iOS Button Component
const IOSButton = ({ title, variant = 'filled', colors }: { title: string; variant?: 'filled' | 'gray' | 'tinted' | 'plain'; colors: typeof IOS_COLORS_LIGHT }) => {
  const styles = {
    filled: {
      background: colors.systemBlue,
      color: '#FFFFFF',
      fontWeight: '600' as const
    },
    gray: {
      background: colors.fill,
      color: colors.systemBlue,
      fontWeight: '600' as const
    },
    tinted: {
      background: `rgba(0, 122, 255, 0.15)`,
      color: colors.systemBlue,
      fontWeight: '600' as const
    },
    plain: {
      background: 'transparent',
      color: colors.systemBlue,
      fontWeight: '400' as const
    }
  };

  return (
    <button className="px-5 py-3 rounded-xl text-[17px] transition-opacity hover:opacity-80" style={styles[variant]}>
      {title}
    </button>
  );
};

// iOS Alert Component
const IOSAlert = ({ title, message, colors, isDark }: { title: string; message: string; colors: typeof IOS_COLORS_LIGHT; isDark: boolean }) => (
  <div className="w-72 rounded-2xl overflow-hidden" style={{
    background: isDark ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)'
  }}>
    <div className="p-4 text-center">
      <h3 className="text-[17px] font-semibold mb-1" style={{ color: colors.label }}>{title}</h3>
      <p className="text-[13px]" style={{ color: colors.secondaryLabel }}>{message}</p>
    </div>
    <div className="flex border-t" style={{ borderColor: colors.separator }}>
      <button className="flex-1 py-3 text-[17px]" style={{ color: colors.systemBlue, borderRight: `0.5px solid ${colors.separator}` }}>Cancel</button>
      <button className="flex-1 py-3 text-[17px] font-semibold" style={{ color: colors.systemBlue }}>OK</button>
    </div>
  </div>
);

// iOS Action Sheet Component
const IOSActionSheet = ({ colors, isDark }: { colors: typeof IOS_COLORS_LIGHT; isDark: boolean }) => (
  <div className="w-80">
    <div className="rounded-2xl overflow-hidden mb-2" style={{
      background: isDark ? 'rgba(44, 44, 46, 0.92)' : 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)'
    }}>
      <button className="w-full py-4 text-[20px]" style={{ color: colors.systemBlue, borderBottom: `0.5px solid ${colors.separator}` }}>
        View Details
      </button>
      <button className="w-full py-4 text-[20px]" style={{ color: colors.systemBlue, borderBottom: `0.5px solid ${colors.separator}` }}>
        Add to Watchlist
      </button>
      <button className="w-full py-4 text-[20px]" style={{ color: colors.systemRed }}>
        Remove
      </button>
    </div>
    <div className="rounded-2xl overflow-hidden" style={{
      background: isDark ? 'rgba(44, 44, 46, 0.92)' : 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)'
    }}>
      <button className="w-full py-4 text-[20px] font-semibold" style={{ color: colors.systemBlue }}>
        Cancel
      </button>
    </div>
  </div>
);

const DesignPageIOS = () => {
  const [toggleEnabled, setToggleEnabled] = useState(true);
  const [segmentSelected, setSegmentSelected] = useState(0);
  const [deviceDarkMode, setDeviceDarkMode] = useState(true);
  const colors = useIOSColors();
  const isDark = useDarkMode();

  // Device preview colors (independent of page theme)
  const deviceColors = deviceDarkMode ? IOS_COLORS_DARK : IOS_COLORS_LIGHT;

  return (
    <div className="min-h-screen" style={{
      background: isDark ? colors.background : colors.groupedBackground
    }}>
      <Navbar mode="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title="iOS Design System"
          subtitle="SF Pro Font + Human Interface Guidelines — Native iOS components for React Native"
          badge="iOS 17+"
        />

        <DesignTabs active="ios" colors={colors} />

        {/* iPhone 15 Pro Device Preview - Actual Dimensions */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: colors.label }}>iPhone 15 Pro Preview</h2>
              <p className="text-sm mt-1" style={{ color: colors.secondaryLabel }}>Actual device dimensions: 393 x 852 points (19.5:9 aspect ratio)</p>
            </div>
            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full" style={{
              background: isDark ? colors.secondaryBackground : '#FFFFFF',
              border: `1px solid ${colors.separator}`
            }}>
              <svg className="w-5 h-5" fill="none" stroke={deviceDarkMode ? colors.systemGray : colors.systemYellow} viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <button
                onClick={() => setDeviceDarkMode(!deviceDarkMode)}
                className="relative w-[51px] h-[31px] rounded-full transition-colors"
                style={{ background: deviceDarkMode ? colors.systemBlue : colors.fill }}
              >
                <div className="absolute w-[27px] h-[27px] rounded-full bg-white top-[2px] shadow-md transition-transform" style={{
                  transform: deviceDarkMode ? 'translateX(22px)' : 'translateX(2px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
              <svg className="w-5 h-5" fill="none" stroke={deviceDarkMode ? colors.systemBlue : colors.systemGray} viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              {/* iPhone 15 Pro Frame - Actual dimensions */}
              <div style={{
                width: 393,
                height: 852,
                background: deviceDarkMode ? '#1C1C1E' : '#000000',
                borderRadius: 55,
                padding: 4,
                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.4), 0 30px 60px -30px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}>
                {/* Dynamic Island */}
                <div style={{
                  position: 'absolute',
                  top: 14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 126,
                  height: 37,
                  background: '#000000',
                  borderRadius: 20,
                  zIndex: 10
                }} />

                {/* Screen */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 51,
                  overflow: 'hidden',
                  background: deviceColors.groupedBackground
                }}>
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-8" style={{
                    paddingTop: 59,
                    paddingBottom: 8,
                    background: deviceDarkMode ? deviceColors.background : deviceColors.groupedBackground
                  }}>
                    <span className="text-[17px] font-semibold" style={{ color: deviceColors.label }}>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-[18px] h-[12px]" fill="currentColor" style={{ color: deviceColors.label }} viewBox="0 0 18 12">
                        <path d="M1 4.5c0-.3.2-.5.5-.5 3.1 0 5.9 1.3 7.9 3.4.2.2.2.5 0 .7-2 2.1-4.8 3.4-7.9 3.4-.3 0-.5-.2-.5-.5v-6.5z"/>
                        <path d="M16.5 0c.3 0 .5.2.5.5v11c0 .3-.2.5-.5.5s-.5-.2-.5-.5V.5c0-.3.2-.5.5-.5z" opacity="0.3"/>
                      </svg>
                      <svg className="w-[17px] h-[12px]" fill="currentColor" style={{ color: deviceColors.label }} viewBox="0 0 17 12">
                        <path fillRule="evenodd" d="M12 2H1.5C.7 2 0 2.7 0 3.5v5C0 9.3.7 10 1.5 10H12c.8 0 1.5-.7 1.5-1.5v-5C13.5 2.7 12.8 2 12 2zM1 3.5c0-.3.2-.5.5-.5H12c.3 0 .5.2.5.5v5c0 .3-.2.5-.5.5H1.5c-.3 0-.5-.2-.5-.5v-5z"/>
                        <rect width="8" height="4" x="2" y="4" rx="0.5"/>
                        <path d="M15 4.5c0-.3.2-.5.5-.5h.5c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1h-.5c-.3 0-.5-.2-.5-.5v-3z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Large Title Navigation */}
                  <div className="px-5 pt-1 pb-3" style={{ background: deviceDarkMode ? deviceColors.background : deviceColors.groupedBackground }}>
                    <span className="text-[34px] font-bold tracking-tight" style={{ color: deviceColors.label }}>Portfolio</span>
                  </div>

                  {/* Content */}
                  <div className="px-5 pb-4 space-y-4 overflow-auto" style={{
                    background: deviceColors.groupedBackground,
                    height: 580
                  }}>
                    {/* Balance Card */}
                    <div className="rounded-xl p-4" style={{ background: deviceDarkMode ? deviceColors.secondaryBackground : '#FFFFFF' }}>
                      <p className="text-[13px]" style={{ color: deviceColors.secondaryLabel }}>Total Balance</p>
                      <p className="text-[34px] font-bold tracking-tight mt-0.5" style={{ color: deviceColors.label }}>$42,850.00</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[15px] font-semibold" style={{ color: deviceColors.systemGreen }}>+$1,250.00 (2.9%)</span>
                        <span className="text-[13px]" style={{ color: deviceColors.secondaryLabel }}>Today</span>
                      </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="rounded-xl p-4" style={{ background: deviceDarkMode ? deviceColors.secondaryBackground : '#FFFFFF' }}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[13px] font-semibold" style={{ color: deviceColors.label }}>Performance</span>
                        <div className="flex gap-2">
                          {['1D', '1W', '1M', '1Y'].map((period, i) => (
                            <span key={i} className="text-[13px] px-2 py-1 rounded" style={{
                              background: i === 2 ? deviceColors.systemBlue : 'transparent',
                              color: i === 2 ? '#FFFFFF' : deviceColors.secondaryLabel
                            }}>{period}</span>
                          ))}
                        </div>
                      </div>
                      <div className="h-32 flex items-end justify-around gap-1">
                        {[40, 55, 45, 70, 65, 80, 75, 85, 90, 88, 95, 92].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t" style={{
                            height: `${h}%`,
                            background: `linear-gradient(180deg, ${deviceColors.systemBlue} 0%, ${deviceColors.systemTeal} 100%)`
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
                        <div key={i} className="flex-1 rounded-xl p-3 text-center" style={{ background: deviceDarkMode ? deviceColors.secondaryBackground : '#FFFFFF' }}>
                          <div className="w-11 h-11 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `${deviceColors.systemBlue}15` }}>
                            <svg className="w-5 h-5" fill="none" stroke={deviceColors.systemBlue} viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium" style={{ color: deviceColors.label }}>{action.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Holdings Section */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[20px] font-semibold" style={{ color: deviceColors.label }}>Holdings</span>
                        <span className="text-[15px]" style={{ color: deviceColors.systemBlue }}>See All</span>
                      </div>
                      <div className="rounded-xl overflow-hidden" style={{ background: deviceDarkMode ? deviceColors.secondaryBackground : '#FFFFFF' }}>
                        {[
                          { name: 'HDFC Balanced Advantage', value: '$12,450', change: '+12.4%', positive: true },
                          { name: 'SBI Blue Chip Fund', value: '$8,200', change: '+8.2%', positive: true },
                          { name: 'Axis Small Cap Fund', value: '$6,100', change: '-2.1%', positive: false }
                        ].map((fund, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3.5" style={{
                            borderBottom: i < 2 ? `0.5px solid ${deviceColors.separator}` : 'none'
                          }}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                                background: `linear-gradient(135deg, ${deviceColors.systemBlue}20 0%, ${deviceColors.systemTeal}20 100%)`
                              }}>
                                <span className="text-[14px] font-semibold" style={{ color: deviceColors.systemBlue }}>
                                  {fund.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="text-[15px] font-medium" style={{ color: deviceColors.label }}>{fund.name}</p>
                                <p className="text-[13px]" style={{ color: deviceColors.secondaryLabel }}>{fund.value}</p>
                              </div>
                            </div>
                            <span className="text-[15px] font-semibold" style={{ color: fund.positive ? deviceColors.systemGreen : deviceColors.systemRed }}>
                              {fund.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tab Bar */}
                  <div style={{
                    background: deviceDarkMode ? 'rgba(28, 28, 30, 0.94)' : 'rgba(249, 249, 249, 0.94)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: `0.5px solid ${deviceColors.separator}`,
                    paddingBottom: 34
                  }}>
                    <div className="flex items-center justify-around py-2">
                      {[
                        { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home', active: true },
                        { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Funds', active: false },
                        { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile', active: false },
                        { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Settings', active: false }
                      ].map((tab, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <svg className="w-7 h-7" fill={tab.active ? deviceColors.systemBlue : 'none'} stroke={tab.active ? deviceColors.systemBlue : deviceColors.systemGray} viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                          </svg>
                          <span className="text-[10px]" style={{ color: tab.active ? deviceColors.systemBlue : deviceColors.systemGray }}>{tab.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Home Indicator */}
                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 134,
                    height: 5,
                    background: deviceColors.label,
                    borderRadius: 3,
                    opacity: 0.3
                  }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Scale */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.label }}>SF Pro Typography</h2>
          <p className="text-sm mb-6" style={{ color: colors.secondaryLabel }}>iOS Dynamic Type scale with SF Pro Display and SF Pro Text</p>

          <div className="rounded-2xl p-6" style={{ background: isDark ? colors.secondaryBackground : '#FFFFFF' }}>
            <div className="space-y-5">
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[34px] font-bold tracking-tight" style={{ color: colors.label }}>Large Title</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>34pt / Bold — SF Pro Display</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[28px] font-bold" style={{ color: colors.label }}>Title 1</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>28pt / Bold — Navigation titles</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[22px] font-bold" style={{ color: colors.label }}>Title 2</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>22pt / Bold — Section headers</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[20px] font-semibold" style={{ color: colors.label }}>Title 3</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>20pt / Semibold — Subsections</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[17px] font-semibold" style={{ color: colors.label }}>Headline</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>17pt / Semibold — SF Pro Text</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[17px]" style={{ color: colors.label }}>Body</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>17pt / Regular — Primary content</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[16px]" style={{ color: colors.label }}>Callout</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>16pt / Regular — Callouts</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[15px]" style={{ color: colors.label }}>Subheadline</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>15pt / Regular — Secondary text</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[13px]" style={{ color: colors.label }}>Footnote</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>13pt / Regular — Footnotes</p>
              </div>
              <div className="border-b pb-4" style={{ borderColor: colors.separator }}>
                <span className="text-[12px]" style={{ color: colors.label }}>Caption 1</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>12pt / Regular — Captions</p>
              </div>
              <div>
                <span className="text-[11px]" style={{ color: colors.label }}>Caption 2</span>
                <p className="text-xs mt-1" style={{ color: colors.tertiaryLabel }}>11pt / Regular — Small captions</p>
              </div>
            </div>
          </div>
        </section>

        {/* System Colors */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.label }}>System Colors</h2>
          <p className="text-sm mb-6" style={{ color: colors.secondaryLabel }}>iOS semantic colors with automatic dark mode adaptation</p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: 'Blue', color: colors.systemBlue },
              { name: 'Green', color: colors.systemGreen },
              { name: 'Indigo', color: colors.systemIndigo },
              { name: 'Orange', color: colors.systemOrange },
              { name: 'Pink', color: colors.systemPink },
              { name: 'Purple', color: colors.systemPurple },
              { name: 'Red', color: colors.systemRed },
              { name: 'Teal', color: colors.systemTeal },
              { name: 'Yellow', color: colors.systemYellow },
              { name: 'Gray', color: colors.systemGray },
            ].map((c, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: isDark ? colors.secondaryBackground : '#FFFFFF' }}>
                <div className="w-full h-12 rounded-lg mb-2" style={{ background: c.color }} />
                <p className="text-[13px] font-medium" style={{ color: colors.label }}>{c.name}</p>
                <p className="text-[11px]" style={{ color: colors.secondaryLabel }}>{c.color}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation Components */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.label }}>Navigation</h2>
          <p className="text-sm mb-6" style={{ color: colors.secondaryLabel }}>iOS navigation bar and tab bar with blur effects</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Navigation Bar Preview */}
            <div>
              <p className="text-[13px] font-medium mb-3" style={{ color: colors.secondaryLabel }}>NAVIGATION BAR</p>
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: isDark ? colors.secondaryBackground : '#FFFFFF' }}>
                <IOSNavigationBar title="Portfolio" colors={colors} isDark={isDark} />
                <div className="h-48 flex items-center justify-center" style={{ color: colors.tertiaryLabel }}>
                  Content Area
                </div>
              </div>
            </div>

            {/* Tab Bar Preview */}
            <div>
              <p className="text-[13px] font-medium mb-3" style={{ color: colors.secondaryLabel }}>TAB BAR</p>
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: isDark ? colors.secondaryBackground : '#FFFFFF' }}>
                <div className="h-48 flex items-center justify-center" style={{ color: colors.tertiaryLabel }}>
                  Content Area
                </div>
                <IOSTabBar colors={colors} isDark={isDark} />
              </div>
            </div>
          </div>
        </section>

        {/* List Components */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.label }}>Lists & Tables</h2>
          <p className="text-sm mb-6" style={{ color: colors.secondaryLabel }}>Grouped and inset grouped table views</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Grouped List */}
            <div>
              <p className="text-[13px] font-medium mb-3" style={{ color: colors.secondaryLabel }}>GROUPED LIST</p>
              <IOSGroupedCard colors={colors} isDark={isDark}>
                <IOSListCell title="Total Balance" value="$42,850" showChevron={false} colors={colors} isDark={isDark} />
                <IOSListCell title="Today's Gain" value="+$1,250" showChevron={false} colors={colors} isDark={isDark} />
                <IOSListCell title="View All Holdings" colors={colors} isDark={isDark} />
              </IOSGroupedCard>
            </div>

            {/* Settings List */}
            <div>
              <p className="text-[13px] font-medium mb-3" style={{ color: colors.secondaryLabel }}>SETTINGS LIST</p>
              <IOSGroupedCard colors={colors} isDark={isDark}>
                <div className="flex items-center justify-between px-4 py-3" style={{
                  background: isDark ? colors.secondaryBackground : colors.tertiaryBackground,
                  borderBottom: `0.5px solid ${colors.separator}`
                }}>
                  <span className="text-[17px]" style={{ color: colors.label }}>Push Notifications</span>
                  <IOSToggle enabled={toggleEnabled} colors={colors} />
                </div>
                <IOSListCell title="Sound" value="Default" colors={colors} isDark={isDark} />
                <IOSListCell title="Badge App Icon" value="On" colors={colors} isDark={isDark} />
              </IOSGroupedCard>
            </div>
          </div>
        </section>

        {/* Controls */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.label }}>Controls</h2>
          <p className="text-sm mb-6" style={{ color: colors.secondaryLabel }}>Buttons, toggles, and segmented controls</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Buttons */}
            <div className="rounded-2xl p-6" style={{ background: isDark ? colors.secondaryBackground : '#FFFFFF' }}>
              <p className="text-[13px] font-medium mb-4" style={{ color: colors.secondaryLabel }}>BUTTONS</p>
              <div className="flex flex-wrap gap-3">
                <IOSButton title="Filled" variant="filled" colors={colors} />
                <IOSButton title="Gray" variant="gray" colors={colors} />
                <IOSButton title="Tinted" variant="tinted" colors={colors} />
                <IOSButton title="Plain" variant="plain" colors={colors} />
              </div>
            </div>

            {/* Segmented Control */}
            <div className="rounded-2xl p-6" style={{ background: isDark ? colors.secondaryBackground : '#FFFFFF' }}>
              <p className="text-[13px] font-medium mb-4" style={{ color: colors.secondaryLabel }}>SEGMENTED CONTROL</p>
              <div className="space-y-4">
                <IOSSegmentedControl
                  options={['1D', '1W', '1M', '1Y', 'All']}
                  selected={segmentSelected}
                  colors={colors}
                  isDark={isDark}
                />
                <IOSSegmentedControl
                  options={['Overview', 'Holdings', 'Activity']}
                  selected={0}
                  colors={colors}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Alerts & Action Sheets */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.label }}>Alerts & Action Sheets</h2>
          <p className="text-sm mb-6" style={{ color: colors.secondaryLabel }}>Modal presentations with blur backgrounds</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Alert */}
            <div className="flex justify-center p-8 rounded-2xl" style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(28, 28, 30, 0.5) 0%, rgba(44, 44, 46, 0.5) 100%)'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%)'
            }}>
              <IOSAlert
                title="Confirm Investment"
                message="Are you sure you want to invest $1,000 in HDFC Balanced Advantage Fund?"
                colors={colors}
                isDark={isDark}
              />
            </div>

            {/* Action Sheet */}
            <div className="flex justify-center p-8 rounded-2xl" style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(28, 28, 30, 0.5) 0%, rgba(44, 44, 46, 0.5) 100%)'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%)'
            }}>
              <IOSActionSheet colors={colors} isDark={isDark} />
            </div>
          </div>
        </section>

        {/* Spacing Reference */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.label }}>Spacing & Layout</h2>
          <p className="text-sm mb-6" style={{ color: colors.secondaryLabel }}>iOS standard spacing values</p>

          <div className="rounded-2xl p-6" style={{ background: isDark ? colors.secondaryBackground : '#FFFFFF' }}>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {[
                { name: '4pt', value: 4 },
                { name: '8pt', value: 8 },
                { name: '12pt', value: 12 },
                { name: '16pt', value: 16 },
                { name: '20pt', value: 20 },
                { name: '24pt', value: 24 },
                { name: '32pt', value: 32 },
                { name: '44pt', value: 44 },
              ].map((space, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto rounded" style={{
                    width: space.value,
                    height: space.value,
                    background: colors.systemBlue
                  }} />
                  <p className="text-[11px] mt-2" style={{ color: colors.secondaryLabel }}>{space.name}</p>
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

export default DesignPageIOS;
