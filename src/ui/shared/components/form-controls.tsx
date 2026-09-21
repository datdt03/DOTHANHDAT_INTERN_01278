import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode, CSSProperties } from 'react';
import { IconChevronDown } from './icons';

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

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  icon?: ReactNode;
  options?: SelectOption[];
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  hasError?: boolean;
  fullWidth?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  placeholder?: string;
}

export function FormSelect({
  children,
  options,
  className = '',
  wrapperClassName = '',
  wrapperStyle,
  icon,
  size = 'md',
  hasError = false,
  fullWidth = true,
  placeholder,
  disabled,
  style,
  ...props
}: FormSelectProps) {
  const sizeClass = size !== 'md' ? `rf-select--${size}` : '';
  const iconClass = icon ? 'rf-select--has-prefix' : '';
  const fullWidthClass = fullWidth ? 'rf-select-wrapper--full' : '';

  const resolvedWrapperStyle: CSSProperties = {
    ...(style?.width ? { width: style.width } : {}),
    ...wrapperStyle,
  };

  return (
    <div
      className={`rf-select-wrapper ${fullWidthClass} ${hasError ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''} ${wrapperClassName}`.trim()}
      style={resolvedWrapperStyle}
    >
      {icon && (
        <span className="rf-select-prefix-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <select
        className={`rf-select ${sizeClass} ${iconClass} ${className}`.trim()}
        disabled={disabled}
        style={style}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden={Boolean(props.value)}>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <span className="rf-select-arrow" aria-hidden="true">
        <IconChevronDown size={size === 'sm' ? 14 : 16} />
      </span>
    </div>
  );
}

export const SelectDropdown = FormSelect;
export const DropdownSelect = FormSelect;

