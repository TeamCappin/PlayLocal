package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "sport")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "sport_id")
    private UUID sportId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String name;

    @Column(length = 100)
    private String category;

    @Column(name = "supports_positions")
    @Builder.Default
    private Boolean supportsPositions = true;
}
