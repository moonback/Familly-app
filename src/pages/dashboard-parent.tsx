import { DashboardParent } from '@/components/dashboard/DashboardParent';
import { ParentCodeProtection } from '@/components/auth/parent-code-protection';
import { useState } from 'react';

export default function DashboardParentPage() {
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  if (!isCodeVerified) {
    return <ParentCodeProtection onSuccess={() => setIsCodeVerified(true)} />;
  }

  return <DashboardParent />;
}