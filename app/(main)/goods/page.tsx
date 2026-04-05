'use client'

export default function GoodsPage() {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <div className="flex flex-col items-center gap-4 px-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(243,180,227,0.15)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h1 className="text-xl font-black" style={{ color: '#1C1C1E' }}>GOODS</h1>
        <p className="text-sm text-center leading-relaxed" style={{ color: '#8E8E93' }}>
          トレカ管理・交換機能を準備中です
        </p>
        <span
          className="text-xs font-bold px-4 py-2 rounded-full"
          style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}
        >
          COMING SOON
        </span>
      </div>
    </div>
  )
}
