import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Officer {
  id: string;
  name: string;
  cadre: string;
  psName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentOfficer: Officer | null;
  login: (officerId: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Hardcoded credentials and officer details
const VALID_CREDENTIALS = {
  '2585272': {
    password: 'test@tse',
    officer: {
      id: '2585272',
      name: 'Unknown',
      cadre: 'Police Constable',
      psName: 'Jubilee Hills Traffic PS'
    }
  },
  '2603326': {
    password: 'test@tse',
    officer: {
      id: '2603326',
      name: 'Unknown',
      cadre: 'Police Constable',
      psName: 'Jubilee Hills Traffic PS'
    }
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);

  const login = (officerId: string, password: string): boolean => {
    const credentials = VALID_CREDENTIALS[officerId as keyof typeof VALID_CREDENTIALS];
    
    if (credentials && credentials.password === password) {
      setIsAuthenticated(true);
      setCurrentOfficer(credentials.officer);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentOfficer(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    currentOfficer,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
