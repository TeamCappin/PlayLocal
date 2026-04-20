package com.backend.playlocal.service;

import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.PrivacyPolicyDto;
import com.backend.playlocal.model.entity.PrivacyPolicyNotice;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.PrivacyPolicyNoticeRepository;
import com.backend.playlocal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PrivacyPolicyService {

  private static final Logger log = LoggerFactory.getLogger(PrivacyPolicyService.class);
  private static final LocalDate INITIAL_LAST_UPDATED = LocalDate.of(2026, 4, 15);
  private static final short SINGLE_NOTICE_ID = 1;
  private static final long NOTICE_WINDOW_DAYS = 30;
  private static final String POLICY_UPDATE_ADMIN_EMAIL = "playlocal.mgdfd@simplelogin.com";

  private final UserRepository userRepository;
  private final PrivacyPolicyNoticeRepository privacyPolicyNoticeRepository;
  private final EmailService emailService;

  public PrivacyPolicyService(
      UserRepository userRepository,
      PrivacyPolicyNoticeRepository privacyPolicyNoticeRepository,
      EmailService emailService
  ) {
    this.userRepository = userRepository;
    this.privacyPolicyNoticeRepository = privacyPolicyNoticeRepository;
    this.emailService = emailService;
  }

  public PrivacyPolicyDto.StatusResponse getStatus() {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    Optional<PrivacyPolicyNotice> notice = privacyPolicyNoticeRepository.findById(SINGLE_NOTICE_ID);

    if (notice.isEmpty()) {
      return PrivacyPolicyDto.StatusResponse.builder()
          .lastUpdated(INITIAL_LAST_UPDATED.toString())
          .effectiveDate(INITIAL_LAST_UPDATED.toString())
          .updatedByEmail(null)
          .bannerVisible(false)
          .notice(buildNotice(INITIAL_LAST_UPDATED))
          .build();
    }

    return toStatusResponse(notice.get(), today);
  }

  public synchronized PrivacyPolicyDto.UpdateResponse triggerUpdate(
      String authenticatedUserId,
      String triggeredByEmail
  ) {
    UUID userId = UUID.fromString(authenticatedUserId);
    User actor = userRepository.findActiveById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (!POLICY_UPDATE_ADMIN_EMAIL.equalsIgnoreCase(actor.getEmail())) {
      throw new AccessDeniedException("Access denied");
    }

    if (triggeredByEmail != null && !triggeredByEmail.isBlank()) {
      String requestedEmail = triggeredByEmail.trim();
      if (!actor.getEmail().equalsIgnoreCase(requestedEmail)) {
        log.warn("Privacy policy update requested by {} but authenticated as {}",
            requestedEmail, actor.getEmail());
      }
    }

    LocalDate updatedDate = LocalDate.now(ZoneOffset.UTC);
    LocalDate effectiveDate = updatedDate.plusDays(NOTICE_WINDOW_DAYS);
    List<User> recipients = userRepository.findAllActiveUsers();

    String notice = buildNotice(effectiveDate);
    PrivacyPolicyNotice persistedNotice = privacyPolicyNoticeRepository
        .findById(SINGLE_NOTICE_ID)
        .orElse(PrivacyPolicyNotice.builder().noticeId(SINGLE_NOTICE_ID).build());

    persistedNotice.setLastUpdated(updatedDate);
    persistedNotice.setEffectiveDate(effectiveDate);
    persistedNotice.setUpdatedByEmail(actor.getEmail());
    persistedNotice.setRecipientsTargeted(recipients.size());
    persistedNotice.setEmailsSent(0);
    persistedNotice.setEmailsFailed(0);
    privacyPolicyNoticeRepository.save(persistedNotice);

    int emailsSent = 0;
    int emailsFailed = 0;
    for (User recipient : recipients) {
      boolean sent = false;
      try {
        sent = emailService.sendPrivacyPolicyUpdateEmail(
            recipient.getEmail(),
            effectiveDate.toString(),
            notice);
      } catch (Exception ex) {
        log.warn("Failed to send privacy policy update email to {}: {}",
            recipient.getEmail(), ex.getMessage());
      }

      if (sent) {
        emailsSent++;
      } else {
        emailsFailed++;
      }
    }

    persistedNotice.setEmailsSent(emailsSent);
    persistedNotice.setEmailsFailed(emailsFailed);
    privacyPolicyNoticeRepository.save(persistedNotice);

    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    return toUpdateResponse(persistedNotice, today);
  }

  public static String getPolicyUpdateAdminEmail() {
    return POLICY_UPDATE_ADMIN_EMAIL;
  }

  private PrivacyPolicyDto.StatusResponse toStatusResponse(
      PrivacyPolicyNotice currentState,
      LocalDate today
  ) {
    return PrivacyPolicyDto.StatusResponse.builder()
        .lastUpdated(currentState.getLastUpdated().toString())
        .effectiveDate(currentState.getEffectiveDate().toString())
        .updatedByEmail(currentState.getUpdatedByEmail())
        .bannerVisible(isBannerVisible(today, currentState.getEffectiveDate()))
        .notice(buildNotice(currentState.getEffectiveDate()))
        .build();
  }

  private PrivacyPolicyDto.UpdateResponse toUpdateResponse(
      PrivacyPolicyNotice currentState,
      LocalDate today
  ) {
    return PrivacyPolicyDto.UpdateResponse.builder()
        .lastUpdated(currentState.getLastUpdated().toString())
        .effectiveDate(currentState.getEffectiveDate().toString())
        .updatedByEmail(currentState.getUpdatedByEmail())
        .bannerVisible(isBannerVisible(today, currentState.getEffectiveDate()))
        .notice(buildNotice(currentState.getEffectiveDate()))
        .recipientsTargeted(currentState.getRecipientsTargeted())
        .emailsSent(currentState.getEmailsSent())
        .emailsFailed(currentState.getEmailsFailed())
        .build();
  }

  private boolean isBannerVisible(LocalDate today, LocalDate effectiveDate) {
    return today.isBefore(effectiveDate);
  }

  private String buildNotice(LocalDate effectiveDate) {
    return "Please take a moment to review our updated Privacy Policy. Continued use of PlayLocal after " + effectiveDate
        + " constitutes acknowledgement and acceptance of these changes.";
  }
}