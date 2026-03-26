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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlayerRatingServiceTest {

    @Mock
    private PlayerRatingRepository playerRatingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GameRepository gameRepository;
    @Mock
    private GameParticipationRepository gameParticipationRepository;

    @InjectMocks
    private PlayerRatingService playerRatingService;

    private User rater;
    private User ratee;
    private Game game;
    private PlayerRating rating;

    @BeforeEach
    void setUp() {
        rater = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Rater Name")
                .build();

        ratee = User.builder()
                .userId(UUID.randomUUID())
                .displayName("Ratee Name")
                .build();

        game = Game.builder()
                .gameId(UUID.randomUUID())
                .status(Game.GameStatus.COMPLETED)
                .build();

        rating = PlayerRating.builder()
                .ratingId(UUID.randomUUID())
                .game(game)
                .rater(rater)
                .ratee(ratee)
                .rating(4)
                .comment("Good game!")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void createRating_Success() {
        PlayerRatingDto.CreateRequest request = new PlayerRatingDto.CreateRequest();
        request.setGameId(game.getGameId());
        request.setRateeId(ratee.getUserId());
        request.setRating(5);
        request.setComment("Great!");

        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
        when(userRepository.findById(rater.getUserId())).thenReturn(Optional.of(rater));
        when(userRepository.findById(ratee.getUserId())).thenReturn(Optional.of(ratee));

        GameParticipation raterPart = new GameParticipation();
        raterPart.setAttendanceStatus(GameParticipation.AttendanceStatus.ATTENDED);
        when(gameParticipationRepository.findByGameAndUser(game.getGameId(), rater.getUserId()))
                .thenReturn(Optional.of(raterPart));

        GameParticipation rateePart = new GameParticipation();
        rateePart.setAttendanceStatus(GameParticipation.AttendanceStatus.ATTENDED);
        when(gameParticipationRepository.findByGameAndUser(game.getGameId(), ratee.getUserId()))
                .thenReturn(Optional.of(rateePart));

        when(playerRatingRepository.existsByGameGameIdAndRaterUserIdAndRateeUserId(game.getGameId(), rater.getUserId(), ratee.getUserId()))
                .thenReturn(false);

        when(playerRatingRepository.save(any(PlayerRating.class))).thenAnswer(i -> {
            PlayerRating saved = i.getArgument(0);
            saved.setRatingId(UUID.randomUUID());
            return saved;
        });

        PlayerRatingDto.Response response = playerRatingService.createRating(rater.getUserId(), request);

        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertFalse(response.isFlagged());
        verify(playerRatingRepository, times(1)).save(any(PlayerRating.class));
    }

    @Test
    void createRating_ProfanityFlagged() {
        PlayerRatingDto.CreateRequest request = new PlayerRatingDto.CreateRequest();
        request.setGameId(game.getGameId());
        request.setRateeId(ratee.getUserId());
        request.setRating(2);
        request.setComment("You are an idiot!"); // Contains profanity

        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
        when(userRepository.findById(rater.getUserId())).thenReturn(Optional.of(rater));
        when(userRepository.findById(ratee.getUserId())).thenReturn(Optional.of(ratee));

        GameParticipation part = new GameParticipation();
        part.setAttendanceStatus(GameParticipation.AttendanceStatus.ATTENDED);
        when(gameParticipationRepository.findByGameAndUser(game.getGameId(), rater.getUserId())).thenReturn(Optional.of(part));
        when(gameParticipationRepository.findByGameAndUser(game.getGameId(), ratee.getUserId())).thenReturn(Optional.of(part));

        when(playerRatingRepository.existsByGameGameIdAndRaterUserIdAndRateeUserId(game.getGameId(), rater.getUserId(), ratee.getUserId()))
                .thenReturn(false);

        when(playerRatingRepository.save(any(PlayerRating.class))).thenAnswer(i -> {
            PlayerRating saved = i.getArgument(0);
            saved.setRatingId(UUID.randomUUID());
            return saved;
        });

        PlayerRatingDto.Response response = playerRatingService.createRating(rater.getUserId(), request);

        assertTrue(response.isFlagged());
    }

    @Test
    void createRating_SelfRating_ThrowsIllegalArgumentException() {
        PlayerRatingDto.CreateRequest request = new PlayerRatingDto.CreateRequest();
        request.setGameId(game.getGameId());
        request.setRateeId(rater.getUserId());

        assertThrows(IllegalArgumentException.class, () -> playerRatingService.createRating(rater.getUserId(), request));
    }

    @Test
    void createRating_GameNotCompleted_ThrowsException() {
        game.setStatus(Game.GameStatus.SCHEDULED);
        PlayerRatingDto.CreateRequest request = new PlayerRatingDto.CreateRequest();
        request.setGameId(game.getGameId());
        request.setRateeId(ratee.getUserId());

        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));

        assertThrows(IllegalArgumentException.class, () -> playerRatingService.createRating(rater.getUserId(), request));
    }

    @Test
    void createRating_AlreadyRated_ThrowsException() {
        PlayerRatingDto.CreateRequest request = new PlayerRatingDto.CreateRequest();
        request.setGameId(game.getGameId());
        request.setRateeId(ratee.getUserId());
        request.setRating(5);

        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
        when(userRepository.findById(rater.getUserId())).thenReturn(Optional.of(rater));
        when(userRepository.findById(ratee.getUserId())).thenReturn(Optional.of(ratee));

        GameParticipation part = new GameParticipation();
        part.setAttendanceStatus(GameParticipation.AttendanceStatus.ATTENDED);
        when(gameParticipationRepository.findByGameAndUser(any(), any())).thenReturn(Optional.of(part));

        when(playerRatingRepository.existsByGameGameIdAndRaterUserIdAndRateeUserId(game.getGameId(), rater.getUserId(), ratee.getUserId()))
                .thenReturn(true); // Already rated

        assertThrows(IllegalArgumentException.class, () -> playerRatingService.createRating(rater.getUserId(), request));
    }

    @Test
    void updateRating_Success() {
        PlayerRatingDto.UpdateRequest request = new PlayerRatingDto.UpdateRequest();
        request.setRating(5);
        request.setComment("Updated");

        when(playerRatingRepository.findById(rating.getRatingId())).thenReturn(Optional.of(rating));
        when(playerRatingRepository.save(any(PlayerRating.class))).thenReturn(rating);

        PlayerRatingDto.Response response = playerRatingService.updateRating(rater.getUserId(), rating.getRatingId(), request);

        assertEquals(5, response.getRating());
        assertEquals("Updated", response.getComment());
    }

    @Test
    void updateRating_Past24Hours_ThrowsException() {
        rating.setCreatedAt(Instant.now().minus(25, ChronoUnit.HOURS)); // Over 24 hours
        PlayerRatingDto.UpdateRequest request = new PlayerRatingDto.UpdateRequest();
        request.setRating(5);

        when(playerRatingRepository.findById(rating.getRatingId())).thenReturn(Optional.of(rating));

        assertThrows(IllegalArgumentException.class, () -> playerRatingService.updateRating(rater.getUserId(), rating.getRatingId(), request));
    }

    @Test
    void getRatingsForUser_Success() {
        when(playerRatingRepository.findByRateeUserId(ratee.getUserId())).thenReturn(List.of(rating));

        List<PlayerRatingDto.Response> responses = playerRatingService.getRatingsForUser(ratee.getUserId());

        assertEquals(1, responses.size());
        assertEquals(rating.getRatingId(), responses.get(0).getRatingId());
    }

    @Test
    void flagRating_Success() {
        when(playerRatingRepository.findById(rating.getRatingId())).thenReturn(Optional.of(rating));

        playerRatingService.flagRating(rating.getRatingId());

        assertTrue(rating.isFlagged());
        verify(playerRatingRepository, times(1)).save(rating);
    }

    @Test
    void createRating_RaterDidNotAttend_ThrowsException() {
        PlayerRatingDto.CreateRequest request = new PlayerRatingDto.CreateRequest();
        request.setGameId(game.getGameId());
        request.setRateeId(ratee.getUserId());
        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
        when(userRepository.findById(rater.getUserId())).thenReturn(Optional.of(rater));
        when(userRepository.findById(ratee.getUserId())).thenReturn(Optional.of(ratee));
        
        when(gameParticipationRepository.findByGameAndUser(game.getGameId(), rater.getUserId())).thenReturn(Optional.empty());
        
        assertThrows(IllegalArgumentException.class, () -> playerRatingService.createRating(rater.getUserId(), request));
    }

    @Test
    void updateRating_WrongRater_ThrowsException() {
        PlayerRatingDto.UpdateRequest request = new PlayerRatingDto.UpdateRequest();
        when(playerRatingRepository.findById(rating.getRatingId())).thenReturn(Optional.of(rating));
        
        assertThrows(IllegalArgumentException.class, () -> playerRatingService.updateRating(UUID.randomUUID(), rating.getRatingId(), request));
    }

    @Test
    void createRating_NullComment_Success() {
        PlayerRatingDto.CreateRequest request = new PlayerRatingDto.CreateRequest();
        request.setGameId(game.getGameId());
        request.setRateeId(ratee.getUserId());
        request.setRating(5);
        request.setComment(null);

        when(gameRepository.findById(game.getGameId())).thenReturn(Optional.of(game));
        when(userRepository.findById(rater.getUserId())).thenReturn(Optional.of(rater));
        when(userRepository.findById(ratee.getUserId())).thenReturn(Optional.of(ratee));

        GameParticipation part = new GameParticipation();
        part.setAttendanceStatus(GameParticipation.AttendanceStatus.ATTENDED);
        when(gameParticipationRepository.findByGameAndUser(any(), any())).thenReturn(Optional.of(part));

        when(playerRatingRepository.save(any())).thenAnswer(i -> {
            PlayerRating saved = i.getArgument(0);
            saved.setRatingId(UUID.randomUUID());
            return saved;
        });

        PlayerRatingDto.Response response = playerRatingService.createRating(rater.getUserId(), request);
        assertFalse(response.isFlagged());
    }
}
