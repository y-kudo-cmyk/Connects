'use client'

import { createContext, useContext } from 'react'

export type TabId = 'home' | 'my' | 'schedule' | 'map' | 'goods' | 'profile'

export const TAB_PATHS: Record<TabId, string> = {
  home: '/',
  my: '/my',
  schedule: '/schedule',
  map: '/map',
  goods: '/goods',
  profile: '/profile',
}

export const PATH_TO_TAB: Record<string, TabId> = {
  '/': 'home',
  '/my': 'my',
  '/schedule': 'schedule',
  '/map': 'map',
  '/goods': 'goods',
  '/profile': 'profile',
}

export type TabNavigationContextType = {
  activeTab: TabId
  switchTab: (tab: TabId) => void
  mountedTabs: Set<TabId>
}

export const TabNavigationContext = createContext<TabNavigationContextType>({
  activeTab: 'home',
  switchTab: () => {},
  mountedTabs: new Set(['home']),
})

export function useTabNavigation() {
  return useContext(TabNavigationContext)
}
