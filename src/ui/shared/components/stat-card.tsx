import type { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  variant = 'primary',
  className = '',
}: StatCardProps) {
  return (
    <div className={`rf-stat-card rf-stat-card--${variant} ${className}`.trim()}>
      <div className="rf-stat-card__content">
        <span className="rf-stat-card__label">{label}</span>
        <span className="rf-stat-card__value">{value}</span>
        {sub && <span className="rf-stat-card__sub">{sub}</span>}
      </div>
      {icon && <div className="rf-stat-card__icon" aria-hidden="true">{icon}</div>}
    </div>
  );
}
