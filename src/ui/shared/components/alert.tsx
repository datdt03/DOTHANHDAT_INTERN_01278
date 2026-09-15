import { useState, type ReactNode } from 'react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  dismissible?: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  dismissible = false,
  onClose,
  children,
  className = '',
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className={`rf-alert rf-alert--${variant} ${className}`.trim()} role="alert">
      <div style={{ flex: 1 }}>
        {title && (
          <strong style={{ display: 'block', marginBottom: '2px', fontWeight: 700 }}>
            {title}
          </strong>
        )}
        {children}
      </div>
      {dismissible && (
        <button
          type="button"
          className="rf-alert__close"
          onClick={handleClose}
          aria-label="Đóng thông báo"
        >
          ✕
        </button>
      )}
    </div>
  );
}
