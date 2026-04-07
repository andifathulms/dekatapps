import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getMapCheckIns } from '../api/checkins'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

function MarkersLayer({ checkins, myUsername }) {
  const map = useMap()

  useEffect(() => {
    if (!checkins.length) return

    const markers = []
    checkins.forEach((c) => {
      const isMe = c.user_display_name === myUsername
      const color = isMe ? '#7F77DD' : '#D85A30'
      const marker = L.circleMarker([c.latitude, c.longitude], {
        radius: 10,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      })

      const timeAgo = formatDistanceToNow(new Date(c.checked_in_at), { addSuffix: true })
      const popupContent = `
        <div style="min-width:160px">
          <strong>${c.place_name}</strong><br/>
          <span style="color:#888;font-size:12px">${c.user_display_name} · ${timeAgo}</span>
          ${c.mood_emoji ? `<br/><span style="font-size:18px">${c.mood_emoji}</span>` : ''}
          ${c.note ? `<br/><em style="font-size:12px;color:#555">"${c.note}"</em>` : ''}
        </div>
      `
      marker.bindPopup(popupContent)
      marker.addTo(map)
      markers.push(marker)
    })

    const group = L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.2))

    return () => {
      markers.forEach((m) => m.remove())
    }
  }, [checkins, map, myUsername])

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
    <div style={{ height: 'calc(100vh - 200px)', minHeight: 300 }}>
      <MapContainer
        center={[-5.135, 119.427]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkersLayer checkins={checkins} myUsername={user?.display_name} />
      </MapContainer>
    </div>
  )
}
