"use client"

import { usePathname } from "@/i18n/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const pageTitles: Record<string, string> = {
  "/admin": "ダッシュボード",
  "/admin/posts": "投稿管理",
  "/admin/approvals": "承認設定",
  "/admin/users": "ユーザー管理",
  "/admin/announcements": "お知らせ管理",
  "/admin/tags": "タグ管理",
  "/admin/artists": "アーティスト管理",
  "/admin/feedback": "フィードバック",
}

export function AdminHeader() {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? "管理画面"
  const isTop = pathname === "/admin"

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/admin">管理画面</BreadcrumbLink>
          </BreadcrumbItem>
          {!isTop && (
            <>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
