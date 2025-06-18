import { useState } from 'react';
import { analyzeChildProgress, AnalysisResult } from '@/lib/gemini';
import { toast } from '@/hooks/use-toast';

export function useAiAnalysis(userId: string | undefined) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAnalysis = async (childId: string) => {
    if (!userId) {
      setError('Missing user id');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeChildProgress(childId, userId);
      setAnalysis(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analysis, loading, error, getAnalysis };
}
