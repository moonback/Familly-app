import { SetParentCode } from '@/components/auth/set-parent-code';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SetParentCodePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return null;
  }

  return <SetParentCode />;
} 