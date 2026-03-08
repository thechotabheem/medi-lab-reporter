import { createContext, useContext, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light';
  resolvedTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light';
  storageKey?: string;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', resolvedTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}
