package com.backend.playlocal.service;

import com.backend.playlocal.model.dto.PrivacyPolicyDto;
import com.backend.playlocal.model.entity.PrivacyPolicyNotice;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.PrivacyPolicyNoticeRepository;
import com.backend.playlocal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrivacyPolicyServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private EmailService emailService;

    @Mock
    private PrivacyPolicyNoticeRepository privacyPolicyNoticeRepository;

  @InjectMocks
  private PrivacyPolicyService privacyPolicyService;

  private User actor;
  private User recipient;

  @BeforeEach
  void setUp() {
    actor = User.builder()
        .userId(UUID.randomUUID())
        .email("playlocal.mgdfd@simplelogin.com")
        .displayName("Actor")
        .slug("actor")
        .build();

    recipient = User.builder()
        .userId(UUID.randomUUID())
        .email("recipient@example.com")
        .displayName("Recipient")
        .slug("recipient")
        .build();
  }

  @Test
  void triggerUpdateUpdatesDateAndBroadcastsToAllActiveUsers() {
    when(userRepository.findActiveById(actor.getUserId())).thenReturn(Optional.of(actor));
    when(userRepository.findAllActiveUsers()).thenReturn(List.of(actor, recipient));
    when(privacyPolicyNoticeRepository.findById((short) 1)).thenReturn(Optional.empty());
    when(emailService.sendPrivacyPolicyUpdateEmail(anyString(), anyString(), anyString()))
        .thenReturn(true);

    PrivacyPolicyDto.UpdateResponse response = privacyPolicyService.triggerUpdate(
        actor.getUserId().toString(),
        actor.getEmail()
    );

    String today = LocalDate.now(ZoneOffset.UTC).toString();
    String effectiveDate = LocalDate.now(ZoneOffset.UTC).plusDays(30).toString();
    assertThat(response.getLastUpdated()).isEqualTo(today);
    assertThat(response.getEffectiveDate()).isEqualTo(effectiveDate);
    assertThat(response.isBannerVisible()).isTrue();
    assertThat(response.getUpdatedByEmail()).isEqualTo(actor.getEmail());
    assertThat(response.getRecipientsTargeted()).isEqualTo(2);
    assertThat(response.getEmailsSent()).isEqualTo(2);
    assertThat(response.getEmailsFailed()).isEqualTo(0);
    assertThat(response.getNotice())
        .contains("Continued use of PlayLocal after " + effectiveDate)
        .contains("acknowledgement and acceptance");

    ArgumentCaptor<String> effectiveDateCaptor = ArgumentCaptor.forClass(String.class);
    verify(emailService, times(2)).sendPrivacyPolicyUpdateEmail(
        anyString(),
        effectiveDateCaptor.capture(),
        anyString()
    );
    assertThat(effectiveDateCaptor.getValue()).isEqualTo(effectiveDate);
  }

  @Test
  void triggerUpdateAllowsMismatchedTriggeredByEmailAndContinues() {
    when(userRepository.findActiveById(actor.getUserId())).thenReturn(Optional.of(actor));
    when(userRepository.findAllActiveUsers()).thenReturn(List.of(recipient));
    when(privacyPolicyNoticeRepository.findById((short) 1)).thenReturn(Optional.empty());
    when(emailService.sendPrivacyPolicyUpdateEmail(anyString(), anyString(), anyString()))
        .thenReturn(true);

    PrivacyPolicyDto.UpdateResponse response = privacyPolicyService.triggerUpdate(
        actor.getUserId().toString(),
        "different-requester@example.com"
    );

    assertThat(response.getUpdatedByEmail()).isEqualTo(actor.getEmail());
    assertThat(response.getRecipientsTargeted()).isEqualTo(1);
    assertThat(response.getEmailsSent()).isEqualTo(1);
    assertThat(response.getEmailsFailed()).isEqualTo(0);
    verify(emailService, times(1)).sendPrivacyPolicyUpdateEmail(anyString(), anyString(), anyString());
  }

  @Test
  void triggerUpdateIgnoresBlankTriggeredByEmail() {
    when(userRepository.findActiveById(actor.getUserId())).thenReturn(Optional.of(actor));
    when(userRepository.findAllActiveUsers()).thenReturn(List.of(recipient));
    when(privacyPolicyNoticeRepository.findById((short) 1)).thenReturn(Optional.empty());
    when(emailService.sendPrivacyPolicyUpdateEmail(anyString(), anyString(), anyString()))
        .thenReturn(true);

    PrivacyPolicyDto.UpdateResponse response = privacyPolicyService.triggerUpdate(
        actor.getUserId().toString(),
        "   "
    );

    assertThat(response.getUpdatedByEmail()).isEqualTo(actor.getEmail());
    assertThat(response.getRecipientsTargeted()).isEqualTo(1);
    verify(emailService, times(1)).sendPrivacyPolicyUpdateEmail(anyString(), anyString(), anyString());
  }

  @Test
  void getStatusReturnsHiddenBannerWhenNoPersistedNoticeExists() {
    when(privacyPolicyNoticeRepository.findById((short) 1)).thenReturn(Optional.empty());

    PrivacyPolicyDto.StatusResponse response = privacyPolicyService.getStatus();

    assertThat(response.isBannerVisible()).isFalse();
    assertThat(response.getLastUpdated()).isEqualTo("2026-04-15");
    assertThat(response.getEffectiveDate()).isEqualTo("2026-04-15");
  }

  @Test
  void getStatusBoundary_HidesBannerOnEffectiveDateAndAfter() {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    PrivacyPolicyNotice notice = PrivacyPolicyNotice.builder()
        .noticeId((short) 1)
        .lastUpdated(today.minusDays(30))
        .effectiveDate(today)
        .updatedByEmail(actor.getEmail())
        .build();
    when(privacyPolicyNoticeRepository.findById((short) 1)).thenReturn(Optional.of(notice));

    PrivacyPolicyDto.StatusResponse response = privacyPolicyService.getStatus();

    assertThat(response.isBannerVisible()).isFalse();
  }

  @Test
  void triggerUpdateBoundary_PartialEmailFailureTracksCounts() {
    User recipientTwo = User.builder()
        .userId(UUID.randomUUID())
        .email("recipient-two@example.com")
        .displayName("Recipient Two")
        .slug("recipient-two")
        .build();

    when(userRepository.findActiveById(actor.getUserId())).thenReturn(Optional.of(actor));
    when(userRepository.findAllActiveUsers()).thenReturn(List.of(actor, recipient, recipientTwo));
    when(privacyPolicyNoticeRepository.findById((short) 1)).thenReturn(Optional.empty());
    when(emailService.sendPrivacyPolicyUpdateEmail(anyString(), anyString(), anyString()))
        .thenReturn(true)
        .thenThrow(new RuntimeException("smtp timeout"))
        .thenReturn(true);

    PrivacyPolicyDto.UpdateResponse response = privacyPolicyService.triggerUpdate(
        actor.getUserId().toString(),
        actor.getEmail()
    );

    assertThat(response.getRecipientsTargeted()).isEqualTo(3);
    assertThat(response.getEmailsSent()).isEqualTo(2);
    assertThat(response.getEmailsFailed()).isEqualTo(1);
    verify(emailService, times(3)).sendPrivacyPolicyUpdateEmail(anyString(), anyString(), anyString());
  }

  @Test
  void triggerUpdateBoundary_NoRecipientsSendsNoEmail() {
    when(userRepository.findActiveById(actor.getUserId())).thenReturn(Optional.of(actor));
    when(userRepository.findAllActiveUsers()).thenReturn(List.of());
    when(privacyPolicyNoticeRepository.findById((short) 1)).thenReturn(Optional.empty());

    PrivacyPolicyDto.UpdateResponse response = privacyPolicyService.triggerUpdate(
        actor.getUserId().toString(),
        actor.getEmail()
    );

    assertThat(response.getRecipientsTargeted()).isZero();
    assertThat(response.getEmailsSent()).isZero();
    assertThat(response.getEmailsFailed()).isZero();
    verify(emailService, never()).sendPrivacyPolicyUpdateEmail(anyString(), anyString(), anyString());
  }

    @Test
    void triggerUpdateRejectsNonAdminUser() {
        User nonAdmin = User.builder()
                .userId(UUID.randomUUID())
                .email("not-admin@example.com")
                .displayName("Not Admin")
                .slug("not-admin")
                .build();

        when(userRepository.findActiveById(nonAdmin.getUserId())).thenReturn(Optional.of(nonAdmin));

        assertThatThrownBy(() -> privacyPolicyService.triggerUpdate(
                nonAdmin.getUserId().toString(),
                nonAdmin.getEmail()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");

        verifyNoInteractions(privacyPolicyNoticeRepository);
        verifyNoInteractions(emailService);
    }

      @Test
      void triggerUpdateRejectsNonAdminUserWhenTriggeredByEmailDiffers() {
        User nonAdmin = User.builder()
            .userId(UUID.randomUUID())
            .email("not-admin@example.com")
            .displayName("Not Admin")
            .slug("not-admin")
            .build();

        when(userRepository.findActiveById(nonAdmin.getUserId())).thenReturn(Optional.of(nonAdmin));

        assertThatThrownBy(() -> privacyPolicyService.triggerUpdate(
            nonAdmin.getUserId().toString(),
            "someone-else@example.com"))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("Access denied");

        verifyNoInteractions(privacyPolicyNoticeRepository);
        verifyNoInteractions(emailService);
      }
}