import { formatCurrency } from '@/utils/formatters';

const InvestmentSummary = () => {
  const minInvestment = 24500;
  const estCagr = 15.2;

  return (
    <div className="glass-card p-6 reveal glass-blue">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-secondary font-medium">Live Minimum Amount</p>
      </div>

      <p className="text-3xl font-bold text-primary">{formatCurrency(minInvestment)}</p>

      <div className="mt-3 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-light flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-green">
          Estimated CAGR {estCagr}%
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button className="btn-primary flex-1 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Invest Now
        </button>
        <button className="btn-ghost flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Save
        </button>
      </div>
    </div>
  );
};

export default InvestmentSummary;
