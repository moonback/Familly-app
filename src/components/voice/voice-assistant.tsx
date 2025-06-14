import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectIntent, DetectedIntent } from '@/lib/gemini';
import { useVoiceAssistantSettings } from '@/context/voice-assistant-context';
import { toast } from '@/hooks/use-toast';

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

  const speak = (text: string) => {
    console.log('🔊 Synthèse vocale:', text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.onstart = () => console.log('🎤 Début de la synthèse vocale');
    utterance.onend = () => console.log('🎤 Fin de la synthèse vocale');
    utterance.onerror = (error) => console.error('❌ Erreur de synthèse vocale:', error);
    window.speechSynthesis.speak(utterance);
  };

  const handleError = (error: string, message: string) => {
    console.error('❌ Erreur de reconnaissance vocale:', error, message);
    
    if (error === 'no-speech') {
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        toast({
          title: "Je n'ai pas entendu de voix",
          description: "Veuillez parler plus fort ou vérifier votre microphone",
          variant: "destructive"
        });
        // Redémarrer l'écoute après un court délai
        setTimeout(() => {
          if (recognitionRef.current) {
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
      setRetryCount(0); // Réinitialiser le compteur en cas de succès
      
      try {
        const intent = await detectIntent(transcript);
        console.log('🎯 Intention détectée:', intent);
        onIntent(intent);
        
        // Répondre vocalement à l'utilisateur
        if (intent.intent === 'complete_task' && intent.task) {
          speak(`J'ai marqué la tâche "${intent.task}" comme terminée`);
        } else if (intent.intent === 'get_points') {
          speak('Je vais vérifier tes points');
        } else {
          speak("Désolé, je n'ai pas compris ta demande");
        }
      } catch (error) {
        console.error('❌ Erreur lors de la détection d\'intention:', error);
        speak("Désolé, j'ai rencontré une erreur");
      }
    };

    recognitionRef.current = recognition;
    console.log('✅ Reconnaissance vocale initialisée');
  }, [onIntent]);

  const toggle = () => {
    if (!recognitionRef.current) {
      console.error('❌ La reconnaissance vocale n\'est pas initialisée');
      return;
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
