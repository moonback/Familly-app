import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { MainNav } from '@/components/layout/main-nav';
import HomePage from '@/pages/index';
import AuthPage from '@/pages/auth';
import DashboardParent from '@/pages/dashboard-parent';
import ChildDashboard from '@/pages/child-dashboard';
import ChildHome from '@/pages/home';
import { motion, AnimatePresence } from 'framer-motion';
import SetParentCodePage from '@/pages/set-parent-code';
import HowItWorksPage from '@/pages/how-it-works';

// Composant de protection des routes pour les utilisateurs connectés
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Composant pour conditionner l'affichage de la navigation
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isChildDashboard = location.pathname.startsWith('/child-dashboard/');
  const isChildHome = location.pathname.startsWith('/child/');
  
  return (
    <>
      {!isChildDashboard && !isChildHome && <MainNav />}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex-grow min-h-screen ${
          isChildDashboard || isChildHome 
            ? 'bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100' 
            : 'bg-gradient-to-br from-gray-50 to-gray-100'
        }`}
      >
        {children}
      </motion.main>
    </>
  );
};

// Composant NotFound
const NotFound = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-600 mb-4">Page non trouvée</p>
      <a href="/" className="text-purple-600 hover:underline">
        Retour à l'accueil
      </a>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Router>
        <AuthProvider>
          <AppLayout>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route 
                  path="/set-parent-code" 
                  element={
                    <ProtectedRoute>
                      <SetParentCodePage />
                    </ProtectedRoute>
                  } 
                />
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
                      <Navigate to="/dashboard/parent" replace state={{ message: "Page non disponible" }} />
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
                <Route 
                  path="/child-dashboard/:childName" 
                  element={
                    <ProtectedRoute>
                      <ChildDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </AppLayout>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
