'use client'
import { useState, useEffect } from 'react'

export type Todo = {
  id: string
  eventId?: string
  title: string
  date: string        // start date
  dateEnd?: string    // end date if period event
  time?: string
  sourceUrl?: string  // original source URL
  sourceName?: string
  memo?: string
  done: boolean
  notif: boolean
  createdAt: string
}

const KEY = 'cp-todos'
function load(): Todo[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }
function save(t: Todo[]) { try { localStorage.setItem(KEY, JSON.stringify(t)) } catch {} }

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  useEffect(() => { setTodos(load()) }, [])
  const _set = (next: Todo[]) => { save(next); setTodos(next) }
  return {
    todos,
    addTodo: (t: Todo) => _set([...load(), t]),
    toggleDone: (id: string) => _set(load().map(t => t.id === id ? { ...t, done: !t.done } : t)),
    updateTodo: (id: string, patch: Partial<Todo>) => _set(load().map(t => t.id === id ? { ...t, ...patch } : t)),
    removeTodo: (id: string) => _set(load().filter(t => t.id !== id)),
    hasTodo: (eventId: string) => load().some(t => t.eventId === eventId),
  }
}
