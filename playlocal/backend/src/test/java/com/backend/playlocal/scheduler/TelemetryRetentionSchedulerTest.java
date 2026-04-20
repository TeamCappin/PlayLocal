package com.backend.playlocal.scheduler;

import com.backend.playlocal.model.entity.RetentionPolicy;
import com.backend.playlocal.repository.AnalyticsEventRepository;
import com.backend.playlocal.repository.RetentionPolicyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TelemetryRetentionSchedulerTest {

    @Mock
    private RetentionPolicyRepository retentionPolicyRepository;

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;

    @InjectMocks
    private TelemetryRetentionScheduler scheduler;

    @Test
    void cleanupOldTelemetry_WhenPolicyMissing_DoesNothing() {
        when(retentionPolicyRepository.findByTargetName("analytics_event")).thenReturn(Optional.empty());

        scheduler.cleanupOldTelemetry();

        verify(analyticsEventRepository, never()).deleteByOccurredAtBefore(any());
    }

    @Test
    void cleanupOldTelemetry_WhenPolicyDisabled_DoesNothing() {
        RetentionPolicy policy = RetentionPolicy.builder()
                .policyId((short) 1)
                .targetName("analytics_event")
                .retentionDays(30)
                .deletionMode(RetentionPolicy.DeletionMode.HARD_DELETE)
                .enabled(false)
                .build();
        when(retentionPolicyRepository.findByTargetName("analytics_event")).thenReturn(Optional.of(policy));

        scheduler.cleanupOldTelemetry();

        verify(analyticsEventRepository, never()).deleteByOccurredAtBefore(any());
    }

    @Test
    void cleanupOldTelemetry_WhenModeIsAnonymize_DoesNothing() {
        RetentionPolicy policy = RetentionPolicy.builder()
                .policyId((short) 1)
                .targetName("analytics_event")
                .retentionDays(30)
                .deletionMode(RetentionPolicy.DeletionMode.ANONYMIZE)
                .enabled(true)
                .build();
        when(retentionPolicyRepository.findByTargetName("analytics_event")).thenReturn(Optional.of(policy));

        scheduler.cleanupOldTelemetry();

        verify(analyticsEventRepository, never()).deleteByOccurredAtBefore(any());
    }

    @Test
    void cleanupOldTelemetry_WhenPolicyEnabled_HardDeletesUsingCutoff() {
        RetentionPolicy policy = RetentionPolicy.builder()
                .policyId((short) 1)
                .targetName("analytics_event")
                .retentionDays(30)
                .deletionMode(RetentionPolicy.DeletionMode.HARD_DELETE)
                .enabled(true)
                .build();
        when(retentionPolicyRepository.findByTargetName("analytics_event")).thenReturn(Optional.of(policy));
        when(analyticsEventRepository.deleteByOccurredAtBefore(any())).thenReturn(3);

        scheduler.cleanupOldTelemetry();

        ArgumentCaptor<Instant> cutoffCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(analyticsEventRepository).deleteByOccurredAtBefore(cutoffCaptor.capture());

        Instant expected = Instant.now().minus(30, ChronoUnit.DAYS);
        Duration diff = Duration.between(cutoffCaptor.getValue(), expected).abs();
        assertThat(diff).isLessThan(Duration.ofSeconds(5));
    }
}