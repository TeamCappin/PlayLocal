package com.backend.playlocal.model.dto;

import lombok.*;

import java.util.List;

/**
 * DTOs for the Stats & Analytics endpoints.
 * US-7.6: Stats & Analytics Dashboard + Metric Explanations
 */
public class StatsDto {

    /**
     * A single data point for a chart series.
     * For skill trend: date is a "yyyy-MM" month string, value is the cumulative average skill score (0–100).
     * For show-up rate / attendance rate: date is a "yyyy-MM" month string, value is the rate (0–100).
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPoint {
        /** ISO-8601 instant or "yyyy-MM" month string depending on the metric. */
        private String date;
        /** Numeric value (score or percentage rate 0–100). */
        private double value;
    }

    /**
     * Standard response shape for all three metrics.
     * <ul>
     *   <li>When data exists: {@code empty=false}, {@code value} is set, {@code dataPoints} is populated.</li>
     *   <li>When no data exists: {@code empty=true}, {@code value} is null, {@code dataPoints} is empty.</li>
     * </ul>
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        /** Metric identifier: "show_up_rate", "skill_trend", or "attendance_rate". */
        private String metric;

        /**
         * Aggregate value for the timeframe.
         * Show-up rate / attendance rate: percentage (0–100, one decimal place).
         * Skill trend: cumulative average skill score (0–100).
         * Null when {@code empty} is true.
         */
        private Double value;

        /** Requested timeframe: "30", "90", or "all". */
        private String timeframe;

        /** Ordered list of data points for charting. Empty list when {@code empty} is true. */
        @Builder.Default
        private List<DataPoint> dataPoints = List.of();

        /**
         * True when the user has no data for this metric in the requested timeframe.
         * The frontend should render an empty-state instead of a broken chart.
         */
        @Builder.Default
        private boolean empty = false;
    }
}
