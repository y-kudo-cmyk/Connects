'use client'

import { useState } from 'react'
import { tradingCards, cardTypeConfig, seventeenMembers, TradingCard, CardType, PAID_FEATURE_ENABLED } from '@/lib/mockData'

type FilterMode = 'ALL' | 'OWNED' | 'MISSING'

export default function GoodsPage() {
  const [memberFilter, setMemberFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<CardType | 'ALL'>('ALL')
  const [mode, setMode] = useState<FilterMode>('ALL')
  const [owned, setOwned] = useState<Set<string>>(new Set(['tc-03', 'tc-05', 'tc-09']))
  const [customCards, setCustomCards] = useState<TradingCard[]>([])
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerForm, setRegisterForm] = useState({ member: '', series: '', cardNo: '', type: 'normal' as CardType })

  const allCards = [...tradingCards, ...customCards]

  const filtered = allCards.filter((card) => {
    if (memberFilter !== 'ALL' && card.member !== memberFilter) return false
    if (typeFilter !== 'ALL' && card.type !== typeFilter) return false
    if (mode === 'OWNED' && !owned.has(card.id)) return false
    if (mode === 'MISSING' && owned.has(card.id)) return false
    return true
  })

  const toggleOwned = (id: string) => {
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submitRegister = () => {
    if (!registerForm.member.trim() || !registerForm.cardNo.trim()) return
    const newCard: TradingCard = {
      id: `custom-${Date.now()}`,
      member: registerForm.member.trim(),
      series: registerForm.series.trim() || 'カスタム',
      cardNo: registerForm.cardNo.trim(),
      type: registerForm.type,
      isPaid: false,
    }
    setCustomCards((prev) => [...prev, newCard])
    setOwned((prev) => new Set([...prev, newCard.id]))
    setShowRegisterModal(false)
    setRegisterForm({ member: '', series: '', cardNo: '', type: 'normal' })
  }

  const memberData = (name: string) =>
    seventeenMembers.find((m) => m.name === name) ?? { color: '#3B82F6', name }

  return (
    <div>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{
          background: '#F8F9FA',
          borderBottom: '1px solid #2E2E32',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div>
          <h1 className="text-lg font-black tracking-wider" style={{ color: '#1C1C1E' }}>GOODS</h1>
          <p className="text-xs" style={{ color: '#636366' }}>SEVENTEEN コレクション</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}
          >
            {owned.size}/{allCards.length}
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: '#F3B4E3' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F8F9FA" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Collection progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#636366' }}>コレクション進捗</span>
          <span className="text-xs font-bold" style={{ color: '#F3B4E3' }}>
            {Math.round((owned.size / tradingCards.length) * 100)}%
          </span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ background: '#F0F0F5', height: 6 }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(owned.size / tradingCards.length) * 100}%`,
              background: 'linear-gradient(90deg, #F3B4E3, #C97AB8)',
            }}
          />
        </div>
      </div>

      {/* Mode toggle (ALL / OWNED / MISSING) */}
      <div className="px-4 pt-2 pb-1">
        <div
          className="flex rounded-xl p-1"
          style={{ background: '#FFFFFF' }}
        >
          {(['ALL', 'OWNED', 'MISSING'] as FilterMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-3 rounded-lg text-xs font-bold transition-all"
              style={mode === m
                ? { background: '#F3B4E3', color: '#F8F9FA' }
                : { color: '#8E8E93' }
              }
            >
              {m === 'ALL' ? 'すべて' : m === 'OWNED' ? '所持済み' : '未所持'}
            </button>
          ))}
        </div>
      </div>

      {/* Member filter */}
      <div className="px-4 pt-2">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setMemberFilter('ALL')}
            className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
            style={memberFilter === 'ALL'
              ? { background: '#3B82F6', color: '#1C1C1E' }
              : { background: '#FFFFFF', color: '#636366' }
            }
          >
            ALL
          </button>
          {seventeenMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setMemberFilter(member.name)}
              className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
              style={memberFilter === member.name
                ? { background: member.color, color: '#1C1C1E' }
                : { background: '#FFFFFF', color: '#636366' }
              }
            >
              {member.name}
            </button>
          ))}
        </div>
      </div>

      {/* Card type filter */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setTypeFilter('ALL')}
            className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
            style={typeFilter === 'ALL'
              ? { background: '#F3B4E3', color: '#F8F9FA' }
              : { background: '#FFFFFF', color: '#636366' }
            }
          >
            ALL
          </button>
          {(['normal', 'rare', 'ur', 'sp'] as CardType[]).map((type) => {
            const cfg = cardTypeConfig[type]
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
                style={typeFilter === type
                  ? { background: cfg.color, color: '#F8F9FA' }
                  : { background: cfg.bg, color: cfg.color }
                }
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards grid */}
      <div className="px-4 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14" style={{ color: '#8E8E93' }}>
            <p className="text-sm">カードが見つかりません</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {filtered.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                isOwned={owned.has(card.id)}
                memberColor={memberData(card.member).color}
                onToggle={() => toggleOwned(card.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Register modal */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl p-5"
            style={{ background: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: '#1C1C1E' }}>カードを登録</h2>
              <button onClick={() => setShowRegisterModal(false)} className="w-11 h-11 flex items-center justify-center -mr-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <RegisterField
                label="メンバー"
                value={registerForm.member}
                placeholder="例: Hoshi"
                onChange={(v) => setRegisterForm((f) => ({ ...f, member: v }))}
              />
              <RegisterField
                label="シリーズ"
                value={registerForm.series}
                placeholder="例: SPILL THE FEELS"
                onChange={(v) => setRegisterForm((f) => ({ ...f, series: v }))}
              />
              <RegisterField
                label="カード番号"
                value={registerForm.cardNo}
                placeholder="例: 05/13"
                onChange={(v) => setRegisterForm((f) => ({ ...f, cardNo: v }))}
              />
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: '#8E8E93' }}>レアリティ</label>
                <div className="flex gap-2">
                  {(['normal', 'rare', 'ur', 'sp'] as CardType[]).map((type) => {
                    const cfg = cardTypeConfig[type]
                    return (
                      <button
                        key={type}
                        onClick={() => setRegisterForm((f) => ({ ...f, type }))}
                        className="flex-1 py-2 rounded-lg text-xs font-bold"
                        style={registerForm.type === type
                          ? { background: cfg.color, color: '#F8F9FA' }
                          : { background: '#F0F0F5', color: cfg.color }
                        }
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {!PAID_FEATURE_ENABLED && (
              <p className="text-xs mb-3 text-center" style={{ color: '#8E8E93' }}>
                ※ 現在、登録機能は無料版でご利用いただけます
              </p>
            )}

            <button
              onClick={submitRegister}
              className="w-full py-3.5 rounded-xl text-sm font-bold"
              style={{ background: '#F3B4E3', color: '#F8F9FA' }}
            >
              登録する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CardTile({ card, isOwned, memberColor, onToggle }: {
  card: TradingCard
  isOwned: boolean
  memberColor: string
  onToggle: () => void
}) {
  const cfg = cardTypeConfig[card.type]
  return (
    <button
      onClick={onToggle}
      className="relative rounded-xl overflow-hidden flex flex-col"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${isOwned ? memberColor : '#E5E5EA'}`,
        opacity: isOwned ? 1 : 0.5,
      }}
    >
      {/* Card art area */}
      <div
        className="w-full aspect-[2/3] flex flex-col items-center justify-center relative"
        style={{ background: isOwned ? memberColor + '20' : '#F0F0F5' }}
      >
        {/* Rarity badge */}
        <span
          className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
        {/* Owned checkmark */}
        {isOwned && (
          <div
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: memberColor }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {/* Member initial */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black"
          style={{ background: memberColor + '33', color: memberColor }}
        >
          {card.member.slice(0, 2).toUpperCase()}
        </div>
      </div>

      {/* Card info */}
      <div className="px-2 py-1.5">
        <p className="text-[11px] font-bold leading-tight" style={{ color: isOwned ? '#FFFFFF' : '#6B6B70' }}>
          {card.member}
        </p>
        <p className="text-[9px] mt-0.5 leading-tight" style={{ color: '#8E8E93' }}>
          {card.cardNo}
        </p>
      </div>
    </button>
  )
}

function RegisterField({ label, value, placeholder, onChange }: {
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1.5" style={{ color: '#8E8E93' }}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{
          background: '#F0F0F5',
          border: '1px solid #E5E5EA',
          color: '#1C1C1E',
        }}
      />
    </div>
  )
}
