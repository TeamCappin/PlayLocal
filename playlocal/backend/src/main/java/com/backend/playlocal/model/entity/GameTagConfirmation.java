package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "game_tag_confirmation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameTagConfirmation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "confirmation_id")
    private UUID confirmationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    private GameTag tag;

    @Column(name = "confirmed_at")
    @Builder.Default
    private Instant confirmedAt = Instant.now();
}
