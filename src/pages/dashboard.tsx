import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';
import PortfolioCard from '@/components/dashboard/PortfolioCard';
import AccountSummary from '@/components/dashboard/AccountSummary';
import MoversList from '@/components/dashboard/MoversList';
import HoldingsTable from '@/components/dashboard/HoldingsTable';
import Watchlist from '@/components/dashboard/Watchlist';
import {
  aiSignals,
  engineModules,
  fundWatchlist,
  investorProfiles,
  personaProfile,
  personaProfiles,
  personaRules,
  portfolioProjection,
  portfolioSummary,
  profileHighlights,
  recommendedAllocation,
  recommendedFunds
} from '@/utils/constants';

const Dashboard = () => {
  const router = useRouter();
  const mode = useMemo(() => {
    const rawMode = Array.isArray(router.query.mode) ? router.query.mode[0] : router.query.mode;
    return rawMode === 'admin' ? 'admin' : 'user';
  }, [router.query.mode]);
  const isAdmin = mode === 'admin';

  return (
    <div className="page-shell min-h-screen">
      <Navbar mode={mode} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader
          title={isAdmin ? 'Recommendation Studio' : 'AI Portfolio Manager'}
          subtitle={
            isAdmin
              ? 'Monitor personas, guardrails, scoring layers, and portfolio drift.'
              : 'Institutional-grade investor profiling and goal-aligned mutual fund portfolios.'
          }
          badge={isAdmin ? 'Admin' : undefined}
          actions={<button className="btn-primary">{isAdmin ? 'Run Audit' : 'Review Plan'}</button>}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioCard
              title={isAdmin ? 'Aggregate Goal Coverage' : 'Projected Goal Value'}
              value={portfolioSummary.projectedValue}
              changePct={portfolioSummary.expectedCagr}
              series={portfolioProjection}
              confidence={portfolioSummary.confidence}
              ctaLabel={isAdmin ? 'Export Report' : 'Rebalance Now'}
            />

            <AccountSummary metrics={profileHighlights} persona={personaProfile} />

            {/* Allocation Mix */}
            <div className="glass-card p-6 reveal reveal-delay-2">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl gradient-blue-accent flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  <h3 className="title-3 text-primary">Recommended Allocation</h3>
                </div>
                <button className="text-sm text-blue font-medium hover:underline">Why this mix?</button>
              </div>
              <div className="space-y-4">
                {recommendedAllocation.map((bucket) => (
                  <div key={bucket.label} className="p-4 rounded-2xl gradient-blue-subtle border border-blue-100/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary">{bucket.label}</span>
                      <span className="font-bold text-blue">{bucket.value}%</span>
                    </div>
                    <div className="mt-3 progress-bar">
                      <div
                        className="progress-bar-fill-gradient"
                        style={{ width: `${bucket.value}%` }}
                      />
                    </div>
                    <p className="text-xs text-secondary mt-2">{bucket.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <HoldingsTable rows={recommendedFunds} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin: Engine Modules */}
            {isAdmin && (
              <div className="glass-card p-6 reveal">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h3 className="title-3 text-primary">Engine Modules</h3>
                </div>
                <p className="text-sm text-secondary mb-4">
                  Real-time insight into model scoring, constraints, and compliance.
                </p>
                <div className="space-y-3">
                  {engineModules.map((module) => (
                    <div key={module.title} className="p-3 rounded-xl gradient-blue-subtle border border-blue-100/50">
                      <p className="text-sm font-semibold text-primary">{module.title}</p>
                      <p className="text-xs text-secondary mt-1">{module.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin: Persona Rules */}
            {isAdmin && (
              <div className="glass-card p-6 reveal">
                <h3 className="title-3 text-primary">Persona Rules Engine</h3>
                <p className="text-sm text-secondary mt-1 mb-4">
                  Signals derived from age, horizon, cash-flow resilience, and drawdown tolerance.
                </p>
                <div className="space-y-3">
                  {personaRules.map((rule) => (
                    <div key={rule.label} className="p-3 rounded-xl gradient-blue-subtle border border-blue-100/50">
                      <p className="text-sm font-semibold text-primary">{rule.label}</p>
                      <p className="text-xs text-secondary mt-1">{rule.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin: Persona Library */}
            {isAdmin && (
              <div className="glass-card p-6 reveal">
                <h3 className="title-3 text-primary">Persona Library</h3>
                <p className="text-sm text-secondary mt-1 mb-4">Active personas and allocation biases.</p>
                <div className="space-y-3">
                  {personaProfiles.map((persona) => (
                    <div key={persona.name} className="p-4 rounded-2xl bg-glass-thin border border-glass-border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-primary">{persona.name}</p>
                        <span className="chip">{persona.riskBand}</span>
                      </div>
                      <p className="text-xs text-secondary mt-2">{persona.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin: Investor Profiles */}
            {isAdmin && (
              <div className="glass-card p-6 reveal">
                <h3 className="title-3 text-primary">Investor Profiles</h3>
                <p className="text-sm text-secondary mt-1 mb-4">Profiles mapped to personas and status.</p>
                <div className="space-y-3">
                  {investorProfiles.map((profile) => (
                    <div key={profile.id} className="p-4 rounded-2xl gradient-blue-subtle border border-blue-100/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-primary">{profile.name}</p>
                        <span className="badge-blue">{profile.status}</span>
                      </div>
                      <p className="text-xs text-secondary mt-1">
                        Persona {profile.persona} &middot; {profile.horizonYears}Y &middot; SIP {profile.monthlySip.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <MoversList data={aiSignals} />
            <Watchlist items={fundWatchlist} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
