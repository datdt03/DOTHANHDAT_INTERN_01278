import { useState, useEffect } from 'react';
import { useSession } from './session-context';
import type { UserRole } from '../shared/api/access-api';
import {
  AppFooter,
  AppHeader,
  AppSidebar,
  MobileFab,
} from '../shared/components';
import { DashboardPlaceholder } from '../features/dashboard/dashboard-placeholder';
import { ComponentShowcaseView } from '../features/showcase/component-showcase-view';
import { RoleContextSwitcher } from '../features/access/role-context-switcher';
import '../shared/styles/app-shell.css';

interface InternalShellProps {
  previewMode?: boolean;
  onRetry?: () => void;
}

function resolveNavLabelFromHash(hash: string, role: UserRole): string {
  const clean = hash.replace(/\/$/, '');
  if (clean === '#/showcase' || clean === '#showcase') return 'Thư viện UI';
  if (clean === '#/settings') return 'Quản trị';
  if (clean === '#/staff-assignments') return 'Nhân sự & phân công';
  if (clean === '#/workflow-config') return 'Quy trình cửa hàng';
  if (clean === '#/lookup') return 'Tra cứu tiến độ';
  if (clean === '#/today') return 'Hôm nay';
  if (clean === '#/my-work') return 'Hàng chờ công việc';
  if (clean === '#/orders') return 'Phiếu sửa chữa';
  if (clean === '#/customers') return 'Khách hàng';
  if (clean === '#/devices') return 'Thiết bị và lịch sử';
  if (clean === '#/reception-queue') return 'Hàng chờ tiếp nhận';
  if (clean === '#/assigned-orders') return 'Phiếu được phân công';

  // Default entry per role
  if (role === 'receptionist') return 'Hôm nay';
  if (role === 'technician') return 'Hàng chờ công việc';
  return 'Tổng quan';
}

export function InternalShell({}: InternalShellProps) {
  const { currentUser, logout, sessionNotice } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);

  const currentRole: UserRole = currentUser?.role || 'manager';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('repairflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('repairflow_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Synchronize hash changes
  useEffect(() => {
    const handleHash = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const activeNav = resolveNavLabelFromHash(currentHash, currentRole);

  return (
    <div className="app-layout">
      {/* Sidebar with workspace context, drawer support, and close button */}
      <AppSidebar
        activeItem={activeNav}
        activeRoute={currentHash}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        storeName={currentUser?.storeName || 'Minh Tâm Store'}
        userName={currentUser?.name}
        userRole={currentUser?.roleTitle}
        userInitials={currentUser?.initials}
        currentRole={currentRole}
        onLogout={logout}
        roleContextSwitcher={
          <RoleContextSwitcher
            inSidebar
            onRoleSwitched={() => setMobileNavOpen(false)}
          />
        }
      />

      <div className="app-main">
        {/* Header with Title, Workspace badge, Search, Quick action, Notifications, User */}
        <AppHeader
          title={activeNav}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          userName={currentUser?.name}
          userRole={currentUser?.roleTitle}
          userInitials={currentUser?.initials}
          actions={<RoleContextSwitcher />}
        />

        {/* Main Content Outlet with Notification/Feedback Slot */}
        <main className="page-content" id="main-content">
          {sessionNotice && (
            <div className="shell-feedback-slot">
              <div className="access-expired-banner" role="alert">
                <strong>Thông báo phiên:</strong> {sessionNotice}
              </div>
            </div>
          )}

          {/* Dynamic View by Route & Persona */}
          {activeNav === 'Thư viện UI' ? (
            <ComponentShowcaseView />
          ) : (
            <DashboardPlaceholder
              role={currentRole}
              userName={currentUser?.name}
              roleTitle={currentUser?.roleTitle}
            />
          )}
        </main>

        <AppFooter />
      </div>

      <MobileFab />
    </div>
  );
}
