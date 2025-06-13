-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS riddles;

-- Création de la table `riddles`
CREATE TABLE riddles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  hint text,
  points integer DEFAULT 10 NOT NULL,
  is_daily boolean DEFAULT true NOT NULL,
  is_solved boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table `riddles`
ALTER TABLE riddles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour `riddles`
CREATE POLICY "Parents can view riddles for their children"
  ON riddles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

CREATE POLICY "Parents can insert riddles for their children"
  ON riddles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

CREATE POLICY "Parents can update riddles for their children"
  ON riddles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

CREATE POLICY "Parents can delete riddles for their children"
  ON riddles FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid())); 