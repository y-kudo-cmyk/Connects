'use client'

import { createClient } from './client'

const supabase = createClient()

/**
 * 画像を圧縮して Supabase Storage にアップロードし、公開URLを返す
 * @param bucket - バケット名 (例: 'event-images')
 * @param file - アップロードするファイル
 * @param maxPx - 最大幅/高さ (default: 1200)
 * @param quality - JPEG圧縮品質 (default: 0.85)
 */
export async function uploadImage(
  bucket: string,
  file: File,
  maxPx = 1200,
  quality = 0.85,
): Promise<string | null> {
  // 1. 圧縮
  const blob = await compressToBlob(file, maxPx, quality)

  // 2. ユニークなファイル名を生成
  const ext = 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  // 3. Supabase Storage にアップロード
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error.message)
    return null
  }

  // 4. 公開URLを取得
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

/** 画像を圧縮して Blob を返す */
function compressToBlob(file: File, maxPx: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        let { width: w, height: h } = img
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round((h * maxPx) / w); w = maxPx }
          else { w = Math.round((w * maxPx) / h); h = maxPx }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          quality,
        )
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}
