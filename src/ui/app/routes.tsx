import { useEffect, useState, type ReactNode } from 'react';
import { useSession } from './session-context';
import { AccessShell } from '../features/access/access-shell';
import { CustomerLinkRoute } from '../features/customer-link/customer-link-route';
import { InternalShell } from './internal-shell';
import { GenericErrorScreen, SessionCheckingScreen } from './status-screens';

export type AppRoute =
  | { kind: 'customer-link'; orderId: string }
  | { kind: 'showcase' }
  | { kind: 'internal' };

export function resolveRoute(hash: string): AppRoute {
  const customerMatch = hash.match(/^#\/customer\/([A-Za-z0-9-]+)$/);

  if (customerMatch) {
    return { kind: 'customer-link', orderId: customerMatch[1] };
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
  const { sessionStatus, isAuthenticated, capabilities, errorMessage, retrySessionCheck } =
    useSession();

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
      const defaultRoute = capabilities?.defaultRoute || '#/dashboard';
      window.location.hash = defaultRoute;
    }
  }, [isAuthenticated, currentHash, capabilities]);

  const route = resolveRoute(currentHash);

  // 1. Customer Public Route (Independent boundary, no auth required, no internal shell)
  if (route.kind === 'customer-link') {
    return <CustomerLinkRoute orderId={route.orderId} />;
  }

  // 2. Component Showcase (Publicly accessible for review / design system verification)
  if (route.kind === 'showcase') {
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

  // 3c. Unauthenticated / Expired / Submitting State -> Render Access Shell (Login boundary for C1-004)
  if (!isAuthenticated || sessionStatus === 'unauthenticated' || sessionStatus === 'expired' || sessionStatus === 'submitting') {
    return <AccessShell />;
  }

  // 3d. Authenticated State -> Render Internal Application Shell
  return <InternalShell previewMode={previewMode} onRetry={onRetry} />;
}
