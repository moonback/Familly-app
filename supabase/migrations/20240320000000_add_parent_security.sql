-- Création de la table pour les codes parent
CREATE TABLE IF NOT EXISTS parent_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Création de la table pour les logs d'accès
CREATE TABLE IF NOT EXISTS parent_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Création des politiques de sécurité
ALTER TABLE parent_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_access_logs ENABLE ROW LEVEL SECURITY;

-- Suppression des politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own parent code" ON parent_codes;
DROP POLICY IF EXISTS "Users can insert their own parent code" ON parent_codes;
DROP POLICY IF EXISTS "Users can update their own parent code" ON parent_codes;
DROP POLICY IF EXISTS "Users can view their own access logs" ON parent_access_logs;
DROP POLICY IF EXISTS "Users can insert their own access logs" ON parent_access_logs;

-- Création des nouvelles politiques
CREATE POLICY "Users can view their own parent code"
    ON parent_codes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own parent code"
    ON parent_codes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parent code"
    ON parent_codes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own access logs"
    ON parent_access_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access logs"
    ON parent_access_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Suppression du trigger existant s'il existe
DROP TRIGGER IF EXISTS update_parent_codes_updated_at ON parent_codes;

-- Création du nouveau trigger
CREATE TRIGGER update_parent_codes_updated_at
    BEFORE UPDATE ON parent_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 