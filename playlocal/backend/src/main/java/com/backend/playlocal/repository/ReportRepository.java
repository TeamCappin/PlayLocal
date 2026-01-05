package com.backend.playlocal.repository;

import com.backend.playlocal.model.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    @Query("SELECT r FROM Report r WHERE r.status = 'OPEN' ORDER BY r.createdAt ASC")
    List<Report> findOpenReports();

    @Query("SELECT r FROM Report r WHERE r.status IN ('OPEN', 'UNDER_REVIEW') ORDER BY r.createdAt ASC")
    List<Report> findPendingReports();

    @Query("SELECT r FROM Report r WHERE r.reportedUser.userId = :userId ORDER BY r.createdAt DESC")
    List<Report> findByReportedUser(UUID userId);

    @Query("SELECT r FROM Report r WHERE r.reporter.userId = :userId ORDER BY r.createdAt DESC")
    List<Report> findByReporter(UUID userId);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.reporter.userId = :userId AND r.createdAt > :since")
    int countRecentReportsByUser(UUID userId, java.time.Instant since);
}
