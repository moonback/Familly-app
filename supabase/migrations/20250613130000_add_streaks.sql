-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS streaks;

-- Création de la table `streaks`
CREATE TABLE streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  current_streak integer DEFAULT 0 NOT NULL,
  longest_streak integer DEFAULT 0 NOT NULL,
  last_completed_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table `streaks`
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour `streaks`
CREATE POLICY "Parents can view streaks for their children"
  ON streaks FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

CREATE POLICY "Parents can insert streaks for their children"
  ON streaks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

CREATE POLICY "Parents can update streaks for their children"
  ON streaks FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

CREATE POLICY "Parents can delete streaks for their children"
  ON streaks FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

-- Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_streaks_updated_at
    BEFORE UPDATE ON streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 