import { getRoleCapabilities } from '../api/access-api';
import {
  IconCustomers,
  IconDevices,
  IconHourglass,
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
} from './icons';
import { BrandMark, IconButton } from './ui-primitives';

export interface AppSidebarProps {
  activeItem?: string;
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
  currentRole?: 'manager' | 'receptionist' | 'technician';
  onSwitchRole?: (role: 'manager' | 'receptionist' | 'technician') => void;
  onLogout?: () => void;
  onSimulateTimeout?: () => void;
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
    default:
      return <IconOverview size={16} />;
  }
}

export function AppSidebar({
  activeItem = 'Tổng quan',
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
  onSwitchRole,
  onLogout,
  onSimulateTimeout,
}: AppSidebarProps) {
  const capabilities = getRoleCapabilities(currentRole);
  const navItems = capabilities.navigationItems;

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

          <nav className="main-nav" aria-label="Điều hướng chính theo vai trò">
            {!isCollapsed && <span className="nav-section-label">Không gian làm việc</span>}
            {navItems.map((item) => {
              const isActive = activeItem === item.label;
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
              className={`nav-item${activeItem === 'Thư viện UI' ? ' nav-item--active' : ''}`}
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
          {!isCollapsed && capacity && (
            <div className="capacity-card">
              <div className="capacity-card__heading">
                <span>Trạng thái xưởng</span>
                <span className="online-dot" aria-label="Đang hoạt động" />
              </div>
              <strong>{capacity.active}/{capacity.total} bàn đang hoạt động</strong>
              <span>{capacity.devicesCount} thiết bị đang xử lý</span>
            </div>
          )}

          {!isCollapsed && onSwitchRole && (
            <div className="sidebar-role-selector">
              <span className="sidebar-role-label">Chuyển vai trò test:</span>
              <div className="sidebar-role-chips">
                <button
                  type="button"
                  className={`sidebar-role-chip ${currentRole === 'manager' ? 'sidebar-role-chip--active' : ''}`}
                  onClick={() => onSwitchRole('manager')}
                  title="Chuyển sang vai trò Quản lý"
                >
                  Quản lý
                </button>
                <button
                  type="button"
                  className={`sidebar-role-chip ${currentRole === 'receptionist' ? 'sidebar-role-chip--active' : ''}`}
                  onClick={() => onSwitchRole('receptionist')}
                  title="Chuyển sang vai trò Lễ tân"
                >
                  Lễ tân
                </button>
                <button
                  type="button"
                  className={`sidebar-role-chip ${currentRole === 'technician' ? 'sidebar-role-chip--active' : ''}`}
                  onClick={() => onSwitchRole('technician')}
                  title="Chuyển sang vai trò Kỹ thuật viên"
                >
                  KTV
                </button>
              </div>
            </div>
          )}

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
                <div style={{ display: 'flex', gap: '4px' }}>
                  {onSimulateTimeout && (
                    <IconButton
                      label="Hết hạn phiên"
                      onClick={onSimulateTimeout}
                      title="Test hết hạn phiên (UI-A03)"
                    >
                      <IconHourglass size={14} />
                    </IconButton>
                  )}
                  {onLogout && (
                    <IconButton label="Đăng xuất" onClick={onLogout} title="Đăng xuất tài khoản">
                      <IconLogout size={14} />
                    </IconButton>
                  )}
                </div>
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
