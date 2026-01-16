import { useState, useEffect } from 'react';

// V4 Color Palette
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  success: '#10B981',
  error: '#EF4444',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
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
  success: '#34D399',
  error: '#F87171',
  cardBackground: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.12)',
  chipBorder: 'rgba(96, 165, 250, 0.2)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  glassShadow: 'rgba(0, 0, 0, 0.3)',
};

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

const useV4Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT;
};

interface WatchItem {
  name: string;
  category: string;
  nav: number;
  change: number;
}

interface WatchlistProps {
  items: WatchItem[];
}

const Watchlist = ({ items }: WatchlistProps) => {
  const colors = useV4Colors();

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 24px ${colors.glassShadow}`
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Watchlist</h3>
        </div>
        <button className="text-sm font-medium hover:underline" style={{ color: colors.primary }}>Manage</button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer"
            style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                {item.name}
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>{item.category}</p>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                NAV <span className="font-mono">{item.nav.toFixed(1)}</span>
              </p>
              <div className="flex items-center justify-end gap-1">
                <svg
                  className={`w-3 h-3 ${item.change < 0 ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: item.change >= 0 ? colors.success : colors.error }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span
                  className="text-xs font-semibold"
                  style={{ color: item.change >= 0 ? colors.success : colors.error }}
                >
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        className="mt-4 w-full py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-80"
        style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
      >
        Add to Watchlist
      </button>
    </div>
  );
};

export default Watchlist;
