/*
  # Création de la table claimed_rewards

  Cette migration crée la table `claimed_rewards` pour gérer les récompenses
  réclamées par les enfants.

  1. Nouvelle Table
    - `claimed_rewards`
      - `id` (uuid, clé primaire)
      - `child_id` (uuid, clé étrangère vers children)
      - `reward_id` (uuid, clé étrangère vers rewards)
      - `claimed_at` (timestamptz, par défaut maintenant)
      - `created_at` (timestamptz, par défaut maintenant)

  2. Sécurité
    - Activer RLS et permettre aux parents de gérer les réclamations de leurs enfants
*/

-- Création de la table `claimed_rewards`
CREATE TABLE IF NOT EXISTS claimed_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
  claimed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table `claimed_rewards`
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour `claimed_rewards`
CREATE POLICY "Parents can manage claimed rewards for their children"
  ON claimed_rewards FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

-- Création d'un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_child_id ON claimed_rewards(child_id);
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_reward_id ON claimed_rewards(reward_id);
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_claimed_at ON claimed_rewards(claimed_at); 