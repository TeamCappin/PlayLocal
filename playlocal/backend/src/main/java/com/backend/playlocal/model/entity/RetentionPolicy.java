package com.backend.playlocal.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "retention_policy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetentionPolicy {

    public enum DeletionMode {
        HARD_DELETE,
        ANONYMIZE
    }

    @Id
    @Column(name = "policy_id")
    private Short policyId;

    @Column(name = "target_name", nullable = false, unique = true)
    private String targetName;

    @Column(name = "retention_days", nullable = false)
    private Integer retentionDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "deletion_mode", nullable = false)
    private DeletionMode deletionMode;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}