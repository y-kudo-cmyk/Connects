-- 配信停止管理テーブル
-- 一斉メールの unsubscribe リンクで挿入される
-- email を主キーに持つ (profiles / glide_users 両方に対応)

create table if not exists email_unsubscribes (
  email           text primary key,
  unsubscribed_at timestamptz default now(),
  reason          text,
  ip_address      text,           -- 監査用
  user_agent      text,           -- 監査用
  created_at      timestamptz default now()
);

-- RLS: 読み書きとも service_role のみ (クライアントから直接触らせない)
alter table email_unsubscribes enable row level security;

-- 管理者が閲覧できるポリシー (必要なら後で追加)
-- drop policy if exists "admin read" on email_unsubscribes;
-- create policy "admin read" on email_unsubscribes for select
--   using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
