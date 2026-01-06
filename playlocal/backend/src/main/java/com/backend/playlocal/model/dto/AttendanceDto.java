package com.backend.playlocal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class AttendanceDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfirmRequest {
        private List<AttendanceEntry> attendances;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceEntry {
        private String participationId;
        private String attendanceStatus; // ATTENDED, NO_SHOW
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceResponse {
        private String gameId;
        private int attendedCount;
        private int noShowCount;
        private List<UpdatedScore> updatedScores;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatedScore {
        private String userId;
        private String displayName;
        private float previousScore;
        private float newScore;
        private String attendanceStatus;
    }
}
