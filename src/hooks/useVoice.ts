import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseVoiceProps {
  chatbotName: string;
  onCommand: (command: string) => void;
  onListenToggle?: (isListening: boolean) => void;
}

export const useVoice = ({ chatbotName, onCommand, onListenToggle }: UseVoiceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [keywordDetected, setKeywordDetected] = useState(false);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(true);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // --- Speech Synthesis (Text-to-Speech) ---
  const speak = useCallback((text: string) => {
    if (!voiceOutputEnabled || !text) return;

    speechSynthesis.cancel();

    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/<[^>]*>/g, ' ')
      .replace(/(\r\n|\n|\r)/gm, " ")
      .replace(/emoji/gi, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [voiceOutputEnabled]);
  
  const stopSpeaking = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // --- Speech Recognition (Speech-to-Text) ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupportsSpeech(false);
      console.warn("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    let silenceTimeout: NodeJS.Timeout;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      const keyword = chatbotName.toLowerCase();

      if (keywordDetected) {
        onCommand(transcript);
        setKeywordDetected(false);
        return;
      }
      
      if (transcript.includes(keyword)) {
        const command = transcript.split(keyword)[1]?.trim();
        stopSpeaking(); // Stop speaking if keyword is detected
        
        if (command) {
          onCommand(command);
        } else {
          setKeywordDetected(true);
          clearTimeout(silenceTimeout);
          silenceTimeout = setTimeout(() => setKeywordDetected(false), 4000); // 4s to give the command
        }
      }
    };

    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => recognitionRef.current?.start(), 100);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error("Erreur de reconnaissance vocale:", event.error);
      if (event.error === 'not-allowed') {
         toast({
          title: 'Microphone bloqué',
          description: "Vous devez autoriser l'accès au microphone dans les paramètres de votre navigateur.",
          variant: 'destructive',
        });
        setIsListening(false);
        onListenToggle?.(false);
      } else if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
        setIsListening(false);
        onListenToggle?.(false);
      }
    };

    return () => {
      recognition.stop();
      speechSynthesis.cancel();
      clearTimeout(silenceTimeout);
    };
  }, [chatbotName, isListening, keywordDetected, onCommand, onListenToggle]);

  const toggleListening = useCallback(() => {
    setIsListening(prev => {
      const nextState = !prev;
      if (nextState) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          console.error("Erreur au démarrage de la reconnaissance :", e);
          return false;
        }
      } else {
        recognitionRef.current?.stop();
        setKeywordDetected(false);
      }
      onListenToggle?.(nextState);
      return nextState;
    });
  }, [onListenToggle]);
  
  const toggleVoiceOutput = useCallback(() => {
    setVoiceOutputEnabled(prev => {
      if (prev) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return { 
    isListening, 
    isSpeaking, 
    voiceOutputEnabled, 
    keywordDetected, 
    browserSupportsSpeech,
    toggleListening, 
    toggleVoiceOutput, 
    speak,
    stopSpeaking,
    resetKeyword: () => setKeywordDetected(false)
  };
}; 