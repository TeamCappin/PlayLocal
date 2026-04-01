package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.WeatherDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.Location;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class WeatherService {

    private static final String OPEN_METEO_URL =
            "https://api.open-meteo.com/v1/forecast"
            + "?latitude=%s&longitude=%s"
            + "&hourly=temperature_2m,precipitation_probability,windspeed_10m,weathercode"
            + "&timezone=auto&forecast_days=16";

    /** Forecast window — Open-Meteo supports 16 days. */
    private static final int MAX_FORECAST_DAYS = 16;

    private static final Map<Integer, String> WMO_CONDITIONS = Map.ofEntries(
            Map.entry(0,  "Clear Sky"),
            Map.entry(1,  "Mainly Clear"),
            Map.entry(2,  "Partly Cloudy"),
            Map.entry(3,  "Overcast"),
            Map.entry(45, "Foggy"),
            Map.entry(48, "Icy Fog"),
            Map.entry(51, "Light Drizzle"),
            Map.entry(53, "Moderate Drizzle"),
            Map.entry(55, "Dense Drizzle"),
            Map.entry(61, "Slight Rain"),
            Map.entry(63, "Moderate Rain"),
            Map.entry(65, "Heavy Rain"),
            Map.entry(71, "Light Snow"),
            Map.entry(73, "Moderate Snow"),
            Map.entry(75, "Heavy Snow"),
            Map.entry(77, "Snow Grains"),
            Map.entry(80, "Rain Showers"),
            Map.entry(81, "Moderate Showers"),
            Map.entry(82, "Violent Showers"),
            Map.entry(85, "Snow Showers"),
            Map.entry(86, "Heavy Snow Showers"),
            Map.entry(95, "Thunderstorm"),
            Map.entry(96, "Thunderstorm w/ Hail"),
            Map.entry(99, "Thunderstorm w/ Heavy Hail")
    );

    private final GameRepository gameRepository;
    private final GameParticipationRepository participationRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public WeatherService(GameRepository gameRepository,
                          GameParticipationRepository participationRepository) {
        this.gameRepository = gameRepository;
        this.participationRepository = participationRepository;
    }

    /**
     * Returns a weather forecast for the given game's start time and location.
     * US-7.3: Weather Forecast for Upcoming Games
     */
    public WeatherDto.WeatherForecast getForecast(UUID gameId, UUID requestingUserId) {
        Game game = gameRepository.findById(gameId).orElse(null);
        if (game == null) {
            return unavailable("NO_LOCATION");
        }

        if ("indoor".equalsIgnoreCase(game.getIndoorOutdoor())) {
            return unavailable("INDOOR_GAME");
        }

        Instant now = Instant.now();
        if (game.getStartTime() == null || game.getStartTime().isBefore(now)) {
            return unavailable("PAST_GAME");
        }

        if (game.getStartTime().isAfter(now.plus(MAX_FORECAST_DAYS, ChronoUnit.DAYS))) {
            return unavailable("TOO_FAR_AHEAD");
        }

        Location loc = game.getLocation();
        if (loc == null || loc.getLatitude() == null || loc.getLongitude() == null) {
            return unavailable("NO_LOCATION");
        }

        boolean showExact = hasExactLocationAccess(game, requestingUserId);
        double lat;
        double lon;
        if (showExact) {
            lat = loc.getLatitude();
            lon = loc.getLongitude();
        } else {
            // Round to 1 decimal place (~11 km) to avoid exposing the exact venue.
            lat = Math.round(loc.getLatitude() * 10.0) / 10.0;
            lon = Math.round(loc.getLongitude() * 10.0) / 10.0;
        }

        try {
            String url = String.format(OPEN_METEO_URL, lat, lon);
            OpenMeteoResponse resp = restTemplate.getForObject(url, OpenMeteoResponse.class);

            if (resp == null || resp.getHourly() == null) {
                return unavailable("FORECAST_ERROR");
            }

            HourlyData hourly = resp.getHourly();
            List<String> times = hourly.getTime();
            if (times == null || times.isEmpty()) {
                return unavailable("FORECAST_ERROR");
            }

            int idx = closestHourIndex(times, game.getStartTime());
            if (idx < 0) {
                return unavailable("FORECAST_ERROR");
            }

            double temp   = safeGet(hourly.getTemperature2m(), idx, Double.NaN);
            int    precip = safeGetInt(hourly.getPrecipitationProbability(), idx, 0);
            double wind   = safeGet(hourly.getWindspeed10m(), idx, 0.0);
            int    code   = safeGetInt(hourly.getWeathercode(), idx, 0);

            if (Double.isNaN(temp)) {
                return unavailable("FORECAST_ERROR");
            }

            return WeatherDto.WeatherForecast.builder()
                    .forecastAvailable(true)
                    .temperatureCelsius(round1(temp))
                    .precipitationProbability(precip)
                    .windspeedKmh(round1(wind))
                    .condition(resolveCondition(code))
                    .conditionCode(code)
                    .locationHidden(!showExact)
                    .build();

        } catch (Exception e) {
            log.warn("Open-Meteo request failed for game {}: {}", gameId, e.getMessage());
            return unavailable("FORECAST_ERROR");
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static WeatherDto.WeatherForecast unavailable(String reason) {
        return WeatherDto.WeatherForecast.builder()
                .forecastAvailable(false)
                .unavailableReason(reason)
                .build();
    }

    private boolean hasExactLocationAccess(Game game, UUID userId) {
        if (userId == null) return false;
        if (game.getCreatedBy().getUserId().equals(userId)) return true;
        Optional<GameParticipation> p =
                participationRepository.findByGameAndUser(game.getGameId(), userId);
        return p.filter(pt -> pt.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED)
                .isPresent();
    }

    /**
     * Finds the index in the hourly time array whose local-time string is
     * closest to {@code target} (which is UTC).  Open-Meteo returns times in
     * the location's local timezone when timezone=auto.
     */
    private int closestHourIndex(List<String> times, Instant target) {
        // Format target in UTC as "yyyy-MM-dd'T'HH:00" to compare against
        // the hour portion of each local-time string in the array.
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
                .withZone(ZoneOffset.UTC);
        String targetHour = fmt.format(target.truncatedTo(ChronoUnit.HOURS));

        // Try exact UTC match first (good enough for cities within a few
        // hours of UTC; for other zones it will fall back to nearest index).
        for (int i = 0; i < times.size(); i++) {
            if (times.get(i).equals(targetHour)) return i;
        }

        // Fallback: pick the entry whose wall-clock hour string is shortest
        // distance from the target string (lexicographic proximity is fine
        // since the times array is sorted and spans at most 16 days).
        long targetEpoch = target.truncatedTo(ChronoUnit.HOURS).getEpochSecond();
        int best = -1;
        long bestDiff = Long.MAX_VALUE;
        DateTimeFormatter isoFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
                .withZone(ZoneOffset.UTC);
        for (int i = 0; i < times.size(); i++) {
            try {
                Instant t = Instant.parse(times.get(i) + ":00Z");
                long diff = Math.abs(t.getEpochSecond() - targetEpoch);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    best = i;
                }
            } catch (Exception ignored) {
                // non-parseable entry, skip
            }
        }
        return best;
    }

    private String resolveCondition(int code) {
        return WMO_CONDITIONS.getOrDefault(code, "Unknown");
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static double safeGet(List<Double> list, int idx, double fallback) {
        if (list == null || idx >= list.size() || list.get(idx) == null) return fallback;
        return list.get(idx);
    }

    private static int safeGetInt(List<Integer> list, int idx, int fallback) {
        if (list == null || idx >= list.size() || list.get(idx) == null) return fallback;
        return list.get(idx);
    }

    // -------------------------------------------------------------------------
    // Open-Meteo response shape
    // -------------------------------------------------------------------------

    @Data
    private static class OpenMeteoResponse {
        private HourlyData hourly;
    }

    @Data
    private static class HourlyData {
        private List<String>  time;
        @JsonProperty("temperature_2m")
        private List<Double>  temperature2m;
        @JsonProperty("precipitation_probability")
        private List<Integer> precipitationProbability;
        @JsonProperty("windspeed_10m")
        private List<Double>  windspeed10m;
        private List<Integer> weathercode;
    }
}
