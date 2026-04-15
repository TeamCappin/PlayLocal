import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeatherForecast } from '../../components/WeatherForecast';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../hooks/useWeather', () => ({
  useWeather: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  Sun:         () => <span data-testid="icon-sun" />,
  Cloud:       () => <span data-testid="icon-cloud" />,
  CloudRain:   () => <span data-testid="icon-cloud-rain" />,
  CloudSnow:   () => <span data-testid="icon-cloud-snow" />,
  CloudDrizzle:() => <span data-testid="icon-cloud-drizzle" />,
  Wind:        () => <span data-testid="icon-wind" />,
  Droplets:    () => <span data-testid="icon-droplets" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Zap:         () => <span data-testid="icon-zap" />,
  Eye:         () => <span data-testid="icon-eye" />,
  Loader2:     () => <span data-testid="icon-loader" />,
}));

import { useWeather } from '../../hooks/useWeather';
const mockUseWeather = useWeather as jest.MockedFunction<typeof useWeather>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVAILABLE_FORECAST = {
  forecastAvailable: true,
  temperatureCelsius: 14.5,
  precipitationProbability: 20,
  windspeedKmh: 12.3,
  condition: 'Partly Cloudy',
  conditionCode: 2,
  locationHidden: false,
};

function renderForecast() {
  return render(<WeatherForecast gameId="game-1" />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WeatherForecast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading spinner while fetching', () => {
    mockUseWeather.mockReturnValue({ forecast: null, isLoading: true, error: null });
    renderForecast();
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
    expect(screen.getByText(/loading forecast/i)).toBeInTheDocument();
  });

  it('shows forecast data when available', async () => {
    mockUseWeather.mockReturnValue({
      forecast: AVAILABLE_FORECAST,
      isLoading: false,
      error: null,
    });
    renderForecast();

    await waitFor(() => {
      expect(screen.getByText('14.5°C')).toBeInTheDocument();
      expect(screen.getByText('Partly Cloudy')).toBeInTheDocument();
      expect(screen.getByText(/Rain 20%/)).toBeInTheDocument();
      expect(screen.getByText(/Wind 12.3 km\/h/)).toBeInTheDocument();
    });
  });

  it('does not show the approximate warning when locationHidden is false', () => {
    mockUseWeather.mockReturnValue({
      forecast: AVAILABLE_FORECAST,
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.queryByText(/approximate forecast/i)).not.toBeInTheDocument();
  });

  it('shows approximate warning when locationHidden is true', () => {
    mockUseWeather.mockReturnValue({
      forecast: { ...AVAILABLE_FORECAST, locationHidden: true },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByText(/approximate forecast/i)).toBeInTheDocument();
  });

  it('shows unavailable message for INDOOR_GAME reason', () => {
    mockUseWeather.mockReturnValue({
      forecast: { forecastAvailable: false, unavailableReason: 'INDOOR_GAME' },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByText(/no forecast for indoor games/i)).toBeInTheDocument();
  });

  it('shows unavailable message for PAST_GAME reason', () => {
    mockUseWeather.mockReturnValue({
      forecast: { forecastAvailable: false, unavailableReason: 'PAST_GAME' },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByText(/forecast unavailable for past games/i)).toBeInTheDocument();
  });

  it('shows unavailable message for TOO_FAR_AHEAD reason', () => {
    mockUseWeather.mockReturnValue({
      forecast: { forecastAvailable: false, unavailableReason: 'TOO_FAR_AHEAD' },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByText(/too far ahead/i)).toBeInTheDocument();
  });

  it('shows unavailable message for FORECAST_ERROR reason', () => {
    mockUseWeather.mockReturnValue({
      forecast: { forecastAvailable: false, unavailableReason: 'FORECAST_ERROR' },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  it('shows fallback message when hook returns an error string', () => {
    mockUseWeather.mockReturnValue({
      forecast: null,
      isLoading: false,
      error: 'Unable to load forecast',
    });
    renderForecast();
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
  });

  it('shows fallback message when forecast is null and no error', () => {
    mockUseWeather.mockReturnValue({ forecast: null, isLoading: false, error: null });
    renderForecast();
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
  });

  it('shows sun icon for clear sky (code 0)', () => {
    mockUseWeather.mockReturnValue({
      forecast: { ...AVAILABLE_FORECAST, conditionCode: 0, condition: 'Clear Sky' },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
  });

  it('shows cloud-rain icon for rain (code 63)', () => {
    mockUseWeather.mockReturnValue({
      forecast: { ...AVAILABLE_FORECAST, conditionCode: 63, condition: 'Moderate Rain' },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByTestId('icon-cloud-rain')).toBeInTheDocument();
  });

  it('shows cloud-snow icon for snow (code 73)', () => {
    mockUseWeather.mockReturnValue({
      forecast: { ...AVAILABLE_FORECAST, conditionCode: 73, condition: 'Moderate Snow' },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByTestId('icon-cloud-snow')).toBeInTheDocument();
  });

  it('shows zap icon for thunderstorm (code 95)', () => {
    mockUseWeather.mockReturnValue({
      forecast: { ...AVAILABLE_FORECAST, conditionCode: 95, condition: 'Thunderstorm' },
      isLoading: false,
      error: null,
    });
    renderForecast();
    expect(screen.getByTestId('icon-zap')).toBeInTheDocument();
  });
});
