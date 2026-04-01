package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.WeatherDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.Location;
import com.backend.playlocal.model.entity.Sport;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestToUriTemplate;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Unit tests for WeatherService (US-7.3).
 * Non-HTTP paths use Mockito stubs only.
 * HTTP paths use MockRestServiceServer to intercept RestTemplate calls.
 */
@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

    @Mock
    private GameRepository gameRepository;
    @Mock
    private GameParticipationRepository participationRepository;

    private WeatherService weatherService;
    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;

    private UUID gameId;
    private UUID organizerId;
    private UUID participantId;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.createServer(restTemplate);
        weatherService = new WeatherService(gameRepository, participationRepository);
        ReflectionTestUtils.setField(weatherService, "restTemplate", restTemplate);

        gameId = UUID.randomUUID();
        organizerId = UUID.randomUUID();
        participantId = UUID.randomUUID();
    }

    // -------------------------------------------------------------------------
    // Early-exit paths — no HTTP calls
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Returns NO_LOCATION when game does not exist")
    void getForecast_GameNotFound_ReturnsNoLocation() {
        when(gameRepository.findById(gameId)).thenReturn(Optional.empty());

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("NO_LOCATION");
    }

    @Test
    @DisplayName("Returns INDOOR_GAME for indoor games")
    void getForecast_IndoorGame_ReturnsIndoorGameReason() {
        Game game = buildGame("indoor", Instant.now().plus(1, ChronoUnit.DAYS), withLocation(45.5f, -73.5f));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("INDOOR_GAME");
    }

    @Test
    @DisplayName("Returns PAST_GAME for games whose startTime has already passed")
    void getForecast_PastGame_ReturnsPastGameReason() {
        Game game = buildGame("outdoor", Instant.now().minus(1, ChronoUnit.HOURS), withLocation(45.5f, -73.5f));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("PAST_GAME");
    }

    @Test
    @DisplayName("Returns PAST_GAME when startTime is null")
    void getForecast_NullStartTime_ReturnsPastGameReason() {
        Game game = buildGame("outdoor", null, withLocation(45.5f, -73.5f));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("PAST_GAME");
    }

    @Test
    @DisplayName("Returns TOO_FAR_AHEAD for games more than 16 days in the future")
    void getForecast_TooFarAhead_ReturnsTooFarAheadReason() {
        Game game = buildGame("outdoor", Instant.now().plus(17, ChronoUnit.DAYS), withLocation(45.5f, -73.5f));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("TOO_FAR_AHEAD");
    }

    @Test
    @DisplayName("Returns NO_LOCATION when game has no location")
    void getForecast_NullLocation_ReturnsNoLocation() {
        Game game = buildGame("outdoor", Instant.now().plus(1, ChronoUnit.DAYS), null);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("NO_LOCATION");
    }

    @Test
    @DisplayName("Returns NO_LOCATION when location has null coordinates")
    void getForecast_LocationWithoutCoords_ReturnsNoLocation() {
        Location locNoCoords = Location.builder()
                .city("Montreal")
                .latitude(null)
                .longitude(null)
                .build();
        Game game = buildGame("outdoor", Instant.now().plus(1, ChronoUnit.DAYS), locNoCoords);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("NO_LOCATION");
    }

    // -------------------------------------------------------------------------
    // HTTP success path
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Returns full forecast for organizer (exact location, locationHidden=false)")
    void getForecast_AsOrganizer_ReturnsForecastWithExactLocation() {
        Instant gameStart = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        String timeSlot = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
                .withZone(ZoneOffset.UTC).format(gameStart);

        Game game = buildGame("outdoor", gameStart, withLocation(45.5f, -73.5f));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        mockServer.expect(requestToUriTemplate(
                        "https://api.open-meteo.com/v1/forecast{?latitude,longitude,hourly,timezone,forecast_days}"))
                .andRespond(withSuccess(openMeteoJson(timeSlot, 14.5, 20, 12.3, 2),
                        MediaType.APPLICATION_JSON));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, organizerId);

        assertThat(result.isForecastAvailable()).isTrue();
        assertThat(result.getTemperatureCelsius()).isEqualTo(14.5);
        assertThat(result.getPrecipitationProbability()).isEqualTo(20);
        assertThat(result.getWindspeedKmh()).isEqualTo(12.3);
        assertThat(result.getConditionCode()).isEqualTo(2);
        assertThat(result.getCondition()).isEqualTo("Partly Cloudy");
        assertThat(result.isLocationHidden()).isFalse();
        mockServer.verify();
    }

    @Test
    @DisplayName("Returns forecast with locationHidden=true for non-participant")
    void getForecast_AsNonParticipant_ReturnsForecastWithHiddenLocation() {
        Instant gameStart = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        String timeSlot = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
                .withZone(ZoneOffset.UTC).format(gameStart);

        User otherUser = User.builder().userId(organizerId).displayName("Organizer").build();
        Game game = buildGameWithOrganizer("outdoor", gameStart, withLocation(45.5f, -73.5f), otherUser);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(participationRepository.findByGameAndUser(any(), any())).thenReturn(Optional.empty());

        mockServer.expect(requestToUriTemplate(
                        "https://api.open-meteo.com/v1/forecast{?latitude,longitude,hourly,timezone,forecast_days}"))
                .andRespond(withSuccess(openMeteoJson(timeSlot, 10.0, 50, 20.0, 61),
                        MediaType.APPLICATION_JSON));

        UUID nonParticipantId = UUID.randomUUID();
        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, nonParticipantId);

        assertThat(result.isForecastAvailable()).isTrue();
        assertThat(result.isLocationHidden()).isTrue();
        mockServer.verify();
    }

    @Test
    @DisplayName("Returns forecast with locationHidden=false for confirmed participant")
    void getForecast_AsConfirmedParticipant_ReturnsForecastWithExactLocation() {
        Instant gameStart = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        String timeSlot = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
                .withZone(ZoneOffset.UTC).format(gameStart);

        User organizer = User.builder().userId(organizerId).displayName("Organizer").build();
        Game game = buildGameWithOrganizer("outdoor", gameStart, withLocation(45.5f, -73.5f), organizer);
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        GameParticipation confirmedP = GameParticipation.builder()
                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                .build();
        when(participationRepository.findByGameAndUser(any(), any()))
                .thenReturn(Optional.of(confirmedP));

        mockServer.expect(requestToUriTemplate(
                        "https://api.open-meteo.com/v1/forecast{?latitude,longitude,hourly,timezone,forecast_days}"))
                .andRespond(withSuccess(openMeteoJson(timeSlot, 10.0, 5, 8.0, 0),
                        MediaType.APPLICATION_JSON));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, participantId);

        assertThat(result.isForecastAvailable()).isTrue();
        assertThat(result.isLocationHidden()).isFalse();
        assertThat(result.getCondition()).isEqualTo("Clear Sky");
        mockServer.verify();
    }

    // -------------------------------------------------------------------------
    // HTTP failure paths
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Returns FORECAST_ERROR when Open-Meteo returns 500")
    void getForecast_ApiServerError_ReturnsForecastError() {
        Instant gameStart = Instant.now().plus(1, ChronoUnit.DAYS);
        Game game = buildGame("outdoor", gameStart, withLocation(45.5f, -73.5f));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        mockServer.expect(requestToUriTemplate(
                        "https://api.open-meteo.com/v1/forecast{?latitude,longitude,hourly,timezone,forecast_days}"))
                .andRespond(withServerError());

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("FORECAST_ERROR");
    }

    @Test
    @DisplayName("Returns FORECAST_ERROR when Open-Meteo returns empty hourly data")
    void getForecast_EmptyHourlyData_ReturnsForecastError() {
        Instant gameStart = Instant.now().plus(1, ChronoUnit.DAYS);
        Game game = buildGame("outdoor", gameStart, withLocation(45.5f, -73.5f));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        mockServer.expect(requestToUriTemplate(
                        "https://api.open-meteo.com/v1/forecast{?latitude,longitude,hourly,timezone,forecast_days}"))
                .andRespond(withSuccess("{\"hourly\":{\"time\":[],\"temperature_2m\":[],\"precipitation_probability\":[],\"windspeed_10m\":[],\"weathercode\":[]}}",
                        MediaType.APPLICATION_JSON));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("FORECAST_ERROR");
    }

    @Test
    @DisplayName("Returns FORECAST_ERROR when Open-Meteo returns no hourly object")
    void getForecast_NullHourly_ReturnsForecastError() {
        Instant gameStart = Instant.now().plus(1, ChronoUnit.DAYS);
        Game game = buildGame("outdoor", gameStart, withLocation(45.5f, -73.5f));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));

        mockServer.expect(requestToUriTemplate(
                        "https://api.open-meteo.com/v1/forecast{?latitude,longitude,hourly,timezone,forecast_days}"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        WeatherDto.WeatherForecast result = weatherService.getForecast(gameId, null);

        assertThat(result.isForecastAvailable()).isFalse();
        assertThat(result.getUnavailableReason()).isEqualTo("FORECAST_ERROR");
    }

    // -------------------------------------------------------------------------
    // Builder helpers
    // -------------------------------------------------------------------------

    private Game buildGame(String indoorOutdoor, Instant startTime, Location location) {
        User organizer = User.builder()
                .userId(organizerId)
                .displayName("Organizer")
                .reliabilityScore(100.0f)
                .build();
        return buildGameWithOrganizer(indoorOutdoor, startTime, location, organizer);
    }

    private Game buildGameWithOrganizer(String indoorOutdoor, Instant startTime,
                                        Location location, User organizer) {
        Sport sport = Sport.builder().name("Basketball").build();
        return Game.builder()
                .gameId(gameId)
                .title("Test Game")
                .indoorOutdoor(indoorOutdoor)
                .startTime(startTime)
                .location(location)
                .createdBy(organizer)
                .sport(sport)
                .status(Game.GameStatus.SCHEDULED)
                .build();
    }

    private static Location withLocation(float lat, float lon) {
        return Location.builder()
                .name("Test Field")
                .city("Montreal")
                .latitude(lat)
                .longitude(lon)
                .build();
    }

    /** Builds a minimal Open-Meteo JSON response with one hourly entry. */
    private static String openMeteoJson(String time, double temp, int precip, double wind, int code) {
        return String.format("""
                {
                  "latitude": 45.5,
                  "longitude": -73.5,
                  "hourly": {
                    "time": ["%s"],
                    "temperature_2m": [%s],
                    "precipitation_probability": [%d],
                    "windspeed_10m": [%s],
                    "weathercode": [%d]
                  }
                }
                """, time, temp, precip, wind, code);
    }
}
