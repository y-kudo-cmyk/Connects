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

// ── 吹き出し ──
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mt-2 mb-1 mx-2 px-3 py-2 rounded-xl text-[10px] font-bold leading-relaxed"
      style={{ background: 'rgba(243,180,227,0.1)', color: '#C97AB8', border: '1px solid rgba(243,180,227,0.3)' }}>
      💡 {children}
    </div>
  )
}

// ── HOME ──
function MockHome() {
  const DAY = ['日','月','火','水','木','金','土']
  const now = new Date()
  const d = now.getDate()
  const dow = DAY[now.getDay()]
  return (
    <div className="flex flex-col gap-0">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F3B4E3' }}>
            <span className="text-xs font-black text-white">C+</span>
          </div>
          <span className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>HOME</span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F0F0F5' }}>
          <span className="text-xs">＋</span>
        </div>
      </div>

      {/* 今日のスケジュール */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F3B4E3' }} />
          <span className="text-[10px] font-bold" style={{ color: '#636366' }}>TODAY&apos;S SCHEDULE — {now.getMonth()+1}/{d}({dow})</span>
        </div>
      </div>
      <div className="px-4 flex flex-col gap-2 mb-1">
        {[
          { tag: '🎤 LIVE', color: '#F3B4E3', title: 'WORLD TOUR IN JAPAN', sub: '東京公演 Day1', venue: '東京ドーム', time: '17:30' },
          { tag: '🎫 TICKET', color: '#FCD34D', title: 'FANMEETING 先行抽選受付', sub: '当落発表', venue: '申込締切', time: '23:59' },
          { tag: '📺 TV', color: '#60A5FA', title: 'ミュージックステーション', sub: '', venue: 'テレビ朝日', time: '21:00' },
        ].map((e, i) => (
          <div key={i} className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: '#FFFFFF' }}>
            <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.color + '18', color: e.color }}>{e.tag}</span>
                <span className="text-[10px] font-bold" style={{ color: '#8E8E93' }}>{e.time}</span>
              </div>
              <p className="text-xs font-bold mt-0.5 truncate" style={{ color: '#1C1C1E' }}>{e.title}</p>
              {e.sub && <p className="text-[10px]" style={{ color: '#636366' }}>{e.sub}</p>}
              <p className="text-[10px]" style={{ color: '#8E8E93' }}>📍 {e.venue}</p>
            </div>
          </div>
        ))}
      </div>
      <Tip>今日のスケジュールが自動表示。LIVE → TICKET → TV の順に並びます</Tip>

      {/* 新着 */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F3B4E3' }} />
          <span className="text-[10px] font-bold" style={{ color: '#636366' }}>NEW SCHEDULE</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>3件</span>
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 pb-2">
        {[
          { tag: '🎤 LIVE', color: '#F3B4E3', title: 'FANMEETING YAKUSOKU', date: '5/13(水)' },
          { tag: '💿 ALBUM', color: '#A78BFA', title: 'DxS 1st Mini Album', date: '5/1(木)' },
          { tag: '📢 INFO', color: '#6B7280', title: '特設サイトオープン', date: '4/13(日)' },
        ].map((e, i) => (
          <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden" style={{ background: '#FFFFFF', width: 160 }}>
            <div className="h-20 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${e.color}15, ${e.color}08)` }}>
              <span className="text-2xl opacity-30">{e.tag.split(' ')[0]}</span>
              <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.color + '20', color: e.color }}>{e.tag}</span>
            </div>
            <div className="p-2.5">
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: e.color + '15', color: e.color }}>{e.date}</span>
              <p className="text-[10px] font-bold mt-1 leading-tight" style={{ color: '#1C1C1E' }}>{e.title}</p>
              <div className="flex gap-1 mt-1.5">
                <span className="text-[8px] font-bold px-2 py-1 rounded-lg" style={{ background: '#F0F0F5', color: '#636366' }}>確認</span>
                <span className="text-[8px] font-bold px-2 py-1 rounded-lg" style={{ background: '#F3B4E3', color: '#FFF' }}>+ MY</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Tip>横スクロールで新着を確認。「+ MY」でカレンダーに追加できます</Tip>
    </div>
  )
}

// ── MY ──
function MockMy() {
  const eventDays = [13, 14, 23, 24]
  return (
    <div className="flex flex-col gap-0">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ background: '#FFFFFF' }}>
        <span className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>MY</span>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: '#F3B4E3', color: '#FFF' }}>スケジュール</span>
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: '#F0F0F5', color: '#636366' }}>TODO</span>
        </div>
      </div>

      {/* カレンダー */}
      <div className="px-4 pt-3" style={{ background: '#F8F9FA' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: '#FFFFFF' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </div>
          <span className="text-base font-bold" style={{ color: '#1C1C1E' }}>May 2026</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: '#FFFFFF' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {['日','月','火','水','木','金','土'].map((d, i) => (
            <div key={i} className="text-center text-[11px] font-semibold py-1"
              style={{ color: i === 0 ? '#EF4444' : i === 6 ? '#60A5FA' : '#6B6B70' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5 mb-3">
          {/* 5月は木曜始まり: 空4つ */}
          {[0,0,0,0].map((_, i) => <div key={`e${i}`} className="h-10" />)}
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1
            const hasEvent = eventDays.includes(day)
            const selected = day === 13
            return (
              <div key={day} className="flex flex-col items-center py-1.5 rounded-lg"
                style={{ background: selected ? '#F3B4E3' : 'transparent' }}>
                <span className="text-sm flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ color: selected ? '#FFF' : hasEvent ? '#F3B4E3' : '#1C1C1E', fontWeight: selected || hasEvent ? 700 : 400 }}>
                  {day}
                </span>
                {hasEvent && <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: selected ? '#FFF' : '#F3B4E3' }} />}
              </div>
            )
          })}
        </div>

        {/* タグフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'ALL', active: true, color: '#F3B4E3' },
            { label: '🎤 LIVE', active: false, color: '#F3B4E3' },
            { label: '🎫 TICKET', active: false, color: '#FCD34D' },
            { label: '💿 ALBUM', active: false, color: '#A78BFA' },
          ].map((t, i) => (
            <span key={i} className="flex-shrink-0 px-3.5 py-2 rounded-full text-[10px] font-semibold"
              style={t.active ? { background: t.color, color: '#FFF' } : { background: '#FFFFFF', color: '#636366' }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <Tip>ピンクの点がある日にイベントが登録済み。日付タップで予定を表示</Tip>

      {/* 選択日のエントリ */}
      <div className="px-4 pt-3">
        <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>5/13 · 2件</p>
        {[
          { title: 'FANMEETING YAKUSOKU', sub: '東京公演 Day1', venue: '東京ドーム', time: '17:30', color: '#F3B4E3' },
          { title: 'YAKUSOKU ライブビューイング', sub: '東京', venue: '全国映画館', time: '17:30', color: '#818CF8' },
        ].map((e, i) => (
          <div key={i} className="rounded-2xl px-4 py-3 mb-2 flex items-center gap-3" style={{ background: '#FFFFFF' }}>
            <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: '#1C1C1E' }}>{e.title}</p>
              {e.sub && <p className="text-[10px]" style={{ color: '#636366' }}>{e.sub}</p>}
              <p className="text-[10px]" style={{ color: '#8E8E93' }}>📍 {e.venue} {e.time}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        ))}
      </div>
      <Tip>カードをタップで座席情報・チケット画像を登録。1時間前にリマインダー通知も届きます</Tip>
    </div>
  )
}

// ── SCHEDULE ──
function MockSchedule() {
  return (
    <div className="flex flex-col gap-0">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ background: '#FFFFFF' }}>
        <span className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>SCHEDULE</span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F3B4E3' }}>
          <span className="text-sm text-white font-bold">＋</span>
        </div>
      </div>
      <Tip>右上の「＋」からスケジュールを投稿。公式ソースURLを添付してください</Tip>

      {/* タグフィルター */}
      <div className="px-4 pt-3 pb-2 flex gap-1.5 flex-wrap">
        {[
          { label: '🎤 LIVE', active: true, color: '#F3B4E3' },
          { label: '🎫 TICKET', active: false, color: '#FCD34D' },
          { label: '💿 ALBUM', active: false, color: '#A78BFA' },
          { label: '📺 TV', active: false, color: '#60A5FA' },
          { label: '🎬 LV', active: false, color: '#818CF8' },
          { label: '📢 INFO', active: false, color: '#6B7280' },
        ].map((t, i) => (
          <span key={i} className="text-[9px] font-bold px-2.5 py-1.5 rounded-full"
            style={t.active ? { background: t.color, color: '#FFF' } : { background: t.color + '15', color: t.color }}>
            {t.label}
          </span>
        ))}
      </div>
      <Tip>タグで絞り込み。LIVEだけ・TICKETだけの表示に切り替えられます</Tip>

      {/* イベントカード */}
      <div className="px-4 pt-2 flex flex-col gap-2">
        {[
          { date: '5/13(水)', tag: '🎤 LIVE', color: '#F3B4E3', title: 'FANMEETING YAKUSOKU', venue: '東京ドーム', time: '17:30', status: '✓', statusColor: '#34D399' },
          { date: '5/14(木)', tag: '🎤 LIVE', color: '#F3B4E3', title: 'FANMEETING YAKUSOKU', venue: '東京ドーム', time: '16:30', status: '2/3', statusColor: '#F59E0B' },
          { date: '5/23(土)', tag: '🎤 LIVE', color: '#F3B4E3', title: 'FANMEETING YAKUSOKU', venue: '京セラドーム大阪', time: '17:30', status: '1/3', statusColor: '#F59E0B' },
        ].map((e, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
            <div className="h-16 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${e.color}10, ${e.color}05)` }}>
              <span className="text-2xl opacity-20">🎤</span>
              <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.color + '20', color: e.color }}>{e.tag}</span>
              <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: e.statusColor + '20', color: e.statusColor }}>{e.status}</span>
            </div>
            <div className="px-3 py-2.5">
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: e.color + '15', color: e.color }}>{e.date} {e.time}</span>
              <p className="text-xs font-bold mt-1" style={{ color: '#1C1C1E' }}>{e.title}</p>
              <p className="text-[10px]" style={{ color: '#8E8E93' }}>📍 {e.venue}</p>
            </div>
          </div>
        ))}
      </div>
      <Tip>✓ = 3人が承認済み。2/3 = あと1人の承認で確定。カードをタップで詳細を確認</Tip>
    </div>
  )
}

// ── MAP ──
function MockMap() {
  return (
    <div className="flex flex-col gap-0">
      {/* メンバーフィルター */}
      <div className="px-3 pt-3 pb-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { name: 'ALL', color: '#F3B4E3', active: true },
          { name: 'S.COUPS', color: '#3B82F6', active: false },
          { name: 'JEONGHAN', color: '#8B5CF6', active: false },
          { name: 'HOSHI', color: '#F59E0B', active: false },
          { name: 'WONWOO', color: '#6366F1', active: false },
          { name: 'MINGYU', color: '#14B8A6', active: false },
        ].map((m, i) => (
          <span key={i} className="flex-shrink-0 text-[9px] font-bold px-2.5 py-1.5 rounded-full"
            style={m.active ? { background: m.color, color: '#FFF' } : { background: m.color + '18', color: m.color }}>
            {m.name}
          </span>
        ))}
      </div>
      <Tip>メンバー名をタップで、そのメンバーが行ったスポットだけ表示</Tip>

      {/* 地図 */}
      <div className="mx-4 rounded-2xl overflow-hidden relative" style={{ background: '#E8EEF4', height: 180 }}>
        {/* 道路っぽい線 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: '#636366' }} />
          <div className="absolute top-2/3 left-0 right-0 h-px" style={{ background: '#636366' }} />
          <div className="absolute top-0 bottom-0 left-1/3 w-px" style={{ background: '#636366' }} />
          <div className="absolute top-0 bottom-0 left-2/3 w-px" style={{ background: '#636366' }} />
        </div>
        {[
          { top: 35, left: '25%', color: '#F59E0B' },
          { top: 55, left: '50%', color: '#F3B4E3' },
          { top: 80, left: '35%', color: '#14B8A6' },
          { top: 45, left: '72%', color: '#8B5CF6' },
          { top: 100, left: '60%', color: '#3B82F6' },
        ].map((p, i) => (
          <div key={i} className="absolute" style={{ top: p.top, left: p.left }}>
            <svg width="20" height="24" viewBox="0 0 24 28" fill={p.color} stroke="#FFF" strokeWidth="1.5">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 16 12 16s12-7 12-16c0-6.6-5.4-12-12-12z" />
              <circle cx="12" cy="11" r="4" fill="#FFF" />
            </svg>
          </div>
        ))}
      </div>
      <Tip>ピンをタップでスポット詳細。色はジャンル（カフェ・グルメ・ファッション等）で分かれます</Tip>

      {/* スポット詳細 */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <p className="text-base font-black" style={{ color: '#1C1C1E' }}>☕ Cafe Example</p>
            <p className="text-xs" style={{ color: '#8E8E93' }}>📍 東京都渋谷区神宮前...</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F0F0F5' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
        </div>
        {/* 写真 */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { tags: ['#HOSHI'], status: '2/3', statusColor: '#F59E0B' },
            { tags: ['#MINGYU','#DK'], status: '✓ 3/3', statusColor: '#34D399' },
          ].map((p, i) => (
            <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 'calc(50% - 4px)', background: '#F0F0F5' }}>
              <div className="h-24 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${i === 0 ? '#F5E6D3' : '#D5E5F5'}, #F0F0F5)` }}>
                <span className="text-2xl opacity-30">📷</span>
                <div className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </div>
                <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </div>
              </div>
              <div className="px-2 py-1.5">
                <div className="flex flex-wrap gap-0.5">
                  {p.tags.map(t => (
                    <span key={t} className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: '#F59E0B18', color: '#F59E0B' }}>{t}</span>
                  ))}
                </div>
                <span className="text-[8px] font-bold px-1 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: p.statusColor + '18', color: p.statusColor }}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Tip>写真の ✏️ でメンバー・ソースURLを編集。ソースを確認して「👍 承認する」。右上の ✏️ でお店情報を編集</Tip>
    </div>
  )
}

// ── GOODS ──
function MockGoods() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center" style={{ minHeight: 300 }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(167,139,250,0.1)' }}>
        <span className="text-4xl">🛒</span>
      </div>
      <p className="text-base font-bold mb-2" style={{ color: '#1C1C1E' }}>Coming Soon</p>
      <p className="text-xs leading-relaxed" style={{ color: '#8E8E93' }}>公式グッズ・トレカの管理機能を{'\n'}準備中です</p>
    </div>
  )
}

// ── PROFILE ──
function MockProfile() {
  return (
    <div className="flex flex-col gap-0">
      <div className="px-4 pt-4 pb-2" style={{ background: '#FFFFFF' }}>
        <span className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>PROFILE</span>
      </div>
      {/* プロフィールカード */}
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
        <div className="h-20" style={{ background: 'linear-gradient(135deg, #F3B4E3, #C97AB8)' }} />
        <div className="px-4 pb-4 -mt-7">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-3 border-white" style={{ background: '#F0F0F5', borderWidth: 3, borderColor: '#FFF', borderStyle: 'solid' }}>👤</div>
          <p className="text-base font-bold mt-1.5" style={{ color: '#1C1C1E' }}>ニックネーム</p>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>投稿 <b style={{ color: '#1C1C1E' }}>292</b></span>
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>承認 <b style={{ color: '#1C1C1E' }}>15</b></span>
          </div>
        </div>
      </div>
      <Tip>アイコン・バナー画像をタップで変更できます</Tip>

      {/* 設定 */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
        {[
          { icon: '🔔', label: '通知設定', value: '朝 8:00 / 夜 21:00' },
          { icon: '💳', label: 'ファンクラブ会員番号', value: '登録済み' },
          { icon: '🇯🇵', label: '言語・居住国', value: '日本語 / 日本' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: i > 0 ? '1px solid #F0F0F5' : 'none' }}>
            <span className="text-base">{s.icon}</span>
            <span className="flex-1 text-xs font-medium" style={{ color: '#1C1C1E' }}>{s.label}</span>
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>{s.value}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        ))}
      </div>
      <Tip>通知設定で朝・夜の通知時間を設定。「通知を許可する」を押して有効にしてください</Tip>
    </div>
  )
}

const screenMocks: Record<string, () => React.ReactNode> = {
  home: MockHome,
  my: MockMy,
  schedule: MockSchedule,
  map: MockMap,
  goods: MockGoods,
  profile: MockProfile,
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
        <h1 className="text-sm font-black" style={{ color: '#1C1C1E' }}>使い方ガイド</h1>
      </header>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto pb-28">
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
