import { supabase } from '@/lib/supabase';

// Tâches d'exemple par catégorie
const sampleTasks = {
  quotidien: [
    { label: "Faire mon lit", points_reward: 10, age_min: 3, age_max: 18 },
    { label: "Se brosser les dents", points_reward: 5, age_min: 3, age_max: 18 },
    { label: "Prendre une douche", points_reward: 15, age_min: 5, age_max: 18 },
    { label: "S'habiller tout seul", points_reward: 10, age_min: 3, age_max: 12 },
    { label: "Ranger ma chambre", points_reward: 20, age_min: 4, age_max: 18 },
    { label: "Dire bonjour à la famille", points_reward: 5, age_min: 3, age_max: 18 },
    { label: "Manger sans faire de bruit", points_reward: 10, age_min: 4, age_max: 18 },
    { label: "Fermer les portes doucement", points_reward: 5, age_min: 3, age_max: 18 },
    { label: "Éteindre les lumières", points_reward: 5, age_min: 4, age_max: 18 },
    { label: "Se coucher à l'heure", points_reward: 15, age_min: 3, age_max: 18 }
  ],
  scolaire: [
    { label: "Faire mes devoirs", points_reward: 25, age_min: 6, age_max: 18 },
    { label: "Lire un livre", points_reward: 20, age_min: 5, age_max: 18 },
    { label: "Apprendre une poésie", points_reward: 30, age_min: 6, age_max: 18 },
    { label: "Ranger mon cartable", points_reward: 10, age_min: 6, age_max: 18 },
    { label: "Préparer mes affaires pour demain", points_reward: 15, age_min: 6, age_max: 18 },
    { label: "Faire un exercice de maths", points_reward: 20, age_min: 6, age_max: 18 },
    { label: "Écrire une histoire", points_reward: 25, age_min: 7, age_max: 18 },
    { label: "Apprendre une nouvelle langue", points_reward: 30, age_min: 8, age_max: 18 },
    { label: "Faire un exposé", points_reward: 35, age_min: 8, age_max: 18 },
    { label: "Réviser mes leçons", points_reward: 20, age_min: 6, age_max: 18 }
  ],
  maison: [
    { label: "Mettre la table", points_reward: 15, age_min: 4, age_max: 18 },
    { label: "Débarrasser la table", points_reward: 10, age_min: 4, age_max: 18 },
    { label: "Arroser les plantes", points_reward: 15, age_min: 5, age_max: 18 },
    { label: "Nourrir le chat/chien", points_reward: 10, age_min: 4, age_max: 18 },
    { label: "Sortir les poubelles", points_reward: 20, age_min: 6, age_max: 18 },
    { label: "Passer l'aspirateur", points_reward: 25, age_min: 7, age_max: 18 },
    { label: "Faire la vaisselle", points_reward: 20, age_min: 6, age_max: 18 },
    { label: "Faire la lessive", points_reward: 30, age_min: 8, age_max: 18 },
    { label: "Ranger le salon", points_reward: 15, age_min: 4, age_max: 18 },
    { label: "Nettoyer la salle de bain", points_reward: 25, age_min: 7, age_max: 18 }
  ],
  personnel: [
    { label: "Faire du sport", points_reward: 25, age_min: 4, age_max: 18 },
    { label: "Dessiner un tableau", points_reward: 20, age_min: 3, age_max: 18 },
    { label: "Jouer d'un instrument", points_reward: 30, age_min: 6, age_max: 18 },
    { label: "Faire un puzzle", points_reward: 15, age_min: 3, age_max: 12 },
    { label: "Cuisiner avec maman/papa", points_reward: 25, age_min: 5, age_max: 18 },
    { label: "Faire du jardinage", points_reward: 20, age_min: 4, age_max: 18 },
    { label: "Écrire dans mon journal", points_reward: 15, age_min: 7, age_max: 18 },
    { label: "Faire une activité créative", points_reward: 20, age_min: 4, age_max: 18 },
    { label: "Apprendre une nouvelle compétence", points_reward: 30, age_min: 6, age_max: 18 },
    { label: "Aider quelqu'un", points_reward: 25, age_min: 4, age_max: 18 }
  ]
};

export const seedTasks = async (userId: string) => {
  try {
    console.log('🌱 Début du seeding des tâches...');

    // Vérifier si des tâches existent déjà pour cet utilisateur
    const { data: existingTasks, error: checkError } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Erreur lors de la vérification des tâches existantes:', checkError);
      return;
    }

    if (existingTasks && existingTasks.length > 0) {
      console.log('⚠️ Des tâches existent déjà pour cet utilisateur. Skipping...');
      return;
    }

    // Ajouter les tâches par catégorie
    let totalAdded = 0;
    
    for (const [category, tasks] of Object.entries(sampleTasks)) {
      console.log(`📝 Ajout des tâches ${category}...`);
      
      for (const task of tasks) {
        const { error } = await supabase
          .from('tasks')
          .insert([{
            ...task,
            category: category as 'quotidien' | 'scolaire' | 'maison' | 'personnel',
            user_id: userId,
            is_daily: true
          }]);

        if (error) {
          console.error(`Erreur lors de l'ajout de la tâche "${task.label}":`, error);
        } else {
          totalAdded++;
        }
      }
    }

    console.log(`✅ ${totalAdded} tâches ont été ajoutées avec succès !`);
    console.log('📊 Répartition par catégorie:');
    Object.entries(sampleTasks).forEach(([category, tasks]) => {
      console.log(`   ${category}: ${tasks.length} tâches`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du seeding des tâches:', error);
  }
};

// Fonction pour exécuter le script
export const runSeedTasks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ Aucun utilisateur connecté');
    return;
  }

  await seedTasks(user.id);
}; 