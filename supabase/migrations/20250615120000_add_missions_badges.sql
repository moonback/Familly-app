/*
  # Ajout des missions et des badges

  Cette migration crée les tables necessaires pour suivre des missions ludiques
  et attribuer des badges aux enfants.

  Nouvelles tables
    - missions
    - mission_steps
    - child_missions
    - badges
    - child_badges
*/

-- Table missions
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text DEFAULT 'divers',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage their missions"
  ON missions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table mission_steps
CREATE TABLE IF NOT EXISTS mission_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES missions(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  step_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mission_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage their mission steps"
  ON mission_steps FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM missions WHERE id = mission_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM missions WHERE id = mission_id AND user_id = auth.uid()));

-- Table child_missions
CREATE TABLE IF NOT EXISTS child_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  mission_id uuid REFERENCES missions(id) ON DELETE CASCADE NOT NULL,
  current_step integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  validated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE child_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage child missions"
  ON child_missions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

-- Table badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read badges"
  ON badges FOR SELECT
  USING (true);

CREATE POLICY "Parents manage badges"
  ON badges FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Table child_badges
CREATE TABLE IF NOT EXISTS child_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(child_id, badge_id)
);

ALTER TABLE child_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage child badges"
  ON child_badges FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));
