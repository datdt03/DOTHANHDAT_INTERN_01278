import { demoNavItems } from '../../mocks/demo-shell';
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
}: AppSidebarProps) {
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
            <span className="workspace-switcher__icon" aria-hidden="true">⌂</span>
            <span>
              <small>Cửa hàng</small>
              <strong>{storeName}</strong>
            </span>
            <span className="workspace-switcher__chevron" aria-hidden="true">⌄</span>
          </div>

          <nav className="main-nav" aria-label="Điều hướng chính">
            <span className="nav-section-label">Không gian làm việc</span>
            {demoNavItems.map((item) => {
              const isActive = activeItem === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`nav-item${isActive ? ' nav-item--active' : ''}`}
                  onClick={() => {
                    onSelect?.(item.label);
                    onClose?.();
                  }}
                >
                  <span className="nav-item__icon" aria-hidden="true">
                    {item.icon}
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
              <span className="nav-item__icon" aria-hidden="true">🎨</span>
              <span>Thư viện UI (Showcase)</span>
            </button>
            <button
              type="button"
              className={`nav-item${activeItem === 'Quản trị' ? ' nav-item--active' : ''}`}
              onClick={() => {
                onSelect?.('Quản trị');
                onClose?.();
              }}
            >
              <span className="nav-item__icon" aria-hidden="true">⚙</span>
              <span>Quản trị</span>
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
                >
                  Quản lý
                </button>
                <button
                  type="button"
                  className={`sidebar-role-chip ${currentRole === 'receptionist' ? 'sidebar-role-chip--active' : ''}`}
                  onClick={() => onSwitchRole('receptionist')}
                >
                  Lễ tân
                </button>
                <button
                  type="button"
                  className={`sidebar-role-chip ${currentRole === 'technician' ? 'sidebar-role-chip--active' : ''}`}
                  onClick={() => onSwitchRole('technician')}
                >
                  KTV
                </button>
              </div>
            </div>
          )}

          <div className="sidebar-user">
            <div className="avatar avatar--small" aria-hidden="true">{userInitials}</div>
            <div>
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>
            {onLogout && (
              <IconButton label="Đăng xuất" onClick={onLogout} title="Đăng xuất tài khoản">
                ↪
              </IconButton>
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
