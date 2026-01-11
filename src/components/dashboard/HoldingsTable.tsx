import { formatCurrency, formatPercent } from '@/utils/formatters';

interface FundRow {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  risk: string;
  returns3y: number;
  returns5y: number;
  allocation: number;
  minSip: number;
}

interface HoldingsTableProps {
  rows: FundRow[];
}

const getRiskColor = (risk: string) => {
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

const HoldingsTable = ({ rows }: HoldingsTableProps) => {
  return (
    <div className="glass-card p-6 overflow-hidden reveal reveal-delay-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="title-3 text-primary">Recommended Funds</h3>
        <div className="flex items-center gap-2">
          <span className="chip-blue">Direct Plans</span>
          <span className="chip">Goal Aligned</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-separator/30">
              <th className="py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Fund</th>
              <th className="py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wide">Category</th>
              <th className="py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wide">3Y Return</th>
              <th className="py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wide">5Y Return</th>
              <th className="py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wide">Allocation</th>
              <th className="py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wide">Min SIP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator/20">
            {rows.map((row) => (
              <tr key={row.id} className="group hover:bg-blue-light/30 transition-colors">
                <td className="py-4">
                  <div>
                    <p className="font-semibold text-primary group-hover:text-blue transition-colors">{row.name}</p>
                    <span className={`${getRiskColor(row.risk)} mt-1 inline-block`}>{row.risk} Risk</span>
                  </div>
                </td>
                <td className="py-4">
                  <p className="text-sm text-primary">{row.category}</p>
                  <p className="text-xs text-secondary">{row.subCategory}</p>
                </td>
                <td className="py-4 text-right">
                  <span className="font-semibold text-green">{formatPercent(row.returns3y)}</span>
                </td>
                <td className="py-4 text-right">
                  <span className="font-semibold text-green">{formatPercent(row.returns5y)}</span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-fill-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-blue"
                        style={{ width: `${Math.min(row.allocation * 3, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-primary w-10">{row.allocation}%</span>
                  </div>
                </td>
                <td className="py-4 text-right text-secondary">
                  {formatCurrency(row.minSip)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;
