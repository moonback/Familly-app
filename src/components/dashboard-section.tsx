import React from 'react';

interface DashboardSectionProps {
  title: string;
  children?: React.ReactNode;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title, children }) => (
  <section>
    <h2>{title}</h2>
    {children}
  </section>
);

export default DashboardSection;
