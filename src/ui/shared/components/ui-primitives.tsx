import type { ButtonHTMLAttributes, ReactNode } from 'react';

function joinClasses(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function BrandMark() {
  return <div className="brand-mark" aria-label="RepairFlow">RF</div>;
}

export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" className={joinClasses('icon-button', className)} aria-label={label} {...props}>{children}</button>;
}

export function PrimaryButton({ fullWidth = false, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { fullWidth?: boolean; children: ReactNode }) {
  return <button type="button" className={joinClasses('primary-button', fullWidth && 'primary-button--full', className)} {...props}>{children}</button>;
}

export function SecondaryButton({ fullWidth = false, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { fullWidth?: boolean; children: ReactNode }) {
  return <button type="button" className={joinClasses('secondary-button', fullWidth && 'primary-button--full', className)} {...props}>{children}</button>;
}

export function TextButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button type="button" className={joinClasses('text-button', className)} {...props}>{children}</button>;
}

export function StatusBadge({
  label,
  tone,
  status,
  hasDot = true,
  className,
}: {
  label: string;
  tone?: string;
  status?:
    | 'draft'
    | 'diagnosing'
    | 'waiting'
    | 'repairing'
    | 'qc'
    | 'ready'
    | 'completed'
    | 'rework'
    | 'cancelled'
    | 'overdue';
  hasDot?: boolean;
  className?: string;
}) {
  const statusClass = status ? `rf-badge--${status}` : tone ? `status-badge--${tone}` : '';
  return (
    <span className={joinClasses('status-badge', 'rf-badge', statusClass, className)}>
      {hasDot && <span className="rf-badge-dot" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

export function OrderCode({ code, className }: { code: string; className?: string }) {
  return <span className={joinClasses('order-id', 'rf-font-mono', className)}>{code}</span>;
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClasses('rf-card', className)} {...props}>{children}</div>;
}

export function SkeletonLoader({
  width = '100%',
  height = '16px',
  className,
  style,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={joinClasses('rf-skeleton', className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

