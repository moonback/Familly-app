export async function generateSuggestions(type: 'task' | 'rule' | 'reward'): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const prompts: Record<'task' | 'rule' | 'reward', string> = {
    task: "Propose cinq exemples de tâches adaptées à un tableau familial. Donne uniquement la liste, une suggestion par ligne.pour 2 enfant de 8 et 13 ans",
    rule: "Propose cinq exemples de règles de comportement pour des enfants. Donne uniquement la liste, une suggestion par ligne.pour 2 enfant de 8 et 13 ans",
    reward: "Propose cinq exemples de récompenses pour un système de points familial. Donne uniquement la liste, une suggestion par ligne.pour 2 enfant de 8 et 13 ans"
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompts[type] }] }] })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return text
    .split('\n')
    .map((s) => s.replace(/^[-\d.\)\s]+/, '').trim())
    .filter(Boolean);
}
