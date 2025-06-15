-- Ajout des colonnes reward_id et task_id à la table points_history
ALTER TABLE points_history
ADD COLUMN IF NOT EXISTS reward_id UUID REFERENCES rewards(id),
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id);

-- Création d'un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_points_history_reward_id ON points_history(reward_id);
CREATE INDEX IF NOT EXISTS idx_points_history_task_id ON points_history(task_id);

-- Mise à jour des contraintes de clé étrangère
ALTER TABLE points_history
DROP CONSTRAINT IF EXISTS points_history_reward_id_fkey,
DROP CONSTRAINT IF EXISTS points_history_task_id_fkey,
ADD CONSTRAINT points_history_reward_id_fkey 
    FOREIGN KEY (reward_id) 
    REFERENCES rewards(id) 
    ON DELETE SET NULL,
ADD CONSTRAINT points_history_task_id_fkey 
    FOREIGN KEY (task_id) 
    REFERENCES tasks(id) 
    ON DELETE SET NULL;

-- Suppression des anciennes politiques si elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre historique de points" ON points_history;
DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer dans leur propre historique de points" ON points_history;

-- Création des nouvelles politiques
CREATE POLICY "Les utilisateurs peuvent voir leur propre historique de points"
ON points_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer dans leur propre historique de points"
ON points_history
FOR INSERT
WITH CHECK (auth.uid() = user_id); 