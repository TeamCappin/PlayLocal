package com.backend.playlocal.service;

import com.backend.playlocal.model.entity.GameParticipation;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceAccountTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GameParticipationRepository gameParticipationRepository;

    @InjectMocks
    private UserService userService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setUserId(userId);
        user.setEmail("test@example.com");
        user.setDisplayName("Test User");
    }

    @Test
    void deactivateAccount_success() {
        // Arrange
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        GameParticipation futureGame1 = new GameParticipation();
        GameParticipation futureGame2 = new GameParticipation();
        List<GameParticipation> futureParticipations = List.of(futureGame1, futureGame2);

        when(gameParticipationRepository.findByUserIdAndGameStartTimeAfter(eq(userId), any(Instant.class)))
            .thenReturn(futureParticipations);

        // Act
        userService.deactivateAccount(userId);

        // Assert
        assertNotNull(user.getDeletedAt());
        verify(userRepository).save(user);
        verify(gameParticipationRepository, times(2)).save(any(GameParticipation.class));
        assertNotNull(futureGame1.getLeftAt());
        assertNotNull(futureGame2.getLeftAt());
    }

    @Test
    void deactivateAccount_userNotFound() {
        // Arrange
        when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> userService.deactivateAccount(userId)
        );

        assertEquals("User not found", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void deactivateAccount_noFutureGames() {
        // Arrange
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(gameParticipationRepository.findByUserIdAndGameStartTimeAfter(eq(userId), any(Instant.class)))
            .thenReturn(new ArrayList<>());

        // Act
        userService.deactivateAccount(userId);

        // Assert
        assertNotNull(user.getDeletedAt());
        verify(userRepository).save(user);
        verify(gameParticipationRepository, never()).save(any());
    }

    @Test
    void deleteAccount_success() {
        // Arrange
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        GameParticipation futureGame = new GameParticipation();
        List<GameParticipation> futureParticipations = List.of(futureGame);

        when(gameParticipationRepository.findByUserIdAndGameStartTimeAfter(eq(userId), any(Instant.class)))
            .thenReturn(futureParticipations);

        // Act
        userService.deleteAccount(userId);

        // Assert
        assertNotNull(user.getDeletedAt());
        // Verify deletedAt is backdated for immediate purge
        assertTrue(user.getDeletedAt().isBefore(Instant.now()));
        verify(userRepository).save(user);
        verify(gameParticipationRepository).save(any(GameParticipation.class));
        assertNotNull(futureGame.getLeftAt());
    }

    @Test
    void deleteAccount_userNotFound() {
        // Arrange
        when(userRepository.findActiveById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> userService.deleteAccount(userId)
        );

        assertEquals("User not found", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteAccount_deletedAtIsBackdated() {
        // Arrange
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));
        when(gameParticipationRepository.findByUserIdAndGameStartTimeAfter(eq(userId), any(Instant.class)))
            .thenReturn(new ArrayList<>());

        Instant beforeDelete = Instant.now();

        // Act
        userService.deleteAccount(userId);

        // Assert
        assertNotNull(user.getDeletedAt());
        // DeletedAt should be at least 1 day in the past
        assertTrue(user.getDeletedAt().isBefore(beforeDelete.minus(23, ChronoUnit.HOURS)));
        verify(userRepository).save(user);
    }

    @Test
    void deleteAccount_removesFromMultipleFutureGames() {
        // Arrange
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(user));

        List<GameParticipation> futureParticipations = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            futureParticipations.add(new GameParticipation());
        }

        when(gameParticipationRepository.findByUserIdAndGameStartTimeAfter(eq(userId), any(Instant.class)))
            .thenReturn(futureParticipations);

        // Act
        userService.deleteAccount(userId);

        // Assert
        verify(gameParticipationRepository, times(5)).save(any(GameParticipation.class));
        futureParticipations.forEach(participation ->
            assertNotNull(participation.getLeftAt())
        );
    }
}
