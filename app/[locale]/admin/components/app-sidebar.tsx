"use client"

import {
  FileText,
  Users,
  ShieldCheck,
  Megaphone,
  Tags,
  Music,
  LayoutDashboard,
  ArrowLeft,
} from "lucide-react"
import { Link, usePathname } from "@/i18n/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "ダッシュボード",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "投稿管理",
    url: "/admin/posts",
    icon: FileText,
  },
  {
    title: "承認設定",
    url: "/admin/approvals",
    icon: ShieldCheck,
  },
  {
    title: "ユーザー管理",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "お知らせ管理",
    url: "/admin/announcements",
    icon: Megaphone,
  },
  {
    title: "タグ管理",
    url: "/admin/tags",
    icon: Tags,
  },
  {
    title: "アーティスト管理",
    url: "/admin/artists",
    icon: Music,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/admin" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Connects+</span>
                <span className="truncate text-xs text-muted-foreground">管理画面</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>管理メニュー</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  isActive={
                    item.url === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.url)
                  }
                  tooltip={item.title}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              tooltip="アプリに戻る"
            >
              <ArrowLeft />
              <span>アプリに戻る</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
