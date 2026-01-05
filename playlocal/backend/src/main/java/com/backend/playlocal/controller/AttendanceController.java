package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.AttendanceDto;
import com.backend.playlocal.service.ReliabilityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/games/{gameId}/attendance")
public class AttendanceController {

    private final ReliabilityService reliabilityService;

    public AttendanceController(ReliabilityService reliabilityService) {
        this.reliabilityService = reliabilityService;
    }

    /**
     * Get participants pending attendance confirmation.
     * US-3.1: Organizer can view who needs attendance confirmation.
     */
    @GetMapping
    public ResponseEntity<List<AttendanceDto.AttendanceEntry>> getPendingAttendance(
            @PathVariable UUID gameId,
            Authentication authentication) {
        UUID organizerId = UUID.fromString(authentication.getName());
        List<AttendanceDto.AttendanceEntry> pending = reliabilityService.getPendingAttendance(gameId, organizerId);
        return ResponseEntity.ok(pending);
    }

    /**
     * Confirm attendance for participants.
     * US-3.1: Organizer confirms who attended/no-showed.
     * US-3.2: Reliability scores are updated based on attendance.
     */
    @PostMapping
    public ResponseEntity<AttendanceDto.AttendanceResponse> confirmAttendance(
            @PathVariable UUID gameId,
            @Valid @RequestBody AttendanceDto.ConfirmRequest request,
            Authentication authentication) {
        UUID organizerId = UUID.fromString(authentication.getName());
        AttendanceDto.AttendanceResponse response = reliabilityService.confirmAttendance(gameId, organizerId, request);
        return ResponseEntity.ok(response);
    }
}
