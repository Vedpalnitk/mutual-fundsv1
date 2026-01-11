import { MutualFundHolding } from '@/utils/constants';
import { formatWeight } from '@/utils/formatters';

interface Props {
  holdings: MutualFundHolding[];
}

const NestHoldingsTable = ({ holdings }: Props) => {
  return (
    <div className="glass-card p-6 overflow-hidden reveal reveal-delay-2">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-blue-accent flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="title-3 text-primary">Top Holdings</h3>
        </div>
        <button className="text-sm text-blue font-medium hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Factsheet
        </button>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-separator/30">
              <th className="py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Holding</th>
              <th className="py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Sector</th>
              <th className="py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wide">Allocation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator/20">
            {holdings.map((holding, index) => (
              <tr key={holding.name} className="group hover:bg-blue-light/30 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-blue-subtle flex items-center justify-center text-xs font-bold text-blue">
                      {index + 1}
                    </div>
                    <p className="font-semibold text-primary group-hover:text-blue transition-colors">
                      {holding.name}
                    </p>
                  </div>
                </td>
                <td className="py-4">
                  <span className="chip text-xs">{holding.sector}</span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-fill-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-blue"
                        style={{ width: `${Math.min(holding.allocation * 5, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-primary w-14 text-right">{formatWeight(holding.allocation)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NestHoldingsTable;
