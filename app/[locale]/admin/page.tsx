import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "./components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

async function getStats() {
  const supabase = await createClient()

  const [
    { count: totalEvents },
    { count: pendingEvents },
    { count: confirmedEvents },
    { count: rejectedEvents },
    { count: totalUsers },
    { count: totalSpots },
    { data: recentPending },
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("spots").select("*", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("id, event_title, tag, status, verified_count, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  return {
    totalEvents: totalEvents ?? 0,
    pendingEvents: pendingEvents ?? 0,
    confirmedEvents: confirmedEvents ?? 0,
    rejectedEvents: rejectedEvents ?? 0,
    totalUsers: totalUsers ?? 0,
    totalSpots: totalSpots ?? 0,
    recentPending: recentPending ?? [],
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const summaryCards = [
    {
      title: "全イベント",
      value: stats.totalEvents,
      icon: FileText,
    },
    {
      title: "承認待ち",
      value: stats.pendingEvents,
      icon: Clock,
      variant: stats.pendingEvents > 0 ? "destructive" as const : "secondary" as const,
    },
    {
      title: "承認済み",
      value: stats.confirmedEvents,
      icon: CheckCircle,
    },
    {
      title: "ユーザー",
      value: stats.totalUsers,
      icon: Users,
    },
    {
      title: "スポット",
      value: stats.totalSpots,
      icon: ShieldCheck,
    },
    {
      title: "却下",
      value: stats.rejectedEvents,
      icon: XCircle,
    },
  ]

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近の承認待ちイベント</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPending.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                承認待ちのイベントはありません
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentPending.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {event.event_title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.tag}</Badge>
                      <Badge variant="secondary">
                        {event.verified_count}/3 承認
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
