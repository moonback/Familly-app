/*
  # Gestion de la tirelire

  Cette migration ajoute la table `piggy_bank_transactions` pour enregistrer les mouvements des points des enfants.

  1. Nouvelle Table
    - `piggy_bank_transactions`
      - `id` uuid, clé primaire
      - `child_id` uuid, référence vers `children`
      - `type` text, valeurs ('savings','spending','donation')
      - `points` integer
      - `created_at` timestamptz

  2. Sécurité
    - Activer RLS et permettre aux parents de gérer les transactions de leurs enfants
*/

CREATE TABLE IF NOT EXISTS piggy_bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('savings','spending','donation')) NOT NULL,
  points integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE piggy_bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage piggy bank transactions"
  ON piggy_bank_transactions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));
