import { useEffect, useState, type ReactNode } from 'react';
import { useSession } from './session-context';
import { LoginPage } from '../features/access/login-page';
import { CustomerProgressView } from '../features/customer-link/customer-progress-view';
import { InternalShell } from './internal-shell';

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
  const { isAuthenticated, capabilities } = useSession();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Forward authenticated user away from #/login to their default entry route
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

  // 1. Customer Public Route (Independent boundary, no login required)
  if (route.kind === 'customer-link') {
    return <CustomerProgressView orderId={route.orderId} />;
  }

  // 2. Component Showcase (Publicly accessible for review / testing)
  if (route.kind === 'showcase') {
    return <InternalShell previewMode={previewMode} onRetry={onRetry} />;
  }

  // 3. Unauthenticated Internal State -> Render Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 4. Authenticated Internal State -> Render Internal Shell
  return <InternalShell previewMode={previewMode} onRetry={onRetry} />;
}
