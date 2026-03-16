package com.backend.playlocal.controller;

import com.backend.playlocal.model.dto.StatsDto;
import com.backend.playlocal.service.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for Stats & Analytics endpoints.
 * US-7.6: Dashboard + Metric Explanations
 *
 * <p>All endpoints are authenticated (Spring Security JWT guard).
 * Timeframe param accepts "30" (30 days), "90" (90 days), or "all" (all-time).
 * Invalid timeframe returns 400 via {@link com.backend.playlocal.exception.GlobalExceptionHandler}.
 */
@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    /**
     * Show-up rate for the authenticated user.
     * Show-up rate = percentage of games (where attendance was formally confirmed) that the user attended.
     *
     * <p>GET /api/v1/stats/show-up-rate?timeframe=30|90|all
     *
     * @param timeframe "30", "90", or "all" (default "30")
     * @param authentication injected by Spring Security
     * @return 200 with {@link StatsDto.StatsResponse}; {@code empty=true} when no data exists
     */
    @GetMapping("/show-up-rate")
    public ResponseEntity<StatsDto.StatsResponse> getShowUpRate(
            @RequestParam(defaultValue = "30") String timeframe,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(statsService.getShowUpRate(userId, timeframe));
    }

    /**
     * Skill trend for the authenticated user.
     * DataPoints reflect the user's skill/intensity-derived average scores from completed games, grouped chronologically by month.
     *
     * <p>GET /api/v1/stats/skill-trend?timeframe=30|90|all
     *
     * @param timeframe "30", "90", or "all" (default "30")
     * @param authentication injected by Spring Security
     * @return 200 with {@link StatsDto.StatsResponse}; {@code empty=true} when no data exists
     */
    @GetMapping("/skill-trend")
    public ResponseEntity<StatsDto.StatsResponse> getSkillTrend(
            @RequestParam(defaultValue = "30") String timeframe,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(statsService.getSkillTrend(userId, timeframe));
    }

    /**
     * Attendance rate for the authenticated user.
     * Attendance rate = percentage of confirmed games (including those without formal confirmation)
     * that the user attended.
     *
     * <p>GET /api/v1/stats/attendance-rate?timeframe=30|90|all
     *
     * @param timeframe "30", "90", or "all" (default "30")
     * @param authentication injected by Spring Security
     * @return 200 with {@link StatsDto.StatsResponse}; {@code empty=true} when no data exists
     */
    @GetMapping("/attendance-rate")
    public ResponseEntity<StatsDto.StatsResponse> getAttendanceRate(
            @RequestParam(defaultValue = "30") String timeframe,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(statsService.getAttendanceRate(userId, timeframe));
    }
}
