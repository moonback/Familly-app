import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChildrenManager } from '../children-manager';

const fromMock = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({ data: [], error: null }),
  insert: jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({ data: { id: '1', age: null }, error: null })
    }))
  })),
  update: jest.fn(() => ({ eq: jest.fn().mockReturnThis() })),
  single: jest.fn().mockResolvedValue({ data: { id: '1', age: null }, error: null }),
  lte: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock },
}));

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user1' },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

describe('ChildrenManager', () => {
  it('renders and submits new child', async () => {
    render(
      <MemoryRouter>
        <ChildrenManager />
      </MemoryRouter>
    );

    await waitFor(() => expect(fromMock).toHaveBeenCalledWith('children'));

    await userEvent.click(screen.getByRole('button', { name: /Ajouter un enfant/i }));
    await userEvent.type(screen.getByLabelText(/Nom/i), 'Alice');
    await userEvent.click(screen.getByRole('button', { name: /^Ajouter$/i }));

    expect(fromMock).toHaveBeenCalledWith('children');
  });
});
