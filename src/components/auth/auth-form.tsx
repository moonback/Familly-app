import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { signIn, signUp } = useAuth();

  // Validation des champs
  const validateForm = () => {
    const errors: typeof validationErrors = {};

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'L\'email est requis';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Format d\'email invalide';
    }

    // Validation mot de passe
    if (!password) {
      errors.password = 'Le mot de passe est requis';
    } else if (password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    // Validation confirmation mot de passe (uniquement pour l'inscription)
    if (isSignUp) {
      if (!confirmPassword) {
        errors.confirmPassword = 'La confirmation du mot de passe est requise';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({
          title: 'Succès',
          description: 'Votre compte a été créé avec succès',
        });
      } else {
        await signIn(email, password);
        toast({
          title: 'Bienvenue !',
          description: 'Vous êtes connecté avec succès',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : isSignUp 
          ? 'Erreur lors de la création du compte'
          : 'Erreur lors de la connexion';
      
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setValidationErrors({});
    setConfirmPassword('');
    setPassword('');
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border-2 border-purple-100 shadow-xl">
        <CardHeader className="space-y-2">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isSignUp ? 'Créer un compte' : 'Bienvenue'}
            </CardTitle>
          </motion.div>
          <CardDescription className="text-center text-gray-600">
            {isSignUp 
              ? 'Rejoignez Family App et commencez à organiser votre vie de famille'
              : 'Connectez-vous pour accéder à votre espace famille'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive" role="alert" className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-500" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  className={`pl-10 bg-white/50 backdrop-blur-sm border-2 ${
                    validationErrors.email ? 'border-red-500' : 'border-purple-100'
                  } focus:border-purple-500 focus:ring-purple-500`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  aria-invalid={!!validationErrors.email}
                  aria-describedby={validationErrors.email ? 'email-error' : undefined}
                  required
                />
              </div>
              {validationErrors.email && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  id="email-error"
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {validationErrors.email}
                </motion.p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-500" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`pl-10 pr-10 bg-white/50 backdrop-blur-sm border-2 ${
                    validationErrors.password ? 'border-red-500' : 'border-purple-100'
                  } focus:border-purple-500 focus:ring-purple-500`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  aria-invalid={!!validationErrors.password}
                  aria-describedby={validationErrors.password ? 'password-error' : undefined}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-purple-500" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4 text-purple-500" aria-hidden="true" />
                  )}
                </Button>
              </div>
              {validationErrors.password && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  id="password-error"
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {validationErrors.password}
                </motion.p>
              )}
              
              {isSignUp && password && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                  role="status"
                  aria-label={`Force du mot de passe: ${strengthLabels[passwordStrength - 1] || 'Aucune'}`}
                >
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-full rounded transition-all duration-300 ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Force: {strengthLabels[passwordStrength - 1] || 'Aucune'}
                  </p>
                </motion.div>
              )}
            </div>

            {isSignUp && (
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-500" aria-hidden="true" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`pl-10 pr-10 bg-white/50 backdrop-blur-sm border-2 ${
                      validationErrors.confirmPassword ? 'border-red-500' : 'border-purple-100'
                    } focus:border-purple-500 focus:ring-purple-500`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (validationErrors.confirmPassword) {
                        setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    aria-invalid={!!validationErrors.confirmPassword}
                    aria-describedby={validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-purple-500" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4 text-purple-500" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {validationErrors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    id="confirm-password-error"
                    className="text-sm text-red-500"
                    role="alert"
                  >
                    {validationErrors.confirmPassword}
                  </motion.p>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {isSignUp ? 'Création...' : 'Connexion...'}
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Créer un compte
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
              <Button 
                variant="link" 
                onClick={toggleAuthMode}
                className="p-0 h-auto font-normal text-purple-600 hover:text-purple-700"
                type="button"
              >
                {isSignUp ? 'Se connecter' : "S'inscrire"}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}