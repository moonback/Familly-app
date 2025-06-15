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
import { motion, AnimatePresence } from 'framer-motion';
import SetParentCodePage from '@/pages/set-parent-code';

// Composant de protection des routes pour les utilisateurs connectés
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Composant de protection des routes pour les utilisateurs non connectés
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard/parent" replace />;
  }
  return <>{children}</>;
};

// Composant pour la page 404
const NotFound = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50"
  >
    <motion.h1 
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
    >
      404
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-xl mb-8 text-gray-600"
    >
      Page non trouvée
    </motion.p>
    <Navigate to="/" replace />
  </motion.div>
);

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Router>
        <AuthProvider>
          <MainNav />
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-grow bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
          >
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<HomePage />} />
                
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
                      <DashboardChild />
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
            </AnimatePresence>
          </motion.main>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
