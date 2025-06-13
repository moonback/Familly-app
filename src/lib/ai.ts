const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;

if (!AI_API_KEY) {
  console.warn('VITE_AI_API_KEY is not defined');
}

interface AIGeneratedRiddle {
  question: string;
  answer: string;
}

export async function generateRiddle(): Promise<AIGeneratedRiddle> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/google/gemini-pro-2.5-preview:generateContent?key=${AI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Tu es un assistant qui crée des devinettes courtes pour des enfants. Réponds au format "Q: ...\nA: ..."\nGénère une devinette adaptée aux enfants avec la réponse.',
            },
          ],
        },
      ],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
      generationConfig: {
        maxOutputTokens: 60,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate riddle');
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text as string;
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
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/google/gemini-pro-2.5-preview:generateContent?key=${AI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Tu es un assistant qui propose des exemples de tâches adaptées à la vie de famille. Réponds en JSON au format {\"label\":\"...\",\"points_reward\":30,\"is_daily\":true,\"age_min\":3,\"age_max\":12,\"category\":\"maison\"}',
            },
          ],
        },
      ],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
      generationConfig: {
        maxOutputTokens: 100,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate task');
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text as string;
  try {
    const task = JSON.parse(text);
    return task as AIGeneratedTask;
  } catch {
    throw new Error('Invalid AI task format');
  }
}
