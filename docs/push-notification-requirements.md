# プッシュ通知要件

## 概要
2チャネル並行で通知を配信：
1. **PWA プッシュ通知**（OneSignal）— Web ブラウザ / ホーム画面追加ユーザー向け
2. **LINE 通知**（LINE Messaging API）— LINE 友だち登録ユーザー向け

運営者が admin 画面から手動送信 + イベントに連動した自動通知。
両チャネルに同時配信する共通 API を構築。

## 採用サービス

### PWA プッシュ通知
- **OneSignal** (https://onesignal.com/)
- 無料枠: 無制限（基本機能）
- 裏で FCM（Firebase Cloud Messaging）を使用
- REST API でサーバーサイドから送信可能
- 対応: Android Chrome / iPhone Safari（PWA、iOS 16.4+）

### LINE 通知
- **LINE Messaging API** (https://developers.line.biz/)
- LINE 公式アカウントから Messaging API を有効化
- 無料枠: 月200通（フリープラン）/ 月5,000通（ライトプラン ¥5,000）
- profiles テーブルの `line_user_id` でユーザーを紐づけ

## 通知の種類

### 1. 手動通知（admin 画面から）
- お知らせ作成時に「プッシュ通知も送る」チェックボックス
- 配信先: PWA Push / LINE / 両方 を選択可能
- 対象: 全ユーザー / 特定の言語 / 特定のアーティストのファン
- admin 画面の「通知送信」ページ追加も検討

### 2. 自動通知

| トリガー | 内容 | 対象 |
|---|---|---|
| イベント承認（3票到達） | 「新しいスケジュールが公開されました」 | 全ユーザー or 関連アーティストのファン |
| イベント前日 | 「明日の予定: [イベント名]」 | MY に追加しているユーザー |
| イベント当日朝 | 「今日の予定: [イベント名]」 | MY に追加しているユーザー |
| 新スポット承認 | 「新しい聖地スポットが追加されました」 | 関連アーティストのファン |
| 修正依頼承認 | 「あなたの修正依頼が承認されました」 | 修正依頼を出したユーザー |

### 3. ユーザー設定（プロフィール画面で制御）
- 朝の通知（今日の予定）: ON/OFF + 時刻設定
- 夜の通知（明日の予定）: ON/OFF + 時刻設定
- MYイベント開始1時間前: ON/OFF
- ※ profiles テーブルに既にカラムあり（`notif_morning_on`, `notif_evening_on`, `notif_event_reminder`）

## 技術構成

### OneSignal セットアップ
- OneSignal アカウント作成 + Web Push 設定
- `public/OneSignalSDKWorker.js` 配置
- OneSignal SDK 初期化（`app/[locale]/layout.tsx` または専用コンポーネント）
- ユーザー登録時に OneSignal の `externalId` を Supabase `profiles.id` と紐づけ

### LINE セットアップ
- LINE Developers で Messaging API チャネル作成
- Webhook URL を `app/api/line/webhook/route.ts` に設定
- 友だち追加時に `line_user_id` を profiles テーブルに保存
- LINE ログイン連携（プロフィール画面の「LINE連携」ボタン）で紐づけ

### 共通通知 API
- `app/api/notify/route.ts` — 共通エントリーポイント
- `lib/notify/onesignal.ts` — OneSignal REST API 送信
- `lib/notify/line.ts` — LINE Messaging API 送信
- `lib/notify/send.ts` — 両チャネルに同時配信するラッパー
- admin の Server Actions から呼び出し
- Vercel Cron Jobs から定期実行（朝/夜の通知）

### DB 変更
- `profiles` テーブルに `onesignal_player_id` カラム追加（任意。externalId で代用可能）
- `profiles.line_user_id` は既に存在（LINE 連携済みユーザーのみ値あり）

### API キー管理
- `ONESIGNAL_APP_ID` — `.env.local`
- `ONESIGNAL_REST_API_KEY` — `.env.local`
- `LINE_CHANNEL_ACCESS_TOKEN` — `.env.local`
- `LINE_CHANNEL_SECRET` — `.env.local`

## 実装手順

### Phase 1: OneSignal セットアップ（PWA Push）
- [ ] OneSignal アカウント作成、Web Push アプリ設定
- [ ] SDK 導入（OneSignal CDN or npm パッケージ）
- [ ] Service Worker 配置
- [ ] ユーザーに通知許可を求めるUI
- [ ] externalId を profiles.id に紐づけ

### Phase 2: LINE 通知セットアップ
- [ ] LINE Developers で Messaging API チャネル作成
- [ ] Webhook エンドポイント作成（`app/api/line/webhook/route.ts`）
- [ ] プロフィール画面の「LINE連携」ボタンと紐づけ
- [ ] `line_user_id` の保存・管理

### Phase 3: 共通通知 API + admin 手動通知
- [ ] `lib/notify/send.ts`（共通配信ラッパー）作成
- [ ] `app/api/notify/route.ts` 作成
- [ ] admin お知らせ作成時に「通知も送る」オプション追加
- [ ] 配信先選択（PWA Push / LINE / 両方）
- [ ] セグメント配信（言語別、アーティスト別）

### Phase 4: 自動通知
- [ ] Vercel Cron Jobs で朝/夜の通知を実行
- [ ] イベント承認時のトリガー通知
- [ ] スポット承認時のトリガー通知
- [ ] 修正依頼承認時のトリガー通知

### Phase 5: ユーザー設定連動
- [ ] プロフィール画面の通知設定を OneSignal のタグ/セグメントと連動
- [ ] LINE 通知の ON/OFF 設定
- [ ] 通知時刻設定の反映

## 注意事項
- iOS Safari は PWA Push 通知に対応済み（iOS 16.4+）
- 通知許可のタイミング: 初回アクセスではなく、意味のあるアクション後に求める
- 通知文言は `profiles.language` に応じて多言語で送信
- 過度な通知はユーザー離脱につながるため、頻度を制限する
