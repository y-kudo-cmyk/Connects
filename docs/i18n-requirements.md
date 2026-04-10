# 多言語化（i18n）要件

## 概要
アプリ全体を日本語・韓国語・英語の3言語に対応させる。
現在は全テキストが日本語ハードコード。

## 対応言語
- `ja` — 日本語（デフォルト）
- `ko` — 韓国語
- `en` — 英語

## 採用ライブラリ
- **next-intl** (https://next-intl.dev/)
- App Router 対応、Server/Client Components 両方で使用可能
- ICU メッセージ構文（変数展開、複数形など）
- TypeScript 型安全

## URL 戦略
- `localePrefix: 'never'` — URLにロケールプレフィックスを付けない
- 現在のURL構造（`/schedule`, `/admin/posts` 等）を維持
- ユーザーの言語設定は `profiles.language` カラムから取得

## ディレクトリ構成

```
Connects/
├── i18n/
│   ├── routing.ts          # defineRouting 設定
│   └── request.ts          # getRequestConfig（locale 解決）
├── messages/
│   ├── ja.json             # 日本語メッセージ
│   ├── ko.json             # 韓国語メッセージ
│   └── en.json             # 英語メッセージ
├── app/
│   └── [locale]/           # 既存ページを移動
│       ├── (main)/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── schedule/
│       │   ├── map/
│       │   ├── my/
│       │   ├── goods/
│       │   └── profile/
│       ├── admin/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── posts/
│       │   ├── approvals/
│       │   ├── users/
│       │   ├── announcements/
│       │   ├── tags/
│       │   └── artists/
│       ├── login/
│       ├── join/
│       └── onboarding/
├── next.config.ts          # withNextIntl プラグイン追加
└── middleware.ts            # next-intl middleware と Supabase middleware を統合
```

## 設定ファイル

### next.config.ts
- `createNextIntlPlugin` でラップ

### i18n/routing.ts
```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ja', 'ko', 'en'],
  defaultLocale: 'ja',
  localePrefix: 'never',
});
```

### i18n/request.ts
- `getRequestConfig` で locale を解決
- 未認証時: cookie or Accept-Language ヘッダーからフォールバック
- 認証済み: `profiles.language` を使用

## middleware 統合
現在の middleware は以下を担当：
1. Supabase セッションリフレッシュ
2. 未認証ユーザーのリダイレクト
3. admin ロールチェック

next-intl の middleware と統合が必要：
- next-intl の `createMiddleware` を直接使わず、手動で locale 解決
- `getLocale()` 相当の処理を Supabase middleware 内に組み込む
- 参考: https://next-intl.dev/docs/routing/middleware#composing-other-middlewares

## メッセージファイル構成（messages/*.json）

```json
{
  "Common": {
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除",
    "edit": "編集",
    "search": "検索",
    "loading": "読み込み中...",
    "confirm": "確認",
    "back": "戻る"
  },
  "Nav": {
    "schedule": "スケジュール",
    "map": "聖地マップ",
    "my": "MY",
    "goods": "グッズ",
    "profile": "プロフィール"
  },
  "Schedule": {
    "title": "スケジュール",
    "addNew": "新規投稿",
    "noEvents": "イベントはありません"
  },
  "Admin": {
    "dashboard": "ダッシュボード",
    "posts": "投稿管理",
    "approvals": "承認設定",
    "users": "ユーザー管理",
    "announcements": "お知らせ管理",
    "tags": "タグ管理",
    "artists": "アーティスト管理",
    "backToApp": "アプリに戻る"
  },
  "Auth": {
    "login": "ログイン",
    "logout": "ログアウト",
    "signUp": "新規登録"
  }
}
```

## 移行手順

### Phase 1: セットアップ ✅
- [x] next-intl インストール (`npm install next-intl`)
- [x] `i18n/routing.ts`, `i18n/request.ts` 作成
- [x] `next.config.ts` に withNextIntl 追加
- [x] `messages/ja.json` 作成（まず日本語のみ）

### Phase 2: ファイル構造変更 ✅
- [x] `app/` 配下を `app/[locale]/` に移動
- [x] `app/[locale]/layout.tsx` に `NextIntlClientProvider` 追加
- [x] middleware を next-intl と Supabase で統合

### Phase 3: テキスト置換 ✅
- [x] 全ページの日本語ハードコードを `useTranslations()` / `getTranslations()` に置換
- [x] admin 画面は日本語ハードコードで確定（日本人のみ使用）

### Phase 4: 翻訳追加 ✅
- [x] `messages/ko.json` 作成（既存 translations.ts から自動生成）
- [x] `messages/en.json` 作成（既存 translations.ts から自動生成）

### Phase 5: 言語切替UI ✅
- [x] プロフィール設定画面の言語選択（既存UIを `NEXT_LOCALE` cookie に連動）
- [x] 選択時に `profiles.language` を更新（既存機能）
- [x] ログイン前の言語切替（onboarding で `NEXT_LOCALE` cookie をセット）

### Phase 6: コンテンツの多言語対応（未着手）
- [ ] `events` テーブルの多言語対応（`event_title_ja/ko/en` またはの `event_translations` テーブル）
- [ ] `spots` テーブルの多言語対応（`spot_name` 等）
- [ ] `announcements` テーブルの多言語対応
- [ ] admin 画面での多言語入力フォーム
- [ ] ユーザーの言語に応じた表示切替

※ Phase 6 は韓国語・英語ユーザーが増えてから着手。現在はイベント名の多くが英語/ローマ字で言語に依存しないため、優先度は低い。

## 注意事項
- 日時表記はロケールに関わらず「MM/DD HH:MM」形式を維持（CLAUDE.md ルール）
- 地図URL: 韓国 → NAVER MAP / それ以外 → Google Maps（言語ではなく国で判定）
- DB に格納されるユーザー投稿コンテンツ（イベントタイトル等）は現時点では翻訳対象外（Phase 6 で対応予定）
- shadcn コンポーネントの aria-label 等も多言語化対象
