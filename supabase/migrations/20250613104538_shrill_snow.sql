/*
  # Ajout des contraintes d'âge et des tables pour les devinettes

  Cette migration ajoute les fonctionnalités manquantes pour les tâches par âge et les devinettes quotidiennes.

  1. Nouvelles Tables
    - `riddles`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, clé étrangère vers auth.users)
      - `question` (text, non nul)
      - `answer` (text, non nul)
      - `points` (integer, par défaut 50)
      - `created_at` (timestamptz, par défaut maintenant)
    - `daily_riddles`
      - `id` (uuid, clé primaire)
      - `child_id` (uuid, clé étrangère vers children)
      - `riddle_id` (uuid, clé étrangère vers riddles)
      - `date` (date, non nul)
      - `is_solved` (boolean, par défaut false)
      - `created_at` (timestamptz, par défaut maintenant)
    - `points_history`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, clé étrangère vers auth.users)
      - `child_id` (uuid, clé étrangère vers children)
      - `points` (integer, non nul)
      - `reason` (text, non nul)
      - `created_at` (timestamptz, par défaut maintenant)

  2. Modifications
    - Ajout de `age_min` et `age_max` à la table `tasks`
    - Ajout de `category` à la table `tasks`

  3. Sécurité
    - Activer RLS sur toutes les nouvelles tables
    - Ajouter les politiques appropriées
*/

-- Ajout des colonnes d'âge et de catégorie aux tâches
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'age_min') THEN
    ALTER TABLE tasks ADD COLUMN age_min integer DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'age_max') THEN
    ALTER TABLE tasks ADD COLUMN age_max integer DEFAULT 18;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'category') THEN
    ALTER TABLE tasks ADD COLUMN category text DEFAULT 'quotidien' CHECK (category IN ('quotidien', 'scolaire', 'maison', 'personnel'));
  END IF;
END $$;

-- Création de la table `riddles`
CREATE TABLE IF NOT EXISTS riddles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  points integer DEFAULT 50 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table `riddles`
ALTER TABLE riddles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour `riddles`
CREATE POLICY "Parents can view their own riddles"
  ON riddles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can insert their own riddles"
  ON riddles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Parents can update their own riddles"
  ON riddles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can delete their own riddles"
  ON riddles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Création de la table `daily_riddles`
CREATE TABLE IF NOT EXISTS daily_riddles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  riddle_id uuid REFERENCES riddles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  is_solved boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(child_id, date)
);

-- Activer RLS sur la table `daily_riddles`
ALTER TABLE daily_riddles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour `daily_riddles`
CREATE POLICY "Parents can manage daily riddles for their children"
  ON daily_riddles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

-- Création de la table `points_history`
CREATE TABLE IF NOT EXISTS points_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  points integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table `points_history`
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour `points_history`
CREATE POLICY "Parents can view points history for their children"
  ON points_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can insert points history for their children"
  ON points_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);