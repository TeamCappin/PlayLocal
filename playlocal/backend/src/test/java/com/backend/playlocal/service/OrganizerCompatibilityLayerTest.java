package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.OrganizerQualityDto;
import com.backend.playlocal.model.entity.Organizer;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.OrganizerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizerCompatibilityLayerTest {

    @Mock
    private OrganizerRepository organizerRepository;

    private OrganizerCompatibilityLayer organizerCompatibilityLayer;

    @BeforeEach
    void setUp() {
        organizerCompatibilityLayer = new OrganizerCompatibilityLayer(organizerRepository);
    }

    @Test
    @DisplayName("Should resolve single user to organizer id")
    void requireOrganizerIdByUserId_whenSingleExists_shouldReturnOrganizerId() {
        UUID userId = UUID.randomUUID();
        UUID organizerId = UUID.randomUUID();
        when(organizerRepository.findByUser_UserId(userId))
                .thenReturn(Optional.of(organizer(userId, organizerId)));

        UUID resolved = organizerCompatibilityLayer.requireOrganizerIdByUserId(userId);

        assertThat(resolved).isEqualTo(organizerId);
    }

    @Test
    @DisplayName("Should throw when single user has no organizer")
    void requireOrganizerIdByUserId_whenSingleMissing_shouldThrow() {
        UUID userId = UUID.randomUUID();
        when(organizerRepository.findByUser_UserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> organizerCompatibilityLayer.requireOrganizerIdByUserId(userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Organizer not found");
    }

    @Test
    @DisplayName("Should resolve many users when every user has organizer")
    void resolveOrganizerIdsByUserIds_whenComplete_shouldResolveAll() {
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();
        UUID org1 = UUID.randomUUID();
        UUID org2 = UUID.randomUUID();

        when(organizerRepository.findByUser_UserIdIn(List.of(user1, user2)))
                .thenReturn(List.of(organizer(user1, org1), organizer(user2, org2)));

        Map<UUID, UUID> mapping = organizerCompatibilityLayer.resolveOrganizerIdsByUserIds(List.of(user1, user2));

        assertThat(mapping).hasSize(2);
        assertThat(mapping).containsEntry(user1, org1);
        assertThat(mapping).containsEntry(user2, org2);
        verify(organizerRepository, never()).findByUser_UserId(any());
    }

    @Test
    @DisplayName("Should resolve many users when only some are organizers")
    void resolveOrganizerIdsByUserIds_whenIncomplete_shouldResolveSubset() {
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();
        UUID org1 = UUID.randomUUID();

        when(organizerRepository.findByUser_UserIdIn(List.of(user1, user2)))
                .thenReturn(List.of(organizer(user1, org1)));
        when(organizerRepository.findByUser_UserId(user2)).thenReturn(Optional.empty());

        Map<UUID, UUID> mapping = organizerCompatibilityLayer.resolveOrganizerIdsByUserIds(List.of(user1, user2));

        assertThat(mapping).hasSize(1);
        assertThat(mapping).containsEntry(user1, org1);
        assertThat(mapping).doesNotContainKey(user2);
        verify(organizerRepository).findByUser_UserId(eq(user2));
    }

    @Test
    @DisplayName("Should build complete tuple response when all users resolve")
    void resolveOrganizerIdentityTuples_whenComplete_shouldReturnCompleteResponse() {
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();
        UUID org1 = UUID.randomUUID();
        UUID org2 = UUID.randomUUID();

        when(organizerRepository.findByUser_UserIdIn(List.of(user1, user2)))
                .thenReturn(List.of(organizer(user1, org1), organizer(user2, org2)));

        OrganizerQualityDto.OrganizerResolveResponse response =
                organizerCompatibilityLayer.resolveOrganizerIdentityTuples(List.of(user1, user2));

        assertThat(response.getRequestedCount()).isEqualTo(2);
        assertThat(response.getResolvedCount()).isEqualTo(2);
        assertThat(response.getMappings()).hasSize(2);
        assertThat(response.getMappings())
                .extracting(OrganizerQualityDto.OrganizerIdentityTuple::getUserId)
                .containsExactlyInAnyOrder(user1.toString(), user2.toString());
        assertThat(response.getMappings())
                .extracting(OrganizerQualityDto.OrganizerIdentityTuple::getOrganizerId)
                .containsExactlyInAnyOrder(org1.toString(), org2.toString());
    }

    @Test
    @DisplayName("Should build incomplete tuple response when some users do not resolve")
    void resolveOrganizerIdentityTuples_whenIncomplete_shouldReturnIncompleteResponse() {
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();
        UUID org1 = UUID.randomUUID();

        when(organizerRepository.findByUser_UserIdIn(List.of(user1, user2)))
                .thenReturn(List.of(organizer(user1, org1)));
        when(organizerRepository.findByUser_UserId(user2)).thenReturn(Optional.empty());

        OrganizerQualityDto.OrganizerResolveResponse response =
                organizerCompatibilityLayer.resolveOrganizerIdentityTuples(List.of(user1, user2));

        assertThat(response.getRequestedCount()).isEqualTo(2);
        assertThat(response.getResolvedCount()).isEqualTo(1);
        assertThat(response.getMappings()).hasSize(1);
        assertThat(response.getMappings().get(0).getUserId()).isEqualTo(user1.toString());
        assertThat(response.getMappings().get(0).getOrganizerId()).isEqualTo(org1.toString());
    }

    @Test
    @DisplayName("Should return empty mapping for null and empty inputs")
    void resolveOrganizerIdsByUserIds_whenNullOrEmpty_shouldReturnEmpty() {
        assertThat(organizerCompatibilityLayer.resolveOrganizerIdsByUserIds(null)).isEmpty();
        assertThat(organizerCompatibilityLayer.resolveOrganizerIdsByUserIds(List.of())).isEmpty();

        verifyNoInteractions(organizerRepository);
    }

    @Test
    @DisplayName("Should dedupe user ids and use fallback single lookups when bulk misses")
    void resolveOrganizerIdsByUserIds_whenBulkMisses_shouldUseFallbackAndDedupe() {
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();
        UUID org1 = UUID.randomUUID();

        when(organizerRepository.findByUser_UserIdIn(List.of(user1, user2))).thenReturn(List.of());
        when(organizerRepository.findByUser_UserId(user1)).thenReturn(Optional.of(organizer(user1, org1)));
        when(organizerRepository.findByUser_UserId(user2)).thenReturn(Optional.empty());

        Map<UUID, UUID> mapping =
                organizerCompatibilityLayer.resolveOrganizerIdsByUserIds(List.of(user1, user1, user2));

        assertThat(mapping).hasSize(1);
        assertThat(mapping).containsEntry(user1, org1);
        verify(organizerRepository).findByUser_UserId(eq(user1));
        verify(organizerRepository).findByUser_UserId(eq(user2));
    }

    private Organizer organizer(UUID userId, UUID organizerId) {
        return Organizer.builder()
                .organizerId(organizerId)
                .user(User.builder().userId(userId).build())
                .build();
    }
}
