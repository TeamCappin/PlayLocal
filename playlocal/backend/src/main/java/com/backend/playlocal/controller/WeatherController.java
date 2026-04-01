package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.WeatherDto;
import com.backend.playlocal.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/games/{gameId}/weather")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    /**
     * Returns the weather forecast for a game's start time and location.
     *
     * - Public endpoint; auth is optional (affects location precision).
     * - Confirmed participants and organizers receive exact-coordinate forecasts.
     * - Unauthenticated / non-confirmed callers receive a ~10 km generalised forecast.
     * - Indoor games, past games, games > 16 days ahead, and API failures return
     *   a structured "unavailable" response instead of an error HTTP status.
     */
    @GetMapping
    public ResponseEntity<WeatherDto.WeatherForecast> getWeather(
            @PathVariable UUID gameId,
            Authentication authentication) {

        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                userId = UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException ignored) {
                // anonymousUser or non-UUID principal
            }
        }

        WeatherDto.WeatherForecast forecast = weatherService.getForecast(gameId, userId);
        return ResponseEntity.ok(forecast);
    }
}
