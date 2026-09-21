import { getRoleCapabilities, type RoleCapabilities, type UserRole } from '../api/access-api';
import type { ReactNode } from 'react';
import {
  IconClose,
  IconCustomers,
  IconDevices,
  IconInbox,
  IconLogout,
  IconLookup,
  IconOrders,
  IconOverview,
  IconPalette,
  IconQueue,
  IconSettings,
  IconStaff,
  IconStore,
  IconToday,
  IconWorkflow,
  IconPlus,
  IconTag,
} from './icons';
import { BrandMark, IconButton } from './ui-primitives';

export interface AppSidebarProps {
  activeItem?: string;
  activeRoute?: string;
  onSelect?: (label: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  storeName?: string;
  storeSubtitle?: string;
  capacity?: {
    active: number;
    total: number;
    devicesCount: number;
  };
  userName?: string;
  userRole?: string;
  userInitials?: string;
  currentRole?: UserRole;
  capabilities?: RoleCapabilities | null;
  onLogout?: () => void;
  roleContextSwitcher?: ReactNode;
}

function normalizeHash(hash?: string): string {
  if (!hash || hash === '#' || hash === '#/') return '';
  return hash.split('?')[0].replace(/\/$/, '');
}

function renderNavIcon(iconId: string) {
  switch (iconId) {
    case 'overview':
      return <IconOverview size={16} />;
    case 'orders':
      return <IconOrders size={16} />;
    case 'queue':
      return <IconQueue size={16} />;
    case 'customers':
      return <IconCustomers size={16} />;
    case 'devices':
      return <IconDevices size={16} />;
    case 'settings':
      return <IconSettings size={16} />;
    case 'staff':
      return <IconStaff size={16} />;
    case 'workflow':
      return <IconWorkflow size={16} />;
    case 'today':
      return <IconToday size={16} />;
    case 'lookup':
      return <IconLookup size={16} />;
    case 'inbox':
      return <IconInbox size={16} />;
    case 'tags':
      return <IconTag size={16} />;
    default:
      return <IconOverview size={16} />;
  }
}

export function AppSidebar({
  activeItem = 'Tổng quan',
  activeRoute,
  onSelect,
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  storeName = 'Minh Tâm Store',
  capacity = { active: 14, total: 18, devicesCount: 28 },
  userName = 'Minh Tâm',
  userRole = 'Quản lý vận hành',
  userInitials = 'MT',
  currentRole = 'manager',
  capabilities: projectedCapabilities,
  onLogout,
  roleContextSwitcher,
}: AppSidebarProps) {
  const capabilities = projectedCapabilities || getRoleCapabilities(currentRole);
  const navItems = capabilities.navigationItems;

  const currentRoute = activeRoute !== undefined
    ? normalizeHash(activeRoute)
    : (typeof window !== 'undefined' ? normalizeHash(window.location.hash) : '');

  const isItemActive = (item: { label: string; route: string }) => {
    const itemRouteClean = normalizeHash(item.route);

    // 1. Primary: Exact URL route match
    if (currentRoute && itemRouteClean && currentRoute === itemRouteClean) {
      return true;
    }

    // 2. Default route handling when hash is empty or root
    if (!currentRoute) {
      if ((currentRole === 'manager' || currentRole === 'owner') && item.route === '#/dashboard') return true;
      if (currentRole === 'receptionist' && item.route === '#/today') return true;
      if (currentRole === 'technician' && item.route === '#/my-work') return true;
    }

    // 3. Label matching with aliases fallback
    if (activeItem) {
      if (activeItem === item.label) return true;
      if (item.label === 'Tổng quan' && (activeItem === 'Tổng quan vận hành' || activeItem === 'Tổng quan')) return true;
      if (item.label === 'Hôm nay' && (activeItem === 'Tổng quan hôm nay' || activeItem === 'Hôm nay')) return true;
      if (item.label.includes('Showcase') && activeItem.includes('Showcase')) return true;
    }

    return false;
  };

  const isShowcaseActive =
    currentRoute === '#/showcase' ||
    activeItem === 'Thư viện UI' ||
    activeItem === 'Thư viện UI (Showcase)';

  return (
    <>
      <aside className={`app-sidebar${isOpen ? ' app-sidebar--open' : ''}${isCollapsed ? ' app-sidebar--collapsed' : ''}`}>
        {/* Tier 1: Brand Header Zone (Exact 64px, aligned with TopBar) */}
        <div className="brand-block">
          <BrandMark />
          {!isCollapsed && (
            <div className="brand-block__text">
              <strong>RepairFlow</strong>
              <span>Trung tâm điều hành</span>
            </div>
          )}
          {isOpen && onClose && (
            <IconButton
              label="Đóng thanh điều hướng"
              className="sidebar-close-btn"
              onClick={onClose}
              title="Đóng điều hướng"
            >
              <IconClose size={18} />
            </IconButton>
          )}
        </div>

        {/* Tier 2: Scrollable Navigation Area (Flexible, middle zone) */}
        <div className="sidebar-scrollable-area">
          {!isCollapsed && (
            <div className="workspace-context" title="Không gian làm việc của phiên">
              <span className="workspace-context__icon" aria-hidden="true">
                <IconStore size={14} />
              </span>
              <div className="workspace-context__info">
                <small>Cửa hàng hiện tại</small>
                <strong>{storeName}</strong>
              </div>
            </div>
          )}

          {!isCollapsed && roleContextSwitcher && (
            <div className="sidebar-role-context-section">
              <span className="nav-section-label">Ngữ cảnh làm việc</span>
              {roleContextSwitcher}
            </div>
          )}

          <nav className="main-nav" aria-label="Điều hướng chính theo vai trò">
            {!isCollapsed && <span className="nav-section-label">Không gian làm việc</span>}
            {navItems.map((item) => {
              const isActive = isItemActive(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`nav-item${isActive ? ' nav-item--active' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => {
                    window.location.hash = item.route;
                    onSelect?.(item.label);
                    onClose?.();
                  }}
                >
                  <span className="nav-item__icon" aria-hidden="true">
                    {renderNavIcon(item.icon)}
                  </span>
                  {!isCollapsed && <span className="nav-item__label">{item.label}</span>}
                  {!isCollapsed && typeof item.badgeCount === 'number' && (
                    <span
                      className={`nav-item__badge ${isActive ? 'nav-item__badge--active' : ''}`}
                      aria-label={`${item.badgeCount} cần xử lý`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}

            {!isCollapsed && <span className="nav-section-label nav-section-label--spaced">Hệ thống</span>}
            <button
              type="button"
              className={`nav-item${isShowcaseActive ? ' nav-item--active' : ''}`}
              title={isCollapsed ? 'Thư viện UI (Showcase)' : undefined}
              onClick={() => {
                window.location.hash = '#/showcase';
                onSelect?.('Thư viện UI');
                onClose?.();
              }}
            >
              <span className="nav-item__icon" aria-hidden="true">
                <IconPalette size={16} />
              </span>
              {!isCollapsed && <span>Thư viện UI (Showcase)</span>}
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            {isCollapsed ? (
              <div
                className="avatar avatar--small"
                onClick={onLogout}
                role={onLogout ? 'button' : undefined}
                tabIndex={onLogout ? 0 : undefined}
                title={onLogout ? `${userName} (${userRole}) — Bấm để đăng xuất` : `${userName} (${userRole})`}
                aria-label={onLogout ? `Đăng xuất tài khoản ${userName}` : userName}
              >
                {userInitials}
              </div>
            ) : (
              <>
                <div className="avatar avatar--small" aria-hidden="true">
                  {userInitials}
                </div>
                <div>
                  <strong>{userName}</strong>
                  <span>{userRole}</span>
                </div>
                {onLogout && (
                  <IconButton label="Đăng xuất" onClick={onLogout} title="Đăng xuất tài khoản">
                    <IconLogout size={14} />
                  </IconButton>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Đóng điều hướng"
          onClick={onClose}
        />
      )}
    </>
  );
}
