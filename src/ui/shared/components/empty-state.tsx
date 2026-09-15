import type { ReactNode } from 'react';
import { IconInbox } from './icons';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <IconInbox size={32} />,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`rf-empty-state ${className}`.trim()}>
      <div className="rf-empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="rf-empty-state__title">{title}</h3>
      {description && <p className="rf-empty-state__description">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
