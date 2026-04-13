'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'

const tabIcons = [
  { id: 'home', label: 'HOME', icon: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? '#F3B4E3' : 'none'} stroke={a ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" />
    </svg>
  )},
  { id: 'my', label: 'MY', icon: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? '#F3B4E3' : 'none'} stroke={a ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  )},
  { id: 'schedule', label: 'SCHEDULE', icon: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )},
  { id: 'map', label: 'MAP', icon: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" fill={a ? 'rgba(243,180,227,0.15)' : 'none'} />
      <circle cx="12" cy="10" r="3" fill={a ? '#F3B4E3' : 'none'} stroke={a ? '#F3B4E3' : '#6B6B70'} />
    </svg>
  )},
  { id: 'goods', label: 'GOODS', icon: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill={a ? 'rgba(243,180,227,0.1)' : 'none'} /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )},
  { id: 'profile', label: 'PROFILE', icon: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" fill={a ? 'rgba(243,180,227,0.2)' : 'none'} />
    </svg>
  )},
]

const sections: Record<string, { title: string; items: { title: string; desc: string; icon: string }[] }> = {
  home: {
    title: 'HOME',
    items: [
      { icon: '📅', title: '今日のスケジュール', desc: '今日のLIVE・チケット・イベントが自動で表示されます。国内が上、海外が下に並びます。' },
      { icon: '🆕', title: '新着スケジュール', desc: '最近追加されたスケジュールが横スクロールで表示。「+ MY」で自分のカレンダーに追加、「確認」で非表示にできます。' },
      { icon: '🎖️', title: '除隊カウントダウン', desc: 'メンバーの除隊日までの残り日数。日数が近い順に表示されます。' },
    ],
  },
  my: {
    title: 'MY',
    items: [
      { icon: '📆', title: 'MYカレンダー', desc: '自分が参加するイベントだけを管理。カレンダーの日付をタップすると、その日の予定が表示されます。' },
      { icon: '➕', title: 'イベントの追加', desc: 'スケジュール画面やHOMEの新着から「+ MY」で追加。右上の「+」から手動追加も可能です。' },
      { icon: '💺', title: '座席情報・チケット', desc: 'イベントをタップして、座席情報やチケット画像を登録できます。' },
      { icon: '⏰', title: '1時間前リマインダー', desc: 'MYに登録したイベントの1時間前にプッシュ通知でお知らせ。大事なスケジュールを逃しません。' },
    ],
  },
  schedule: {
    title: 'SCHEDULE',
    items: [
      { icon: '🏷️', title: 'タグフィルター', desc: 'LIVE / TICKET / ALBUM / TV など、カテゴリ別にスケジュールを絞り込めます。' },
      { icon: '📝', title: 'スケジュール投稿', desc: '右上の「+」から新しいスケジュールを投稿。公式ソースURLを添付してください。' },
      { icon: '👆', title: 'イベント詳細', desc: 'カードをタップで詳細表示。会場・時間・ソースURLを確認できます。' },
      { icon: '✅', title: '承認制', desc: '投稿されたスケジュールは3人のユーザーが承認すると正式に確定します。' },
    ],
  },
  map: {
    title: 'MAP',
    items: [
      { icon: '🗺️', title: '聖地巡礼マップ', desc: 'メンバーが訪れたお店・スポットが地図上にピンで表示されます。' },
      { icon: '👤', title: 'メンバーフィルター', desc: '上部のメンバーアイコンをタップで、そのメンバーのスポットだけ表示。' },
      { icon: '📋', title: 'スポット詳細', desc: 'ピンをタップ → 詳細画面。写真・住所・ジャンル・公式URLを確認。スポット情報は自由に編集できます。' },
      { icon: '✏️', title: '写真の編集', desc: '各写真の右下 ✏️ ボタンから、メンバータグ・ソースURL・訪問日を編集。' },
      { icon: '👍', title: '写真の承認', desc: '編集画面でソースURLを確認 → 「👍 承認する」を押します。メンバーとソースURLが必須です。' },
      { icon: '📷', title: '写真の投稿', desc: '「写真を投稿する」ボタンから、訪問時の写真をアップロードできます。' },
    ],
  },
  goods: {
    title: 'GOODS',
    items: [
      { icon: '🛒', title: 'グッズ管理', desc: '公式グッズやトレカの管理機能は現在準備中です。公開後にお知らせします。' },
    ],
  },
  profile: {
    title: 'PROFILE',
    items: [
      { icon: '😊', title: 'プロフィール設定', desc: 'ニックネーム・アイコン・バナー画像を設定できます。' },
      { icon: '🔔', title: '通知設定', desc: '朝・夜の通知時間を設定。「通知を許可する」ボタンでプッシュ通知を有効にしてください。' },
      { icon: '💳', title: 'ファンクラブ会員番号', desc: 'CARAT / カラモバの会員番号を安全に保存できます（自分だけに表示）。' },
      { icon: '🌏', title: '言語・居住国', desc: '表示言語と居住国を設定。居住国はスケジュールの国内/海外の判定に使います。' },
    ],
  },
}

export default function HowToPage() {
  const [activeTab, setActiveTab] = useState('home')
  const router = useRouter()
  const section = sections[activeTab]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FA' }}>
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ background: '#FFFFFF', borderBottom: '1px solid #F0F0F5' }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#F0F0F5' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>{section.title}</h1>
        <span className="text-xs" style={{ color: '#8E8E93' }}>の使い方</span>
      </header>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <div className="flex flex-col gap-3">
          {section.items.map((item, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold mb-1" style={{ color: '#1C1C1E' }}>{item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#636366' }}>{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* タブバー（本物と同じ構成） */}
      <nav
        style={{
          background: '#F8F9FA',
          borderTop: '1px solid #2E2E32',
          paddingTop: 12,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
        }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center"
      >
        {tabIcons.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 flex-1"
            >
              {tab.icon(active)}
              <span
                className="text-[9px] font-semibold tracking-wider"
                style={{ color: active ? '#F3B4E3' : '#6B6B70' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
