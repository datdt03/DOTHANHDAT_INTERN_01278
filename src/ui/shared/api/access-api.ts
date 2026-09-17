/**
 * Access API Adapter and Contracts
 * Follows C1 specification: separation of access principal, safe contracts,
 * role capability projections, and session lifecycle.
 * Serves as the single boundary for C1-003 and C1-004 to plug real authentication APIs.
 */

export type UserRole = 'owner' | 'manager' | 'receptionist' | 'technician';
export type DevelopmentRole = Exclude<UserRole, 'owner'>;

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  email: string;
  initials: string;
  storeName: string;
  workspaceId: string;
}

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  isPrimaryAction?: boolean;
  badgeCount?: number;
}

export interface RoleCapabilities {
  canManageSettings: boolean;
  canAssignStaff: boolean;
  canViewAllOrders: boolean;
  canEditDiagnosis: boolean;
  canEditQuote: boolean;
  canPerformRepair: boolean;
  canPerformQC: boolean;
  canHandover: boolean;
  isReadOnlyLookup: boolean;
  isAssignedOnly: boolean;
  defaultRoute: string;
  navigationItems: NavigationItem[];
}

export interface SessionContext {
  token: string;
  user: UserProfile;
  expiresAt: string;
  capabilities: RoleCapabilities;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface LoginResult {
  success: boolean;
  session?: SessionContext;
  errorMessage?: string;
  isLocked?: boolean;
}

// Development/demo accounts mirror the development database seed. The product still
// supports the owner role, but owner is intentionally not provisioned in this test set.
export const DEMO_ACCOUNTS: Record<DevelopmentRole, UserProfile> = {
  manager: {
    id: 'staff-001',
    name: 'Minh Tâm',
    role: 'manager',
    roleTitle: 'Quản lý vận hành',
    email: 'manager@repairflow.vn',
    initials: 'MT',
    storeName: 'Minh Tâm Store',
    workspaceId: 'ws-main',
  },
  receptionist: {
    id: 'staff-002',
    name: 'Thu Hà',
    role: 'receptionist',
    roleTitle: 'Lễ tân tiếp nhận',
    email: 'receptionist@repairflow.vn',
    initials: 'TH',
    storeName: 'Minh Tâm Store',
    workspaceId: 'ws-main',
  },
  technician: {
    id: 'staff-003',
    name: 'Quốc Bảo',
    role: 'technician',
    roleTitle: 'Kỹ thuật viên trưởng',
    email: 'technician@repairflow.vn',
    initials: 'QB',
    storeName: 'Minh Tâm Store',
    workspaceId: 'ws-main',
  },
};

export function getRoleCapabilities(role: UserRole): RoleCapabilities {
  switch (role) {
    case 'owner':
    case 'manager':
      return {
        canManageSettings: true,
        canAssignStaff: true,
        canViewAllOrders: true,
        canEditDiagnosis: true,
        canEditQuote: true,
        canPerformRepair: true,
        canPerformQC: true,
        canHandover: true,
        isReadOnlyLookup: false,
        isAssignedOnly: false,
        defaultRoute: '#/dashboard',
        navigationItems: [
          { label: 'Tổng quan', route: '#/dashboard', icon: 'overview' },
          { label: 'Phiếu sửa chữa', route: '#/orders', icon: 'orders' },
          { label: 'Hàng chờ công việc', route: '#/my-work', icon: 'queue', badgeCount: 5 },
          { label: 'Khách hàng', route: '#/customers', icon: 'customers' },
          { label: 'Thiết bị và lịch sử', route: '#/devices', icon: 'devices' },
          { label: 'Nhân sự & phân công', route: '#/staff-assignments', icon: 'staff' },
          { label: 'Quy trình cửa hàng', route: '#/workflow-config', icon: 'workflow' },
        ],
      };
    case 'receptionist':
      return {
        canManageSettings: false,
        canAssignStaff: false,
        canViewAllOrders: true,
        canEditDiagnosis: false,
        canEditQuote: false,
        canPerformRepair: false,
        canPerformQC: false,
        canHandover: true,
        isReadOnlyLookup: true,
        isAssignedOnly: false,
        defaultRoute: '#/today',
        navigationItems: [
          { label: 'Hôm nay', route: '#/today', icon: 'today' },
          { label: 'Tra cứu tiến độ', route: '#/lookup', icon: 'lookup' },
          { label: 'Phiếu sửa chữa', route: '#/orders', icon: 'orders' },
          { label: 'Hàng chờ tiếp nhận', route: '#/reception-queue', icon: 'inbox' },
        ],
      };
    case 'technician':
      return {
        canManageSettings: false,
        canAssignStaff: false,
        canViewAllOrders: false,
        canEditDiagnosis: true,
        canEditQuote: true,
        canPerformRepair: true,
        canPerformQC: true,
        canHandover: false,
        isReadOnlyLookup: false,
        isAssignedOnly: true,
        defaultRoute: '#/my-work',
        navigationItems: [
          { label: 'Hàng chờ công việc', route: '#/my-work', icon: 'queue' },
          { label: 'Phiếu được phân công', route: '#/assigned-orders', icon: 'orders' },
        ],
      };
  }
}

const STORAGE_KEY = 'repairflow_active_session';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 mins idle timeout
const DEVELOPMENT_PASSWORD = '123456';

export interface AccessApi {
  login(credentials: LoginCredentials): Promise<LoginResult>;
  quickLogin(role: UserRole): Promise<SessionContext>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<SessionContext | null>;
  simulateTimeout(): void;
}

class MockAccessAdapter implements AccessApi {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const trimmed = credentials.email.trim().toLowerCase();

    // Brief async delay simulating network response
    await new Promise((r) => setTimeout(r, 150));

    const matched = Object.values(DEMO_ACCOUNTS).find((u) => u.email.toLowerCase() === trimmed);
    if (!matched || credentials.password !== DEVELOPMENT_PASSWORD) {
      return {
        success: false,
        errorMessage: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
      };
    }

    const session: SessionContext = {
      token: `mock-token-${matched.id}-${Date.now()}`,
      user: matched,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      capabilities: getRoleCapabilities(matched.role),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors in restricted/sandboxed mode
    }

    return {
      success: true,
      session,
    };
  }

  async quickLogin(role: UserRole): Promise<SessionContext> {
    const user = role === 'owner' ? DEMO_ACCOUNTS.manager : DEMO_ACCOUNTS[role];
    const session: SessionContext = {
      token: `mock-token-${user.id}-${Date.now()}`,
      user,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      capabilities: getRoleCapabilities(user.role),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }

    return session;
  }

  async logout(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  async getCurrentSession(): Promise<SessionContext | null> {
    // Brief async call to simulate session resolution
    await new Promise((r) => setTimeout(r, 50));

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed: SessionContext = JSON.parse(raw);
      if (!parsed.user || !parsed.user.role) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Check session expiry
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Ensure fresh capabilities mapping
      parsed.capabilities = getRoleCapabilities(parsed.user.role);
      return parsed;
    } catch {
      return null;
    }
  }

  simulateTimeout(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SessionContext = JSON.parse(raw);
        parsed.expiresAt = new Date(Date.now() - 1000).toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // Ignore
    }
  }
}

export const accessApi: AccessApi = new MockAccessAdapter();
