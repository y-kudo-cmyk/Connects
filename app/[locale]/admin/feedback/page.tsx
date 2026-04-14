import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../components/admin-header"

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: feedback } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <>
      <AdminHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {(!feedback || feedback.length === 0) ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            まだフィードバックはありません
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {feedback.map((fb) => (
              <div key={fb.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{fb.nickname || '匿名'}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(fb.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{fb.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
