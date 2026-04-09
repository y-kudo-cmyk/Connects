'use client'

import { useState } from 'react'
import AddScheduleModal from './AddScheduleModal'
import { useTranslations } from 'next-intl'

export default function AddScheduleButton() {
  const t = useTranslations()
  const [show, setShow] = useState(false)

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
        style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#F3B4E3' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {t('Schedule.addSchedule')}
      </button>
      {show && <AddScheduleModal onClose={() => setShow(false)} />}
    </>
  )
}
