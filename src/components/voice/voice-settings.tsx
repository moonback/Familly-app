import { useState } from 'react';
import { useVoiceAssistantSettings } from '@/context/voice-assistant-context';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export const VoiceSettings = () => {
  const { enabled, toggleEnabled, customCommands, updateCommands } = useVoiceAssistantSettings();
  const [commandsText, setCommandsText] = useState(
    JSON.stringify(customCommands, null, 2)
  );

  const save = () => {
    try {
      updateCommands(JSON.parse(commandsText));
    } catch {
      // ignore parse errors
    }
  };

  return (
    <div className="space-y-4 p-4">
      <label className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={toggleEnabled} />
        <span>Activer l'assistant vocal</span>
      </label>
      <div>
        <p className="text-sm mb-2">Commandes personnalisées (JSON)</p>
        <Textarea
          value={commandsText}
          onChange={(e) => setCommandsText(e.target.value)}
          className="w-full h-32"
        />
        <Button className="mt-2" onClick={save}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
};
