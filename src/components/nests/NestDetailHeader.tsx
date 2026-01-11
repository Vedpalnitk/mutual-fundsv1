import { formatCurrency, formatPercent } from '@/utils/formatters';
import { MutualFund } from '@/utils/constants';

interface NestDetailHeaderProps {
  nest: MutualFund;
}

const getRiskStyle = (risk: string) => {
  switch (risk.toLowerCase()) {
    case 'low':
      return 'badge-green';
    case 'moderate':
      return 'badge-blue';
    case 'high':
      return 'badge-red';
    default:
      return 'badge';
  }
};

const NestDetailHeader = ({ nest }: NestDetailHeaderProps) => {
  return (
    <div className="glass-card p-6 reveal">
      {/* Background Gradient Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 gradient-blue opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left: Fund Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="chip-blue text-xs">{nest.category}</span>
            <span className="chip text-xs">{nest.subCategory}</span>
          </div>

          <h1 className="title-1 text-primary">{nest.name}</h1>

          <p className="text-sm text-secondary mt-2">
            {nest.fundHouse} &middot; Benchmark: {nest.benchmark}
          </p>

          {/* Returns Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="px-4 py-2 rounded-xl gradient-blue-subtle border border-blue-100/50">
              <span className="text-xs text-secondary block">1Y Return</span>
              <span className="text-lg font-bold text-green">{formatPercent(nest.returns1y)}</span>
            </div>
            <div className="px-4 py-2 rounded-xl gradient-blue-subtle border border-blue-100/50">
              <span className="text-xs text-secondary block">3Y Return</span>
              <span className="text-lg font-bold text-green">{formatPercent(nest.returns3y)}</span>
            </div>
            <div className="px-4 py-2 rounded-xl gradient-blue-subtle border border-blue-100/50">
              <span className="text-xs text-secondary block">5Y Return</span>
              <span className="text-lg font-bold text-green">{formatPercent(nest.returns5y)}</span>
            </div>
            <span className={`${getRiskStyle(nest.risk)} py-2`}>
              {nest.risk} Risk
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="lg:text-right flex-shrink-0">
          <p className="text-xs text-secondary mb-1">Minimum SIP</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(nest.minSip)}</p>

          <div className="mt-4 flex items-center gap-3 lg:justify-end">
            <button className="btn-ghost text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Watchlist
            </button>
            <button className="btn-primary text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start SIP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NestDetailHeader;
