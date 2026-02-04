package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GameService.createGame - US-2.1, US-4.1 (minReliabilityRequired, min/max age)
 * Covers builder lines: skillBand, minPlayers, maxPlayers, allowWaitlist, minReliabilityRequired, minAge, maxAge
 */
@ExtendWith(MockitoExtension.class)
class GameServiceCreateTest {

    @Mock
    private GameRepository gameRepository;
    @Mock
    private GameParticipationRepository participationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SportRepository sportRepository;
    @Mock
    private GameVisibilityRepository gameVisibilityRepository;
    @Mock
    private EndorsementRepository endorsementRepository;
    @Mock
    private GameTagRepository tagRepository;
    @Mock
    private GameTagAssignmentRepository tagAssignmentRepository;
    @Mock
    private GameTagConfirmationRepository tagConfirmationRepository;
    @Mock
    private OrganizerQualityService oqsService;

    @InjectMocks
    private GameService gameService;

    private UUID organizerId;
    private User organizer;
    private Sport sport;
    private GameVisibility visibility;

    @BeforeEach
    void setUp() {
        organizerId = UUID.randomUUID();
        organizer = User.builder()
                .userId(organizerId)
                .displayName("Organizer")
                .email("organizer@example.com")
                .reliabilityScore(95.0f)
                .build();
        sport = Sport.builder()
                .sportId(UUID.randomUUID())
                .name("Basketball")
                .build();
        visibility = GameVisibility.builder()
                .code("public")
                .build();
    }

    @Test
    @DisplayName("createGame with minPlayers, maxPlayers, allowWaitlist, minReliabilityRequired, minAge, maxAge sets all on game")
    void createGame_WithAllOptionalFields_ShouldSetThemOnGame() {
        Instant start = Instant.now().plusSeconds(3600);
        GameDto.CreateRequest request = GameDto.CreateRequest.builder()
                .title("Full Options Game")
                .sportName("Basketball")
                .locationName("Park")
                .addressLine("123 St")
                .city("Montreal")
                .indoorOutdoor("OUTDOOR")
                .intensityBand("COMPETITIVE")
                .skillBand("INTERMEDIATE")
                .minPlayers(6)
                .maxPlayers(12)
                .allowWaitlist(false)
                .minReliabilityRequired(85.0f)
                .minAge(18)
                .maxAge(65)
                .startTime(start)
                .build();

        when(userRepository.findActiveById(organizerId)).thenReturn(Optional.of(organizer));
        when(sportRepository.findByNameIgnoreCase("Basketball")).thenReturn(Optional.of(sport));
        when(gameVisibilityRepository.findByCode("public")).thenReturn(Optional.of(visibility));
        when(gameRepository.save(any(Game.class))).thenAnswer(inv -> {
            Game g = inv.getArgument(0);
            if (g.getGameId() == null) {
                g.setGameId(UUID.randomUUID());
                g.setCreatedAt(Instant.now());
            }
            return g;
        });
        when(participationRepository.countConfirmedParticipants(any())).thenReturn(1);
        when(participationRepository.findWaitlistedByGame(any())).thenReturn(java.util.Collections.emptyList());
        when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());

        GameDto.GameResponse response = gameService.createGame(request, organizerId);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Full Options Game");
        assertThat(response.getMinPlayers()).isEqualTo(6);
        assertThat(response.getMaxPlayers()).isEqualTo(12);
        assertThat(response.getAllowWaitlist()).isFalse();
        assertThat(response.getMinReliabilityRequired()).isEqualTo(85.0f);

        ArgumentCaptor<Game> gameCaptor = ArgumentCaptor.forClass(Game.class);
        verify(gameRepository).save(gameCaptor.capture());
        Game savedGame = gameCaptor.getValue();
        assertThat(savedGame.getMinPlayers()).isEqualTo(6);
        assertThat(savedGame.getMaxPlayers()).isEqualTo(12);
        assertThat(savedGame.getAllowWaitlist()).isFalse();
        assertThat(savedGame.getMinReliabilityRequired()).isEqualTo(85.0f);
        assertThat(savedGame.getMinAge()).isEqualTo(18);
        assertThat(savedGame.getMaxAge()).isEqualTo(65);
        assertThat(savedGame.getSkillBand()).isEqualTo("INTERMEDIATE");
    }

    @Test
    @DisplayName("createGame with null minPlayers uses default 2")
    void createGame_WithNullMinPlayers_UsesDefaultTwo() {
        Instant start = Instant.now().plusSeconds(3600);
        GameDto.CreateRequest request = GameDto.CreateRequest.builder()
                .title("Default Min Game")
                .sportName("Basketball")
                .locationName("Park")
                .city("Montreal")
                .indoorOutdoor("OUTDOOR")
                .intensityBand("CASUAL")
                .skillBand("ALL_LEVELS")
                .minPlayers(null)
                .maxPlayers(20)
                .allowWaitlist(true)
                .startTime(start)
                .build();

        when(userRepository.findActiveById(organizerId)).thenReturn(Optional.of(organizer));
        when(sportRepository.findByNameIgnoreCase("Basketball")).thenReturn(Optional.of(sport));
        when(gameVisibilityRepository.findByCode("public")).thenReturn(Optional.of(visibility));
        when(gameRepository.save(any(Game.class))).thenAnswer(inv -> {
            Game g = inv.getArgument(0);
            if (g.getGameId() == null) {
                g.setGameId(UUID.randomUUID());
                g.setCreatedAt(Instant.now());
            }
            return g;
        });
        when(participationRepository.countConfirmedParticipants(any())).thenReturn(1);
        when(participationRepository.findWaitlistedByGame(any())).thenReturn(java.util.Collections.emptyList());
        when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());

        gameService.createGame(request, organizerId);

        ArgumentCaptor<Game> gameCaptor = ArgumentCaptor.forClass(Game.class);
        verify(gameRepository).save(gameCaptor.capture());
        assertThat(gameCaptor.getValue().getMinPlayers()).isEqualTo(2);
    }

    @Test
    @DisplayName("createGame with null allowWaitlist defaults to true")
    void createGame_WithNullAllowWaitlist_DefaultsTrue() {
        Instant start = Instant.now().plusSeconds(3600);
        GameDto.CreateRequest request = GameDto.CreateRequest.builder()
                .title("Waitlist Default")
                .sportName("Basketball")
                .locationName("Park")
                .city("Montreal")
                .indoorOutdoor("OUTDOOR")
                .intensityBand("CASUAL")
                .skillBand("BEGINNER")
                .minPlayers(4)
                .maxPlayers(10)
                .allowWaitlist(null)
                .startTime(start)
                .build();

        when(userRepository.findActiveById(organizerId)).thenReturn(Optional.of(organizer));
        when(sportRepository.findByNameIgnoreCase("Basketball")).thenReturn(Optional.of(sport));
        when(gameVisibilityRepository.findByCode("public")).thenReturn(Optional.of(visibility));
        when(gameRepository.save(any(Game.class))).thenAnswer(inv -> {
            Game g = inv.getArgument(0);
            if (g.getGameId() == null) {
                g.setGameId(UUID.randomUUID());
                g.setCreatedAt(Instant.now());
            }
            return g;
        });
        when(participationRepository.countConfirmedParticipants(any())).thenReturn(1);
        when(participationRepository.findWaitlistedByGame(any())).thenReturn(java.util.Collections.emptyList());
        when(tagAssignmentRepository.findAllByGame(any(Game.class))).thenReturn(java.util.Collections.emptyList());

        gameService.createGame(request, organizerId);

        ArgumentCaptor<Game> gameCaptor = ArgumentCaptor.forClass(Game.class);
        verify(gameRepository).save(gameCaptor.capture());
        assertThat(gameCaptor.getValue().getAllowWaitlist()).isTrue();
    }
}
