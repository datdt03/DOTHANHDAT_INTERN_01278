import { useEffect, useState, type ReactNode } from 'react';
import { useSession } from './session-context';
import { AccessShell } from '../features/access/access-shell';
import { CustomerLinkRoute } from '../features/customer-link/customer-link-route';
import { InternalShell } from './internal-shell';
import { RoleAwareNavigationShell } from './navigation';
import { GenericErrorScreen, SessionCheckingScreen } from './status-screens';
import { getRoleEntryRoute } from './role-entry';

export type AppRoute =
  | { kind: 'customer-link'; orderId: string }
  | { kind: 'customer-records'; customerId?: string }
  | { kind: 'repair-intake' }
  | { kind: 'showcase' }
  | { kind: 'internal' };

export function resolveRoute(hash: string): AppRoute {
  const customerMatch = hash.match(/^#\/customer\/([A-Za-z0-9-]+)$/);

  if (customerMatch) {
    return { kind: 'customer-link', orderId: customerMatch[1] };
  }

  const customerRecordsMatch = hash.match(/^#\/customers(?:\/([A-Za-z0-9-]+))?$/);
  if (customerRecordsMatch) {
    return { kind: 'customer-records', customerId: customerRecordsMatch[1] };
  }

  if (hash.startsWith('#/repair-intake')) {
    return { kind: 'repair-intake' };
  }

  if (hash === '#/showcase' || hash === '#showcase') {
    return { kind: 'showcase' };
  }

  return { kind: 'internal' };
}

interface RouteBoundaryProps {
  previewMode: boolean;
  onRetry: () => void;
}

export function RouteBoundary({ previewMode, onRetry }: RouteBoundaryProps): ReactNode {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash);
  const {
    sessionStatus,
    isAuthenticated,
    currentUser,
    capabilities,
    errorMessage,
    retrySessionCheck,
    logout,
  } = useSession();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Forward authenticated user away from #/login to their default role entry route
  useEffect(() => {
    if (
      isAuthenticated &&
      (currentHash === '#/login' || !currentHash || currentHash === '#/' || currentHash === '#')
    ) {
      const defaultRoute = getRoleEntryRoute(currentUser?.role) || capabilities?.defaultRoute || '#/dashboard';
      window.location.hash = defaultRoute;
    }
  }, [isAuthenticated, currentHash, capabilities, currentUser?.role]);

  // Sanitize pathname to ensure SPA root stays at '/' and prevents nested hash URLs
  useEffect(() => {
    if (window.location.pathname && window.location.pathname !== '/') {
      const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const existingHash = window.location.hash || '';
      const targetHash = existingHash || (cleanPath ? `#/${cleanPath}` : '#/dashboard');
      window.history.replaceState(null, '', `/${targetHash}`);
      setCurrentHash(targetHash);
    }
  }, []);

  const route = resolveRoute(currentHash);

  // 1. Customer Public Route (Independent boundary, no auth required, no internal shell)
  if (route.kind === 'customer-link') {
    return <CustomerLinkRoute orderId={route.orderId} />;
  }

  // 2. Component Showcase (Publicly accessible for review / design system verification)
  if (route.kind === 'showcase') {
    if (isAuthenticated) {
      return <RoleAwareNavigationShell previewMode={previewMode} onRetry={onRetry} />;
    }
    return <InternalShell previewMode={previewMode} onRetry={onRetry} />;
  }

  // 3. Internal Protected Route Handling by Session Status Lifecycle:
  // 3a. Session Checking State
  if (sessionStatus === 'session-checking') {
    return <SessionCheckingScreen />;
  }

  // 3b. Session Error / Unavailable State (Generic error with retry)
  if (sessionStatus === 'error' || sessionStatus === 'unavailable') {
    return (
      <GenericErrorScreen
        title="Không thể kết nối tới hệ thống"
        message={errorMessage || 'Không thể xác thực phiên làm việc. Vui lòng thử lại.'}
        onRetry={retrySessionCheck}
      />
    );
  }

  // 3c. Unauthenticated / Expired / Login Submitting State -> Render Access Shell.
  // Keep the application shell mounted while an existing session changes role;
  // active-role switching is not a logout/login transition.
  const isRoleSwitching = sessionStatus === 'submitting' && currentUser !== null;
  if (
    (!isAuthenticated && !isRoleSwitching) ||
    sessionStatus === 'unauthenticated' ||
    sessionStatus === 'expired'
  ) {
    return <AccessShell />;
  }

  // 3d. Authenticated State -> Render Role-Aware Application Shell (which hosts sidebar, header, footer, and active area)
  return <RoleAwareNavigationShell previewMode={previewMode} onRetry={onRetry} />;
}
