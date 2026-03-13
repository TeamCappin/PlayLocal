package com.backend.playlocal.service;

import com.backend.playlocal.config.RateLimitConfig;
import com.backend.playlocal.exception.DuplicateResourceException;
import com.backend.playlocal.exception.RateLimitExceededException;
import com.backend.playlocal.exception.ResourceNotFoundException;
import com.backend.playlocal.model.dto.ReportDto;
import com.backend.playlocal.model.entity.Endorsement;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.Report;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.EndorsementRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.ReportRepository;
import com.backend.playlocal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for reporting users and games.
 * Implements: US-4.1 (Report Issue)
 */
@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final EndorsementRepository endorsementRepository;
    private final RateLimitConfig rateLimitConfig;

    public ReportService(ReportRepository reportRepository, UserRepository userRepository,
            GameRepository gameRepository, EndorsementRepository endorsementRepository,
            RateLimitConfig rateLimitConfig) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.endorsementRepository = endorsementRepository;
        this.rateLimitConfig = rateLimitConfig;
    }

    /**
     * Create a report against a user or game.
     * US-4.1: Report Issue
     */
    @Transactional
    public ReportDto.ReportResponse createReport(ReportDto.CreateRequest request, UUID reporterId) {
        User reporter = userRepository.findActiveById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Rate limit check (2 reports per hour to avoid spam/abuse)
        int recentReports = reportRepository.countRecentReportsByUser(
                reporterId, Instant.now().minus(1, ChronoUnit.HOURS));
        if (recentReports >= rateLimitConfig.getReport().getMaxPerHour()) {
            throw new RateLimitExceededException("Report rate limit exceeded. Maximum " +
                    rateLimitConfig.getReport().getMaxPerHour() + " reports per hour.");
        }

        User reportedUser = null;
        Game game = null;
        Endorsement endorsement = null;

        // Validate target (either user, game, or endorsement)
        if (request.getReportedUserId() != null) {
            reportedUser = userRepository.findActiveById(UUID.fromString(request.getReportedUserId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Reported user not found"));

            if (reportedUser.getUserId().equals(reporterId)) {
                throw new IllegalArgumentException("Cannot report yourself");
            }
        }

        if (request.getGameId() != null) {
            game = gameRepository.findById(UUID.fromString(request.getGameId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Game not found"));
        }

        if (request.getEndorsementId() != null) {
            endorsement = endorsementRepository.findById(UUID.fromString(request.getEndorsementId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Endorsement not found"));
        }

        if (reportedUser == null && game == null && endorsement == null) {
            throw new IllegalArgumentException("Must specify either reportedUserId, gameId, or endorsementId");
        }

        Report.ReportType reportType;
        try {
            reportType = Report.ReportType.valueOf(request.getReportType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid report type: " + request.getReportType());
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .game(game)
                .endorsement(endorsement)
                .reportType(reportType)
                .details(request.getDetails())
                .status(Report.ReportStatus.OPEN)
                .build();

        report = reportRepository.save(report);

        return mapToResponse(report);
    }

    /**
     * Get moderation queue (moderators/admins only).
     * US-4.2: Moderation Queue
     */
    public List<ReportDto.ModerationQueueItem> getModerationQueue() {
        return reportRepository.findPendingReports().stream()
                .map(this::mapToQueueItem)
                .collect(Collectors.toList());
    }

    /**
     * Resolve a report (moderators/admins only).
     * US-4.2: Moderation Actions
     */
    @Transactional
    public ReportDto.ReportResponse resolveReport(UUID reportId, ReportDto.ResolveRequest request, UUID moderatorId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        User moderator = userRepository.findActiveById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Moderator not found"));

        Report.ReportStatus status;
        try {
            status = Report.ReportStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + request.getStatus());
        }

        report.setStatus(status);
        report.setResolutionAction(request.getResolutionAction());
        report.setHandledBy(moderator);
        report.setResolvedAt(Instant.now());

        // If action is "suspended", suspend the reported user
        if ("suspended".equalsIgnoreCase(request.getResolutionAction()) && report.getReportedUser() != null) {
            User reportedUser = report.getReportedUser();
            reportedUser.setStatus(User.UserStatus.SUSPENDED);
            userRepository.save(reportedUser);
        }

        report = reportRepository.save(report);

        return mapToResponse(report);
    }

    private ReportDto.ReportResponse mapToResponse(Report report) {
        return ReportDto.ReportResponse.builder()
                .reportId(report.getReportId().toString())
                .reporterUserId(report.getReporter().getUserId().toString())
                .reportedUserId(
                        report.getReportedUser() != null ? report.getReportedUser().getUserId().toString() : null)
                .gameId(report.getGame() != null ? report.getGame().getGameId().toString() : null)
                .endorsementId(report.getEndorsement() != null ? report.getEndorsement().getEndorsementId().toString() : null)
                .reportType(report.getReportType().name())
                .details(report.getDetails())
                .status(report.getStatus().name())
                .createdAt(report.getCreatedAt())
                .build();
    }

    private ReportDto.ModerationQueueItem mapToQueueItem(Report report) {
        return ReportDto.ModerationQueueItem.builder()
                .reportId(report.getReportId().toString())
                .reportType(report.getReportType().name())
                .status(report.getStatus().name())
                .reportedUserName(report.getReportedUser() != null ? report.getReportedUser().getDisplayName() : "N/A")
                .reporterUserName(report.getReporter().getDisplayName())
                .details(report.getDetails())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
