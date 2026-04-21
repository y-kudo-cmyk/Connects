'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

export default function NotificationSetupOverlay({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [morningOn, setMorningOn] = useState(false)
  const [morningTime, setMorningTime] = useState('08:00')
  const [eveningOn, setEveningOn] = useState(false)
  const [eveningTime, setEveningTime] = useState('21:00')
  const [reminderOn, setReminderOn] = useState(true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      notif_morning_on: morningOn,
      notif_morning_time: morningTime,
      notif_evening_on: eveningOn,
      notif_evening_time: eveningTime,
      notif_event_reminder: reminderOn,
      notif_setup_done: true,
    }).eq('id', userId)
    setSaving(false)
    onDone()
  }

  const handleSkip = async () => {
    // 設定しなくても全部 OFF で保存して二度と出さない
    setSaving(true)
    await supabase.from('profiles').update({
      notif_morning_on: false,
      notif_evening_on: false,
      notif_event_reminder: false,
      notif_setup_done: true,
    }).eq('id', userId)
    setSaving(false)
    onDone()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, overflow: 'auto',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: 24,
          maxWidth: 400,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C1C1E', margin: 0 }}>通知設定</h2>
          <p style={{ fontSize: 11, color: '#8E8E93', marginTop: 6, lineHeight: 1.6 }}>
            あとからプロフィール画面で変更できます
          </p>
        </div>

        {/* 朝の通知 */}
        <div style={{ borderBottom: '1px solid #F0F0F5', paddingBottom: 14, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={morningOn}
              onChange={(e) => setMorningOn(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>🌅 朝の通知</div>
              <div style={{ fontSize: 10, color: '#8E8E93' }}>今日のスケジュール</div>
            </div>
          </label>
          {morningOn && (
            <select
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              style={{ marginTop: 8, marginLeft: 26, padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E5EA', fontSize: 13 }}
            >
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* 夜の通知 */}
        <div style={{ borderBottom: '1px solid #F0F0F5', paddingBottom: 14, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={eveningOn}
              onChange={(e) => setEveningOn(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>🌙 夜の通知</div>
              <div style={{ fontSize: 10, color: '#8E8E93' }}>明日のスケジュール + 今日締切のTICKET</div>
            </div>
          </label>
          {eveningOn && (
            <select
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              style={{ marginTop: 8, marginLeft: 26, padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E5EA', fontSize: 13 }}
            >
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* MYイベント */}
        <div style={{ paddingBottom: 14, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={reminderOn}
              onChange={(e) => setReminderOn(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>⏰ MYイベント</div>
              <div style={{ fontSize: 10, color: '#8E8E93' }}>MYに登録したスケジュールを開始/締切1時間前に通知</div>
            </div>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 14,
            background: saving ? '#E5E5EA' : 'linear-gradient(135deg, #F3B4E3, #C97AB8)',
            color: saving ? '#8E8E93' : '#FFFFFF',
            fontSize: 14,
            fontWeight: 800,
            border: 'none',
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? '保存中…' : 'この設定で始める'}
        </button>
        <button
          onClick={handleSkip}
          disabled={saving}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '10px 0',
            border: 'none',
            background: 'transparent',
            color: '#8E8E93',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          通知を受け取らない
        </button>
      </div>
    </div>
  )
}
