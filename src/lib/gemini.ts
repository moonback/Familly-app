import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialiser l'API Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

interface GeneratedRiddle {
  question: string;
  answer: string;
  hint: string;
}

export async function generateRiddle(difficulty: 'facile' | 'moyen' | 'difficile'): Promise<GeneratedRiddle | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

    const prompt = `Génère une devinette ${difficulty} pour un enfant. 
    La devinette doit être amusante et éducative.
    Format de réponse attendu (en JSON):
    {
      "question": "La question de la devinette",
      "answer": "La réponse à la devinette",
      "hint": "Un indice pour aider l'enfant à trouver la réponse"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extraire le JSON de la réponse
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide');
    }

    const riddle = JSON.parse(jsonMatch[0]) as GeneratedRiddle;
    return riddle;
  } catch (error) {
    console.error('Erreur lors de la génération de la devinette:', error);
    return null;
  }
}

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
