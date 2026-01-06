package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.ReportDto;
import com.backend.playlocal.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Create a report against a user or game.
     * US-4.1: Report Issue
     */
    @PostMapping("/reports")
    public ResponseEntity<ReportDto.ReportResponse> createReport(
            @Valid @RequestBody ReportDto.CreateRequest request,
            Authentication authentication) {
        UUID reporterId = UUID.fromString(authentication.getName());
        ReportDto.ReportResponse response = reportService.createReport(request, reporterId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get moderation queue (moderators/admins only).
     * US-4.2: Moderation Queue
     */
    @GetMapping("/moderation/queue")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<List<ReportDto.ModerationQueueItem>> getModerationQueue() {
        List<ReportDto.ModerationQueueItem> queue = reportService.getModerationQueue();
        return ResponseEntity.ok(queue);
    }

    /**
     * Resolve a report (moderators/admins only).
     * US-4.2: Moderation Actions
     */
    @PostMapping("/moderation/reports/{reportId}/resolve")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<ReportDto.ReportResponse> resolveReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody ReportDto.ResolveRequest request,
            Authentication authentication) {
        UUID moderatorId = UUID.fromString(authentication.getName());
        ReportDto.ReportResponse response = reportService.resolveReport(reportId, request, moderatorId);
        return ResponseEntity.ok(response);
    }
}
