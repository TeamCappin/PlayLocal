import { useEffect, useState } from 'react';
import { weatherApi, WeatherForecast } from '@/lib/api';

type WeatherState = {
  gameId: string | null;
  forecast: WeatherForecast | null;
  error: string | null;
};

export function useWeather(gameId: string | undefined) {
  const [state, setState] = useState<WeatherState>({
    gameId: null,
    forecast: null,
    error: null,
  });

  useEffect(() => {
    if (!gameId) return;

    let cancelled = false;

    weatherApi
      .getForecast(gameId)
      .then((data) => {
        if (!cancelled) {
          setState({
            gameId,
            forecast: data,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Weather fetch failed:', err);
          setState({
            gameId,
            forecast: null,
            error: 'Unable to load forecast',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (!gameId) {
    return {
      forecast: null,
      isLoading: false,
      error: null,
    };
  }

  return {
    forecast: state.gameId === gameId ? state.forecast : null,
    isLoading: state.gameId !== gameId && state.error === null,
    error: state.gameId === gameId ? state.error : null,
  };
}
