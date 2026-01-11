interface ProfileMetric {
  label: string;
  value: string;
}

interface Persona {
  name: string;
  description: string;
  riskBand: string;
  behaviorSignals: string[];
}

interface AccountSummaryProps {
  metrics: ProfileMetric[];
  persona: Persona;
}

const AccountSummary = ({ metrics, persona }: AccountSummaryProps) => {
  return (
    <div className="glass-card p-6 reveal reveal-delay-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="title-3 text-primary">Investor Profile</h3>
        <button className="text-sm text-blue font-medium hover:underline transition-all">
          Edit profile
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-4 rounded-2xl gradient-blue-subtle border border-blue-100/50"
          >
            <p className="text-xs text-secondary">{metric.label}</p>
            <p className="text-sm font-semibold text-primary mt-1">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* AI Persona Section */}
      <div className="mt-6 p-5 rounded-2xl glass-blue">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg gradient-blue flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xs uppercase text-blue font-semibold tracking-wide">AI Persona</p>
            </div>
            <h4 className="text-lg font-bold text-primary">{persona.name}</h4>
            <p className="text-sm text-secondary mt-2 leading-relaxed">{persona.description}</p>
          </div>
          <span className="badge-blue font-semibold ml-4 flex-shrink-0">{persona.riskBand}</span>
        </div>

        {/* Behavior Signals */}
        <div className="mt-4 flex flex-wrap gap-2">
          {persona.behaviorSignals.map((signal) => (
            <span key={signal} className="chip">
              {signal}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;
