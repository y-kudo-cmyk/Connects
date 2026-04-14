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

// ── ステップ番号バッジ ──
function StepBadge({ n }: { n: string }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black flex-shrink-0"
      style={{ background: '#F3B4E3', color: '#FFF', boxShadow: '0 0 0 2px rgba(243,180,227,0.3)' }}>
      {n}
    </span>
  )
}

// ── タップ指示エリア ──
function TapHint({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative">
      {children}
      <div className="absolute -top-1 -right-1 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full animate-pulse"
        style={{ background: '#F3B4E3', boxShadow: '0 0 8px rgba(243,180,227,0.5)' }}>
        <span className="text-[7px] font-black text-white whitespace-nowrap">👆 {label}</span>
      </div>
    </div>
  )
}

// ── 矢印付きステップ説明 ──
function StepInstruction({ step, text }: { step: string; text: string }) {
  return (
    <div className="flex items-start gap-2 px-4 py-1.5">
      <StepBadge n={step} />
      <p className="text-[10px] font-semibold leading-relaxed pt-0.5" style={{ color: '#636366' }}>{text}</p>
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
        <TapHint label="タップで投稿">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F0F0F5' }}>
            <span className="text-xs">＋</span>
          </div>
        </TapHint>
      </div>

      <StepInstruction step="①" text="HOMEを開くと今日のスケジュールが自動表示されます" />

      {/* 今日のスケジュール */}
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F3B4E3' }} />
          <span className="text-[10px] font-bold" style={{ color: '#636366' }}>TODAY&apos;S SCHEDULE — {now.getMonth()+1}/{d}({dow})</span>
        </div>
      </div>
      <div className="px-4 flex flex-col gap-2 mb-1">
        {[
          { tag: '🎤 LIVE', color: '#F3B4E3', title: 'WORLD TOUR [ONE] IN JAPAN', sub: '東京公演 Day1 開場16:00', venue: '東京ドーム', time: '17:30', step: '②' },
          { tag: '🎫 TICKET', color: '#FCD34D', title: 'FANMEETING 先行抽選受付', sub: '本日23:59締切 当落4/18発表', venue: '申込締切', time: '23:59', step: '' },
          { tag: '📺 TV', color: '#60A5FA', title: 'ミュージックステーション 3時間SP', sub: '19:00〜出演予定', venue: 'テレビ朝日', time: '21:00', step: '' },
        ].map((e, i) => (
          <div key={i} className="relative rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{
              background: '#FFFFFF',
              ...(i === 0 ? { border: '1.5px solid rgba(243,180,227,0.5)', boxShadow: '0 0 12px rgba(243,180,227,0.15)' } : {}),
            }}>
            {i === 0 && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                <StepBadge n="②" />
              </div>
            )}
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
            {i === 0 && (
              <div className="flex-shrink-0 animate-pulse">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <Tip>カードをタップで詳細モーダルが開きます。LIVE → TICKET → TV の優先順で表示されます</Tip>

      <StepInstruction step="③" text="下にスクロールすると新着スケジュールが表示されます。「+ MY」で自分のカレンダーに追加できます" />

      {/* 新着 */}
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F3B4E3' }} />
          <span className="text-[10px] font-bold" style={{ color: '#636366' }}>NEW SCHEDULE</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>3件</span>
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 pb-2">
        {[
          { tag: '🎤 LIVE', color: '#F3B4E3', title: 'FANMEETING YAKUSOKU', date: '5/13(火)', showTap: true },
          { tag: '💿 ALBUM', color: '#A78BFA', title: 'DxS 1st Mini Album', date: '5/1(木)', showTap: false },
          { tag: '📢 INFO', color: '#6B7280', title: '特設サイトオープン', date: '4/13(日)', showTap: false },
        ].map((e, i) => (
          <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden relative" style={{ background: '#FFFFFF', width: 160 }}>
            <div className="h-20 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${e.color}15, ${e.color}08)` }}>
              <span className="text-2xl opacity-30">{e.tag.split(' ')[0]}</span>
              <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: e.color + '20', color: e.color }}>{e.tag}</span>
            </div>
            <div className="p-2.5">
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: e.color + '15', color: e.color }}>{e.date}</span>
              <p className="text-[10px] font-bold mt-1 leading-tight" style={{ color: '#1C1C1E' }}>{e.title}</p>
              <div className="flex gap-1 mt-1.5">
                <span className="text-[8px] font-bold px-2 py-1 rounded-lg" style={{ background: '#F0F0F5', color: '#636366' }}>確認</span>
                {e.showTap ? (
                  <TapHint label="ここをタップ">
                    <span className="text-[8px] font-bold px-2 py-1 rounded-lg" style={{ background: '#F3B4E3', color: '#FFF' }}>+ MY</span>
                  </TapHint>
                ) : (
                  <span className="text-[8px] font-bold px-2 py-1 rounded-lg" style={{ background: '#F3B4E3', color: '#FFF' }}>+ MY</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Tip>「+ MY」を押すとMYカレンダーに追加。「確認」で公式ソースを確認できます</Tip>
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
          <TapHint label="切替">
            <div className="flex gap-2">
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: '#F3B4E3', color: '#FFF' }}>スケジュール</span>
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: '#F0F0F5', color: '#636366' }}>TODO</span>
            </div>
          </TapHint>
        </div>
      </div>

      <StepInstruction step="①" text="「スケジュール」と「TODO」タブで切り替え。スケジュールにはMYに追加した予定、TODOには持ち物リスト等を表示" />

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
        <div className="grid grid-cols-7 gap-y-0.5 mb-3 relative">
          {/* 5月は木曜始まり: 空4つ */}
          {[0,0,0,0].map((_, i) => <div key={`e${i}`} className="h-10" />)}
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1
            const hasEvent = eventDays.includes(day)
            const selected = day === 13
            return (
              <div key={day} className="relative flex flex-col items-center py-1.5 rounded-lg"
                style={{ background: selected ? '#F3B4E3' : 'transparent' }}>
                <span className="text-sm flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ color: selected ? '#FFF' : hasEvent ? '#F3B4E3' : '#1C1C1E', fontWeight: selected || hasEvent ? 700 : 400 }}>
                  {day}
                </span>
                {hasEvent && (
                  <div className="flex gap-0.5 mt-0.5">
                    <span className="w-1 h-1 rounded-full" style={{ background: selected ? '#FFF' : '#F3B4E3' }} />
                    {day === 13 && <span className="w-1 h-1 rounded-full" style={{ background: selected ? '#FFF' : '#818CF8' }} />}
                  </div>
                )}
                {selected && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                    <span className="text-[7px] font-black px-1 py-0.5 rounded whitespace-nowrap" style={{ background: '#F3B4E3', color: '#FFF' }}>② タップ</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* タグフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-3 pt-2" style={{ scrollbarWidth: 'none' }}>
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
      <Tip>ピンクの点がある日にイベントが登録済み。色の違うドットはカテゴリが異なる予定です</Tip>

      <StepInstruction step="③" text="日付をタップすると、その日の予定一覧が下に表示されます。カードタップで詳細へ" />

      {/* 選択日のエントリ */}
      <div className="px-4 pt-3">
        <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>5/13(火) · 2件の予定</p>
        {[
          { title: 'FANMEETING YAKUSOKU', sub: '東京公演 Day1 · 開場16:00', venue: '東京ドーム', time: '17:30', color: '#F3B4E3', showArrow: true },
          { title: 'YAKUSOKU ライブビューイング', sub: '全国同時上映', venue: '全国映画館', time: '17:30', color: '#818CF8', showArrow: false },
        ].map((e, i) => (
          <div key={i} className="relative rounded-2xl px-4 py-3 mb-2 flex items-center gap-3"
            style={{
              background: '#FFFFFF',
              ...(i === 0 ? { border: '1.5px dashed rgba(243,180,227,0.6)' } : {}),
            }}>
            <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: '#1C1C1E' }}>{e.title}</p>
              {e.sub && <p className="text-[10px]" style={{ color: '#636366' }}>{e.sub}</p>}
              <p className="text-[10px]" style={{ color: '#8E8E93' }}>📍 {e.venue} · {e.time}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            {i === 0 && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 animate-pulse">
                <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#F3B4E3', color: '#FFF' }}>④ タップで詳細</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <Tip>カードをタップすると座席情報・チケット画像の登録画面が開きます。1時間前にリマインダー通知が届きます</Tip>
    </div>
  )
}

// ── SCHEDULE ──
function MockSchedule() {
  return (
    <div className="flex flex-col gap-0">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ background: '#FFFFFF' }}>
        <span className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>SCHEDULE</span>
        <TapHint label="新規投稿">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F3B4E3' }}>
            <span className="text-sm text-white font-bold">＋</span>
          </div>
        </TapHint>
      </div>

      <StepInstruction step="①" text="全員が見る公式スケジュール一覧。右上「＋」からスケジュールを投稿できます（公式ソースURL必須）" />

      {/* タグフィルター */}
      <div className="px-4 pt-3 pb-2 flex gap-1.5 flex-wrap relative">
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
        <div className="absolute -left-0 top-3">
          <StepBadge n="②" />
        </div>
      </div>
      <Tip>タグで絞り込み。LIVEだけ・TICKETだけなど見たいカテゴリだけ表示できます</Tip>

      <StepInstruction step="③" text="カードをタップすると詳細画面へ。承認状況の確認や、内容の修正ができます" />

      {/* イベントカード */}
      <div className="px-4 pt-2 flex flex-col gap-2">
        {[
          { date: '5/13(火)', tag: '🎤 LIVE', color: '#F3B4E3', title: 'FANMEETING YAKUSOKU', venue: '東京ドーム（55,000席）', time: '17:30', status: '✓ 確定', statusColor: '#34D399', highlight: true },
          { date: '5/14(水)', tag: '🎤 LIVE', color: '#F3B4E3', title: 'FANMEETING YAKUSOKU', venue: '東京ドーム（55,000席）', time: '16:30', status: '承認 2/3', statusColor: '#F59E0B', highlight: false },
          { date: '5/23(金)', tag: '🎤 LIVE', color: '#F3B4E3', title: 'FANMEETING YAKUSOKU', venue: '京セラドーム大阪（36,000席）', time: '17:30', status: '承認 1/3', statusColor: '#F59E0B', highlight: false },
        ].map((e, i) => (
          <div key={i} className="relative rounded-2xl overflow-hidden"
            style={{
              background: '#FFFFFF',
              ...(e.highlight ? { border: '1.5px solid rgba(52,211,153,0.4)' } : {}),
            }}>
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
            {i === 0 && (
              <div className="absolute right-2 bottom-2 flex items-center gap-1 animate-pulse">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="text-[7px] font-black" style={{ color: '#34D399' }}>3人が承認済</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <Tip>「✓ 確定」= 3人が承認した情報。「承認 2/3」= あと1人で確定。タップして内容を確認し、正しければ「承認する」を押してください</Tip>
    </div>
  )
}

// ── MAP ──
function MockMap() {
  return (
    <div className="flex flex-col gap-0">
      <StepInstruction step="①" text="メンバー名をタップすると、そのメンバーが訪れたスポットだけに絞り込めます" />

      {/* メンバーフィルター */}
      <div className="px-3 pt-2 pb-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
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

      <StepInstruction step="②" text="地図上のピンをタップすると、スポット情報カードが表示されます" />

      {/* 地図 */}
      <div className="mx-4 rounded-2xl overflow-hidden relative" style={{ background: '#E8EEF4', height: 180 }}>
        {/* 道路っぽい線 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: '#636366' }} />
          <div className="absolute top-2/3 left-0 right-0 h-px" style={{ background: '#636366' }} />
          <div className="absolute top-0 bottom-0 left-1/3 w-px" style={{ background: '#636366' }} />
          <div className="absolute top-0 bottom-0 left-2/3 w-px" style={{ background: '#636366' }} />
        </div>
        {/* 地域ラベル */}
        <span className="absolute top-3 left-3 text-[8px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.8)', color: '#636366' }}>渋谷・原宿エリア</span>
        {[
          { top: 35, left: '25%', color: '#F59E0B', label: 'カフェ' },
          { top: 55, left: '50%', color: '#F3B4E3', label: '' },
          { top: 80, left: '35%', color: '#14B8A6', label: '' },
          { top: 45, left: '72%', color: '#8B5CF6', label: '' },
          { top: 100, left: '60%', color: '#3B82F6', label: '' },
        ].map((p, i) => (
          <div key={i} className="absolute" style={{ top: p.top, left: p.left }}>
            <svg width="20" height="24" viewBox="0 0 24 28" fill={p.color} stroke="#FFF" strokeWidth="1.5">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 16 12 16s12-7 12-16c0-6.6-5.4-12-12-12z" />
              <circle cx="12" cy="11" r="4" fill="#FFF" />
            </svg>
            {i === 0 && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 animate-pulse">
                <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#F59E0B', color: '#FFF' }}>👆 タップ</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <Tip>ピンの色はジャンルで分かれます。☕カフェ 🍽グルメ 👕ファッション 📸撮影スポット</Tip>

      <StepInstruction step="③" text="スポットカードでは写真の投稿や承認ができます。右上のペンアイコンでお店情報を編集" />

      {/* スポット詳細 */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1.5px solid rgba(243,180,227,0.3)' }}>
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-black" style={{ color: '#1C1C1E' }}>☕ Cafe OneStar</p>
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#34D39920', color: '#34D399' }}>✓ 確認済</span>
            </div>
            <p className="text-xs" style={{ color: '#8E8E93' }}>📍 東京都渋谷区神宮前1-2-3</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#636366' }}>🕐 11:00〜20:00 · 定休日なし</p>
          </div>
          <TapHint label="編集">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F0F0F5' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          </TapHint>
        </div>
        {/* 写真 */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { tags: ['#HOSHI'], status: '承認 2/3', statusColor: '#F59E0B', step: '④' },
            { tags: ['#MINGYU','#DK'], status: '✓ 3/3', statusColor: '#34D399', step: '' },
          ].map((p, i) => (
            <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 'calc(50% - 4px)', background: '#F0F0F5' }}>
              <div className="h-24 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${i === 0 ? '#F5E6D3' : '#D5E5F5'}, #F0F0F5)` }}>
                <span className="text-2xl opacity-30">📷</span>
                <div className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </div>
                <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </div>
                {i === 0 && (
                  <div className="absolute top-1 left-1">
                    <StepBadge n="④" />
                  </div>
                )}
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
      <Tip>写真をタップで拡大表示。ソースURLを確認して「👍 承認する」を押してください。3人の承認で情報確定します</Tip>
    </div>
  )
}

// ── GOODS ──
function MockGoods() {
  return (
    <div className="flex flex-col gap-0">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ background: '#FFFFFF' }}>
        <span className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>GOODS</span>
      </div>

      <StepInstruction step="①" text="公式グッズやトレカの所持管理ができるようになる予定です" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center py-8">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(167,139,250,0.1)' }}>
          <span className="text-4xl">🛒</span>
        </div>
        <p className="text-base font-bold mb-2" style={{ color: '#1C1C1E' }}>Coming Soon</p>
        <p className="text-xs leading-relaxed mb-4" style={{ color: '#8E8E93' }}>公式グッズ・トレカの管理機能を{'\n'}準備中です</p>

        {/* プレビュー */}
        <div className="w-full rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px dashed rgba(167,139,250,0.4)' }}>
          <div className="px-4 pt-3 pb-2">
            <span className="text-[10px] font-bold" style={{ color: '#A78BFA' }}>予定している機能</span>
          </div>
          <div className="px-4 pb-3 flex flex-col gap-2">
            {[
              { icon: '💿', text: 'アルバム別トレカ一覧・所持チェック', step: '②' },
              { icon: '🎁', text: '公式グッズのリリース情報・通知', step: '③' },
              { icon: '🔄', text: 'トレカ交換希望リスト（他ユーザーとマッチ）', step: '④' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <StepBadge n={item.step} />
                <span className="text-lg">{item.icon}</span>
                <span className="text-[10px] font-medium" style={{ color: '#636366' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Tip>リリース時に通知でお知らせします。PROFILEページで通知を有効にしておいてください</Tip>
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

      <StepInstruction step="①" text="バナーやアイコンをタップして、プロフィール画像を変更できます" />

      {/* プロフィールカード */}
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden relative" style={{ background: '#FFFFFF' }}>
        <div className="h-20 relative" style={{ background: 'linear-gradient(135deg, #F3B4E3, #C97AB8)' }}>
          <div className="absolute top-2 right-2 animate-pulse">
            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.9)', color: '#C97AB8' }}>👆 タップで変更</span>
          </div>
        </div>
        <div className="px-4 pb-4 -mt-7">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: '#F0F0F5', borderWidth: 3, borderColor: '#FFF', borderStyle: 'solid' }}>👤</div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#F3B4E3' }}>
              <span className="text-[8px] text-white">📷</span>
            </div>
          </div>
          <p className="text-base font-bold mt-1.5" style={{ color: '#1C1C1E' }}>カラット太郎</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#8E8E93' }}>@carat_taro · 2024年3月から利用</p>
          <div className="flex gap-4 mt-2">
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>投稿 <b style={{ color: '#1C1C1E' }}>292</b></span>
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>承認 <b style={{ color: '#1C1C1E' }}>15</b></span>
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>MYスケジュール <b style={{ color: '#1C1C1E' }}>8</b></span>
          </div>
        </div>
      </div>

      <StepInstruction step="②" text="各設定項目をタップして、通知やファンクラブ情報をカスタマイズしましょう" />

      {/* 設定 */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
        {[
          { icon: '🔔', label: '通知設定', value: '朝 8:00 / 夜 21:00', important: true, step: '③' },
          { icon: '💳', label: 'ファンクラブ会員番号', value: '登録済み', important: false, step: '' },
          { icon: '🇯🇵', label: '言語・居住国', value: '日本語 / 日本', important: false, step: '' },
          { icon: '🔐', label: 'アカウント連携', value: 'Google', important: false, step: '' },
        ].map((s, i) => (
          <div key={i} className="relative flex items-center gap-3 px-4 py-3.5"
            style={{
              borderTop: i > 0 ? '1px solid #F0F0F5' : 'none',
              ...(s.important ? { background: 'rgba(243,180,227,0.04)' } : {}),
            }}>
            {s.step && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2">
                <StepBadge n="③" />
              </div>
            )}
            <span className="text-base">{s.icon}</span>
            <span className="flex-1 text-xs font-medium" style={{ color: '#1C1C1E' }}>{s.label}</span>
            <span className="text-[10px]" style={{ color: '#8E8E93' }}>{s.value}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        ))}
      </div>
      <Tip>通知設定で「通知を許可する」を必ずONにしてください。LIVEの1時間前やチケット締切のリマインダーが届きます</Tip>

      {/* ログアウト */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-base">🚪</span>
          <span className="flex-1 text-xs font-medium" style={{ color: '#EF4444' }}>ログアウト</span>
        </div>
      </div>
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
