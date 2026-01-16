import { MutualFund } from '@/utils/constants';

interface Props {
  nest: MutualFund;
  activeRange: '1M' | '1Y' | '3Y' | '5Y';
  onRangeChange: (range: Props['activeRange']) => void;
}

const NestPerformanceChart = ({ nest, activeRange, onRangeChange }: Props) => {
  const values = nest.performance.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = nest.performance
    .map((p, i) => {
      const x = (i / (nest.performance.length - 1)) * 100;
      const y = 100 - ((p.value - min) / (max - min || 1)) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const ranges: Props['activeRange'][] = ['1M', '1Y', '3Y', '5Y'];
  const latestValue = values[values.length - 1] || 100;
  const growth = latestValue - 100;

  return (
    <div className="glass-card p-6 reveal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-secondary">Fund Performance</p>
          <div className="flex items-baseline gap-3 mt-1">
            <h3 className="title-2 text-primary">Growth of 100</h3>
            <span className={`text-lg font-bold ${growth >= 0 ? 'text-green' : 'text-red'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center p-1 rounded-xl bg-fill-quaternary">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeRange === range
                  ? 'gradient-blue text-white shadow-blue'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative p-4 rounded-2xl gradient-blue-subtle">
        <svg viewBox="0 0 100 60" className="w-full h-48" preserveAspectRatio="none">
          <defs>
            <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#5856D6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="perfLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#5856D6" />
              <stop offset="100%" stopColor="#AF52DE" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(37,99,235,0.1)" strokeWidth="0.5" />
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(37,99,235,0.1)" strokeWidth="0.5" />

          {/* Fill Area */}
          <polyline
            fill="url(#perfGradient)"
            stroke="none"
            points={`0,60 ${points} 100,60`}
          />

          {/* Line */}
          <polyline
            fill="none"
            stroke="url(#perfLineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* End Dot */}
          <circle
            cx={100}
            cy={values.length > 0 ? 60 - ((values[values.length - 1] - min) / (max - min || 1)) * 60 : 30}
            r="4"
            fill="#2563EB"
            className="drop-shadow-md"
          />
        </svg>

        {/* Value Labels */}
        <div className="absolute top-4 left-4 flex flex-col gap-6">
          <span className="text-xs text-secondary">{max}</span>
          <span className="text-xs text-secondary">{Math.round((max + min) / 2)}</span>
          <span className="text-xs text-secondary">{min}</span>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {ranges.map((range) => {
          const returnValue = range === '1Y' ? nest.returns1y :
                              range === '3Y' ? nest.returns3y :
                              range === '5Y' ? nest.returns5y : nest.returns1y * 0.1;
          return (
            <div
              key={range}
              className={`p-3 rounded-xl text-center transition-all ${
                activeRange === range ? 'glass-blue' : 'bg-fill-quaternary'
              }`}
            >
              <p className="text-xs text-secondary">{range} Return</p>
              <p className={`text-sm font-bold mt-1 ${returnValue >= 0 ? 'text-green' : 'text-red'}`}>
                {returnValue >= 0 ? '+' : ''}{returnValue.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NestPerformanceChart;
