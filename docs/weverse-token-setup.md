# Weverse スクレイピングトークン運用手順

Weverse scrape (`/api/scrape-weverse`) は ログイン済み Cookie (`we2_access_token`, `we2_refresh_token`, `we2_device_id`) を必要とする。

- `access_token`: 有効期限 **3日**
- `refresh_token`: 有効期限 **90日**

従来は Vercel 環境変数に手動で入れていたため期限切れ → 401 → scrape 停止を繰り返していた。
本運用では **Supabase `weverse_tokens` テーブルに保存し、Cron で自動更新**する (Lv.2 自動化)。

## アーキテクチャ

```
┌──────────────────────────────────────────────────────┐
│  Vercel Cron (12h interval)                           │
│  → /api/refresh-weverse-tokens                        │
│     ├─ DB から現トークン取得                           │
│     ├─ access が <24h なら Weverse refresh API 呼出  │
│     ├─ 新トークンを DB に UPSERT                      │
│     └─ refresh が <3日 なら admin LINE 警告            │
└──────────────────────────────────────────────────────┘
              ↓ 参照
┌──────────────────────────────────────────────────────┐
│  Supabase: weverse_tokens (最新1行のみ保持)           │
│    access_token, refresh_token, device_id,            │
│    access_expires_at, refresh_expires_at              │
└──────────────────────────────────────────────────────┘
              ↑ 読取
┌──────────────────────────────────────────────────────┐
│  /api/scrape-weverse (1h interval)                    │
│  DB 優先、env フォールバック                           │
└──────────────────────────────────────────────────────┘
```

## 初回セットアップ (一度だけ)

### 1. テーブル作成

Supabase SQL Editor で以下を実行:

```sql
create table if not exists weverse_tokens (
  id                 uuid primary key default gen_random_uuid(),
  access_token       text not null,
  refresh_token      text not null,
  device_id          text not null,
  access_expires_at  timestamptz not null,
  refresh_expires_at timestamptz not null,
  updated_at         timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

alter table weverse_tokens enable row level security;
-- ポリシー無し = service role 専用
```

### 2. 初回トークンの登録

#### 手順 A: ブラウザから Cookie を取得

1. Chrome で <https://weverse.io/seventeen> にログイン
2. DevTools → Application → Cookies → `https://weverse.io`
3. 以下 3 つの `Value` をコピー:
   - `we2_access_token`
   - `we2_refresh_token`
   - `we2_device_id`

#### 手順 B: JWT の有効期限を取得

`we2_access_token` と `we2_refresh_token` は JWT なので `exp` claim を以下で確認できる:

- <https://jwt.io/> に貼り付けて payload の `exp` (UNIX 秒) を確認
- または Node で:
  ```js
  const jwt = 'eyJ...'
  const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
  console.log(new Date(payload.exp * 1000).toISOString())
  ```

#### 手順 C: INSERT

Supabase SQL Editor で (値は差し替え):

```sql
-- 既存行があれば一旦全削除 (最新1行運用)
delete from weverse_tokens;

insert into weverse_tokens (
  access_token,
  refresh_token,
  device_id,
  access_expires_at,
  refresh_expires_at
) values (
  '<we2_access_token の値>',
  '<we2_refresh_token の値>',
  '<we2_device_id の値>',
  '2026-04-25T12:00:00Z',   -- ← access の exp (3日後くらい)
  '2026-07-21T12:00:00Z'    -- ← refresh の exp (90日後くらい)
);
```

### 3. 動作確認

Cron を手動で実行 (Vercel 環境):

```bash
curl "https://app.connectsplus.net/api/refresh-weverse-tokens?debug=TEMP_DEBUG_WEVERSE_2026_0422"
```

レスポンス例 (access がまだ残っている場合):
```json
{
  "log": [
    "access expires in 64.2 hours",
    "refresh expires in 89.7 days",
    "access token still valid >24h, skip refresh"
  ],
  "ok": true,
  "refreshed": false
}
```

## 通常運用

- **12 時間ごと** に `/api/refresh-weverse-tokens` が自動実行される
- `access_token` の残り時間が 24 時間を切ると Weverse API を叩いて更新
- `refresh_token` が 3 日以内に切れる時は admin (Ub88e...) に LINE 通知
  → ブラウザログインし直し → 手動で DB UPDATE が必要

## refresh_token 期限切れ時の手動更新 (3ヶ月に1度)

LINE 通知 `Weverse refresh_token が X.X 日で期限切れ` が届いたら:

1. 上記「初回セットアップ」の手順 A〜C をもう一度実行
2. `delete from weverse_tokens;` → `insert ...` で差し替える
3. 次回 Cron で正常動作することを確認

## env フォールバック

DB テーブルが存在しない / レコードが無い場合は、Vercel 環境変数
(`WEVERSE_ACCESS_TOKEN` / `WEVERSE_REFRESH_TOKEN` / `WEVERSE_DEVICE_ID`) を読む。

既存の env 値は **撤去せず残しておく**こと (DB 破損時の保険)。

## トラブルシューティング

### `no tokens available` エラー
→ DB テーブル未作成 or env も未設定。上記「初回セットアップ」を実施。

### `refresh API call failed`
→ Weverse 側で Cookie が無効化された。refresh_token を手動更新して復旧。

### `refresh token already expired`
→ 90日以上放置。ブラウザログインし直して手動 INSERT。

### LINE 通知が届かない
→ `LINE_CHANNEL_ACCESS_TOKEN` が Vercel env に設定されているか確認。

## 関連ファイル

- `lib/weverseTokens.ts` — トークン取得/保存ユーティリティ
- `app/api/refresh-weverse-tokens/route.ts` — Cron エンドポイント
- `app/api/scrape-weverse/route.ts` — DB 優先でトークン読取
- `vercel.json` — Cron スケジュール (12h)
- `docs/supabase-schema.sql` — テーブル DDL
