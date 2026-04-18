-- ============================================================
-- Connects+ Supabase Schema v2
-- Based on Glide DB export analysis
-- ============================================================
-- Auth: Supabase Auth (Email + Google + X)
-- RLS: 全テーブル有効
-- ============================================================

-- ── アーティストマスタ ───────────────────────────────────────
-- ARTIST_MASTER.csv ベース
create table artists (
  id            text primary key,              -- 'A000001' (元DB形式を維持)
  artist_type   text check (artist_type in ('K-POP','J-POP')),
  level         text not null check (level in ('GROUP','MEMBER','UNIT')),
  group_id      text references artists(id),   -- メンバー/ユニットの所属グループ
  name          text not null,                 -- 'S.COUPS' (公式名・表示名)
  birthday      date,                          -- メンバーの誕生日
  fandom_name   text default '',               -- 'CARAT'
  name_ja       text default '',               -- 'エスクプス'
  name_en       text default '',               -- 'S.COUPS'
  name_ko       text default '',               -- '에스쿱스'
  display_name  text default '',               -- 'クプス スンチョル リーダー'
  search_text   text default '',               -- 検索用テキスト（全表記結合）
  instagram_url text default '',
  x_url         text default '',
  official_url  text default '',
  youtube_url   text default '',
  color         text default '#636366',        -- アプリ表示色
  image_url     text default '',
  -- 兵役情報（メンバーのみ）
  enlist_date   date,                          -- 入隊日
  discharge_date date,                         -- 除隊日
  sort_order    int default 0,
  created_at    timestamptz default now()
);

-- ── ユーザー ─────────────────────────────────────────────────
-- USER_MASTER.csv ベース
create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  mail              text unique,
  line_user_id      text default '',
  membership_number text default '',            -- 'U000001'
  nickname          text default '',
  is_username_unique boolean default false,
  join_date         timestamptz,
  role              text default 'user' check (role in ('user','admin')),
  avatar_url        text default '',
  banner_url        text default '',
  membership_status text default '' check (membership_status in ('','free','paid')),
  expiry_date       date,
  fav_artist_id     text references artists(id), -- 推しグループ
  -- 統計（集計キャッシュ）
  post_count        int default 0,
  approval_total    int default 0,
  edit_report_count int default 0,
  membership_rank   text default '',
  earned_badges     text default '',
  -- 紹介制度
  ref_code          text unique,
  introduced_by     text default '',
  is_verified       boolean default false,
  -- 設定
  language          text default 'ja' check (language in ('ja','en','ko')),
  country           text default 'JP',
  -- 通知設定
  notif_morning_on      boolean default false,
  notif_morning_time    text default '08:00',
  notif_evening_on      boolean default false,
  notif_evening_time    text default '21:00',
  notif_event_reminder  boolean default true,
  --
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── ファンクラブ会員情報 ─────────────────────────────────────
create table fan_club_memberships (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  club_name         text not null,
  member_number     text default '',
  member_password   text default '',
  mobile_number     text default '',
  mobile_password   text default '',
  email             text default '',
  phone             text default '',
  valid_until       date,
  note              text default '',
  created_at        timestamptz default now()
);

-- ── スケジュールタグマスタ ───────────────────────────────────
create table schedule_tags (
  id      text primary key,                    -- 'LIVE'
  label   text not null,                       -- 'LIVE'
  icon    text not null,                       -- '🎤'
  color   text not null,
  bg      text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ── スケジュール（イベント） ─────────────────────────────────
-- SCHEDULE_DB.csv ベース
create table events (
  id              uuid primary key default gen_random_uuid(),
  tag             text not null references schedule_tags(id),  -- 'LIVE','TICKET' etc
  artist_id       text not null references artists(id),        -- グループID
  related_artists text default '',               -- '#SEVENTEEN #S.COUPS #MINGYU' 形式
  event_title     text not null,
  sub_event_title text default '',               -- チケット先行名、回次等
  start_date      timestamptz,                   -- 開始日時
  end_date        timestamptz,                   -- 終了日時
  -- 会場・場所（SPOTと連携可能）
  spot_id         text default '',               -- SPOT_DB.spot_id（会場がスポットにある場合）
  spot_name       text default '',               -- 会場名
  spot_address    text default '',               -- 住所
  lat             double precision,              -- 緯度
  lng             double precision,              -- 経度
  country         text default '',               -- 国コード
  -- メディア
  image_url       text default '',               -- 画像1枚
  source_url      text default '',
  notes           text default '',               -- 備考（開場時間等）
  -- 承認
  submitted_by    uuid references profiles(id),  -- null = 運営
  status          text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  verified_count  int default 0,
  --
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 重複チェック（同一タイトル＋同一開始日）
create unique index events_dedup on events (event_title, start_date)
  where status != 'rejected';

-- ── イベント承認投票 ─────────────────────────────────────────
create table event_votes (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references events(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  vote      text not null default 'approve' check (vote in ('approve','reject')),
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

-- 3票で自動 confirmed
create or replace function auto_confirm_event()
returns trigger as $$
begin
  update events
  set status = 'confirmed',
      verified_count = (select count(*) from event_votes where event_id = NEW.event_id and vote = 'approve')
  where id = NEW.event_id
    and status = 'pending'
    and (select count(*) from event_votes where event_id = NEW.event_id and vote = 'approve') >= 3;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_auto_confirm_event
  after insert on event_votes
  for each row execute function auto_confirm_event();

-- ── 聖地スポット ─────────────────────────────────────────────
-- SPOT_DB.csv ベース
create table spots (
  id              text primary key,              -- 'SP00001' 形式
  spot_name       text not null,
  spot_address    text not null,
  spot_url        text default '',               -- SPOT公式URL
  genre           text not null default 'OTHER'
                    check (genre in ('CAFE','RESTAURANT','FASHION','ENTERTAINMENT','MUSIC','OTHER')),
  artist_id       text not null references artists(id),
  related_artists text default '',               -- '#SEVENTEEN #DK' 形式
  image_url       text default '',
  source_url      text default '',
  memo            text default '',
  lat             double precision,
  lng             double precision,
  is_master       boolean default false,         -- 運営登録フラグ
  -- 承認
  submitted_by    uuid references profiles(id),
  status          text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  verified_count  int default 0,
  x_posted        boolean default false,         -- X自動投稿済み
  screenshot_url  text default '',
  --
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── スポット写真 ─────────────────────────────────────────────
create table spot_photos (
  id            uuid primary key default gen_random_uuid(),
  spot_id       text not null references spots(id) on delete cascade,
  image_url     text default '',
  source_url    text default '',
  platform      text default 'other' check (platform in ('instagram','weverse','x','youtube','other')),
  tags          text default '',                 -- '#SEVENTEEN #DK' 形式
  contributor   text default '',
  submitted_by  uuid references profiles(id),
  visit_date    date,
  caption       text default '',
  status        text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  votes         int default 0,
  created_at    timestamptz default now()
);

-- ── スポット写真の承認投票 ────────────────────────────────────
create table spot_photo_votes (
  id        uuid primary key default gen_random_uuid(),
  photo_id  uuid not null references spot_photos(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (photo_id, user_id)
);

-- 3票で自動承認
create or replace function auto_confirm_photo()
returns trigger as $$
begin
  update spot_photos
  set status = 'confirmed',
      votes = (select count(*) from spot_photo_votes where photo_id = NEW.photo_id)
  where id = NEW.photo_id
    and status = 'pending'
    and (select count(*) from spot_photo_votes where photo_id = NEW.photo_id) >= 3;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_auto_confirm_photo
  after insert on spot_photo_votes
  for each row execute function auto_confirm_photo();

-- ── MY カレンダー ────────────────────────────────────────────
-- MY_CALENDER.csv ベース
create table my_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  event_id        uuid references events(id) on delete set null,
  -- 基本情報（event から転記 or 手動入力）
  tag             text default '',
  artist_id       text references artists(id),
  related_artists text default '',
  event_title     text not null,
  sub_event_title text default '',
  start_date      timestamptz,
  end_date        timestamptz,
  spot_name       text default '',
  spot_address    text default '',
  image_url       text default '',
  source_url      text default '',
  notes           text default '',
  -- ユーザー固有データ
  ticket_image_url text default '',              -- チケット画像
  view_image_url   text default '',              -- 座席からの眺め
  seat_info       jsonb default '{}',            -- 座席情報
  memo            text default '',
  --
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── TODO ──────────────────────────────────────────────────────
create table todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  event_id    uuid references events(id) on delete set null,
  title       text not null,
  date        date not null,
  date_end    date,
  time        time,
  source_url  text default '',
  source_name text default '',
  memo        text default '',
  done        boolean default false,
  notif       boolean default true,
  created_at  timestamptz default now()
);

-- ── URL投稿（HP募集中 → ユーザー提案） ──────────────────────
create table url_submissions (
  id          uuid primary key default gen_random_uuid(),
  spot_id     text references spots(id) on delete cascade,
  event_id    uuid references events(id) on delete cascade,
  url         text not null,
  type        text not null check (type in ('spot_url','source_url','other')),
  submitted_by uuid not null references profiles(id),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz default now()
);

-- ── 修正依頼（承認済み情報への変更提案） ─────────────────────
create table edit_requests (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references events(id) on delete cascade,
  spot_id       text references spots(id) on delete cascade,
  field_name    text not null,
  old_value     text default '',
  new_value     text not null,
  reason        text default '',
  submitted_by  uuid not null references profiles(id),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  votes         int default 0,
  applied_at    timestamptz,
  created_at    timestamptz default now(),
  check (event_id is not null or spot_id is not null)
);

-- ── 修正依頼の承認投票 ───────────────────────────────────────
create table edit_request_votes (
  id              uuid primary key default gen_random_uuid(),
  edit_request_id uuid not null references edit_requests(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  created_at      timestamptz default now(),
  unique (edit_request_id, user_id)
);

-- 3票で自動承認 → 上書き
create or replace function auto_approve_edit()
returns trigger as $$
declare req record;
begin
  select * into req from edit_requests where id = NEW.edit_request_id;
  if req.status = 'pending' and (
    select count(*) from edit_request_votes where edit_request_id = NEW.edit_request_id
  ) >= 3 then
    update edit_requests set status = 'approved', votes = 3, applied_at = now()
    where id = NEW.edit_request_id;
    if req.event_id is not null then
      execute format('update events set %I = $1, updated_at = now() where id = $2', req.field_name)
      using req.new_value, req.event_id;
    elsif req.spot_id is not null then
      execute format('update spots set %I = $1, updated_at = now() where id = $2', req.field_name)
      using req.new_value, req.spot_id;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_auto_approve_edit
  after insert on edit_request_votes
  for each row execute function auto_approve_edit();

-- ── お気に入りスポット ───────────────────────────────────────
create table favorite_spots (
  user_id   uuid not null references profiles(id) on delete cascade,
  spot_id   text not null references spots(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, spot_id)
);

-- ── お知らせ ─────────────────────────────────────────────────
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text default '',
  link_url    text default '',
  priority    int default 0,
  published   boolean default true,
  created_at  timestamptz default now()
);

-- ── ユーザーアクティビティログ ────────────────────────────────
create table user_activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  action      text not null,                       -- 'login','view_page','approve','add_my','post_event','post_spot_photo'
  detail      text default '',                     -- ページ名やイベントIDなど
  created_at  timestamptz default now()
);

create index idx_user_activity_created on user_activity (created_at desc);
create index idx_user_activity_user on user_activity (user_id, created_at desc);

-- ── GOODS（COMING SOON — テーブルは後日追加） ────────────────

-- ============================================================
-- RLS
-- ============================================================
alter table artists enable row level security;
alter table profiles enable row level security;
alter table fan_club_memberships enable row level security;
alter table schedule_tags enable row level security;
alter table events enable row level security;
alter table event_votes enable row level security;
alter table spots enable row level security;
alter table spot_photos enable row level security;
alter table spot_photo_votes enable row level security;
alter table my_entries enable row level security;
alter table todos enable row level security;
alter table url_submissions enable row level security;
alter table edit_requests enable row level security;
alter table edit_request_votes enable row level security;
alter table favorite_spots enable row level security;
alter table announcements enable row level security;

-- 認証済みユーザーのみ読取可能（スクレイピング防止）
create policy "Authenticated read" on artists for select to authenticated using (true);
create policy "Authenticated read" on schedule_tags for select to authenticated using (true);
create policy "Authenticated read" on events for select to authenticated using (true);
create policy "Authenticated read" on event_votes for select to authenticated using (true);
create policy "Authenticated read" on spots for select to authenticated using (true);
create policy "Authenticated read" on spot_photos for select to authenticated using (true);
create policy "Authenticated read" on spot_photo_votes for select to authenticated using (true);
create policy "Authenticated read" on edit_requests for select to authenticated using (true);
create policy "Authenticated read" on edit_request_votes for select to authenticated using (true);
create policy "Authenticated read" on url_submissions for select to authenticated using (true);
create policy "Authenticated read" on announcements for select to authenticated using (true);

-- 本人データ
create policy "Own profile" on profiles for select using (auth.uid() = id);
create policy "Own profile update" on profiles for update using (auth.uid() = id);
create policy "Own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "Own data" on fan_club_memberships for all using (auth.uid() = user_id);
create policy "Own data" on my_entries for all using (auth.uid() = user_id);
create policy "Own data" on todos for all using (auth.uid() = user_id);
create policy "Own data" on favorite_spots for all using (auth.uid() = user_id);
create policy "Own data" on user_cards for all using (auth.uid() = user_id);

-- 認証ユーザーが投稿・投票可能
create policy "Auth insert" on events for insert with check (auth.uid() is not null);
create policy "Auth insert" on spots for insert with check (auth.uid() is not null);
create policy "Auth insert" on spot_photos for insert with check (auth.uid() is not null);
create policy "Auth insert" on url_submissions for insert with check (auth.uid() = submitted_by);
create policy "Auth insert" on edit_requests for insert with check (auth.uid() = submitted_by);
create policy "Auth vote" on event_votes for insert with check (auth.uid() = user_id);
create policy "Auth vote" on spot_photo_votes for insert with check (auth.uid() = user_id);
create policy "Auth vote" on edit_request_votes for insert with check (auth.uid() = user_id);

-- ============================================================
-- profiles 自動作成トリガー（TODO: Dashboard SQL Editor で実行）
-- 実行後、useVoting.ts の ensureProfile と auth/callback/route.ts の
-- profile作成コードを削除すること
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, mail, nickname, join_date)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- auto_confirm_event 修正（TODO: Dashboard SQL Editor で実行）
-- 投票ごとに verified_count を更新する（元は3票到達時のみ更新）
-- ============================================================
create or replace function auto_confirm_event()
returns trigger as $$
begin
  update events
  set verified_count = (select count(*) from event_votes where event_id = NEW.event_id and vote = 'approve'),
      status = case
        when (select count(*) from event_votes where event_id = NEW.event_id and vote = 'approve') >= 3
        then 'confirmed' else status end
  where id = NEW.event_id;
  return NEW;
end;
$$ language plpgsql;

-- ============================================================
-- Storage バケット（Supabase Dashboard で作成）
-- ============================================================
-- avatars        (プロフィール画像)
-- banners        (プロフィールバナー)
-- event-images   (スケジュール画像) ✅ 作成済み（public）
-- spot-photos    (聖地写真)
-- screenshots    (スクリーンショット)
-- tickets        (チケット画像) ※private
-- memories       (思い出写真) ※private

-- Storage RLS ポリシー
-- 認証済みユーザーのみ閲覧・アップロード可能
create policy "Authenticated can view event images"
  on storage.objects for select to authenticated
  using (bucket_id = 'event-images');
create policy "Authenticated can view avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars');
create policy "Authenticated can view banners"
  on storage.objects for select to authenticated
  using (bucket_id = 'banners');

create policy "Authenticated users can upload event images"
  on storage.objects for insert
  with check (bucket_id = 'event-images' and auth.role() = 'authenticated');

-- ============================================================
-- 初期データ: タグマスタ
-- ============================================================
insert into schedule_tags (id, label, icon, color, bg, sort_order) values
  ('LIVE',       'LIVE',       '🎤', '#F3B4E3', 'rgba(243,180,227,0.15)', 1),
  ('TICKET',     'TICKET',     '🎫', '#FCD34D', 'rgba(252,211,77,0.15)',  2),
  ('CD',         'CD',         '💿', '#A78BFA', 'rgba(167,139,250,0.15)', 3),
  ('LUCKY_DRAW', 'LUCKY DRAW', '🂠', '#E879F9', 'rgba(232,121,249,0.15)', 4),
  ('POPUP',      'POPUP',      '🏪', '#FB923C', 'rgba(251,146,60,0.15)',  5),
  ('MERCH',      'MERCH',      '🛒', '#34D399', 'rgba(52,211,153,0.15)',  6),
  ('RELEASE',    'RELEASE',    '📀', '#60A5FA', 'rgba(96,165,250,0.15)',  7),
  ('BIRTHDAY',   'BIRTHDAY',   '🎂', '#FB923C', 'rgba(251,146,60,0.15)',  8),
  ('MAGAZINE',   'MAGAZINE',   '📖', '#F87171', 'rgba(248,113,113,0.15)', 9),
  ('EVENT',      'EVENT',      '❤️', '#F87171', 'rgba(248,113,113,0.15)', 10),
  ('TV',         'TV',         '📺', '#60A5FA', 'rgba(96,165,250,0.15)',  11),
  ('YOUTUBE',    'YOUTUBE',    '▶️', '#EF4444', 'rgba(239,68,68,0.15)',   12),
  ('RADIO',      'RADIO',     '📻', '#4ADE80', 'rgba(74,222,128,0.15)',  13);

-- ============================================================
-- トレカデジタルアルバム
-- ============================================================

-- ── アルバム/商品マスタ ─────────────────────────────────────────
create table card_products (
  product_id    text primary key,              -- 'P_KR001'
  product_name  text not null,                 -- 'BOYS BE'
  product_type  text default 'mini_album',     -- mini_album/full_album/repackage/special_album/single/solo_album/unit_album/compilation
  region        text default 'KR',             -- KR/JP
  release_date  date,
  artist_id     text default 'A000000',
  image_url     text default '',
  created_at    timestamptz default now()
);

-- ── バージョンマスタ ────────────────────────────────────────────
create table card_versions (
  version_id    text primary key,              -- 'V_KR001_01'
  product_id    text not null references card_products(product_id),
  version_name  text not null,                 -- 'SEEK', 'HIDE'
  created_at    timestamptz default now()
);

-- ── トレカマスタ（メンバー x バージョン x タイプ） ───────────────
create table card_master (
  id              text primary key,            -- 'PM00001'
  product_id      text not null references card_products(product_id),
  version_id      text references card_versions(version_id),
  member_id       text default '',
  member_name     text default '',
  card_type       text default 'photocard',
  card_detail     text default '',
  front_image_url text default '',
  back_image_url  text default '',
  created_at      timestamptz default now()
);

-- ── ユーザーのカード台帳 ────────────────────────────────────────
create table user_cards (
  id              text primary key,            -- 'CARD-xxxx'
  user_id         uuid not null references profiles(id) on delete cascade,
  card_master_id  text references card_master(id),
  product_id      text not null,
  version_id      text default '',
  member_id       text default '',
  member_name     text default '',
  front_image_url text default '',
  back_image_url  text default '',
  quantity        int default 1,
  notes           text default '',
  status          text default 'ACTIVE',
  created_at      timestamptz default now()
);

-- RLS
alter table card_products enable row level security;
alter table card_versions enable row level security;
alter table card_master enable row level security;
alter table user_cards enable row level security;

create policy "Authenticated can read card_products"
  on card_products for select to authenticated using (true);
create policy "Authenticated can read card_versions"
  on card_versions for select to authenticated using (true);
create policy "Authenticated can read card_master"
  on card_master for select to authenticated using (true);
create policy "Users can CRUD own cards"
  on user_cards for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
