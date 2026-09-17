import { useState, useEffect, type ReactNode } from 'react';
import { useSession, type UserRole } from './session-context';
import {
  AppFooter,
  AppHeader,
  AppSidebar,
} from '../shared/components';
import { ForbiddenState } from '../shared/components/forbidden-state';
import { DashboardPlaceholder } from '../features/dashboard/dashboard-placeholder';
import { ReceptionistTodayLookupPlaceholder } from '../features/receptionist/today-lookup-placeholder';
import { TechnicianMyWorkPlaceholder } from '../features/technician/my-work-placeholder';
import { ComponentShowcaseView } from '../features/showcase/component-showcase-view';
import { RoleNavigationBanner } from '../features/access/role-navigation';
import {
  canAccessRoute,
  getRoleEntryRoute,
  getRouteTitle,
  normalizeRouteHash,
} from './role-entry';
import '../shared/styles/app-shell.css';

interface RoleAwareNavigationShellProps {
  previewMode?: boolean;
  onRetry?: () => void;
}

export function RoleAwareNavigationShell({ previewMode = false }: RoleAwareNavigationShellProps): ReactNode {
  const { currentUser, capabilities, logout, sessionNotice } = useSession();
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

  const cleanHash = normalizeRouteHash(currentHash);
  const activeNav = getRouteTitle(cleanHash, currentRole);
  const isAllowed = canAccessRoute(currentHash, currentRole, capabilities);

  // Render view based on route and authorized role
  const renderRouteContent = () => {
    // 1. Unauthorized direct access -> Forbidden state (No protected data exposed)
    if (!isAllowed) {
      return (
        <ForbiddenState
          roleTitle={currentUser?.roleTitle}
          attemptedRoute={cleanHash || currentHash}
          onGoHome={() => {
            window.location.hash = getRoleEntryRoute(currentRole);
          }}
          onLogout={logout}
        />
      );
    }

    // 2. Showcase / Component Library
    if (cleanHash === '#/showcase') {
      return <ComponentShowcaseView />;
    }

    // 3. Receptionist specific routes
    if (cleanHash === '#/today') {
      return (
        <ReceptionistTodayLookupPlaceholder
          initialTab="today"
          userName={currentUser?.name}
          roleTitle={currentUser?.roleTitle}
        />
      );
    }

    if (cleanHash === '#/lookup') {
      return (
        <ReceptionistTodayLookupPlaceholder
          initialTab="lookup"
          userName={currentUser?.name}
          roleTitle={currentUser?.roleTitle}
        />
      );
    }

    // 4. Technician specific routes
    if (cleanHash === '#/my-work' || cleanHash === '#/assigned-orders') {
      return (
        <TechnicianMyWorkPlaceholder
          userName={currentUser?.name}
          roleTitle={currentUser?.roleTitle}
        />
      );
    }

    // 5. Manager / Owner operational routes (or fallback to role-based placeholder)
    if (currentRole === 'receptionist') {
      return (
        <ReceptionistTodayLookupPlaceholder
          userName={currentUser?.name}
          roleTitle={currentUser?.roleTitle}
        />
      );
    }

    if (currentRole === 'technician') {
      return (
        <TechnicianMyWorkPlaceholder
          userName={currentUser?.name}
          roleTitle={currentUser?.roleTitle}
        />
      );
    }

    return (
      <DashboardPlaceholder
        role={currentRole}
        userName={currentUser?.name}
        roleTitle={currentUser?.roleTitle}
      />
    );
  };

  return (
    <div className="app-layout">
      {/* Sidebar with role-aware tabs, workspace context, drawer support */}
      <AppSidebar
        activeItem={activeNav}
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
      />

      <div className="app-main">
        {/* Header with Title, Workspace badge, Search, Quick action, Notifications, User */}
        <AppHeader
          title={isAllowed ? activeNav : 'Truy cập bị từ chối'}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          storeName="Minh Tâm Store • TT Điều hành"
          userName={currentUser?.name}
          userRole={currentUser?.roleTitle}
          userInitials={currentUser?.initials}
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

          {/* Role Context & Capability Indicator */}
          <RoleNavigationBanner showDevSwitcher={previewMode} />

          {/* Dynamic View by Route & Role Permission */}
          {renderRouteContent()}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
