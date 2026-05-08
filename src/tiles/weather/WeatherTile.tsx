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

  function showSuccess(weather: WeatherResponse) { setData(weather); setStatus('success'); }
  function showError(msg: string) { setErrorMsg(msg); setStatus('error'); }

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
    if (!navigator.geolocation) { showError('Geolocation not supported.'); setEditing(true); return; }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => doFetch(pos.coords.latitude, pos.coords.longitude),
      () => { showError('Location access denied.'); setEditing(true); },
    );
  }

  function load() {
    const cached = getCachedWeather(tile.id);
    if (cached) { showSuccess(cached); return; }
    if (tile.locationMode === 'geolocation') startGeoFetch();
    else if (tile.lat !== undefined && tile.lon !== undefined) doFetch(tile.lat, tile.lon);
    else setEditing(true);
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
      if (!result) { setSearchError('City not found.'); setSearching(false); return; }
      const updated: WeatherTileType = {
        ...tile, locationMode: 'saved',
        lat: result.latitude, lon: result.longitude,
        label: result.name + (result.admin1 ? `, ${result.admin1}` : ''),
      };
      updateTile(updated);
      setEditing(false);
      setCityQuery(updated.label ?? '');
    } catch { setSearchError('Search failed. Try again.'); }
    setSearching(false);
  }

  function handleRefresh() {
    localStorage.removeItem(`weather-cache-${tile.id}`);
    setData(null); setStatus('idle');
    if (tile.locationMode === 'geolocation') startGeoFetch();
    else if (tile.lat !== undefined && tile.lon !== undefined) doFetch(tile.lat, tile.lon);
  }

  // --- Location edit form ---
  if (editing) {
    return (
      <div className="flex flex-col gap-3 h-full justify-center rounded-xl p-3">
        <p className="text-sm font-semibold text-white">📍 Set location</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="City name…"
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/50"
            aria-label="City name"
          />
          <button type="submit" disabled={searching}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {searching ? '…' : '→'}
          </button>
        </form>
        {searchError && <p className="text-xs text-red-300">{searchError}</p>}
        <button onClick={() => { updateTile({ ...tile, locationMode: 'geolocation', lat: undefined, lon: undefined, label: undefined }); setEditing(false); localStorage.removeItem(`weather-cache-${tile.id}`); }}
          className="text-xs text-white/60 hover:text-white text-left transition-colors">
          📡 Use my current location
        </button>
        {status === 'success' && (
          <button onClick={() => setEditing(false)} className="text-xs text-white/40 hover:text-white/70 text-left">← Back</button>
        )}
      </div>
    );
  }

  // --- Loading ---
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full rounded-xl">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-pulse">🌤️</div>
          <p className="text-sm text-zinc-400">Loading weather…</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (status === 'error' && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full rounded-xl text-center p-3">
        <p className="text-sm text-red-300">{errorMsg}</p>
        <div className="flex gap-3">
          <button onClick={handleRefresh} className="text-xs text-white/60 hover:text-white">Retry</button>
          <button onClick={() => setEditing(true)} className="text-xs text-zinc-400 hover:text-blue-100">Set location</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { current, daily } = data;

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden text-white">

      {/* Top — main temp + condition */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <p className="text-5xl font-bold tabular-nums leading-none">
            {Math.round(current.temperature_2m)}°
          </p>
          <p className="text-zinc-400 text-sm mt-1 font-medium">{weatherDesc(current.weather_code)}</p>
          {tile.label && (
            <p className="text-zinc-400 text-xs mt-0.5 truncate max-w-[130px]">📍 {tile.label}</p>
          )}
        </div>
        <span className="text-6xl leading-none drop-shadow-lg">{weatherEmoji(current.weather_code)}</span>
      </div>

      {/* Stats row — feels like, humidity, wind */}
      <div className="grid grid-cols-3 gap-1 px-3 pb-2">
        <div className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
          <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide">Feels</p>
          <p className="text-white text-sm font-bold tabular-nums">{Math.round(current.apparent_temperature)}°</p>
        </div>
        <div className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
          <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide">Humid.</p>
          <p className="text-white text-sm font-bold tabular-nums">{current.relative_humidity_2m}%</p>
        </div>
        <div className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
          <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide">Wind</p>
          <p className="text-white text-sm font-bold tabular-nums">{Math.round(current.wind_speed_10m)}<span className="text-[10px] font-normal ml-0.5">km/h</span></p>
        </div>
      </div>

      {/* 3-day forecast */}
      <div className="grid grid-cols-3 gap-1 px-3 pb-2 flex-1">
        {daily.time.map((dateStr, i) => (
          <div key={dateStr} className="bg-white/10 rounded-xl flex flex-col items-center justify-center gap-0.5 py-2">
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wide">{dayLabel(dateStr, i)}</p>
            <span className="text-xl leading-none">{weatherEmoji(daily.weather_code[i])}</span>
            <p className="text-white text-sm font-bold tabular-nums">{Math.round(daily.temperature_2m_max[i])}°</p>
            <p className="text-zinc-400 text-xs tabular-nums">{Math.round(daily.temperature_2m_min[i])}°</p>
            {daily.precipitation_probability_max[i] > 0 && (
              <p className="text-zinc-400 text-[10px]">💧{daily.precipitation_probability_max[i]}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-3 pb-2">
        <button onClick={() => setEditing(true)} className="text-zinc-400 hover:text-white text-xs transition-colors">
          📍 Change
        </button>
        <button onClick={handleRefresh} aria-label="Refresh weather" className="text-zinc-400 hover:text-white text-base transition-colors">
          ↻
        </button>
      </div>
    </div>
  );
}
