package com.backend.playlocal.service;

import com.backend.playlocal.exception.CapacityExceededException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameService {

        private final GameRepository gameRepository;
        private final GameParticipationRepository participationRepository;
        private final UserRepository userRepository;
        private final SportRepository sportRepository;
        private final GameVisibilityRepository gameVisibilityRepository;
        private final EndorsementRepository endorsementRepository;
        private final GameTagRepository tagRepository;
        private final GameTagAssignmentRepository tagAssignmentRepository;
        private final GameTagConfirmationRepository tagConfirmationRepository;

        public GameService(GameRepository gameRepository, GameParticipationRepository participationRepository,
                        UserRepository userRepository, SportRepository sportRepository,
                        GameVisibilityRepository gameVisibilityRepository,
                        EndorsementRepository endorsementRepository, GameTagRepository tagRepository,
                        GameTagAssignmentRepository tagAssignmentRepository,
                        GameTagConfirmationRepository tagConfirmationRepository) {
                this.gameRepository = gameRepository;
                this.participationRepository = participationRepository;
                this.userRepository = userRepository;
                this.sportRepository = sportRepository;
                this.gameVisibilityRepository = gameVisibilityRepository;
                this.endorsementRepository = endorsementRepository;
                this.tagRepository = tagRepository;
                this.tagAssignmentRepository = tagAssignmentRepository;
                this.tagConfirmationRepository = tagConfirmationRepository;
        }

        /**
         * Create a new game. US-2.1
         */
        @Transactional
        public GameDto.GameResponse createGame(GameDto.CreateRequest request, UUID organizerId) {
                User organizer = userRepository.findActiveById(organizerId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                Sport sport = sportRepository.findByNameIgnoreCase(request.getSportName())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Sport not found: " + request.getSportName()));

                // Get default visibility (public)
                GameVisibility visibility = gameVisibilityRepository.findByCode("public")
                                .orElseThrow(() -> new ResourceNotFoundException("Default visibility not found"));

                // Create location
                Location location = Location.builder()
                                .name(request.getLocationName())
                                .addressLine(request.getAddressLine())
                                .city(request.getCity())
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .build();

                // Create game
                Game game = Game.builder()
                                .createdBy(organizer)
                                .sport(sport)
                                .location(location)
                                .visibility(visibility)
                                .title(request.getTitle())
                                .description(request.getDescription())
                                .indoorOutdoor(request.getIndoorOutdoor())
                                .intensityBand(request.getIntensityBand())
                                .skillBand(request.getSkillBand())
                                .minPlayers(request.getMinPlayers() != null ? request.getMinPlayers() : 2)
                                .maxPlayers(request.getMaxPlayers() != null ? request.getMaxPlayers() : 20)
                                .allowWaitlist(request.getAllowWaitlist() != null ? request.getAllowWaitlist() : true)
                                .minReliabilityRequired(request.getMinReliabilityRequired())
                                .minAge(request.getMinAge())
                                .maxAge(request.getMaxAge())
                                .startTime(request.getStartTime())
                                .endTime(request.getEndTime())
                                .build();

                game = gameRepository.save(game);

                // US-4.2: Assign tags if provided
                if (request.getTagNames() != null && !request.getTagNames().isEmpty()) {
                        assignTagsToGame(game, request.getTagNames());
                }

                // Auto-add organizer as first participant with ORGANIZER role
                GameParticipation organizerParticipation = GameParticipation.builder()
                                .game(game)
                                .user(organizer)
                                .sport(sport)
                                .participationRole(GameParticipation.ParticipationRole.ORGANIZER)
                                .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                .build();
                participationRepository.save(organizerParticipation);

                return mapToGameResponse(game, organizerId);
        }

        /**
         * Get game by ID. US-2.4
         */
        public GameDto.GameResponse getGameById(UUID gameId, UUID userId) {
                Game game = gameRepository.findById(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));
                return mapToGameResponse(game, userId);
        }

        /**
         * Get upcoming games. US-2.3
         */
        public List<GameDto.GameResponse> getUpcomingGames(UUID userId) {
                return gameRepository.findUpcomingGames(Instant.now()).stream()
                                .map(game -> mapToGameResponse(game, userId))
                                .collect(Collectors.toList());
        }

        /**
         * Get game participation based on userId and gameId. US-2.6
         */
        public GameDto.ParticipantDto getGameParticipation(UUID gameId, UUID userId) {
                GameParticipation p = participationRepository.findByGameAndUser(gameId, userId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game Participation not found"));

                return mapToParticipantDto(p);
        }

        /**
         * Get past games of the user for which join status has been confirmed and game
         * not cancelled.
         * US-2.6
         */
        public List<GameDto.GameResponse> getPastGames(UUID userId) {
                return gameRepository.findPastGames(userId, Instant.now()).stream()
                                .map(game -> mapToGameResponse(game, userId))
                                .collect(Collectors.toList());
        }

        /**
         * Get past games created by user for which the rsvp roster needs to be updated.
         * US-2.6
         */
        public List<GameDto.GameResponse> getPastGamesForUserNeedingAttendanceUpdate(UUID userId) {
                return gameRepository.findPastGamesForUserNeedingAttendanceUpdate(userId, Instant.now()).stream()
                                .map(game -> mapToGameResponse(game, userId))
                                .collect(Collectors.toList());
        }

        /**
         * Backward-compatible join game without tag confirmations.
         * For games without restricted tags. US-2.5
         */
        @Transactional
        public GameDto.JoinResponse joinGame(UUID gameId, UUID userId) {
                return joinGame(gameId, userId, null);
        }

        /**
         * CRITICAL: Concurrency-safe join. US-2.5, US-4.2
         * Uses SELECT FOR UPDATE to prevent overbooking.
         * Validates community tags and age requirements.
         */
        @Transactional
        public GameDto.JoinResponse joinGame(UUID gameId, UUID userId, GameDto.JoinRequest joinRequest) {
                User user = userRepository.findActiveById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                // Lock the game to prevent race conditions
                Game game = gameRepository.findByIdWithLock(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

                // Check game status
                if (game.getStatus() != Game.GameStatus.SCHEDULED) {
                        throw new IllegalStateException("Cannot join a game that is not scheduled");
                }

                // US-4.2: Validate age requirements
                validateAgeRequirements(game, user);

                // US-4.2: Validate and record tag confirmations for restricted tags
                validateAndRecordTagConfirmations(game, user, joinRequest);

                // Check reliability requirement
                if (game.getMinReliabilityRequired() != null
                                && user.getReliabilityScore() < game.getMinReliabilityRequired()) {
                        throw new AccessDeniedException(
                                        "Minimum reliability score required: " + game.getMinReliabilityRequired());
                }

                // Check for existing participation (idempotent - one per user per game)
                Optional<GameParticipation> existing = participationRepository.findByGameAndUser(gameId, userId);
                if (existing.isPresent()) {
                        GameParticipation participation = existing.get();
                        if (participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED ||
                                        participation.getJoinStatus() == GameParticipation.JoinStatus.WAITLISTED) {
                                // Already joined - return current status (idempotent)
                                return GameDto.JoinResponse.builder()
                                                .participationId(participation.getParticipationId().toString())
                                                .joinStatus(participation.getJoinStatus().name())
                                                .waitlistPosition(participation.getWaitlistPosition())
                                                .message("Already joined this game")
                                                .build();
                        }
                        // User previously cancelled - allow re-join
                        // Must check capacity to determine CONFIRMED vs WAITLISTED
                        int confirmedCount = participationRepository.countConfirmedParticipants(gameId);

                        if (confirmedCount < game.getMaxPlayers()) {
                                // Capacity available - rejoin as CONFIRMED
                                participation.setJoinStatus(GameParticipation.JoinStatus.CONFIRMED);
                                participation.setWaitlistPosition(null);
                        } else if (game.getAllowWaitlist()) {
                                // Game full - rejoin to waitlist
                                int nextPosition = participationRepository.getNextWaitlistPosition(gameId);
                                participation.setJoinStatus(GameParticipation.JoinStatus.WAITLISTED);
                                participation.setWaitlistPosition(nextPosition);
                        } else {
                                throw new CapacityExceededException("Game is full and waitlist is not enabled");
                        }

                        participation.setLeftAt(null);
                        participation.setJoinedAt(Instant.now());
                        participation = participationRepository.save(participation);

                        // Return immediately - don't fall through to create new participation
                        return GameDto.JoinResponse.builder()
                                        .participationId(participation.getParticipationId().toString())
                                        .joinStatus(participation.getJoinStatus().name())
                                        .waitlistPosition(participation.getWaitlistPosition())
                                        .message(participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED
                                                        ? "Successfully rejoined the game"
                                                        : "Rejoined waitlist at position "
                                                                        + participation.getWaitlistPosition())
                                        .build();
                }

                // Count current confirmed participants
                int confirmedCount = participationRepository.countConfirmedParticipants(gameId);

                GameParticipation participation;
                if (confirmedCount < game.getMaxPlayers()) {
                        // Direct join
                        participation = GameParticipation.builder()
                                        .game(game)
                                        .user(user)
                                        .sport(game.getSport())
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .joinStatus(GameParticipation.JoinStatus.CONFIRMED)
                                        .build();
                } else if (game.getAllowWaitlist()) {
                        // Add to waitlist
                        int nextPosition = participationRepository.getNextWaitlistPosition(gameId);
                        participation = GameParticipation.builder()
                                        .game(game)
                                        .user(user)
                                        .sport(game.getSport())
                                        .participationRole(GameParticipation.ParticipationRole.PARTICIPANT)
                                        .joinStatus(GameParticipation.JoinStatus.WAITLISTED)
                                        .waitlistPosition(nextPosition)
                                        .build();
                } else {
                        throw new CapacityExceededException("Game is full and waitlist is not enabled");
                }

                participation = participationRepository.save(participation);

                return GameDto.JoinResponse.builder()
                                .participationId(participation.getParticipationId().toString())
                                .joinStatus(participation.getJoinStatus().name())
                                .waitlistPosition(participation.getWaitlistPosition())
                                .message(participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED
                                                ? "Successfully joined the game"
                                                : "Added to waitlist at position "
                                                                + participation.getWaitlistPosition())
                                .build();
        }

        /**
         * Leave a game. US-2.5
         * Promotes first waitlisted user if applicable.
         */
        @Transactional
        public void leaveGame(UUID gameId, UUID userId) {
                GameParticipation participation = participationRepository.findByGameAndUser(gameId, userId)
                                .orElseThrow(() -> new ResourceNotFoundException("Participation not found"));

                if (participation.getParticipationRole() == GameParticipation.ParticipationRole.ORGANIZER) {
                        throw new IllegalStateException(
                                        "Organizer cannot leave their own game. Cancel the game instead.");
                }

                boolean wasConfirmed = participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED;
                int oldWaitlistPosition = participation.getWaitlistPosition() != null
                                ? participation.getWaitlistPosition()
                                : 0;

                // Mark as cancelled
                participation.setJoinStatus(GameParticipation.JoinStatus.CANCELLED);
                participation.setLeftAt(Instant.now());
                participation.setWaitlistPosition(null);
                participationRepository.save(participation);

                // If user was confirmed, promote first waitlisted user
                if (wasConfirmed) {
                        List<GameParticipation> waitlisted = participationRepository.findFirstWaitlisted(gameId);
                        if (!waitlisted.isEmpty()) {
                                GameParticipation promoted = waitlisted.get(0);
                                promoted.setJoinStatus(GameParticipation.JoinStatus.CONFIRMED);
                                promoted.setWaitlistPosition(null);
                                participationRepository.save(promoted);

                                // Decrement remaining waitlist positions
                                participationRepository.decrementWaitlistPositionsAfter(gameId, 1);
                        }
                } else if (oldWaitlistPosition > 0) {
                        // User was waitlisted - adjust positions
                        participationRepository.decrementWaitlistPositionsAfter(gameId, oldWaitlistPosition);
                }
        }

        /**
         * Get game roster. US-2.4
         */
        public GameDto.RosterResponse getRoster(UUID gameId) {
                Game game = gameRepository.findById(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

                // Fetch endorsements by organizer
                List<Endorsement> endorsements = endorsementRepository.findByGameAndEndorser(game, game.getCreatedBy());
                Set<UUID> endorsedUserIds = endorsements.stream()
                                .map(e -> e.getEndorsedUser().getUserId())
                                .collect(Collectors.toSet());

                List<GameParticipation> confirmed = participationRepository.findConfirmedByGame(gameId);
                List<GameParticipation> waitlisted = participationRepository.findWaitlistedByGame(gameId);

                return GameDto.RosterResponse.builder()
                                .confirmed(confirmed.stream().map(p -> mapToParticipantDto(p, endorsedUserIds))
                                                .collect(Collectors.toList()))
                                .waitlisted(waitlisted.stream().map(p -> mapToParticipantDto(p, endorsedUserIds))
                                                .collect(Collectors.toList()))
                                .maxPlayers(game.getMaxPlayers())
                                .spotsAvailable(Math.max(0, game.getMaxPlayers() - confirmed.size()))
                                .build();
        }

        // ================== MAPPERS ==================

        /**
         * Mapper with privacy logic. US-1.3
         * Hides exact location unless user is Organizer or Confirmed Participant.
         */
        private GameDto.GameResponse mapToGameResponse(Game game, UUID requestingUserId) {
                int confirmedCount = participationRepository.countConfirmedParticipants(game.getGameId());
                List<GameParticipation> waitlisted = participationRepository.findWaitlistedByGame(game.getGameId());

                boolean showExactLocation = false;
                // US-1.3: Check if user is authorized to see exact location
                if (requestingUserId != null) {
                        if (game.getCreatedBy().getUserId().equals(requestingUserId)) {
                                showExactLocation = true;
                        } else {
                                Optional<GameParticipation> p = participationRepository
                                                .findByGameAndUser(game.getGameId(), requestingUserId);
                                if (p.isPresent()
                                                && p.get().getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED) {
                                        showExactLocation = true;
                                }
                        }
                }

                // US-1.3: Null-safety for location (Copilot fix #1)
                Location loc = game.getLocation();
                GameDto.LocationDto exactLocation = null;
                // US-1.3: Approximate location is always visible (e.g. "Near Montreal")
                String approximateLocation = (loc != null)
                                ? "Near " + loc.getCity()
                                : "Location unavailable";

                if (showExactLocation && loc != null) {
                        exactLocation = GameDto.LocationDto.builder()
                                        .name(loc.getName())
                                        .addressLine(loc.getAddressLine())
                                        .city(loc.getCity())
                                        .latitude(loc.getLatitude())
                                        .longitude(loc.getLongitude())
                                        .build();
                }

                return GameDto.GameResponse.builder()
                                .gameId(game.getGameId().toString())
                                .title(game.getTitle())
                                .description(game.getDescription())
                                .sportName(game.getSport().getName())
                                .location(exactLocation)
                                .approximateLocation(approximateLocation)
                                .hasExactLocationAccess(showExactLocation)
                                .indoorOutdoor(game.getIndoorOutdoor())
                                .intensityBand(game.getIntensityBand())
                                .skillBand(game.getSkillBand())
                                .minPlayers(game.getMinPlayers())
                                .maxPlayers(game.getMaxPlayers())
                                .allowWaitlist(game.getAllowWaitlist())
                                .minReliabilityRequired(game.getMinReliabilityRequired())
                                .minAge(game.getMinAge())
                                .maxAge(game.getMaxAge())
                                .startTime(game.getStartTime())
                                .endTime(game.getEndTime())
                                .status(game.getStatus().name())
                                .organizer(GameDto.OrganizerDto.builder()
                                                .userId(game.getCreatedBy().getUserId().toString())
                                                .displayName(game.getCreatedBy().getDisplayName())
                                                .reliabilityScore(game.getCreatedBy().getReliabilityScore())
                                                .build())
                                .confirmedCount(confirmedCount)
                                .waitlistCount(waitlisted.size())
                                .createdAt(game.getCreatedAt())
                                .tags(getGameTags(game))
                                .build();
        }

        private GameDto.ParticipantDto mapToParticipantDto(GameParticipation p, Set<UUID> endorsedUserIds) {
                return mapToParticipantDto(p, endorsedUserIds != null && endorsedUserIds.contains(p.getUser().getUserId()));
        }

        private GameDto.ParticipantDto mapToParticipantDto(GameParticipation p) {
                return mapToParticipantDto(p, false);
        }

        private GameDto.ParticipantDto mapToParticipantDto(GameParticipation p, boolean isEndorsed) {
                return GameDto.ParticipantDto.builder()
                                .participationId(p.getParticipationId().toString())
                                .userId(p.getUser().getUserId().toString())
                                .displayName(p.getUser().getDisplayName())
                                .avatarUrl(p.getUser().getAvatarUrl())
                                .role(p.getParticipationRole().name())
                                .joinStatus(p.getJoinStatus().name())
                                .attendanceStatus(p.getAttendanceStatus().name())
                                .waitlistPosition(p.getWaitlistPosition())
                                .reliabilityScore(p.getUser().getReliabilityScore())
                                .joinedAt(p.getJoinedAt())
                                .isEndorsedByOrganizer(isEndorsed)
                                .build();
        }

        // ================== US-4.2: TAG MANAGEMENT METHODS ==================

        /**
         * Get all available system tags. US-4.2
         */
        public List<GameDto.TagDto> getAllTags() {
                return tagRepository.findAllByIsSystemTagTrue().stream()
                                .map(this::mapToTagDto)
                                .collect(Collectors.toList());
        }

        /**
         * Assign tags to a game. US-4.2
         * Validates that tags exist and are system tags.
         */
        void assignTagsToGame(Game game, List<String> tagNames) {
                if (tagNames == null || tagNames.isEmpty()) {
                        return; // No tags to assign
                }
                for (String tagName : tagNames) {
                        GameTag tag = tagRepository.findByName(tagName)
                                        .orElseThrow(() -> new IllegalArgumentException("Invalid tag: " + tagName));

                        if (!tag.getIsSystemTag()) {
                                throw new IllegalArgumentException("Only system tags can be assigned: " + tagName);
                        }

                        GameTagAssignment assignment = GameTagAssignment.builder()
                                        .game(game)
                                        .tag(tag)
                                        .build();
                        tagAssignmentRepository.save(assignment);
                }
        }

        /**
         * Get tags for a game. US-4.2
         */
        private List<GameDto.TagDto> getGameTags(Game game) {
                return tagAssignmentRepository.findAllByGame(game).stream()
                                .map(assignment -> mapToTagDto(assignment.getTag()))
                                .collect(Collectors.toList());
        }

        /**
         * Validate age requirements for game join. US-4.2
         */
        void validateAgeRequirements(Game game, User user) {
                // If no age requirements, no validation needed
                if (game.getMinAge() == null && game.getMaxAge() == null) {
                        return;
                }

                // If age requirements exist but user hasn't confirmed age, throw exception
                if (user.getAgeConfirmedAt() == null) {
                        throw new AccessDeniedException("Age confirmation required to join this game");
                }

                // Calculate user's age based on ageConfirmedAt (which represents birth date)
                int userAge = Period.between(
                                LocalDate.ofInstant(user.getAgeConfirmedAt(), ZoneOffset.UTC),
                                LocalDate.now(ZoneOffset.UTC)).getYears();

                // Check minimum age
                if (game.getMinAge() != null && userAge < game.getMinAge()) {
                        throw new AccessDeniedException("Age confirmation required to join this game");
                }

                // Check maximum age
                if (game.getMaxAge() != null && userAge > game.getMaxAge()) {
                        throw new AccessDeniedException("Age confirmation required to join this game");
                }
        }

        /**
         * Validate and record tag confirmations for restricted tags. US-4.2
         */
        void validateAndRecordTagConfirmations(Game game, User user, GameDto.JoinRequest joinRequest) {
                List<GameTagAssignment> gameTagAssignments = tagAssignmentRepository.findAllByGame(game);
                List<GameTag> restrictedTags = gameTagAssignments.stream()
                                .map(GameTagAssignment::getTag)
                                .filter(GameTag::getIsRestricted)
                                .collect(Collectors.toList());

                if (restrictedTags.isEmpty()) {
                        return; // No restricted tags, no validation needed
                }

                // Ensure join request contains confirmations
                if (joinRequest == null || joinRequest.getConfirmedTagIds() == null
                                || joinRequest.getConfirmedTagIds().isEmpty()) {
                        throw new AccessDeniedException(
                                        "You must confirm restricted community tags to join this game");
                }

                // Validate that all restricted tags are confirmed
                Set<String> confirmedTagIds = Set.copyOf(joinRequest.getConfirmedTagIds());
                for (GameTag restrictedTag : restrictedTags) {
                        String tagId = restrictedTag.getTagId().toString();
                        if (!confirmedTagIds.contains(tagId)) {
                                throw new AccessDeniedException(
                                                "You must confirm the tag: " + restrictedTag.getName());
                        }

                        // Record the confirmation for auditability
                        if (!tagConfirmationRepository.existsByUser_UserIdAndGame_GameIdAndTag_TagId(
                                        user.getUserId(), game.getGameId(), restrictedTag.getTagId())) {
                                GameTagConfirmation confirmation = GameTagConfirmation.builder()
                                                .user(user)
                                                .game(game)
                                                .tag(restrictedTag)
                                                .build();
                                tagConfirmationRepository.save(confirmation);
                        }
                }
        }

        private GameDto.TagDto mapToTagDto(GameTag tag) {
                return GameDto.TagDto.builder()
                                .tagId(tag.getTagId().toString())
                                .name(tag.getName())
                                .tagType(tag.getTagType())
                                .isRestricted(tag.getIsRestricted())
                                .build();
        }
}
