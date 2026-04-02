import { useEffect, useState } from 'react';
import { weatherApi, WeatherForecast } from '@/lib/api';

type WeatherState = {
  forecast: WeatherForecast | null;
  isLoading: boolean;
  error: string | null;
};

export function useWeather(gameId: string | undefined) {
  const [state, setState] = useState<WeatherState>({
    forecast: null,
    isLoading: Boolean(gameId),
    error: null,
  });

  useEffect(() => {
    if (!gameId) {
      setState({
        forecast: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;
    setState((current) => ({
      forecast: current.forecast,
      isLoading: true,
      error: null,
    }));

    weatherApi
      .getForecast(gameId)
      .then((data) => {
        if (!cancelled) {
          setState({
            forecast: data,
            isLoading: false,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Weather fetch failed:', err);
          setState({
            forecast: null,
            isLoading: false,
            error: 'Unable to load forecast',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return state;
}
