'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function NicknameSetupOverlay({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) { setError('ユーザー名を入力してください'); return }
    if (trimmed.includes('@')) { setError('「@」は使えません'); return }
    if (trimmed.length > 30) { setError('30文字以内で入力してください'); return }

    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('profiles').update({ nickname: trimmed }).eq('id', userId)
    setSaving(false)
    if (err) { setError('保存に失敗しました：' + err.message); return }
    onDone()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: 24,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1E', margin: 0 }}>ユーザー名を設定</h2>
          <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 6, lineHeight: 1.6 }}>
            投稿や共有機能で表示される名前です。<br/>
            いつでも変更可能です。
          </p>
        </div>
        <p style={{ fontSize: 10, color: '#EF4444', background: 'rgba(239,68,68,0.08)', padding: '8px 10px', borderRadius: 10, margin: '0 0 12px', lineHeight: 1.6, textAlign: 'center' }}>
          ⚠️ ユーザー名は他のユーザーに表示される可能性があります
        </p>
        <input
          type="text"
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setError('') }}
          placeholder="ニックネーム"
          autoFocus
          maxLength={30}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: '1.5px solid #E5E5EA',
            fontSize: 15,
            outline: 'none',
            color: '#1C1C1E',
            background: '#FFFFFF',
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => e.key === 'Enter' && !saving && handleSave()}
        />
        {error && (
          <p style={{ fontSize: 11, color: '#EF4444', marginTop: 8, textAlign: 'center' }}>{error}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !nickname.trim()}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '14px 0',
            borderRadius: 14,
            background: saving || !nickname.trim() ? '#E5E5EA' : 'linear-gradient(135deg, #F3B4E3, #C97AB8)',
            color: saving || !nickname.trim() ? '#8E8E93' : '#FFFFFF',
            fontSize: 14,
            fontWeight: 800,
            border: 'none',
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? '保存中…' : '登録'}
        </button>
      </div>
    </div>
  )
}
