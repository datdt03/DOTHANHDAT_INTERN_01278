import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type UserRole = 'manager' | 'receptionist' | 'technician';

export interface StaffProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  email: string;
  initials: string;
  storeName: string;
}

export const DEMO_STAFF_ACCOUNTS: Record<UserRole, StaffProfile> = {
  manager: {
    id: 'staff-001',
    name: 'Minh Tâm',
    role: 'manager',
    roleTitle: 'Quản lý vận hành',
    email: 'minhtam@repairflow.vn',
    initials: 'MT',
    storeName: 'Minh Tâm Store',
  },
  receptionist: {
    id: 'staff-002',
    name: 'Thu Hà',
    role: 'receptionist',
    roleTitle: 'Lễ tân tiếp nhận',
    email: 'thuha@repairflow.vn',
    initials: 'TH',
    storeName: 'Minh Tâm Store',
  },
  technician: {
    id: 'staff-003',
    name: 'Quốc Bảo',
    role: 'technician',
    roleTitle: 'Kỹ thuật viên trưởng',
    email: 'quocbao@repairflow.vn',
    initials: 'QB',
    storeName: 'Minh Tâm Store',
  },
};

interface SessionContextValue {
  isAuthenticated: boolean;
  currentUser: StaffProfile | null;
  login: (email: string) => boolean;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = 'repairflow_active_session';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<StaffProfile | null>(() => {
    try {
      const savedRole = localStorage.getItem(STORAGE_KEY) as UserRole | null;
      if (savedRole && DEMO_STAFF_ACCOUNTS[savedRole]) {
        return DEMO_STAFF_ACCOUNTS[savedRole];
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    // Default to manager session in preview mode
    return DEMO_STAFF_ACCOUNTS.manager;
  });

  const isAuthenticated = currentUser !== null;

  const quickLogin = (role: UserRole) => {
    const profile = DEMO_STAFF_ACCOUNTS[role] || DEMO_STAFF_ACCOUNTS.manager;
    setCurrentUser(profile);
    try {
      localStorage.setItem(STORAGE_KEY, role);
    } catch {
      // Ignore
    }
  };

  const login = (email: string): boolean => {
    const found = Object.values(DEMO_STAFF_ACCOUNTS).find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (found) {
      setCurrentUser(found);
      try {
        localStorage.setItem(STORAGE_KEY, found.role);
      } catch {
        // Ignore
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const switchRole = (role: UserRole) => {
    quickLogin(role);
  };

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        quickLogin,
        logout,
        switchRole,
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
