# kudo_dev 引継ぎ（2026-04-12）

## マージ時の注意点

### 大きく変わったファイル
- **`app/[locale]/(main)/map/page.tsx`** — 最大の変更。スポット編集・写真編集・承認フローを全面改修。コンフリクト発生確率高い
- **`lib/config/constants.ts`** — メンバー名を公式大文字表記に変更（`S.COUPS`, `HOSHI`, `THE 8` 等）。DB側も統一済みなので必ずセットで反映
- **`components/SupabaseDataProvider.tsx`** — `refreshSpots()` 追加、events取得のページネーション追加

### 新規ファイル
- **`/api/update-spot/route.ts`** — スポット・写真の更新API（service_role keyでRLSバイパス）。クライアントからの直接UPDATEがRLSで弾かれるため必要
- **`/api/notify-schedule/route.ts`** — プッシュ通知API（Vercel Cron毎時実行）

### 設計変更（mainと考え方が違う部分）
- **スポット承認を廃止** → 写真単位の承認のみ（`spot_votes`は未使用に）
- **投稿数** → `profiles.post_count` カラムではなく、spots + spot_photos をリアルタイムカウント
- **写真のconfirmed/pending分離を廃止** → 全写真をギャラリーに表示、承認状態はバッジで表示

---

## 新規API・外部連携

| サービス | 用途 | 状態 |
|---|---|---|
| **OneSignal** | Webプッシュ通知 | 動作中（全体配信のみ。個別ターゲティング未実装） |
| **Apify (xtdata)** | X/Twitter スクレイピング | 設定済み。`twitterHandles` を使う（`profiles`/`screenNames` は非対応） |
| **X API (OAuth 1.0a)** | 自動投稿 `/api/post-x` | 実装済み。CronはGlide切替まで無効にすべき |
| **LINE Webhook** | `/api/line-webhook` ユーザー紐付け | 実装済み |

---

## 有料化済みサービス

| サービス | プラン | 変わったこと |
|---|---|---|
| **Supabase** | Pro | メール送信レート制限解除、DB容量8GB、50万MAU |
| **Vercel** | Pro | Cron Jobs（毎時実行可）、プレビューデプロイ無制限、帯域1TB |
| **Apify** | 有料 | スクレイピング実行回数・メモリ上限拡大 |

---

## DB変更（SQL Editorで実施済み）
- `spot_votes`, `spot_photo_votes` テーブル新規
- `spots`, `events` に `checked` カラム追加
- メンバー名の表記ゆれ全件修正済み
- 全写真を未承認（pending, votes=0）にリセット済み

---

## 未対応
- iPhone PWAプッシュ通知が動かない
- OneSignal個別ターゲティング
- X自動投稿Cron: Glide切替後に有効化
