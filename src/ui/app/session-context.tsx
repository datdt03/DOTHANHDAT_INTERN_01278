import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  accessApi,
  getRoleCapabilities,
  type RoleCapabilities,
  type UserProfile,
  type UserRole,
  DEMO_ACCOUNTS,
} from '../shared/api/access-api';

export type { UserRole, UserProfile };
export type StaffProfile = UserProfile;

export const DEMO_STAFF_ACCOUNTS = DEMO_ACCOUNTS;

interface SessionContextValue {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  capabilities: RoleCapabilities | null;
  sessionNotice: string | null;
  clearSessionNotice: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; errorMessage?: string }>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  simulateSessionExpired: (customMessage?: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = 'repairflow_active_session';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Initialize from storage or default to unauthenticated (Login Page by default)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.user && parsed.user.role) {
          // Check expiration
          if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
          }
          return parsed.user;
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    // Default to unauthenticated so users start at the Login page
    return null;
  });

  const isAuthenticated = currentUser !== null;
  const capabilities = currentUser ? getRoleCapabilities(currentUser.role) : null;

  const clearSessionNotice = () => setSessionNotice(null);

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    setSessionNotice(null);
    const result = await accessApi.login(email, password);

    if (result.success && result.session) {
      setCurrentUser(result.session.user);
      // Navigate to the role's default entry route
      window.location.hash = result.session.capabilities.defaultRoute;
      return { success: true };
    }

    return {
      success: false,
      errorMessage: result.errorMessage || 'Email hoặc mật khẩu không chính xác.',
    };
  };

  const quickLogin = async (role: UserRole): Promise<void> => {
    setSessionNotice(null);
    const session = await accessApi.quickLogin(role);
    setCurrentUser(session.user);
    // Automatically redirect to the entry screen for this role
    window.location.hash = session.capabilities.defaultRoute;
  };

  const logout = async (): Promise<void> => {
    await accessApi.logout();
    setCurrentUser(null);
    setSessionNotice(null);
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
    window.location.hash = '#/login';
  };

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        capabilities,
        sessionNotice,
        clearSessionNotice,
        login,
        quickLogin,
        logout,
        switchRole,
        simulateSessionExpired,
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
