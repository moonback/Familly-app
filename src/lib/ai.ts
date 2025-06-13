const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;

if (!AI_API_KEY) {
  console.warn('VITE_AI_API_KEY is not defined');
}

interface AIGeneratedRiddle {
  question: string;
  answer: string;
}

export async function generateRiddle(): Promise<AIGeneratedRiddle> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Tu es un assistant qui crée des devinettes courtes pour des enfants. Réponds au format "Q: ...\nA: ..."',
        },
        {
          role: 'user',
          content: 'Génère une devinette adaptée aux enfants avec la réponse.',
        },
      ],
      max_tokens: 60,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate riddle');
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content as string;
  const [qLine = '', aLine = ''] = text.split('\n');
  return {
    question: qLine.replace(/^Q:\s*/, '').trim(),
    answer: aLine.replace(/^A:\s*/, '').trim(),
  };
}

interface AIGeneratedTask {
  label: string;
  points_reward: number;
  is_daily: boolean;
  age_min: number;
  age_max: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
}

export async function generateTask(): Promise<AIGeneratedTask> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Tu es un assistant qui propose des exemples de tâches adaptées à la vie de famille. Réponds en JSON.',
        },
        {
          role: 'user',
          content:
            'Génère une tâche au format {"label":"...","points_reward":30,"is_daily":true,"age_min":3,"age_max":12,"category":"maison"}',
        },
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate task');
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content as string;
  try {
    const task = JSON.parse(text);
    return task as AIGeneratedTask;
  } catch {
    throw new Error('Invalid AI task format');
  }
}
