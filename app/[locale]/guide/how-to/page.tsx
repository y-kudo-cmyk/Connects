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

// ── 各画面のモックアップ ──────────────────────────────────────
function MockHome() {
  return (
    <div className="flex flex-col gap-3">
      {/* 今日のスケジュール */}
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F3B4E3' }} />
          <span className="text-[10px] font-bold" style={{ color: '#636366' }}>TODAY&apos;S SCHEDULE</span>
        </div>
        {[
          { tag: '🎤 LIVE', title: 'WORLD TOUR IN JAPAN', venue: '東京ドーム', time: '17:30', color: '#F3B4E3' },
          { tag: '🎫 TICKET', title: 'ファンミーティング先行抽選', venue: '申込締切', time: '23:59', color: '#FCD34D' },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderTop: i > 0 ? '1px solid #F0F0F5' : 'none' }}>
            <div className="flex flex-col items-center w-10">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.color + '20', color: e.color }}>{e.tag.split(' ')[1]}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: '#1C1C1E' }}>{e.title}</p>
              <p className="text-[10px]" style={{ color: '#8E8E93' }}>📍 {e.venue} {e.time}</p>
            </div>
          </div>
        ))}
        <p className="text-[10px] mt-2 text-center" style={{ color: '#C7C7CC' }}>← 今日のイベントが自動で表示されます</p>
      </div>
      {/* 新着 */}
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F3B4E3' }} />
          <span className="text-[10px] font-bold" style={{ color: '#636366' }}>NEW SCHEDULE</span>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {['FANMEETING', 'ALBUM発売', 'TV出演'].map((t, i) => (
            <div key={i} className="flex-shrink-0 w-28 rounded-lg overflow-hidden" style={{ background: '#F0F0F5' }}>
              <div className="h-16 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${['#E8D5F5','#D5E5F5','#F5D5E8'][i]} 0%, #F0F0F5 100%)` }}>
                <span className="text-lg opacity-40">{['🎤','💿','📺'][i]}</span>
              </div>
              <div className="p-2">
                <p className="text-[9px] font-bold" style={{ color: '#1C1C1E' }}>{t}</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#F0F0F5', color: '#636366' }}>確認</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#F3B4E3', color: '#FFF' }}>+ MY</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-2 text-center" style={{ color: '#C7C7CC' }}>← 「+ MY」でカレンダーに追加</p>
      </div>
    </div>
  )
}

function MockMy() {
  const days = [' ', ' ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold" style={{ color: '#1C1C1E' }}>2026年5月</span>
          <span className="text-[10px]" style={{ color: '#8E8E93' }}>◀ ▶</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['日','月','火','水','木','金','土'].map(d => (
            <span key={d} className="text-[9px] font-bold" style={{ color: '#8E8E93' }}>{d}</span>
          ))}
          {days.map((d, i) => (
            <div key={i} className="relative h-7 flex items-center justify-center">
              <span className="text-[10px]" style={{ color: d === '13' || d === '14' ? '#F3B4E3' : '#1C1C1E' }}>{d}</span>
              {(d === '13' || d === '14') && <span className="absolute bottom-0 w-1 h-1 rounded-full" style={{ background: '#F3B4E3' }} />}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-center" style={{ color: '#C7C7CC' }}>← 日付をタップでその日の予定を表示</p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center gap-3 py-2">
          <div className="w-1 h-10 rounded-full" style={{ background: '#F3B4E3' }} />
          <div>
            <p className="text-xs font-bold" style={{ color: '#1C1C1E' }}>FANMEETING &apos;YAKUSOKU&apos;</p>
            <p className="text-[10px]" style={{ color: '#8E8E93' }}>📍 東京ドーム 17:30</p>
          </div>
        </div>
        <p className="text-[10px] mt-1 text-center" style={{ color: '#C7C7CC' }}>← タップで座席・チケット情報を登録</p>
      </div>
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
        <span className="text-base">⏰</span>
        <p className="text-[10px] font-bold" style={{ color: '#60A5FA' }}>イベント1時間前にリマインダー通知が届きます</p>
      </div>
    </div>
  )
}

function MockSchedule() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {[
            { label: '🎤 LIVE', active: true },
            { label: '🎫 TICKET', active: false },
            { label: '💿 ALBUM', active: false },
            { label: '📺 TV', active: false },
            { label: '📢 INFO', active: false },
          ].map((t, i) => (
            <span key={i} className="text-[9px] font-bold px-2 py-1 rounded-full"
              style={t.active ? { background: '#F3B4E3', color: '#FFF' } : { background: '#F0F0F5', color: '#636366' }}>
              {t.label}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-center" style={{ color: '#C7C7CC' }}>← タグで絞り込み</p>
      </div>
      {[
        { date: '5/13', tag: 'LIVE', title: 'FANMEETING YAKUSOKU', venue: '東京ドーム', status: '✓' },
        { date: '5/14', tag: 'LIVE', title: 'FANMEETING YAKUSOKU', venue: '東京ドーム', status: '2/3' },
      ].map((e, i) => (
        <div key={i} className="rounded-2xl p-4 flex gap-3" style={{ background: '#FFFFFF' }}>
          <div className="flex flex-col items-center">
            <span className="text-xs font-black" style={{ color: '#F3B4E3' }}>{e.date}</span>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded mt-1" style={{ background: 'rgba(243,180,227,0.15)', color: '#F3B4E3' }}>{e.tag}</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: '#1C1C1E' }}>{e.title}</p>
            <p className="text-[10px]" style={{ color: '#8E8E93' }}>📍 {e.venue}</p>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full h-fit"
            style={e.status === '✓' ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' } : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
            {e.status}
          </span>
        </div>
      ))}
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
        <span className="text-base">✅</span>
        <p className="text-[10px] font-bold" style={{ color: '#A78BFA' }}>3人が承認すると ✓ マークがつきます</p>
      </div>
    </div>
  )
}

function MockMap() {
  return (
    <div className="flex flex-col gap-3">
      {/* 地図エリア */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#E8EEF4', height: 160, position: 'relative' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="0.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        {/* ピン */}
        {[
          { top: 30, left: '30%', color: '#F3B4E3' },
          { top: 50, left: '55%', color: '#34D399' },
          { top: 70, left: '40%', color: '#FCD34D' },
          { top: 40, left: '70%', color: '#F87171' },
        ].map((p, i) => (
          <div key={i} className="absolute" style={{ top: p.top, left: p.left }}>
            <svg width="16" height="20" viewBox="0 0 24 28" fill={p.color} stroke="#FFF" strokeWidth="1.5">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 16 12 16s12-7 12-16c0-6.6-5.4-12-12-12z" />
              <circle cx="12" cy="11" r="4" fill="#FFF" />
            </svg>
          </div>
        ))}
        {/* メンバーフィルター */}
        <div className="absolute top-2 left-2 right-2 flex gap-1">
          {['ALL', 'S.C', 'JH', 'JS', 'JN', 'HS'].map((m, i) => (
            <span key={i} className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
              style={i === 0 ? { background: '#F3B4E3', color: '#FFF' } : { background: 'rgba(255,255,255,0.9)', color: '#636366' }}>
              {m}
            </span>
          ))}
        </div>
        <p className="absolute bottom-2 left-0 right-0 text-[10px] text-center" style={{ color: '#636366' }}>← メンバー別にピンをフィルター</p>
      </div>
      {/* スポット詳細 */}
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
        <p className="text-sm font-bold mb-1" style={{ color: '#1C1C1E' }}>☕ Cafe Example</p>
        <p className="text-[10px] mb-2" style={{ color: '#8E8E93' }}>📍 東京都渋谷区...</p>
        <div className="flex gap-2">
          <div className="w-20 h-16 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8D5F5, #F5D5E8)' }}>
            <span className="text-lg opacity-40">📷</span>
          </div>
          <div className="w-20 h-16 rounded-lg flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #D5E5F5, #E8D5F5)' }}>
            <span className="text-lg opacity-40">📷</span>
            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <span className="text-[7px]" style={{ color: '#FFF' }}>✏️</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#F59E0B18', color: '#F59E0B' }}>#HOSHI</span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#3B82F618', color: '#3B82F6' }}>#SEVENTEEN</span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>👍 2/3</span>
        </div>
        <p className="text-[10px] mt-2 text-center" style={{ color: '#C7C7CC' }}>← 写真の ✏️ からメンバー・ソースを編集＆承認</p>
      </div>
    </div>
  )
}

function MockGoods() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(167,139,250,0.1)' }}>
        <span className="text-4xl">🛒</span>
      </div>
      <p className="text-base font-bold mb-2" style={{ color: '#1C1C1E' }}>Coming Soon</p>
      <p className="text-xs" style={{ color: '#8E8E93' }}>公式グッズ・トレカの管理機能を準備中です</p>
    </div>
  )
}

function MockProfile() {
  return (
    <div className="flex flex-col gap-3">
      {/* プロフィールカード */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
        <div className="h-16" style={{ background: 'linear-gradient(135deg, #F3B4E3, #C97AB8)' }} />
        <div className="px-4 pb-4 -mt-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 border-white" style={{ background: '#F0F0F5' }}>👤</div>
          <p className="text-sm font-bold mt-1" style={{ color: '#1C1C1E' }}>ニックネーム</p>
          <p className="text-[10px]" style={{ color: '#8E8E93' }}>投稿 292 / 承認 0</p>
        </div>
      </div>
      {/* 設定項目 */}
      {[
        { icon: '🔔', label: '通知設定', desc: '朝・夜の通知時間を設定' },
        { icon: '💳', label: 'FC会員番号', desc: 'CARAT・カラモバの番号を安全に保存' },
        { icon: '🌏', label: '言語・居住国', desc: 'スケジュールの国内/海外判定に使用' },
      ].map((s, i) => (
        <div key={i} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#FFFFFF' }}>
          <span className="text-base">{s.icon}</span>
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: '#1C1C1E' }}>{s.label}</p>
            <p className="text-[10px]" style={{ color: '#8E8E93' }}>{s.desc}</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
      ))}
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(243,180,227,0.1)', border: '1px solid rgba(243,180,227,0.2)' }}>
        <span className="text-base">🔔</span>
        <p className="text-[10px] font-bold" style={{ color: '#F3B4E3' }}>「通知を許可する」を押して通知を有効にしてください</p>
      </div>
    </div>
  )
}

const screenMocks: Record<string, () => JSX.Element> = {
  home: MockHome,
  my: MockMy,
  schedule: MockSchedule,
  map: MockMap,
  goods: MockGoods,
  profile: MockProfile,
}

const screenTitles: Record<string, string> = {
  home: 'HOME',
  my: 'MY',
  schedule: 'SCHEDULE',
  map: 'MAP',
  goods: 'GOODS',
  profile: 'PROFILE',
}

export default function HowToPage() {
  const [activeTab, setActiveTab] = useState('home')
  const router = useRouter()
  const Mock = screenMocks[activeTab]

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
        <h1 className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>{screenTitles[activeTab]}</h1>
        <span className="text-xs" style={{ color: '#8E8E93' }}>の使い方</span>
      </header>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <Mock />
      </div>

      {/* タブバー */}
      <nav
        style={{
          background: '#F8F9FA',
          borderTop: '1px solid #2E2E32',
          paddingTop: 12,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
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
              <span className="text-[9px] font-semibold tracking-wider" style={{ color: active ? '#F3B4E3' : '#6B6B70' }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
