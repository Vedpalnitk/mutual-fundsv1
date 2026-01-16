import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NestDetailHeader from '@/components/nests/NestDetailHeader';
import NestAboutSection from '@/components/nests/NestAboutSection';
import NestPerformanceChart from '@/components/nests/NestPerformanceChart';
import NestHoldingsTable from '@/components/nests/NestHoldingsTable';
import NestManagerSection from '@/components/nests/NestManagerSection';
import { mutualFundList } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

const NestDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const slug = Array.isArray(id) ? id[0] : id;
  const [range, setRange] = useState<'1M' | '1Y' | '3Y' | '5Y'>('1Y');

  const mode = useMemo(() => {
    const rawMode = Array.isArray(router.query.mode) ? router.query.mode[0] : router.query.mode;
    return rawMode === 'admin' ? 'admin' : 'user';
  }, [router.query.mode]);

  const fund = useMemo(() => mutualFundList.find((n) => n.id === slug), [slug]);

  if (!fund) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center text-white mx-auto mb-4">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-primary font-medium">Loading fund...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen">
      <Navbar mode={mode} />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <NestDetailHeader nest={fund} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <NestPerformanceChart nest={fund} activeRange={range} onRangeChange={setRange} />
            <NestHoldingsTable holdings={fund.holdings} />
            <NestAboutSection about={fund.description} />
            <NestManagerSection
              name={fund.manager}
              description={`Managing since ${fund.inception}. Benchmarked to ${fund.benchmark}.`}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fund Facts */}
            <div className="glass-card p-6 reveal">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="title-3 text-primary">Fund Facts</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'AUM', value: `${fund.aumCr.toLocaleString()} Cr` },
                  { label: 'Expense Ratio', value: `${fund.expenseRatio}%` },
                  { label: 'Min Lump Sum', value: formatCurrency(fund.minLumpSum) },
                  { label: 'Exit Load', value: fund.exitLoad }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-secondary">{item.label}</span>
                    <span className="font-semibold text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                <button className="btn-primary w-full">
                  {mode === 'admin' ? 'Add to Model' : 'Start SIP'}
                </button>
                <button className="btn-ghost w-full">
                  Add to Watchlist
                </button>
              </div>
            </div>

            {/* AI Fit Score */}
            <div className="glass-card p-6 reveal glass-blue">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl gradient-blue-accent flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="title-3 text-primary">AI Fit Score</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">92</span>
                <span className="text-lg text-secondary">/ 100</span>
              </div>
              <div className="mt-3 progress-bar">
                <div className="progress-bar-fill-gradient" style={{ width: '92%' }} />
              </div>
              <p className="text-xs text-secondary mt-4 leading-relaxed">
                Aligned with aggressive growth persona and 10+ year horizon.
              </p>
              <button className="mt-4 text-sm text-blue font-medium hover:underline flex items-center gap-1">
                View Rationale
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NestDetailPage;
