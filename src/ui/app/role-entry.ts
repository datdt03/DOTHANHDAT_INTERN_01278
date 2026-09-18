import type { RoleCapabilities, UserRole } from '../shared/api/access-api';

/**
 * Role-based default entry routes.
 * Manager/Owner -> Operational Dashboard (UI-A06)
 * Receptionist  -> Today / Operational Lookup (UI-A07 / UI-B02)
 * Technician    -> My Work / Priority Task Queue (UI-A08)
 */
export const ROLE_ENTRY_ROUTES: Record<UserRole, string> = {
  owner: '#/dashboard',
  manager: '#/dashboard',
  receptionist: '#/today',
  technician: '#/my-work',
};

/**
 * Permitted routes per persona.
 * UI acts only as a presentation navigator; the server enforces actual authorization.
 */
export const ROLE_ALLOWED_ROUTES: Record<UserRole, readonly string[]> = {
  owner: [
    '#/dashboard',
    '#/orders',
    '#/my-work',
    '#/customers',
    '#/devices',
    '#/staff-assignments',
    '#/workflow-config',
    '#/settings',
    '#/today',
    '#/lookup',
    '#/showcase',
  ],
  manager: [
    '#/dashboard',
    '#/orders',
    '#/my-work',
    '#/customers',
    '#/devices',
    '#/staff-assignments',
    '#/workflow-config',
    '#/settings',
    '#/today',
    '#/lookup',
    '#/showcase',
  ],
  receptionist: [
    '#/today',
    '#/lookup',
    '#/orders',
    '#/customers',
    '#/reception-queue',
    '#/showcase',
  ],
  technician: [
    '#/my-work',
    '#/assigned-orders',
    '#/showcase',
  ],
};

/**
 * Normalize browser URL hash for uniform route matching.
 */
export function normalizeRouteHash(rawHash: string): string {
  if (!rawHash || rawHash === '#' || rawHash === '#/') {
    return '';
  }
  // Strip query parameters and trailing slash
  const withoutQuery = rawHash.split('?')[0];
  return withoutQuery.replace(/\/$/, '');
}

/**
 * Get the initial entry route for a given user role.
 */
export function getRoleEntryRoute(role?: UserRole | string | null): string {
  if (!role) return '#/dashboard';
  const normalized = role.toLowerCase() as UserRole;
  return ROLE_ENTRY_ROUTES[normalized] || '#/dashboard';
}

/**
 * Verify whether a route hash is accessible for the given role and capabilities.
 * If unauthorized, route boundary must render ForbiddenState without protected data.
 */
export function canAccessRoute(
  rawHash: string,
  role?: UserRole | string | null,
  capabilities?: RoleCapabilities | null,
): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as UserRole;
  const cleanRoute = normalizeRouteHash(rawHash);

  // Empty or login hash should always resolve to entry route
  if (!cleanRoute || cleanRoute === '#/login') {
    return true;
  }

  // Showcase is available to all internal staff
  if (cleanRoute === '#/showcase') {
    return true;
  }

  // Capability-based checks
  if (capabilities) {
    if (cleanRoute === '#/dashboard' && !capabilities.canViewAllOrders) {
      return false;
    }
    if ((cleanRoute === '#/today' || cleanRoute === '#/lookup') && !capabilities.isReadOnlyLookup && capabilities.isAssignedOnly) {
      return false;
    }
    if ((cleanRoute === '#/my-work' || cleanRoute === '#/assigned-orders') && capabilities.isReadOnlyLookup && !capabilities.canPerformRepair && !capabilities.canEditDiagnosis) {
      return false;
    }
    if (cleanRoute === '#/staff-assignments' && !capabilities.canAssignStaff) {
      return false;
    }
    if (cleanRoute === '#/settings' && !capabilities.canManageSettings) {
      return false;
    }
  }

  const allowedList = ROLE_ALLOWED_ROUTES[normalizedRole];
  if (!allowedList) return false;

  const baseRoute = cleanRoute.startsWith('#/customers/') ? '#/customers' : cleanRoute;
  return allowedList.includes(baseRoute);
}

/**
 * Human-readable titles for known routes.
 */
export function getRouteTitle(rawHash: string, role?: UserRole): string {
  const clean = normalizeRouteHash(rawHash);
  if (clean.startsWith('#/customers')) {
    return 'Khách hàng';
  }
  switch (clean) {
    case '#/dashboard':
      return 'Tổng quan vận hành';
    case '#/today':
      return 'Tổng quan hôm nay';
    case '#/lookup':
      return 'Tra cứu tiến độ';
    case '#/my-work':
      return 'Hàng chờ công việc';
    case '#/assigned-orders':
      return 'Phiếu được phân công';
    case '#/orders':
      return 'Phiếu sửa chữa';
    case '#/customers':
      return 'Khách hàng';
    case '#/devices':
      return 'Thiết bị và lịch sử';
    case '#/staff-assignments':
      return 'Nhân sự & phân công';
    case '#/workflow-config':
      return 'Quy trình cửa hàng';
    case '#/settings':
      return 'Quản trị hệ thống';
    case '#/reception-queue':
      return 'Hàng chờ tiếp nhận';
    case '#/showcase':
      return 'Thư viện UI (Showcase)';
    default:
      if (role === 'receptionist') return 'Hôm nay';
      if (role === 'technician') return 'Hàng chờ công việc';
      return 'Tổng quan';
  }
}

/**
 * Safe presentation summary of role capabilities.
 */
export function getRoleScopeDescription(role?: UserRole): string {
  switch (role) {
    case 'owner':
      return 'Chủ cửa hàng • Toàn quyền quản trị chi nhánh và cấu hình';
    case 'manager':
      return 'Quản lý vận hành • Toàn quyền điều phối và phân công xưởng';
    case 'receptionist':
      return 'Lễ tân tiếp nhận • Tra cứu an toàn & Tiếp nhận theo phân công';
    case 'technician':
      return 'Kỹ thuật viên • Hàng chờ công việc theo phân công (SLA)';
    default:
      return 'Nhân sự nội bộ';
  }
}
