import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BrainIcon } from 'lucide-react';
import { useState } from 'react';

interface Riddle {
  id: string;
  question: string;
  answer: string;
  points: number;
}

interface DailyRiddleProps {
  riddle: Riddle | null;
  isSolved: boolean;
  onRiddleSubmit: (answer: string) => void;
  childColor: string;
}

export const DailyRiddle = ({ riddle, isSolved, onRiddleSubmit, childColor }: DailyRiddleProps) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onRiddleSubmit(answer);
      setAnswer('');
    }
  };

  if (!riddle || isSolved) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <Card className="bg-white/90 backdrop-blur-md border-2 border-[var(--child-color)] shadow-xl transform hover:scale-[1.01] transition-transform duration-300 group relative z-10">
        <div
          className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,var(--child-color)40,var(--child-color)20)] group-hover:opacity-30 transition-opacity duration-300"
          style={{ '--child-color': childColor } as React.CSSProperties}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSDIweiIvPjwvZz48L3N2Zz4=')] opacity-10 group-hover:opacity-15 transition-opacity duration-300" />
        
        <CardHeader className="relative z-10 p-6 bg-white/50 backdrop-blur-sm">
          <CardTitle className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BrainIcon className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" style={{ '--child-color': childColor } as React.CSSProperties} />
            Devinette du Jour
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="p-8 rounded-xl border-2 bg-[color:var(--child-color)/0.06] border-[color:var(--child-color)/0.25] shadow-inner"
              style={{ '--child-color': childColor } as React.CSSProperties}
            >
              <p className="text-xl font-medium text-gray-800 mb-6">
                {riddle.question}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Ta réponse..."  
                  className="flex-1 text-lg p-4 rounded-lg border-2 focus:ring-2 border-[var(--child-color)] focus:ring-[var(--child-color)] shadow-sm"
                  style={{ '--child-color': childColor } as React.CSSProperties}
                />
                <Button
                  type="submit"
                  className="text-lg px-8 py-3 rounded-lg hover:opacity-80 transition-opacity bg-[var(--child-color)] shadow-md"
                  style={{ '--child-color': childColor } as React.CSSProperties}
                >
                  Valider
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 