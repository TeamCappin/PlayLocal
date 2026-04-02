package com.backend.playlocal.model.dto;

import lombok.Builder;
import lombok.Data;

public class WeatherDto {

    private WeatherDto() {}

    @Data
    @Builder
    public static class WeatherForecast {
        private boolean forecastAvailable;

        /**
         * Populated only when forecastAvailable=false.
         * Values: INDOOR_GAME | PAST_GAME | TOO_FAR_AHEAD | NO_LOCATION | FORECAST_ERROR
         */
        private String unavailableReason;

        private Double temperatureCelsius;
        private Integer precipitationProbability;
        private Double windspeedKmh;

        private String condition;

        /** WMO weather code for icon mapping on the frontend. */
        private Integer conditionCode;

        private boolean locationHidden;
    }
}
