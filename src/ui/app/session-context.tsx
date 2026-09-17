import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  accessApi,
  getRoleCapabilities,
  type RoleCapabilities,
  type UserProfile,
  type UserRole,
  type DevelopmentRole,
  DEMO_ACCOUNTS,
} from '../shared/api/access-api';

export type { UserRole, DevelopmentRole, UserProfile, RoleCapabilities };
export type StaffProfile = UserProfile;

export const DEMO_STAFF_ACCOUNTS = DEMO_ACCOUNTS;

export type SessionStatus = 'session-checking' | 'unauthenticated' | 'authenticated' | 'error';

interface SessionContextValue {
  sessionStatus: SessionStatus;
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  capabilities: RoleCapabilities | null;
  sessionNotice: string | null;
  errorMessage: string | null;
  clearSessionNotice: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; errorMessage?: string }>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  simulateSessionExpired: (customMessage?: string) => void;
  retrySessionCheck: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('session-checking');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize session asynchronously from accessApi boundary
  const checkSession = useCallback(async () => {
    setSessionStatus('session-checking');
    setErrorMessage(null);

    try {
      const session = await accessApi.getCurrentSession();
      if (session && session.user) {
        setCurrentUser(session.user);
        setSessionStatus('authenticated');
      } else {
        setCurrentUser(null);
        setSessionStatus('unauthenticated');
      }
    } catch (err) {
      setCurrentUser(null);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể xác thực phiên làm việc.');
      setSessionStatus('error');
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const isAuthenticated = sessionStatus === 'authenticated' && currentUser !== null;
  const capabilities = currentUser ? getRoleCapabilities(currentUser.role) : null;

  const clearSessionNotice = () => setSessionNotice(null);

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    setSessionNotice(null);
    try {
      const result = await accessApi.login({ email, password });

      if (result.success && result.session) {
        setCurrentUser(result.session.user);
        setSessionStatus('authenticated');
        // Navigate to the role's default entry route
        window.location.hash = result.session.capabilities.defaultRoute;
        return { success: true };
      }

      return {
        success: false,
        errorMessage: result.errorMessage || 'Email hoặc mật khẩu không chính xác.',
      };
    } catch (err) {
      return {
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Lỗi kết nối khi đăng nhập.',
      };
    }
  };

  const quickLogin = async (role: UserRole): Promise<void> => {
    setSessionNotice(null);
    const session = await accessApi.quickLogin(role);
    setCurrentUser(session.user);
    setSessionStatus('authenticated');
    // Automatically redirect to the entry screen for this role
    window.location.hash = session.capabilities.defaultRoute;
  };

  const logout = async (): Promise<void> => {
    await accessApi.logout();
    setCurrentUser(null);
    setSessionNotice(null);
    setSessionStatus('unauthenticated');
    window.location.hash = '#/login';
  };

  const switchRole = async (role: UserRole): Promise<void> => {
    await quickLogin(role);
  };

  const simulateSessionExpired = (
    customMessage = 'Phiên làm việc đã hết hạn sau 30 phút không hoạt động. Vui lòng đăng nhập lại.'
  ) => {
    accessApi.simulateTimeout();
    setCurrentUser(null);
    setSessionNotice(customMessage);
    setSessionStatus('unauthenticated');
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
        clearSessionNotice,
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
