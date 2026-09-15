import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

export interface FormGroupProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormGroup({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = '',
}: FormGroupProps) {
  return (
    <div className={`rf-form-group ${className}`.trim()}>
      {label && (
        <label className="rf-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <span className="metric-hint">{hint}</span>}
      {error && <span className="blocked-hint">{error}</span>}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function FormInput({ icon, className = '', ...props }: InputProps) {
  if (icon) {
    return (
      <div className="rf-input-wrapper">
        <span className="rf-input-icon" aria-hidden="true">
          {icon}
        </span>
        <input className={`rf-input rf-input--has-icon ${className}`.trim()} {...props} />
      </div>
    );
  }
  return <input className={`rf-input ${className}`.trim()} {...props} />;
}

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function FormSelect({ children, className = '', ...props }: FormSelectProps) {
  return (
    <select className={`rf-select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
