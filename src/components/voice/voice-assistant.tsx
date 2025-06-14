import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectIntent, DetectedIntent } from '@/lib/gemini';
import { useVoiceAssistantSettings } from '@/context/voice-assistant-context';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useParams } from 'react-router-dom';

interface VoiceAssistantProps {
  onIntent: (intent: DetectedIntent) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onstart: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface ConversationContext {
  childId: string | null;
  lastInteraction: Date | null;
  messageHistory: string[];
  childAge?: number;
  pendingTasks?: string[];
  completedTasks?: string[];
  streak: number;
  lastTaskCompletion?: Date;
}

interface Task {
  label: string;
  points_reward: number;
  category: string;
}

interface ChildTask {
  id: string;
  is_completed: boolean;
  due_date: string;
  tasks: Task;
}

export const VoiceAssistant = ({ onIntent }: VoiceAssistantProps) => {
  const { enabled } = useVoiceAssistantSettings();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const { user } = useAuth();
  const { childName } = useParams();
  const [activeChild, setActiveChild] = useState<{ id: string; name: string; points: number } | null>(null);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    childId: null,
    lastInteraction: null,
    messageHistory: [],
    childAge: undefined,
    pendingTasks: [],
    completedTasks: [],
    streak: 0,
    lastTaskCompletion: undefined
  });

  // Charger les informations de l'enfant actif avec plus de détails
  useEffect(() => {
    const loadActiveChild = async () => {
      if (!user || !childName) return;

      try {
        // Charger les données de l'enfant
        const { data: childData } = await supabase
          .from('children')
          .select('*')
          .eq('name', childName)
          .eq('user_id', user.id)
          .single();

        if (childData) {
          console.log('👶 Enfant actif chargé:', childData.name);
          setActiveChild(childData);

          // Charger les tâches de l'enfant pour aujourd'hui
          const today = new Date().toISOString().split('T')[0];
          console.log('📅 Date du jour:', today);
          console.log('🔍 Recherche des tâches pour:', childData.id);

          const { data: tasksData, error: tasksError } = await supabase
            .from('child_tasks')
            .select(`
              id,
              is_completed,
              due_date,
              tasks (
                label,
                points_reward,
                category
              )
            `)
            .eq('child_id', childData.id)
            .eq('is_completed', false)
            .eq('due_date', today) as { data: ChildTask[] | null, error: any };

          if (tasksError) {
            console.error('❌ Erreur lors de la récupération des tâches:', tasksError);
          }

          console.log('📋 Tâches chargées:', tasksData);
          console.log('🔍 Détail des tâches:', tasksData?.map(t => ({
            id: t.id,
            taskName: t.tasks?.label,
            dueDate: t.due_date,
            isCompleted: t.is_completed
          })));

          // Mettre à jour le contexte avec les tâches
          const pendingTasks = tasksData?.map(t => t.tasks?.label).filter(Boolean) || [];
          console.log('📝 Tâches en attente:', pendingTasks);

          setConversationContext(prev => ({
            ...prev,
            childId: childData.id,
            lastInteraction: new Date(),
            messageHistory: [],
            childAge: childData.age,
            pendingTasks: pendingTasks,
            streak: prev.streak,
            lastTaskCompletion: prev.lastTaskCompletion
          }));
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données de l\'enfant actif:', error);
      }
    };

    loadActiveChild();
  }, [user, childName]);

  // Fonction pour calculer le streak
  const calculateStreak = (completedTasks: { completed_at: string }[]): number => {
    if (!completedTasks.length) return 0;
    
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i < completedTasks.length; i++) {
      const currentDate = new Date(completedTasks[i].completed_at);
      const previousDate = new Date(completedTasks[i - 1].completed_at);
      
      currentDate.setHours(0, 0, 0, 0);
      previousDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Fonction pour personnaliser la réponse selon l'âge
  const getAgeAppropriateResponse = (response: string): string => {
    if (!conversationContext.childAge) return response;

    const age = conversationContext.childAge;
    let processedResponse = response;

    if (age < 6) {
      // Simplifier le langage pour les plus jeunes
      processedResponse = processedResponse
        .replace(/peux-tu/g, 'tu peux')
        .replace(/pourrais-tu/g, 'tu peux')
        .replace(/voudrais-tu/g, 'tu veux')
        .replace(/souhaites-tu/g, 'tu veux')
        .replace(/aimerais-tu/g, 'tu veux')
        .replace(/pourquoi ne pas/g, 'tu peux')
        .replace(/n'hésite pas à/g, 'tu peux')
        .replace(/n'hésites pas à/g, 'tu peux');
    } else if (age < 10) {
      // Langage adapté aux enfants de 6-9 ans
      processedResponse = processedResponse
        .replace(/pourrais-tu/g, 'peux-tu')
        .replace(/voudrais-tu/g, 'veux-tu')
        .replace(/souhaites-tu/g, 'veux-tu')
        .replace(/aimerais-tu/g, 'veux-tu');
    }

    return processedResponse;
  };

  // Fonction pour générer des suggestions basées sur les tâches
  const generateTaskSuggestions = (): string => {
    const pendingTasks = conversationContext.pendingTasks || [];
    if (pendingTasks.length === 0) return '';

    const suggestions = [];

    if (pendingTasks.length > 0) {
      suggestions.push(`Tu as ${pendingTasks.length} tâche${pendingTasks.length > 1 ? 's' : ''} à faire : ${pendingTasks.join(', ')}`);
    }

    if (conversationContext.streak > 0) {
      suggestions.push(`Tu as une série de ${conversationContext.streak} jour${conversationContext.streak > 1 ? 's' : ''} consécutifs de tâches terminées !`);
    }

    return suggestions.join('. ') + '.';
  };

  const speak = (text: string) => {
    console.log('🔊 Synthèse vocale:', text);
    
    // Récupérer les réglages vocaux
    const savedSettings = localStorage.getItem('voiceSettings');
    const voiceSettings = savedSettings ? JSON.parse(savedSettings) : {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      isMuted: false,
      isListening: false,
      preset: 'default',
      transitionSound: true
    };

    // Si le mode silencieux est activé, ne pas parler
    if (voiceSettings.isMuted) {
      console.log('🔇 Mode silencieux activé');
      return;
    }

    // Jouer l'effet sonore de transition si activé
    if (voiceSettings.transitionSound) {
      try {
        const transitionSound = new Audio('/sounds/transition.mp3');
        transitionSound.volume = voiceSettings.volume * 0.5;
        transitionSound.play();
      } catch (error) {
        console.log('ℹ️ Effet sonore de transition non disponible');
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configuration de la voix avec les réglages sauvegardés
    utterance.lang = 'fr-FR';
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    // Sélection de la meilleure voix française disponible
    const voices = window.speechSynthesis.getVoices();
    const frenchVoices = voices.filter(voice => voice.lang.includes('fr'));
    if (frenchVoices.length > 0) {
      // Préférer une voix féminine si disponible
      const preferredVoice = frenchVoices.find(voice => voice.name.includes('female')) || frenchVoices[0];
      utterance.voice = preferredVoice;
    }

    // Gestion des événements
    utterance.onstart = () => {
      console.log('🎤 Début de la synthèse vocale');
      setListening(false); // Arrêter l'écoute pendant la synthèse
    };
    
    utterance.onend = () => {
      console.log('🎤 Fin de la synthèse vocale');
      // Jouer l'effet sonore de fin si activé
      if (voiceSettings.transitionSound) {
        try {
          const endSound = new Audio('/sounds/end.mp3');
          endSound.volume = voiceSettings.volume * 0.3;
          endSound.play();
        } catch (error) {
          console.log('ℹ️ Effet sonore de fin non disponible');
        }
      }
      // Reprendre l'écoute si le mode écoute continue est activé
      if (recognitionRef.current && voiceSettings.isListening) {
        recognitionRef.current.start();
      }
    };
    
    utterance.onerror = (error) => {
      console.error('❌ Erreur de synthèse vocale:', error);
      toast({
        title: "Erreur de synthèse vocale",
        description: "Une erreur est survenue lors de la lecture de la réponse.",
        variant: "destructive"
      });
    };

    // Ajouter des pauses naturelles aux points et virgules
    const processedText = text
      .replace(/\./g, '. ')
      .replace(/,/g, ', ')
      .replace(/!/g, '! ')
      .replace(/\?/g, '? ');

    utterance.text = processedText;

    // Arrêter toute synthèse vocale en cours
    window.speechSynthesis.cancel();
    
    // Démarrer la nouvelle synthèse
    window.speechSynthesis.speak(utterance);
  };

  const checkMicrophoneAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      console.log('🎤 Périphériques audio disponibles:', audioDevices);
      return audioDevices.length > 0;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des périphériques:', error);
      return false;
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      console.log('🎤 Demande d\'accès au microphone...');
      
      // Vérifier d'abord si des microphones sont disponibles
      const hasMicrophone = await checkMicrophoneAvailability();
      if (!hasMicrophone) {
        toast({
          title: "Aucun microphone détecté",
          description: "Veuillez connecter un microphone et réessayer",
          variant: "destructive"
        });
        return false;
      }

      // Demander la permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Garder une référence au stream
      streamRef.current = stream;
      console.log('✅ Permission microphone accordée');
      setHasRequestedPermission(true);
      setIsMicrophoneAvailable(true);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permission:', error);
      setIsMicrophoneAvailable(false);
      toast({
        title: "Accès au microphone refusé",
        description: "Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur",
        variant: "destructive"
      });
      return false;
    }
  };

  const stopMicrophone = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleError = (error: string, message: string) => {
    console.error('❌ Erreur de reconnaissance vocale:', error, message);
    
    if (error === 'audio-capture') {
      setIsMicrophoneAvailable(false);
      stopMicrophone();
      
      if (!hasRequestedPermission) {
        requestMicrophonePermission();
      } else {
        toast({
          title: "Problème avec le microphone",
          description: "Veuillez vérifier que votre microphone est bien connecté et autorisé",
          variant: "destructive"
        });
      }
      setListening(false);
    } else if (error === 'no-speech') {
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        toast({
          title: "Je n'ai pas entendu de voix",
          description: "Veuillez parler plus fort ou vérifier votre microphone",
          variant: "destructive"
        });
        setTimeout(() => {
          if (recognitionRef.current && isMicrophoneAvailable) {
            recognitionRef.current.start();
          }
        }, 1000);
      } else {
        setRetryCount(0);
        setListening(false);
        toast({
          title: "Trop de tentatives",
          description: "Je n'ai pas pu entendre votre voix. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    } else {
      setListening(false);
      toast({
        title: "Erreur de reconnaissance vocale",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const getResponse = async (text: string) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error('❌ Clé API Gemini manquante');
        throw new Error('Clé API Gemini manquante');
      }

      // Récupérer le prompt personnalisé
      const systemPrompt = localStorage.getItem('voiceAssistantPrompt') || `Tu es un assistant vocal familial nommé "FamilleIA". Réponds de manière naturelle et conversationnelle en français.`;

      // Remplacer les variables prédéfinies
      const replacedPrompt = await replacePredefinedVariables(systemPrompt);

      // Ajouter le contexte de conversation au prompt
      const conversationHistory = conversationContext.messageHistory
        .map((msg, i) => `Message précédent ${i + 1}: ${msg}`)
        .join('\n');

      // Formater les tâches en attente
      const pendingTasks = conversationContext.pendingTasks || [];
      const tasksList = pendingTasks.length > 0 
        ? `Tâches en attente : ${pendingTasks.join(', ')}`
        : 'Aucune tâche en attente';

      console.log('📋 Tâches à inclure dans le contexte:', pendingTasks);

      // Ajouter des instructions spécifiques pour la personnalisation
      const enhancedPrompt = `${replacedPrompt}

Instructions importantes :
- Tu dois TOUJOURS utiliser le nom "${activeChild?.name || 'l\'enfant'}" dans tes réponses
- Ne dis jamais "l'enfant" ou "toi" sans utiliser le nom
- Ne dis pas "bonjour" à chaque message si la conversation est récente
- Adapte ton langage à l'âge de l'enfant (${conversationContext.childAge || 'inconnu'} ans)
- Sois naturel et conversationnel
- Évite les répétitions
- Fais des suggestions basées sur les tâches en cours
- Encourage les bonnes habitudes et la persévérance

${tasksList}

Exemples de réponses correctes :
- "Bonjour ${activeChild?.name || 'l\'enfant'} ! Voici tes tâches pour aujourd'hui : ${pendingTasks.join(', ')}"
- "${activeChild?.name || 'l\'enfant'}, tu as ${pendingTasks.length} tâches à faire : ${pendingTasks.join(', ')}"
- "Je vois que ${activeChild?.name || 'l\'enfant'} a bien travaillé aujourd'hui !"

${conversationHistory ? `Historique de la conversation:\n${conversationHistory}\n\n` : ''}
${generateTaskSuggestions() ? `Suggestions actuelles :\n${generateTaskSuggestions()}\n\n` : ''}
Utilisateur: ${text}
Assistant:`;

      console.log('🔄 Appel de l\'API Gemini avec le contexte:', {
        pendingTasks,
        childName: activeChild?.name,
        childAge: conversationContext.childAge
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: enhancedPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Réponse API non-OK:', response.status, errorText);
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Réponse API reçue:', data);
      
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        console.error('❌ Pas de texte généré dans la réponse:', data);
        return "Désolé, je n'ai pas pu générer une réponse.";
      }

      // Personnaliser la réponse
      let personalizedResponse = personalizeResponse(generatedText);
      personalizedResponse = getAgeAppropriateResponse(personalizedResponse);

      // Vérifier que le nom de l'enfant est bien utilisé
      if (activeChild && !personalizedResponse.includes(activeChild.name)) {
        personalizedResponse = personalizedResponse.replace(/l'enfant|toi|tu/g, activeChild.name);
      }

      return personalizedResponse;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de réponse:', error);
      return "Désolé, j'ai rencontré une erreur lors de notre conversation.";
    }
  };

  // Fonction pour remplacer les variables prédéfinies
  const replacePredefinedVariables = async (prompt: string): Promise<string> => {
    try {
      if (!user) return prompt;

      // Récupérer les données des enfants
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id);

      // Récupérer les tâches
      const { data: tasksData } = await supabase
        .from('child_tasks')
        .select(`
          *,
          children (
            name
          )
        `)
        .eq('user_id', user.id);

      // Récupérer les récompenses
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user.id);

      // Récupérer les règles
      const { data: rulesData } = await supabase
        .from('rules')
        .select('*')
        .eq('user_id', user.id);

      // Récupérer l'énigme du jour
      const { data: riddleData } = await supabase
        .from('daily_riddles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Récupérer les sanctions
      const { data: sanctionsData } = await supabase
        .from('penalties')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Calculer les points totaux
      const totalPoints = childrenData?.reduce((sum, child) => sum + (child.points || 0), 0) || 0;

      // Formater les tâches
      const tasksInProgress = tasksData?.filter(t => !t.is_completed)
        .map(t => `${t.children.name}: ${t.name}`)
        .join(', ') || 'Aucune tâche en cours';
      
      const tasksCompleted = tasksData?.filter(t => t.is_completed)
        .map(t => `${t.children.name}: ${t.name}`)
        .join(', ') || 'Aucune tâche terminée';

      // Formater les récompenses
      const availableRewards = rewardsData?.filter(r => r.is_available)
        .map(r => r.name)
        .join(', ') || 'Aucune récompense disponible';

      // Formater les sanctions
      const activeSanctions = sanctionsData?.map(s => s.description)
        .join(', ') || 'Aucune sanction active';

      // Remplacer les variables
      let processedPrompt = prompt
        .replace('{POINTS_TOTAUX}', totalPoints.toString())
        .replace('{TACHES_EN_COURS}', tasksInProgress)
        .replace('{TACHES_TERMINEES}', tasksCompleted)
        .replace('{RECOMPENSES_DISPONIBLES}', availableRewards)
        .replace('{ENIGME_DU_JOUR}', riddleData?.[0]?.question || 'Aucune énigme disponible')
        .replace('{SANCTIONS_ACTIVES}', activeSanctions);

      // Remplacer les variables avec paramètres
      processedPrompt = processedPrompt.replace(/{POINTS_ENFANT\((.*?)\)}/g, (_, childName) => {
        const child = childrenData?.find(c => c.name.toLowerCase() === childName.toLowerCase());
        return child ? child.points.toString() : '0';
      });

      processedPrompt = processedPrompt.replace(/{REGLE_SPECIFIQUE\((.*?)\)}/g, (_, ruleName) => {
        const rule = rulesData?.find(r => r.name.toLowerCase() === ruleName.toLowerCase());
        return rule ? rule.description : 'Règle non trouvée';
      });

      // Si {POINTS_ENFANT} est utilisé sans paramètre, utiliser le premier enfant
      if (processedPrompt.includes('{POINTS_ENFANT}')) {
        const firstChild = childrenData?.[0];
        processedPrompt = processedPrompt.replace('{POINTS_ENFANT}', firstChild ? firstChild.points.toString() : '0');
      }

      return processedPrompt;
    } catch (error) {
      console.error('❌ Erreur lors du remplacement des variables:', error);
      return prompt;
    }
  };

  // Fonction pour personnaliser la réponse
  const personalizeResponse = (response: string): string => {
    if (!activeChild) return response;

    // Éviter les répétitions de salutations
    const hasGreeting = /^(bonjour|salut|hello|hi|hey)/i.test(response);
    const timeSinceLastInteraction = conversationContext.lastInteraction 
      ? (new Date().getTime() - new Date(conversationContext.lastInteraction).getTime()) / 1000
      : Infinity;

    // Supprimer les salutations si l'interaction est récente (moins de 5 minutes)
    let processedResponse = response;
    if (hasGreeting && timeSinceLastInteraction < 300) {
      processedResponse = response.replace(/^(bonjour|salut|hello|hi|hey)[,.]?\s*/i, '');
    }

    // S'assurer que le nom de l'enfant est utilisé
    processedResponse = processedResponse
      .replace(/l'enfant/g, activeChild.name)
      .replace(/^toi/g, activeChild.name)
      .replace(/^tu/g, activeChild.name);

    // Personnaliser la réponse avec le nom de l'enfant
    processedResponse = processedResponse
      .replace(/tu as/g, `${activeChild.name} a`)
      .replace(/tu es/g, `${activeChild.name} est`)
      .replace(/tu peux/g, `${activeChild.name} peut`)
      .replace(/tu dois/g, `${activeChild.name} doit`)
      .replace(/tu veux/g, `${activeChild.name} veut`)
      .replace(/tu fais/g, `${activeChild.name} fait`)
      .replace(/tu vas/g, `${activeChild.name} va`)
      .replace(/tu peux/g, `${activeChild.name} peut`)
      .replace(/tu as besoin/g, `${activeChild.name} a besoin`)
      .replace(/tu peux faire/g, `${activeChild.name} peut faire`)
      .replace(/tu dois faire/g, `${activeChild.name} doit faire`)
      .replace(/tu veux faire/g, `${activeChild.name} veut faire`)
      .replace(/tu fais bien/g, `${activeChild.name} fait bien`)
      .replace(/tu vas bien/g, `${activeChild.name} va bien`)
      .replace(/tu peux avoir/g, `${activeChild.name} peut avoir`)
      .replace(/tu dois avoir/g, `${activeChild.name} doit avoir`)
      .replace(/tu veux avoir/g, `${activeChild.name} veut avoir`)
      .replace(/tu fais attention/g, `${activeChild.name} fait attention`)
      .replace(/tu vas faire/g, `${activeChild.name} va faire`)
      .replace(/tu peux aller/g, `${activeChild.name} peut aller`)
      .replace(/tu dois aller/g, `${activeChild.name} doit aller`)
      .replace(/tu veux aller/g, `${activeChild.name} veut aller`)
      .replace(/tu fais partie/g, `${activeChild.name} fait partie`)
      .replace(/tu vas avoir/g, `${activeChild.name} va avoir`)
      .replace(/tu peux être/g, `${activeChild.name} peut être`)
      .replace(/tu dois être/g, `${activeChild.name} doit être`)
      .replace(/tu veux être/g, `${activeChild.name} veut être`)
      .replace(/tu fais confiance/g, `${activeChild.name} fait confiance`)
      .replace(/tu vas être/g, `${activeChild.name} va être`)
      .replace(/tu peux faire confiance/g, `${activeChild.name} peut faire confiance`)
      .replace(/tu dois faire confiance/g, `${activeChild.name} doit faire confiance`)
      .replace(/tu veux faire confiance/g, `${activeChild.name} veut faire confiance`)
      .replace(/tu fais attention à/g, `${activeChild.name} fait attention à`)
      .replace(/tu vas faire attention/g, `${activeChild.name} va faire attention`)
      .replace(/tu peux faire attention/g, `${activeChild.name} peut faire attention`)
      .replace(/tu dois faire attention/g, `${activeChild.name} doit faire attention`)
      .replace(/tu veux faire attention/g, `${activeChild.name} veut faire attention`)
      .replace(/tu fais partie de/g, `${activeChild.name} fait partie de`)
      .replace(/tu vas faire partie/g, `${activeChild.name} va faire partie`)
      .replace(/tu peux faire partie/g, `${activeChild.name} peut faire partie`)
      .replace(/tu dois faire partie/g, `${activeChild.name} doit faire partie`)
      .replace(/tu veux faire partie/g, `${activeChild.name} veut faire partie`)
      .replace(/tu fais confiance à/g, `${activeChild.name} fait confiance à`)
      .replace(/tu vas faire confiance/g, `${activeChild.name} va faire confiance`)
      .replace(/tu peux faire confiance à/g, `${activeChild.name} peut faire confiance à`)
      .replace(/tu dois faire confiance à/g, `${activeChild.name} doit faire confiance à`)
      .replace(/tu veux faire confiance à/g, `${activeChild.name} veut faire confiance à`)
      // Ajouter des remplacements spécifiques pour les noms d'enfants
      .replace(/Johann/g, activeChild.name)
      .replace(/Roxane/g, activeChild.name);

    // Mettre à jour le contexte de conversation
    setConversationContext(prev => ({
      ...prev,
      lastInteraction: new Date(),
      messageHistory: [...prev.messageHistory, processedResponse].slice(-5)
    }));

    return processedResponse;
  };

  useEffect(() => {
    console.log('🔄 Initialisation de la reconnaissance vocale');
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('❌ La reconnaissance vocale n\'est pas supportée par ce navigateur');
      toast({
        title: "Navigateur non supporté",
        description: "Votre navigateur ne supporte pas la reconnaissance vocale",
        variant: "destructive"
      });
      return;
    }
    const recognition = new SpeechRecognition() as SpeechRecognition;
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log('🎤 Début de l\'écoute');
      setListening(true);
      toast({
        title: "Écoute en cours",
        description: "Je vous écoute...",
      });
    };

    recognition.onend = () => {
      console.log('🎤 Fin de l\'écoute');
      setListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      handleError(event.error, event.message);
    };

    recognition.onresult = async (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ');
      console.log('🎤 Texte reconnu:', transcript);
      setRetryCount(0);

      // Obtenir une réponse conversationnelle
      const response = await getResponse(transcript);
      speak(response);
    };

    recognitionRef.current = recognition;
    console.log('✅ Reconnaissance vocale initialisée');

    // Nettoyage lors du démontage du composant
    return () => {
      stopMicrophone();
    };
  }, []);

  const toggle = async () => {
    if (!recognitionRef.current) {
      console.error('❌ La reconnaissance vocale n\'est pas initialisée');
      return;
    }

    if (!hasRequestedPermission || !isMicrophoneAvailable) {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;
    }

    if (listening) {
      console.log('🛑 Arrêt de l\'écoute');
      recognitionRef.current.stop();
      setRetryCount(0);
    } else {
      console.log('▶️ Démarrage de l\'écoute');
      setRetryCount(0);
      recognitionRef.current.start();
    }
  };

  if (!enabled) {
    console.log('🔇 Assistant vocal désactivé');
    return null;
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggle} 
      className="ml-2"
      data-child-name={childName}
    >
      {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};
