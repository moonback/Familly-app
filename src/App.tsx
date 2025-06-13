import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { MainNav } from '@/components/layout/main-nav';
import HomePage from '@/pages/index';
import AuthPage from '@/pages/auth';
import DashboardParent from '@/pages/dashboard-parent';
import DashboardChild from '@/pages/dashboard-child';
import ChildHome from '@/pages/home';
import LeaderboardPage from '@/pages/leaderboard';

// Composant de protection des routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

// Composant pour la page 404
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-4xl font-bold mb-4">404</h1>
    <p className="text-lg mb-4">Page non trouvée</p>
    <Navigate to="/" replace />
  </div>
);

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <AuthProvider>
          <MainNav />
          <main className="flex-grow bg-gray-200">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route 
                path="/dashboard/parent" 
                element={
                  <ProtectedRoute>
                    <DashboardParent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/child" 
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard/parent" replace state={{ message: "Veuillez sélectionner un enfant" }} />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/dashboard/child/:childName"
                element={
                  <ProtectedRoute>
                    <DashboardChild />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/child/:childName"
                element={
                  <ProtectedRoute>
                    <ChildHome />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
