import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: string;
}

const PageHeader = ({ title, subtitle, actions, badge }: PageHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="title-1 text-primary">{title}</h1>
          {badge && (
            <span className="badge-blue">{badge}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-secondary max-w-xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
