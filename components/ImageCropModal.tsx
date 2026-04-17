'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'

type Props = {
  src: string
  aspectRatio?: number  // width/height  例: 4 (4:1バナー)  1 (1:1アバター)
  circle?: boolean
  onConfirm: (dataUrl: string) => void
  onCancel: () => void
}

export default function ImageCropModal({ src, aspectRatio = 4, circle = false, onConfirm, onCancel }: Props) {
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // 表示状態
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)

  // ジェスチャー追跡用
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)

  // コンテナサイズとクロップ枠を計算
  const getCropFrame = () => {
    const c = containerRef.current
    if (!c) return { x: 0, y: 0, w: 0, h: 0 }
    const cw = c.clientWidth
    const ch = c.clientHeight
    const frameAR = circle ? 1 : aspectRatio
    let fw: number, fh: number
    if (cw / ch > frameAR) {
      fh = ch * 0.85
      fw = fh * frameAR
    } else {
      fw = cw * 0.85
      fh = fw / frameAR
    }
    return { x: (cw - fw) / 2, y: (ch - fh) / 2, w: fw, h: fh }
  }

  // 画像読み込み完了後に初期スケールを設定
  const onImgLoad = () => {
    const img = imgRef.current
    const c = containerRef.current
    if (!img || !c) return
    const frame = getCropFrame()
    // クロップ枠に画像が収まる最小スケール
    const initScale = Math.max(frame.w / img.naturalWidth, frame.h / img.naturalHeight)
    setScale(initScale)
    setOffset({ x: 0, y: 0 })
    setReady(true)
  }

  // オフセットのクランプ（クロップ枠を常に画像内に収める）
  const clamp = (ox: number, oy: number, s: number) => {
    const img = imgRef.current
    const c = containerRef.current
    if (!img || !c) return { x: ox, y: oy }
    const frame = getCropFrame()
    const iw = img.naturalWidth * s
    const ih = img.naturalHeight * s
    // 画像がクロップ枠をカバーできる最大オフセット
    const maxX = Math.max(0, (iw - frame.w) / 2)
    const maxY = Math.max(0, (ih - frame.h) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }

  // ─── ポインタ（マウス/ペン）ジェスチャー ───
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.isPrimary) {
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!e.isPrimary || !dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const next = clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, scale)
    setOffset(next)
  }
  const onPointerUp = () => { dragStart.current = null }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.08 : 0.93
    setScale((prev) => {
      const img = imgRef.current
      if (!img) return prev
      const frame = getCropFrame()
      const minScale = Math.max(frame.w / img.naturalWidth, frame.h / img.naturalHeight)
      const next = Math.max(minScale, Math.min(10, prev * factor))
      setOffset((o) => clamp(o.x, o.y, next))
      return next
    })
  }

  // ─── タッチジェスチャー ───
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ox: offset.x, oy: offset.y }
    } else if (e.touches.length === 2) {
      dragStart.current = null
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      pinchStart.current = { dist: d, scale }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && dragStart.current) {
      const dx = e.touches[0].clientX - dragStart.current.x
      const dy = e.touches[0].clientY - dragStart.current.y
      setOffset(clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, scale))
    } else if (e.touches.length === 2 && pinchStart.current) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const img = imgRef.current
      if (!img) return
      const frame = getCropFrame()
      const minScale = Math.max(frame.w / img.naturalWidth, frame.h / img.naturalHeight)
      const next = Math.max(minScale, Math.min(10, pinchStart.current.scale * (d / pinchStart.current.dist)))
      setScale(next)
      setOffset((o) => clamp(o.x, o.y, next))
    }
  }

  const onTouchEnd = () => {
    dragStart.current = null
    pinchStart.current = null
  }

  // ─── 確定：クロップ枠の範囲だけcanvasに描画 ───
  const confirm = () => {
    const img = imgRef.current
    const c = containerRef.current
    if (!img || !c) return

    const frame = getCropFrame()
    const cw = c.clientWidth
    const ch = c.clientHeight

    // コンテナ中心に画像中心があり、offsetだけずれている
    // 画像中心のコンテナ座標
    const imgCX = cw / 2 + offset.x
    const imgCY = ch / 2 + offset.y

    // クロップ枠の左上のコンテナ座標
    const cropLeft = frame.x
    const cropTop = frame.y

    // クロップ枠→画像ナチュラル座標変換
    // ナチュラル画像の中心は (img.naturalWidth/2, img.naturalHeight/2)
    // コンテナ上での画像左上: (imgCX - naturalW*scale/2, imgCY - naturalH*scale/2)
    const imgLeft = imgCX - (img.naturalWidth * scale) / 2
    const imgTop  = imgCY - (img.naturalHeight * scale) / 2

    const sx = (cropLeft - imgLeft) / scale
    const sy = (cropTop  - imgTop)  / scale
    const sw = frame.w / scale
    const sh = frame.h / scale

    // 出力キャンバス
    const outW = circle ? 400 : 1200
    const outH = circle ? 400 : Math.round(outW / aspectRatio)
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (circle) {
      ctx.beginPath()
      ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2)
      ctx.clip()
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)
    onConfirm(canvas.toDataURL('image/jpeg', 0.88))
  }

  const [portalMounted, setPortalMounted] = useState(false)
  useEffect(() => { setPortalMounted(true) }, [])

  if (!portalMounted) return null

  return createPortal(
    <div className="fixed inset-0 flex flex-col" style={{ background: '#111', zIndex: 200 }}>
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))', paddingBottom: 14 }}
      >
        <button onClick={onCancel} className="text-sm font-semibold" style={{ color: '#8E8E93' }}>{t('Common.cancel')}</button>
        <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
          {circle ? t('Seat.cropIcon') : t('Seat.cropBanner')}
        </p>
        <button onClick={confirm} className="text-sm font-bold" style={{ color: '#F3B4E3' }}>{t('Common.done')}</button>
      </div>

      {/* 操作エリア */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 画像 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          onLoad={onImgLoad}
          draggable={false}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
            transformOrigin: 'center',
            maxWidth: 'none',
            userSelect: 'none',
            pointerEvents: 'none',
            opacity: ready ? 1 : 0,
          }}
        />

        {/* クロップオーバーレイ */}
        {ready && <CropOverlay circle={circle} aspectRatio={aspectRatio} />}
      </div>

      {/* ヒント */}
      <div
        className="flex-shrink-0 text-center py-3"
        style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
      >
        <p className="text-xs" style={{ color: '#636366' }}>{t('Seat.cropHint')}</p>
      </div>
    </div>,
    document.body
  )
}

// ─── クロップ枠オーバーレイ ───────────────────
function CropOverlay({ circle, aspectRatio }: { circle: boolean; aspectRatio: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 暗い背景 */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
      {/* 明るいクロップ窓 */}
      <div
        style={{
          position: 'relative',
          width: circle ? 'min(85vw, 85vh)' : 'min(90vw, calc(90vh * ' + aspectRatio + '))',
          height: circle ? 'min(85vw, 85vh)' : 'min(calc(90vw / ' + aspectRatio + '), 90vh)',
          borderRadius: circle ? '50%' : 8,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(243,180,227,0.85)',
          background: 'transparent',
        }}
      />
    </div>
  )
}
