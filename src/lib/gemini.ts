const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface GeneratedRiddle {
  question: string;
  answer: string;
  hint: string;
}

export async function generateRiddle(difficulty: 'facile' | 'moyen' | 'difficile'): Promise<GeneratedRiddle | null> {
  try {
    const response = await fetch(`${API_BASE}/api/riddle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty })
    });

    if (!response.ok) {
      throw new Error(`Gemini proxy error: ${response.status}`);
    }

    return (await response.json()) as GeneratedRiddle;
  } catch (error) {
    console.error('Erreur lors de la génération de la devinette:', error);
    return null;
  }
}

export async function generateSuggestions(type: 'task' | 'rule' | 'reward'): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });

  if (!response.ok) {
    throw new Error(`Gemini proxy error: ${response.status}`);
  }

  return (await response.json()) as string[];
}
