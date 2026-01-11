import {
  investorProfile,
  investorProfiles,
  personaProfile,
  personaProfiles,
  personaRules
} from '@/utils/constants';

interface CreateNestPageProps {
  mode?: 'admin' | 'user';
}

const CreateNestPage = ({ mode = 'user' }: CreateNestPageProps) => {
  const isAdmin = mode === 'admin';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Investor Details */}
        <div className="glass-card p-6 reveal">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase text-secondary tracking-wide">Profile Foundation</p>
              <h2 className="title-2 text-primary mt-1">Investor Details</h2>
              <p className="text-sm text-secondary mt-1">
                Used to calibrate risk bands, liquidity buffers, and fund suitability.
              </p>
            </div>
            <button className="btn-ghost text-sm">Import KYC</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Full name', value: investorProfile.fullName, type: 'text' },
              { label: 'Profession', value: investorProfile.profession, type: 'text' },
              { label: 'Age', value: investorProfile.age, type: 'number' },
              { label: 'City', value: investorProfile.city, type: 'text' }
            ].map((field) => (
              <label key={field.label} className="space-y-2">
                <span className="text-sm text-secondary">{field.label}</span>
                <input
                  type={field.type}
                  className="input-glass"
                  defaultValue={field.value}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Financial Capacity */}
        <div className="glass-card p-6 reveal reveal-delay-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase text-secondary tracking-wide">Financial Capacity</p>
              <h3 className="title-3 text-primary mt-1">Income & Liquidity</h3>
            </div>
            <span className="badge-blue">Tax Bracket {investorProfile.taxBracket}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm text-secondary">Annual income</span>
              <input type="number" className="input-glass" defaultValue={investorProfile.annualIncome} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Dependents</span>
              <input type="number" className="input-glass" defaultValue={investorProfile.dependents} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Monthly SIP capacity</span>
              <input type="number" className="input-glass" defaultValue={investorProfile.monthlySip} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Lump sum capacity</span>
              <input type="number" className="input-glass" defaultValue={investorProfile.lumpSumCapacity} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Liquidity needs</span>
              <select className="input-glass" defaultValue={investorProfile.liquidityNeeds}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Investment knowledge</span>
              <select className="input-glass" defaultValue={investorProfile.investmentKnowledge}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
          </div>
        </div>

        {/* Goals */}
        <div className="glass-card p-6 reveal reveal-delay-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase text-secondary tracking-wide">Goals</p>
              <h3 className="title-3 text-primary mt-1">Goal-Based Planning</h3>
            </div>
            <button className="text-sm text-blue font-semibold hover:underline">Add secondary goal</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm text-secondary">Primary goal</span>
              <input className="input-glass" defaultValue={investorProfile.goal.name} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Goal priority</span>
              <select className="input-glass" defaultValue={investorProfile.goal.priority}>
                <option>Core</option>
                <option>Aspirational</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Target amount (INR)</span>
              <input type="number" className="input-glass" defaultValue={investorProfile.goal.targetAmount} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Target year</span>
              <input type="number" className="input-glass" defaultValue={investorProfile.goal.targetYear} />
            </label>
          </div>
        </div>

        {/* Risk Attitude */}
        <div className="glass-card p-6 reveal reveal-delay-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase text-secondary tracking-wide">Risk Discovery</p>
              <h3 className="title-3 text-primary mt-1">Risk Attitude</h3>
            </div>
            <span className="badge-blue">{investorProfile.riskTolerance} Band</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <label className="space-y-2">
              <span className="text-sm text-secondary">Time horizon (years)</span>
              <input type="number" className="input-glass" defaultValue={investorProfile.timeHorizonYears} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-secondary">Volatility comfort</span>
              <select className="input-glass" defaultValue={investorProfile.volatilityComfort}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="space-y-3">
              <span className="text-sm text-secondary">Equity preference</span>
              <input
                type="range"
                defaultValue={76}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue"
                style={{
                  background: 'linear-gradient(to right, #007AFF 76%, rgba(0,122,255,0.12) 76%)'
                }}
              />
              <div className="flex justify-between text-xs text-tertiary">
                <span>Capital preservation</span>
                <span>Growth focused</span>
              </div>
            </label>
            <label className="space-y-3">
              <span className="text-sm text-secondary">Liquidity buffer</span>
              <input
                type="range"
                defaultValue={25}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue"
                style={{
                  background: 'linear-gradient(to right, #007AFF 25%, rgba(0,122,255,0.12) 25%)'
                }}
              />
              <div className="flex justify-between text-xs text-tertiary">
                <span>Low buffer</span>
                <span>High buffer</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Admin: Investor Directory */}
        {isAdmin && (
          <div className="glass-card p-6 reveal">
            <h3 className="title-3 text-primary">Investor Directory</h3>
            <p className="text-sm text-secondary mt-1">All profiles mapped to personas.</p>
            <div className="mt-4 space-y-3">
              {investorProfiles.map((profile) => (
                <div key={profile.id} className="p-4 rounded-2xl gradient-blue-subtle border border-blue-100/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary">{profile.name}</p>
                    <span className="badge-blue">{profile.status}</span>
                  </div>
                  <p className="text-xs text-secondary mt-1">
                    Persona {profile.persona} &middot; {profile.horizonYears}Y &middot; SIP {profile.monthlySip.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin: Persona Library */}
        {isAdmin && (
          <div className="glass-card p-6 reveal">
            <h3 className="title-3 text-primary">Persona Library</h3>
            <p className="text-sm text-secondary mt-1">Library of personas used by the engine.</p>
            <div className="mt-4 space-y-3">
              {personaProfiles.map((persona) => (
                <div key={persona.name} className="p-4 rounded-2xl bg-glass-thin border border-glass-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary">{persona.name}</p>
                    <span className="chip">{persona.riskBand}</span>
                  </div>
                  <p className="text-xs text-secondary mt-2 leading-relaxed">{persona.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Persona Preview */}
        <div className="glass-card p-6 reveal glass-blue">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="title-3 text-primary">AI Persona Preview</h3>
          </div>
          <p className="text-sm text-secondary leading-relaxed">{personaProfile.description}</p>
          <div className="mt-4 p-4 rounded-xl bg-white/50">
            <p className="text-xs text-secondary">Estimated Persona</p>
            <p className="text-xl font-bold text-primary">{personaProfile.name}</p>
            <span className="badge-green mt-2 inline-flex">{personaProfile.riskBand}</span>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Equity bias', value: personaProfile.allocationBias.equity },
              { label: 'Debt bias', value: personaProfile.allocationBias.debt },
              { label: 'Hybrid/alt bias', value: personaProfile.allocationBias.hybrid + personaProfile.allocationBias.alternatives }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-secondary">{item.label}</span>
                <span className="font-semibold text-primary">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Persona Rules */}
        <div className="glass-card p-6 reveal">
          <h3 className="title-3 text-primary">Persona Rules</h3>
          <p className="text-sm text-secondary mt-1">Best-practice heuristics before AI optimization.</p>
          <div className="mt-4 space-y-3">
            {personaRules.map((rule) => (
              <div key={rule.label} className="p-4 rounded-2xl gradient-blue-subtle border border-blue-100/50">
                <p className="text-sm font-semibold text-primary">{rule.label}</p>
                <p className="text-xs text-secondary mt-1 leading-relaxed">{rule.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="glass-card p-6 reveal">
          <h3 className="title-3 text-primary">Profile Completeness</h3>
          <p className="text-sm text-secondary mt-1">AI model coverage at 92% based on provided inputs.</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm font-semibold text-primary">
              <span>Completion</span>
              <span className="text-blue">92%</span>
            </div>
            <div className="mt-3 progress-bar">
              <div className="progress-bar-fill-gradient" style={{ width: '92%' }} />
            </div>
            <p className="text-xs text-secondary mt-3">
              Provide household net worth to unlock stress testing.
            </p>
            <button className="btn-primary w-full mt-4">
              Run Persona Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNestPage;
