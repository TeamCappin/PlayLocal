package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "content_visibility")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentVisibility {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "content_visibility_id")
    private UUID contentVisibilityId;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;
}
