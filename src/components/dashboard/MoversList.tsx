interface Signal {
  title: string;
  detail: string;
  impact: string;
}

interface MoversListProps {
  data: Signal[];
}

const MoversList = ({ data }: MoversListProps) => {
  return (
    <div className="glass-card p-6 reveal">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="title-3 text-primary">AI Signals</h3>
        </div>
        <button className="text-sm text-blue font-medium hover:underline">View playbook</button>
      </div>
      <div className="space-y-3">
        {data.map((signal, index) => (
          <div
            key={signal.title}
            className="p-4 rounded-2xl gradient-blue-subtle border border-blue-100/50 hover:border-blue-200/50 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-blue-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">{signal.title}</p>
                <p className="text-xs text-secondary mt-1 leading-relaxed">{signal.detail}</p>
                <div className="mt-2 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <p className="text-xs text-blue font-medium">{signal.impact}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoversList;
