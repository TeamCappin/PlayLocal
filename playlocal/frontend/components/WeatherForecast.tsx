'use client';

import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, AlertCircle, Zap, CloudDrizzle, Eye, Loader2 } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { WeatherForecast as WeatherForecastType } from '@/lib/api';

// ---------------------------------------------------------------------------
// WMO code → icon + colour
// ---------------------------------------------------------------------------

function WeatherIcon({
  code,
  className = 'w-5 h-5',
}: {
  code: number;
  className?: string;
}) {
  if (code === 0 || code === 1)
    return <Sun className={`${className} text-yellow-500`} />;
  if (code <= 3)
    return <Cloud className={`${className} text-gray-400`} />;
  if (code <= 48)
    return <Eye className={`${className} text-gray-400`} />;
  if (code <= 55)
    return <CloudDrizzle className={`${className} text-blue-400`} />;
  if (code <= 67)
    return <CloudRain className={`${className} text-blue-500`} />;
  if (code <= 77)
    return <CloudSnow className={`${className} text-blue-300`} />;
  if (code <= 82)
    return <CloudRain className={`${className} text-blue-600`} />;
  if (code <= 86)
    return <CloudSnow className={`${className} text-blue-400`} />;
  if (code >= 95)
    return <Zap className={`${className} text-purple-500`} />;
  return <Cloud className={`${className} text-gray-400`} />;
}

// ---------------------------------------------------------------------------
// Unavailable reason → friendly message
// ---------------------------------------------------------------------------

const REASON_LABELS: Record<string, string> = {
  INDOOR_GAME:     'No forecast for indoor games.',
  PAST_GAME:       'Forecast unavailable for past games.',
  TOO_FAR_AHEAD:   'Game is too far ahead to forecast (max 16 days).',
  NO_LOCATION:     'Location unavailable — forecast cannot be shown.',
  FORECAST_ERROR:  'Weather service is temporarily unavailable.',
};

function reasonLabel(reason: string | undefined) {
  return reason ? (REASON_LABELS[reason] ?? 'Forecast unavailable.') : 'Forecast unavailable.';
}

// ---------------------------------------------------------------------------
// Compact badge sub-component
// ---------------------------------------------------------------------------

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-700">
      {icon}
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface WeatherForecastProps {
  gameId: string;
}

export function WeatherForecast({ gameId }: WeatherForecastProps) {
  const { forecast, isLoading, error } = useWeather(gameId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading forecast…</span>
      </div>
    );
  }

  if (error || !forecast) {
    return <ForecastUnavailable reason="FORECAST_ERROR" />;
  }

  if (!forecast.forecastAvailable) {
    return <ForecastUnavailable reason={forecast.unavailableReason} />;
  }

  return <ForecastCard forecast={forecast} />;
}

function ForecastUnavailable({ reason }: { reason?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-500 py-1">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
      <span>{reasonLabel(reason)}</span>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: WeatherForecastType }) {
  const temp =
    forecast.temperatureCelsius !== undefined
      ? `${forecast.temperatureCelsius}°C`
      : '—';

  const precip =
    forecast.precipitationProbability !== undefined
      ? `${forecast.precipitationProbability}%`
      : '—';

  const wind =
    forecast.windspeedKmh !== undefined
      ? `${forecast.windspeedKmh} km/h`
      : '—';

  const code = forecast.conditionCode ?? 2;

  return (
    <div className="space-y-3">
      {/* Primary row: icon + temp + condition */}
      <div className="flex items-center gap-3">
        <WeatherIcon code={code} className="w-8 h-8" />
        <div>
          <p className="text-xl font-semibold text-gray-900">{temp}</p>
          <p className="text-sm text-gray-500">{forecast.condition ?? 'Unknown'}</p>
        </div>
      </div>

      {/* Detail badges */}
      <div className="flex flex-wrap gap-4">
        <Badge
          icon={<Droplets className="w-4 h-4 text-blue-400" />}
          label={`Rain ${precip}`}
        />
        <Badge
          icon={<Wind className="w-4 h-4 text-gray-400" />}
          label={`Wind ${wind}`}
        />
      </div>

      {/* Privacy notice */}
      {forecast.locationHidden && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          Approximate forecast — join this game to see exact conditions.
        </p>
      )}
    </div>
  );
}
