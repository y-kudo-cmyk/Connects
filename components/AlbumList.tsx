'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useCardProducts, productTypeLabels, type CardProduct, type RegionTab } from '@/lib/useCardData'

interface AlbumListProps {
  onSelect: (product: CardProduct) => void
  userCardProductIds: Set<string>
  productCardCounts: Map<string, { total: number; owned: number }>
}

function formatDate(d: string | null) {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export default function AlbumList({ onSelect, userCardProductIds, productCardCounts }: AlbumListProps) {
  const t = useTranslations('Goods')
  const { products, loading } = useCardProducts()
  const [tab, setTab] = useState<RegionTab>('KR')

  const regionTabs: { key: RegionTab; label: string }[] = [
    { key: 'KR', label: t('regionKR') },
    { key: 'JP', label: t('regionJP') },
    { key: 'UNIT', label: t('regionUnit') },
    { key: 'CONCERT', label: 'CONCERT' },
  ]

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (tab === 'UNIT') {
        return p.product_id.startsWith('P_UN')
      }
      if (tab === 'CONCERT') {
        return p.region === 'EVENT' || p.product_id.startsWith('P_CON_') || p.product_id.startsWith('P_EVT_')
      }
      return p.region === tab && !p.product_id.startsWith('P_UN') && !p.product_id.startsWith('P_CON_') && !p.product_id.startsWith('P_EVT_')
    })
  }, [products, tab])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Region tabs */}
      <div className="flex gap-2 px-4 pb-3">
        {regionTabs.map(rt => (
          <button
            key={rt.key}
            onClick={() => setTab(rt.key)}
            className="py-2 px-4 rounded-full text-xs font-bold transition-all"
            style={{
              background: tab === rt.key ? '#F3B4E3' : 'rgba(243,180,227,0.12)',
              color: tab === rt.key ? '#FFFFFF' : '#F3B4E3',
            }}
          >
            {rt.label}
          </button>
        ))}
      </div>

      {/* Album grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filtered.map(p => {
          const counts = productCardCounts.get(p.product_id)
          const owned = counts?.owned ?? 0
          const total = counts?.total ?? 0
          const hasAny = userCardProductIds.has(p.product_id)

          const unpublished = p.is_published === false
          return (
            <button
              key={p.product_id}
              onClick={() => onSelect(p)}
              className="text-left rounded-2xl overflow-hidden transition-transform active:scale-[0.97] relative"
              style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: unpublished ? 0.55 : 1 }}
            >
              {unpublished && (
                <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                  style={{ background: 'rgba(0,0,0,0.7)', color: '#FFFFFF' }}>
                  未公開
                </div>
              )}
              {/* Album art placeholder */}
              <div
                className="w-full aspect-square flex items-center justify-center relative"
                style={{
                  background: p.image_url
                    ? `url(${p.image_url}) center/cover`
                    : 'linear-gradient(135deg, rgba(243,180,227,0.15) 0%, rgba(167,139,250,0.12) 100%)',
                }}
              >
                {!p.image_url && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
                {/* Progress badge */}
                {total > 0 && (
                  <div
                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                      background: hasAny ? 'rgba(52,211,153,0.9)' : 'rgba(142,142,147,0.7)',
                      color: '#FFFFFF',
                    }}
                  >
                    {owned}/{total}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: '#1C1C1E' }}>{p.product_name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px]" style={{ color: '#8E8E93' }}>{formatDate(p.release_date)}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA' }}
                  >
                    {productTypeLabels[p.product_type] || p.product_type}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: '#8E8E93' }}>{t('noAlbums')}</p>
        </div>
      )}
    </div>
  )
}
