import { useState, useEffect } from 'react';
import { weatherApi, WeatherForecast } from '@/lib/api';

export function useWeather(gameId: string | undefined) {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    weatherApi
      .getForecast(gameId)
      .then((data) => {
        if (!cancelled) setForecast(data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Weather fetch failed:', err);
          setError('Unable to load forecast');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return { forecast, isLoading, error };
}
