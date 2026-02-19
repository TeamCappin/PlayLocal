package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.GameParticipationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ConnectionSignalsService.
 * US-32: Mutual connections and co-play signals; verifies repository is called with COMPLETED status (JPQL enum fix).
 */
@ExtendWith(MockitoExtension.class)
class ConnectionSignalsServiceTest {

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private GameParticipationRepository gameParticipationRepository;

    @InjectMocks
    private ConnectionSignalsService connectionSignalsService;

    @Captor
    private ArgumentCaptor<Instant> sinceCaptor;

    private UUID viewerId;
    private UUID targetId;

    @BeforeEach
    void setUp() {
        viewerId = UUID.randomUUID();
        targetId = UUID.randomUUID();
        lenient().when(friendshipRepository.findAcceptedFriendUserIds(viewerId)).thenReturn(List.of());
        lenient().when(friendshipRepository.findAcceptedFriendPairsForUserIds(any())).thenReturn(List.of());
        lenient().when(gameParticipationRepository.findAttendedCompletedGamePairsSince(any(), any(), any()))
                .thenReturn(List.of());
    }

    @Test
    @DisplayName("getSignalsBatch calls findAttendedCompletedGamePairsSince with GameStatus.COMPLETED")
    void getSignalsBatch_callsRepositoryWithCompletedStatus() {
        connectionSignalsService.getSignalsBatch(viewerId, List.of(targetId));

        verify(gameParticipationRepository).findAttendedCompletedGamePairsSince(
                any(List.class),
                sinceCaptor.capture(),
                eq(Game.GameStatus.COMPLETED)
        );
        assertThat(sinceCaptor.getValue()).isNotNull();
    }

    @Test
    @DisplayName("getSignals returns zero signals when viewer equals target without calling repository")
    void getSignals_whenViewerEqualsTarget_returnsZeroSignals() {
        UserDto.ConnectionSignals result = connectionSignalsService.getSignals(viewerId, viewerId);

        assertThat(result.getMutualFriendCount()).isZero();
        assertThat(result.getCoPlayCount()).isZero();
        verifyNoInteractions(gameParticipationRepository);
    }

    @Test
    @DisplayName("getSignalsBatch returns co-play count when repository returns attended game pairs")
    void getSignalsBatch_whenCoPlayExists_returnsCoPlayCount() {
        UUID sharedGameId = UUID.randomUUID();
        when(gameParticipationRepository.findAttendedCompletedGamePairsSince(
                any(List.class),
                any(Instant.class),
                eq(Game.GameStatus.COMPLETED)))
                .thenReturn(List.of(
                        new Object[]{viewerId, sharedGameId},
                        new Object[]{targetId, sharedGameId}
                ));

        Map<String, UserDto.ConnectionSignals> result =
                connectionSignalsService.getSignalsBatch(viewerId, List.of(targetId));

        assertThat(result).containsKey(targetId.toString());
        assertThat(result.get(targetId.toString()).getCoPlayCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("getSignals returns batch result for single target when viewer != target")
    void getSignals_whenViewerNotTarget_returnsBatchResult() {
        when(friendshipRepository.findAcceptedFriendUserIds(viewerId)).thenReturn(List.of());
        when(friendshipRepository.findAcceptedFriendPairsForUserIds(any())).thenReturn(List.of());
        when(gameParticipationRepository.findAttendedCompletedGamePairsSince(any(), any(), eq(Game.GameStatus.COMPLETED)))
                .thenReturn(List.of());

        UserDto.ConnectionSignals result = connectionSignalsService.getSignals(viewerId, targetId);

        assertThat(result).isNotNull();
        assertThat(result.getMutualFriendCount()).isZero();
        assertThat(result.getCoPlayCount()).isZero();
        verify(gameParticipationRepository).findAttendedCompletedGamePairsSince(any(), any(), eq(Game.GameStatus.COMPLETED));
    }

    @Test
    @DisplayName("getSignalsBatch puts zero signals for viewer when viewer is in targetIds")
    void getSignalsBatch_whenViewerInTargetIds_putsZeroForViewer() {
        Map<String, UserDto.ConnectionSignals> result =
                connectionSignalsService.getSignalsBatch(viewerId, List.of(viewerId, targetId));

        assertThat(result).containsKey(viewerId.toString());
        assertThat(result.get(viewerId.toString()).getMutualFriendCount()).isZero();
        assertThat(result.get(viewerId.toString()).getCoPlayCount()).isZero();
        assertThat(result).containsKey(targetId.toString());
    }
}
