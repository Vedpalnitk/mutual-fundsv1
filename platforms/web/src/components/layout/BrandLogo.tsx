const BrandLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-3xl'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`${sizeClasses[size]} gradient-blue flex items-center justify-center shadow-blue`}>
      <svg viewBox="0 0 24 24" className={`${iconSizes[size]} text-white`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" role="img" aria-label="Sparrow Invest logo">
        <path d="M17 5H9a4 4 0 000 8h6a4 4 0 010 8H7"/>
      </svg>
    </div>
  );
};

export default BrandLogo;
