package com.backend.playlocal.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_privacy_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPrivacySettings {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_visibility_id")
    private ContentVisibility profileVisibility;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skills_visibility_id")
    private ContentVisibility skillsVisibility;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "history_visibility_id")
    private ContentVisibility historyVisibility;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "media_default_visibility_id")
    private ContentVisibility mediaDefaultVisibility;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_visibility_rule_id")
    private LocationVisibilityRule locationVisibilityRule;

    @Column(name = "allow_profile_search")
    @Builder.Default
    private Boolean allowProfileSearch = true;

    @Column(name = "ad_personalization_enabled")
    @Builder.Default
    private Boolean adPersonalizationEnabled = true;

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
