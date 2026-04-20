package com.backend.playlocal.unit;

import com.backend.playlocal.repository.AnalyticsEventRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@ActiveProfiles("test")
class AnalyticsEventRepositoryTest {

    @Autowired
    private AnalyticsEventRepository analyticsEventRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("deleteByOccurredAtBefore should delete only rows older than cutoff")
    void deleteByOccurredAtBefore_DeletesOnlyOldRows() {
        UUID oldId = UUID.randomUUID();
        UUID freshId = UUID.randomUUID();

        entityManager.getEntityManager()
                .createNativeQuery("INSERT INTO analytics_event (event_id, event_name, occurred_at) VALUES (?1, ?2, ?3)")
                .setParameter(1, oldId)
                .setParameter(2, "assistant_message_sent")
                .setParameter(3, Instant.now().minus(40, ChronoUnit.DAYS))
                .executeUpdate();

        entityManager.getEntityManager()
                .createNativeQuery("INSERT INTO analytics_event (event_id, event_name, occurred_at) VALUES (?1, ?2, ?3)")
                .setParameter(1, freshId)
                .setParameter(2, "assistant_message_sent")
                .setParameter(3, Instant.now().minus(5, ChronoUnit.DAYS))
                .executeUpdate();

        entityManager.flush();

        int deleted = analyticsEventRepository.deleteByOccurredAtBefore(Instant.now().minus(30, ChronoUnit.DAYS));

        assertThat(deleted).isEqualTo(1);
        assertThat(analyticsEventRepository.existsById(oldId)).isFalse();
        assertThat(analyticsEventRepository.existsById(freshId)).isTrue();
    }
}