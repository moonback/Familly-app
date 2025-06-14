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
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const speak = (text: string) => {
    console.log('🔊 Synthèse vocale:', text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.onstart = () => console.log('🎤 Début de la synthèse vocale');
    utterance.onend = () => console.log('🎤 Fin de la synthèse vocale');
    utterance.onerror = (error) => console.error('❌ Erreur de synthèse vocale:', error);
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

      console.log('🔄 Appel de l\'API Gemini...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}

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
