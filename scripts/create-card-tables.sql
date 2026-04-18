-- ============================================================
-- トレカデジタルアルバム テーブル作成
-- Supabase SQL Editor で実行してください
-- ============================================================

-- card_products
CREATE TABLE IF NOT EXISTS card_products (
  product_id text PRIMARY KEY,
  product_name text NOT NULL,
  product_type text DEFAULT 'mini_album',
  region text DEFAULT 'KR',
  release_date date,
  artist_id text DEFAULT 'A000000',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- card_versions
CREATE TABLE IF NOT EXISTS card_versions (
  version_id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES card_products(product_id),
  version_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- card_master
CREATE TABLE IF NOT EXISTS card_master (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES card_products(product_id),
  version_id text REFERENCES card_versions(version_id),
  member_id text DEFAULT '',
  member_name text DEFAULT '',
  card_type text DEFAULT 'photocard',
  card_detail text DEFAULT '',
  front_image_url text DEFAULT '',
  back_image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- user_cards
CREATE TABLE IF NOT EXISTS user_cards (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_master_id text REFERENCES card_master(id),
  product_id text NOT NULL,
  version_id text DEFAULT '',
  member_id text DEFAULT '',
  member_name text DEFAULT '',
  front_image_url text DEFAULT '',
  back_image_url text DEFAULT '',
  quantity int DEFAULT 1,
  notes text DEFAULT '',
  status text DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE card_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated users
CREATE POLICY "Authenticated can read card_products"
  ON card_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read card_versions"
  ON card_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read card_master"
  ON card_master FOR SELECT TO authenticated USING (true);

-- user_cards: owner only (all operations)
CREATE POLICY "Users can CRUD own cards"
  ON user_cards FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
