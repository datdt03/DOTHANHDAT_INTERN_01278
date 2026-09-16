import { CustomerProgressView } from './customer-progress-view';

interface CustomerLinkRouteProps {
  orderId?: string;
}

/**
 * CustomerLinkRoute
 * Public route boundary for customer tracking link.
 * Strictly isolated from internal staff application:
 * - No internal sidebar
 * - No internal header or staff navigation
 * - Mobile-first layout (390x844) compatible with desktop
 */
export function CustomerLinkRoute({ orderId = 'RF-2026-0891' }: CustomerLinkRouteProps) {
  return <CustomerProgressView orderId={orderId} />;
}
