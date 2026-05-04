import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AuthContext = createContext();

function readSession() {
  return {
    model: pb.authStore.model,
    valid: pb.authStore.isValid,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(readSession());
    setIsLoading(false);

    const unsubscribe = pb.authStore.onChange(() => {
      setSession(readSession());
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password, {
      $autoCancel: false,
    });
    setSession(readSession());
    return authData;
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setSession(readSession());
  }, []);

  const value = useMemo(
    () => ({
      currentUser: session.model,
      login,
      logout,
      isAuthenticated: session.valid,
      isAdmin: session.model?.role === 'admin',
      isEditor: session.model?.role === 'editor',
    }),
    [session]
  );

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
