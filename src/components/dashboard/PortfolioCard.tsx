import { formatCurrency, formatPercent } from '@/utils/formatters';

interface PortfolioCardProps {
  title: string;
  value: number;
  changePct: number;
  series: number[];
  confidence: string;
  ctaLabel: string;
}

const PortfolioCard = ({ title, value, changePct, series, confidence, ctaLabel }: PortfolioCardProps) => {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min || 1)) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="glass-card p-6 reveal">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-secondary">{title}</p>
          <h2 className="text-3xl font-bold text-primary mt-1 tracking-tight">
            {formatCurrency(value)}
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="badge-green font-semibold">
              {formatPercent(changePct)}
            </span>
            <p className="text-xs text-secondary">Projected CAGR</p>
            <span className="badge">
              Confidence: {confidence}
            </span>
          </div>
        </div>
        <button className="btn-primary text-sm">{ctaLabel}</button>
      </div>

      {/* Chart */}
      <div className="relative p-4 rounded-2xl gradient-blue-subtle">
        <svg viewBox="0 0 100 60" className="w-full h-32" preserveAspectRatio="none">
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007AFF" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#5856D6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#007AFF" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#007AFF" />
              <stop offset="50%" stopColor="#5856D6" />
              <stop offset="100%" stopColor="#AF52DE" />
            </linearGradient>
          </defs>
          {/* Fill area */}
          <polyline
            fill="url(#portfolioGradient)"
            stroke="none"
            points={`0,60 ${points} 100,60`}
          />
          {/* Line */}
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {/* End dot */}
          <circle
            cx={100}
            cy={series.length > 0 ? 60 - ((series[series.length - 1] - min) / (max - min || 1)) * 60 : 30}
            r="4"
            fill="#007AFF"
            className="drop-shadow-md"
          />
        </svg>

        {/* Chart Labels */}
        <div className="mt-4 flex items-center justify-between text-xs text-secondary">
          <span>Goal year projection</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full gradient-blue" />
            <span>Auto-refreshes monthly</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
