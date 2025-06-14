import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectIntent, DetectedIntent } from '@/lib/gemini';
import { useVoiceAssistantSettings } from '@/context/voice-assistant-context';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

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

      console.log('🔄 Appel de l\'API Gemini...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${replacedPrompt}

Utilisateur: ${text}
Assistant:`
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

      return generatedText;
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
    <Button variant="outline" size="icon" onClick={toggle} className="ml-2">
      {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};
