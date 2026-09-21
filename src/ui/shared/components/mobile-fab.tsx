import { useState, useEffect } from 'react';
import { IconOrderPlus } from './icons';

export interface MobileFabProps {
  onClick?: () => void;
  visible?: boolean;
}

export function MobileFab({ onClick, visible = true }: MobileFabProps) {
  const [currentHash, setCurrentHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Hide FAB if on the intake workflow page (user is already creating an order)
  const isIntakePage =
    currentHash.startsWith('#/repair-intake') ||
    currentHash.startsWith('#/intake');

  if (!visible || isIntakePage) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.hash = '#/repair-intake/new';
    }
  };

  return (
    <button
      type="button"
      className="rf-mobile-fab"
      onClick={handleClick}
      aria-label="Tạo phiếu tiếp nhận sửa chữa mới"
      title="Tạo phiếu tiếp nhận sửa chữa mới"
    >
      <IconOrderPlus size={19} aria-hidden="true" className="rf-mobile-fab__icon" />
      <span className="rf-mobile-fab__text">Tạo phiếu</span>
    </button>
  );
}
