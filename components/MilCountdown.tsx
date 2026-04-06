'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'

type Member = {
  name: string
  nameEn: string
  discharge: string   // YYYY-MM-DD
  photo?: string      // /public/ 内のパス
  color: string
}

const MEMBERS: Member[] = [
  { name: 'ジョンハン', nameEn: 'JEONGHAN', discharge: '2026-06-25', photo: '/jeonghan.jpg', color: '#A78BFA' },
  { name: 'ウォヌ',    nameEn: 'WONWOO',   discharge: '2027-01-02', photo: '/wonwoo.jpg',  color: '#60A5FA' },
  { name: 'ホシ',      nameEn: 'HOSHI',    discharge: '2027-03-15', photo: '/hoshi.jpg',   color: '#F472B6' },
  { name: 'ウジ',      nameEn: 'WOOZI',    discharge: '2027-03-14', photo: '/woozi.jpg',   color: '#34D399' },
]

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000))
}

export default function MilCountdown() {
  const { t } = useTranslation()
  const [days, setDays] = useState<number[]>([])

  useEffect(() => {
    setDays(MEMBERS.map((m) => daysUntil(m.discharge)))
    // 日付変わりに更新
    const now = new Date()
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
    const timer = setTimeout(() => {
      setDays(MEMBERS.map((m) => daysUntil(m.discharge)))
    }, msToMidnight)
    return () => clearTimeout(timer)
  }, [])

  if (days.length === 0) return null

  return (
    <div className="px-4 mb-1">
      {/* ヘッダー */}
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ fontSize: 12 }}>🪖</span>
        <p className="text-[11px] font-bold tracking-wider" style={{ color: '#8E8E93' }}>MILITARY DISCHARGE</p>
      </div>

      {/* メンバーカード横並び */}
      <div className="grid grid-cols-4 gap-2">
        {MEMBERS.map((m, i) => {
          const d = days[i] ?? 0
          const discharged = d === 0
          return (
            <div
              key={m.nameEn}
              className="flex flex-col items-center rounded-2xl overflow-hidden"
              style={{ background: '#FFFFFF' }}
            >
              {/* 写真エリア */}
              <div className="w-full aspect-square relative overflow-hidden">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) parent.style.background = m.color + '33'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: m.color + '22' }}>
                    <span className="text-2xl">🪖</span>
                  </div>
                )}
                {/* オーバーレイ */}
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)'
                }} />
                <p className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-black text-white tracking-wide">
                  {m.nameEn}
                </p>
              </div>

              {/* カウント */}
              <div className="w-full px-1 py-2 text-center">
                {discharged ? (
                  <p className="text-[10px] font-black" style={{ color: m.color }}>{t('milCountdownDone')}</p>
                ) : (
                  <>
                    <p className="text-base font-black leading-none" style={{ color: m.color }}>
                      {d.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-semibold" style={{ color: '#8E8E93' }}>days</p>
                  </>
                )}
                <p className="text-[8px] mt-0.5" style={{ color: '#C7C7CC' }}>
                  {m.discharge.replace(/-/g, '/')}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
