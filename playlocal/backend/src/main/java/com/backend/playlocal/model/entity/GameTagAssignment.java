package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "game_tag_assignment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameTagAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "game_tag_assignment_id")
    private UUID gameTagAssignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.EAGER) // EAGER for easy tag access
    @JoinColumn(name = "tag_id", nullable = false)
    private GameTag tag;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
