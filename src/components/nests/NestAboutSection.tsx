interface Props {
  about: string;
}

const NestAboutSection = ({ about }: Props) => (
  <div className="glass-card p-6 reveal reveal-delay-1">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="title-3 text-primary">About the Fund</h3>
    </div>
    <p className="text-sm text-secondary leading-relaxed">{about}</p>
  </div>
);

export default NestAboutSection;
