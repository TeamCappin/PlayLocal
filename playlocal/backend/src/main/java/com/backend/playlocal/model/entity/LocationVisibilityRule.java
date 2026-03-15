package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "location_visibility_rule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationVisibilityRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "location_visibility_rule_id")
    private UUID locationVisibilityRuleId;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;
}
