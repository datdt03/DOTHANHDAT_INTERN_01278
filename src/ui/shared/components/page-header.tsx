import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`rf-page-header ${className}`.trim()}>
      <div className="rf-page-header__left">
        {eyebrow && <span className="rf-page-header__eyebrow">{eyebrow}</span>}
        <h1 className="rf-page-header__title">{title}</h1>
        {subtitle && <p className="rf-page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="rf-page-header__actions">{actions}</div>}
    </header>
  );
}
