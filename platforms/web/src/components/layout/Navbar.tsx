import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { navLinks } from '@/utils/constants';
import { useTheme } from '@/context/ThemeContext';

// V4 Color Palette - Refined Blue
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  background: '#F8FAFC',
  cardBackground: 'rgba(255, 255, 255, 0.85)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.08)',
  chipBorder: 'rgba(37, 99, 235, 0.15)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
};

const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  background: '#0F172A',
  cardBackground: 'rgba(30, 41, 59, 0.85)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.12)',
  chipBorder: 'rgba(96, 165, 250, 0.2)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  glassShadow: 'rgba(0, 0, 0, 0.3)',
};

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

// Hook to get current V4 colors
const useV4Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT;
};

interface NavbarProps {
  mode?: 'admin' | 'user' | 'advisor';
}

const Navbar = ({ mode = 'user' }: NavbarProps) => {
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();
  const colors = useV4Colors();
  const isDark = useDarkMode();

  const scopedLinks = mode === 'admin'
    ? [
        { label: 'Overview', href: '/admin/dashboard' },
        { label: 'Funds', href: '/admin/funds' },
        { label: 'Users', href: '/admin/users' },
        { label: 'ML Studio', href: '/admin/ml' },
        { label: 'ML Config', href: '/admin/ml-config' },
        { label: 'Recommendations', href: '/admin/recommendations' },
      ]
    : mode === 'advisor'
    ? [
        { label: 'Dashboard', href: '/advisor/dashboard' },
        { label: 'Clients', href: '/advisor/clients' },
        { label: 'Prospects', href: '/advisor/prospects' },
        { label: 'Transactions', href: '/advisor/transactions' },
        { label: 'Deep Analysis', href: '/advisor/analysis' },
        { label: 'Reports', href: '/advisor/reports' },
        { label: 'Funds', href: '/advisor/funds' },
      ]
    : navLinks;

  const isActiveLink = (href: string) => {
    const currentPath = router.asPath.split('?')[0];
    const linkPath = href.split('?')[0];
    return currentPath === linkPath;
  };

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: colors.cardBackground,
        backdropFilter: 'blur(50px) saturate(200%)',
        WebkitBackdropFilter: 'blur(50px) saturate(200%)',
        borderBottom: `0.5px solid ${colors.cardBorder}`,
        boxShadow: `0 1px 3px ${colors.glassShadow}`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-white overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`
            }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M17 5H9a4 4 0 000 8h6a4 4 0 010 8H7"/>
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
          </div>
          <div>
            <p className="text-lg font-semibold transition-colors" style={{ color: colors.primary }}>
              Sparrow Invest
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {mode === 'admin' ? 'Admin Studio' : mode === 'advisor' ? 'Financial Advisor' : 'Smart Portfolio Manager'}
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {scopedLinks.map((link) => {
            const isActive = isActiveLink(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: isActive ? colors.chipBg : 'transparent',
                  color: isActive ? colors.primary : colors.textSecondary
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all"
            style={{
              background: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.08)',
              border: `1px solid ${colors.cardBorder}`,
              color: colors.textPrimary
            }}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>
          <Link
            href="/"
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.08)',
              border: `1px solid ${colors.cardBorder}`,
              color: colors.textPrimary
            }}
          >
            Sign Out
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
