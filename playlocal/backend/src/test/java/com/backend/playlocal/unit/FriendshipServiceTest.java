package com.backend.playlocal.unit;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.FriendDto;
import com.backend.playlocal.model.entity.Friendship;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.FriendshipRepository;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.service.FriendshipService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for US 3.1 - Friend Request System.
 * 
 * Tests cover:
 * 1. Send friend request 
 * 2. Accept friend request 
 * 3. Decline friend request
 * 4. Remove friend/cancel request 
 * 5. Get friends list
 */
@ExtendWith(MockitoExtension.class)
class FriendshipServiceTest {

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FriendshipService friendshipService;

    private User requester;
    private User addressee;
    private User thirdUser;
    private UUID requesterId;
    private UUID addresseeId;
    private UUID thirdUserId;
    private UUID friendshipId;
    private Friendship pendingFriendship;
    private Friendship acceptedFriendship;

    @BeforeEach
    void setUp() {
        requesterId = UUID.randomUUID();
        addresseeId = UUID.randomUUID();
        thirdUserId = UUID.randomUUID();
        friendshipId = UUID.randomUUID();

        requester = User.builder()
                .userId(requesterId)
                .email("requester@example.com")
                .displayName("Requester User")
                .slug("requester-user")
                .status(User.UserStatus.ACTIVE)
                .reliabilityScore(85.0f)
                .gamesCount(10)
                .bio("Test bio")
                .location("Test Location")
                .build();

        addressee = User.builder()
                .userId(addresseeId)
                .email("addressee@example.com")
                .displayName("Addressee User")
                .slug("addressee-user")
                .status(User.UserStatus.ACTIVE)
                .reliabilityScore(90.0f)
                .gamesCount(15)
                .bio("Addressee bio")
                .location("Addressee Location")
                .build();

        thirdUser = User.builder()
                .userId(thirdUserId)
                .email("third@example.com")
                .displayName("Third User")
                .slug("third-user")
                .status(User.UserStatus.ACTIVE)
                .build();

        // Determine low/high for canonical ordering (lexicographic to match PostgreSQL)
        String requesterStr = requesterId.toString();
        String addresseeStr = addresseeId.toString();
        boolean requesterIsLow = requesterStr.compareTo(addresseeStr) < 0;
        UUID lowId = requesterIsLow ? requesterId : addresseeId;
        UUID highId = requesterIsLow ? addresseeId : requesterId;
        User userLow = requesterIsLow ? requester : addressee;
        User userHigh = requesterIsLow ? addressee : requester;

        pendingFriendship = Friendship.builder()
                .friendshipId(friendshipId)
                .requester(requester)
                .addressee(addressee)
                .userLow(userLow)
                .userHigh(userHigh)
                .status(Friendship.FriendshipStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        acceptedFriendship = Friendship.builder()
                .friendshipId(friendshipId)
                .requester(requester)
                .addressee(addressee)
                .userLow(userLow)
                .userHigh(userHigh)
                .status(Friendship.FriendshipStatus.ACCEPTED)
                .createdAt(Instant.now().minusSeconds(3600))
                .respondedAt(Instant.now().minusSeconds(3500))
                .build();
    }

    // ==========================================
    // SEND FRIEND REQUEST TESTS
    // ==========================================

    @Test
    @DisplayName("US-31: sendFriendRequest with valid users succeeds")
    void sendFriendRequest_WithValidUsers_Success() {
        // Given
        when(userRepository.findActiveById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findActiveById(addresseeId)).thenReturn(Optional.of(addressee));
        
        // Use lexicographic comparison to match PostgreSQL and the service implementation
        String requesterStr = requesterId.toString();
        String addresseeStr = addresseeId.toString();
        boolean requesterIsLow = requesterStr.compareTo(addresseeStr) < 0;
        UUID lowId = requesterIsLow ? requesterId : addresseeId;
        UUID highId = requesterIsLow ? addresseeId : requesterId;
        
        when(friendshipRepository.findByUserPair(any(UUID.class), any(UUID.class)))
                .thenReturn(Optional.empty()); // No existing friendship
        
        when(friendshipRepository.save(any(Friendship.class))).thenAnswer(invocation -> {
            Friendship f = invocation.getArgument(0);
            f.setFriendshipId(UUID.randomUUID());
            return f;
        });

        // When
        FriendDto.FriendshipAction response = friendshipService.sendFriendRequest(
                requesterId.toString(),
                addresseeId.toString()
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getMessage()).isEqualTo("Friend request sent");
        assertThat(response.getFriendshipId()).isNotNull();
        verify(friendshipRepository).save(any(Friendship.class));
    }

    @Test
    @DisplayName("US-31: sendFriendRequest to self throws exception")
    void sendFriendRequest_ToSelf_ThrowsException() {
        // When/Then
        assertThatThrownBy(() -> friendshipService.sendFriendRequest(
                requesterId.toString(),
                requesterId.toString()
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot send friend request to yourself");
        
        verify(userRepository, never()).findActiveById(any());
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-31: sendFriendRequest with duplicate request throws exception")
    void sendFriendRequest_DuplicateRequest_ThrowsException() {
        // Given
        when(userRepository.findActiveById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findActiveById(addresseeId)).thenReturn(Optional.of(addressee));
        
        // Use lexicographic comparison to match PostgreSQL and the service implementation
        String requesterStr = requesterId.toString();
        String addresseeStr = addresseeId.toString();
        boolean requesterIsLow = requesterStr.compareTo(addresseeStr) < 0;
        UUID lowId = requesterIsLow ? requesterId : addresseeId;
        UUID highId = requesterIsLow ? addresseeId : requesterId;
        
        when(friendshipRepository.findByUserPair(any(UUID.class), any(UUID.class)))
                .thenReturn(Optional.of(pendingFriendship)); // Existing friendship

        // When/Then
        assertThatThrownBy(() -> friendshipService.sendFriendRequest(
                requesterId.toString(),
                addresseeId.toString()
        ))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Friend request already exists between these users");
        
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-31: sendFriendRequest with non-existent requester throws exception")
    void sendFriendRequest_RequesterNotFound_ThrowsException() {
        // Given
        when(userRepository.findActiveById(requesterId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> friendshipService.sendFriendRequest(
                requesterId.toString(),
                addresseeId.toString()
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
        
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-31: sendFriendRequest with non-existent addressee throws exception")
    void sendFriendRequest_AddresseeNotFound_ThrowsException() {
        // Given
        when(userRepository.findActiveById(requesterId)).thenReturn(Optional.of(requester));
        when(userRepository.findActiveById(addresseeId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> friendshipService.sendFriendRequest(
                requesterId.toString(),
                addresseeId.toString()
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
        
        verify(friendshipRepository, never()).save(any());
    }

    // ==========================================
    // ACCEPT FRIEND REQUEST TESTS
    // ==========================================

    @Test
    @DisplayName("US-31: acceptFriendRequest with valid request succeeds")
    void acceptFriendRequest_ValidRequest_Success() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(pendingFriendship));
        when(friendshipRepository.save(any(Friendship.class))).thenReturn(acceptedFriendship);

        // When
        FriendDto.FriendshipAction response = friendshipService.acceptFriendRequest(
                addresseeId.toString(),
                friendshipId.toString()
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("ACCEPTED");
        assertThat(response.getMessage()).isEqualTo("Friend request accepted");
        assertThat(response.getFriendshipId()).isEqualTo(friendshipId.toString());
        assertThat(pendingFriendship.getStatus()).isEqualTo(Friendship.FriendshipStatus.ACCEPTED);
        assertThat(pendingFriendship.getRespondedAt()).isNotNull();
        verify(friendshipRepository).save(pendingFriendship);
    }

    @Test
    @DisplayName("US-31: acceptFriendRequest by non-addressee throws exception")
    void acceptFriendRequest_NotAddressee_ThrowsException() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(pendingFriendship));

        // When/Then
        assertThatThrownBy(() -> friendshipService.acceptFriendRequest(
                requesterId.toString(), // Requester trying to accept
                friendshipId.toString()
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("You cannot accept this request");
        
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-31: acceptFriendRequest with non-pending status throws exception")
    void acceptFriendRequest_NotPending_ThrowsException() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(acceptedFriendship));

        // When/Then
        assertThatThrownBy(() -> friendshipService.acceptFriendRequest(
                addresseeId.toString(),
                friendshipId.toString()
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Request is not pending");
        
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-31: acceptFriendRequest with non-existent friendship throws exception")
    void acceptFriendRequest_NotFound_ThrowsException() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> friendshipService.acceptFriendRequest(
                addresseeId.toString(),
                friendshipId.toString()
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Friend request not found");
        
        verify(friendshipRepository, never()).save(any());
    }

    // ==========================================
    // DECLINE FRIEND REQUEST TESTS
    // ==========================================

    @Test
    @DisplayName("US-31: declineFriendRequest with valid request succeeds")
    void declineFriendRequest_ValidRequest_Success() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(pendingFriendship));
        when(friendshipRepository.save(any(Friendship.class))).thenReturn(pendingFriendship);

        // When
        FriendDto.FriendshipAction response = friendshipService.declineFriendRequest(
                addresseeId.toString(),
                friendshipId.toString()
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("DECLINED");
        assertThat(response.getMessage()).isEqualTo("Friend request declined");
        assertThat(response.getFriendshipId()).isEqualTo(friendshipId.toString());
        assertThat(pendingFriendship.getStatus()).isEqualTo(Friendship.FriendshipStatus.DECLINED);
        assertThat(pendingFriendship.getRespondedAt()).isNotNull();
        verify(friendshipRepository).save(pendingFriendship);
    }

    @Test
    @DisplayName("US-31: declineFriendRequest by non-addressee throws exception")
    void declineFriendRequest_NotAddressee_ThrowsException() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(pendingFriendship));

        // When/Then
        assertThatThrownBy(() -> friendshipService.declineFriendRequest(
                requesterId.toString(), // Requester trying to decline
                friendshipId.toString()
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("You cannot decline this request");
        
        verify(friendshipRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-31: declineFriendRequest with non-existent friendship throws exception")
    void declineFriendRequest_NotFound_ThrowsException() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> friendshipService.declineFriendRequest(
                addresseeId.toString(),
                friendshipId.toString()
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Friend request not found");
        
        verify(friendshipRepository, never()).save(any());
    }

    // ==========================================
    // REMOVE FRIEND TESTS
    // ==========================================

    @Test
    @DisplayName("US-31: removeFriend as requester succeeds")
    void removeFriend_AsRequester_Success() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(acceptedFriendship));
        doNothing().when(friendshipRepository).delete(acceptedFriendship);

        // When
        FriendDto.FriendshipAction response = friendshipService.removeFriend(
                requesterId.toString(),
                friendshipId.toString()
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("REMOVED");
        assertThat(response.getMessage()).isEqualTo("Friendship removed");
        assertThat(response.getFriendshipId()).isEqualTo(friendshipId.toString());
        verify(friendshipRepository).delete(acceptedFriendship);
    }

    @Test
    @DisplayName("US-31: removeFriend as addressee succeeds")
    void removeFriend_AsAddressee_Success() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(acceptedFriendship));
        doNothing().when(friendshipRepository).delete(acceptedFriendship);

        // When
        FriendDto.FriendshipAction response = friendshipService.removeFriend(
                addresseeId.toString(),
                friendshipId.toString()
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("REMOVED");
        assertThat(response.getMessage()).isEqualTo("Friendship removed");
        verify(friendshipRepository).delete(acceptedFriendship);
    }

    @Test
    @DisplayName("US-31: removeFriend can cancel pending request")
    void removeFriend_CancelPendingRequest_Success() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(pendingFriendship));
        doNothing().when(friendshipRepository).delete(pendingFriendship);

        // When
        FriendDto.FriendshipAction response = friendshipService.removeFriend(
                requesterId.toString(), // Requester canceling
                friendshipId.toString()
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("REMOVED");
        verify(friendshipRepository).delete(pendingFriendship);
    }

    @Test
    @DisplayName("US-31: removeFriend by non-participant throws exception")
    void removeFriend_NotPartOfFriendship_ThrowsException() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.of(acceptedFriendship));

        // When/Then
        assertThatThrownBy(() -> friendshipService.removeFriend(
                thirdUserId.toString(), // Third user not part of friendship
                friendshipId.toString()
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("You are not part of this friendship");
        
        verify(friendshipRepository, never()).delete(any());
    }

    @Test
    @DisplayName("US-31: removeFriend with non-existent friendship throws exception")
    void removeFriend_NotFound_ThrowsException() {
        // Given
        when(friendshipRepository.findById(friendshipId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> friendshipService.removeFriend(
                requesterId.toString(),
                friendshipId.toString()
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Friendship not found");
        
        verify(friendshipRepository, never()).delete(any());
    }

    // ==========================================
    // GET FRIENDS LIST TESTS
    // ==========================================

    @Test
    @DisplayName("US-31: getFriendsList returns all relationships")
    void getFriendsList_ReturnsAllRelationships() {
        // Given
        List<Friendship> acceptedFriendships = List.of(acceptedFriendship);
        List<Friendship> pendingReceived = List.of(pendingFriendship);
        List<Friendship> pendingSent = new ArrayList<>();

        when(friendshipRepository.findAcceptedFriendships(requesterId))
                .thenReturn(acceptedFriendships);
        when(friendshipRepository.findPendingRequestsReceived(requesterId))
                .thenReturn(pendingReceived);
        when(friendshipRepository.findPendingRequestsSent(requesterId))
                .thenReturn(pendingSent);

        // When
        FriendDto.FriendsListResponse response = friendshipService.getFriendsList(
                requesterId.toString()
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getFriends()).hasSize(1);
        assertThat(response.getPendingReceived()).hasSize(1);
        assertThat(response.getPendingSent()).isEmpty();
        
        FriendDto.FriendInfo friendInfo = response.getFriends().get(0);
        assertThat(friendInfo.getFriendUserId()).isEqualTo(addresseeId.toString());
        assertThat(friendInfo.getStatus()).isEqualTo("ACCEPTED");
        
        FriendDto.FriendInfo pendingInfo = response.getPendingReceived().get(0);
        assertThat(pendingInfo.getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("US-31: getFriendsList with empty relationships returns empty lists")
    void getFriendsList_EmptyRelationships_ReturnsEmptyLists() {
        // Given
        when(friendshipRepository.findAcceptedFriendships(requesterId))
                .thenReturn(new ArrayList<>());
        when(friendshipRepository.findPendingRequestsReceived(requesterId))
                .thenReturn(new ArrayList<>());
        when(friendshipRepository.findPendingRequestsSent(requesterId))
                .thenReturn(new ArrayList<>());

        // When
        FriendDto.FriendsListResponse response = friendshipService.getFriendsList(
                requesterId.toString()
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getFriends()).isEmpty();
        assertThat(response.getPendingReceived()).isEmpty();
        assertThat(response.getPendingSent()).isEmpty();
    }

    @Test
    @DisplayName("US-31: getFriendsList correctly maps friend info")
    void getFriendsList_CorrectlyMapsFriendInfo() {
        // Given
        when(friendshipRepository.findAcceptedFriendships(requesterId))
                .thenReturn(List.of(acceptedFriendship));
        when(friendshipRepository.findPendingRequestsReceived(requesterId))
                .thenReturn(new ArrayList<>());
        when(friendshipRepository.findPendingRequestsSent(requesterId))
                .thenReturn(new ArrayList<>());

        // When
        FriendDto.FriendsListResponse response = friendshipService.getFriendsList(
                requesterId.toString()
        );

        // Then
        FriendDto.FriendInfo friendInfo = response.getFriends().get(0);
        assertThat(friendInfo.getFriendUserId()).isEqualTo(addresseeId.toString());
        assertThat(friendInfo.getDisplayName()).isEqualTo(addressee.getDisplayName());
        assertThat(friendInfo.getBio()).isEqualTo(addressee.getBio());
        assertThat(friendInfo.getLocation()).isEqualTo(addressee.getLocation());
        assertThat(friendInfo.getReliabilityScore()).isEqualTo(addressee.getReliabilityScore());
        assertThat(friendInfo.getGamesCount()).isEqualTo(addressee.getGamesCount());
        assertThat(friendInfo.getStatus()).isEqualTo("ACCEPTED");
    }
}
