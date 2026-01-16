import { useState } from 'react';

const AddSegment = () => {
  const [segments, setSegments] = useState([
    { name: 'Bluechip Core', weight: 40, color: 'gradient-blue' },
    { name: 'Momentum Tilt', weight: 30, color: 'gradient-blue-accent' },
    { name: 'Defensives', weight: 30, color: 'bg-indigo' }
  ]);

  return (
    <div className="glass-card p-6 reveal">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h3 className="title-3 text-primary">Segments</h3>
        </div>
        <button className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Segment
        </button>
      </div>

      {/* Visual Weight Bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-5">
        {segments.map((segment, i) => (
          <div
            key={segment.name}
            className={`${segment.color} transition-all duration-500`}
            style={{ width: `${segment.weight}%` }}
          />
        ))}
      </div>

      <div className="space-y-3">
        {segments.map((segment, index) => (
          <div
            key={segment.name}
            className="flex items-center justify-between p-4 rounded-2xl gradient-blue-subtle border border-blue-100/50 hover:border-blue-200/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-blue-subtle flex items-center justify-center text-sm font-bold text-blue">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold text-primary group-hover:text-blue transition-colors">
                  {segment.name}
                </p>
                <p className="text-xs text-secondary">Custom mix</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="badge-blue font-bold">{segment.weight}%</span>
              </div>
              <button className="w-8 h-8 rounded-lg bg-fill-quaternary flex items-center justify-center text-secondary hover:text-blue hover:bg-blue-light transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddSegment;
