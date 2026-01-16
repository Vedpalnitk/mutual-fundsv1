interface Props {
  name: string;
  description: string;
}

const NestManagerSection = ({ name, description }: Props) => (
  <div className="glass-card p-6 reveal reveal-delay-1">
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl gradient-blue flex items-center justify-center text-white text-xl font-bold shadow-blue">
          {name.slice(0, 1)}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green border-2 border-white flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase text-secondary tracking-wide">Fund Manager</p>
        <p className="text-lg font-bold text-primary">{name}</p>
        <p className="text-sm text-secondary mt-1 leading-relaxed">{description}</p>
      </div>
      <button className="btn-secondary text-sm">
        View Profile
      </button>
    </div>
  </div>
);

export default NestManagerSection;
