package com.backend.playlocal.service;

import com.backend.playlocal.exception.CapacityExceededException;
import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.*;
import com.backend.playlocal.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
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
        private final LocationRepository locationRepository;
        private final GameVisibilityRepository gameVisibilityRepository;

        public GameService(GameRepository gameRepository, GameParticipationRepository participationRepository,
                        UserRepository userRepository, SportRepository sportRepository,
                        LocationRepository locationRepository, GameVisibilityRepository gameVisibilityRepository) {
                this.gameRepository = gameRepository;
                this.participationRepository = participationRepository;
                this.userRepository = userRepository;
                this.sportRepository = sportRepository;
                this.locationRepository = locationRepository;
                this.gameVisibilityRepository = gameVisibilityRepository;
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
                                .startTime(request.getStartTime())
                                .endTime(request.getEndTime())
                                .build();

                game = gameRepository.save(game);

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
         * CRITICAL: Concurrency-safe join. US-2.5
         * Uses SELECT FOR UPDATE to prevent overbooking.
         */
        @Transactional
        public GameDto.JoinResponse joinGame(UUID gameId, UUID userId) {
                User user = userRepository.findActiveById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                // Lock the game to prevent race conditions
                Game game = gameRepository.findByIdWithLock(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

                // Check game status
                if (game.getStatus() != Game.GameStatus.SCHEDULED) {
                        throw new IllegalStateException("Cannot join a game that is not scheduled");
                }

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
                                                        : "Rejoined waitlist at position " + participation.getWaitlistPosition())
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
                // We'll use a special sentinel value to indicate "clear" - but for now, 
                // only update if a non-null value is provided
                if (request.getMinReliabilityRequired() != null) {
                        if (request.getMinReliabilityRequired() < 0) {
                                // Special value to clear the requirement
                                game.setMinReliabilityRequired(null);
                        } else {
                                game.setMinReliabilityRequired(request.getMinReliabilityRequired());
                        }
                }

                game = gameRepository.save(game);
                log.info("US-4.1 Game updated: gameId={}, organizerId={}, minReliabilityRequired={}", 
                        gameId, organizerId, game.getMinReliabilityRequired());

                return mapToGameResponse(game, organizerId);
        }

        /**
         * Get game roster. US-2.4
         */
        public GameDto.RosterResponse getRoster(UUID gameId) {
                Game game = gameRepository.findById(gameId)
                                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

                List<GameParticipation> confirmed = participationRepository.findConfirmedByGame(gameId);
                List<GameParticipation> waitlisted = participationRepository.findWaitlistedByGame(gameId);

                return GameDto.RosterResponse.builder()
                                .confirmed(confirmed.stream().map(this::mapToParticipantDto)
                                                .collect(Collectors.toList()))
                                .waitlisted(waitlisted.stream().map(this::mapToParticipantDto)
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
                                .allowWaitlist(game.getAllowWaitlist())
                                .minReliabilityRequired(game.getMinReliabilityRequired())
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
                                .build();
        }

        private GameDto.ParticipantDto mapToParticipantDto(GameParticipation p) {
                return GameDto.ParticipantDto.builder()
                                .participationId(p.getParticipationId().toString())
                                .userId(p.getUser().getUserId().toString())
                                .displayName(p.getUser().getDisplayName())
                                .avatarUrl(p.getUser().getAvatarUrl())
                                .role(p.getParticipationRole().name())
                                .joinStatus(p.getJoinStatus().name())
                                .waitlistPosition(p.getWaitlistPosition())
                                .reliabilityScore(p.getUser().getReliabilityScore())
                                .joinedAt(p.getJoinedAt())
                                .build();
        }
}
