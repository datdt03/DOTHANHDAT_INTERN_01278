import { useState, useEffect, type ReactNode } from 'react';
import { useSession, type UserRole } from './session-context';
import {
  AppFooter,
  AppHeader,
  AppSidebar,
} from '../shared/components';
import { ForbiddenState } from '../shared/components/forbidden-state';
import { CenteredPlaceholderPage } from '../shared/components/centered-placeholder-page';
import { CustomerRecordsArea } from '../features/customer-records-area/customer-records-area';
import { RepairIntakeWorkflow } from '../features/repair-intake-workflow/repair-intake-workflow';
import type { AreaMountContext, C2AreaId } from './area-boundary';
import { getRoleCapabilities } from '../shared/api/access-api';
import { ComponentShowcaseView } from '../features/showcase/component-showcase-view';
import { DashboardPlaceholder } from '../features/dashboard/dashboard-placeholder';
import { RoleContextSwitcher } from '../features/access/role-context-switcher';
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

    // 3. Customer Records Area (Fully developed in C2-002)
    if (cleanHash.startsWith('#/customers')) {
      const customerMatch = cleanHash.match(/^#\/customers\/([A-Za-z0-9-]+)$/);
      const customerId = customerMatch ? customerMatch[1] : undefined;

      const areaContext: AreaMountContext = {
        workspaceId: currentUser?.workspaceId || 'ws-main',
        activeRole: currentRole,
        roles: currentUser?.roles || [currentRole],
        capabilities: capabilities || getRoleCapabilities(currentRole),
      };

      const handleNavigate = (area: C2AreaId, resourceId?: string) => {
        if (area === 'device-area') {
          window.location.hash = resourceId ? `#/devices/${resourceId}` : '#/devices';
        } else if (area === 'repair-order-area') {
          window.location.hash = resourceId ? `#/orders/${resourceId}` : '#/orders';
        } else if (area === 'customer-records-area') {
          window.location.hash = resourceId ? `#/customers/${resourceId}` : '#/customers';
        } else if (area === 'repair-intake-workflow') {
          window.location.hash = '#/repair-intake/new';
        }
      };

      return (
        <CustomerRecordsArea
          context={areaContext}
          onNavigate={handleNavigate}
          initialCustomerId={customerId}
          previewMode={previewMode}
          standalone={false}
        />
      );
    }

    // 4. Repair Intake Workflow (C2-002 Revision 3 Primary Task-First Flow)
    if (cleanHash.startsWith('#/repair-intake')) {
      const areaContext: AreaMountContext = {
        workspaceId: currentUser?.workspaceId || 'ws-main',
        activeRole: currentRole,
        roles: currentUser?.roles || [currentRole],
        capabilities: capabilities || getRoleCapabilities(currentRole),
      };

      const handleNavigate = (area: C2AreaId, resourceId?: string) => {
        if (area === 'device-area') {
          window.location.hash = resourceId ? `#/devices/${resourceId}` : '#/devices';
        } else if (area === 'repair-order-area') {
          window.location.hash = resourceId ? `#/orders/${resourceId}` : '#/orders';
        } else if (area === 'customer-records-area') {
          window.location.hash = resourceId ? `#/customers/${resourceId}` : '#/customers';
        } else if (area === 'repair-intake-workflow') {
          window.location.hash = '#/repair-intake/new';
        }
      };

      return (
        <RepairIntakeWorkflow
          context={areaContext}
          onNavigate={handleNavigate}
          previewMode={previewMode}
          standalone={false}
        />
      );
    }

    // 5. Role-aware Dashboard Overview (Manager Overview, Receptionist Today, Technician My Work)
    if (!cleanHash || cleanHash === '#/dashboard' || cleanHash === '#/today' || cleanHash === '#/my-work') {
      return (
        <DashboardPlaceholder
          role={currentRole}
          userName={currentUser?.name}
          roleTitle={currentUser?.roleTitle}
        />
      );
    }

    // 6. All other routes not yet developed -> Minimalist Centered Placeholder
    return (
      <CenteredPlaceholderPage
        title={activeNav || 'Trang đang phát triển'}
      />
    );
  };

  return (
    <div className="app-layout">
      {/* Sidebar with role-aware tabs, workspace context, drawer support */}
      <AppSidebar
        activeItem={activeNav}
        activeRoute={cleanHash || getRoleEntryRoute(currentRole)}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        storeName={currentUser?.storeName || 'Minh Tâm Store'}
        userName={currentUser?.name}
        userRole={currentUser?.roleTitle}
        userInitials={currentUser?.initials}
        currentRole={currentRole}
        capabilities={capabilities}
        onLogout={logout}
      />

      <div className="app-main">
        {/* Header with Title, Workspace badge, Search, Quick action, Notifications, User */}
        <AppHeader
          title={isAllowed ? activeNav : 'Truy cập bị từ chối'}
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

          {/* Dynamic View by Route & Role Permission */}
          {renderRouteContent()}
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
