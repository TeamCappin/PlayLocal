package com.backend.playlocal.service;

import com.backend.playlocal.exception.CapacityExceededException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.backend.playlocal.service.OrganizerQualityService;


import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameService {

        private static final Logger log = LoggerFactory.getLogger(GameService.class);

        private static final String OUTCOME_CONFIRMED = "CONFIRMED";
        private static final String OUTCOME_WAITLISTED = "WAITLISTED";
        private static final String JOIN_LOG_FORMAT = "US-4.1 Join decision: userId={}, gameId={}, outcome={}, reason={}, isOrganizer={}";

        private final GameRepository gameRepository;
        private final GameParticipationRepository participationRepository;
        private final UserRepository userRepository;
        private final SportRepository sportRepository;
        private final GameVisibilityRepository gameVisibilityRepository;
        private final EndorsementRepository endorsementRepository;
        private final GameTagRepository tagRepository;
        private final GameTagAssignmentRepository tagAssignmentRepository;
        private final GameTagConfirmationRepository tagConfirmationRepository;
        private final NotificationService notificationService;
        private final OrganizerQualityService oqsService;
        private final LocationRepository locationRepository;

        public GameService(GameRepository gameRepository, GameParticipationRepository participationRepository,
                        UserRepository userRepository, SportRepository sportRepository,
                        GameVisibilityRepository gameVisibilityRepository,
                        EndorsementRepository endorsementRepository, GameTagRepository tagRepository,
                        GameTagAssignmentRepository tagAssignmentRepository,
                        GameTagConfirmationRepository tagConfirmationRepository,
                        NotificationService notificationService,
                        OrganizerQualityService oqsService,
                        LocationRepository locationRepository) {
                this.gameRepository = gameRepository;
                this.participationRepository = participationRepository;
                this.userRepository = userRepository;
                this.sportRepository = sportRepository;
                this.gameVisibilityRepository = gameVisibilityRepository;
                this.endorsementRepository = endorsementRepository;
                this.tagRepository = tagRepository;
                this.tagAssignmentRepository = tagAssignmentRepository;
                this.tagConfirmationRepository = tagConfirmationRepository;
                this.notificationService = notificationService;
                this.oqsService = oqsService;
                this.locationRepository = locationRepository;
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
                                .allowWaitlist(request.getAllowWaitlist() == null || Boolean.TRUE.equals(request.getAllowWaitlist()))
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
         * Get upcoming games with optional filters. US-2.3
         */
        public List<GameDto.GameResponse> getUpcomingGames(
                        String sportName, String skillLevel, String locationType,
                        String intensity, UUID userId) {
                GameFilterParams params = normalizeGameFilters(sportName, skillLevel, locationType, intensity);
                List<Game> games = gameRepository.findUpcomingGamesWithFilters(
                                Instant.now(), params.sportName(), params.skillLevel(),
                                params.locationType(), params.intensity());
                return games.stream()
                                .map(game -> mapToGameResponse(game, userId))
                                .collect(Collectors.toList());
        }

        /**
         * Find nearby games with geospatial filtering. US-2.3
         */
        public List<GameDto.GameResponse> findNearbyGames(
                        Float userLat, Float userLon, Double radiusKm,
                        String sportName, String skillLevel, String locationType,
                        String intensity, UUID userId) {
                GameFilterParams params = normalizeGameFilters(sportName, skillLevel, locationType, intensity);
                List<UUID> gameIds = gameRepository.findNearbyGameIdsWithFilters(
                                Instant.now(), userLat, userLon, radiusKm,
                                params.sportName(), params.skillLevel(),
                                params.locationType(), params.intensity());
                List<Game> games = gameIds.stream()
                                .map(gameId -> gameRepository.findById(gameId))
                                .filter(Optional::isPresent)
                                .map(Optional::get)
                                .collect(Collectors.toList());
                return games.stream()
                                .map(game -> mapToGameResponse(game, userId))
                                .collect(Collectors.toList());
        }

        /**
         * Normalize discovery filter parameters to match database format (lowercase).
         * Empty strings are treated as null to bypass filtering.
         * Maps "high" to "competitive" for intensity (database has no "high" value).
         */
        private static GameFilterParams normalizeGameFilters(
                        String sportName, String skillLevel, String locationType, String intensity) {
                String normalizedSportName = (sportName != null && !sportName.trim().isEmpty())
                                ? sportName.trim().toLowerCase()
                                : null;
                String normalizedSkillLevel = (skillLevel != null && !skillLevel.trim().isEmpty())
                                ? skillLevel.toLowerCase().trim()
                                : null;
                String normalizedLocationType = (locationType != null && !locationType.trim().isEmpty())
                                ? locationType.toLowerCase().trim()
                                : null;
                String normalizedIntensity = null;
                if (intensity != null && !intensity.trim().isEmpty()) {
                        String lower = intensity.toLowerCase().trim();
                        normalizedIntensity = "high".equals(lower) ? "competitive" : lower;
                }
                return new GameFilterParams(normalizedSportName, normalizedSkillLevel,
                                normalizedLocationType, normalizedIntensity);
        }

        private record GameFilterParams(String sportName, String skillLevel, String locationType, String intensity) {
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

                // US-4.1: Check reliability requirement (organizer is exempt)
                boolean isOrganizer = game.getCreatedBy().getUserId().equals(userId);
                String joinReason = null;
                String joinOutcome = null;

                if (!isOrganizer && game.getMinReliabilityRequired() != null
                                && user.getReliabilityScore() < game.getMinReliabilityRequired()) {
                        joinOutcome = "DENIED";
                        joinReason = String.format("Minimum reliability score required: %.1f%%. User score: %.1f%%",
                                game.getMinReliabilityRequired(), user.getReliabilityScore());
                        log.info(JOIN_LOG_FORMAT, userId, gameId, joinOutcome, joinReason, isOrganizer);
                        throw new AccessDeniedException(joinReason);
                }

                // Check for existing participation (idempotent - one per user per game)
                Optional<GameParticipation> existing = participationRepository.findByGameAndUser(gameId, userId);
                if (existing.isPresent()) {
                        GameParticipation participation = existing.get();
                        if (participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED ||
                                        participation.getJoinStatus() == GameParticipation.JoinStatus.WAITLISTED) {
                                // Already joined - return current status (idempotent)
                                joinOutcome = participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED ? OUTCOME_CONFIRMED : OUTCOME_WAITLISTED;
                                joinReason = "Already joined this game";
                                log.info(JOIN_LOG_FORMAT, userId, gameId, joinOutcome, joinReason, isOrganizer);
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
                        } else if (Boolean.TRUE.equals(game.getAllowWaitlist())) {
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

                        // US-4.1: Log rejoin decision
                        joinOutcome = participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED ? OUTCOME_CONFIRMED : OUTCOME_WAITLISTED;
                        joinReason = participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED
                                ? "Successfully rejoined the game"
                                : String.format("Rejoined waitlist at position %d", participation.getWaitlistPosition());
                        log.info(JOIN_LOG_FORMAT, userId, gameId, joinOutcome, joinReason, isOrganizer);

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
                } else if (Boolean.TRUE.equals(game.getAllowWaitlist())) {
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

                // US-4.1: Log successful join decision
                joinOutcome = participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED ? OUTCOME_CONFIRMED : OUTCOME_WAITLISTED;
                joinReason = participation.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED
                        ? "Joined successfully"
                        : String.format("Added to waitlist at position %d", participation.getWaitlistPosition());
                log.info(JOIN_LOG_FORMAT, userId, gameId, joinOutcome, joinReason, isOrganizer);

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

                ensureNotArchived(participation.getGame());
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
         * US-4.3: When organizer raises min reliability, remove confirmed/waitlisted participants
         * whose reliability is below the new threshold. Organizer is never removed.
         * Process waitlisted first (by position), then confirmed, so promotions work correctly.
         */
        private void removeParticipantsBelowReliabilityThreshold(Game game, float newThreshold) {
                UUID gameId = game.getGameId();
                UUID organizerId = game.getCreatedBy().getUserId();

                List<GameParticipation> confirmed = participationRepository.findConfirmedByGame(gameId);
                List<GameParticipation> waitlisted = participationRepository.findWaitlistedByGame(gameId);

                List<GameParticipation> toRemove = new java.util.ArrayList<>();
                for (GameParticipation p : confirmed) {
                        if (!p.getUser().getUserId().equals(organizerId)) {
                                float score = p.getUser().getReliabilityScore() != null
                                                ? p.getUser().getReliabilityScore() : 0f;
                                if (score < newThreshold) {
                                        toRemove.add(p);
                                }
                        }
                }
                for (GameParticipation p : waitlisted) {
                        float score = p.getUser().getReliabilityScore() != null
                                        ? p.getUser().getReliabilityScore() : 0f;
                        if (score < newThreshold) {
                                toRemove.add(p);
                        }
                }

                // Process waitlisted first (by position asc), then confirmed
                toRemove.sort((a, b) -> {
                        boolean aWait = a.getJoinStatus() == GameParticipation.JoinStatus.WAITLISTED;
                        boolean bWait = b.getJoinStatus() == GameParticipation.JoinStatus.WAITLISTED;
                        if (aWait != bWait) return aWait ? -1 : 1;
                        if (aWait) {
                                int posA = a.getWaitlistPosition() != null ? a.getWaitlistPosition() : 0;
                                int posB = b.getWaitlistPosition() != null ? b.getWaitlistPosition() : 0;
                                return Integer.compare(posA, posB);
                        }
                        return 0;
                });

                for (GameParticipation p : toRemove) {
                        boolean wasConfirmed = p.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED;
                        int oldWaitlistPosition = p.getWaitlistPosition() != null ? p.getWaitlistPosition() : 0;

                        p.setJoinStatus(GameParticipation.JoinStatus.CANCELLED);
                        p.setLeftAt(Instant.now());
                        p.setWaitlistPosition(null);
                        participationRepository.save(p);

                        if (wasConfirmed) {
                                List<GameParticipation> firstWaitlisted = participationRepository.findFirstWaitlisted(gameId);
                                if (!firstWaitlisted.isEmpty()) {
                                        GameParticipation promoted = firstWaitlisted.get(0);
                                        promoted.setJoinStatus(GameParticipation.JoinStatus.CONFIRMED);
                                        promoted.setWaitlistPosition(null);
                                        participationRepository.save(promoted);
                                        participationRepository.decrementWaitlistPositionsAfter(gameId, 1);
                                }
                        } else if (oldWaitlistPosition > 0) {
                                participationRepository.decrementWaitlistPositionsAfter(gameId, oldWaitlistPosition);
                        }
                        log.info("US-4.3 Removed participant userId={} from gameId={} (reliability {} < threshold {})",
                                        p.getUser().getUserId(), gameId,
                                        p.getUser().getReliabilityScore(), newThreshold);

                        // US-4.3: Notify removed player they no longer meet the updated requirements
                        if (notificationService != null) {
                                Map<String, Object> payload = new java.util.HashMap<>();
                                payload.put("title", "Removed from game");
                                payload.put("message", String.format(
                                                "You no longer meet the updated requirements for \"%s\". The organizer raised the minimum reliability score.",
                                                game.getTitle()));
                                payload.put("gameId", gameId.toString());
                                payload.put("link", "/games/" + gameId.toString());
                                notificationService.createInAppNotification(
                                                p.getUser().getUserId(),
                                                "GAME_REMOVED_REQUIREMENTS",
                                                payload);
                        }
                }
        }

        /**
         * US-4.3: Notify all remaining participants (confirmed + waitlisted, except organizer)
         * that the game was updated.
         */
        private void notifyParticipantsGameUpdated(Game game, UUID organizerId) {
                UUID gameId = game.getGameId();
                List<GameParticipation> confirmed = participationRepository.findConfirmedByGame(gameId);
                List<GameParticipation> waitlisted = participationRepository.findWaitlistedByGame(gameId);
                java.util.Set<UUID> notified = new java.util.HashSet<>();
                for (GameParticipation p : confirmed) {
                        if (!p.getUser().getUserId().equals(organizerId) && notified.add(p.getUser().getUserId())) {
                                sendGameUpdatedNotification(game, p.getUser().getUserId());
                        }
                }
                for (GameParticipation p : waitlisted) {
                        if (notified.add(p.getUser().getUserId())) {
                                sendGameUpdatedNotification(game, p.getUser().getUserId());
                        }
                }
        }

        private void sendGameUpdatedNotification(Game game, UUID userId) {
                if (notificationService == null) return;
                Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("title", "Game updated");
                payload.put("message", String.format("The game \"%s\" has been updated. Check the details for changes.",
                                game.getTitle()));
                payload.put("gameId", game.getGameId().toString());
                payload.put("link", "/games/" + game.getGameId().toString());
                notificationService.createInAppNotification(userId, "GAME_UPDATED", payload);
        }

        /**
         * US-4.3: Notify all joined players (confirmed + waitlisted, except organizer)
         * that the game was cancelled.
         */
        private void notifyParticipantsGameCancelled(Game game, UUID organizerId) {
                UUID gameId = game.getGameId();
                List<GameParticipation> confirmed = participationRepository.findConfirmedByGame(gameId);
                List<GameParticipation> waitlisted = participationRepository.findWaitlistedByGame(gameId);
                java.util.Set<UUID> notified = new java.util.HashSet<>();
                for (GameParticipation p : confirmed) {
                        if (!p.getUser().getUserId().equals(organizerId) && notified.add(p.getUser().getUserId())) {
                                sendGameCancelledNotification(game, p.getUser().getUserId());
                        }
                }
                for (GameParticipation p : waitlisted) {
                        if (notified.add(p.getUser().getUserId())) {
                                sendGameCancelledNotification(game, p.getUser().getUserId());
                        }
                }
        }

        private void sendGameCancelledNotification(Game game, UUID userId) {
                if (notificationService == null) return;
                Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("title", "Game cancelled");
                payload.put("message", String.format("The game \"%s\" has been cancelled by the organizer.",
                                game.getTitle()));
                payload.put("gameId", game.getGameId().toString());
                payload.put("link", "/discover");
                notificationService.createInAppNotification(userId, "GAME_CANCELLED", payload);
        }

        /**
         * Update game settings. US-4.1
         * Only allows updates before game starts (status == SCHEDULED and startTime > now).
         */
        @Transactional
        public GameDto.GameResponse updateGame(UUID gameId, UUID organizerId, GameDto.UpdateRequest request) {
                Game game = gameRepository.findById(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

                // Verify caller is the organizer
                if (!game.getCreatedBy().getUserId().equals(organizerId)) {
                        throw new AccessDeniedException("Only the organizer can update the game");
                }

                // US-4.1: Only allow updates before game starts
                if (game.getStatus() != Game.GameStatus.SCHEDULED || game.getStartTime().isBefore(Instant.now())) {
                        throw new IllegalStateException("Cannot update game after it has started");
                }

                // Update fields if provided
                if (request.getTitle() != null) {
                        game.setTitle(request.getTitle());
                }
                if (request.getDescription() != null) {
                        game.setDescription(request.getDescription());
                }
                if (request.getIndoorOutdoor() != null) {
                        game.setIndoorOutdoor(request.getIndoorOutdoor());
                }
                if (request.getIntensityBand() != null) {
                        game.setIntensityBand(request.getIntensityBand());
                }
                if (request.getSkillBand() != null) {
                        game.setSkillBand(request.getSkillBand());
                }
                if (request.getMinPlayers() != null) {
                        game.setMinPlayers(request.getMinPlayers());
                }
                if (request.getMaxPlayers() != null) {
                        game.setMaxPlayers(request.getMaxPlayers());
                }
                if (request.getAllowWaitlist() != null) {
                        game.setAllowWaitlist(request.getAllowWaitlist());
                }
                // US-4.1: Allow updating minReliabilityRequired (changes apply immediately to new join attempts)
                // Note: To clear the requirement, send -1 or omit the field entirely
                // US-4.3: When raising the threshold, automatically remove participants below it
                Float oldMinReliability = game.getMinReliabilityRequired();
                if (request.getMinReliabilityRequired() != null) {
                        if (request.getMinReliabilityRequired() < 0) {
                                game.setMinReliabilityRequired(null);
                        } else {
                                game.setMinReliabilityRequired(request.getMinReliabilityRequired());
                        }
                }
                Float newMinReliability = game.getMinReliabilityRequired();
                // US-4.3: Remove participants below new threshold when organizer raises min reliability
                if (newMinReliability != null && (oldMinReliability == null || newMinReliability > oldMinReliability)) {
                        removeParticipantsBelowReliabilityThreshold(game, newMinReliability);
                }

                // US-4.3: Location (update existing location entity and persist)
                if (request.getLocationName() != null || request.getAddressLine() != null
                                || request.getCity() != null || request.getLatitude() != null
                                || request.getLongitude() != null) {
                        Location loc = game.getLocation();
                        if (loc != null) {
                                if (request.getLocationName() != null) loc.setName(request.getLocationName());
                                if (request.getAddressLine() != null) loc.setAddressLine(request.getAddressLine());
                                if (request.getCity() != null) loc.setCity(request.getCity());
                                if (request.getLatitude() != null) loc.setLatitude(request.getLatitude());
                                if (request.getLongitude() != null) loc.setLongitude(request.getLongitude());
                                locationRepository.saveAndFlush(loc);
                        }
                }

                if (request.getStartTime() != null) game.setStartTime(request.getStartTime());
                if (request.getEndTime() != null) game.setEndTime(request.getEndTime());

                if (request.getVisibility() != null && !request.getVisibility().isBlank()) {
                        GameVisibility vis = gameVisibilityRepository.findByCode(request.getVisibility().trim().toLowerCase())
                                        .orElseThrow(() -> new ResourceNotFoundException("Visibility not found: " + request.getVisibility()));
                        game.setVisibility(vis);
                }

                if (request.getTagNames() != null) {
                        tagAssignmentRepository.deleteAllByGame(game);
                        tagAssignmentRepository.flush();
                        if (!request.getTagNames().isEmpty()) {
                                assignTagsToGame(game, request.getTagNames());
                        }
                }

                if (request.getMinAge() != null) game.setMinAge(request.getMinAge());
                if (request.getMaxAge() != null) game.setMaxAge(request.getMaxAge());

                game = gameRepository.saveAndFlush(game);
                log.info("US-4.1/4.3 Game updated: gameId={}, organizerId={}", gameId, organizerId);

                // US-4.3: Notify all remaining participants (confirmed + waitlisted, except organizer) that game was updated
                notifyParticipantsGameUpdated(game, organizerId);

                return mapToGameResponse(game, organizerId);
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

        /**
         * Cancel a game. US-2.4 (Organizer cancellation control)
         * Only the organizer can cancel. Game must be in SCHEDULED status.
         */
        @Transactional
        public GameDto.GameResponse cancelGame(UUID gameId, UUID userId) {
                Game game = gameRepository.findById(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

                // Verify the requester is the organizer
                if (!game.getCreatedBy().getUserId().equals(userId)) {
                        throw new AccessDeniedException("Only the organizer can cancel this game");
                }

                // Verify game is in SCHEDULED status (cannot cancel in-progress or completed
                // games)
                if (game.getStatus() != Game.GameStatus.SCHEDULED) {
                        throw new IllegalStateException(
                                        "Cannot cancel a game that is " + game.getStatus().name().toLowerCase());
                }

                // Update game status to CANCELLED
                game.setStatus(Game.GameStatus.CANCELLED);
                game.setCancelledAt(Instant.now());
                game = gameRepository.save(game);

                notifyCancellation(game);
                // US-6.1: Recalculate OQS for the organizer after game cancellation
                oqsService.onGameCancelled(gameId);

                // US-4.3: Notify all joined players (confirmed + waitlisted, except organizer) that game was cancelled
                notifyParticipantsGameCancelled(game, userId);

                return mapToGameResponse(game, userId);
        }

        /**
         * Mark a game as completed (organizer only).
         */
        @Transactional
        public GameDto.GameResponse completeGame(UUID gameId, UUID userId) {
                Game game = gameRepository.findById(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

                assertOrganizer(game, userId);

                if (game.getStatus() == Game.GameStatus.CANCELLED || game.getStatus() == Game.GameStatus.ARCHIVED) {
                        throw new IllegalStateException(
                                        "Cannot complete a game that is " + game.getStatus().name().toLowerCase());
                }

                game.setStatus(Game.GameStatus.COMPLETED);
                game = gameRepository.save(game);
                return mapToGameResponse(game, userId);
        }

        /**
         * Archive a game (organizer only).
         */
        @Transactional
        public GameDto.GameResponse archiveGame(UUID gameId, UUID userId) {
                Game game = gameRepository.findById(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

                assertOrganizer(game, userId);

                if (game.getStatus() == Game.GameStatus.SCHEDULED
                                || game.getStatus() == Game.GameStatus.IN_PROGRESS) {
                        throw new IllegalStateException(
                                        "Cannot archive a game that is " + game.getStatus().name().toLowerCase());
                }

                if (game.getStatus() != Game.GameStatus.ARCHIVED) {
                        game.setStatus(Game.GameStatus.ARCHIVED);
                        game = gameRepository.save(game);
                }

                return mapToGameResponse(game, userId);
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
                                showExactLocation = p.filter(part -> part.getJoinStatus() == GameParticipation.JoinStatus.CONFIRMED).isPresent();
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
                                .allowWaitlist(Boolean.TRUE.equals(game.getAllowWaitlist()))
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
                return mapToParticipantDto(p,
                                endorsedUserIds != null && endorsedUserIds.contains(p.getUser().getUserId()));
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

        private void assertOrganizer(Game game, UUID organizerId) {
                if (!game.getCreatedBy().getUserId().equals(organizerId)) {
                        throw new AccessDeniedException("Only the organizer can modify this game");
                }
        }

        private void ensureNotArchived(Game game) {
                if (game.getStatus() == Game.GameStatus.ARCHIVED) {
                        throw new IllegalStateException("Archived games are read-only");
                }
        }

        private void notifyCancellation(Game game) {
                List<GameParticipation> confirmed = Optional
                                .ofNullable(participationRepository.findConfirmedByGame(game.getGameId()))
                                .orElseGet(List::of);
                List<GameParticipation> waitlisted = Optional
                                .ofNullable(participationRepository.findWaitlistedByGame(game.getGameId()))
                                .orElseGet(List::of);
                Set<UUID> notified = new HashSet<>();

                Map<String, Object> payload = Map.of(
                                "gameId", game.getGameId().toString(),
                                "gameTitle", game.getTitle(),
                                "status", game.getStatus().name(),
                                "message", "Game cancelled: " + game.getTitle());

                for (GameParticipation participation : confirmed) {
                        addCancellationNotification(participation, game, payload, notified);
                }
                for (GameParticipation participation : waitlisted) {
                        addCancellationNotification(participation, game, payload, notified);
                }
        }

        private void addCancellationNotification(GameParticipation participation, Game game,
                        Map<String, Object> payload, Set<UUID> notified) {
                UUID userId = participation.getUser().getUserId();
                if (userId.equals(game.getCreatedBy().getUserId()) || notified.contains(userId)) {
                        return;
                }
                if (notificationService != null) {
                        notificationService.createInAppNotification(userId, "game_cancelled", payload);
                        notified.add(userId);
                }
        }
}
