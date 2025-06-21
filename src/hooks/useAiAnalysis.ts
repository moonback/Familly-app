import { useState, useEffect } from 'react';
import { analyzeChildProgress, AnalysisResult } from '@/lib/gemini';
import { toast } from '@/hooks/use-toast';

export function useAiAnalysis(userId: string | undefined) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour générer une clé unique pour le localStorage
  const getStorageKey = (childId: string) => {
    return `ai_analysis_${userId}_${childId}`;
  };

  // Fonction pour vérifier si l'analyse est encore valide (moins de 24h)
  const isAnalysisValid = (timestamp: number) => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
    return (now - timestamp) < twentyFourHours;
  };

  // Fonction pour nettoyer le cache expiré
  const cleanupExpiredCache = () => {
    try {
      const keys = Object.keys(localStorage);
      const analysisKeys = keys.filter(key => key.startsWith('ai_analysis_'));
      
      analysisKeys.forEach(key => {
        try {
          const storedData = localStorage.getItem(key);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (!isAnalysisValid(parsedData.timestamp)) {
              localStorage.removeItem(key);
              console.log(`🗑️ Cache expiré supprimé: ${key}`);
            }
          }
        } catch (error) {
          // En cas d'erreur, supprimer la clé corrompue
          localStorage.removeItem(key);
          console.log(`🗑️ Cache corrompu supprimé: ${key}`);
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage du cache:', error);
    }
  };

  // Nettoyer le cache au démarrage
  useEffect(() => {
    if (userId) {
      cleanupExpiredCache();
    }
  }, [userId]);

  // Fonction pour sauvegarder l'analyse dans le localStorage
  const saveAnalysisToStorage = (childId: string, analysisData: AnalysisResult) => {
    try {
      const storageKey = getStorageKey(childId);
      const dataToSave = {
        analysis: analysisData,
        timestamp: Date.now(),
        childId: childId
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log('✅ Analyse IA sauvegardée dans le localStorage');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'analyse:', error);
    }
  };

  // Fonction pour récupérer l'analyse depuis le localStorage
  const getAnalysisFromStorage = (childId: string): AnalysisResult | null => {
    try {
      const storageKey = getStorageKey(childId);
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Vérifier si l'analyse est encore valide
        if (isAnalysisValid(parsedData.timestamp)) {
          console.log('✅ Analyse IA récupérée depuis le localStorage');
          return parsedData.analysis;
        } else {
          console.log('⏰ Analyse IA expirée, suppression du cache');
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'analyse:', error);
      // En cas d'erreur, supprimer les données corrompues
      const storageKey = getStorageKey(childId);
      localStorage.removeItem(storageKey);
    }
    
    return null;
  };

  // Fonction pour forcer la suppression de l'analyse en cache
  const clearAnalysisCache = (childId: string) => {
    try {
      const storageKey = getStorageKey(childId);
      localStorage.removeItem(storageKey);
      console.log('🗑️ Cache de l\'analyse IA supprimé');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du cache:', error);
    }
  };

  const getAnalysis = async (childId: string, forceRefresh: boolean = false) => {
    if (!userId) {
      setError('Missing user id');
      return null;
    }

    // Si pas de force refresh, essayer de récupérer depuis le cache
    if (!forceRefresh) {
      const cachedAnalysis = getAnalysisFromStorage(childId);
      if (cachedAnalysis) {
        setAnalysis(cachedAnalysis);
        return cachedAnalysis;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeChildProgress(childId, userId);
      
      // Sauvegarder la nouvelle analyse dans le localStorage
      saveAnalysisToStorage(childId, result);
      
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

  // Fonction pour rafraîchir l'analyse (force refresh)
  const refreshAnalysis = async (childId: string) => {
    return await getAnalysis(childId, true);
  };

  return { 
    analysis, 
    loading, 
    error, 
    getAnalysis, 
    refreshAnalysis,
    clearAnalysisCache,
    getAnalysisFromStorage: (childId: string) => getAnalysisFromStorage(childId),
    cleanupExpiredCache
  };
}
