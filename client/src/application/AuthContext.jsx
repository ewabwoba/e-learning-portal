import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRepo } from './DataContext';
import { getToken, setToken } from '../infrastructure/session';
import { homeForRole } from '../domain/access';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const repo = useRepo();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());

  useEffect(() => {
    if (!getToken()) return;
    repo.auth.me().then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, [repo]);

  const accept = useCallback(({ token, user: u }) => { setToken(token); setUser(u); return u; }, []);
  const value = useMemo(() => ({
    user, ready, isAuthenticated: Boolean(user), mode: repo.mode,
    login: async (c) => accept(await repo.auth.login(c)),
    register: async (c) => accept(await repo.auth.register(c)),
    logout: () => { setToken(null); setUser(null); },
    updateProfile: async (p) => setUser(await repo.auth.updateProfile(p)),
    /** Re-reads the account, e.g. after an admin approves an instructor. */
    refreshUser: async () => { const u = await repo.auth.me(); setUser(u); return u; },
  }), [user, ready, repo, accept]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const homeFor = (u) => homeForRole(u?.role);
