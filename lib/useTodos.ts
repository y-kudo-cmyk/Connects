'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'

const supabase = createClient()

export type Todo = {
  id: string
  eventId?: string
  title: string
  subTitle?: string
  date: string
  dateEnd?: string
  time?: string
  sourceUrl?: string
  sourceName?: string
  memo?: string
  done: boolean
  notif: boolean
  createdAt: string
}

type DbTodo = {
  id: string
  user_id: string
  event_id: string | null
  title: string
  sub_title: string | null
  date: string
  date_end: string | null
  time: string | null
  source_url: string | null
  source_name: string | null
  memo: string | null
  done: boolean
  notif: boolean
  created_at: string
}

function toApp(row: DbTodo): Todo {
  return {
    id: row.id,
    eventId: row.event_id ?? undefined,
    title: row.title,
    subTitle: row.sub_title ?? undefined,
    date: row.date,
    dateEnd: row.date_end ?? undefined,
    time: row.time ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceName: row.source_name ?? undefined,
    memo: row.memo ?? undefined,
    done: row.done,
    notif: row.notif,
    createdAt: row.created_at,
  }
}

export function useTodos() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])

  const fetchTodos = useCallback(async () => {
    if (!user) { setTodos([]); return }
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (data) setTodos(data.map(toApp))
  }, [user])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  const addTodo = async (t: Omit<Todo, 'id'> & { id?: string }) => {
    if (!user) return
    await supabase.from('todos').insert({
      user_id: user.id,
      event_id: t.eventId || null,
      title: t.title,
      sub_title: t.subTitle || null,
      date: t.date,
      date_end: t.dateEnd || null,
      time: t.time || null,
      source_url: t.sourceUrl || null,
      source_name: t.sourceName || null,
      memo: t.memo || null,
      done: t.done,
      notif: t.notif,
    })
    await fetchTodos()
  }

  const toggleDone = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    await supabase.from('todos').update({ done: !todo.done }).eq('id', id)
    await fetchTodos()
  }

  const updateTodo = async (id: string, patch: Partial<Todo>) => {
    const dbPatch: Record<string, unknown> = {}
    if (patch.title !== undefined) dbPatch.title = patch.title
    if (patch.subTitle !== undefined) dbPatch.sub_title = patch.subTitle || null
    if (patch.date !== undefined) dbPatch.date = patch.date
    if (patch.dateEnd !== undefined) dbPatch.date_end = patch.dateEnd || null
    if (patch.time !== undefined) dbPatch.time = patch.time || null
    if (patch.memo !== undefined) dbPatch.memo = patch.memo || null
    if (patch.done !== undefined) dbPatch.done = patch.done
    if (patch.notif !== undefined) dbPatch.notif = patch.notif
    if (patch.sourceUrl !== undefined) dbPatch.source_url = patch.sourceUrl || null
    if (patch.sourceName !== undefined) dbPatch.source_name = patch.sourceName || null
    await supabase.from('todos').update(dbPatch).eq('id', id)
    await fetchTodos()
  }

  const removeTodo = async (id: string) => {
    await supabase.from('todos').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (user) {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        action: 'delete_todo',
        detail: JSON.stringify({ todo_id: id }),
      })
    }
    await fetchTodos()
  }

  const hasTodo = (eventId: string) => todos.some(t => t.eventId === eventId)

  return { todos, addTodo, toggleDone, updateTodo, removeTodo, hasTodo }
}
