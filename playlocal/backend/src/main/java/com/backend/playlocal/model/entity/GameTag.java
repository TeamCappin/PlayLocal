package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "game_tag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "tag_id")
    private UUID tagId;

    @Column(name = "tag_type", nullable = false, length = 50)
    private String tagType; // 'community', 'language', etc.

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "is_system_tag")
    @Builder.Default
    private Boolean isSystemTag = false;

    @Column(name = "is_restricted")
    @Builder.Default
    private Boolean isRestricted = false; // If true, requires user confirmation on join
}
