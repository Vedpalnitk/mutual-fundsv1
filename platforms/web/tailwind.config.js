/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // V4 Refined Blue Palette
        blue: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          light: 'rgba(37, 99, 235, 0.12)',
        },
        // Semantic Colors
        green: {
          DEFAULT: '#34C759',
          light: 'rgba(52, 199, 89, 0.12)',
        },
        red: {
          DEFAULT: '#FF3B30',
          light: 'rgba(255, 59, 48, 0.12)',
        },
        orange: {
          DEFAULT: '#FF9500',
          light: 'rgba(255, 149, 0, 0.12)',
        },
        purple: {
          DEFAULT: '#AF52DE',
          light: 'rgba(175, 82, 222, 0.12)',
        },
        indigo: {
          DEFAULT: '#5856D6',
          light: 'rgba(88, 86, 214, 0.12)',
        },
        teal: {
          DEFAULT: '#5AC8FA',
          light: 'rgba(90, 200, 250, 0.12)',
        },
        // Label Colors
        label: {
          primary: '#000000',
          secondary: 'rgba(60, 60, 67, 0.6)',
          tertiary: 'rgba(60, 60, 67, 0.3)',
          quaternary: 'rgba(60, 60, 67, 0.18)',
        },
        // Fill Colors
        fill: {
          primary: 'rgba(120, 120, 128, 0.2)',
          secondary: 'rgba(120, 120, 128, 0.16)',
          tertiary: 'rgba(118, 118, 128, 0.12)',
          quaternary: 'rgba(116, 116, 128, 0.08)',
        },
        // Glass Colors
        glass: {
          thin: 'rgba(255, 255, 255, 0.6)',
          regular: 'rgba(255, 255, 255, 0.78)',
          thick: 'rgba(255, 255, 255, 0.92)',
          border: 'rgba(255, 255, 255, 0.5)',
        },
        // System Backgrounds
        system: {
          background: '#FFFFFF',
          secondary: '#F2F2F7',
          tertiary: '#FFFFFF',
        },
        // Separator
        separator: {
          DEFAULT: 'rgba(60, 60, 67, 0.29)',
          opaque: '#C6C6C8',
        },
      },
      boxShadow: {
        'glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 2px 20px rgba(0, 0, 0, 0.08)',
        'glass-lg': 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 8px 32px rgba(0, 0, 0, 0.08)',
        'blue': '0 4px 14px rgba(37, 99, 235, 0.35)',
        'blue-lg': '0 8px 24px rgba(37, 99, 235, 0.25)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 8px 32px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '28px',
        '3xl': '32px',
        '4xl': '40px',
      },
      fontFamily: {
        sans: ['Nunito', '-apple-system-rounded', 'SF Pro Rounded', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        rounded: ['Nunito', '-apple-system-rounded', 'SF Pro Rounded', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'large-title': ['32px', { lineHeight: '38px', letterSpacing: '0.37px', fontWeight: '700' }],
        'title-1': ['26px', { lineHeight: '32px', letterSpacing: '0.36px', fontWeight: '700' }],
        'title-2': ['21px', { lineHeight: '26px', letterSpacing: '0.35px', fontWeight: '700' }],
        'title-3': ['19px', { lineHeight: '24px', letterSpacing: '0.38px', fontWeight: '600' }],
        'headline': ['15px', { lineHeight: '20px', letterSpacing: '-0.41px', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '20px', letterSpacing: '-0.24px', fontWeight: '400' }],
        'callout': ['15px', { lineHeight: '20px', letterSpacing: '-0.32px', fontWeight: '400' }],
        'subheadline': ['14px', { lineHeight: '19px', letterSpacing: '-0.24px', fontWeight: '400' }],
        'footnote': ['13px', { lineHeight: '18px', letterSpacing: '-0.08px', fontWeight: '400' }],
        'caption-1': ['12px', { lineHeight: '16px', letterSpacing: '0px', fontWeight: '400' }],
        'caption-2': ['11px', { lineHeight: '13px', letterSpacing: '0.07px', fontWeight: '400' }],
      },
      backdropBlur: {
        'glass': '40px',
        'glass-thick': '50px',
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)',
        'gradient-blue-accent': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 40%, #5856D6 100%)',
        'gradient-blue-subtle': 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(96, 165, 250, 0.04) 100%)',
        'gradient-radial-blue': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.12) 0%, transparent 50%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-blue': 'pulse-blue 2s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-blue': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(37, 99, 235, 0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    }
  },
  plugins: []
};
