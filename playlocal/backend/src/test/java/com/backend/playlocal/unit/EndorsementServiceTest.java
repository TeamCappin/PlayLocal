package com.backend.playlocal.unit;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.EndorsementDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.service.EndorsementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EndorsementServiceTest {

    @Mock
    private EndorsementRepository endorsementRepository;
    @Mock
    private GameRepository gameRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GameParticipationRepository participationRepository;

    @InjectMocks
    private EndorsementService endorsementService;

    private User organizer;
    private User player;
    private Game game;
    private GameParticipation participation;

    @BeforeEach
    void setUp() {
        organizer = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Organizer")
                .build();

        player = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Player")
                .build();

        game = Game.builder()
                .gameId(UUID.randomUUID())
                .createdBy(organizer)
                .startTime(Instant.now())
                .build();

        participation = GameParticipation.builder()
                .game(game)
                .user(player)
                .attendanceStatus(GameParticipation.AttendanceStatus.ATTENDED)
                .build();
    }

    @Test
    @DisplayName("Should create endorsement successfully")
    void createEndorsement_Success() {
        EndorsementDto.CreateRequest request = new EndorsementDto.CreateRequest(player.getUserId(), game.getGameId());

        when(userRepository.findActiveById(organizer.getUserId())).thenReturn(Optional.of(organizer));
        when(userRepository.findActiveById(player.getUserId())).thenReturn(Optional.of(player));
        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
        when(participationRepository.findByGameAndUser(game.getGameId(), player.getUserId())).thenReturn(Optional.of(participation));
        when(endorsementRepository.existsByEndorserAndEndorsedUserAndGame(organizer, player, game)).thenReturn(false);
        when(endorsementRepository.save(any(Endorsement.class))).thenAnswer(invocation -> {
            Endorsement e = invocation.getArgument(0);
            e.setEndorsementId(UUID.randomUUID());
            return e;
        });

        EndorsementDto.Response response = endorsementService.createEndorsement(organizer.getUserId(), request);

        assertThat(response).isNotNull();
        assertThat(response.getEndorserId()).isEqualTo(organizer.getUserId());
        assertThat(response.getEndorsedUserId()).isEqualTo(player.getUserId());
        assertThat(response.getLabel()).isEqualTo("Organizer's Pick");

        verify(endorsementRepository).save(any(Endorsement.class));
    }

    @Test
    @DisplayName("Should fail if requester is not organizer")
    void createEndorsement_NotOrganizer() {
        User otherUser = User.builder().userId(UUID.randomUUID()).build();
        EndorsementDto.CreateRequest request = new EndorsementDto.CreateRequest(player.getUserId(), game.getGameId());

        when(userRepository.findActiveById(otherUser.getUserId())).thenReturn(Optional.of(otherUser));
        when(userRepository.findActiveById(player.getUserId())).thenReturn(Optional.of(player));
        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));

        assertThatThrownBy(() -> endorsementService.createEndorsement(otherUser.getUserId(), request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only the game organizer can endorse players");
    }

    @Test
    @DisplayName("Should fail if player did not attend")
    void createEndorsement_NotAttended() {
        participation.setAttendanceStatus(GameParticipation.AttendanceStatus.NO_SHOW);
        EndorsementDto.CreateRequest request = new EndorsementDto.CreateRequest(player.getUserId(), game.getGameId());

        when(userRepository.findActiveById(organizer.getUserId())).thenReturn(Optional.of(organizer));
        when(userRepository.findActiveById(player.getUserId())).thenReturn(Optional.of(player));
        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
        when(participationRepository.findByGameAndUser(game.getGameId(), player.getUserId())).thenReturn(Optional.of(participation));

        assertThatThrownBy(() -> endorsementService.createEndorsement(organizer.getUserId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User must have attended the game");
    }

    @Test
    @DisplayName("Should fail if already endorsed")
    void createEndorsement_AlreadyEndorsed() {
        EndorsementDto.CreateRequest request = new EndorsementDto.CreateRequest(player.getUserId(), game.getGameId());

        when(userRepository.findActiveById(organizer.getUserId())).thenReturn(Optional.of(organizer));
        when(userRepository.findActiveById(player.getUserId())).thenReturn(Optional.of(player));
        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
        when(participationRepository.findByGameAndUser(game.getGameId(), player.getUserId())).thenReturn(Optional.of(participation));
        when(endorsementRepository.existsByEndorserAndEndorsedUserAndGame(organizer, player, game)).thenReturn(true);

        assertThatThrownBy(() -> endorsementService.createEndorsement(organizer.getUserId(), request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("User already endorsed");
    }

    @Test
    @DisplayName("Should return user endorsements")
    void getUserEndorsements() {
        Endorsement endorsement = Endorsement.builder()
                .endorsementId(UUID.randomUUID())
                .endorser(organizer)
                .endorsedUser(player)
                .game(game)
                .label("Organizer's Pick")
                .createdAt(Instant.now())
                .build();

        when(endorsementRepository.findByEndorsedUser_UserIdOrderByCreatedAtDesc(player.getUserId()))
                .thenReturn(List.of(endorsement));

        List<EndorsementDto.Response> results = endorsementService.getUserEndorsements(player.getUserId());

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getEndorsementId()).isEqualTo(endorsement.getEndorsementId());
    }
}
