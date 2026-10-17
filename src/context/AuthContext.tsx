import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AcademicYearRoman, AuthSession, Department, LoginResult } from '../types/auth';
import {
  DEPARTMENTS,
  DEPARTMENT_CREDENTIALS,
  ADMIN_DEPARTMENT,
  getStoredDepartmentProfile,
  saveDepartmentProfile,
  resetDepartmentProfile,
} from '../config/departments.config';
import { verifyPassword } from '../utils/crypto';
import { logAuditEventToCloud } from '../services/firebase';

interface AuthContextType {
  session: AuthSession | null;
  activeDepartment: Department | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (
    username: string,
    year: AcademicYearRoman,
    section: string,
    password: string
  ) => Promise<LoginResult>;
  logout: () => void;
  clearError: () => void;
  updateDepartmentProfile: (updates: Partial<Department>) => void;
  resetDepartmentToDefault: () => void;
}

const STORAGE_KEY = 'college_attendance_dept_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Restore stored session on startup
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        // Verify session hasn't expired
        if (new Date(parsed.expiresAt).getTime() > Date.now()) {
          setSession(parsed);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.warn('Could not restore session from storage', err);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = async (
    username: string,
    year: AcademicYearRoman,
    section: string,
    password: string
  ): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    const isAdminUser = normalizedUsername === 'admin' || normalizedUsername === 'vsbec_admin';

    let cleanSection = section.trim().toUpperCase();
    let validatedYear: AcademicYearRoman = year;

    if (isAdminUser) {
      // Admin defaults for session completeness
      cleanSection = cleanSection || 'A';
      validatedYear = validatedYear || 'I';
    } else {
      // Validate section is a single uppercase letter for academic departments
      if (!/^[A-Z]$/.test(cleanSection)) {
        const msg = 'Section must be a single uppercase character (e.g. A, B, C).';
        setError(msg);
        setIsLoading(false);
        return { success: false, errorMessage: msg };
      }

      // Validate academic year
      if (!['I', 'II', 'III', 'IV'].includes(validatedYear)) {
        const msg = 'Please select a valid academic Year (I, II, III, or IV).';
        setError(msg);
        setIsLoading(false);
        return { success: false, errorMessage: msg };
      }
    }

    // Simulate authenticating latency (250ms)
    await new Promise((resolve) => setTimeout(resolve, 250));

    // 1. Find credential record for the username
    const credential = DEPARTMENT_CREDENTIALS.find(
      (c) => c.username.toLowerCase() === normalizedUsername
    );

    if (!credential) {
      const msg = isAdminUser
        ? 'Invalid administrator credentials.'
        : 'Invalid department username or department not registered.';
      setError(msg);
      setIsLoading(false);
      return { success: false, errorMessage: msg };
    }

    // 2. Cryptographically verify salted SHA-256 hash
    const isValid = await verifyPassword(password, credential.salt, credential.passwordHash);

    if (!isValid) {
      const msg = isAdminUser
        ? 'Invalid administrator password.'
        : 'Invalid department password. Please check your credentials.';
      setError(msg);
      setIsLoading(false);
      return { success: false, errorMessage: msg };
    }

    // 3. Resolve department metadata
    let dept: Department;
    if (isAdminUser) {
      dept = ADMIN_DEPARTMENT;
    } else {
      const baseDept = DEPARTMENTS.find((d) => d.id === credential.departmentId);
      if (!baseDept || !baseDept.isActive) {
        const msg = 'Department account is currently deactivated or not found.';
        setError(msg);
        setIsLoading(false);
        return { success: false, errorMessage: msg };
      }
      dept = getStoredDepartmentProfile(baseDept);
    }

    // 4. Create active session with role
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours
    const token = `IAMS-${dept.code}-${isAdminUser ? 'ADM' : `Y${validatedYear}-SEC${cleanSection}`}-${Date.now()
      .toString(36)
      .toUpperCase()}`;

    const newSession: AuthSession = {
      token,
      role: isAdminUser ? 'admin' : 'faculty',
      department: dept,
      username: credential.username,
      year: validatedYear,
      section: cleanSection,
      loginTime: new Date().toISOString(),
      expiresAt,
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch (err) {
      console.warn('Session storage write failed', err);
    }

    // Cloud audit logging
    logAuditEventToCloud(
      credential.username,
      isAdminUser ? 'ADMIN_PORTAL_LOGIN' : 'DEPARTMENT_PORTAL_LOGIN',
      isAdminUser
        ? 'Executive Administrator accessed institutional management portal'
        : `Signed in for ${dept.name} (Year ${validatedYear}, Section ${cleanSection})`
    ).catch(() => {});

    setSession(newSession);
    setIsLoading(false);
    return { success: true, session: newSession };
  };

  const updateDepartmentProfile = (updates: Partial<Department>) => {
    if (!session) return;
    const updatedDept = saveDepartmentProfile(session.department.id, updates);
    if (!updatedDept) return;

    const updatedSession: AuthSession = {
      ...session,
      department: updatedDept,
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    } catch (err) {
      console.warn('Session storage write failed', err);
    }

    setSession(updatedSession);
  };

  const resetDepartmentToDefault = () => {
    if (!session) return;
    const defaultDept = resetDepartmentProfile(session.department.id);
    if (!defaultDept) return;

    const updatedSession: AuthSession = {
      ...session,
      department: defaultDept,
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    } catch (err) {
      console.warn('Session storage write failed', err);
    }

    setSession(updatedSession);
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Session storage remove failed', err);
    }
    setSession(null);
    setError(null);
  };

  const value: AuthContextType = {
    session,
    activeDepartment: session ? session.department : null,
    isAuthenticated: Boolean(session),
    isAdmin: session?.role === 'admin',
    isLoading,
    error,
    login,
    logout,
    clearError,
    updateDepartmentProfile,
    resetDepartmentToDefault,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
