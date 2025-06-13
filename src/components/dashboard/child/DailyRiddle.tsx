import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Riddle {
  id: string;
  question: string;
  answer: string;
  hint: string;
  points: number;
  child_id: string;
  created_at: string;
  is_solved: boolean;
}

interface DailyRiddleProps {
  riddle: Riddle;
  onSolve: (riddleId: string, answer: string) => void;
}

export function DailyRiddle({ riddle, onSolve }: DailyRiddleProps) {
  const [showHint, setShowHint] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correct = userAnswer.toLowerCase().trim() === riddle.answer.toLowerCase().trim();
    setIsCorrect(correct);
    if (correct) {
      onSolve(riddle.id, userAnswer);
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.6 }}
      className="lg:col-span-2"
    >
      <Card className="p-6 h-full border-0 shadow-2xl bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Devinette du Jour</h3>
          <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-gray-800">{riddle.points} points</span>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 shadow-md border border-yellow-100"
          >
            <h4 className="text-xl font-semibold text-gray-800 mb-4">{riddle.question}</h4>

            {!riddle.is_solved ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Votre réponse..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                  />
                  {isCorrect === false && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-6 left-0 text-sm text-red-500"
                    >
                      Essayez encore !
                    </motion.p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {showHint ? 'Cacher l\'indice' : 'Voir l\'indice'}
                  </Button>

                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600"
                  >
                    Valider
                  </Button>
                </div>

                {showHint && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-yellow-50 rounded-lg p-4 border border-yellow-200"
                  >
                    <p className="text-sm text-yellow-800">{riddle.hint}</p>
                  </motion.div>
                )}
              </form>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4"
              >
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-lg font-semibold text-gray-800 mb-2">Bravo !</p>
                <p className="text-gray-600">Vous avez trouvé la réponse : {riddle.answer}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
} 