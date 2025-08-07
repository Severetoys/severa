'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface FaceIDAuthContextType {
  isAuthenticated: boolean;
  userType: 'vip' | 'member' | null;
  userEmail: string | null;
  login: (userType: 'vip' | 'member', email?: string) => void;
  logout: () => void;
}

const FaceIDAuthContext = createContext<FaceIDAuthContextType | undefined>(undefined);

export function FaceIDAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'vip' | 'member' | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o usuário está autenticado no localStorage
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUserType = localStorage.getItem('userType') as 'vip' | 'member' | null;
    const storedUserEmail = localStorage.getItem('userEmail');
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setUserType(storedUserType);
      setUserEmail(storedUserEmail);
    }
  }, []);

  const login = (type: 'vip' | 'member', email?: string) => {
    setIsAuthenticated(true);
    setUserType(type);
    setUserEmail(email || null);
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userType', type);
    if (email) {
      localStorage.setItem('userEmail', email);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setUserEmail(null);
    
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
  };

  return (
    <FaceIDAuthContext.Provider value={{
      isAuthenticated,
      userType,
      userEmail,
      login,
      logout
    }}>
      {children}
    </FaceIDAuthContext.Provider>
  );
}

export function useFaceIDAuth() {
  const context = useContext(FaceIDAuthContext);
  if (context === undefined) {
    throw new Error('useFaceIDAuth must be used within a FaceIDAuthProvider');
  }
  return context;
}
