/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoginScreen } from './components/LoginScreen';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { AdminDashboard } from './components/AdminDashboard';

type AppScreen = 'welcome' | 'login';

function AppContent() {
  const { isAuthenticated, session } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');

  // If user is authenticated, route strictly by role (admin portal vs department console)
  if (isAuthenticated) {
    if (session?.role === 'admin') {
      return <AdminDashboard />;
    }
    return <DepartmentDashboard />;
  }

  return (
    <>
      {currentScreen === 'welcome' && (
        <WelcomeScreen onProceed={() => setCurrentScreen('login')} />
      )}

      {currentScreen === 'login' && (
        <LoginScreen onBackToWelcome={() => setCurrentScreen('welcome')} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
