package com.backend.playlocal.scheduler;

import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.repository.GameRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameLifecycleSchedulerTest {

    @Mock
    private GameRepository gameRepository;

    @InjectMocks
    private GameLifecycleScheduler scheduler;

    @Test
    void completeGamesPastEndTime_marksCompletedAndSaves() {
        Game scheduled = Game.builder()
                .status(Game.GameStatus.SCHEDULED)
                .endTime(Instant.now().minusSeconds(60))
                .build();
        Game inProgress = Game.builder()
                .status(Game.GameStatus.IN_PROGRESS)
                .endTime(Instant.now().minusSeconds(120))
                .build();

        when(gameRepository.findGamesToComplete(any(Instant.class)))
                .thenReturn(List.of(scheduled, inProgress));

        scheduler.completeGamesPastEndTime();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Game>> gamesCaptor = ArgumentCaptor.forClass(List.class);
        verify(gameRepository).saveAll(gamesCaptor.capture());
        List<Game> saved = gamesCaptor.getValue();
        assertThat(saved).hasSize(2);
        assertThat(saved).allMatch(game -> game.getStatus() == Game.GameStatus.COMPLETED);
    }

    @Test
    void completeGamesPastEndTime_noGames_doesNotSave() {
        when(gameRepository.findGamesToComplete(any(Instant.class))).thenReturn(List.of());

        scheduler.completeGamesPastEndTime();

        verify(gameRepository, never()).saveAll(any());
    }
}
