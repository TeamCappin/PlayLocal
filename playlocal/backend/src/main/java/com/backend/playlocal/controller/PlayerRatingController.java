package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.PlayerRatingDto;
import com.backend.playlocal.security.JwtService;
import com.backend.playlocal.service.PlayerRatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller endpoints for managing player ratings and post-game feedback.
 */
@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class PlayerRatingController {

    private final PlayerRatingService playerRatingService;
    private final JwtService jwtService;

    /**
     * Submits a new player rating and feedback upon completion of a match.
     * Evaluates security token to identify the acting user as "rater".
     *
     * @param token Authentication Bearer token for tracking the rater.
     * @param request JSON payload mapping to the properties to produce the rating.
     * @return Formatted response indicating data success with a 201 status entity.
     */
    @PostMapping
    public ResponseEntity<PlayerRatingDto.Response> createRating(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody PlayerRatingDto.CreateRequest request) {

        UUID raterId = jwtService.getUserIdFromToken(token.substring(7));
        PlayerRatingDto.Response response = playerRatingService.createRating(raterId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Replaces previous rating choices conditionally under the 24-hour edit window rule.
     * Evaluates security token to securely ascertain the rater.
     *
     * @param token Authentication Bearer token for verifying ownership.
     * @param ratingId Path parameter for the identity of the specific rating intended for modification.
     * @param request Modification payload carrying the valid adjustments.
     * @return Formatted response referencing newly adjusted state logic via 200 HTTP code.
     */
    @PutMapping("/{ratingId}")
    public ResponseEntity<PlayerRatingDto.Response> updateRating(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID ratingId,
            @Valid @RequestBody PlayerRatingDto.UpdateRequest request) {

        UUID raterId = jwtService.getUserIdFromToken(token.substring(7));
        PlayerRatingDto.Response response = playerRatingService.updateRating(raterId, ratingId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Public visibility endpoint for evaluating a player by exposing their historic received ratings.
     *
     * @param userId The UUID representing the targeted player profile to extract ratings for.
     * @return List serialization of accumulated matching responses to the query.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PlayerRatingDto.Response>> getRatingsForUser(@PathVariable UUID userId) {
        List<PlayerRatingDto.Response> response = playerRatingService.getRatingsForUser(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Exposes mechanisms allowing users/moderators to manually flag inappropriate post-game feedback items.
     *
     * @param ratingId The UUID belonging to the targeted abusive rating resource.
     * @return Standard confirmation 200 HTTP code signaling execution fulfillment.
     */
    @PostMapping("/{ratingId}/flag")
    public ResponseEntity<Void> flagRating(@PathVariable UUID ratingId) {
        playerRatingService.flagRating(ratingId);
        return ResponseEntity.ok().build();
    }
}
