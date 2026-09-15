import type { ReactNode } from 'react';
import { IconButton } from './ui-primitives';
import { IconLookup } from './icons';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  onOpenMobileMenu?: () => void;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  storeStatus?: string;
  notificationCount?: number;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  actions?: ReactNode;
}

export function AppHeader({
  breadcrumbs = [{ label: 'RepairFlow' }, { label: 'Tổng quan' }],
  onOpenMobileMenu,
  searchPlaceholder = 'Tìm đơn, số điện thoại hoặc khách hàng...',
  onSearchChange,
  storeStatus = 'Đang mở cửa',
  notificationCount = 3,
  userName = 'Minh Tâm',
  userRole = 'Quản lý',
  userInitials = 'MT',
  actions,
}: AppHeaderProps) {
  return (
    <header className="topbar">
      {onOpenMobileMenu && (
        <IconButton
          label="Mở điều hướng"
          className="mobile-menu-button"
          onClick={onOpenMobileMenu}
        >
          ☰
        </IconButton>
      )}

      <nav className="breadcrumb" aria-label="Đường dẫn trang">
        {breadcrumbs.map((item, idx) => (
          <span key={item.label} className="breadcrumb-segment">
            {idx > 0 && <span className="breadcrumb-separator" aria-hidden="true"> / </span>}
            {idx === breadcrumbs.length - 1 ? (
              <strong>{item.label}</strong>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <label className="global-search">
        <IconLookup size={15} aria-hidden="true" />
        <input
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
          aria-label="Tìm kiếm toàn cục"
        />
      </label>

      <div className="topbar-actions">
        {actions}

        {storeStatus && (
          <span className="store-status">
            <span className="online-dot" aria-hidden="true" /> {storeStatus}
          </span>
        )}

        <IconButton label="Thông báo" className="notification-button">
          ♢
          {notificationCount > 0 && (
            <span className="notification-count">{notificationCount}</span>
          )}
        </IconButton>

        <div className="topbar-user" title={`${userName} (${userRole})`}>
          <div className="avatar" aria-label={userName}>{userInitials}</div>
        </div>
      </div>
    </header>
  );
}
