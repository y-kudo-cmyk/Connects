import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { message, nickname } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"Connects+ Feedback" <${process.env.SMTP_USER}>`,
      to: 'info@connectsplus.net',
      subject: `【Connects+ ご意見】${nickname ?? '匿名'}より`,
      text: `送信者: ${nickname ?? '匿名'}\n\n${message}`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('feedback mail error:', err)
    return NextResponse.json({ error: 'send failed' }, { status: 500 })
  }
}
