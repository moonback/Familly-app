import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectIntent, DetectedIntent } from '@/lib/gemini';
import { useVoiceAssistantSettings } from '@/context/voice-assistant-context';

interface VoiceAssistantProps {
  onIntent: (intent: DetectedIntent) => void;
}

export const VoiceAssistant = ({ onIntent }: VoiceAssistantProps) => {
  const { enabled } = useVoiceAssistantSettings();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = async (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ');
      const intent = await detectIntent(transcript);
      onIntent(intent);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, [onIntent]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!enabled) return null;

  return (
    <Button variant="outline" size="icon" onClick={toggle} className="ml-2">
      {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};
