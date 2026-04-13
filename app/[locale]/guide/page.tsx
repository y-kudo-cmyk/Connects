'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'

const slides = [
  {
    icon: '💎',
    title: 'Connects+ へようこそ',
    subtitle: 'ファンが作る、ファンのためのサービス',
    description: 'スケジュール・聖地巡礼・グッズ情報を\nファン同士で共有・承認して作り上げる\nコミュニティ型アプリです',
    color: '#F3B4E3',
  },
  {
    icon: '📅',
    title: 'スケジュールを逃さない',
    subtitle: 'LIVE・チケット・リリース・TV出演…',
    description: '公式情報をもとにファンが投稿・更新\n承認制だから情報の正確性も安心\nMYカレンダーに追加して自分だけの予定表に',
    color: '#FCD34D',
  },
  {
    icon: '🔔',
    title: '大事な情報をプッシュ通知',
    subtitle: '朝・夜の通知で今日と明日のスケジュールをお届け',
    description: 'チケット申込締切も見逃さない\nMYカレンダーに登録したイベントの\n前日リマインダーも届きます',
    color: '#60A5FA',
  },
  {
    icon: '📍',
    title: '聖地巡礼MAP',
    subtitle: 'メンバーが訪れたスポットを写真付きで共有',
    description: 'ファンが投稿した写真とソースURL付き\nメンバー別フィルター・ジャンル検索\n地図で近くのスポットを探せます',
    color: '#34D399',
  },
  {
    icon: '✅',
    title: '承認制で情報の質を担保',
    subtitle: '3人のファンが確認して初めて承認',
    description: '誰でも投稿できるけど、みんなで確認するから安心\n写真にはメンバータグとソースURLが必須\n正確な情報だけが残る仕組みです',
    color: '#A78BFA',
  },
  {
    icon: '🚀',
    title: 'さっそく始めよう！',
    subtitle: 'アカウント登録は無料・30秒で完了',
    description: 'Google / X / メールで簡単ログイン\nスケジュールを確認して\nMYカレンダーに追加してみましょう',
    color: '#F3B4E3',
  },
]

export default function GuidePage() {
  const [current, setCurrent] = useState(0)
  const router = useRouter()
  const slide = slides[current]
  const isLast = current === slides.length - 1

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      {/* スキップ */}
      <div className="flex justify-end px-5 pt-4">
        <button
          onClick={() => router.push('/login')}
          className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ color: '#8E8E93' }}
        >
          スキップ
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
        {slides.map((_, i) => (
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
            戻る
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
          {isLast ? 'はじめる' : '次へ'}
        </button>
      </div>
    </div>
  )
}
