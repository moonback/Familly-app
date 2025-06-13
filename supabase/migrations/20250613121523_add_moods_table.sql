/*
  # Ajout de la table moods

  Cette migration crée la table `moods` pour enregistrer l'humeur quotidienne des enfants.
*/

CREATE TABLE IF NOT EXISTS moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  mood text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage moods for their children"
  ON moods FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));
