import { render, screen } from '@testing-library/react';
import DashboardSection from '@/components/dashboard-section';
import { StatCard } from '@/pages/dashboard-parent';

import { Users } from 'lucide-react';

describe('DashboardSection', () => {
  it('renders its title', () => {
    render(
      <DashboardSection title="Test Section">
        <p>Content</p>
      </DashboardSection>
    );
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });
});

describe('StatCard', () => {
  it('renders value and title', () => {
    render(
      <StatCard
        title="Points"
        value={42}
        icon={<Users data-testid="icon" />}
        color="from-red-500 to-pink-500"
        isLoading={false}
      />
    );
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
