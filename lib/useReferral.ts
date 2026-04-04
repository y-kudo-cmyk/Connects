'use client'

import { useState, useEffect } from 'react'

const VERIFIED_KEY = 'cp-referral-verified'
const MY_CODE_KEY = 'cp-my-referral'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字除外
  let code = 'CP'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function useReferral() {
  const [verified, setVerified] = useState<boolean | null>(null)
  const [myCode, setMyCode] = useState<string>('')

  useEffect(() => {
    const v = localStorage.getItem(VERIFIED_KEY)
    setVerified(v === 'true')

    let code = localStorage.getItem(MY_CODE_KEY)
    if (!code) {
      code = generateCode()
      localStorage.setItem(MY_CODE_KEY, code)
    }
    setMyCode(code)
  }, [])

  const verify = () => {
    localStorage.setItem(VERIFIED_KEY, 'true')
    setVerified(true)
  }

  return { verified, myCode, verify }
}
