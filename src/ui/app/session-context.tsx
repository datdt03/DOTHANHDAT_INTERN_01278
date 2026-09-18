import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getAccessAdapter,
  type RoleCapabilities,
  type UserProfile,
  type UserRole,
  type DevelopmentRole,
  type WorkspaceChoice,
  type LoginResult,
  DEMO_ACCOUNTS,
} from '../shared/api/access-api';
import { ApiClientError } from '../shared/api/api-client';
import { canAccessRoute, getRoleEntryRoute } from './role-entry';

export type { UserRole, DevelopmentRole, UserProfile, RoleCapabilities, WorkspaceChoice, LoginResult };
export type StaffProfile = UserProfile;

export const DEMO_STAFF_ACCOUNTS = DEMO_ACCOUNTS;

export type SessionStatus =
  | 'session-checking'
  | 'unauthenticated'
  | 'submitting'
  | 'authenticated'
  | 'unavailable'
  | 'error'
  | 'expired';

interface SessionContextValue {
  sessionStatus: SessionStatus;
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  capabilities: RoleCapabilities | null;
  sessionNotice: string | null;
  errorMessage: string | null;
  workspaceChoices: WorkspaceChoice[] | null;
  clearSessionNotice: () => void;
  clearWorkspaceChoices: () => void;
  login: (email: string, password?: string, workspaceId?: string | null) => Promise<LoginResult>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  simulateSessionExpired: (customMessage?: string) => void;
  retrySessionCheck: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
  children: ReactNode;
  previewMode?: boolean;
}

export function SessionProvider({ children, previewMode = false }: SessionProviderProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('session-checking');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [capabilities, setCapabilities] = useState<RoleCapabilities | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workspaceChoices, setWorkspaceChoices] = useState<WorkspaceChoice[] | null>(null);

  const adapter = useMemo(() => getAccessAdapter(previewMode), [previewMode]);

  // Initialize session asynchronously from accessApi boundary
  const checkSession = useCallback(async () => {
    setSessionStatus('session-checking');
    setErrorMessage(null);

    try {
      const session = await adapter.getCurrentSession();
      if (session && session.user) {
        setCurrentUser(session.user);
        setCapabilities(session.capabilities);
        setSessionStatus('authenticated');
      } else {
        setCurrentUser(null);
        setCapabilities(null);
        setSessionStatus('unauthenticated');
      }
    } catch (err) {
      setCurrentUser(null);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể kết nối tới hệ thống.');
      setSessionStatus('unavailable');
    }
  }, [adapter]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const isAuthenticated = sessionStatus === 'authenticated' && currentUser !== null;

  const clearSessionNotice = () => setSessionNotice(null);
  const clearWorkspaceChoices = () => setWorkspaceChoices(null);

  const login = async (
    email: string,
    password?: string,
    workspaceId?: string | null,
  ): Promise<LoginResult> => {
    setSessionNotice(null);
    setSessionStatus('submitting');
    try {
      const result = await adapter.login({ email, password, workspaceId });

      if (result.success && result.session) {
        setCurrentUser(result.session.user);
        setCapabilities(result.session.capabilities);
        setWorkspaceChoices(null);
        setSessionStatus('authenticated');
        // Navigate to the role's default entry route
        window.location.hash = result.session.capabilities.defaultRoute;
        return result;
      }

      if (result.workspaceChoices && result.workspaceChoices.length > 0) {
        setWorkspaceChoices(result.workspaceChoices);
        setSessionStatus('unauthenticated');
        return result;
      }

      setSessionStatus('unauthenticated');
      return result;
    } catch (err) {
      setSessionStatus('unauthenticated');
      return {
        success: false,
        errorCode: 'network_error',
        errorMessage: err instanceof Error ? err.message : 'Lỗi kết nối khi đăng nhập.',
      };
    }
  };

  const quickLogin = async (role: UserRole): Promise<void> => {
    setSessionNotice(null);
    setSessionStatus('submitting');
    try {
      const result = await adapter.quickLogin(role);
      if (result.success && result.session) {
        setCurrentUser(result.session.user);
        setCapabilities(result.session.capabilities);
        setWorkspaceChoices(null);
        setSessionStatus('authenticated');
        window.location.hash = result.session.capabilities.defaultRoute;
      } else {
        setSessionStatus('unauthenticated');
        setErrorMessage(result.errorMessage || 'Đăng nhập nhanh không thành công.');
      }
    } catch (err) {
      setSessionStatus('unauthenticated');
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kết nối khi đăng nhập nhanh.');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await adapter.logout();
    } finally {
      setCurrentUser(null);
      setCapabilities(null);
      setSessionNotice(null);
      setWorkspaceChoices(null);
      setSessionStatus('unauthenticated');
      window.location.hash = '#/login';
    }
  };

  const switchRole = async (role: UserRole): Promise<void> => {
    if (!currentUser || !currentUser.roles.includes(role) || role === currentUser.activeRole) {
      return;
    }

    setSessionStatus('submitting');
    setErrorMessage(null);
    try {
      const currentRoute = window.location.hash;
      const session = await adapter.switchActiveRole(role);
      setCurrentUser(session.user);
      setCapabilities(session.capabilities);
      setSessionStatus('authenticated');

      if (!canAccessRoute(currentRoute, session.user.activeRole, session.capabilities)) {
        window.location.hash = session.capabilities.defaultRoute || getRoleEntryRoute(session.user.activeRole);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setCurrentUser(null);
        setCapabilities(null);
        setSessionStatus('expired');
        window.location.hash = '#/login';
        return;
      }

      setSessionStatus('authenticated');
      setErrorMessage(err instanceof Error ? err.message : 'Không thể đổi ngữ cảnh làm việc.');
    }
  };

  const simulateSessionExpired = (
    customMessage = 'Phiên làm việc đã hết hạn hoặc không còn hợp lệ. Vui lòng đăng nhập lại.',
  ) => {
    adapter.simulateTimeout();
    setCurrentUser(null);
    setCapabilities(null);
    setWorkspaceChoices(null);
    setSessionNotice(customMessage);
    setSessionStatus('expired');
    window.location.hash = '#/login';
  };

  return (
    <SessionContext.Provider
      value={{
        sessionStatus,
        isAuthenticated,
        currentUser,
        capabilities,
        sessionNotice,
        errorMessage,
        workspaceChoices,
        clearSessionNotice,
        clearWorkspaceChoices,
        login,
        quickLogin,
        logout,
        switchRole,
        simulateSessionExpired,
        retrySessionCheck: checkSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
