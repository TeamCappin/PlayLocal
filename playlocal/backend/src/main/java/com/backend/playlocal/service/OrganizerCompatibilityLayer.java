package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.OrganizerQualityDto;
import com.backend.playlocal.model.entity.Organizer;
import com.backend.playlocal.repository.OrganizerRepository;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Shared compatibility adapter for organizer/user ID resolution.
 *
 * This is the single place where userId <-> organizerId mapping logic lives.
 */
@Service
public class OrganizerCompatibilityLayer {

    private final OrganizerRepository organizerRepository;

    public OrganizerCompatibilityLayer(OrganizerRepository organizerRepository) {
        this.organizerRepository = organizerRepository;
    }

    public UUID requireOrganizerIdByUserId(UUID userId) {
        return findOrganizerIdByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));
    }

    public java.util.Optional<UUID> findOrganizerIdByUserId(UUID userId) {
        return organizerRepository.findByUser_UserId(userId).map(Organizer::getOrganizerId);
    }

    public Map<UUID, UUID> resolveOrganizerIdsByUserIds(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<UUID> dedupedIds = userIds.stream().distinct().collect(Collectors.toList());

        Map<UUID, UUID> mapping = new LinkedHashMap<>();
        for (Organizer organizer : organizerRepository.findByUser_UserIdIn(dedupedIds)) {
            if (organizer.getUser() != null && organizer.getUser().getUserId() != null) {
                mapping.put(organizer.getUser().getUserId(), organizer.getOrganizerId());
            }
        }

        // Compatibility fallback for environments/mocks where bulk method is not stubbed.
        for (UUID userId : dedupedIds) {
            if (!mapping.containsKey(userId)) {
                findOrganizerIdByUserId(userId).ifPresent(organizerId -> mapping.put(userId, organizerId));
            }
        }

        return mapping;
    }

    public OrganizerQualityDto.OrganizerResolveResponse resolveOrganizerIdentityTuples(Collection<UUID> userIds) {
        Map<UUID, UUID> mapping = resolveOrganizerIdsByUserIds(userIds);

        List<OrganizerQualityDto.OrganizerIdentityTuple> tuples = mapping.entrySet().stream()
                .map(entry -> OrganizerQualityDto.OrganizerIdentityTuple.builder()
                        .userId(entry.getKey().toString())
                        .organizerId(entry.getValue().toString())
                        .build())
                .collect(Collectors.toList());

        int requested = userIds == null ? 0 : userIds.size();
        return OrganizerQualityDto.OrganizerResolveResponse.builder()
                .requestedCount(requested)
                .resolvedCount(tuples.size())
                .mappings(tuples)
                .build();
    }
}
