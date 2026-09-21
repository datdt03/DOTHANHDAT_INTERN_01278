import type { ReactNode } from 'react';
import { IconButton, PrimaryButton } from './ui-primitives';
import { IconBell, IconLookup, IconMenu, IconPlus } from './icons';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AppHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  onOpenMobileMenu?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  storeName?: string;
  storeStatus?: string;
  notificationCount?: number;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  onCreateOrder?: () => void;
  actions?: ReactNode;
}

export function AppHeader({
  title,
  breadcrumbs = [{ label: 'RepairFlow' }, { label: 'Tổng quan' }],
  onOpenMobileMenu,
  isSidebarCollapsed = false,
  onToggleSidebar,
  searchPlaceholder = 'Tìm mã phiếu, SĐT khách, tên khách, thiết bị... (Ctrl + K)',
  searchValue,
  onSearchChange,
  storeName,
  storeStatus = 'Đang hoạt động',
  notificationCount = 3,
  userName = 'Minh Tâm',
  userRole = 'Quản lý vận hành',
  userInitials = 'MT',
  onCreateOrder,
  actions,
}: AppHeaderProps) {
  const displayTitle =
    title || (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Tổng quan');

  return (
    <header className="topbar">
      {onOpenMobileMenu && (
        <IconButton
          label="Mở điều hướng"
          className="mobile-menu-button"
          onClick={onOpenMobileMenu}
        >
          <IconMenu size={18} />
        </IconButton>
      )}

      {onToggleSidebar && (
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          title={isSidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          <IconMenu size={18} />
        </button>
      )}

      <div className="topbar-left">
        <h1 className="topbar-page-title">{displayTitle}</h1>
      </div>

      <label className="global-search">
        <IconLookup size={15} aria-hidden="true" />
        <input
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
          aria-label="Tìm kiếm toàn cục"
        />
        <kbd className="search-kbd" aria-hidden="true">Ctrl K</kbd>
      </label>

      <div className="topbar-actions">
        {actions}

        <PrimaryButton
          className="topbar-create-btn"
          onClick={onCreateOrder || (() => { window.location.hash = '#/repair-intake/new'; })}
          title="Tạo phiếu sửa chữa mới"
        >
          <IconPlus size={15} aria-hidden="true" />
          <span>Tạo phiếu mới</span>
        </PrimaryButton>

        <IconButton label="Thông báo" className="notification-button">
          <IconBell size={18} />
          {notificationCount > 0 && (
            <span className="notification-count">{notificationCount}</span>
          )}
        </IconButton>
      </div>
    </header>
  );
}
