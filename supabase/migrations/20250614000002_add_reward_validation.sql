/*
  # Ajout de la validation des récompenses réclamées

  Cette migration ajoute un système de validation des récompenses réclamées par les enfants.
  Les parents peuvent maintenant valider les récompenses une fois qu'elles sont effectuées.

  1. Modification de la table `claimed_rewards`
    - Ajout de `is_validated` (boolean, par défaut false)
    - Ajout de `validated_at` (timestamptz, nullable)
    - Ajout de `validated_by` (uuid, clé étrangère vers auth.users, nullable)

  2. Sécurité
    - Seuls les parents peuvent valider les récompenses de leurs enfants
*/

-- Ajout des colonnes de validation à la table `claimed_rewards`
ALTER TABLE claimed_rewards 
ADD COLUMN IF NOT EXISTS is_validated boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS validated_at timestamptz,
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id);

-- Création d'un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_claimed_rewards_validation 
ON claimed_rewards(is_validated, validated_at);

-- Mise à jour des politiques RLS pour inclure la validation
DROP POLICY IF EXISTS "Parents can manage claimed rewards for their children" ON claimed_rewards;

CREATE POLICY "Parents can manage claimed rewards for their children"
  ON claimed_rewards FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));

-- Politique spécifique pour la validation (seuls les parents peuvent valider)
CREATE POLICY "Parents can validate claimed rewards for their children"
  ON claimed_rewards FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (
    EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()) AND
    (validated_by IS NULL OR validated_by = auth.uid())
  ); 