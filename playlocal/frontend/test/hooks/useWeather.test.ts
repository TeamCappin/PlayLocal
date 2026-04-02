import { renderHook, waitFor } from '@testing-library/react';
import { useWeather } from '../../hooks/useWeather';
import { weatherApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  weatherApi: {
    getForecast: jest.fn(),
  },
}));

const mockGetForecast = weatherApi.getForecast as jest.MockedFunction<
  typeof weatherApi.getForecast
>;

const mockForecast = {
  forecastAvailable: true,
  temperatureCelsius: 14.5,
  precipitationProbability: 20,
  windspeedKmh: 12.3,
  condition: 'Partly Cloudy',
  conditionCode: 2,
  locationHidden: false,
};

describe('useWeather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when gameId is undefined', async () => {
    const { result } = renderHook(() => useWeather(undefined));

    expect(mockGetForecast).not.toHaveBeenCalled();
    expect(result.current.forecast).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets isLoading to true while fetching', () => {
    mockGetForecast.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    const { result } = renderHook(() => useWeather('game-1'));
    expect(result.current.isLoading).toBe(true);
  });

  it('sets forecast data and stops loading on success', async () => {
    mockGetForecast.mockResolvedValue(mockForecast);

    const { result } = renderHook(() => useWeather('game-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetForecast).toHaveBeenCalledWith('game-1');
    expect(result.current.forecast).toEqual(mockForecast);
    expect(result.current.error).toBeNull();
  });

  it('sets error and stops loading when fetch fails', async () => {
    mockGetForecast.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useWeather('game-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.forecast).toBeNull();
    expect(result.current.error).toBe('Unable to load forecast');
  });

  it('re-fetches when gameId changes', async () => {
    mockGetForecast.mockResolvedValue(mockForecast);

    const { result, rerender } = renderHook(
      ({ id }) => useWeather(id),
      { initialProps: { id: 'game-1' } }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGetForecast).toHaveBeenCalledWith('game-1');

    mockGetForecast.mockResolvedValue({ ...mockForecast, temperatureCelsius: 20.0 });
    rerender({ id: 'game-2' });

    await waitFor(() => expect(result.current.forecast?.temperatureCelsius).toBe(20.0));
    expect(mockGetForecast).toHaveBeenCalledWith('game-2');
  });

  it('returns forecastAvailable=false for indoor game', async () => {
    const indoorResponse = {
      forecastAvailable: false,
      unavailableReason: 'INDOOR_GAME',
    };
    mockGetForecast.mockResolvedValue(indoorResponse);

    const { result } = renderHook(() => useWeather('game-indoor'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.forecast?.forecastAvailable).toBe(false);
    expect(result.current.forecast?.unavailableReason).toBe('INDOOR_GAME');
  });
});
