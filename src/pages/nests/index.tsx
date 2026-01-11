import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';
import NestCard from '@/components/nests/NestCard';
import { discoverBanners, mutualFundList, popularThemes } from '@/utils/constants';

const ExploreNests = () => {
  const router = useRouter();
  const mode = useMemo(() => {
    const rawMode = Array.isArray(router.query.mode) ? router.query.mode[0] : router.query.mode;
    return rawMode === 'admin' ? 'admin' : 'user';
  }, [router.query.mode]);

  const coreFunds = mutualFundList.slice(0, 3);
  const growthFunds = mutualFundList.slice(1, 4);
  const stabilityFunds = mutualFundList.slice(3, 6);

  return (
    <div className="page-shell min-h-screen">
      <Navbar mode={mode} />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <PageHeader
          title={mode === 'admin' ? 'Fund Universe Control' : 'Mutual Fund Universe'}
          subtitle={
            mode === 'admin'
              ? 'Audit fund coverage, performance consistency, and fit score distribution.'
              : 'Curated Indian mutual funds with risk labels, performance history, and AI-fit signals.'
          }
          badge={mode === 'admin' ? 'Admin' : undefined}
          actions={<button className="btn-primary">{mode === 'admin' ? 'Export Universe' : 'Run Fit Check'}</button>}
        />

        {/* Discovery Banners */}
        <div className="grid md:grid-cols-2 gap-4">
          {discoverBanners.map((banner, index) => (
            <div
              key={banner.title}
              className={`glass-card p-6 reveal ${
                banner.tone === 'primary' ? 'glass-blue' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="text-sm text-secondary">{banner.title}</p>
              <h3 className="title-2 text-primary mt-2">{banner.description}</h3>
              <button className="btn-primary mt-4 text-sm">{banner.cta}</button>
            </div>
          ))}
        </div>

        {/* Core Portfolio Picks */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="title-3 text-primary">Core Portfolio Picks</h3>
            <button className="text-sm text-blue font-medium hover:underline">See all core funds</button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {coreFunds.map((fund) => (
              <NestCard key={fund.id} nest={fund} />
            ))}
          </div>
        </section>

        {/* Growth Acceleration */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="title-3 text-primary">Growth Acceleration</h3>
            <button className="text-sm text-blue font-medium hover:underline">View growth funds</button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {growthFunds.map((fund) => (
              <NestCard key={fund.id} nest={fund} />
            ))}
          </div>
        </section>

        {/* Stability & Income */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="title-3 text-primary">Stability & Income</h3>
            <button className="text-sm text-blue font-medium hover:underline">Debt funds</button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {stabilityFunds.map((fund) => (
              <NestCard key={`${fund.id}-stable`} nest={fund} />
            ))}
          </div>
        </section>

        {/* Popular Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="title-3 text-primary">Popular Categories</h3>
            <button className="text-sm text-blue font-medium hover:underline">Browse categories</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularThemes.map((theme) => (
              <div
                key={theme.name}
                className="glass-card p-4 hover:shadow-card-hover transition-all cursor-pointer group"
              >
                <p className="text-xs text-secondary uppercase tracking-wide">Category</p>
                <p className="text-base font-semibold text-primary mt-1 group-hover:text-blue transition-colors">
                  {theme.name}
                </p>
                <p className="text-xs text-secondary mt-2">{theme.funds} funds available</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ExploreNests;
