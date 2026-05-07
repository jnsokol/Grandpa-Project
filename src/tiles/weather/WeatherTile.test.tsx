import { render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { WeatherTile } from './WeatherTile';

// Node 22 exposes localStorage as a non-functional placeholder; stub a real one.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (_i: number) => null,
    get length() { return Object.keys(store).length; },
  };
})();

beforeAll(() => {
  vi.stubGlobal('localStorage', localStorageMock);
});

afterEach(() => {
  localStorageMock.clear();
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', localStorageMock);
});

const savedNoCoords = {
  kind: 'weather' as const,
  id: 'weather-test',
  locationMode: 'saved' as const,
};

const savedWithCoords = {
  kind: 'weather' as const,
  id: 'weather-test-2',
  locationMode: 'saved' as const,
  lat: 52.23,
  lon: 21.01,
  label: 'Warsaw',
};

const mockWeatherData = {
  current: { temperature_2m: 20, apparent_temperature: 18, relative_humidity_2m: 60, wind_speed_10m: 12, weather_code: 0 },
  daily: {
    time: ['2026-05-07', '2026-05-08', '2026-05-09'],
    weather_code: [0, 1, 2],
    temperature_2m_max: [22, 20, 18],
    temperature_2m_min: [15, 13, 12],
    precipitation_probability_max: [0, 10, 30],
  },
};

describe('WeatherTile', () => {
  it('shows city search form when saved mode has no coordinates', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<WeatherTile tile={savedNoCoords} />);
    expect(screen.getByLabelText('City name')).toBeInTheDocument();
  });

  it('shows loading state when fetching with saved coordinates', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<WeatherTile tile={savedWithCoords} />);
    expect(screen.getByText('Loading weather…')).toBeInTheDocument();
  });

  it('renders cached weather without a network request', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    localStorageMock.setItem(
      `weather-cache-${savedWithCoords.id}`,
      JSON.stringify({ ...mockWeatherData, fetchedAt: Date.now() }),
    );
    render(<WeatherTile tile={savedWithCoords} />);
    expect(screen.getByText('Clear sky')).toBeInTheDocument();
    expect(screen.getAllByText(/20/).length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows 3-day forecast from cache', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    localStorageMock.setItem(
      `weather-cache-${savedWithCoords.id}`,
      JSON.stringify({ ...mockWeatherData, fetchedAt: Date.now() }),
    );
    render(<WeatherTile tile={savedWithCoords} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('22°')).toBeInTheDocument();
    expect(screen.getByText('15°')).toBeInTheDocument();
  });

  it('ignores stale cache and starts loading fresh data', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const staleTime = Date.now() - 31 * 60 * 1000;
    localStorageMock.setItem(
      `weather-cache-${savedWithCoords.id}`,
      JSON.stringify({ ...mockWeatherData, fetchedAt: staleTime }),
    );
    render(<WeatherTile tile={savedWithCoords} />);
    expect(screen.getByText('Loading weather…')).toBeInTheDocument();
  });
});
