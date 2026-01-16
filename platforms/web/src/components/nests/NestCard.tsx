import Link from 'next/link';
import { MutualFund } from '@/utils/constants';
import { formatCurrency, formatPercent } from '@/utils/formatters';

interface NestCardProps {
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

const NestCard = ({ nest }: NestCardProps) => {
  return (
    <Link
      href={`/nests/${nest.id}`}
      className="glass-card p-5 block transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase text-secondary tracking-wide">
            {nest.category} &middot; {nest.subCategory}
          </p>
          <h3 className="text-lg font-semibold text-primary mt-1 group-hover:text-blue transition-colors truncate">
            {nest.name}
          </h3>
          <p className="text-xs text-secondary mt-1">{nest.fundHouse}</p>
        </div>
        <span className={`${getRiskStyle(nest.risk)} ml-3 flex-shrink-0`}>
          {nest.risk} Risk
        </span>
      </div>

      {/* Returns Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl gradient-blue-subtle">
          <p className="text-xs text-secondary">1Y Return</p>
          <p className="text-lg font-bold text-green">{formatPercent(nest.returns1y)}</p>
        </div>
        <div className="p-3 rounded-xl gradient-blue-subtle">
          <p className="text-xs text-secondary">3Y Return</p>
          <p className="text-lg font-bold text-green">{formatPercent(nest.returns3y)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-separator/20">
        <div>
          <p className="text-xs text-secondary">Min SIP</p>
          <p className="text-sm font-semibold text-primary">{formatCurrency(nest.minSip)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip text-xs">Expense {nest.expenseRatio}%</span>
          <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NestCard;
