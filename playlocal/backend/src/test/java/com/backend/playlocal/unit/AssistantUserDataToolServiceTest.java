package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.Friendship;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.Sport;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.service.assistant.AssistantUserDataToolService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssistantUserDataToolServiceTest {

    @Mock
    private GameParticipationRepository participationRepository;
    @Mock
    private FriendshipRepository friendshipRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AssistantUserDataToolService toolService;

    @Test
    @DisplayName("upcomingGamesThisWeek only queries participations for the authenticated user")
    void upcomingGamesThisWeek_ScopedToUser() {
        UUID userId = UUID.randomUUID();
        when(participationRepository.findConfirmedByUserSince(eq(userId), ArgumentMatchers.any()))
                .thenReturn(List.of());

        AssistantUserDataToolService.UserDataResult r = toolService.upcomingGamesThisWeek(userId);

        assertThat(r.factualText()).contains("no confirmed games");
        verify(participationRepository).findConfirmedByUserSince(eq(userId), ArgumentMatchers.any());
    }

    @Test
    @DisplayName("pendingFriendRequests uses friendship repository for same user only")
    void pendingFriendRequests_Scoped() {
        UUID userId = UUID.randomUUID();
        Friendship f = Friendship.builder().build();
        when(friendshipRepository.findPendingRequestsReceived(userId)).thenReturn(List.of(f));
        when(friendshipRepository.findPendingRequestsSent(userId)).thenReturn(List.of());

        AssistantUserDataToolService.UserDataResult r = toolService.pendingFriendRequests(userId);

        assertThat(r.factualText()).contains("1 pending");
        verify(friendshipRepository).findPendingRequestsReceived(userId);
        verify(friendshipRepository).findPendingRequestsSent(userId);
    }

    @Test
    @DisplayName("myReliabilitySummary reads only the authenticated user row")
    void reliability_Scoped() {
        UUID userId = UUID.randomUUID();
        User u = User.builder()
                .userId(userId)
                .reliabilityScore(92.5f)
                .attendedCount(10)
                .noShowCount(1)
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(u));

        AssistantUserDataToolService.UserDataResult r = toolService.myReliabilitySummary(userId);

        assertThat(r.factualText()).contains("92.5").contains("10 attended");
        verify(userRepository).findById(userId);
    }

    @Test
    @DisplayName("myReliabilitySummary explains when the user row is missing")
    void reliability_UserMissing() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        AssistantUserDataToolService.UserDataResult r = toolService.myReliabilitySummary(userId);

        assertThat(r.tool()).isEqualTo(AssistantUserDataToolService.ToolName.MY_RELIABILITY_SUMMARY);
        assertThat(r.factualText()).contains("could not be loaded");
    }

    @Test
    @DisplayName("upcomingGamesThisWeek lists confirmed games whose start is in the current UTC ISO week")
    void upcomingGamesThisWeek_IncludesCurrentWeekGame() {
        UUID userId = UUID.randomUUID();
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        LocalDate monday = now.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant weekStart = monday.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant startInWeek = weekStart.plusSeconds(3 * 86400L);

        Sport sport = new Sport();
        sport.setName("Soccer");
        Game game = new Game();
        game.setTitle("Morning pickup");
        game.setSport(sport);
        game.setStartTime(startInWeek);
        game.setStatus(Game.GameStatus.SCHEDULED);

        GameParticipation gp = new GameParticipation();
        gp.setGame(game);
        gp.setLeftAt(null);

        when(participationRepository.findConfirmedByUserSince(eq(userId), ArgumentMatchers.any()))
                .thenReturn(List.of(gp));

        AssistantUserDataToolService.UserDataResult r = toolService.upcomingGamesThisWeek(userId);

        assertThat(r.factualText()).contains("Morning pickup").contains("Soccer");
    }

    @Test
    @DisplayName("upcomingGamesThisWeek skips participations the user left")
    void upcomingGamesThisWeek_SkipsLeftParticipation() {
        UUID userId = UUID.randomUUID();
        Game game = new Game();
        game.setTitle("Old");
        game.setStartTime(Instant.parse("2099-01-01T12:00:00Z"));
        game.setStatus(Game.GameStatus.SCHEDULED);
        GameParticipation gp = new GameParticipation();
        gp.setGame(game);
        gp.setLeftAt(Instant.now());
        when(participationRepository.findConfirmedByUserSince(eq(userId), ArgumentMatchers.any()))
                .thenReturn(List.of(gp));

        AssistantUserDataToolService.UserDataResult r = toolService.upcomingGamesThisWeek(userId);

        assertThat(r.factualText()).contains("no confirmed games");
    }

    @Test
    @DisplayName("upcomingGamesThisWeek skips cancelled games")
    void upcomingGamesThisWeek_SkipsCancelled() {
        UUID userId = UUID.randomUUID();
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        LocalDate monday = now.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant weekStart = monday.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant startInWeek = weekStart.plusSeconds(86400L);

        Game game = new Game();
        game.setTitle("Cancelled match");
        game.setSport(new Sport());
        game.getSport().setName("Tennis");
        game.setStartTime(startInWeek);
        game.setStatus(Game.GameStatus.CANCELLED);

        GameParticipation gp = new GameParticipation();
        gp.setGame(game);
        gp.setLeftAt(null);
        when(participationRepository.findConfirmedByUserSince(eq(userId), ArgumentMatchers.any()))
                .thenReturn(List.of(gp));

        assertThat(toolService.upcomingGamesThisWeek(userId).factualText()).contains("no confirmed games");
    }

    @Test
    @DisplayName("upcomingGamesThisWeek defaults title/sport when game metadata is missing")
    void upcomingGamesThisWeek_DefaultTitleAndSport() {
        UUID userId = UUID.randomUUID();
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        LocalDate monday = now.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant weekStart = monday.atStartOfDay(ZoneOffset.UTC).toInstant();

        Game game = new Game();
        game.setTitle(null);
        game.setSport(null);
        game.setStartTime(weekStart.plusSeconds(3600));
        game.setStatus(Game.GameStatus.SCHEDULED);
        GameParticipation gp = new GameParticipation();
        gp.setGame(game);
        gp.setLeftAt(null);
        when(participationRepository.findConfirmedByUserSince(eq(userId), ArgumentMatchers.any()))
                .thenReturn(List.of(gp));

        AssistantUserDataToolService.UserDataResult r = toolService.upcomingGamesThisWeek(userId);
        assertThat(r.factualText()).contains("- Game ()");
    }

    @Test
    @DisplayName("upcomingGamesThisWeek skips rows when game start time is missing")
    void upcomingGamesThisWeek_SkipsNullStartTime() {
        UUID userId = UUID.randomUUID();
        Game game = new Game();
        game.setTitle("No date");
        game.setSport(new Sport());
        game.getSport().setName("Soccer");
        game.setStartTime(null);
        game.setStatus(Game.GameStatus.SCHEDULED);
        GameParticipation gp = new GameParticipation();
        gp.setGame(game);
        gp.setLeftAt(null);
        when(participationRepository.findConfirmedByUserSince(eq(userId), ArgumentMatchers.any()))
                .thenReturn(List.of(gp));

        AssistantUserDataToolService.UserDataResult r = toolService.upcomingGamesThisWeek(userId);
        assertThat(r.factualText()).contains("no confirmed games");
    }

    @Test
    @DisplayName("myReliabilitySummary defaults null score and counters")
    void reliability_DefaultNullFields() {
        UUID userId = UUID.randomUUID();
        User u = User.builder().userId(userId).reliabilityScore(null).attendedCount(null).noShowCount(null).build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(u));

        AssistantUserDataToolService.UserDataResult r = toolService.myReliabilitySummary(userId);
        assertThat(r.factualText()).contains("100.0").contains("0 attended").contains("0 no-show");
    }

}
