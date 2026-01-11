import Link from 'next/link';

const Home = () => {
  return (
    <div className="page-shell min-h-screen">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center text-white font-bold shadow-blue">
            MF
          </div>
          <span className="text-lg font-semibold text-primary brand-font">Mutual Funds</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="glass-card p-10 md:p-14 reveal">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-light mb-4">
                <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
                <span className="text-xs font-medium text-blue">AI-Powered Platform</span>
              </div>
              <h1 className="large-title text-primary">
                Intelligent mutual fund portfolios, crafted for{' '}
                <span className="bg-gradient-to-r from-blue-500 via-indigo to-purple bg-clip-text text-transparent">
                  smart investors
                </span>
              </h1>
              <p className="text-secondary mt-4 leading-relaxed">
                A modern, AI-first platform that builds investor personas, aligns portfolios to goals, and keeps recommendations transparent.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="chip-blue">iOS 26 Liquid Glass</span>
              <span className="chip">Persona-driven allocation</span>
              <span className="chip">Tax-aware fund mix</span>
            </div>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {/* Admin Access */}
            <Link
              href="/dashboard?mode=admin"
              className="surface-card p-6 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-secondary tracking-wide">Admin Access</p>
                  <h2 className="title-2 text-primary mt-2 group-hover:text-blue transition-colors">
                    Recommendation Studio
                  </h2>
                  <p className="text-sm text-secondary mt-2 leading-relaxed">
                    Review personas, risk guardrails, fund scoring, and investor mappings.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl gradient-blue-accent flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-6">
                <button className="btn-primary text-sm">Enter Admin</button>
              </div>
            </Link>

            {/* User Access */}
            <Link
              href="/dashboard?mode=user"
              className="surface-card p-6 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase text-secondary tracking-wide">User Access</p>
                  <h2 className="title-2 text-primary mt-2 group-hover:text-blue transition-colors">
                    Investor Journey
                  </h2>
                  <p className="text-sm text-secondary mt-2 leading-relaxed">
                    Create a profile, discover your persona, and track a goal-based portfolio.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-6">
                <button className="btn-primary text-sm">Enter User</button>
              </div>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
              title: 'AI-Powered Analysis',
              desc: 'Advanced algorithms for smarter fund selection'
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
              title: 'Goal Tracking',
              desc: 'Real-time progress towards your financial goals'
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Risk Management',
              desc: 'Smart risk profiling and portfolio balancing'
            }
          ].map((feature) => (
            <div key={feature.title} className="glass-card p-5 reveal">
              <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center text-white mb-3">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-primary">{feature.title}</h3>
              <p className="text-sm text-secondary mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-8 text-center">
        <p className="text-xs text-tertiary">
          2024 Mutual Funds. Powered by AI. Built with Liquid Glass design.
        </p>
      </footer>
    </div>
  );
};

export default Home;
