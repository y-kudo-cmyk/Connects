import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json() as { code?: string }
    if (!code) return NextResponse.json({ valid: false })

    const normalized = code.trim().toUpperCase()

    // env に登録されたマスターコード（カンマ区切り）
    const masterCodes = (process.env.REFERRAL_MASTER_CODES ?? '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)

    // ユーザー生成コードの形式チェック: CP + 6文字英数字
    const userCodePattern = /^CP[A-Z0-9]{6}$/

    const valid =
      masterCodes.includes(normalized) ||
      userCodePattern.test(normalized)

    return NextResponse.json({ valid })
  } catch (e) {
    console.error('[validate-referral]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
