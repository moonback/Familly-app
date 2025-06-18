/*
  # Ajout de la colonne hint à la table riddles

  Cette migration ajoute la colonne `hint` à la table `riddles` pour stocker
  les indices des devinettes.

  1. Modification
    - Ajout de `hint` (text, nullable) à la table `riddles`
*/

-- Ajout de la colonne hint à la table riddles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'riddles' AND column_name = 'hint') THEN
    ALTER TABLE riddles ADD COLUMN hint text;
  END IF;
END $$; 