export const validateEmail = (email: string): string | undefined => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return "L'email est requis";
  }
  if (!emailRegex.test(email)) {
    return "Format d'email invalide";
  }
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Le mot de passe est requis';
  }
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
  }
  return undefined;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (!confirmPassword) {
    return 'La confirmation du mot de passe est requise';
  }
  if (password !== confirmPassword) {
    return 'Les mots de passe ne correspondent pas';
  }
  return undefined;
};
