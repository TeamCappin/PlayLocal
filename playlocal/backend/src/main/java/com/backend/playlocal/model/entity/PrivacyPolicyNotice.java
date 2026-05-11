package com.backend.playlocal.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "privacy_policy_notice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacyPolicyNotice {

  @Id
  @Column(name = "notice_id")
  private Short noticeId;

  @Column(name = "last_updated", nullable = false)
  private LocalDate lastUpdated;

  @Column(name = "effective_date", nullable = false)
  private LocalDate effectiveDate;

  @Column(name = "updated_by_email")
  private String updatedByEmail;

  @Column(name = "recipients_targeted", nullable = false)
  @Builder.Default
  private Integer recipientsTargeted = 0;

  @Column(name = "emails_sent", nullable = false)
  @Builder.Default
  private Integer emailsSent = 0;

  @Column(name = "emails_failed", nullable = false)
  @Builder.Default
  private Integer emailsFailed = 0;

  @Column(name = "updated_at", nullable = false)
  @Builder.Default
  private Instant updatedAt = Instant.now();

  @PrePersist
  @PreUpdate
  void touchUpdatedAt() {
    this.updatedAt = Instant.now();
  }
}