import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialiser l'API Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

interface GeneratedRiddle {
  question: string;
  answer: string;
  hint: string;
}

interface TaskSuggestion {
  label: string;
  points_reward: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
  age_min: number;
  age_max: number;
  is_daily: boolean;
}

export async function generateRiddle(difficulty: 'facile' | 'moyen' | 'difficile'): Promise<GeneratedRiddle | null> {
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

export async function generateTaskSuggestions(): Promise<TaskSuggestion[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Clé API Gemini manquante');
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  console.log('🤖 Génération des suggestions de tâches...');

  const prompt = `Génère 12 suggestions de tâches pour un système de récompenses familial. 
  Crée exactement 3 tâches pour chaque catégorie : quotidien, scolaire, maison, personnel.
  
  Pour chaque tâche, fournis :
  - Une description claire et motivante
  - Des points de récompense appropriés (entre 5 et 50 points)
  - Une catégorie (quotidien, scolaire, maison, ou personnel)
  - Un âge minimum et maximum appropriés (entre 3 et 18 ans)
  - Si c'est une tâche quotidienne (true) ou ponctuelle (false)
  
  Format de réponse attendu (en JSON) :
  [
    {
      "label": "Description de la tâche",
      "points_reward": 15,
      "category": "quotidien",
      "age_min": 6,
      "age_max": 12,
      "is_daily": true
    }
  ]
  
  Assure-toi que les tâches soient variées, adaptées à différents âges et motivantes pour les enfants.
  IMPORTANT : Réponds uniquement avec le JSON, sans texte supplémentaire.`;

  try {
    console.log('📡 Envoi de la requête à l\'API Gemini...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API Gemini:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 Réponse reçue de l\'API Gemini');
    
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      console.error('❌ Réponse vide de l\'API Gemini');
      throw new Error('Réponse vide de l\'API Gemini');
    }

    console.log('📝 Texte reçu:', text.substring(0, 200) + '...');

    // Extraire le JSON de la réponse
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ Format JSON non trouvé dans la réponse:', text);
      throw new Error('Format de réponse invalide - JSON non trouvé');
    }

    const jsonString = jsonMatch[0];
    console.log('🔍 JSON extrait:', jsonString.substring(0, 200) + '...');

    try {
      const suggestions = JSON.parse(jsonString) as TaskSuggestion[];
      
      // Valider les suggestions
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Aucune suggestion valide dans la réponse');
      }

      // Valider chaque suggestion
      const validSuggestions = suggestions.filter(suggestion => {
        return suggestion.label && 
               typeof suggestion.points_reward === 'number' &&
               ['quotidien', 'scolaire', 'maison', 'personnel'].includes(suggestion.category) &&
               typeof suggestion.age_min === 'number' &&
               typeof suggestion.age_max === 'number' &&
               typeof suggestion.is_daily === 'boolean';
      });

      if (validSuggestions.length === 0) {
        throw new Error('Aucune suggestion valide après validation');
      }

      console.log('✅ Suggestions validées:', validSuggestions.length);
      return validSuggestions;
      
    } catch (parseError) {
      console.error('❌ Erreur lors du parsing JSON:', parseError);
      console.error('❌ JSON problématique:', jsonString);
      throw new Error('Format de réponse invalide - Erreur de parsing JSON');
    }
    
  } catch (error) {
    console.error('❌ Erreur complète lors de la génération des suggestions:', error);
    throw error;
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

interface ChatHistoryEntry {
  role: 'user' | 'model';
  content: string;
}

export async function getChatbotResponse(history: ChatHistoryEntry[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  // Filtrer l'historique pour s'assurer qu'il commence par un message utilisateur
  // et alterner correctement entre user et model
  const validHistory = [];
  for (let i = 0; i < history.length; i++) {
    const message = history[i];
    if (i === 0 && message.role === 'model') {
      // Ignorer le premier message s'il est du modèle
      continue;
    }
    validHistory.push(message);
  }

  // S'assurer qu'il y a au moins un message utilisateur
  if (validHistory.length === 0 || validHistory[0].role !== 'user') {
    throw new Error('L\'historique doit commencer par un message utilisateur');
  }

  // Préparer l'historique pour Gemini (exclure le dernier message utilisateur)
  const chatHistory = validHistory.slice(0, -1).map((m) => ({ 
    role: m.role, 
    parts: [{ text: m.content }] 
  }));

  const chat = model.startChat({
    history: chatHistory
  });

  // Envoyer le dernier message utilisateur
  const userMessage = validHistory[validHistory.length - 1].content;
  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  return response.text();
}
