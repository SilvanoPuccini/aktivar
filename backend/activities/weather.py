"""
Open-Meteo weather API integration with Redis caching.
Free API, no key required.
"""

import logging

import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'
CACHE_TTL = 3600  # 1 hour


def get_weather_for_activity(latitude, longitude, start_datetime):
    """
    Fetch weather forecast for a given location and date.
    Returns dict with temp, description, wind_speed or None on failure.
    Caches by rounded coordinates + date for 1 hour.
    """
    lat = round(float(latitude), 2)
    lng = round(float(longitude), 2)
    date_str = start_datetime.strftime('%Y-%m-%d')
    hour = start_datetime.hour

    cache_key = f'weather:{lat}:{lng}:{date_str}:{hour}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        response = requests.get(
            OPEN_METEO_URL,
            params={
                'latitude': lat,
                'longitude': lng,
                'hourly': 'temperature_2m,weathercode,windspeed_10m',
                'start_date': date_str,
                'end_date': date_str,
                'timezone': 'auto',
            },
            timeout=5,
        )
        response.raise_for_status()
        data = response.json()

        hourly = data.get('hourly', {})
        temps = hourly.get('temperature_2m', [])
        codes = hourly.get('weathercode', [])
        winds = hourly.get('windspeed_10m', [])

        if not temps or hour >= len(temps):
            return None

        weather = {
            'temp': round(temps[hour]),
            'description': _wmo_code_to_description(codes[hour] if hour < len(codes) else 0),
            'wind_speed': round(winds[hour], 1) if hour < len(winds) else 0,
            'weathercode': codes[hour] if hour < len(codes) else 0,
        }

        cache.set(cache_key, weather, CACHE_TTL)
        logger.info('Weather fetched and cached for %s,%s on %s', lat, lng, date_str)
        return weather

    except requests.RequestException as e:
        logger.warning('Open-Meteo API error: %s', str(e))
        return None
    except (KeyError, IndexError, ValueError) as e:
        logger.warning('Open-Meteo response parsing error: %s', str(e))
        return None


def _wmo_code_to_description(code):
    """Convert WMO weather code to human-readable Spanish description."""
    WMO_CODES = {
        0: 'Despejado',
        1: 'Mayormente despejado',
        2: 'Parcialmente nublado',
        3: 'Nublado',
        45: 'Niebla',
        48: 'Niebla helada',
        51: 'Llovizna leve',
        53: 'Llovizna moderada',
        55: 'Llovizna densa',
        61: 'Lluvia leve',
        63: 'Lluvia moderada',
        65: 'Lluvia fuerte',
        71: 'Nieve leve',
        73: 'Nieve moderada',
        75: 'Nieve fuerte',
        77: 'Granizo',
        80: 'Chubascos leves',
        81: 'Chubascos moderados',
        82: 'Chubascos fuertes',
        85: 'Nieve leve',
        86: 'Nieve fuerte',
        95: 'Tormenta',
        96: 'Tormenta con granizo leve',
        99: 'Tormenta con granizo fuerte',
    }
    return WMO_CODES.get(code, 'Despejado')
