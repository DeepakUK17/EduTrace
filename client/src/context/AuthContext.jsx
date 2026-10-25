import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { role: 'PLATFORM_ADMIN', label: 'Platform Admin (AICTE Bureau)', email: 'admin@edutrace.demo', password: 'Demo@Admin1' },
  { role: 'INSTITUTION_ADMIN', label: 'Institution Admin (Apex Tech)', email: 'inst.admin@apextech.demo', password: 'Demo@Inst1' },
  { role: 'DATA_OPERATOR', label: 'Data Operator (Registrar Office)', email: 'operator@apextech.demo', password: 'Demo@Oper1' },
  { role: 'VERIFIER', label: 'Authorized Verifier (Employer/Govt)', email: 'verifier@edutrace.demo', password: 'Demo@Verif1' },
  { role: 'STUDENT', label: 'Student Identity Portal', email: 'student@apextech.demo', password: 'Demo@Stud1' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('edutrace_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('edutrace_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('edutrace_user', JSON.stringify(res.data.user));
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    loadMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('edutrace_token', newToken);
    localStorage.setItem('edutrace_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('edutrace_token');
    localStorage.removeItem('edutrace_user');
    setToken(null);
    setUser(null);
  };

  const switchDemoAccount = async (roleName) => {
    const account = DEMO_ACCOUNTS.find((a) => a.role === roleName);
    if (!account) return;
    return login(account.email, account.password);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoAccount,
        hasRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
