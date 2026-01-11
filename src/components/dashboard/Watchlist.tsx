interface WatchItem {
  name: string;
  category: string;
  nav: number;
  change: number;
}

interface WatchlistProps {
  items: WatchItem[];
}

const Watchlist = ({ items }: WatchlistProps) => {
  return (
    <div className="glass-card p-6 reveal">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-blue-accent flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="title-3 text-primary">Watchlist</h3>
        </div>
        <button className="text-sm text-blue font-medium hover:underline">Manage</button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-fill-quaternary transition-all cursor-pointer group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary group-hover:text-blue transition-colors truncate">
                {item.name}
              </p>
              <p className="text-xs text-secondary">{item.category}</p>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <p className="text-sm font-semibold text-primary">
                NAV <span className="font-mono">{item.nav.toFixed(1)}</span>
              </p>
              <div className={`flex items-center justify-end gap-1 ${item.change >= 0 ? 'text-green' : 'text-red'}`}>
                <svg
                  className={`w-3 h-3 ${item.change >= 0 ? '' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-xs font-semibold">
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full btn-secondary text-sm">
        Add to Watchlist
      </button>
    </div>
  );
};

export default Watchlist;
