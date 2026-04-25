# Connects+ プロジェクト概要

## サービス概要
K-POPファン向けのスケジュール管理＆聖地巡礼アプリ。現在SEVENTEENに特化、将来的に複数アーティスト対応予定。Glide（ノーコード）で運用中のアプリをNext.js + Supabaseでフルリビルド中。

**本番URL**: https://app.connectsplus.net
**GitHub**: https://github.com/y-kudo-cmyk/Connects

---

## 技術スタック

| カテゴリ | 技術 | 用途 |
|---|---|---|
| フロントエンド | Next.js 16 + React 19 + TypeScript | アプリ本体（PWA） |
| スタイリング | Tailwind CSS v4 | UI |
| UIコンポーネント | shadcn/ui (base-nova) | 管理画面等のUIコンポーネント |
| DB / Auth / Storage | Supabase | PostgreSQL + 認証 + ファイル保存 |
| ホスティング | Vercel | デプロイ・CDN |
| 地図 | Leaflet (react-leaflet) | 聖地巡礼MAP |
| AI解析 | Google Gemini API | チケット画像のOCR解析 |
| 通知 | OneSignal | プッシュ通知（LINE Webhookから移行中） |
| SNS連携 | X (Twitter) API | 新着スポットの自動投稿 |
| スクレイピング | Apify | 公式サイト・X・Weverseからの自動データ取得 |
| 定期実行 | Vercel Cron Jobs | スクレイピングの定期実行 |
| 旧システム | Glide (Google Sheets) | 並行稼働中（段階的に移行） |

---

## 現在の進捗状況

### 完了済み
- [x] Next.js アプリの基本UI（全画面）
- [x] Supabase プロジェクト作成・テーブル設計（17テーブル）
- [x] RLS（Row Level Security）ポリシー設定
- [x] 3票自動承認トリガー（イベント・写真・修正依頼）
- [x] Glideデータのインポート（スケジュール241件、スポット126件、写真158件、アーティスト36件）
- [x] HOME画面 → Supabase接続
- [x] スケジュール画面 → Supabase接続
- [x] MAP画面（イベント部分）→ Supabase接続
- [x] Supabase Auth セットアップ（メール OTP + Google + X）
- [x] Vercel デプロイ・自動ビルド
- [x] 認証コールバック処理
- [x] タグ・ジャンル設定ファイル（lib/config/tags.ts）

### 未完了（対応が必要）
- [x] **Auth移行の完了** — Supabase Auth（middleware + AuthGuard）で認証保護を有効化済み
- [ ] **MAP（スポット）→ Supabase接続** — 現在まだmockData
- [ ] **MYカレンダー → Supabase接続** — 現在localStorage
- [ ] **TODO → Supabase接続** — 現在localStorage
- [ ] **プロフィール → Supabase接続** — 現在localStorage
- [ ] **ユーザーデータ移行** — Glideの1,250ユーザーをSupabase Authに紐づけ
- [ ] **MYカレンダーデータ移行** — Glideの6,540件を移行
- [ ] **画像のSupabase Storage移行** — Google Drive → Supabase Storage
- [x] **Storage RLSポリシー設定（DB）** — event-images バケットの閲覧・アップロードポリシー設定済み
- [x] **承認制UI（イベント）** — useVotingフック・EventDetailModal承認ボタン・EventCardバッジ実装済み
- [ ] **承認制UI（スポット・写真・URL）** — スポット投稿のSupabase接続、写真投票、URL提案UIが未実装
- [x] **profiles自動作成トリガー（DB）** — `handle_new_user` トリガー作成済み。※ `useVoting.ts` の `ensureProfile` と `auth/callback/route.ts` のprofile作成コードは削除可能
- [x] **auto_confirm_eventトリガー修正（DB）** — 投票ごとにverified_count更新するよう修正済み
- [ ] **管理画面（/admin）** — 投稿管理・承認設定・ユーザー管理・お知らせ・タグ・アーティスト管理。詳細は `docs/admin-requirements.md`
- [ ] **Apify連携** — 公式サイト・SNSからの自動データ取得
- [ ] **OneSignal連携** — プッシュ通知
- [ ] **X自動投稿** — 新着スポットの自動ポスト
- [ ] **Gemini API連携** — チケット画像解析
- [ ] **多言語対応** — 日本語・韓国語・英語
- [ ] **GOODS機能** — トレカ管理（COMING SOON状態）
- [ ] **CSVインポートの残り8件** — 日付なし等でスキップされたイベント
- [ ] **Supabase Auth Google/X プロバイダー設定** — OAuth クレデンシャルの設定

---

## DB構成（Supabase - 17テーブル）

### マスタデータ
| テーブル | 件数 | 説明 |
|---|---|---|
| `artists` | 36 | アーティスト・メンバー・ユニット |
| `schedule_tags` | 13 | スケジュールタグ定義（LIVE, TICKET, CD等） |

### コンテンツデータ
| テーブル | 件数 | 説明 |
|---|---|---|
| `events` | 241 | スケジュール（運営 + ユーザー投稿） |
| `spots` | 126 | 聖地巡礼スポット |
| `spot_photos` | 158 | スポット写真 |
| `announcements` | - | 運営からのお知らせ |

### ユーザーデータ
| テーブル | 件数 | 説明 |
|---|---|---|
| `profiles` | - | ユーザープロフィール（Auth移行後に紐づけ） |
| `my_entries` | - | MYカレンダー記録 |
| `todos` | - | TODO |
| `fan_club_memberships` | - | ファンクラブ会員情報 |
| `favorite_spots` | - | お気に入りスポット |

### 承認システム
| テーブル | 説明 |
|---|---|
| `event_votes` | イベント承認投票（3票で自動confirmed） |
| `spot_photo_votes` | 写真承認投票（3票で自動confirmed） |
| `edit_requests` | 修正依頼（承認済み情報への変更提案） |
| `edit_request_votes` | 修正依頼の承認投票（3票で自動上書き） |
| `url_submissions` | URL提案（HP募集中から） |

---

## 承認制の仕組み

全ての情報（運営投稿含む）に対して3人の承認が必要。

1. **承認3人未満**: ユーザーが直接編集・修正可能
2. **承認3人達成**: 情報が確定。以降の変更は修正依頼フォームから
3. **修正依頼**: コメント形式で投稿 → 3票で元情報を上書き

対象: スケジュール、聖地スポット、写真、URL

---

## タグ体系（schedule_tags）

| ID | 表示名 | アイコン |
|---|---|---|
| LIVE | LIVE | 🎤 |
| TICKET | TICKET | 🎫 |
| CD | CD | 💿 |
| LUCKY_DRAW | LUCKY DRAW | 🂠 |
| POPUP | POPUP | 🏪 |
| MERCH | MERCH | 🛒 |
| RELEASE | RELEASE | 📀 |
| BIRTHDAY | BIRTHDAY | 🎂 |
| MAGAZINE | MAGAZINE | 📖 |
| EVENT | EVENT | ❤️ |
| TV | TV | 📺 |
| YOUTUBE | YOUTUBE | ▶️ |
| RADIO | RADIO | 📻 |

---

## 環境変数（Vercel / .env.local）

| 変数名 | 用途 | 設定状況 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | ✅ 設定済み |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー | ✅ 設定済み |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 管理キー（サーバーのみ） | ローカルのみ |
| `REFERRAL_MASTER_CODES` | 招待コード | ✅ 設定済み |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API | 未設定 |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | OneSignal | 未設定 |
| `X_API_KEY` / `X_API_SECRET` | X API | 未設定 |

---

## ディレクトリ構成

```
connects-plus/
├── app/                    # Next.js App Router
│   ├── (main)/             # 認証必須ページ
│   │   ├── page.tsx        # HOME
│   │   ├── schedule/       # スケジュール
│   │   ├── map/            # 聖地巡礼MAP
│   │   ├── my/             # MYカレンダー
│   │   ├── goods/          # GOODS（COMING SOON）
│   │   └── profile/        # プロフィール
│   ├── login/              # ログイン
│   ├── join/               # 招待コード
│   ├── onboarding/         # 初回設定
│   ├── auth/callback/      # Auth コールバック
│   └── api/                # APIルート
├── components/             # UIコンポーネント
├── lib/
│   ├── supabase/           # Supabase クライアント・フック
│   │   ├── client.ts       # ブラウザ用
│   │   ├── server.ts       # サーバー用
│   │   ├── middleware.ts   # セッション管理
│   │   ├── useAuth.ts      # 認証フック
│   │   ├── useEvents.ts    # イベント取得
│   │   ├── useSpots.ts     # スポット取得
│   │   └── adapters.ts     # DB→アプリ型変換
│   ├── config/
│   │   └── tags.ts         # タグ・ジャンル設定
│   ├── mockData.ts         # 旧モックデータ（段階的に廃止）
│   └── use*.ts             # 各種フック（localStorage → Supabase移行予定）
├── docs/
│   └── supabase-schema.sql # DB定義
├── scripts/
│   └── import-data.ts      # Glide CSV → Supabase インポート
├── middleware.ts            # 認証ミドルウェア（Supabase Auth）
└── data/glide-export/      # Glideエクスポートデータ（.gitignore）
```

---

## 設計方針
- 将来的に複数アーティスト対応（artist_id で分離）
- 有料/無料フラグ（PAID_FEATURE_ENABLED）を維持
- 画像はWebP形式推奨
- 多言語対応（ja/ko/en）を考慮した構造
- 韓国の地図URL: NAVER MAP / それ以外: Google Maps Web版
- 日時表記: 時間があるものはすべて「MM/DD HH:MM」形式
