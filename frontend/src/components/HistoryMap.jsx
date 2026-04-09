import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getMapCheckIns } from '../api/checkins'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

// Numbered circle icon for a check-in
function makeNumberIcon(n, color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:${color};border:2.5px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;color:#fff;font-family:sans-serif;
      ">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

// Last-marker icon: slightly larger, pulsing ring
function makeLastIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:36px;height:36px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};opacity:0.25;
          animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:${color};border:2.5px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="width:8px;height:8px;border-radius:50%;background:#fff;"></div>
        </div>
      </div>
      <style>
        @keyframes ping {
          75%,100%{transform:scale(2);opacity:0}
        }
      </style>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

const ME_COLOR      = '#7F77DD'
const PARTNER_COLOR = '#D85A30'

function MapLayers({ checkins, myDisplayName }) {
  const map = useMap()

  useEffect(() => {
    if (!checkins.length) return

    // Sort oldest → newest so numbers go 1, 2, 3...
    const sorted = [...checkins].sort(
      (a, b) => new Date(a.checked_in_at) - new Date(b.checked_in_at)
    )

    // Split into two sequences per user, preserving global order index
    const meSeq      = []
    const partnerSeq = []
    sorted.forEach((c) => {
      if (c.user_display_name === myDisplayName) meSeq.push(c)
      else partnerSeq.push(c)
    })

    const layers = []

    const addSequence = (seq, color) => {
      if (!seq.length) return

      // Polyline
      if (seq.length > 1) {
        const latlngs = seq.map(c => [c.latitude, c.longitude])
        const line = L.polyline(latlngs, {
          color,
          weight: 2.5,
          opacity: 0.55,
          dashArray: '6 5',
        })
        line.addTo(map)
        layers.push(line)

        // Arrow heads every segment
        for (let i = 0; i < latlngs.length - 1; i++) {
          const mid = [
            (latlngs[i][0] + latlngs[i + 1][0]) / 2,
            (latlngs[i][1] + latlngs[i + 1][1]) / 2,
          ]
          const angle = Math.atan2(
            latlngs[i + 1][1] - latlngs[i][1],
            latlngs[i + 1][0] - latlngs[i][0]
          ) * 180 / Math.PI

          const arrow = L.divIcon({
            className: '',
            html: `<div style="
              width:0;height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-bottom:10px solid ${color};
              opacity:0.7;
              transform:rotate(${angle - 90}deg);
              transform-origin:center;
            "></div>`,
            iconSize: [12, 10],
            iconAnchor: [6, 5],
          })
          const arrowMarker = L.marker(mid, { icon: arrow, interactive: false })
          arrowMarker.addTo(map)
          layers.push(arrowMarker)
        }
      }

      // Numbered markers
      seq.forEach((c, i) => {
        const isLast = i === seq.length - 1
        const icon   = isLast ? makeLastIcon(color) : makeNumberIcon(i + 1, color)
        const marker = L.marker([c.latitude, c.longitude], { icon })

        const timeAgo = formatDistanceToNow(new Date(c.checked_in_at), { addSuffix: true })
        const ordinal = `#${i + 1}`
        marker.bindPopup(`
          <div style="min-width:170px;font-family:sans-serif">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="
                background:${color};color:#fff;border-radius:50%;
                width:20px;height:20px;display:inline-flex;align-items:center;
                justify-content:center;font-size:10px;font-weight:700;flex-shrink:0
              ">${i + 1}</span>
              <strong style="font-size:13px">${c.place_name}</strong>
            </div>
            <div style="color:#888;font-size:11px;margin-bottom:3px">
              ${c.user_display_name} · ${timeAgo}
            </div>
            ${c.mood_emoji ? `<span style="font-size:18px">${c.mood_emoji}</span>` : ''}
            ${c.note ? `<div style="font-size:11px;color:#555;margin-top:3px;font-style:italic">"${c.note}"</div>` : ''}
            ${isLast ? `<div style="margin-top:4px;font-size:10px;color:${color};font-weight:700">📍 Latest</div>` : ''}
          </div>
        `)
        marker.addTo(map)
        layers.push(marker)
      })
    }

    addSequence(meSeq, ME_COLOR)
    addSequence(partnerSeq, PARTNER_COLOR)

    // Fit all markers
    const allLatLngs = sorted.map(c => [c.latitude, c.longitude])
    if (allLatLngs.length) {
      map.fitBounds(L.latLngBounds(allLatLngs).pad(0.25))
    }

    return () => layers.forEach(l => l.remove())
  }, [checkins, map, myDisplayName])

  return null
}

export default function HistoryMap() {
  const user = useAuthStore((s) => s.user)
  const [checkins, setCheckins] = useState([])

  useEffect(() => {
    getMapCheckIns()
      .then((res) => setCheckins(res.data))
      .catch((err) => console.error('Failed to fetch map check-ins', err))
  }, [])

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full" style={{ background: ME_COLOR }} />
          <span>Me</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full" style={{ background: PARTNER_COLOR }} />
          <span>Partner</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>Numbers = order · Dashed line = path · Latest blinks</span>
        </div>
      </div>

      <div style={{ height: 'calc(100vh - 230px)', minHeight: 300 }}>
        <MapContainer
          center={[-5.135, 119.427]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapLayers checkins={checkins} myDisplayName={user?.display_name} />
        </MapContainer>
      </div>
    </div>
  )
}
