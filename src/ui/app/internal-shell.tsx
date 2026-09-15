import { useState, useEffect } from 'react';
import { useSession, type UserRole } from './session-context';
import {
  AppFooter,
  AppHeader,
  AppSidebar,
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

export function InternalShell({ previewMode, onRetry }: InternalShellProps) {
  const { currentUser, switchRole, logout } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(() => {
    if (window.location.hash === '#/showcase' || window.location.hash === '#showcase') {
      return 'Thư viện UI';
    }
    return 'Tổng quan';
  });

  const currentRole = currentUser?.role || 'manager';

  // Listen to hash changes for direct URL jumping
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#/showcase' || window.location.hash === '#showcase') {
        setActiveNav('Thư viện UI');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <div className="app-layout">
      <AppSidebar
        activeItem={activeNav}
        onSelect={setActiveNav}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userName={currentUser?.name}
        userRole={currentUser?.roleTitle}
        userInitials={currentUser?.initials}
        currentRole={currentRole}
        onSwitchRole={(r: UserRole) => {
          switchRole(r);
          setActiveNav(r === 'manager' ? 'Tổng quan' : r === 'receptionist' ? 'Hôm nay' : 'Hàng chờ');
        }}
        onLogout={logout}
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

          {/* Dynamic Landing Screen by Persona / Role or Showcase */}
          {activeNav === 'Thư viện UI' ? (
            <ComponentShowcaseView />
          ) : (
            <>
              {currentRole === 'manager' && <ManagerDashboardView />}
              {currentRole === 'receptionist' && <ReceptionistTodayView />}
              {currentRole === 'technician' && <TechnicianMyWorkView />}
            </>
          )}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
