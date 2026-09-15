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
  IconStore,
  IconToday,
} from './icons';
import { BrandMark, IconButton } from './ui-primitives';

export interface AppSidebarProps {
  activeItem?: string;
  onSelect?: (label: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
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
  storeName = 'Minh Tâm Store',
  storeSubtitle = 'Cửa hàng chính',
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
      <aside className={`app-sidebar${isOpen ? ' app-sidebar--open' : ''}`}>
        <div>
          <div className="brand-block">
            <BrandMark />
            <div>
              <strong>RepairFlow</strong>
              <span>{storeName}</span>
            </div>
          </div>

          <div className="workspace-switcher">
            <span className="workspace-switcher__icon" aria-hidden="true">
              <IconStore size={15} />
            </span>
            <span>
              <small>Cửa hàng</small>
              <strong>{storeName}</strong>
            </span>
            <span className="workspace-switcher__chevron" aria-hidden="true">
              ⌄
            </span>
          </div>

          <nav className="main-nav" aria-label="Điều hướng chính theo vai trò">
            <span className="nav-section-label">Không gian làm việc</span>
            {navItems.map((item) => {
              const isActive = activeItem === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`nav-item${isActive ? ' nav-item--active' : ''}`}
                  onClick={() => {
                    window.location.hash = item.route;
                    onSelect?.(item.label);
                    onClose?.();
                  }}
                >
                  <span className="nav-item__icon" aria-hidden="true">
                    {renderNavIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            <span className="nav-section-label nav-section-label--spaced">Hệ thống</span>
            <button
              type="button"
              className={`nav-item${activeItem === 'Thư viện UI' ? ' nav-item--active' : ''}`}
              onClick={() => {
                window.location.hash = '#/showcase';
                onSelect?.('Thư viện UI');
                onClose?.();
              }}
            >
              <span className="nav-item__icon" aria-hidden="true">
                <IconPalette size={16} />
              </span>
              <span>Thư viện UI (Showcase)</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          {capacity && (
            <div className="capacity-card">
              <div className="capacity-card__heading">
                <span>Trạng thái xưởng</span>
                <span className="online-dot" aria-label="Đang hoạt động" />
              </div>
              <strong>{capacity.active}/{capacity.total} bàn đang hoạt động</strong>
              <span>{capacity.devicesCount} thiết bị đang xử lý</span>
            </div>
          )}

          {onSwitchRole && (
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
