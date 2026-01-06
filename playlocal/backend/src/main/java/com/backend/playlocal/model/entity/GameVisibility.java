package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "game_visibility")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameVisibility {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "game_visibility_id")
    private UUID gameVisibilityId;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;
}
