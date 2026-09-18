/**
 * Access API Adapter and Contracts
 * Follows C1 specification: separation of access principal, safe contracts,
 * role capability projections, and session lifecycle.
 * Serves as the single boundary for C1-003 and C1-004 to plug real authentication APIs.
 */

import { runtimeConfig } from '../../config/runtime-config';
import { createApiClient, ApiClientError, type ApiClient } from './api-client';

export type UserRole = 'owner' | 'manager' | 'receptionist' | 'technician';
export type DevelopmentRole = Exclude<UserRole, 'owner'>;

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  activeRole: UserRole;
  roles: UserRole[];
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
  token?: string;
  user: UserProfile;
  expiresAt: string;
  capabilities: RoleCapabilities;
  activeRole: UserRole;
  roles: UserRole[];
}

export interface LoginCredentials {
  email: string;
  password?: string;
  workspaceId?: string | null;
}

export interface WorkspaceChoice {
  workspaceId: string;
  workspaceName: string;
  role: string;
  roles?: string[];
}

export interface LoginResult {
  success: boolean;
  session?: SessionContext;
  errorMessage?: string;
  errorCode?: string;
  workspaceChoices?: WorkspaceChoice[];
}

export interface ServerAccessContext {
  accountId: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  activeRole?: string;
  roles?: string[];
  staffProfileId: string;
  staffProfileName: string;
  capabilities?: ServerAccessCapabilities;
  effectiveCapabilities?: ServerAccessCapabilities;
}

export interface ServerAccessCapabilities {
  canViewWorkspace: boolean;
  canManageWorkspace: boolean;
  canManageStaff: boolean;
  canManageCredentials: boolean;
  canManageAssignments: boolean;
  canViewWorkspaceOperations: boolean;
  canViewOperationalProjection: boolean;
  canViewAssignedWork: boolean;
  canViewTechnicalDetails: boolean;
  canViewAudit: boolean;
  canWriteIntake: boolean;
  canWriteDiagnosis: boolean;
  canWriteQuoteDraft: boolean;
  canWriteRepair: boolean;
  canWriteQualityCheck: boolean;
  canWriteHandover: boolean;
  writesRequireAssignment: boolean;
}

// Preview accounts mirror the development access shape. The manager preview account
// intentionally includes two roles so the active-role boundary can be exercised
// without creating a second browser session.
export const DEMO_ACCOUNTS: Record<DevelopmentRole, UserProfile> = {
  manager: {
    id: 'staff-001',
    name: 'Quản lý RepairFlow',
    role: 'manager',
    activeRole: 'manager',
    roles: ['manager', 'technician'],
    roleTitle: 'Quản lý vận hành',
    email: 'manager@repairflow.vn',
    initials: 'QL',
    storeName: 'Minh Tâm Store',
    workspaceId: 'ws-main',
  },
  receptionist: {
    id: 'staff-002',
    name: 'Lễ tân RepairFlow',
    role: 'receptionist',
    activeRole: 'receptionist',
    roles: ['receptionist'],
    roleTitle: 'Lễ tân tiếp nhận',
    email: 'receptionist@repairflow.vn',
    initials: 'LT',
    storeName: 'Minh Tâm Store',
    workspaceId: 'ws-main',
  },
  technician: {
    id: 'staff-003',
    name: 'Kỹ thuật viên RepairFlow',
    role: 'technician',
    activeRole: 'technician',
    roles: ['technician'],
    roleTitle: 'Kỹ thuật viên',
    email: 'technician@repairflow.vn',
    initials: 'KT',
    storeName: 'Minh Tâm Store',
    workspaceId: 'ws-main',
  },
};

export function getRoleTitle(role: UserRole): string {
  switch (role) {
    case 'owner':
      return 'Chủ cửa hàng';
    case 'manager':
      return 'Quản lý vận hành';
    case 'receptionist':
      return 'Lễ tân tiếp nhận';
    case 'technician':
      return 'Kỹ thuật viên';
  }
}

export function getInitials(name: string): string {
  if (!name) return 'RF';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function mapServerAccessContextToUserProfile(context: ServerAccessContext): UserProfile {
  const activeRole = normalizeRole(context.activeRole || context.role);
  const roles = normalizeRoles(context.roles, activeRole);
  return {
    id: context.staffProfileId || context.accountId,
    name: context.staffProfileName || context.email,
    role: activeRole,
    activeRole,
    roles,
    roleTitle: getRoleTitle(activeRole),
    email: context.email,
    initials: getInitials(context.staffProfileName || context.email),
    storeName: context.workspaceName || 'Minh Tâm Store',
    workspaceId: context.workspaceId,
  };
}

function normalizeRole(value?: string): UserRole {
  switch (value?.toLowerCase()) {
    case 'owner':
    case 'manager':
    case 'receptionist':
    case 'technician':
      return value.toLowerCase() as UserRole;
    default:
      return 'manager';
  }
}

function normalizeRoles(values: string[] | undefined, fallback: UserRole): UserRole[] {
  const roles = (values || [])
    .map((value) => normalizeRole(value))
    .filter((value, index, collection) => collection.indexOf(value) === index);
  return roles.length > 0 ? roles : [fallback];
}

function mapServerCapabilities(
  role: UserRole,
  serverCapabilities?: ServerAccessCapabilities,
): RoleCapabilities {
  const presentationDefaults = getRoleCapabilities(role);
  if (!serverCapabilities) {
    return presentationDefaults;
  }

  return {
    ...presentationDefaults,
    canManageSettings: serverCapabilities.canManageWorkspace,
    canAssignStaff: serverCapabilities.canManageAssignments,
    canViewAllOrders:
      serverCapabilities.canViewWorkspaceOperations ||
      serverCapabilities.canViewOperationalProjection,
    canEditDiagnosis: serverCapabilities.canWriteDiagnosis,
    canEditQuote: serverCapabilities.canWriteQuoteDraft,
    canPerformRepair: serverCapabilities.canWriteRepair,
    canPerformQC: serverCapabilities.canWriteQualityCheck,
    canHandover: serverCapabilities.canWriteHandover,
    isReadOnlyLookup:
      serverCapabilities.canViewOperationalProjection &&
      !serverCapabilities.canWriteIntake &&
      !serverCapabilities.canWriteHandover,
    isAssignedOnly: serverCapabilities.writesRequireAssignment,
  };
}

function mapServerSession(context: ServerAccessContext, expiresAt: string): SessionContext {
  const user = mapServerAccessContextToUserProfile(context);
  return {
    user,
    expiresAt,
    capabilities: mapServerCapabilities(
      user.activeRole,
      context.effectiveCapabilities || context.capabilities,
    ),
    activeRole: user.activeRole,
    roles: user.roles,
  };
}

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
const DEVELOPMENT_PASSWORD = 'dat123456';

export interface AccessApi {
  login(credentials: LoginCredentials): Promise<LoginResult>;
  quickLogin(role: UserRole): Promise<LoginResult>;
  switchActiveRole(role: UserRole): Promise<SessionContext>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<SessionContext | null>;
  simulateTimeout(): void;
}

export class RealAccessAdapter implements AccessApi {
  constructor(private readonly client: ApiClient) {}

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const response = await this.client.request<{
        data: {
          context: ServerAccessContext;
          expiresAt: string;
        };
        meta: { requestId: string };
      }>('/api/access/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password ?? '',
          workspaceId: credentials.workspaceId || null,
        }),
      });

      const session = mapServerSession(response.data.context, response.data.expiresAt);

      return {
        success: true,
        session,
      };
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          return {
            success: false,
            errorCode: 'authentication_failed',
            errorMessage: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
          };
        }

        if (err.status === 409 && err.code === 'workspace_selection_required') {
          const details = err.details as { workspaces?: WorkspaceChoice[] } | undefined;
          return {
            success: false,
            errorCode: 'workspace_selection_required',
            errorMessage: 'Vui lòng chọn chi nhánh làm việc để tiếp tục.',
            workspaceChoices: details?.workspaces ?? [],
          };
        }

        if (err.status === 400) {
          return {
            success: false,
            errorCode: 'validation_error',
            errorMessage: 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.',
          };
        }

        if (err.status === 429) {
          return {
            success: false,
            errorCode: 'authentication_rate_limited',
            errorMessage: 'Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau ít phút.',
          };
        }

        if (err.status === 0 || err.code === 'network_error') {
          return {
            success: false,
            errorCode: 'network_error',
            errorMessage: 'Không thể kết nối tới hệ thống. Vui lòng thử lại.',
          };
        }
      }

      return {
        success: false,
        errorCode: 'generic_error',
        errorMessage: 'Không thể kết nối tới hệ thống. Vui lòng thử lại.',
      };
    }
  }

  async getCurrentSession(): Promise<SessionContext | null> {
    try {
      const response = await this.client.request<{
        data: {
          context: ServerAccessContext;
          expiresAt: string;
        };
        meta: { requestId: string };
      }>('/api/access/context', {
        method: 'GET',
      });

      return mapServerSession(response.data.context, response.data.expiresAt);
    } catch (err) {
      if (err instanceof ApiClientError) {
        // 401 with authentication_required means no active session
        if (err.status === 401) {
          return null;
        }
      }
      // Re-throw network or 5xx error so SessionProvider can display retry
      throw err;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.request<{ data: { revoked: boolean } }>('/api/access/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore errors on logout; UI always clears session locally
    }
  }

  async quickLogin(role: UserRole): Promise<LoginResult> {
    const account = role === 'owner' ? DEMO_ACCOUNTS.manager : DEMO_ACCOUNTS[role];
    return this.login({
      email: account.email,
      password: DEVELOPMENT_PASSWORD,
    });
  }

  async switchActiveRole(role: UserRole): Promise<SessionContext> {
    const response = await this.client.request<{
      data: {
        context: ServerAccessContext;
        expiresAt: string;
      };
      meta: { requestId: string };
    }>('/api/access/active-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });

    return mapServerSession(response.data.context, response.data.expiresAt);
  }

  simulateTimeout(): void {
    // Session timeout is enforced by server cookie and backend expiry
  }
}

export class MockAccessAdapter implements AccessApi {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const trimmed = credentials.email.trim().toLowerCase();

    // Brief async delay simulating network response
    await new Promise((r) => setTimeout(r, 150));

    const matched = Object.values(DEMO_ACCOUNTS).find((u) => u.email.toLowerCase() === trimmed);
    if (!matched || credentials.password !== DEVELOPMENT_PASSWORD) {
      return {
        success: false,
        errorMessage: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
        errorCode: 'authentication_failed',
      };
    }

    const session: SessionContext = {
      token: `mock-token-${matched.id}-${Date.now()}`,
      user: matched,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      capabilities: getRoleCapabilities(matched.role),
      activeRole: matched.activeRole,
      roles: matched.roles,
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

  async quickLogin(role: UserRole): Promise<LoginResult> {
    const user = role === 'owner' ? DEMO_ACCOUNTS.manager : DEMO_ACCOUNTS[role];
    const session: SessionContext = {
      token: `mock-token-${user.id}-${Date.now()}`,
      user,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      capabilities: getRoleCapabilities(user.role),
      activeRole: user.activeRole,
      roles: user.roles,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }

    return {
      success: true,
      session,
    };
  }

  async switchActiveRole(role: UserRole): Promise<SessionContext> {
    const current = await this.getCurrentSession();
    if (!current || !current.user.roles.includes(role)) {
      throw new Error('Vai trò này chưa được cấp trong không gian làm việc hiện tại.');
    }

    const user = {
      ...current.user,
      role,
      activeRole: role,
      roleTitle: getRoleTitle(role),
    };
    const session: SessionContext = {
      ...current,
      user,
      activeRole: role,
      capabilities: getRoleCapabilities(role),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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

      const activeRole = parsed.user.activeRole || parsed.user.role;
      const roles = parsed.user.roles?.length ? parsed.user.roles : [activeRole];
      parsed.user = {
        ...parsed.user,
        role: activeRole,
        activeRole,
        roles,
        roleTitle: getRoleTitle(activeRole),
      };
      parsed.activeRole = activeRole;
      parsed.roles = roles;
      parsed.capabilities = getRoleCapabilities(activeRole);
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

export function getAccessAdapter(previewMode = runtimeConfig.previewMode): AccessApi {
  if (previewMode) {
    return new MockAccessAdapter();
  }
  const client = createApiClient(runtimeConfig.apiBaseUrl, runtimeConfig.apiTimeoutMs);
  return new RealAccessAdapter(client);
}

export const accessApi: AccessApi = getAccessAdapter();
