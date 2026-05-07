export type WeatherCoordinates = {
  latitude: number;
  longitude: number;
};

export type WeatherResponse = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

export type CachedWeather = WeatherResponse & { fetchedAt: number };

export type GeocodingResult = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};

export function createOpenMeteoForecastUrl({ latitude, longitude }: WeatherCoordinates) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '3',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export async function fetchWeather(coords: WeatherCoordinates): Promise<WeatherResponse> {
  const res = await fetch(createOpenMeteoForecastUrl(coords));
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  return res.json() as Promise<WeatherResponse>;
}

export async function geocodeCity(query: string): Promise<GeocodingResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json() as { results?: GeocodingResult[] };
  return data.results?.[0] ?? null;
}

export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

export function weatherDesc(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}

const CACHE_TTL = 30 * 60 * 1000;

export function getCachedWeather(tileId: string): WeatherResponse | null {
  try {
    const raw = localStorage.getItem(`weather-cache-${tileId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedWeather;
    if (Date.now() - cached.fetchedAt > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

export function setCachedWeather(tileId: string, data: WeatherResponse): void {
  const cached: CachedWeather = { ...data, fetchedAt: Date.now() };
  localStorage.setItem(`weather-cache-${tileId}`, JSON.stringify(cached));
}
