import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const difficulty = req.body?.difficulty || 'facile';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

    const prompt = `Génère une devinette ${difficulty} pour un enfant.
    La devinette doit être amusante et éducative.
    Format de réponse attendu (en JSON):
    {
      "question": "La question de la devinette",
      "answer": "La réponse à la devinette juste le mot",
      "hint": "Un indice pour aider l'enfant à trouver la réponse"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const riddle = JSON.parse(jsonMatch[0]);
    res.status(200).json(riddle);
  } catch (error) {
    console.error('Gemini riddle error:', error);
    res.status(500).json({ error: 'Gemini riddle error' });
  }
}
