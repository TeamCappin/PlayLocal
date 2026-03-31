package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.Friendship;
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

}
