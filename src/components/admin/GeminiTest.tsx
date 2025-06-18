import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { generateTaskSuggestions } from '@/lib/gemini';
import { toast } from '@/hooks/use-toast';

export const GeminiTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    suggestions?: any[];
  } | null>(null);

  const testGeminiAPI = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Test de l\'API Gemini...');
      
      // Vérifier la clé API
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setTestResult({
          success: false,
          message: '❌ Clé API Gemini manquante dans le fichier .env'
        });
        return;
      }

      if (apiKey.length < 10) {
        setTestResult({
          success: false,
          message: '❌ Clé API Gemini invalide (trop courte)'
        });
        return;
      }

      // Tester la génération de suggestions
      const suggestions = await generateTaskSuggestions();
      
      if (suggestions && suggestions.length > 0) {
        setTestResult({
          success: true,
          message: `✅ API Gemini fonctionnelle ! ${suggestions.length} suggestions générées`,
          suggestions: suggestions.slice(0, 3) // Afficher seulement les 3 premières
        });
        
        toast({
          title: 'Test réussi',
          description: 'L\'API Gemini fonctionne correctement !',
        });
      } else {
        setTestResult({
          success: false,
          message: '❌ Aucune suggestion générée'
        });
      }

    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
      
      let errorMessage = 'Erreur inconnue';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setTestResult({
        success: false,
        message: `❌ Erreur: ${errorMessage}`
      });

      toast({
        title: 'Test échoué',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test API Gemini
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-3">
            Ce bouton teste la connexion à l'API Gemini et vérifie que la génération de suggestions fonctionne.
          </p>
        </div>

        <Button
          onClick={testGeminiAPI}
          disabled={isTesting}
          className="w-full"
          variant="outline"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Test en cours...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Tester l'API Gemini
            </>
          )}
        </Button>

        {testResult && (
          <div className={`p-3 rounded-lg ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                Résultat du test
              </span>
            </div>
            <p className={`text-sm ${
              testResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResult.message}
            </p>

            {testResult.suggestions && testResult.suggestions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Exemples de suggestions :</p>
                <div className="space-y-2">
                  {testResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                        <span className="text-gray-500">{suggestion.points_reward} pts</span>
                      </div>
                      <p className="text-gray-700">{suggestion.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 Note :</p>
          <p>Si le test échoue, vérifiez que votre clé API Gemini est correctement configurée dans le fichier .env</p>
        </div>
      </CardContent>
    </Card>
  );
}; 