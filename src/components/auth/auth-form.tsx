import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '@/utils/authValidation';
import { PasswordStrengthIndicator } from './password-strength-indicator';

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

    const emailError = validateEmail(email);
    if (emailError) {
      errors.email = emailError;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }

    if (isSignUp) {
      const confirmError = validateConfirmPassword(password, confirmPassword);
      if (confirmError) {
        errors.confirmPassword = confirmError;
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


  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {isSignUp ? 'Créer un compte' : 'Se connecter'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className={`pl-10 ${validationErrors.email ? 'border-red-500' : ''}`}
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
              <p id="email-error" className="text-sm text-red-500" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`pl-10 pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
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
                  <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </Button>
            </div>
            {validationErrors.password && (
              <p id="password-error" className="text-sm text-red-500" role="alert">
                {validationErrors.password}
              </p>
            )}
            
            {/* Indicateur de force du mot de passe pour l'inscription */}
            {isSignUp && (
              <PasswordStrengthIndicator password={password} />
            )}
          </div>

          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`pl-10 pr-10 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
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
                    <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </Button>
              </div>
              {validationErrors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-red-500" role="alert">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {isSignUp ? 'Création...' : 'Connexion...'}
              </>
            ) : isSignUp ? (
              'Créer un compte'
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {isSignUp ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
          <Button 
            variant="link" 
            onClick={toggleAuthMode}
            className="p-0 h-auto font-normal"
            type="button"
          >
            {isSignUp ? 'Se connecter' : "S'inscrire"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}