import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { seventeenMembers } from '@/lib/config/constants'
import ShareActions from './ShareActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CardProduct {
  product_id: string
  product_name: string
  product_type: string
  region: string
  release_date: string | null
  image_url: string
}

interface CardVersion {
  version_id: string
  product_id: string
  version_name: string
  sort_order?: number
}

interface UserCard {
  id: string
  user_id: string
  card_master_id: string | null
  product_id: string
  version_id: string
  member_id: string
  member_name: string
  front_image_url: string
  back_image_url: string
  quantity: number
  wanted_count: number | null
  notes: string
  status: string
}

interface ShareData {
  nickname: string
  refCode: string
  favMemberIds: string[]
  products: Map<string, CardProduct>
  versions: Map<string, CardVersion>
  userCards: UserCard[]
  selectedProductIds: string[]
  memberFilter: string | null
}

const memberIdByIndex = seventeenMembers.map((m, i) => ({
  memberId: `A${String(i + 1).padStart(6, '0')}`,
  name: m.name,
  color: m.color,
  index: i,
}))
const memberColorMap = new Map(memberIdByIndex.map(m => [m.memberId, m.color]))
const memberOrderMap = new Map(memberIdByIndex.map(m => [m.memberId, m.index]))
const memberNameMap = new Map(memberIdByIndex.map(m => [m.memberId, m.name]))

function formatDate(d: string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}

function parseAlbumsParam(v: string | string[] | undefined): string[] | 'all' {
  if (!v) return 'all'
  const raw = Array.isArray(v) ? v.join(',') : v
  if (!raw || raw === 'all') return 'all'
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function parseMemberParam(v: string | string[] | undefined): string | null {
  if (!v) return null
  const raw = Array.isArray(v) ? v[0] : v
  return raw || null
}

function effectiveWanted(card: UserCard, oshiSet: Set<string>): number {
  if (card.wanted_count != null) return card.wanted_count
  return oshiSet.has(card.member_id) ? 1 : 0
}

async function loadShareData(userId: string, searchParams: Record<string, string | string[] | undefined>): Promise<ShareData | null> {
  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profile } = await sb
    .from('profiles')
    .select('id, nickname, fav_member_ids, role, ref_code')
    .eq('id', userId)
    .maybeSingle()
  if (!profile) return null
  // シェア機能は全ユーザー利用可 (banned は除外)
  if (profile.role === 'banned') return null

  const { data: allCards } = await sb
    .from('user_cards')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')

  const userCards: UserCard[] = (allCards as UserCard[] | null) ?? []

  const albumsParam = parseAlbumsParam(searchParams.albums)
  const memberFilter = parseMemberParam(searchParams.member)

  const allOwnedProductIds = Array.from(new Set(userCards.map(c => c.product_id)))
  const selectedProductIds =
    albumsParam === 'all'
      ? allOwnedProductIds
      : albumsParam.filter(id => allOwnedProductIds.includes(id))

  const productIdsToFetch = selectedProductIds.length > 0 ? selectedProductIds : allOwnedProductIds

  const productsMap = new Map<string, CardProduct>()
  const versionsMap = new Map<string, CardVersion>()
  if (productIdsToFetch.length > 0) {
    const { data: prods } = await sb
      .from('card_products')
      .select('product_id, product_name, product_type, region, release_date, image_url')
      .in('product_id', productIdsToFetch)
    for (const p of (prods as CardProduct[] | null) ?? []) productsMap.set(p.product_id, p)

    const { data: vers } = await sb
      .from('card_versions')
      .select('version_id, product_id, version_name, sort_order')
      .in('product_id', productIdsToFetch)
    for (const v of (vers as CardVersion[] | null) ?? []) versionsMap.set(v.version_id, v)
  }

  return {
    nickname: profile.nickname || 'CARAT',
    refCode: (profile.ref_code as string | null) ?? '',
    favMemberIds: (profile.fav_member_ids as string[] | null) ?? [],
    products: productsMap,
    versions: versionsMap,
    userCards,
    selectedProductIds,
    memberFilter,
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const { userId } = await params
  const sp = await searchParams
  const data = await loadShareData(userId, sp)
  if (!data) return { title: 'SEVENTEEN トレカ | Connects+' }

  const oshiSet = new Set(data.favMemberIds)
  const scoped = filterScope(data, oshiSet)
  const offerCount = scoped.offering.length
  const seekCount = scoped.seeking.length

  const albumNames = Array.from(
    new Set(
      Array.from(data.products.values())
        .filter(p => data.selectedProductIds.length === 0 || data.selectedProductIds.includes(p.product_id))
        .map(p => p.product_name)
    )
  )
  const albumLabel = albumNames.length === 0
    ? '全アルバム'
    : albumNames.length <= 2
    ? albumNames.join(' / ')
    : `${albumNames[0]} 他${albumNames.length - 1}件`

  const title = `${data.nickname}さんのトレカ交換 | ${albumLabel}`
  const description = `譲 ${offerCount}枚 / 求 ${seekCount}枚 - SEVENTEEN トレカ交換`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: '/logo.png', width: 512, height: 512 }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

function filterScope(data: ShareData, oshiSet: Set<string>): {
  offering: UserCard[]
  seeking: UserCard[]
} {
  const offering: UserCard[] = []
  const seeking: UserCard[] = []
  const productIds = new Set(
    data.selectedProductIds.length > 0
      ? data.selectedProductIds
      : Array.from(new Set(data.userCards.map(c => c.product_id)))
  )
  for (const c of data.userCards) {
    if (!productIds.has(c.product_id)) continue
    if (data.memberFilter && c.member_id !== data.memberFilter) continue
    const wanted = effectiveWanted(c, oshiSet)
    if (c.quantity - wanted > 0) offering.push(c)
    else if (wanted - c.quantity > 0) seeking.push(c)
  }
  const sortFn = (a: UserCard, b: UserCard) => {
    const ao = memberOrderMap.get(a.member_id) ?? 999
    const bo = memberOrderMap.get(b.member_id) ?? 999
    if (ao !== bo) return ao - bo
    return (a.product_id + a.version_id).localeCompare(b.product_id + b.version_id)
  }
  offering.sort(sortFn)
  seeking.sort(sortFn)
  return { offering, seeking }
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { userId } = await params
  const sp = await searchParams
  const data = await loadShareData(userId, sp)
  if (!data) notFound()

  const oshiSet = new Set(data.favMemberIds)
  const { offering, seeking } = filterScope(data, oshiSet)

  const displayProducts = Array.from(data.products.values())
    .filter(p => data.selectedProductIds.length === 0 || data.selectedProductIds.includes(p.product_id))
    .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <div className="max-w-lg mx-auto" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
              style={{ background: '#F3B4E3', color: '#FFFFFF' }}
            >
              {data.nickname.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black truncate" style={{ color: '#1C1C1E' }}>
                {data.nickname}さんのトレカ交換
              </h1>
              <p className="text-[10px]" style={{ color: '#8E8E93' }}>
                Connects+ / SEVENTEEN
              </p>
            </div>
          </div>

          {/* Albums */}
          {displayProducts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {displayProducts.map(p => (
                <div
                  key={p.product_id}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(243,180,227,0.15)' }}
                >
                  {p.image_url && (
                    <div
                      className="w-6 h-6 rounded-md flex-shrink-0"
                      style={{ background: `url(${p.image_url}) center/cover` }}
                    />
                  )}
                  <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: '#1C1C1E' }}>
                    {p.product_name}
                  </span>
                  {p.release_date && (
                    <span className="text-[9px]" style={{ color: '#8E8E93' }}>
                      {formatDate(p.release_date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Member filter badge */}
          {data.memberFilter && (
            <div className="mt-2">
              <span
                className="inline-block text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: '#1C1C1E', color: '#FFFFFF' }}
              >
                {memberNameMap.get(data.memberFilter) || data.memberFilter} のみ
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div
              className="rounded-xl px-3 py-2 flex items-center justify-between"
              style={{ background: 'rgba(243,180,227,0.12)' }}
            >
              <span className="text-[11px] font-bold" style={{ color: '#636366' }}>譲</span>
              <span className="text-base font-black" style={{ color: '#F3B4E3' }}>
                {offering.length}<span className="text-[10px] ml-0.5">枚</span>
              </span>
            </div>
            <div
              className="rounded-xl px-3 py-2 flex items-center justify-between"
              style={{ background: 'rgba(96,165,250,0.12)' }}
            >
              <span className="text-[11px] font-bold" style={{ color: '#636366' }}>求</span>
              <span className="text-base font-black" style={{ color: '#60A5FA' }}>
                {seeking.length}<span className="text-[10px] ml-0.5">枚</span>
              </span>
            </div>
          </div>
        </div>

        {/* Connects+ 宣伝枠 (トップ配置) */}
        <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #F3B4E3 0%, #C97AB8 100%)' }}>
          <div className="p-5 text-center" style={{ color: '#FFFFFF' }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="Connects+" className="w-10 h-10 rounded-xl" loading="lazy" />
            </div>
            <h3 className="text-base font-black mb-1">Connects+ でもっと快適に</h3>
            <p className="text-xs leading-relaxed opacity-90 mb-4">
              CARAT が CARAT の為に作った 推し活アプリ
            </p>
            <ul className="text-[11px] leading-relaxed opacity-95 text-left inline-block mb-4">
              <li>🎤 参戦記録を一括管理</li>
              <li>💿 全アルバム トレカマスタ 6,500+ 種</li>
              <li>📍 聖地巡礼スポット & 写真共有</li>
              <li>🔔 LINE で公演リマインド</li>
            </ul>
            <div className="flex flex-col gap-2">
              <Link
                href={data.refCode ? `/join?ref=${data.refCode}` : '/login'}
                className="block w-full py-3 rounded-xl text-sm font-black"
                style={{ background: '#FFFFFF', color: '#C97AB8' }}
              >
                {data.refCode ? `${data.nickname}さんの紹介で始める →` : '無料で始める →'}
              </Link>
              {data.refCode && (
                <p className="text-[10px] opacity-80">
                  紹介コード: <span className="font-mono font-bold">{data.refCode}</span> 自動入力
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 譲 Section */}
        <Section
          title="譲"
          subtitle="Offering - 交換に出せるトレカ"
          accent="#F3B4E3"
          bg="rgba(243,180,227,0.06)"
          cards={offering}
          oshiSet={oshiSet}
          products={data.products}
          versions={data.versions}
        />

        {/* 求 Section */}
        <Section
          title="求"
          subtitle="Seeking - 探しているトレカ"
          accent="#60A5FA"
          bg="rgba(96,165,250,0.06)"
          cards={seeking}
          oshiSet={oshiSet}
          products={data.products}
          versions={data.versions}
        />

        {/* Empty state */}
        {offering.length === 0 && seeking.length === 0 && (
          <div className="text-center py-16 px-6">
            <p className="text-sm" style={{ color: '#8E8E93' }}>
              交換対象のトレカはありません
            </p>
          </div>
        )}

        <ShareActions nickname={data.nickname} offerCount={offering.length} seekCount={seeking.length} />
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  accent,
  bg,
  cards,
  oshiSet,
  products,
  versions,
}: {
  title: string
  subtitle: string
  accent: string
  bg: string
  cards: UserCard[]
  oshiSet: Set<string>
  products: Map<string, CardProduct>
  versions: Map<string, CardVersion>
}) {
  if (cards.length === 0) return null
  return (
    <section className="mx-4 mb-4 rounded-2xl px-3 py-3" style={{ background: bg }}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-sm font-black w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: accent, color: '#FFFFFF' }}
        >
          {title}
        </span>
        <div>
          <div className="text-[11px] font-bold" style={{ color: '#1C1C1E' }}>{subtitle}</div>
          <div className="text-[10px]" style={{ color: '#8E8E93' }}>{cards.length}枚</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map(c => {
          const img = c.front_image_url
          const wanted = effectiveWanted(c, oshiSet)
          const surplus = title === '譲' ? c.quantity - wanted : wanted - c.quantity
          const accent2 = memberColorMap.get(c.member_id) || '#F3B4E3'
          const product = products.get(c.product_id)
          const version = versions.get(c.version_id)
          return (
            <div key={c.id} className="relative">
              <div
                className="aspect-[2/3] rounded-lg overflow-hidden relative"
                style={{
                  background: img
                    ? `url(${img}) center/cover`
                    : 'linear-gradient(135deg, rgba(243,180,227,0.1), rgba(167,139,250,0.08))',
                  border: `2px solid ${accent2}`,
                }}
              >
                {!img && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-center px-1" style={{ color: '#636366' }}>
                      {memberNameMap.get(c.member_id) || c.member_name}
                    </span>
                  </div>
                )}
                {surplus > 1 && (
                  <div
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: accent, color: '#FFFFFF' }}
                  >
                    ×{surplus}
                  </div>
                )}
              </div>
              <div className="mt-1">
                <div className="text-[9px] font-bold truncate" style={{ color: '#1C1C1E' }}>
                  {memberNameMap.get(c.member_id) || c.member_name}
                </div>
                {version && (
                  <div className="text-[8px] truncate" style={{ color: '#8E8E93' }}>
                    {version.version_name}
                  </div>
                )}
                {product && (
                  <div className="text-[8px] truncate" style={{ color: '#C7C7CC' }}>
                    {product.product_name}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
