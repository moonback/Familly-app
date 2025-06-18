/*
  # Ajout de devinettes de test

  Cette migration ajoute quelques devinettes de test pour permettre aux enfants
  de tester la fonctionnalité des devinettes quotidiennes.

  Les devinettes sont créées avec des points appropriés selon la difficulté.
*/

-- Insérer des devinettes de test pour les utilisateurs existants
INSERT INTO riddles (user_id, question, answer, points, hint, created_at)
SELECT 
  user_id,
  'Je suis grand quand je suis jeune et petit quand je suis vieux. Que suis-je ?',
  'bougie',
  30,
  'Je brûle et je fonds en même temps',
  now()
FROM children
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO riddles (user_id, question, answer, points, hint, created_at)
SELECT 
  user_id,
  'Plus j''ai de gardiens, moins je suis en sécurité. Plus j''ai de trous, plus je suis solide. Que suis-je ?',
  'secret',
  50,
  'Plus on essaie de me protéger, plus je risque d''être découvert',
  now()
FROM children
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO riddles (user_id, question, answer, points, hint, created_at)
SELECT 
  user_id,
  'Je parle sans bouche et entends sans oreilles. Je n''ai pas de corps, mais je m''anime au vent. Que suis-je ?',
  'echo',
  70,
  'Je répète ce que tu dis, mais je ne peux pas parler en premier',
  now()
FROM children
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING; 