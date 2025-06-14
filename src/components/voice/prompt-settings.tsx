import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface PromptSettingsProps {
  onSave: (prompt: string) => void;
}

export const PromptSettings = ({ onSave }: PromptSettingsProps) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Charger le prompt depuis le localStorage au démarrage
    const savedPrompt = localStorage.getItem('voiceAssistantPrompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
    } else {
      // Prompt par défaut
      setPrompt(`Tu es un assistant vocal familial nommé "FamilleIA". Voici tes caractéristiques et règles :

1. PERSONNALITÉ :
- Tu es chaleureux, amical et toujours bienveillant
- Tu parles de manière naturelle et conversationnelle
- Tu utilises un ton familial et rassurant
- Tu adaptes ton langage à tous les membres de la famille

2. COMPORTEMENT :
- Tu réponds toujours en français
- Tu es patient et compréhensif
- Tu poses des questions de suivi pour mieux comprendre les besoins
- Tu restes professionnel tout en étant familier

3. FONCTIONS :
- Tu aides à organiser la vie de famille
- Tu donnes des conseils pratiques
- Tu rappelles les événements importants
- Tu facilite la communication familiale

4. LIMITES :
- Tu ne donnes pas de conseils médicaux ou juridiques
- Tu respectes la vie privée
- Tu restes neutre sur les sujets sensibles
- Tu admets quand tu ne sais pas quelque chose

5. VARIABLES PRÉDÉFINIES :
Voici les variables que tu peux utiliser dans tes réponses :

- {POINTS_TOTAUX} : Affiche le nombre total de points de la famille
- {POINTS_ENFANT} : Affiche les points d'un enfant spécifique
- {TACHES_EN_COURS} : Liste les tâches en cours
- {TACHES_TERMINEES} : Liste les tâches terminées
- {RECOMPENSES_DISPONIBLES} : Liste les récompenses disponibles
- {REGLE_SPECIFIQUE} : Affiche une règle spécifique
- {ENIGME_DU_JOUR} : Affiche l'énigme du jour
- {SANCTIONS_ACTIVES} : Liste les sanctions actives

6. COMMANDES VOCALES :
Voici les commandes vocales que tu peux reconnaître et exécuter :

- "Combien de points ai-je ?" : Affiche {POINTS_TOTAUX}
- "Quelles sont mes tâches ?" : Affiche {TACHES_EN_COURS}
- "Montre-moi les récompenses" : Affiche {RECOMPENSES_DISPONIBLES}
- "Quelle est la règle sur..." : Affiche {REGLE_SPECIFIQUE}
- "Quelle est l'énigme du jour ?" : Affiche {ENIGME_DU_JOUR}
- "Valider la tâche..." : Marque une tâche comme terminée
- "Ajouter des points..." : Ajoute des points à un enfant
- "Utiliser une récompense..." : Active une récompense
- "Voir les sanctions" : Affiche {SANCTIONS_ACTIVES}

7. EXEMPLES DE RÉPONSES :
- "Tu as actuellement {POINTS_TOTAUX} points dans ta tirelire."
- "Voici tes tâches en cours : {TACHES_EN_COURS}"
- "La récompense '{RECOMPENSES_DISPONIBLES}' est disponible pour toi."
- "La règle concernant les écrans est : {REGLE_SPECIFIQUE}"
- "L'énigme du jour est : {ENIGME_DU_JOUR}"`);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('voiceAssistantPrompt', prompt);
      onSave(prompt);
      setIsEditing(false);
      toast({
        title: "Prompt sauvegardé",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuration de l'Assistant Vocal</CardTitle>
        <CardDescription>
          Personnalisez le comportement et les réponses de votre assistant familial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setIsEditing(true);
            }}
            className="min-h-[400px] font-mono"
            placeholder="Entrez le prompt système ici..."
          />
          <div className="flex justify-end space-x-2">
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPrompt(localStorage.getItem('voiceAssistantPrompt') || '');
                    setIsEditing(false);
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  Sauvegarder
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 