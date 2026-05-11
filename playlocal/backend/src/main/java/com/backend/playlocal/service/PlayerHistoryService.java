package com.backend.playlocal.service;

import com.backend.playlocal.repository.GameParticipationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PlayerHistoryService {

    private final GameParticipationRepository participationRepository;

    public PlayerHistoryService(GameParticipationRepository participationRepository) {
        this.participationRepository = participationRepository;
    }

    /**
     * US-6.2.2: Find confirmed attendees who have attended other completed games
     * not hosted by the same organizer.
     */
    @Transactional(readOnly = true)
    public List<UUID> getNonFirstTimePlayers(UUID gameId, UUID organizerUserId) {
        List<UUID> confirmedAttendees = participationRepository.getConfirmedAttendees(gameId, organizerUserId);
        if (confirmedAttendees.isEmpty()) {
            return List.of();
        }

        return participationRepository.getAttendanceHistoryForPlayers(
                confirmedAttendees,
                gameId,
                organizerUserId);
    }
}
