import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainIcon, LightbulbIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface Riddle {
  id: string;
  question: string;
  answer: string;
  points: number;
  hint?: string;
}

interface DailyRiddleProps {
  riddle: Riddle | null;
  isSolved: boolean;
  onRiddleSubmit: (answer: string) => void;
  childColor: string;
  childPoints: number;
  onHintPurchase: () => void;
}

export const DailyRiddle = ({ 
  riddle, 
  isSolved, 
  onRiddleSubmit, 
  childColor,
  childPoints,
  onHintPurchase 
}: DailyRiddleProps) => {
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    console.log('DailyRiddle - Props:', { riddle, isSolved, childColor, childPoints });
  }, [riddle, isSolved, childColor, childPoints]);

  const handleSubmit = () => {
    if (riddleAnswer.trim()) {
      onRiddleSubmit(riddleAnswer);
      setRiddleAnswer('');
    } else {
      toast({
        title: "Réponse incomplète",
        description: "Veuillez entrer une réponse",
        variant: "destructive",
      });
    }
  };

  const handleHintClick = () => {
    if (childPoints < 10) {
      toast({
        title: "Points insuffisants",
        description: "Il te faut 10 points pour obtenir un indice",
        variant: "destructive",
      });
      return;
    }

    onHintPurchase();
    setShowHint(true);
  };

  if (!riddle || isSolved) {
    console.log('DailyRiddle - Not rendering because:', { riddle, isSolved });
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <Card className="relative overflow-hidden group">
        <div
          className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,var(--child-color)40,var(--child-color)20)] group-hover:opacity-30 transition-opacity duration-300"
          style={{ '--child-color': childColor } as React.CSSProperties}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSHIweiIvPjwvZz48L3N2Zz4=')] opacity-10 group-hover:opacity-15 transition-opacity duration-300" />
        
        <CardHeader className="relative z-10 p-6 bg-white/50 backdrop-blur-sm">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <BrainIcon className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" style={{ '--child-color': childColor } as React.CSSProperties} />
            Devinette du Jour
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 p-6">
          <div className="space-y-6">
            <div
              className="p-8 rounded-xl border-2 bg-[color:var(--child-color)/0.06] border-[color:var(--child-color)/0.25] shadow-inner"
              style={{ '--child-color': childColor } as React.CSSProperties}
            >
              <p className="text-xl font-medium text-gray-800 mb-6">
                {riddle.question}
              </p>
              
              {showHint && riddle.hint && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg bg-[color:var(--child-color)/0.1] border border-[color:var(--child-color)/0.2]"
                  style={{ '--child-color': childColor } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2 text-[color:var(--child-color)] mb-2">
                    <LightbulbIcon className="h-5 w-5" />
                    <span className="font-medium">Indice</span>
                  </div>
                  <p className="text-gray-700">{riddle.hint}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Votre réponse..."
                  value={riddleAnswer}
                  onChange={(e) => setRiddleAnswer(e.target.value)}
                  className="text-lg p-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 transition-colors duration-200"
                />
                
                <div className="flex gap-2">
                  {!showHint && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleHintClick}
                      className="text-lg px-4 py-3 rounded-lg hover:opacity-80 transition-opacity border-[var(--child-color)] text-[var(--child-color)]"
                      style={{ '--child-color': childColor } as React.CSSProperties}
                    >
                      <LightbulbIcon className="h-5 w-5 mr-2" />
                      Indice (10 pts)
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    className="text-lg px-8 py-3 rounded-lg hover:opacity-80 transition-opacity bg-[var(--child-color)] shadow-md"
                    style={{ '--child-color': childColor } as React.CSSProperties}
                  >
                    Valider
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 