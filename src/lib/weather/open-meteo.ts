export type WeatherCoordinates = {
  latitude: number;
  longitude: number;
};

export function createOpenMeteoForecastUrl({ latitude, longitude }: WeatherCoordinates) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '3',
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}
