import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';

// Tab Navigation Component
const DesignTabs = ({ active }: { active: 'v1' | 'v2' | 'v3' | 'v4' | 'ios' | 'android' }) => (
  <div className="flex flex-wrap gap-2 mb-8">
    <Link href="/admin/design">
      <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
        active === 'v1'
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}>
        v1 — Blue
      </span>
    </Link>
    <Link href="/admin/designv2">
      <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
        active === 'v2'
          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}>
        v2 — Purple
      </span>
    </Link>
    <Link href="/admin/designv3">
      <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
        active === 'v3'
          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}>
        v3 — Cyan
      </span>
    </Link>
    <Link href="/admin/designv4">
      <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
        active === 'v4'
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}>
        v4 — Refined Blue
      </span>
    </Link>
    <div className="w-px h-8 bg-gray-300 dark:bg-slate-600 mx-1" />
    <Link href="/admin/design-ios">
      <span className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all ${
        active === 'ios'
          ? 'text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
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
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`} style={active === 'android' ? {
        background: 'linear-gradient(135deg, #34A853 0%, #4285F4 100%)',
        boxShadow: '0 4px 14px rgba(52, 168, 83, 0.3)'
      } : {}}>
        Android
      </span>
    </Link>
  </div>
);

// Dynamic import for ECharts (SSR disabled)
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Financial Glass Card Component
const FinancialGlassCard = ({ title, balance, trend }: { title: string; balance: string; trend: number }) => {
  return (
    <div className="liquid-glass p-6 rounded-2xl max-w-xs relative overflow-hidden group">
      {/* Refractive Highlight */}
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rotate-12 pointer-events-none" />

      <div className="relative z-10">
        <span className="label">{title}</span>

        <div className="flex items-baseline gap-0.5 mt-1">
          <span className="text-lg font-bold tabular-data">$</span>
          <span className="text-2xl font-bold tracking-tight tabular-data">{balance}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 text-xs font-medium tabular-data">
            +{trend}%
          </div>
          <span className="text-secondary text-xs">vs last month</span>
        </div>

        <button className="pill-button w-full mt-5">
          View Portfolio
        </button>
      </div>
    </div>
  );
};

const DesignPage = () => {
  const [inputValue, setInputValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectValue, setSelectValue] = useState('option1');

  return (
    <div className="page-shell">
      <Navbar mode="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title="Design System"
          subtitle="Inter Font + Liquid Glass UI — Financial-grade components for modern fintech"
          badge="v1.0"
        />

        <DesignTabs active="v1" />

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
              <p className="text-sm text-secondary mb-4">Use <code className="text-blue bg-blue-50 px-2 py-0.5 rounded">.tabular-data</code> for aligned financial figures</p>

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
              <p className="text-sm text-secondary mb-4">Use <code className="text-blue bg-blue-50 px-2 py-0.5 rounded">.label</code> for microcopy</p>

              <div className="space-y-4">
                <div>
                  <span className="label">Account Balance</span>
                  <p className="text-2xl font-bold tabular-data mt-1">$52,847.32</p>
                </div>
                <div>
                  <span className="label">Monthly Returns</span>
                  <p className="text-2xl font-bold tabular-data mt-1 text-green">+12.4%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Glass Card Example */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Financial Glass Card</h2>
          <p className="text-secondary mb-6">Premium glass morphism card for financial dashboards</p>

          <div className="flex flex-wrap gap-6">
            <FinancialGlassCard
              title="Total Balance"
              balance="127,432"
              trend={8.4}
            />
            <FinancialGlassCard
              title="Monthly Returns"
              balance="4,892"
              trend={12.7}
            />
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Color Palette</h2>

          <div className="glass-card p-6 mb-6">
            <h3 className="h3 text-primary mb-4">Primary Blue Gradient</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: '#007AFF' }} />
                <p className="text-xs text-secondary">System Blue<br />#007AFF</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: '#0055D4' }} />
                <p className="text-xs text-secondary">Blue Mid<br />#0055D4</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl" style={{ background: '#003399' }} />
                <p className="text-xs text-secondary">Blue End<br />#003399</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl gradient-blue" />
                <p className="text-xs text-secondary">Blue Gradient</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="h3 text-primary mb-4">Semantic Colors</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-emerald-500" />
                <p className="text-xs text-secondary">Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-amber-500" />
                <p className="text-xs text-secondary">Warning</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-red-500" />
                <p className="text-xs text-secondary">Error</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-purple-500" />
                <p className="text-xs text-secondary">Purple</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-cyan-500" />
                <p className="text-xs text-secondary">Teal</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-indigo-500" />
                <p className="text-xs text-secondary">Indigo</p>
              </div>
            </div>
          </div>
        </section>

        {/* Icons */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Icons</h2>
          <p className="text-secondary mb-6">Common fintech icons with consistent styling</p>

          <div className="glass-card p-8">
            <div className="space-y-8">
              {/* Primary Icons */}
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
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-xs text-secondary">{icon.name}</span>
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
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-xs text-secondary">{icon.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Icons */}
              <div className="space-y-4">
                <h3 className="h3 text-primary">Status Icons</h3>
                <div className="flex flex-wrap items-center gap-6">
                  {[
                    { name: 'Trending Up', path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { name: 'Trending Down', path: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                    { name: 'Check', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { name: 'Warning', path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                    { name: 'Error', path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                    { name: 'Info', path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  ].map((icon) => (
                    <div key={icon.name} className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-xl ${icon.bg} flex items-center justify-center`}>
                        <svg className={`w-6 h-6 ${icon.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-xs text-secondary">{icon.name}</span>
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
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                        </svg>
                      </div>
                      <span className="text-xs text-secondary">{icon.name}</span>
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
          <p className="text-secondary mb-6">All buttons use pill shape (rounded-full) for modern aesthetic</p>

          <div className="glass-card p-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="h3 text-primary">Primary Buttons</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-primary">Primary Action</button>
                  <button className="btn-primary">Get Started</button>
                  <button className="btn-primary opacity-50 cursor-not-allowed">Disabled</button>
                </div>
                <p className="text-xs text-tertiary">Blue gradient with shadow — Main CTA actions</p>
              </div>

              <div className="border-t border-separator pt-8 space-y-4">
                <h3 className="h3 text-primary">Secondary Buttons</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-secondary">Learn More</button>
                  <button className="btn-secondary">View Details</button>
                </div>
                <p className="text-xs text-tertiary">Light blue background — Secondary actions</p>
              </div>

              <div className="border-t border-separator pt-8 space-y-4">
                <h3 className="h3 text-primary">Ghost & Glass Buttons</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-ghost">Ghost Button</button>
                  <button className="btn-glass">Glass Button</button>
                </div>
                <p className="text-xs text-tertiary">Subtle options — Tertiary actions, navigation</p>
              </div>

              <div className="border-t border-separator pt-8 space-y-4">
                <h3 className="h3 text-primary">Pill Button (Hero)</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="pill-button">Start Investing</button>
                  <button className="pill-button">Create Portfolio</button>
                </div>
                <p className="text-xs text-tertiary">Larger pill style — Hero sections, prominent CTAs</p>
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
              <p className="text-xs text-tertiary mt-2">Frosted glass with specular highlight</p>
            </div>

            <div>
              <div className="surface-card p-6 h-40 flex items-center justify-center">
                <span className="text-secondary">Surface Card</span>
              </div>
              <p className="text-xs text-tertiary mt-2">Solid with subtle glass, hover lift</p>
            </div>

            <div>
              <div className="liquid-glass rounded-3xl p-6 h-40 flex items-center justify-center">
                <span className="text-secondary">Liquid Glass</span>
              </div>
              <p className="text-xs text-tertiary mt-2">Maximum blur with refractive highlight</p>
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
                  <span className="label mb-2 block">Investment Amount</span>
                  <input
                    type="text"
                    className="input-glass tabular-data"
                    placeholder="$10,000"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="label mb-2 block">Fund Category</span>
                  <select className="input-glass">
                    <option>Large Cap Equity</option>
                    <option>Mid Cap Equity</option>
                    <option>Debt Funds</option>
                  </select>
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="label mb-2 block">Investment Goal</span>
                  <textarea
                    className="input-glass resize-none"
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
                  <span className="badge">Default</span>
                  <span className="badge-blue">Active</span>
                  <span className="badge-green">Profit</span>
                  <span className="badge-red">Loss</span>
                </div>
              </div>

              <div>
                <h3 className="h3 text-primary mb-4">Chips</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="chip">Large Cap</span>
                  <span className="chip-blue">Equity</span>
                  <span className="chip-purple">Hybrid</span>
                  <span className="chip-teal">Debt</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modals & Dropdowns */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Modals & Dropdowns</h2>
          <p className="text-secondary mb-6">Interactive overlay components for user actions</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Modal Triggers */}
            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Modals</h3>
              <p className="text-sm text-secondary mb-4">Click buttons to preview modal styles</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary"
                >
                  Open Modal
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Confirm Dialog
                </button>
              </div>
            </div>

            {/* Dropdowns */}
            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Dropdowns</h3>
              <p className="text-sm text-secondary mb-4">Menu and select dropdown variants</p>
              <div className="flex flex-wrap gap-4">
                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-primary flex items-center gap-2 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                  >
                    <span>Actions</span>
                    <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50">
                      <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View Details
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Duplicate
                      </button>
                      <div className="border-t border-gray-100 dark:border-slate-700 my-2"></div>
                      <button className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
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
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-primary focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="option1">Select Fund Type</option>
                  <option value="equity">Equity Funds</option>
                  <option value="debt">Debt Funds</option>
                  <option value="hybrid">Hybrid Funds</option>
                  <option value="index">Index Funds</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Preview Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Modal Preview (Static)</h3>
              <div className="bg-gray-900/50 dark:bg-black/50 rounded-xl p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm mx-auto overflow-hidden">
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-primary mb-2">Add Investment</h4>
                    <p className="text-sm text-secondary mb-4">Enter the amount you want to invest in this fund.</p>
                    <input type="text" placeholder="₹10,000" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm mb-4" />
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-secondary">Cancel</button>
                      <button className="flex-1 btn-primary">Invest</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="h3 text-primary mb-4">Confirm Dialog Preview (Static)</h3>
              <div className="bg-gray-900/50 dark:bg-black/50 rounded-xl p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm mx-auto overflow-hidden">
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h4 className="text-lg font-semibold text-primary mb-2">Confirm Redemption</h4>
                    <p className="text-sm text-secondary mb-4">Are you sure you want to redeem ₹50,000 from this fund?</p>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-secondary">Cancel</button>
                      <button className="flex-1 px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white">Redeem</button>
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
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-primary">Add Investment</h4>
                  <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                    <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-sm text-secondary mb-4">Enter the amount you want to invest in this fund. Minimum investment is ₹500.</p>
                <input type="text" placeholder="₹10,000" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm mb-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-secondary hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                  <button onClick={() => setShowModal(false)} className="flex-1 btn-primary">Invest Now</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h4 className="text-lg font-semibold text-primary mb-2">Confirm Redemption</h4>
                <p className="text-sm text-secondary mb-6">Are you sure you want to redeem ₹50,000 from this fund? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-secondary hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                  <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Confirm Redeem</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Tables</h2>
          <p className="text-secondary mb-6">Financial data tables with proper padding and alignment</p>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Fund Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">NAV</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Units</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Value</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Returns</th>
                  </tr>
                </thead>
                <tbody className="tabular-data">
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-primary">HDFC Mid-Cap Opportunities</td>
                    <td className="px-5 py-3 text-secondary">Mid Cap</td>
                    <td className="px-5 py-3 text-right">₹142.35</td>
                    <td className="px-5 py-3 text-right">245.678</td>
                    <td className="px-5 py-3 text-right font-medium">₹34,967.42</td>
                    <td className="px-5 py-3 text-right text-green font-medium">+18.4%</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-primary">Axis Bluechip Fund</td>
                    <td className="px-5 py-3 text-secondary">Large Cap</td>
                    <td className="px-5 py-3 text-right">₹56.78</td>
                    <td className="px-5 py-3 text-right">1,234.567</td>
                    <td className="px-5 py-3 text-right font-medium">₹70,098.76</td>
                    <td className="px-5 py-3 text-right text-green font-medium">+12.7%</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-primary">SBI Small Cap Fund</td>
                    <td className="px-5 py-3 text-secondary">Small Cap</td>
                    <td className="px-5 py-3 text-right">₹89.23</td>
                    <td className="px-5 py-3 text-right">567.890</td>
                    <td className="px-5 py-3 text-right font-medium">₹50,678.12</td>
                    <td className="px-5 py-3 text-right text-red font-medium">-3.2%</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-primary">ICICI Pru Liquid Fund</td>
                    <td className="px-5 py-3 text-secondary">Debt</td>
                    <td className="px-5 py-3 text-right">₹312.45</td>
                    <td className="px-5 py-3 text-right">89.234</td>
                    <td className="px-5 py-3 text-right font-medium">₹27,876.54</td>
                    <td className="px-5 py-3 text-right text-green font-medium">+6.8%</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200">
                    <td colSpan={4} className="px-5 py-3 font-semibold text-primary">Total Portfolio Value</td>
                    <td className="px-5 py-3 text-right font-bold text-blue">₹1,83,620.84</td>
                    <td className="px-5 py-3 text-right font-bold text-green">+14.2%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Compact Table */}
          <div className="glass-card overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Scheme</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">1Y</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">3Y</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">5Y</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Risk</th>
                  </tr>
                </thead>
                <tbody className="tabular-data">
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-primary font-medium">Mirae Asset Large Cap</td>
                    <td className="px-4 py-2.5 text-right text-green">+22.4%</td>
                    <td className="px-4 py-2.5 text-right text-green">+15.8%</td>
                    <td className="px-4 py-2.5 text-right text-green">+18.2%</td>
                    <td className="px-4 py-2.5 text-center"><span className="badge-green">Low</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-primary font-medium">Parag Parikh Flexi Cap</td>
                    <td className="px-4 py-2.5 text-right text-green">+28.6%</td>
                    <td className="px-4 py-2.5 text-right text-green">+19.4%</td>
                    <td className="px-4 py-2.5 text-right text-green">+21.7%</td>
                    <td className="px-4 py-2.5 text-center"><span className="badge-blue">Moderate</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-primary font-medium">Quant Small Cap</td>
                    <td className="px-4 py-2.5 text-right text-red">-5.2%</td>
                    <td className="px-4 py-2.5 text-right text-green">+32.1%</td>
                    <td className="px-4 py-2.5 text-right text-green">+38.9%</td>
                    <td className="px-4 py-2.5 text-center"><span className="badge-red">High</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="mb-12">
          <h2 className="h2 text-primary mb-6">Charts & Visualizations</h2>
          <p className="text-secondary mb-6">ECharts-powered financial visualizations</p>

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
                    borderColor: 'rgba(0, 122, 255, 0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#1F2937', fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15); border-radius: 10px;',
                  },
                  grid: { top: 20, right: 20, bottom: 30, left: 50 },
                  xAxis: {
                    type: 'category',
                    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    axisLine: { lineStyle: { color: 'rgba(0, 122, 255, 0.1)' } },
                    axisLabel: { color: '#6B7280', fontSize: 11 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(0, 122, 255, 0.06)', type: 'dashed' } },
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
                          { offset: 0, color: '#007AFF' },
                          { offset: 0.5, color: '#0055D4' },
                          { offset: 1, color: '#5856D6' }
                        ]
                      },
                      shadowColor: 'rgba(0, 122, 255, 0.3)',
                      shadowBlur: 10,
                      shadowOffsetY: 5
                    },
                    itemStyle: { color: '#007AFF', borderWidth: 2, borderColor: '#fff' },
                    areaStyle: {
                      color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(0, 122, 255, 0.2)' },
                          { offset: 0.5, color: 'rgba(0, 85, 212, 0.08)' },
                          { offset: 1, color: 'rgba(0, 122, 255, 0)' }
                        ]
                      }
                    },
                    emphasis: { focus: 'series', itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0, 122, 255, 0.5)' } }
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
                    borderColor: 'rgba(0, 122, 255, 0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#1F2937', fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15); border-radius: 10px;',
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
                        shadowColor: 'rgba(0, 122, 255, 0.3)'
                      }
                    },
                    data: [
                      { value: 40, name: 'Large Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#007AFF' }, { offset: 1, color: '#0055D4' }] } } },
                      { value: 25, name: 'Mid Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#5856D6' }, { offset: 1, color: '#7C3AED' }] } } },
                      { value: 20, name: 'Small Cap', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#EC4899' }, { offset: 1, color: '#DB2777' }] } } },
                      { value: 15, name: 'Debt', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#14B8A6' }, { offset: 1, color: '#0D9488' }] } } },
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
                    borderColor: 'rgba(0, 122, 255, 0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#1F2937', fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15); border-radius: 10px;',
                    formatter: '{b}: <strong>{c}%</strong>'
                  },
                  grid: { top: 20, right: 20, bottom: 40, left: 50 },
                  xAxis: {
                    type: 'category',
                    data: ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'Debt'],
                    axisLine: { lineStyle: { color: 'rgba(0, 122, 255, 0.1)' } },
                    axisLabel: { color: '#6B7280', fontSize: 10 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(0, 122, 255, 0.06)', type: 'dashed' } },
                    axisLabel: { color: '#6B7280', fontSize: 11, formatter: '{value}%' },
                  },
                  series: [{
                    data: [
                      { value: 14.2, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#007AFF' }, { offset: 1, color: '#0055D4' }] }, shadowColor: 'rgba(0, 122, 255, 0.3)', shadowBlur: 8 } },
                      { value: 18.5, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#5856D6' }, { offset: 1, color: '#4338CA' }] }, shadowColor: 'rgba(88, 86, 214, 0.3)', shadowBlur: 8 } },
                      { value: 22.8, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#EC4899' }, { offset: 1, color: '#DB2777' }] }, shadowColor: 'rgba(236, 72, 153, 0.3)', shadowBlur: 8 } },
                      { value: 16.4, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: '#D97706' }] }, shadowColor: 'rgba(245, 158, 11, 0.3)', shadowBlur: 8 } },
                      { value: 7.2, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#14B8A6' }, { offset: 1, color: '#0D9488' }] }, shadowColor: 'rgba(20, 184, 166, 0.3)', shadowBlur: 8 } },
                    ],
                    type: 'bar',
                    barWidth: '55%',
                    itemStyle: { borderRadius: [6, 6, 0, 0] },
                    emphasis: { itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0, 122, 255, 0.4)' } }
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
                    borderColor: 'rgba(0, 122, 255, 0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#1F2937', fontSize: 12 },
                    extraCssText: 'box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15); border-radius: 10px;',
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
                    axisLine: { lineStyle: { color: 'rgba(0, 122, 255, 0.1)' } },
                    axisLabel: { color: '#6B7280', fontSize: 11 },
                    axisTick: { show: false },
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: 'rgba(0, 122, 255, 0.06)', type: 'dashed' } },
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
                        color: '#007AFF',
                        width: 3,
                        shadowColor: 'rgba(0, 122, 255, 0.3)',
                        shadowBlur: 8,
                        shadowOffsetY: 4
                      },
                      itemStyle: { color: '#007AFF' },
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
                        color: '#5856D6',
                        width: 2.5,
                        shadowColor: 'rgba(88, 86, 214, 0.2)',
                        shadowBlur: 6,
                        shadowOffsetY: 3
                      },
                      itemStyle: { color: '#5856D6' },
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
                <span className="label">Goal Progress</span>
                <span className="text-sm font-semibold text-blue tabular-data">65%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: '65%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="label">Portfolio Allocation</span>
                <span className="text-sm font-semibold text-blue tabular-data">80%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill progress-bar-fill-gradient" style={{ width: '80%' }} />
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
                    className="h-4 rounded gradient-blue"
                    style={{ width: `${px * 3}px` }}
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

export default DesignPage;
