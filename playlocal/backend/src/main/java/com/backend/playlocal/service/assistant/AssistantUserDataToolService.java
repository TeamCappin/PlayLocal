package com.backend.playlocal.service.assistant;

import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Whitelisted read-only lookups scoped strictly to {@code authenticatedUserId}.
 * No parameters from the user message are trusted for targeting other accounts.
 */
@Service
public class AssistantUserDataToolService {

    private final GameParticipationRepository participationRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    public AssistantUserDataToolService(
            GameParticipationRepository participationRepository,
            FriendshipRepository friendshipRepository,
            UserRepository userRepository) {
        this.participationRepository = participationRepository;
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    public enum ToolName {
        UPCOMING_GAMES_THIS_WEEK,
        PENDING_FRIEND_REQUESTS,
        MY_RELIABILITY_SUMMARY
    }

    @Transactional(readOnly = true)
    public UserDataResult upcomingGamesThisWeek(UUID authenticatedUserId) {
        Objects.requireNonNull(authenticatedUserId, "userId");
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        LocalDate today = now.toLocalDate();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant weekStart = monday.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant weekEndExclusive = monday.plusWeeks(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<GameParticipation> rows =
                participationRepository.findConfirmedByUserSince(authenticatedUserId, weekStart);
        List<String> lines = new ArrayList<>();
        for (GameParticipation gp : rows) {
            if (gp.getLeftAt() != null) {
                continue;
            }
            Game g = gp.getGame();
            if (g == null || g.getStatus() == Game.GameStatus.CANCELLED) {
                continue;
            }
            Instant st = g.getStartTime();
            if (st == null || st.isBefore(weekStart) || !st.isBefore(weekEndExclusive)) {
                continue;
            }
            String title = g.getTitle() != null ? g.getTitle() : "Game";
            String sport = g.getSport() != null && g.getSport().getName() != null
                    ? g.getSport().getName()
                    : "";
            lines.add(String.format(
                    "- %s (%s) — %s UTC, status %s",
                    title,
                    sport,
                    st.toString(),
                    g.getStatus()));
        }
        String body;
        if (lines.isEmpty()) {
            body = "You have no confirmed games scheduled this calendar week (UTC Monday–Sunday) "
                    + "with a non-cancelled game.";
        } else {
            body = "Your confirmed games this calendar week (UTC):\n"
                    + lines.stream().collect(Collectors.joining("\n"));
        }
        return new UserDataResult(ToolName.UPCOMING_GAMES_THIS_WEEK, body);
    }

    @Transactional(readOnly = true)
    public UserDataResult pendingFriendRequests(UUID authenticatedUserId) {
        Objects.requireNonNull(authenticatedUserId, "userId");
        int received = friendshipRepository.findPendingRequestsReceived(authenticatedUserId).size();
        int sent = friendshipRepository.findPendingRequestsSent(authenticatedUserId).size();
        String body = String.format(
                "You have %d pending friend request(s) waiting for you to respond, "
                        + "and %d request(s) you sent that are still pending.",
                received,
                sent);
        return new UserDataResult(ToolName.PENDING_FRIEND_REQUESTS, body);
    }

    @Transactional(readOnly = true)
    public UserDataResult myReliabilitySummary(UUID authenticatedUserId) {
        Objects.requireNonNull(authenticatedUserId, "userId");
        User u = userRepository.findById(authenticatedUserId).orElse(null);
        if (u == null) {
            return new UserDataResult(
                    ToolName.MY_RELIABILITY_SUMMARY, "Your profile could not be loaded.");
        }
        Float score = u.getReliabilityScore() != null ? u.getReliabilityScore() : 100.0f;
        int attended = u.getAttendedCount() != null ? u.getAttendedCount() : 0;
        int noShow = u.getNoShowCount() != null ? u.getNoShowCount() : 0;
        String body = String.format(
                "Your current reliability score is %.1f (based on attended vs no-show history). "
                        + "Recorded games: %d attended, %d no-show(s). "
                        + "Organizers confirm attendance after games complete.",
                score,
                attended,
                noShow);
        return new UserDataResult(ToolName.MY_RELIABILITY_SUMMARY, body);
    }

    public record UserDataResult(ToolName tool, String factualText) {
    }
}
