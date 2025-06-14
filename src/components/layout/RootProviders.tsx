import { ReactNode } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/sonner';

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Router>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
