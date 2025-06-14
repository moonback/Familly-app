import { createContext, useContext, useEffect, useState } from 'react';

interface VoiceSettings {
  enabled: boolean;
  customCommands: Record<string, string>;
}

interface VoiceContextValue extends VoiceSettings {
  toggleEnabled: () => void;
  updateCommands: (commands: Record<string, string>) => void;
}

const VoiceAssistantContext = createContext<VoiceContextValue | undefined>(undefined);

export const VoiceAssistantProvider = ({ children }: { children: React.ReactNode }) => {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('voiceEnabled') === 'true';
  });
  const [customCommands, setCustomCommands] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('voiceCommands') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('voiceEnabled', String(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('voiceCommands', JSON.stringify(customCommands));
  }, [customCommands]);

  const toggleEnabled = () => setEnabled((e) => !e);
  const updateCommands = (commands: Record<string, string>) => setCustomCommands(commands);

  return (
    <VoiceAssistantContext.Provider value={{ enabled, customCommands, toggleEnabled, updateCommands }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistantSettings = () => {
  const ctx = useContext(VoiceAssistantContext);
  if (!ctx) throw new Error('useVoiceAssistantSettings must be used within VoiceAssistantProvider');
  return ctx;
};
