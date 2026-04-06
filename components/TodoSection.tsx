'use client'

import { useState } from 'react'
import { useTodos, Todo } from '@/lib/useTodos'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useToday } from '@/lib/useToday'

// 期間イベントはdateEnd（終了日）で判定、単発はdate
function getDueStatus(todo: Todo, today: string): 'overdue' | 'today' | 'soon' | 'future' {
  const end = todo.dateEnd ?? todo.date
  if (end < today) return 'overdue'
  if (end === today) return 'today'
  const diff = (new Date(end).getTime() - new Date(today).getTime()) / 86400000
  return diff <= 3 ? 'soon' : 'future'
}

const DUE_STYLE = {
  overdue: { label: 'todoOverdue' as const, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  today:   { label: 'todoToday'   as const, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  soon:    { label: 'todoSoon'    as const, color: '#F3B4E3', bg: 'rgba(243,180,227,0.12)' },
  future:  { label: ''            as const, color: '#636366', bg: 'transparent' },
}

export default function TodoSection() {
  const TODAY = useToday()
  const { t } = useTranslation()
  const { todos, addTodo, toggleDone, removeTodo, updateTodo } = useTodos()
  const [input, setInput] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [hideDone, setHideDone] = useState(true)

  const pending = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)
  const visible = hideDone ? pending : todos

  const sorted = [...visible].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return a.date.localeCompare(b.date)
  })

  const handleAdd = () => {
    if (!input.trim()) return
    addTodo({
      id: Date.now().toString(),
      title: input.trim(),
      date: dueDate || TODAY,
      done: false,
      notif: false,
      createdAt: new Date().toISOString(),
    })
    setInput('')
    setDueDate('')
    setShowDatePicker(false)
  }

  return (
    <div className="px-4 pb-6">
      {/* セクションヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold tracking-wider" style={{ color: '#636366' }}>TODO</h2>
          {pending.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(243,180,227,0.15)', color: '#F3B4E3' }}>
              {pending.length}
            </span>
          )}
        </div>
        {done.length > 0 && (
          <button onClick={() => setHideDone((v) => !v)}
            className="flex items-center gap-1 text-xs" style={{ color: '#636366' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {hideDone
                ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
              }
            </svg>
            {t('todoDone')} {done.length}{t('items')}
          </button>
        )}
      </div>

      {/* 入力欄 */}
      <div className="rounded-2xl mb-3 overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={t('todoAdd')}
            className="flex-1 py-1.5 text-sm outline-none"
            style={{ background: 'transparent', color: '#1C1C1E' }}
          />
          <button
            onClick={() => setShowDatePicker((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold flex-shrink-0"
            style={dueDate
              ? { background: 'rgba(243,180,227,0.15)', color: '#F3B4E3' }
              : { color: showDatePicker ? '#F3B4E3' : '#636366' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {dueDate ? `${parseInt(dueDate.slice(5,7))}/${parseInt(dueDate.slice(8))}` : t('todoDueDate')}
          </button>
          <button
            onClick={handleAdd}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: input.trim() ? '#F3B4E3' : '#F0F0F5' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#FFFFFF' : '#C7C7CC'} strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        {showDatePicker && (
          <div className="px-3 pb-3 pt-1 flex items-center gap-2" style={{ borderTop: '1px solid #F0F0F5' }}>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#F8F9FA', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
            />
            {dueDate && (
              <button onClick={() => setDueDate('')}
                className="text-xs px-3 py-2 rounded-xl"
                style={{ color: '#636366', background: '#F0F0F5' }}>
                {t('clear')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* リスト */}
      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-6" style={{ color: '#8E8E93' }}>
          <p className="text-sm">{t('todoEmpty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onToggle={() => toggleDone(todo.id)}
              onRemove={() => removeTodo(todo.id)}
              onMemoChange={(memo) => updateTodo(todo.id, { memo })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TodoRow({ todo, onToggle, onRemove, onMemoChange }: {
  todo: Todo
  onToggle: () => void
  onRemove: () => void
  onMemoChange: (memo: string) => void
}) {
  const TODAY = useToday()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoVal, setMemoVal] = useState(todo.memo ?? '')
  const status = getDueStatus(todo, TODAY)
  const cfg = DUE_STYLE[status]

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', opacity: todo.done ? 0.6 : 1 }}>
      {/* メイン行 */}
      <div className="flex items-start gap-3 px-3 py-2.5">
        <button onClick={onToggle}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: todo.done ? '#F3B4E3' : 'transparent', border: `2px solid ${todo.done ? '#F3B4E3' : '#C7C7CC'}` }}>
          {todo.done && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </button>

        <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded(v => !v)}>
          <p className="text-sm leading-snug"
            style={{ color: todo.done ? '#8E8E93' : '#1C1C1E', textDecoration: todo.done ? 'line-through' : 'none' }}>
            {todo.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: cfg.bg, color: cfg.color }}>
              {todo.dateEnd
                ? `${todo.date.slice(5).replace('-','/')}${todo.time && todo.time !== '00:00' ? ` ${todo.time}` : ''} 〜 ${todo.dateEnd.slice(5).replace('-','/')}`
                : `${todo.date.slice(5).replace('-', '/')}${todo.time && todo.time !== '00:00' ? ` ${todo.time}` : ''}`}
              {cfg.label ? ` · ${t(cfg.label)}` : ''}
            </span>
            {todo.memo && !expanded && (
              <span className="text-[10px]" style={{ color: '#8E8E93' }}>📝</span>
            )}
          </div>
        </button>

        <button onClick={onRemove} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* 展開エリア */}
      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2" style={{ borderTop: '1px solid #F0F0F5' }}>
          {/* メモ編集 */}
          {editingMemo ? (
            <div className="flex flex-col gap-1.5 mt-2">
              <textarea
                value={memoVal}
                onChange={(e) => setMemoVal(e.target.value)}
                placeholder={t('todoMemo')}
                rows={3}
                autoFocus
                className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none"
                style={{ background: '#F8F9FA', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onMemoChange(memoVal); setEditingMemo(false) }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold"
                  style={{ background: '#F3B4E3', color: '#FFFFFF' }}
                >{t('save')}</button>
                <button
                  onClick={() => { setMemoVal(todo.memo ?? ''); setEditingMemo(false) }}
                  className="px-4 py-2 rounded-xl text-xs"
                  style={{ background: '#F0F0F5', color: '#636366' }}
                >{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingMemo(true)}
              className="flex items-start gap-2 px-3 py-2 rounded-xl text-left w-full mt-2"
              style={{ background: '#F8F9FA', border: '1px solid #E5E5EA' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span className="text-xs" style={{ color: todo.memo ? '#1C1C1E' : '#C7C7CC', whiteSpace: 'pre-wrap' }}>
                {todo.memo || t('todoMemoAdd')}
              </span>
            </button>
          )}

          {/* ソースリンク */}
          {todo.sourceUrl && (
            <a href={todo.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: '#F8F9FA', border: '1px solid #E5E5EA' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2" className="flex-shrink-0">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              <span className="text-xs truncate flex-1" style={{ color: '#636366' }}>
                {todo.sourceName ?? todo.sourceUrl}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" className="flex-shrink-0">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  )
}
