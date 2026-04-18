'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'

type Props = {
  src: string
  onConfirm: (dataUrl: string) => void
  onCancel: () => void
}

type Rect = { x: number; y: number; w: number; h: number }

const MIN_SIZE = 40
const HANDLE = 28

export default function FreeCropModal({ src, onConfirm, onCancel }: Props) {
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // 表示中の画像のコンテナ上矩形（object-fit: contain での実座標）
  const [imgRect, setImgRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  // クロップ矩形（コンテナ座標）
  const [crop, setCrop] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [ready, setReady] = useState(false)
  const [portalMounted, setPortalMounted] = useState(false)
  useEffect(() => { setPortalMounted(true) }, [])

  // 画像読み込み完了時に初期矩形を設定
  const init = () => {
    const c = containerRef.current
    const img = imgRef.current
    if (!c || !img) return
    const cw = c.clientWidth
    const ch = c.clientHeight
    const iar = img.naturalWidth / img.naturalHeight
    const car = cw / ch
    let w: number, h: number
    if (car > iar) {
      h = ch
      w = h * iar
    } else {
      w = cw
      h = w / iar
    }
    const x = (cw - w) / 2
    const y = (ch - h) / 2
    setImgRect({ x, y, w, h })
    // 初期クロップ：画像全体
    setCrop({ x, y, w, h })
    setReady(true)
  }

  // ポインタ操作
  type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; startCrop: Rect } | null>(null)

  const beginDrag = (mode: DragMode, clientX: number, clientY: number) => {
    dragRef.current = { mode, startX: clientX, startY: clientY, startCrop: { ...crop } }
  }

  const updateDrag = (clientX: number, clientY: number) => {
    const d = dragRef.current
    if (!d) return
    const dx = clientX - d.startX
    const dy = clientY - d.startY
    const bound = imgRect
    const c = { ...d.startCrop }

    const clampXY = (r: Rect): Rect => {
      const nx = Math.max(bound.x, Math.min(bound.x + bound.w - r.w, r.x))
      const ny = Math.max(bound.y, Math.min(bound.y + bound.h - r.h, r.y))
      return { x: nx, y: ny, w: r.w, h: r.h }
    }

    if (d.mode === 'move') {
      setCrop(clampXY({ ...c, x: c.x + dx, y: c.y + dy }))
      return
    }

    let left = c.x
    let top = c.y
    let right = c.x + c.w
    let bottom = c.y + c.h

    if (d.mode.includes('w')) left = Math.min(right - MIN_SIZE, Math.max(bound.x, c.x + dx))
    if (d.mode.includes('e')) right = Math.max(left + MIN_SIZE, Math.min(bound.x + bound.w, c.x + c.w + dx))
    if (d.mode.includes('n')) top = Math.min(bottom - MIN_SIZE, Math.max(bound.y, c.y + dy))
    if (d.mode.includes('s')) bottom = Math.max(top + MIN_SIZE, Math.min(bound.y + bound.h, c.y + c.h + dy))

    setCrop({ x: left, y: top, w: right - left, h: bottom - top })
  }

  const endDrag = () => { dragRef.current = null }

  // 確定：クロップ領域を元画像座標に変換してcanvas描画
  const confirm = () => {
    const img = imgRef.current
    if (!img) return
    const scale = img.naturalWidth / imgRect.w
    const sx = (crop.x - imgRect.x) * scale
    const sy = (crop.y - imgRect.y) * scale
    const sw = crop.w * scale
    const sh = crop.h * scale
    const outW = Math.min(1600, Math.round(sw))
    const outH = Math.round(outW * (sh / sw))
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)
    onConfirm(canvas.toDataURL('image/jpeg', 0.9))
  }

  if (!portalMounted) return null

  return createPortal(
    <div className="fixed inset-0 flex flex-col" style={{ background: '#111', zIndex: 200 }}>
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))', paddingBottom: 14 }}
      >
        <button onClick={onCancel} className="text-sm font-semibold" style={{ color: '#8E8E93' }}>{t('Common.cancel')}</button>
        <p className="text-sm font-bold" style={{ color: '#FFFFFF' }}>トリミング</p>
        <button onClick={confirm} className="text-sm font-bold" style={{ color: '#F3B4E3' }}>{t('Common.done')}</button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative"
        style={{ touchAction: 'none', overflow: 'hidden' }}
        onPointerMove={(e) => { if (dragRef.current) updateDrag(e.clientX, e.clientY) }}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onTouchMove={(e) => { if (dragRef.current && e.touches[0]) { e.preventDefault(); updateDrag(e.touches[0].clientX, e.touches[0].clientY) } }}
        onTouchEnd={endDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          onLoad={init}
          draggable={false}
          style={{
            position: 'absolute',
            left: imgRect.x,
            top: imgRect.y,
            width: imgRect.w,
            height: imgRect.h,
            userSelect: 'none',
            pointerEvents: 'none',
            opacity: ready ? 1 : 0,
          }}
        />

        {/* 暗いオーバーレイ（クロップ外） */}
        {ready && (
          <>
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: crop.y, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 0, top: crop.y + crop.h, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 0, top: crop.y, width: crop.x, height: crop.h, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: crop.x + crop.w, top: crop.y, right: 0, height: crop.h, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />

            {/* クロップ枠 + 移動エリア */}
            <div
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); beginDrag('move', e.clientX, e.clientY) }}
              onTouchStart={(e) => { if (e.touches[0]) beginDrag('move', e.touches[0].clientX, e.touches[0].clientY) }}
              style={{
                position: 'absolute',
                left: crop.x,
                top: crop.y,
                width: crop.w,
                height: crop.h,
                boxShadow: 'inset 0 0 0 2px rgba(243,180,227,0.95)',
                cursor: 'move',
              }}
            />

            {/* 4コーナーハンドル + 4エッジハンドル */}
            {(['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'] as DragMode[]).map((m) => {
              const isCorner = m.length === 2
              let left = 0, top = 0
              if (m.includes('w')) left = crop.x - HANDLE / 2
              else if (m.includes('e')) left = crop.x + crop.w - HANDLE / 2
              else left = crop.x + crop.w / 2 - HANDLE / 2
              if (m.includes('n')) top = crop.y - HANDLE / 2
              else if (m.includes('s')) top = crop.y + crop.h - HANDLE / 2
              else top = crop.y + crop.h / 2 - HANDLE / 2
              return (
                <div
                  key={m}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); beginDrag(m, e.clientX, e.clientY) }}
                  onTouchStart={(e) => { if (e.touches[0]) beginDrag(m, e.touches[0].clientX, e.touches[0].clientY) }}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width: HANDLE,
                    height: HANDLE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{
                    width: isCorner ? 14 : 10,
                    height: isCorner ? 14 : 10,
                    background: '#F3B4E3',
                    border: '2px solid #FFF',
                    borderRadius: isCorner ? 3 : 6,
                  }} />
                </div>
              )
            })}
          </>
        )}
      </div>

      <div
        className="flex-shrink-0 text-center py-3"
        style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
      >
        <p className="text-xs" style={{ color: '#636366' }}>枠の角をドラッグして自由にトリミング</p>
      </div>
    </div>,
    document.body
  )
}
