import { useState } from 'react';

const WeightingScheme = () => {
  const [scheme, setScheme] = useState<'equal' | 'custom'>('equal');

  return (
    <div className="glass-card p-6 reveal">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-blue-accent flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h3 className="title-3 text-primary">Weighting Scheme</h3>
        </div>
        <span className="chip">Draft</span>
      </div>

      <div className="flex gap-3 mb-4">
        {[
          { id: 'equal', label: 'Equal Weighted', icon: '=' },
          { id: 'custom', label: 'Custom Weighted', icon: '%' }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setScheme(option.id as 'equal' | 'custom')}
            className={`flex-1 p-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
              scheme === option.id
                ? 'border-blue gradient-blue-subtle text-blue shadow-blue/10'
                : 'border-separator/30 text-secondary hover:border-separator hover:bg-fill-quaternary'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg ${
              scheme === option.id ? 'gradient-blue text-white' : 'bg-fill-tertiary text-secondary'
            }`}>
              {option.icon}
            </div>
            {option.label}
          </button>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-fill-quaternary">
        <p className="text-sm text-secondary leading-relaxed">
          {scheme === 'equal'
            ? 'Equal weighted allocates evenly across all holdings, ensuring balanced exposure.'
            : 'Custom weighting lets you fine-tune exposure and risk for each segment.'}
        </p>
      </div>
    </div>
  );
};

export default WeightingScheme;
