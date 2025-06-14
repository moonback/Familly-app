import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '../auth-form';

const signInMock = jest.fn();
const signUpMock = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: signInMock,
    signUp: signUpMock,
    signOut: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

describe('AuthForm', () => {
  it('submits login form', async () => {
    render(<AuthForm />);
    const email = screen.getByLabelText(/Email/i);
    const password = screen.getByLabelText(/^Mot de passe$/i);
    await userEvent.type(email, 'test@example.com');
    await userEvent.type(password, 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /Se connecter/i }));
    expect(signInMock).toHaveBeenCalledWith('test@example.com', 'Password1!');
  });

  it('toggles to sign up and submits', async () => {
    render(<AuthForm />);
    await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }));
    const email = screen.getByLabelText(/Email/i);
    const password = screen.getByLabelText(/^Mot de passe$/i);
    const confirm = screen.getByLabelText(/Confirmer le mot de passe/i);
    await userEvent.type(email, 'user@example.com');
    await userEvent.type(password, 'Password1!');
    await userEvent.type(confirm, 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /Créer un compte/i }));
    expect(signUpMock).toHaveBeenCalledWith('user@example.com', 'Password1!');
  });
});
