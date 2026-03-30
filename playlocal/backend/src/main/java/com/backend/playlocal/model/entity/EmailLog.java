package com.backend.playlocal.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "email_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailLog {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "email_log_id")
  private UUID emailLogId;

  @Column(name = "recipient_email", nullable = false)
  private String recipientEmail;

  @Column(name = "subject", nullable = false)
  private String subject;

  @Column(name = "email_type", nullable = false)
  private String emailType;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  @Builder.Default
  private EmailStatus status = EmailStatus.PENDING;

  @Column(name = "provider_message_id")
  private String providerMessageId;

  @Column(name = "error_message")
  private String errorMessage;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private Instant createdAt = Instant.now();

  public enum EmailStatus {
    PENDING, SENT, FAILED
  }
}
