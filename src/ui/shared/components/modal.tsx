import { useEffect, type ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  title,
  onClose,
  children,
  footer,
  className = '',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="rf-modal-backdrop" onClick={onClose}>
      <div
        className={`rf-modal-dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rf-modal-header">
          <h3 id="rf-modal-title" className="rf-modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="rf-alert__close"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            ✕
          </button>
        </div>
        <div className="rf-modal-body">{children}</div>
        {footer && <div className="rf-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
