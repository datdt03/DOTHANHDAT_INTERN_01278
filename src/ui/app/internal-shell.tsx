import { useState, useEffect } from 'react';
import { useSession, type UserRole } from './session-context';
import {
  AppFooter,
  AppHeader,
  AppSidebar,
  ForbiddenState,
  TextButton,
} from '../shared/components';
import { ManagerDashboardView } from '../features/dashboard/manager-dashboard-view';
import { ReceptionistTodayView } from '../features/receptionist/receptionist-today-view';
import { TechnicianMyWorkView } from '../features/technician/technician-my-work-view';
import { ComponentShowcaseView } from '../features/showcase/component-showcase-view';

interface InternalShellProps {
  previewMode: boolean;
  onRetry: () => void;
}

function PreviewNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="preview-notice" role="status">
      <span className="preview-notice__dot" aria-hidden="true" />
      <span>Đang xem bản preview với dữ liệu mẫu (Chưa có backend API).</span>
      <TextButton onClick={onRetry}>Thử kết nối lại</TextButton>
    </div>
  );
}

function resolveNavLabelFromHash(hash: string, role: UserRole): string {
  const clean = hash.replace(/\/$/, '');
  if (clean === '#/showcase' || clean === '#showcase') return 'Thư viện UI';
  if (clean === '#/settings') return 'Quản trị';
  if (clean === '#/lookup') return 'Tra cứu tiến độ';
  if (clean === '#/today') return 'Hôm nay';
  if (clean === '#/my-work') return 'Hàng chờ công việc';
  if (clean === '#/orders') return 'Phiếu sửa chữa';
  if (clean === '#/customers') return 'Khách hàng';
  if (clean === '#/devices') return 'Thiết bị & lịch sử';
  if (clean === '#/reception-queue') return 'Hàng chờ tiếp nhận';
  if (clean === '#/assigned-orders') return 'Phiếu được phân công';

  // Default per role
  if (role === 'receptionist') return 'Hôm nay';
  if (role === 'technician') return 'Hàng chờ công việc';
  return 'Tổng quan';
}

function isRoutePermitted(role: UserRole, hash: string): boolean {
  const clean = hash.replace(/\/$/, '');
  if (!clean || clean === '#/login' || clean === '#/showcase' || clean.startsWith('#/customer')) {
    return true;
  }

  // Manager has workspace-wide access
  if (role === 'manager') return true;

  // Receptionist is forbidden from Settings and direct Management dashboard
  if (role === 'receptionist') {
    if (clean === '#/settings' || clean === '#/dashboard') return false;
    return true;
  }

  // Technician is forbidden from Settings, Management dashboard, Reception today/lookup
  if (role === 'technician') {
    if (
      clean === '#/settings' ||
      clean === '#/dashboard' ||
      clean === '#/today' ||
      clean === '#/lookup' ||
      clean === '#/reception-queue'
    ) {
      return false;
    }
    return true;
  }

  return true;
}

export function InternalShell({ previewMode, onRetry }: InternalShellProps) {
  const { currentUser, switchRole, logout, simulateSessionExpired, capabilities } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);

  const currentRole = currentUser?.role || 'manager';

  // Synchronize hash changes
  useEffect(() => {
    const handleHash = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const activeNav = resolveNavLabelFromHash(currentHash, currentRole);
  const isPermitted = isRoutePermitted(currentRole, currentHash);

  const handleSelectNav = (label: string) => {
    // Label click triggers hash change handled in AppSidebar
  };

  const handleGoHome = () => {
    const homeRoute = capabilities?.defaultRoute || '#/dashboard';
    window.location.hash = homeRoute;
  };

  return (
    <div className="app-layout">
      <AppSidebar
        activeItem={activeNav}
        onSelect={handleSelectNav}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userName={currentUser?.name}
        userRole={currentUser?.roleTitle}
        userInitials={currentUser?.initials}
        currentRole={currentRole}
        onSwitchRole={(r: UserRole) => {
          void switchRole(r);
        }}
        onLogout={logout}
        onSimulateTimeout={() => simulateSessionExpired()}
      />

      <div className="app-main">
        <AppHeader
          breadcrumbs={[
            { label: 'RepairFlow' },
            { label: currentUser?.roleTitle || 'Tổng quan' },
            { label: activeNav },
          ]}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
          userName={currentUser?.name}
          userRole={currentUser?.roleTitle}
          userInitials={currentUser?.initials}
        />

        <main className="page-content">
          {previewMode && <PreviewNotice onRetry={onRetry} />}

          {/* UI-403: Forbidden State when user accesses an unauthorized route */}
          {!isPermitted ? (
            <ForbiddenState
              roleTitle={currentUser?.roleTitle}
              attemptedRoute={currentHash}
              onGoHome={handleGoHome}
              onLogout={logout}
            />
          ) : (
            <>
              {/* Dynamic View by Route & Persona */}
              {activeNav === 'Thư viện UI' ? (
                <ComponentShowcaseView />
              ) : (
                <>
                  {currentRole === 'manager' && <ManagerDashboardView />}
                  {currentRole === 'receptionist' && <ReceptionistTodayView />}
                  {currentRole === 'technician' && <TechnicianMyWorkView />}
                </>
              )}
            </>
          )}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
