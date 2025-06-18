/*
  # Nettoyage des devinettes en double

  Cette migration nettoie les devinettes en double dans la table `daily_riddles`
  pour s'assurer qu'il n'y a qu'une seule devinette par jour par enfant.

  1. Nettoyage
    - Suppression des devinettes en double en gardant la plus récente
*/

-- Supprimer les devinettes en double en gardant la plus récente
DELETE FROM daily_riddles 
WHERE id NOT IN (
  SELECT DISTINCT ON (child_id, date) id
  FROM daily_riddles
  ORDER BY child_id, date, created_at DESC
); 