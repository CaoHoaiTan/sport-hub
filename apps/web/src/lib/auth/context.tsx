'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';

import { type UserRole } from '@/lib/utils/roles';
import {
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/lib/auth/tokens';
import { LOGIN, REGISTER, REFRESH_TOKEN, LOGOUT } from '@/graphql/mutations/auth';
import { ME } from '@/graphql/queries/auth';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
}

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);
  const [refreshMutation] = useMutation(REFRESH_TOKEN);
  const [logoutMutation] = useMutation(LOGOUT);
  const [fetchMe] = useLazyQuery(ME);

  useEffect(() => {
    async function initAuth() {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await refreshMutation({
          variables: { token: refreshToken },
        });

        if (data?.refreshToken) {
          setTokens(data.refreshToken.accessToken, data.refreshToken.refreshToken);
          setUser(data.refreshToken.user as AuthUser);
        } else {
          clearTokens();
        }
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await loginMutation({
        variables: { input: { email, password } },
      });

      if (!data?.login) {
        throw new Error('Login failed');
      }

      setTokens(data.login.accessToken, data.login.refreshToken);
      setUser(data.login.user as AuthUser);
    },
    [loginMutation]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { data } = await registerMutation({
        variables: { input },
      });

      if (!data?.register) {
        throw new Error('Registration failed');
      }

      setTokens(data.register.accessToken, data.register.refreshToken);
      setUser(data.register.user as AuthUser);
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } catch {
      // Best-effort logout on server
    } finally {
      clearTokens();
      setUser(null);
    }
  }, [logoutMutation]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
