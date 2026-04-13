'use client'

import { Link, usePathname } from '@/i18n/navigation'

const tabs = [
  {
    id: 'home',
    label: 'HOME',
    href: '/',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#F3B4E3' : 'none'} stroke={active ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: 'my',
    label: 'MY',
    href: '/my',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#F3B4E3' : 'none'} stroke={active ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'SCHEDULE',
    href: '/schedule',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        {active && <circle cx="8" cy="15" r="1.5" fill="#F3B4E3" />}
        {active && <circle cx="12" cy="15" r="1.5" fill="#F3B4E3" />}
        {active && <circle cx="16" cy="15" r="1.5" fill="#F3B4E3" />}
      </svg>
    ),
  },
  {
    id: 'map',
    label: 'MAP',
    href: '/map',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" fill={active ? 'rgba(243,180,227,0.15)' : 'none'} />
        <circle cx="12" cy="10" r="3" fill={active ? '#F3B4E3' : 'none'} stroke={active ? '#F3B4E3' : '#6B6B70'} />
      </svg>
    ),
  },
  {
    id: 'goods',
    label: 'GOODS',
    href: '/goods',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill={active ? 'rgba(243,180,227,0.1)' : 'none'} />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'PROFILE',
    href: '/profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#F3B4E3' : '#6B6B70'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" fill={active ? 'rgba(243,180,227,0.2)' : 'none'} />
      </svg>
    ),
  },
]

export default function TabBar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      style={{
        background: '#F8F9FA',
        borderTop: '1px solid #2E2E32',
        paddingTop: 12,
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
      }}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href)
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 flex-1"
          >
            {tab.icon(active)}
            <span
              className="text-[9px] font-semibold tracking-wider"
              style={{ color: active ? '#F3B4E3' : '#6B6B70' }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
