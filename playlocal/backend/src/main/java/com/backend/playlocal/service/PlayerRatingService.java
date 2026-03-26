package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.PlayerRatingDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.PlayerRating;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.PlayerRatingRepository;
import com.backend.playlocal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service responsible for the core business logic of Player Ratings.
 * Handles the creation, reading, updating, and flagging of ratings,
 * while enforcing constraints like the 24-hr edit limit and match attendance.
 */
@Service
@RequiredArgsConstructor
public class PlayerRatingService {

    private final PlayerRatingRepository playerRatingRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final GameParticipationRepository gameParticipationRepository;

    // A simple profanity filter example. In a real-world scenario, you might use a library.
    private static final List<String> PROFANITY_WORDS = List.of("badword1", "badword2", "idiot");

    /**
     * Creates a new rating given by a user to another user in a specific game.
     * Enforces that both users attended the same completed game.
     *
     * @param raterId The UUID of the user making the rating.
     * @param request The data transfer object containing the rating data.
     * @return The resulting rating entity mapped to a response DTO.
     * @throws IllegalArgumentException If the constraints are violated (e.g. self-rating, duplicate rating).
     * @throws ResourceNotFoundException If any referenced entities (Game, Users) are missing.
     */
    @Transactional
    public PlayerRatingDto.Response createRating(UUID raterId, PlayerRatingDto.CreateRequest request) {
        if (raterId.equals(request.getRateeId())) {
            throw new IllegalArgumentException("You cannot rate yourself.");
        }

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game not found"));

        if (game.getStatus() != Game.GameStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot rate players before the game is completed.");
        }

        User rater = userRepository.findById(raterId)
                .orElseThrow(() -> new ResourceNotFoundException("Rater not found"));
        User ratee = userRepository.findById(request.getRateeId())
                .orElseThrow(() -> new ResourceNotFoundException("Ratee not found"));

        // Verify both participated and were verified
        boolean raterParticipated = gameParticipationRepository.findByGameAndUser(game.getGameId(), rater.getUserId())
                .map(p -> p.getAttendanceStatus() == GameParticipation.AttendanceStatus.ATTENDED)
                .orElse(false);

        boolean rateeParticipated = gameParticipationRepository.findByGameAndUser(game.getGameId(), ratee.getUserId())
                .map(p -> p.getAttendanceStatus() == GameParticipation.AttendanceStatus.ATTENDED)
                .orElse(false);

        if (!raterParticipated || !rateeParticipated) {
            throw new IllegalArgumentException("Both users must have attended the game to give or receive a rating.");
        }

        if (playerRatingRepository.existsByGameGameIdAndRaterUserIdAndRateeUserId(game.getGameId(), raterId, request.getRateeId())) {
            throw new IllegalArgumentException("You have already rated this player for this game.");
        }

        PlayerRating playerRating = PlayerRating.builder()
                .game(game)
                .rater(rater)
                .ratee(ratee)
                .rating(request.getRating())
                .comment(request.getComment())
                .isFlagged(containsProfanity(request.getComment()))
                .build();

        return mapToResponse(playerRatingRepository.save(playerRating));
    }

    /**
     * Updates an existing rating if requested within the 24-hour grace period limit.
     *
     * @param raterId The UUID of the user attempting to update the rating.
     * @param ratingId The UUID belonging to the specific stored rating record.
     * @param request The data transfer object containing the modified properties.
     * @return The updated rating entity mapped to a response DTO.
     * @throws IllegalArgumentException If caller does not own the rating, or if 24 hours have elapsed.
     * @throws ResourceNotFoundException If the rating entity is missing.
     */
    @Transactional
    public PlayerRatingDto.Response updateRating(UUID raterId, UUID ratingId, PlayerRatingDto.UpdateRequest request) {
        PlayerRating rating = playerRatingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found"));

        if (!rating.getRater().getUserId().equals(raterId)) {
            throw new IllegalArgumentException("You can only edit your own ratings.");
        }

        if (rating.getCreatedAt().isBefore(Instant.now().minus(24, ChronoUnit.HOURS))) {
            throw new IllegalArgumentException("Ratings can only be edited within 24 hours of creation.");
        }

        rating.setRating(request.getRating());
        rating.setComment(request.getComment());
        rating.setFlagged(containsProfanity(request.getComment()));

        return mapToResponse(playerRatingRepository.save(rating));
    }

    /**
     * Given a specific user, retrieves all of the ratings they have received.
     *
     * @param rateeId The user who received the ratings.
     * @return List of response DTOs summarizing every rating received.
     */
    public List<PlayerRatingDto.Response> getRatingsForUser(UUID rateeId) {
        return playerRatingRepository.findByRateeUserId(rateeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Marks a specific rating contextually as flagged for moderation due to abuse/rules-violation.
     * 
     * @param ratingId The UUID belonging to the rating record.
     * @throws ResourceNotFoundException If the rating entity is essentially untraceable.
     */
    @Transactional
    public void flagRating(UUID ratingId) {
        PlayerRating rating = playerRatingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found"));
        rating.setFlagged(true);
        playerRatingRepository.save(rating);
    }

    private boolean containsProfanity(String comment) {
        if (comment == null || comment.trim().isEmpty()) {
            return false;
        }
        String lowerComment = comment.toLowerCase();
        for (String word : PROFANITY_WORDS) {
            if (lowerComment.contains(word)) {
                return true;
            }
        }
        return false;
    }

    private PlayerRatingDto.Response mapToResponse(PlayerRating rating) {
        // Build response
        return PlayerRatingDto.Response.builder()
                .ratingId(rating.getRatingId())
                .gameId(rating.getGame().getGameId())
                .raterId(rating.getRater().getUserId())
                .raterName(rating.getRater().getDisplayName()) // Adjust if needed
                .rateeId(rating.getRatee().getUserId())
                .rating(rating.getRating())
                .comment(rating.getComment())
                .isFlagged(rating.isFlagged())
                .createdAt(rating.getCreatedAt())
                .updatedAt(rating.getUpdatedAt())
                .build();
    }
}
