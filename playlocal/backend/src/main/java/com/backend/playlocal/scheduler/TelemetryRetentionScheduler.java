package com.backend.playlocal.scheduler;

import com.backend.playlocal.model.entity.RetentionPolicy;
import com.backend.playlocal.repository.AnalyticsEventRepository;
import com.backend.playlocal.repository.RetentionPolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Component
public class TelemetryRetentionScheduler {

    private static final Logger log = LoggerFactory.getLogger(TelemetryRetentionScheduler.class);
    private static final String ANALYTICS_EVENT_TARGET = "analytics_event";

    private final RetentionPolicyRepository retentionPolicyRepository;
    private final AnalyticsEventRepository analyticsEventRepository;

    public TelemetryRetentionScheduler(
            RetentionPolicyRepository retentionPolicyRepository,
            AnalyticsEventRepository analyticsEventRepository) {
        this.retentionPolicyRepository = retentionPolicyRepository;
        this.analyticsEventRepository = analyticsEventRepository;
    }

    @Scheduled(cron = "${retention.analytics.cron:0 15 2 * * *}", zone = "UTC")
    @Transactional
    public void cleanupOldTelemetry() {
        Optional<RetentionPolicy> maybePolicy = retentionPolicyRepository.findByTargetName(ANALYTICS_EVENT_TARGET);
        if (maybePolicy.isEmpty()) {
            log.warn("[retention] No retention policy found for target={}", ANALYTICS_EVENT_TARGET);
            return;
        }

        RetentionPolicy policy = maybePolicy.get();
        if (!Boolean.TRUE.equals(policy.getEnabled())) {
            log.info("[retention] Policy disabled for target={}", ANALYTICS_EVENT_TARGET);
            return;
        }

        if (policy.getDeletionMode() != RetentionPolicy.DeletionMode.HARD_DELETE) {
            log.warn("[retention] Unsupported deletion mode={} for target={}",
                    policy.getDeletionMode(), ANALYTICS_EVENT_TARGET);
            return;
        }

        Instant cutoff = Instant.now().minus(policy.getRetentionDays(), ChronoUnit.DAYS);
        int deleted = analyticsEventRepository.deleteByOccurredAtBefore(cutoff);

        log.info("[retention] target={} mode={} retentionDays={} cutoff={} deletedRows={}",
                ANALYTICS_EVENT_TARGET,
                policy.getDeletionMode(),
                policy.getRetentionDays(),
                cutoff,
                deleted);
    }
}