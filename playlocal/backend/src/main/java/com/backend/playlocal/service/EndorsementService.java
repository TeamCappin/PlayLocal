package com.backend.playlocal.service;

import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.EndorsementDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EndorsementService {

    private final EndorsementRepository endorsementRepository;
    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final GameParticipationRepository participationRepository;

    public EndorsementService(EndorsementRepository endorsementRepository,
                              GameRepository gameRepository,
                              UserRepository userRepository,
                              GameParticipationRepository participationRepository) {
        this.endorsementRepository = endorsementRepository;
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.participationRepository = participationRepository;
    }

    // US 3.3 Organizer Endorsements
    @Transactional
    public EndorsementDto.Response createEndorsement(UUID endorserId, EndorsementDto.CreateRequest request) {
        User endorser = userRepository.findActiveById(endorserId)
                .orElseThrow(() -> new ResourceNotFoundException("Endorser not found"));

        User endorsedUser = userRepository.findActiveById(request.getEndorsedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Endorsed user not found"));

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        // 1. Validate requester is the Organizer
        if (!game.getCreatedBy().getUserId().equals(endorserId)) {
            throw new AccessDeniedException("Only the game organizer can endorse players.");
        }

        // 2. Validate endorsed user attended
        GameParticipation participation = participationRepository.findByGameAndUser(game.getGameId(), endorsedUser.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User did not participate in this game"));

        if (participation.getAttendanceStatus() != GameParticipation.AttendanceStatus.ATTENDED) {
            throw new IllegalArgumentException("User must have attended the game to be endorsed.");
        }

        // 3. Validate uniqueness
        if (endorsementRepository.existsByEndorserAndEndorsedUserAndGame(endorser, endorsedUser, game)) {
            throw new DuplicateResourceException("User already endorsed for this game.");
        }

        Endorsement endorsement = Endorsement.builder()
                .endorser(endorser)
                .endorsedUser(endorsedUser)
                .game(game)
                .label("Organizer's Pick")
                .build();

        endorsement = endorsementRepository.save(endorsement);

        return mapToResponse(endorsement);
    }

    // US 3.3 Organizer Endorsements
    public List<EndorsementDto.Response> getUserEndorsements(UUID userId) {
        return endorsementRepository.findByEndorsedUser_UserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private EndorsementDto.Response mapToResponse(Endorsement e) {
        return EndorsementDto.Response.builder()
                .endorsementId(e.getEndorsementId())
                .endorserId(e.getEndorser().getUserId())
                .endorserName(e.getEndorser().getDisplayName())
                .endorsedUserId(e.getEndorsedUser().getUserId())
                .gameId(e.getGame().getGameId())
                .gameTitle(e.getGame().getTitle())
                .gameDate(e.getGame().getStartTime())
                .label(e.getLabel())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
