import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { MainNav } from '@/components/layout/main-nav';
import HomePage from '@/pages/index';
import AuthPage from '@/pages/auth';
import DashboardParent from '@/pages/dashboard-parent';
import DashboardChild from '@/pages/dashboard-child';
import ChildHome from '@/pages/home';
import './App.css';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <AuthProvider>
          <MainNav />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard/parent" element={<DashboardParent />} />
              <Route path="/dashboard/child" element={<Navigate to="/dashboard/parent" replace />} />
              <Route path="/dashboard/child/:childId" element={<DashboardChild />} />
              <Route path="/child/:childId" element={<ChildHome />} />
              {/* Ajoutez d'autres routes ici si nécessaire */}
            </Routes>
          </main>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
