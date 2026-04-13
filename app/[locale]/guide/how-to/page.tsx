'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'

const sections = [
  {
    tab: 'HOME',
    icon: '🏠',
    color: '#F3B4E3',
    items: [
      { title: '今日のスケジュール', desc: '今日のLIVE・チケット・イベントが自動表示されます。国内が上、海外が下に並びます。' },
      { title: '新着スケジュール', desc: '最近追加されたスケジュールが横スクロールで表示。「+ MY」で自分のカレンダーに追加、「確認」で非表示にできます。' },
      { title: '除隊カウントダウン', desc: 'メンバーの除隊日までの残り日数が表示されます。' },
    ],
  },
  {
    tab: 'MY',
    icon: '❤️',
    color: '#FB7185',
    items: [
      { title: 'MYカレンダー', desc: '自分が参加するイベントだけを管理。カレンダーの日付をタップすると、その日の予定が表示されます。' },
      { title: 'イベントの追加', desc: 'スケジュール画面から「+ MY」で追加するか、右上の「+」から手動で追加できます。' },
      { title: '座席情報・チケット', desc: 'イベントをタップして、座席情報やチケット画像を登録できます。' },
      { title: '1時間前リマインダー', desc: 'MYに登録したイベントの1時間前にプッシュ通知でお知らせします。' },
    ],
  },
  {
    tab: 'SCHEDULE',
    icon: '📅',
    color: '#FCD34D',
    items: [
      { title: 'タグフィルター', desc: 'LIVE / TICKET / ALBUM / TV など、カテゴリ別にスケジュールを絞り込めます。' },
      { title: 'スケジュール投稿', desc: '右上の「+」から新しいスケジュールを投稿できます。公式ソースURLを添付してください。' },
      { title: 'イベント詳細', desc: 'カードをタップで詳細表示。会場・時間・ソースURLを確認できます。' },
      { title: '承認制', desc: '投稿されたスケジュールは3人のユーザーが承認すると正式に確定します。' },
    ],
  },
  {
    tab: 'MAP',
    icon: '📍',
    color: '#34D399',
    items: [
      { title: '聖地巡礼マップ', desc: 'メンバーが訪れたお店・スポットが地図上にピンで表示されます。' },
      { title: 'メンバーフィルター', desc: '上部のメンバーアイコンをタップで、そのメンバーのスポットだけ表示。' },
      { title: 'スポット詳細', desc: 'ピンをタップ → 詳細画面。写真・住所・ジャンル・公式URLを確認できます。' },
      { title: '写真の編集', desc: '各写真の右下 ✏️ ボタンから、メンバータグ・ソースURL・訪問日を編集できます。' },
      { title: '写真の承認', desc: '編集画面で情報を確認し「👍 承認する」を押します。メンバーとソースURLが必須です。' },
      { title: '写真の投稿', desc: '「写真を投稿する」ボタンから、訪問時の写真をアップロードできます。' },
    ],
  },
  {
    tab: 'GOODS',
    icon: '🛒',
    color: '#A78BFA',
    items: [
      { title: 'グッズ管理', desc: '公式グッズやトレカの管理機能（準備中）。公開後にお知らせします。' },
    ],
  },
  {
    tab: 'PROFILE',
    icon: '👤',
    color: '#6B7280',
    items: [
      { title: 'プロフィール設定', desc: 'ニックネーム・アイコン・バナー画像を設定できます。' },
      { title: '通知設定', desc: '朝・夜の通知時間を設定。「通知を許可する」ボタンでプッシュ通知を有効にしてください。' },
      { title: 'ファンクラブ会員番号', desc: 'CARAT / カラモバの会員番号を安全に保存できます（自分だけに表示）。' },
      { title: '言語・居住国', desc: '表示言語と居住国を設定。居住国はスケジュールの国内/海外の判定に使います。' },
    ],
  },
]

export default function HowToPage() {
  const [activeTab, setActiveTab] = useState(0)
  const router = useRouter()
  const section = sections[activeTab]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FA' }}>
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ background: '#FFFFFF' }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#F0F0F5' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-black" style={{ color: '#1C1C1E' }}>使い方ガイド</h1>
      </header>

      {/* タブ切り替え */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {sections.map((s, i) => (
          <button
            key={s.tab}
            onClick={() => setActiveTab(i)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
            style={i === activeTab
              ? { background: s.color, color: '#FFFFFF' }
              : { background: '#FFFFFF', color: '#636366', border: '1px solid #E5E5EA' }
            }
          >
            {s.icon} {s.tab}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div className="flex-1 px-4 pb-8">
        <div className="flex flex-col gap-3">
          {section.items.map((item, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black"
                  style={{ background: section.color + '18', color: section.color }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold mb-1" style={{ color: '#1C1C1E' }}>{item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#636366' }}>{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
