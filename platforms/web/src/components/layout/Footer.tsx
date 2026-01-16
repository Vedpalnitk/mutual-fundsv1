import { useState, useEffect } from 'react';

// V4 Color Palette - Refined Blue
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  cardBackground: 'rgba(255, 255, 255, 0.85)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.08)',
  chipBorder: 'rgba(37, 99, 235, 0.15)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
};

const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  cardBackground: 'rgba(30, 41, 59, 0.85)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.12)',
  chipBorder: 'rgba(96, 165, 250, 0.2)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
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

const Footer = () => {
  const colors = useV4Colors();

  return (
    <footer
      className="mt-16"
      style={{
        background: colors.cardBackground,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderTop: `0.5px solid ${colors.cardBorder}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 -2px 20px ${colors.glassShadow}`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M17 5H9a4 4 0 000 8h6a4 4 0 010 8H7"/>
              </svg>
            </div>
            <p className="text-lg font-semibold" style={{ color: colors.primary }}>Sparrow Invest</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
            AI-powered portfolio management with goal-aligned mutual fund recommendations.
          </p>
        </div>

        {/* Product Links */}
        <div>
          <p className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Product</p>
          <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
            <li className="transition-colors cursor-pointer hover:opacity-80">Dashboard</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">Fund Universe</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">Portfolio Builder</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">Investor Profile</li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <p className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Resources</p>
          <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
            <li className="transition-colors cursor-pointer hover:opacity-80">Help Center</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">Documentation</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">API Reference</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">Contact Support</li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <p className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Legal</p>
          <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
            <li className="transition-colors cursor-pointer hover:opacity-80">Privacy Policy</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">Terms of Service</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">Regulatory Disclosures</li>
            <li className="transition-colors cursor-pointer hover:opacity-80">Risk Disclaimer</li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            2024 Sparrow Invest. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
            >
              iOS 26 Liquid Glass
            </span>
            <span className="text-xs" style={{ color: colors.textTertiary }}>Powered by AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
