import requests
import logging

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
HEADERS = {"User-Agent": "Dekat-App/1.0 (ldr-companion)"}


def reverse_geocode(lat, lon):
    """
    Call Nominatim to get place info from coordinates.
    Returns (place_name, place_type, display_address) tuple.
    Falls back gracefully on error.
    """
    try:
        response = requests.get(
            NOMINATIM_URL,
            params={"lat": lat, "lon": lon, "format": "json"},
            headers=HEADERS,
            timeout=5
        )
        response.raise_for_status()
        data = response.json()

        address = data.get("address", {})
        place_name = (
            data.get("name")
            or address.get("amenity")
            or address.get("building")
            or address.get("road")
            or data.get("display_name", "").split(",")[0]
            or "Unknown place"
        )
        place_type = (
            address.get("amenity")
            or data.get("type")
            or data.get("class")
            or "place"
        )
        display_address = data.get("display_name", "")
        return place_name, place_type, display_address

    except Exception as e:
        logger.warning(f"Nominatim geocoding failed: {e}")
        return "Unknown place", "place", ""
