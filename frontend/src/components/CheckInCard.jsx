import { formatDistanceToNow } from 'date-fns'
import MiniMap from './MiniMap'

const PLACE_ICONS = {
  restaurant: '🍽️',
  cafe: '☕',
  fast_food: '🍔',
  home: '🏠',
  office: '💼',
  school: '📚',
  hospital: '🏥',
  mall: '🛍️',
  park: '🌿',
  gym: '💪',
  default: '📍',
}

function getPlaceIcon(placeType) {
  if (!placeType) return PLACE_ICONS.default
  const key = placeType.toLowerCase()
  return PLACE_ICONS[key] || PLACE_ICONS.default
}

export default function CheckInCard({ checkin, isMe }) {
  if (!checkin) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center text-gray-300 text-sm">
        No check-in yet
      </div>
    )
  }

  const { user, place_name, place_type, note, mood_emoji, checked_in_at, latitude, longitude } = checkin
  const color = isMe ? '#7F77DD' : '#D85A30'
  const initial = (user?.display_name || '?')[0].toUpperCase()
  const timeAgo = formatDistanceToNow(new Date(checked_in_at), { addSuffix: true })
  const icon = getPlaceIcon(place_type)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-semibold text-gray-700">{user?.display_name}</span>
              <span className="text-sm">{icon}</span>
              <span className="text-xs text-gray-400 capitalize">{place_type}</span>
            </div>
            <p className="font-bold text-gray-800 text-sm truncate">{place_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
            {note && <p className="text-sm text-gray-500 italic mt-1.5">"{note}"</p>}
            {mood_emoji && <p className="text-xl mt-1">{mood_emoji}</p>}
          </div>
        </div>
      </div>
      {latitude && longitude && (
        <MiniMap latitude={latitude} longitude={longitude} place_name={place_name} />
      )}
    </div>
  )
}
