'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { AppSpot } from '@/lib/supabase/adapters'

function FlyTo({ spot }: { spot: AppSpot | null }) {
  const map = useMap()
  const prevId = useRef<string | null>(null)
  useEffect(() => {
    if (spot && spot.id !== prevId.current) {
      prevId.current = spot.id
      map.flyTo([spot.lat, spot.lng], 15, { duration: 0.8 })
    }
  }, [spot, map])
  return null
}

function LocateButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap()
  const [loading, setLoading] = useState(false)

  const locate = useCallback(() => {
    if (!navigator.geolocation) return
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        map.flyTo([latitude, longitude], 13, { duration: 1 })
        onLocate(latitude, longitude)
        setLoading(false)
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [map, onLocate])

  return (
    <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000 }}>
      <button
        onClick={locate}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#1C1C1F', border: '1px solid #3A3A3E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
          cursor: 'pointer',
        }}
      >
        {loading ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
            </path>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeOpacity="0.3" />
          </svg>
        )}
      </button>
    </div>
  )
}

function makeIcon(selected: boolean, incomplete: boolean) {
  const size = selected ? 42 : 34
  const border = selected ? 3 : 2
  const color = incomplete ? '#F59E0B' : selected ? '#F3B4E3' : '#C97AB8'
  const bg = incomplete ? 'rgba(245,158,11,0.18)' : selected ? 'rgba(243,180,227,0.18)' : 'rgba(201,122,184,0.15)'
  const shadow = selected
    ? '0 0 0 4px rgba(243,180,227,0.25), 0 3px 10px rgba(0,0,0,0.6)'
    : '0 2px 6px rgba(0,0,0,0.5)'
  const badge = incomplete && !selected
    ? `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:#F59E0B;color:#131315;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1">!</div>`
    : ''
  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:${border}px solid ${color};display:flex;align-items:center;justify-content:center;font-size:${selected ? 18 : 14}px;box-shadow:${shadow}">📍${badge}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const myLocationIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,130,246,0.35),0 2px 6px rgba(0,0,0,0.5)"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function SpotMap({
  spots,
  selectedId,
  onSpotClick,
  incompleteIds = new Set(),
}: {
  spots: AppSpot[]
  selectedId: string | null
  onSpotClick: (id: string) => void
  incompleteIds?: Set<string>
}) {
  const selected = spots.find((s) => s.id === selectedId) ?? null
  const [myPos, setMyPos] = useState<[number, number] | null>(null)

  return (
    <MapContainer
      center={[35, 135]}
      zoom={3}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
      zoomDelta={1}
      zoomSnap={1}
      minZoom={2}
      maxZoom={18}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <FlyTo spot={selected} />
      <LocateButton onLocate={(lat, lng) => setMyPos([lat, lng])} />
      {myPos && (
        <>
          <Circle
            center={myPos}
            radius={400}
            pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.15, weight: 1 }}
          />
          <Marker position={myPos} icon={myLocationIcon} />
        </>
      )}
      {spots.map((spot) => {
        const sel = spot.id === selectedId
        const incomplete = incompleteIds.has(spot.id)
        return (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={makeIcon(sel, incomplete)}
            eventHandlers={{ click: () => onSpotClick(spot.id) }}
          />
        )
      })}
    </MapContainer>
  )
}
