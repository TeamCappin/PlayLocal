package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.WeatherDto;
import com.backend.playlocal.service.WeatherService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for WeatherController (US-7.3).
 */
@ExtendWith(MockitoExtension.class)
class WeatherControllerTest {

    @Mock
    private WeatherService weatherService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private WeatherController weatherController;

    private UUID gameId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        gameId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Returns 200 with forecast for unauthenticated request (null userId)")
    void getWeather_NoAuth_CallsServiceWithNullUserId() {
        WeatherDto.WeatherForecast forecast = WeatherDto.WeatherForecast.builder()
                .forecastAvailable(true)
                .temperatureCelsius(14.5)
                .precipitationProbability(20)
                .windspeedKmh(12.0)
                .condition("Partly Cloudy")
                .conditionCode(2)
                .locationHidden(true)
                .build();

        when(weatherService.getForecast(eq(gameId), isNull())).thenReturn(forecast);

        ResponseEntity<WeatherDto.WeatherForecast> response =
                weatherController.getWeather(gameId, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isForecastAvailable()).isTrue();
        assertThat(response.getBody().getTemperatureCelsius()).isEqualTo(14.5);
        verify(weatherService).getForecast(gameId, null);
    }

    @Test
    @DisplayName("Returns 200 with forecast for authenticated request (userId resolved)")
    void getWeather_WithAuth_PassesUserIdToService() {
        WeatherDto.WeatherForecast forecast = WeatherDto.WeatherForecast.builder()
                .forecastAvailable(true)
                .temperatureCelsius(20.0)
                .precipitationProbability(10)
                .windspeedKmh(5.0)
                .condition("Clear Sky")
                .conditionCode(0)
                .locationHidden(false)
                .build();

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(userId.toString());
        when(weatherService.getForecast(eq(gameId), eq(userId))).thenReturn(forecast);

        ResponseEntity<WeatherDto.WeatherForecast> response =
                weatherController.getWeather(gameId, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isLocationHidden()).isFalse();
        verify(weatherService).getForecast(gameId, userId);
    }

    @Test
    @DisplayName("Returns 200 with unavailable forecast for indoor game")
    void getWeather_IndoorGame_ReturnsUnavailableForecast() {
        WeatherDto.WeatherForecast indoorForecast = WeatherDto.WeatherForecast.builder()
                .forecastAvailable(false)
                .unavailableReason("INDOOR_GAME")
                .build();

        when(weatherService.getForecast(eq(gameId), isNull())).thenReturn(indoorForecast);

        ResponseEntity<WeatherDto.WeatherForecast> response =
                weatherController.getWeather(gameId, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isForecastAvailable()).isFalse();
        assertThat(response.getBody().getUnavailableReason()).isEqualTo("INDOOR_GAME");
    }

    @Test
    @DisplayName("Handles invalid UUID principal gracefully (uses null userId)")
    void getWeather_InvalidUuidPrincipal_UsesNullUserId() {
        WeatherDto.WeatherForecast forecast = WeatherDto.WeatherForecast.builder()
                .forecastAvailable(false)
                .unavailableReason("NO_LOCATION")
                .build();

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("anonymousUser");
        when(weatherService.getForecast(eq(gameId), isNull())).thenReturn(forecast);

        ResponseEntity<WeatherDto.WeatherForecast> response =
                weatherController.getWeather(gameId, authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(weatherService).getForecast(gameId, null);
    }

    @Test
    @DisplayName("Returns 200 with FORECAST_ERROR for API failure")
    void getWeather_ForecastError_Returns200WithReason() {
        WeatherDto.WeatherForecast errorForecast = WeatherDto.WeatherForecast.builder()
                .forecastAvailable(false)
                .unavailableReason("FORECAST_ERROR")
                .build();

        when(weatherService.getForecast(eq(gameId), isNull())).thenReturn(errorForecast);

        ResponseEntity<WeatherDto.WeatherForecast> response =
                weatherController.getWeather(gameId, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUnavailableReason()).isEqualTo("FORECAST_ERROR");
    }
}
