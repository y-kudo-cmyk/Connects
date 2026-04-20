"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function requireAdmin(): ReturnType<typeof createClient> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Forbidden")
  return supabase
}

// ── Posts ─────────────────────────────────────────────────────

export async function updateEventStatus(
  eventId: string,
  status: "pending" | "confirmed" | "rejected"
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", eventId)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/posts")
}

export async function updateEvent(
  eventId: string,
  data: {
    event_title: string
    sub_event_title: string
    tag: string
    start_date: string | null
    end_date: string | null
    spot_name: string
    spot_address: string
    image_url: string
    notes: string
  }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("events")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", eventId)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/posts")
}

export async function deleteEvent(eventId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from("events").update({ status: "deleted" }).eq("id", eventId)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/posts")
}

// ── Users ─────────────────────────────────────────────────────

export async function updateUserRole(
  userId: string,
  role: "user" | "admin" | "banned"
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/users")
}

// ── Announcements ─────────────────────────────────────────────

export async function createAnnouncement(formData: FormData) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from("announcements").insert({
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    link_url: formData.get("link_url") as string,
    priority: Number(formData.get("priority")) || 0,
    published: formData.get("published") === "true",
    title_en: formData.get("title_en") as string || "",
    body_en: formData.get("body_en") as string || "",
    title_ko: formData.get("title_ko") as string || "",
    body_ko: formData.get("body_ko") as string || "",
  })

  if (error) throw new Error(error.message)
  revalidatePath("/admin/announcements")
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("announcements")
    .update({
      title: formData.get("title") as string,
      body: formData.get("body") as string,
      link_url: formData.get("link_url") as string,
      priority: Number(formData.get("priority")) || 0,
      published: formData.get("published") === "true",
      title_en: formData.get("title_en") as string || "",
      body_en: formData.get("body_en") as string || "",
      title_ko: formData.get("title_ko") as string || "",
      body_ko: formData.get("body_ko") as string || "",
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/announcements")
}

export async function deleteAnnouncement(id: string) {
  // soft delete: published=false にして非公開化。行は保持して復元可能。
  const supabase = await requireAdmin()
  const { error } = await supabase.from("announcements").update({ published: false }).eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/announcements")
}

// ── Tags ──────────────────────────────────────────────────────

export async function updateTag(
  id: string,
  data: { label: string; icon: string; color: string; bg: string; sort_order: number }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("schedule_tags")
    .update(data)
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/tags")
}

export async function createTag(
  data: { id: string; label: string; icon: string; color: string; bg: string; sort_order: number }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from("schedule_tags").insert(data)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/tags")
}

// ── Artists ───────────────────────────────────────────────────

export async function updateArtist(
  id: string,
  data: {
    name: string
    name_ja: string
    name_en: string
    name_ko: string
    level: string
    group_id: string | null
    color: string
    sort_order: number
  }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("artists")
    .update(data)
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/artists")
}
