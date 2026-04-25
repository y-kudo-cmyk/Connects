# 一斉メール送信 セットアップ手順

## A. Resend アカウント作成 + ドメイン認証

### 1. Resend アカウント作成
1. https://resend.com にアクセスしサインアップ
2. 「Personal」プランで OK (あとで有料切替)

### 2. ドメイン追加
1. Resend 管理画面 → **Domains** → **Add Domain**
2. `connectsplus.net` を入力 (サブドメイン `mail.connectsplus.net` でも可、サブドメイン推奨)
3. Resend が表示する DNS レコード **3種** をコピー:
   - **SPF** (TXT): `v=spf1 include:amazonses.com ~all`
   - **DKIM** (CNAME x2 or TXT): `resend._domainkey.connectsplus.net ...`
   - **MX** (optional, bounce 追跡用)

### 3. DNS 設定
ドメイン管理画面 (お名前.com / Cloudflare / Route53 等) で上記 3 レコードを追加。

**確認:**
```sh
# SPF確認
dig TXT connectsplus.net +short | grep spf1
# DKIM確認
dig CNAME resend._domainkey.connectsplus.net +short
```

### 4. Resend での認証
DNS 反映後 (15分〜1時間)、Resend 管理画面で **Verify** ボタンを押す → 全部緑になれば OK。

### 5. API Key 発行
1. Resend → **API Keys** → **Create API Key**
2. Name: `connects-plus-prod` / Permission: **Full access**
3. 発行された `re_xxxxxxxxxxxxxx` を保存

### 6. 有料プラン切替 (送信直前)
無料は 100通/日上限なので、本番送信の前日までに **Pro $20/月** にアップグレード。

### 7. 環境変数設定
`.env.local` と Vercel 環境変数 (Production) に追加:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxx
RESEND_FROM=info@connectsplus.net
UNSUBSCRIBE_SECRET=<openssl rand -hex 32 で生成した 64文字>
APP_URL=https://app.connectsplus.net
```

---

## C. 配信停止インフラ (実装済み)

### DB
`scripts/sql/add_email_unsubscribes.sql` を Supabase SQL Editor で実行して
`email_unsubscribes` テーブルを作成。

### API
- `/api/unsubscribe?email=...&token=...` が実装済み
- GET/POST 両対応 (Gmail/Apple の 1-click List-Unsubscribe 対応)
- HMAC-SHA256 トークンでステートレス検証
- 成功時は HTML 成功ページ表示

### トークン生成 (メール送信時)
`lib/email/unsubscribe.ts` の `unsubscribeUrl(email)` を呼ぶと
完全な URL が返る。

---

## B. メール文面 (後で作成)

送信直前に決める項目:
- 件名 (subject)
- 本文 HTML (レスポンシブ)
- 本文プレーンテキスト (キャリア向け)
- CTA ボタン (新ドメインへの誘導)
- 差出人表記 (info@connectsplus.net / Connects+)

---

## 送信スクリプト (実装予定)
`scripts/_bulk-announce.mjs`:
- profiles + glide_users の合算ユニークメール取得
- `email_unsubscribes` に存在するアドレスは除外
- Resend API に 100通/分で送信
- 失敗ログは `email_send_log` テーブルに記録 (別途作成)
- 成功率レポート出力

---

## 法的要件チェックリスト
- [x] 配信停止リンク (特電法必須)
- [x] 差出人の明示 (送信者情報)
- [ ] プライバシーポリシーへのリンク
- [ ] 受信者の事前同意 (利用規約同意 = みなし同意)
