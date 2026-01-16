import { useState, useEffect } from 'react';

// V4 Color Palette
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#7C3AED',
  success: '#10B981',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
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
  secondary: '#A78BFA',
  success: '#34D399',
  cardBackground: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.12)',
  chipBorder: 'rgba(96, 165, 250, 0.2)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
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

interface ProfileMetric {
  label: string;
  value: string;
}

interface Persona {
  name: string;
  description: string;
  riskBand: string;
  behaviorSignals: string[];
}

interface AccountSummaryProps {
  metrics: ProfileMetric[];
  persona: Persona;
}

const AccountSummary = ({ metrics, persona }: AccountSummaryProps) => {
  const colors = useV4Colors();
  const isDark = useDarkMode();

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 24px ${colors.glassShadow}`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Investor Profile</h3>
        <button
          className="text-sm font-medium hover:underline transition-all"
          style={{ color: colors.primary }}
        >
          Edit profile
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-3 rounded-xl"
            style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
          >
            <p className="text-xs" style={{ color: colors.textSecondary }}>{metric.label}</p>
            <p className="text-sm font-semibold mt-1" style={{ color: colors.textPrimary }}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* AI Persona Section */}
      <div
        className="mt-5 p-4 rounded-xl"
        style={{
          background: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.06)',
          border: `1px solid ${colors.chipBorder}`
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xs uppercase font-semibold tracking-wide" style={{ color: colors.primary }}>AI Persona</p>
            </div>
            <h4 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{persona.name}</h4>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: colors.textSecondary }}>{persona.description}</p>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded font-semibold ml-4 flex-shrink-0"
            style={{
              background: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)',
              color: colors.primary
            }}
          >
            {persona.riskBand}
          </span>
        </div>

        {/* Behavior Signals */}
        <div className="mt-4 flex flex-wrap gap-2">
          {persona.behaviorSignals.map((signal) => (
            <span
              key={signal}
              className="text-xs px-2.5 py-1 rounded"
              style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
            >
              {signal}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;
