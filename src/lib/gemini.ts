import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

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

// Interface pour les données de la base de données
interface FamilyData {
  children: any[];
  tasks: any[];
  rules: any[];
  rewards: any[];
  childTasks: any[];
  childRulesViolations: any[];
  childRewardsClaimed: any[];
  riddles: any[];
  dailyRiddles: any[];
  pointsHistory: any[];
  shopItems: any[];
  purchases: any[];
  piggyBankTransactions: any[];
}

// Interface pour un enfant
interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar_url: string;
  custom_color: string;
  user_id: string;
  created_at: string;
}

// Fonction pour récupérer toutes les données de la famille
export async function getFamilyData(userId: string): Promise<FamilyData> {
  try {
    // Récupérer les enfants
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId);

    // Récupérer les tâches
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    // Récupérer les règles
    const { data: rules } = await supabase
      .from('rules')
      .select('*')
      .eq('user_id', userId);

    // Récupérer les récompenses
    const { data: rewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId);

    // Récupérer les devinettes
    const { data: riddles } = await supabase
      .from('riddles')
      .select('*')
      .eq('user_id', userId);

    // Récupérer les articles de la boutique
    const { data: shopItems } = await supabase
      .from('shop_items')
      .select('*')
      .eq('user_id', userId);

    // Récupérer les données liées aux enfants
    const childIds = children?.map(child => child.id) || [];
    
    let childTasks: any[] = [];
    let childRulesViolations: any[] = [];
    let childRewardsClaimed: any[] = [];
    let dailyRiddles: any[] = [];
    let pointsHistory: any[] = [];
    let purchases: any[] = [];
    let piggyBankTransactions: any[] = [];

    if (childIds.length > 0) {
      // Récupérer les tâches des enfants
      const { data: childTasksData } = await supabase
        .from('child_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .in('child_id', childIds);

      // Récupérer les violations de règles
      const { data: violationsData } = await supabase
        .from('child_rules_violations')
        .select(`
          *,
          rule:rules(*)
        `)
        .in('child_id', childIds);

      // Récupérer les récompenses réclamées
      const { data: claimedData } = await supabase
        .from('child_rewards_claimed')
        .select(`
          *,
          reward:rewards(*)
        `)
        .in('child_id', childIds);

      // Récupérer les devinettes quotidiennes
      const { data: dailyRiddlesData } = await supabase
        .from('daily_riddles')
        .select(`
          *,
          riddle:riddles(*)
        `)
        .in('child_id', childIds);

      // Récupérer l'historique des points
      const { data: pointsHistoryData } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', userId);

      // Récupérer les achats
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select(`
          *,
          item:shop_items(*)
        `)
        .in('child_id', childIds);

      // Récupérer les transactions de la tirelire
      const { data: piggyData } = await supabase
        .from('piggy_bank_transactions')
        .select('*')
        .in('child_id', childIds);

      childTasks = childTasksData || [];
      childRulesViolations = violationsData || [];
      childRewardsClaimed = claimedData || [];
      dailyRiddles = dailyRiddlesData || [];
      pointsHistory = pointsHistoryData || [];
      purchases = purchasesData || [];
      piggyBankTransactions = piggyData || [];
    }

    return {
      children: children || [],
      tasks: tasks || [],
      rules: rules || [],
      rewards: rewards || [],
      childTasks,
      childRulesViolations,
      childRewardsClaimed,
      riddles: riddles || [],
      dailyRiddles,
      pointsHistory,
      shopItems: shopItems || [],
      purchases,
      piggyBankTransactions
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données familiales:', error);
    return {
      children: [],
      tasks: [],
      rules: [],
      rewards: [],
      childTasks: [],
      childRulesViolations: [],
      childRewardsClaimed: [],
      riddles: [],
      dailyRiddles: [],
      pointsHistory: [],
      shopItems: [],
      purchases: [],
      piggyBankTransactions: []
    };
  }
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

export async function getChatbotResponse(history: ChatHistoryEntry[], userId?: string, childName?: string): Promise<string> {
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

  // Récupérer les données de la famille si un userId est fourni
  let familyDataContext = '';
  let currentChildData: Child | null = null;
  
  if (userId) {
    try {
      const familyData = await getFamilyData(userId);
      
      // Identifier l'enfant actuel si un nom est fourni
      if (childName) {
        currentChildData = familyData.children.find((child: Child) => 
          child.name.toLowerCase() === childName.toLowerCase()
        ) || null;
      }
      
      // Créer un contexte détaillé avec toutes les données
      familyDataContext = `
=== DONNÉES DE LA FAMILLE ===

ENFANTS (${familyData.children.length}):
${familyData.children.map(child => 
  `- ${child.name} (${child.age} ans): ${child.points} points, couleur: ${child.custom_color || 'défaut'}`
).join('\n')}

${currentChildData ? `
=== ENFANT ACTUEL ===
Nom: ${currentChildData.name}
Âge: ${currentChildData.age} ans
Points actuels: ${currentChildData.points}
Couleur: ${currentChildData.custom_color || 'défaut'}

TÂCHES DE ${currentChildData.name.toUpperCase()} (${familyData.childTasks.filter(ct => ct.child_id === currentChildData?.id).length}):
${familyData.childTasks
  .filter(ct => ct.child_id === currentChildData?.id)
  .map(ct => 
    `- ${ct.task?.label}: ${ct.is_completed ? '✅ Terminée' : '⏳ En cours'} (échéance: ${ct.due_date}, ${ct.task?.points_reward} points)`
  ).join('\n')}

VIOLATIONS DE RÈGLES DE ${currentChildData.name.toUpperCase()} (${familyData.childRulesViolations.filter(v => v.child_id === currentChildData?.id).length}):
${familyData.childRulesViolations
  .filter(v => v.child_id === currentChildData?.id)
  .map(violation => 
    `- ${violation.rule?.label} le ${violation.violated_at}`
  ).join('\n')}

RÉCOMPENSES RÉCLAMÉES PAR ${currentChildData.name.toUpperCase()} (${familyData.childRewardsClaimed.filter(cr => cr.child_id === currentChildData?.id).length}):
${familyData.childRewardsClaimed
  .filter(cr => cr.child_id === currentChildData?.id)
  .map(claimed => 
    `- ${claimed.reward?.label} le ${claimed.claimed_at}`
  ).join('\n')}

DEvinettes de ${currentChildData.name.toUpperCase()} (${familyData.dailyRiddles.filter(dr => dr.child_id === currentChildData?.id).length}):
${familyData.dailyRiddles
  .filter(dr => dr.child_id === currentChildData?.id)
  .map(dr => 
    `- ${dr.riddle?.question}: ${dr.is_solved ? '✅ Résolue' : '❓ Non résolue'}`
  ).join('\n')}

ACHATS DE ${currentChildData.name.toUpperCase()} (${familyData.purchases.filter(p => p.child_id === currentChildData?.id).length}):
${familyData.purchases
  .filter(p => p.child_id === currentChildData?.id)
  .map(purchase => 
    `- ${purchase.item?.name} le ${purchase.purchased_at}`
  ).join('\n')}

TRANSACTIONS TIRELIRE DE ${currentChildData.name.toUpperCase()} (${familyData.piggyBankTransactions.filter(tx => tx.child_id === currentChildData?.id).length}):
${familyData.piggyBankTransactions
  .filter(tx => tx.child_id === currentChildData?.id)
  .map(tx => 
    `- ${tx.type === 'savings' ? '+' : '-'}${tx.points} points (${tx.type}) le ${tx.created_at}`
  ).join('\n')}
` : ''}

TÂCHES DISPONIBLES (${familyData.tasks.length}):
${familyData.tasks.map(task => 
  `- ${task.label} (${task.points_reward} points, ${task.category}, ${task.is_daily ? 'quotidienne' : 'ponctuelle'})`
).join('\n')}

RÈGLES (${familyData.rules.length}):
${familyData.rules.map(rule => 
  `- ${rule.label} (${rule.points_penalty} points de pénalité)`
).join('\n')}

RÉCOMPENSES (${familyData.rewards.length}):
${familyData.rewards.map(reward => 
  `- ${reward.label} (${reward.cost} points)`
).join('\n')}

TÂCHES DES ENFANTS (${familyData.childTasks.length}):
${familyData.childTasks.map(ct => 
  `- ${ct.task?.label} pour ${familyData.children.find(c => c.id === ct.child_id)?.name}: ${ct.is_completed ? '✅ Terminée' : '⏳ En cours'} (échéance: ${ct.due_date})`
).join('\n')}

VIOLATIONS DE RÈGLES (${familyData.childRulesViolations.length}):
${familyData.childRulesViolations.map(violation => 
  `- ${violation.rule?.label} par ${familyData.children.find(c => c.id === violation.child_id)?.name} le ${violation.violated_at}`
).join('\n')}

RÉCOMPENSES RÉCLAMÉES (${familyData.childRewardsClaimed.length}):
${familyData.childRewardsClaimed.map(claimed => 
  `- ${claimed.reward?.label} par ${familyData.children.find(c => c.id === claimed.child_id)?.name} le ${claimed.claimed_at}`
).join('\n')}

DEVINETTES (${familyData.riddles.length}):
${familyData.riddles.map(riddle => 
  `- ${riddle.question} (${riddle.points} points)`
).join('\n')}

DEVINETTES QUOTIDIENNES (${familyData.dailyRiddles.length}):
${familyData.dailyRiddles.map(dr => 
  `- ${dr.riddle?.question} pour ${familyData.children.find(c => c.id === dr.child_id)?.name}: ${dr.is_solved ? '✅ Résolue' : '❓ Non résolue'}`
).join('\n')}

HISTORIQUE DES POINTS (${familyData.pointsHistory.length}):
${familyData.pointsHistory.slice(-10).map(ph => 
  `- ${familyData.children.find(c => c.id === ph.child_id)?.name}: ${ph.points > 0 ? '+' : ''}${ph.points} points - ${ph.reason}`
).join('\n')}

ARTICLES DE LA BOUTIQUE (${familyData.shopItems.length}):
${familyData.shopItems.map(item => 
  `- ${item.name} (${item.price} points)`
).join('\n')}

ACHATS (${familyData.purchases.length}):
${familyData.purchases.map(purchase => 
  `- ${purchase.item?.name} acheté par ${familyData.children.find(c => c.id === purchase.child_id)?.name} le ${purchase.purchased_at}`
).join('\n')}

TRANSACTIONS TIRELIRE (${familyData.piggyBankTransactions.length}):
${familyData.piggyBankTransactions.map(tx => 
  `- ${familyData.children.find(c => c.id === tx.child_id)?.name}: ${tx.type === 'savings' ? '+' : '-'}${tx.points} points (${tx.type})`
).join('\n')}

=== FIN DES DONNÉES ===
`;
    } catch (error) {
      console.error('Erreur lors de la récupération des données familiales:', error);
      familyDataContext = 'Impossible de récupérer les données de la famille.';
    }
  }

  // Créer le prompt système avec les données de la famille
  const systemPrompt = `Tu es un assistant familial intelligent pour une application de gestion de récompenses pour enfants. 

${currentChildData ? `Tu parles actuellement avec ${currentChildData.name} (${currentChildData.age} ans) qui a ${currentChildData.points} points.` : ''}

Tu as accès à toutes les données de la famille et tu peux aider les enfants et les parents avec :

- Informations sur les points et récompenses
- Statut des missions et tâches
- Historique des achats et de la tirelire
- Conseils sur la gestion des points
- Explications des règles et récompenses
- Suggestions d'activités

Réponds toujours en français de manière amicale et encourageante, adaptée aux enfants.
${currentChildData ? `Adresse-toi directement à ${currentChildData.name} et utilise ses données personnelles pour personnaliser tes réponses.` : ''}

${familyDataContext}

Réponds à la question de l'utilisateur en utilisant ces informations quand c'est pertinent.`;

  // Préparer l'historique pour Gemini (exclure le dernier message utilisateur)
  const chatHistory = validHistory.slice(0, -1).map((m) => ({ 
    role: m.role, 
    parts: [{ text: m.content }] 
  }));

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  });

  // Envoyer le message système suivi du dernier message utilisateur
  const userMessage = validHistory[validHistory.length - 1].content;
  const fullMessage = `${systemPrompt}\n\nQuestion de l'utilisateur: ${userMessage}`;
  
  const result = await chat.sendMessage(fullMessage);
  const response = await result.response;
  return response.text();
}
