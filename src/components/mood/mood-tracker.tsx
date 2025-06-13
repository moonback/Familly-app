import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface MoodTrackerProps {
  childId: string;
}

const MOODS = ['heureux', 'triste', 'en colère', 'fatigué', 'excité'];

export function MoodTracker({ childId }: MoodTrackerProps) {
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const logMood = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('moods').insert({
        child_id: childId,
        mood: selected,
        date: today,
      });
      if (error) throw error;
      toast({ title: 'Humeur enregistrée' });
      setSelected('');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer l'humeur",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Humeur du jour</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Button
              key={m}
              variant={selected === m ? 'default' : 'outline'}
              onClick={() => setSelected(m)}
            >
              {m}
            </Button>
          ))}
        </div>
        <Button onClick={logMood} disabled={loading || !selected}>
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
