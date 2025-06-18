/*
  # Ajout de contrainte unique pour daily_riddles

  Cette migration ajoute une contrainte unique sur la table `daily_riddles`
  pour empêcher la création de plusieurs devinettes par jour pour le même enfant.

  1. Modification
    - Ajout d'une contrainte unique sur (child_id, date)
*/

-- Ajout de la contrainte unique pour empêcher plusieurs devinettes par jour
DO $$
BEGIN
  -- Vérifier si la contrainte n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_riddles_child_date_unique'
  ) THEN
    -- Ajouter la contrainte unique
    ALTER TABLE daily_riddles 
    ADD CONSTRAINT daily_riddles_child_date_unique 
    UNIQUE (child_id, date);
  END IF;
END $$; 