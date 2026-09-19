import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

export const PRODUCER_ADMIN_EMAIL = 'wspcelly@gmail.com';
export const ALLOWED_ADMIN_EMAILS = ['wspcelly@gmail.com', 'ryansam0322@gmail.com', 'admin@celly.com'];

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginAsAdmin: (password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  lockAdmin: () => void;
  isAdmin: boolean;
  producerEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load stored session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('celly_token');
    const storedUser = localStorage.getItem('celly_user');

    if (storedToken && storedUser && storedToken !== 'null' && storedToken !== 'undefined') {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        const isOwnerAdmin = ALLOWED_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === parsedUser.email?.toLowerCase());
        if (isOwnerAdmin) {
          parsedUser.role = 'admin';
        }
        let activeToken = storedToken;
        if (isOwnerAdmin && (!storedToken || storedToken === 'customer-token-demo')) {
          activeToken = 'admin-token-celly';
          localStorage.setItem('celly_token', activeToken);
        }
        setToken(activeToken);
        setUser(parsedUser);
        setIsLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('celly_token');
        localStorage.removeItem('celly_user');
      }
    }

    // Default to producer owner session for CELLY so studio upload is immediately accessible
    const ownerUser: User = {
      id: 'usr_admin1',
      email: PRODUCER_ADMIN_EMAIL,
      name: 'CELLY Producer',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    setUser(ownerUser);
    setToken('admin-token-celly');
    localStorage.setItem('celly_token', 'admin-token-celly');
    localStorage.setItem('celly_user', JSON.stringify(ownerUser));
    localStorage.setItem('celly_admin_unlocked', 'true');

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('celly_token', data.token);
      localStorage.setItem('celly_user', JSON.stringify(data.user));
      if (data.user.role === 'admin') {
        localStorage.setItem('celly_admin_unlocked', 'true');
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const loginAsAdmin = async (
    password: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const adminEmail = email || PRODUCER_ADMIN_EMAIL;
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid producer credentials.' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('celly_token', data.token);
      localStorage.setItem('celly_user', JSON.stringify(data.user));
      localStorage.setItem('celly_admin_unlocked', 'true');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error while verifying producer access.' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('celly_token', data.token);
      localStorage.setItem('celly_user', JSON.stringify(data.user));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('celly_token');
    localStorage.removeItem('celly_user');
    localStorage.removeItem('celly_admin_unlocked');
  };

  const lockAdmin = () => {
    logout();
  };

  const isVerifiedAdmin = Boolean(
    user &&
      (user.role === 'admin' || ALLOWED_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === user.email.toLowerCase()))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginAsAdmin,
        logout,
        lockAdmin,
        isAdmin: isVerifiedAdmin,
        producerEmail: PRODUCER_ADMIN_EMAIL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

