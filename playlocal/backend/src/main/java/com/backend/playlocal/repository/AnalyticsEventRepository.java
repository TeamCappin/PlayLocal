package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.AnalyticsEvent;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, UUID> {

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("DELETE FROM AnalyticsEvent ae WHERE ae.occurredAt < :cutoff")
	int deleteByOccurredAtBefore(@Param("cutoff") Instant cutoff);
}
