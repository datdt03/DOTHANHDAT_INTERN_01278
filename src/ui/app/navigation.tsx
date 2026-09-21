import { useState, useEffect, type ReactNode } from 'react';
import { useSession, type UserRole } from './session-context';
import {
  AppFooter,
  AppHeader,
  AppSidebar,
  MobileFab,
} from '../shared/components';
import { ForbiddenState } from '../shared/components/forbidden-state';
import { CenteredPlaceholderPage } from '../shared/components/centered-placeholder-page';
import { CustomerRecordsArea } from '../features/customer-records-area/customer-records-area';
import { RepairIntakeWorkflow } from '../features/repair-intake-workflow/repair-intake-workflow';
import { RepairOrderArea } from '../features/repair-order-area/repair-order-area';
import type { AreaMountContext, C2AreaId } from './area-boundary';
import { getRoleCapabilities } from '../shared/api/access-api';
import { ComponentShowcaseView } from '../features/showcase/component-showcase-view';
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

    // Common C2 area mount helpers
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

    const areaContext: AreaMountContext = {
      workspaceId: currentUser?.workspaceId || 'ws-main',
      activeRole: currentRole,
      roles: currentUser?.roles || [currentRole],
      capabilities: capabilities || getRoleCapabilities(currentRole),
    };

    // 3. Customer Records Area (Fully developed in C2-002)
    if (cleanHash.startsWith('#/customers')) {
      const customerMatch = cleanHash.match(/^#\/customers\/([A-Za-z0-9-]+)$/);
      const customerId = customerMatch ? customerMatch[1] : undefined;

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
      return (
        <RepairIntakeWorkflow
          context={areaContext}
          onNavigate={handleNavigate}
          previewMode={previewMode}
          standalone={false}
        />
      );
    }

    // 5. Repair Order Area (C2-004)
    if (cleanHash.startsWith('#/orders')) {
      const orderMatch = cleanHash.match(/^#\/orders\/([A-Za-z0-9-]+)$/);
      const orderId = orderMatch ? orderMatch[1] : undefined;

      return (
        <RepairOrderArea
          context={areaContext}
          onNavigate={handleNavigate}
          initialOrderId={orderId}
          previewMode={previewMode}
          standalone={false}
        />
      );
    }

    // 5. All in-development routes (Overview, Work Queue, Devices, Staff, etc.) -> Standardized Centered Placeholder (matching Hình 3)
    return (
      <CenteredPlaceholderPage
        title={activeNav || 'Tính năng'}
        subtitle="Tính năng đang trong lộ trình phát triển"
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

      {/* Floating Action Button (FAB) for Mobile Quick Intake */}
      <MobileFab visible={canAccessRoute('#/repair-intake/new', currentRole, capabilities)} />
    </div>
  );
}
