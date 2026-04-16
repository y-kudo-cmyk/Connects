'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

const slideConfig = [
  { icon: '💎', titleKey: 'slide1Title', subtitleKey: 'slide1Subtitle', descKey: 'slide1Desc', color: '#F3B4E3' },
  { icon: '📅', titleKey: 'slide2Title', subtitleKey: 'slide2Subtitle', descKey: 'slide2Desc', color: '#FCD34D' },
  { icon: '🔔', titleKey: 'slide3Title', subtitleKey: 'slide3Subtitle', descKey: 'slide3Desc', color: '#60A5FA' },
  { icon: '📍', titleKey: 'slide4Title', subtitleKey: 'slide4Subtitle', descKey: 'slide4Desc', color: '#34D399' },
  { icon: '✅', titleKey: 'slide5Title', subtitleKey: 'slide5Subtitle', descKey: 'slide5Desc', color: '#A78BFA' },
  { icon: '🚀', titleKey: 'slide6Title', subtitleKey: 'slide6Subtitle', descKey: 'slide6Desc', color: '#F3B4E3' },
]

export default function GuidePage() {
  const [current, setCurrent] = useState(0)
  const router = useRouter()
  const t = useTranslations('Guide')
  const cfg = slideConfig[current]
  const slide = { icon: cfg.icon, title: t(cfg.titleKey), subtitle: t(cfg.subtitleKey), description: t(cfg.descKey), color: cfg.color }
  const isLast = current === slideConfig.length - 1

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      {/* スキップ */}
      <div className="flex justify-end px-5 pt-4">
        <button
          onClick={() => router.push('/login')}
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ color: '#8E8E93' }}
        >
          {t('skip')}
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
          style={{ background: slide.color + '18' }}
        >
          <span className="text-5xl">{slide.icon}</span>
        </div>

        <h1
          className="text-2xl font-black mb-2 leading-tight"
          style={{ color: '#1C1C1E' }}
        >
          {slide.title}
        </h1>

        <p
          className="text-sm font-bold mb-6"
          style={{ color: slide.color }}
        >
          {slide.subtitle}
        </p>

        <p
          className="text-sm leading-relaxed whitespace-pre-line"
          style={{ color: '#636366' }}
        >
          {slide.description}
        </p>
      </div>

      {/* ドット */}
      <div className="flex justify-center gap-2 mb-6">
        {slideConfig.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all"
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              background: i === current ? slide.color : '#E5E5EA',
            }}
          />
        ))}
      </div>

      {/* ボタン */}
      <div className="px-6 pb-10 flex gap-3">
        {current > 0 && (
          <button
            onClick={() => setCurrent(current - 1)}
            className="flex-1 py-4 rounded-2xl text-sm font-bold"
            style={{ background: '#F0F0F5', color: '#636366' }}
          >
            {t('back')}
          </button>
        )}
        <button
          onClick={() => {
            if (isLast) {
              router.push('/login')
            } else {
              setCurrent(current + 1)
            }
          }}
          className="flex-1 py-4 rounded-2xl text-sm font-bold"
          style={{ background: slide.color, color: '#FFFFFF' }}
        >
          {isLast ? t('start') : t('next')}
        </button>
      </div>
    </div>
  )
}
