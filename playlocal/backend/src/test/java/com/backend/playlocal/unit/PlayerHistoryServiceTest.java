package com.backend.playlocal.unit;

import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.service.PlayerHistoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlayerHistoryServiceTest {

    @Mock
    private GameParticipationRepository participationRepository;

    @InjectMocks
    private PlayerHistoryService playerHistoryService;

    @Test
    @DisplayName("getNonFirstTimePlayers returns empty when no confirmed attendees")
    void getNonFirstTimePlayers_NoConfirmedAttendees_ReturnsEmpty() {
        UUID gameId = UUID.randomUUID();
        UUID organizerUserId = UUID.randomUUID();
        when(participationRepository.getConfirmedAttendees(gameId, organizerUserId)).thenReturn(List.of());

        List<UUID> result = playerHistoryService.getNonFirstTimePlayers(gameId, organizerUserId);

        assertThat(result).isEmpty();
        verify(participationRepository).getConfirmedAttendees(gameId, organizerUserId);
        verify(participationRepository, never()).getAttendanceHistoryForPlayers(org.mockito.ArgumentMatchers.anyList(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("getNonFirstTimePlayers delegates to attendance history query for confirmed attendees")
    void getNonFirstTimePlayers_WithConfirmedAttendees_ReturnsAttendanceHistory() {
        UUID gameId = UUID.randomUUID();
        UUID organizerUserId = UUID.randomUUID();
        UUID attendee1 = UUID.randomUUID();
        UUID attendee2 = UUID.randomUUID();
        List<UUID> confirmedAttendees = List.of(attendee1, attendee2);
        List<UUID> nonFirstTimePlayers = List.of(attendee2);

        when(participationRepository.getConfirmedAttendees(gameId, organizerUserId))
                .thenReturn(confirmedAttendees);
        when(participationRepository.getAttendanceHistoryForPlayers(confirmedAttendees, gameId, organizerUserId))
                .thenReturn(nonFirstTimePlayers);

        List<UUID> result = playerHistoryService.getNonFirstTimePlayers(gameId, organizerUserId);

        assertThat(result).containsExactly(attendee2);
        verify(participationRepository).getConfirmedAttendees(gameId, organizerUserId);
        verify(participationRepository).getAttendanceHistoryForPlayers(confirmedAttendees, gameId, organizerUserId);
    }
}
