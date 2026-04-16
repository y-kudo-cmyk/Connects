'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import {
  TabNavigationContext,
  PATH_TO_TAB,
  TAB_PATHS,
  type TabId,
} from '@/lib/useTabNavigation'

import HomeContent from '@/components/HomeContent'
import MyPage from '@/app/[locale]/(main)/my/page'
import SchedulePage from '@/app/[locale]/(main)/schedule/page'
import MapPage from '@/app/[locale]/(main)/map/page'
import GoodsPage from '@/app/[locale]/(main)/goods/page'
import ProfilePage from '@/app/[locale]/(main)/profile/page'

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  home: HomeContent,
  my: MyPage,
  schedule: SchedulePage,
  map: MapPage,
  goods: GoodsPage,
  profile: ProfilePage,
}

const ALL_TABS: TabId[] = ['home', 'my', 'schedule', 'map', 'goods', 'profile']

export default function TabContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = useLocale()

  // Determine if current path is a tab path
  const currentTab = PATH_TO_TAB[pathname] ?? null
  const isTabPage = currentTab !== null

  const [activeTab, setActiveTab] = useState<TabId>(currentTab ?? 'home')
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(
    () => new Set(currentTab ? [currentTab] : ['home'])
  )

  // Sync active tab when pathname changes (browser back/forward)
  useEffect(() => {
    if (currentTab && currentTab !== activeTab) {
      setActiveTab(currentTab)
      setMountedTabs((prev) => {
        if (prev.has(currentTab)) return prev
        const next = new Set(prev)
        next.add(currentTab)
        return next
      })
    }
  }, [currentTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return

      // Mount tab if not yet mounted
      setMountedTabs((prev) => {
        if (prev.has(tab)) return prev
        const next = new Set(prev)
        next.add(tab)
        return next
      })

      setActiveTab(tab)

      // Update URL without triggering Next.js navigation.
      // Use replaceState so we don't create history entries that conflict
      // with Next.js router's own history management.
      const prefix = locale === 'ja' ? '' : `/${locale}`
      const urlPath = tab === 'home' ? (prefix || '/') : `${prefix}${TAB_PATHS[tab]}`
      window.history.replaceState(window.history.state, '', urlPath)
    },
    [activeTab, locale]
  )

  const ctxValue = useMemo(
    () => ({ activeTab, switchTab, mountedTabs }),
    [activeTab, switchTab, mountedTabs]
  )

  // For non-tab routes (e.g. /notification), render children normally
  if (!isTabPage) {
    return (
      <TabNavigationContext.Provider value={ctxValue}>
        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </main>
      </TabNavigationContext.Provider>
    )
  }

  return (
    <TabNavigationContext.Provider value={ctxValue}>
      {ALL_TABS.map((tab) => {
        if (!mountedTabs.has(tab)) return null
        const Component = TAB_COMPONENTS[tab]
        const isActive = activeTab === tab
        return (
          <div
            key={tab}
            className="flex-1 overflow-y-auto"
            style={{
              display: isActive ? 'flex' : 'none',
              flexDirection: 'column',
              paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
              WebkitOverflowScrolling: 'touch',
              // Each tab panel fills the container and scrolls independently
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <Component />
          </div>
        )
      })}
    </TabNavigationContext.Provider>
  )
}
