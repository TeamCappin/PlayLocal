package com.backend.playlocal.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.backend.playlocal.model.dto.UserDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.GameParticipationRepository;

import lombok.RequiredArgsConstructor;

/**
 * US-32: Mutual connections and recent co-play signals.
 * Mutuals = accepted friendships only. Co-play = completed games in last 60 days where both users ATTENDED.
 */
@Service
@RequiredArgsConstructor
public class ConnectionSignalsService {

    private static final int CO_PLAY_DAYS = 60;

    private final FriendshipRepository friendshipRepository;
    private final GameParticipationRepository gameParticipationRepository;

    /**
     * Get connection signals between viewer and a single target user.
     */
    public UserDto.ConnectionSignals getSignals(UUID viewerId, UUID targetId) {
        if (viewerId.equals(targetId)) {
            return UserDto.ConnectionSignals.builder()
                    .mutualFriendCount(0)
                    .coPlayCount(0)
                    .build();
        }
        Map<String, UserDto.ConnectionSignals> map = getSignalsBatch(viewerId, List.of(targetId));
        return map.getOrDefault(targetId.toString(), UserDto.ConnectionSignals.builder()
                .mutualFriendCount(0)
                .coPlayCount(0)
                .build());
    }

    /**
     * Get connection signals between viewer and multiple target users in one go (no N+1).
     */
    public Map<String, UserDto.ConnectionSignals> getSignalsBatch(UUID viewerId, List<UUID> targetIds) {
        Set<UUID> targetSet = new HashSet<>(targetIds);
        targetSet.remove(viewerId);

        Map<String, UserDto.ConnectionSignals> result = new HashMap<>();
        for (UUID t : targetIds) {
            if (t.equals(viewerId)) {
                result.put(t.toString(), UserDto.ConnectionSignals.builder().mutualFriendCount(0).coPlayCount(0).build());
            } 
        }

        if (targetSet.isEmpty()) {
            return result;
        }

        // Mutual friends: viewer's friends + each target's friends, then intersect
        List<UUID> viewerFriendIds = friendshipRepository.findAcceptedFriendUserIds(viewerId);
        Set<UUID> viewerFriends = new HashSet<>(viewerFriendIds);

        List<UUID> allUserIds = new ArrayList<>(targetSet);
        allUserIds.add(viewerId);
        List<Object[]> friendPairs = friendshipRepository.findAcceptedFriendPairsForUserIds(allUserIds);

        // Build map: userId -> set of friend IDs
        Map<UUID, Set<UUID>> friendsByUser = new HashMap<>();
        for (UUID u : allUserIds) {
            friendsByUser.put(u, new HashSet<>());
        }
        for (Object[] row : friendPairs) {
            UUID a = (UUID) row[0];
            UUID b = (UUID) row[1];
            if (friendsByUser.containsKey(a)) {
                friendsByUser.get(a).add(b);
            }
            if (friendsByUser.containsKey(b)) {
                friendsByUser.get(b).add(a);
            }
        }

        Instant since = Instant.now().minus(CO_PLAY_DAYS, ChronoUnit.DAYS);
        List<UUID> userIdsForCoPlay = new ArrayList<>(targetSet);
        userIdsForCoPlay.add(viewerId);
        List<Object[]> attendedPairs = gameParticipationRepository.findAttendedCompletedGamePairsSince(userIdsForCoPlay, since, Game.GameStatus.COMPLETED);

        Map<UUID, Set<UUID>> gamesByUser = new HashMap<>();
        for (UUID u : userIdsForCoPlay) {
            gamesByUser.put(u, new HashSet<>());
        }
        for (Object[] row : attendedPairs) {
            UUID uid = (UUID) row[0];
            UUID gid = (UUID) row[1];
            gamesByUser.computeIfAbsent(uid, k -> new HashSet<>()).add(gid);
        }

        Set<UUID> viewerGames = gamesByUser.getOrDefault(viewerId, Set.of());

        for (UUID targetId : targetSet) {
            Set<UUID> targetFriends = new HashSet<>(friendsByUser.getOrDefault(targetId, Set.of()));
            targetFriends.retainAll(viewerFriends);
            int mutualCount = targetFriends.size();

            Set<UUID> targetGames = new HashSet<>(gamesByUser.getOrDefault(targetId, Set.of()));
            targetGames.retainAll(viewerGames);
            int coPlayCount = targetGames.size();

            result.put(targetId.toString(), UserDto.ConnectionSignals.builder()
                    .mutualFriendCount(mutualCount)
                    .coPlayCount(coPlayCount)
                    .build());
        }

        return result;
    }
}
