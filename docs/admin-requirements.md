# 管理画面（/admin）要件

## 概要
運営者（非エンジニア）が設定変更やコンテンツ管理を行うための管理画面。
`profiles.role = 'admin'` のユーザーのみアクセス可能。

## URL
`/admin`（middleware で role チェック）

## 機能一覧

### 1. 投稿管理（優先度: 高）
- pending / confirmed / rejected のイベント一覧
- spam投稿の削除
- ステータスの手動変更（強制承認・却下）
- 投稿者情報の表示

### 2. 承認設定（優先度: 高）
- 承認閾値の変更（現在: 3人）
  - 現状 `VOTE_THRESHOLD = 3` がコードにハードコード
  - DB or 環境変数で管理する方式に変更が必要
- 投票履歴の確認（誰がどのイベントに投票したか）

### 3. ユーザー管理（優先度: 中）
- ユーザー一覧（profiles テーブル）
- role の変更（user → admin）
- ban / 利用停止
- 投稿数・承認数の確認

### 4. お知らせ管理（優先度: 中）
- announcements テーブルの CRUD
- 現在は DB 直接操作でしか追加できない
- タイプ（重要 / お知らせ）、表示期間の設定

### 5. タグ管理（優先度: 低）
- schedule_tags テーブルの一覧・追加・編集・並び替え
- `lib/config/tags.ts` とDB両方に反映が必要
  - 将来的にはDBのみで管理する方式に統一

### 6. アーティスト管理（優先度: 低）
- artists テーブルの一覧・追加・編集
- 現在 SEVENTEEN + メンバー36件がインポート済み
- 将来的に複数グループ対応時に必要

## 技術的な前提
- `app/admin/` ディレクトリに配置
- Server Component + Supabase server client（service role key ではなく RLS で制御）
- `middleware.ts` に admin パスの role チェックを追加
- UIはアプリ本体と同じ Tailwind CSS で統一

## アクセス制御
- `profiles.role = 'admin'` のユーザーのみ
- middleware で `/admin/*` へのアクセス時に profiles.role を確認
- admin 以外は `/` にリダイレクト

## 現在の admin ユーザー
- DB の profiles テーブルで `role = 'admin'` に設定が必要
- 現在 admin ユーザーは未設定（全員 `role = 'user'`）

## 依存する未完了タスク
- [ ] Dashboard SQL: `handle_new_user` トリガー実行
- [ ] Dashboard SQL: Storage RLS ポリシー設定
- [ ] Dashboard SQL: `auto_confirm_event` トリガー修正（投票ごとに verified_count 更新）
