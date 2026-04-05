@AGENTS.md

## プロジェクト概要
K-POPファン向けスケジュール＆聖地巡礼アプリ「Connects+」

## 技術スタック
- Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- DB / Auth / Storage: Supabase
- 地図: Leaflet (react-leaflet)
- チケット解析: Gemini API (`/api/analyze-ticket`)
- 通知: OneSignal (LINE Webhookから段階的に移行)
- X自動投稿: `/api/post-x`
- スクレイピング: Apify → Vercel Cron Jobs

## 認証
- Supabase Auth (メール + Google + X ソーシャルログイン)
- `lib/supabase/client.ts` (ブラウザ用)
- `lib/supabase/server.ts` (サーバー用)
- `middleware.ts` (セッション管理)

## 承認制ルール
- 全情報（運営投稿含む）に対して3人の承認が必要
- 承認3人未満: 直接編集可能（確認画面で修正して承認）
- 承認3人達成後: 修正依頼をコメント形式で投稿 → 3票で上書き
- 対象: スケジュール、聖地スポット、写真、URL

## 設計方針
- 将来的に複数アーティスト対応できる構造 (artist_id)
- 有料/無料フラグ (PAID_FEATURE_ENABLED=false) 維持
- 画像はWebP形式
- 多言語対応 (ja/ko/en) を考慮
- 日時表記: 時間があるものはすべて「MM/DD HH:MM」形式
- 韓国の地図URL: NAVER MAP / それ以外: Google Maps Web版
