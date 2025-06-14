export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const type = req.body?.type as 'task' | 'rule' | 'reward';
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
    return;
  }

  const prompts: Record<'task' | 'rule' | 'reward', string> = {
    task: 'Propose cinq exemples de tâches adaptées à un tableau familial. Donne uniquement la liste, une suggestion par ligne.pour 2 enfant de 8 et 13 ans',
    rule: 'Propose cinq exemples de règles de comportement pour des enfants. Donne uniquement la liste, une suggestion par ligne.pour 2 enfant de 8 et 13 ans',
    reward: 'Propose cinq exemples de récompenses pour un système de points familial. Donne uniquement la liste, une suggestion par ligne.pour 2 enfant de 8 et 13 ans'
  };

  try {
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

    const suggestions = text
      .split('\n')
      .map((s: string) => s.replace(/^[-\d.\)\s]+/, '').trim())
      .filter(Boolean);

    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Gemini suggestions error:', error);
    res.status(500).json({ error: 'Gemini suggestions error' });
  }
}
