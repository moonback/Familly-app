import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainIcon } from 'lucide-react';
import { Riddle } from '@/types';

interface DailyRiddleProps {
  riddle: Riddle | null;
  solved: boolean;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  showSuccess: boolean;
}

export function DailyRiddle({ riddle, solved, answer, onAnswerChange, onSubmit, showSuccess }: DailyRiddleProps) {
  if (!riddle || solved) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
      <Card className="bg-white/90 backdrop-blur-md border-2 border-[var(--child-color)] shadow-xl transform hover:scale-[1.01] transition-transform duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BrainIcon className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" />
            Devinette du Jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="p-8 rounded-xl border-2 bg-[color:var(--child-color)/0.06] border-[color:var(--child-color)/0.25]">
              <p className="text-xl font-medium text-gray-800 mb-6">{riddle.question}</p>
              <div className="flex gap-4">
                <Input
                  type="text"
                  value={answer}
                  onChange={e => onAnswerChange(e.target.value)}
                  placeholder="Ta réponse..."
                  className="flex-1 text-lg p-4 rounded-lg border-2 focus:ring-2 border-[var(--child-color)] focus:ring-[var(--child-color)]"
                />
                <Button type="submit" className="text-lg px-8 hover:opacity-80 transition-opacity bg-[var(--child-color)]">
                  Valider
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl border-2 border-green-200">
              <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 1 }} className="text-7xl mb-6 text-center">
                🎉
              </motion.div>
              <h3 className="text-3xl font-bold text-center text-gray-800 mb-3">Bravo !</h3>
              <p className="text-xl text-gray-600 text-center">Tu as gagné {riddle.points} points !</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
