import { useEffect, useState } from 'react';
import type { WeatherTile as WeatherTileType } from '../../lib/store/tiles';
import { useTileStore } from '../../lib/store/tile-store';
import {
  fetchWeather,
  geocodeCity,
  getCachedWeather,
  setCachedWeather,
  weatherDesc,
  weatherEmoji,
} from '../../lib/weather/open-meteo';
import type { WeatherResponse } from '../../lib/weather/open-meteo';

type Props = { tile: WeatherTileType };
type Status = 'idle' | 'loading' | 'success' | 'error';

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
}

export function WeatherTile({ tile }: Props) {
  const updateTile = useTileStore((s) => s.updateTile);
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [editing, setEditing] = useState(false);
  const [cityQuery, setCityQuery] = useState(tile.label ?? '');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  function showSuccess(weather: WeatherResponse) {
    setData(weather);
    setStatus('success');
  }

  function showError(msg: string) {
    setErrorMsg(msg);
    setStatus('error');
  }

  async function doFetch(lat: number, lon: number) {
    setStatus('loading');
    try {
      const weather = await fetchWeather({ latitude: lat, longitude: lon });
      setCachedWeather(tile.id, weather);
      showSuccess(weather);
    } catch {
      showError('Could not load weather. Check your connection.');
    }
  }

  function startGeoFetch() {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported. Use a saved location.');
      setEditing(true);
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => doFetch(pos.coords.latitude, pos.coords.longitude),
      () => {
        showError('Location access denied. Set a saved location below.');
        setEditing(true);
      },
    );
  }

  function load() {
    const cached = getCachedWeather(tile.id);
    if (cached) { showSuccess(cached); return; }

    if (tile.locationMode === 'geolocation') {
      startGeoFetch();
    } else if (tile.lat !== undefined && tile.lon !== undefined) {
      doFetch(tile.lat, tile.lon);
    } else {
      setEditing(true);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [tile.id, tile.locationMode, tile.lat, tile.lon]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!cityQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const result = await geocodeCity(cityQuery.trim());
      if (!result) {
        setSearchError('City not found. Try a different name.');
        setSearching(false);
        return;
      }
      const updated: WeatherTileType = {
        ...tile,
        locationMode: 'saved',
        lat: result.latitude,
        lon: result.longitude,
        label: result.name + (result.admin1 ? `, ${result.admin1}` : ''),
      };
      updateTile(updated);
      setEditing(false);
      setCityQuery(updated.label ?? '');
      // doFetch will be triggered by the useEffect when tile props change
    } catch {
      setSearchError('Search failed. Try again.');
    }
    setSearching(false);
  }

  function handleUseGeolocation() {
    const updated: WeatherTileType = { ...tile, locationMode: 'geolocation', lat: undefined, lon: undefined, label: undefined };
    updateTile(updated);
    setEditing(false);
    // clear stale cache so fresh geo fetch runs
    localStorage.removeItem(`weather-cache-${tile.id}`);
  }

  function handleRefresh() {
    localStorage.removeItem(`weather-cache-${tile.id}`);
    setData(null);
    setStatus('idle');
    if (tile.locationMode === 'geolocation') {
      startGeoFetch();
    } else if (tile.lat !== undefined && tile.lon !== undefined) {
      doFetch(tile.lat, tile.lon);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 h-full justify-center">
        <p className="text-sm font-medium text-slate-700">Set location</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="City name…"
            className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
            aria-label="City name"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {searching ? '…' : '→'}
          </button>
        </form>
        {searchError && <p className="text-xs text-red-500">{searchError}</p>}
        <button
          onClick={handleUseGeolocation}
          className="text-xs text-slate-500 hover:text-slate-700 text-left"
        >
          📍 Use my current location
        </button>
        {status === 'success' && (
          <button onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-600 text-left">
            ← Back
          </button>
        )}
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400">
        Loading weather…
      </div>
    );
  }

  if (status === 'error' && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
        <p className="text-sm text-red-500">{errorMsg}</p>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="text-xs text-slate-500 hover:text-slate-700">
            Retry
          </button>
          <button onClick={() => setEditing(true)} className="text-xs text-blue-500 hover:text-blue-700">
            Set location
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { current, daily } = data;

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* current */}
      <div className="flex items-center gap-3">
        <span className="text-5xl leading-none">{weatherEmoji(current.weather_code)}</span>
        <div>
          <p className="text-3xl font-bold text-slate-900 leading-none tabular-nums">
            {Math.round(current.temperature_2m)}°C
          </p>
          <p className="text-sm text-slate-500 mt-1">{weatherDesc(current.weather_code)}</p>
        </div>
      </div>

      {tile.label && (
        <p className="text-xs text-slate-400 truncate">📍 {tile.label}</p>
      )}

      {/* 3-day forecast */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        {daily.time.map((dateStr, i) => (
          <div key={dateStr} className="flex flex-col items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-1">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{dayLabel(dateStr, i)}</span>
            <span className="text-2xl leading-none">{weatherEmoji(daily.weather_code[i])}</span>
            <span className="text-sm font-bold text-slate-800">{Math.round(daily.temperature_2m_max[i])}°</span>
            <span className="text-xs text-slate-400">{Math.round(daily.temperature_2m_min[i])}°</span>
          </div>
        ))}
      </div>

      {/* footer actions */}
      <div className="flex justify-between items-center mt-auto pt-1">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          📍 Change location
        </button>
        <button
          onClick={handleRefresh}
          className="text-xs text-slate-400 hover:text-slate-600"
          aria-label="Refresh weather"
        >
          ⟳
        </button>
      </div>
    </div>
  );
}
