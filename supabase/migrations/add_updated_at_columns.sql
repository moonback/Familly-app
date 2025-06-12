/*
      # Ajout de la colonne updated_at aux tables principales

      Cette migration ajoute une colonne `updated_at` à plusieurs tables pour suivre la dernière date de modification.

      1. Modifications
        - `children` : Ajout de `updated_at` (timestamptz, par défaut maintenant)
        - `tasks` : Ajout de `updated_at` (timestamptz, par défaut maintenant)
        - `rules` : Ajout de `updated_at` (timestamptz, par défaut maintenant)
        - `rewards` : Ajout de `updated_at` (timestamptz, par défaut maintenant)

      2. Sécurité
        - Aucune modification des politiques RLS existantes n'est nécessaire pour cette colonne.
    */

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'updated_at') THEN
        ALTER TABLE children ADD COLUMN updated_at timestamptz DEFAULT now();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at') THEN
        ALTER TABLE tasks ADD COLUMN updated_at timestamptz DEFAULT now();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rules' AND column_name = 'updated_at') THEN
        ALTER TABLE rules ADD COLUMN updated_at timestamptz DEFAULT now();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rewards' AND column_name = 'updated_at') THEN
        ALTER TABLE rewards ADD COLUMN updated_at timestamptz DEFAULT now();
      END IF;
    END $$;
