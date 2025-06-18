import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { AnalysisResult } from '@/lib/gemini';

interface Props {
  analysis: AnalysisResult;
}

export function ChildAnalysis({ analysis }: Props) {
  return (
    <Card className="bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Analyse IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-line text-gray-800">{analysis.summary}</p>
        {analysis.task_suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Suggestions de tâches</h4>
            <ul className="list-disc pl-5 space-y-1">
              {analysis.task_suggestions.map((t, idx) => (
                <li key={idx}>{t.label} ({t.points_reward} pts)</li>
              ))}
            </ul>
          </div>
        )}
        {analysis.reward_suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Idées de récompenses</h4>
            <ul className="list-disc pl-5 space-y-1">
              {analysis.reward_suggestions.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
