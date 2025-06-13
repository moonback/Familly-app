/*
  # Ajout de la boutique et des achats

  Cette migration crée les tables `shop_items` et `purchases` permettant aux enfants d'acheter des articles avec leurs points.

  1. Nouvelles Tables
    - `shop_items`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, clé étrangère vers auth.users)
      - `name` (text, non nul)
      - `price` (integer, non nul)
      - `created_at` (timestamptz, par défaut maintenant)
    - `purchases`
      - `id` (uuid, clé primaire)
      - `child_id` (uuid, clé étrangère vers children)
      - `item_id` (uuid, clé étrangère vers shop_items)
      - `purchased_at` (timestamptz, par défaut maintenant)

  2. Sécurité
    - Activer RLS et ajouter des politiques pour que les parents gèrent leurs articles
      et les achats liés à leurs enfants.
*/

-- Création de la table `shop_items`
CREATE TABLE IF NOT EXISTS shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage their shop items"
  ON shop_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Création de la table `purchases`
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES shop_items(id) ON DELETE CASCADE NOT NULL,
  purchased_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage purchases for their children"
  ON purchases FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM children WHERE id = child_id AND user_id = auth.uid()));
