import type { HTMLAttributes, ReactNode } from 'react';

export interface CardPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function CardPanel({ children, className = '', ...props }: CardPanelProps) {
  return (
    <div className={`rf-card-panel ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface CardPanelHeaderProps {
  title?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function CardPanelHeader({ title, actions, children, className = '' }: CardPanelHeaderProps) {
  return (
    <div className={`rf-card-panel__header ${className}`.trim()}>
      {title && (typeof title === 'string' ? <h3 className="rf-card-panel__title">{title}</h3> : title)}
      {children}
      {actions && <div className="rf-card-panel__actions">{actions}</div>}
    </div>
  );
}

export interface CardPanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  flush?: boolean;
  children: ReactNode;
  className?: string;
}

export function CardPanelBody({ flush = false, children, className = '', ...props }: CardPanelBodyProps) {
  return (
    <div className={`rf-card-panel__body ${flush ? 'rf-card-panel__body--flush' : ''} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface CardPanelFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function CardPanelFooter({ children, className = '', ...props }: CardPanelFooterProps) {
  return (
    <div className={`rf-card-panel__footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
