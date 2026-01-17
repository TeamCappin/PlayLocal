package com.backend.playlocal.unit;

import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import com.backend.playlocal.service.GameService;
import com.backend.playlocal.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameServicePrivacyTest {

        @Mock
        private GameRepository gameRepository;
        @Mock
        private GameParticipationRepository participationRepository;
        @Mock
        private UserRepository userRepository;
        @Mock
        private SportRepository sportRepository;
        @Mock
        private LocationRepository locationRepository;
        @Mock
        private GameVisibilityRepository gameVisibilityRepository;
        @Mock
        private NotificationService notificationService;

        @InjectMocks
        private GameService gameService;

        private Game game;
        private User organizer;
        private User participant;
        private User stranger;
        private Location location;

        @BeforeEach
        void setUp() {
                organizer = User.builder()
                                .userId(UUID.randomUUID())
                                .displayName("Organizer")
                                .reliabilityScore(100.0f)
                                .build();

                participant = User.builder()
                                .userId(UUID.randomUUID())
                                .displayName("Player")
                                .reliabilityScore(100.0f)
                                .build();

                stranger = User.builder()
                                .userId(UUID.randomUUID())
                                .displayName("Stranger")
                                .reliabilityScore(80.0f)
                                .build();

                location = Location.builder()
                                .name("Secret Field")
                                .addressLine("123 Hidden Lane")
                                .city("Montreal")
                                .latitude(45.50f)
                                .longitude(-73.56f)
                                .build();

                game = Game.builder()
                                .gameId(UUID.randomUUID())
                                .title("Secret Game")
                                .createdBy(organizer)
                                .location(location)
                                .sport(Sport.builder().name("Soccer").build())
                                .indoorOutdoor("Outdoor")
                                .minPlayers(2).maxPlayers(10)
                                .allowWaitlist(true)
                                .status(Game.GameStatus.SCHEDULED)
                                .startTime(Instant.now().plusSeconds(3600))
                                .endTime(Instant.now().plusSeconds(7200))
                                .build();
        }

        @Test
        void getGameById_AsOrganizer_ReturnsExactLocation() {
                when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
                when(participationRepository.countConfirmedParticipants(any())).thenReturn(1);

                GameDto.GameResponse response = gameService.getGameById(game.getGameId(), organizer.getUserId());

                assertNotNull(response.getLocation(), "Organizer should see exact location");
                assertEquals("123 Hidden Lane", response.getLocation().getAddressLine());
        }

        @Test
        void getGameById_AsConfirmedParticipant_ReturnsExactLocation() {
                when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));

                // Mock participation check
                GameParticipation gp = GameParticipation.builder()
                                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                .user(participant)
                                .build();
                when(participationRepository.findByGameAndUser(game.getGameId(), participant.getUserId()))
                                .thenReturn(Optional.of(gp));

                GameDto.GameResponse response = gameService.getGameById(game.getGameId(), participant.getUserId());

                assertNotNull(response.getLocation(), "Confirmed participant should see exact location");
                assertEquals("123 Hidden Lane", response.getLocation().getAddressLine());
        }

        @Test
        void getGameById_AsStranger_ReturnsNullLocation() {
                when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));

                // Not a participant
                when(participationRepository.findByGameAndUser(game.getGameId(), stranger.getUserId()))
                                .thenReturn(Optional.empty());

                GameDto.GameResponse response = gameService.getGameById(game.getGameId(), stranger.getUserId());

                assertNull(response.getLocation(), "Stranger should NOT see exact location");
                assertNotNull(response.getApproximateLocation());
                assertTrue(response.getApproximateLocation().contains("Montreal"));
        }

        @Test
        void getGameById_AsGuest_ReturnsNullLocation() {
                when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));

                // null user ID passed
                GameDto.GameResponse response = gameService.getGameById(game.getGameId(), null);

                assertNull(response.getLocation(), "Guest should NOT see exact location");
                assertNotNull(response.getApproximateLocation());
        }

        @Test
        void getGameById_AsWaitlistedParticipant_ReturnsNullLocation() {
                when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));

                // Mock waitlisted participation (not CONFIRMED)
                GameParticipation waitlistedGp = GameParticipation.builder()
                                .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                                .user(stranger)
                                .build();
                when(participationRepository.findByGameAndUser(game.getGameId(), stranger.getUserId()))
                                .thenReturn(Optional.of(waitlistedGp));

                GameDto.GameResponse response = gameService.getGameById(game.getGameId(), stranger.getUserId());

                // Per US-1.3: Only CONFIRMED participants see exact location
                assertNull(response.getLocation(), "Waitlisted user should NOT see exact location");
                assertNotNull(response.getApproximateLocation());
                assertTrue(response.getApproximateLocation().contains("Montreal"));
        }

        @Test
        void getGameById_NullLocation_ReturnsLocationUnavailable() {
                // Create game without location
                Game gameNoLocation = Game.builder()
                                .gameId(UUID.randomUUID())
                                .title("Game Without Location")
                                .createdBy(organizer)
                                .location(null) // No location set
                                .sport(Sport.builder().name("Soccer").build())
                                .indoorOutdoor("Outdoor")
                                .minPlayers(2).maxPlayers(10)
                                .allowWaitlist(true)
                                .status(Game.GameStatus.SCHEDULED)
                                .startTime(Instant.now().plusSeconds(3600))
                                .endTime(Instant.now().plusSeconds(7200))
                                .build();

                when(gameRepository.findById(gameNoLocation.getGameId())).thenReturn(Optional.of(gameNoLocation));
                when(participationRepository.countConfirmedParticipants(any())).thenReturn(0);

                GameDto.GameResponse response = gameService.getGameById(gameNoLocation.getGameId(),
                                organizer.getUserId());

                assertNull(response.getLocation(), "Location should be null when game has no location");
                assertEquals("Location unavailable", response.getApproximateLocation());
        }
}
