package com.backend.playlocal.service;

import com.backend.playlocal.model.entity.AnalyticsEvent;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.AnalyticsEventRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AssistantTelemetryService {

    private static final Logger log = LoggerFactory.getLogger(AssistantTelemetryService.class);
    private static final String TELEMETRY_MARKER = "[telemetry]";

    public static final String ASSISTANT_SESSION_STARTED = "assistant_session_started";
    public static final String ASSISTANT_MESSAGE_SENT = "assistant_message_sent";
    public static final String ASSISTANT_RESPONSE_ERROR = "assistant_response_error";

    private final AnalyticsEventRepository analyticsEventRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final ObjectMapper objectMapper;

    public AssistantTelemetryService(
            AnalyticsEventRepository analyticsEventRepository,
            UserRepository userRepository,
            GameRepository gameRepository,
            ObjectMapper objectMapper) {
        this.analyticsEventRepository = analyticsEventRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void recordEvent(
            String eventName,
            UUID userId,
            String sessionId,
            UUID gameId,
            Map<String, Object> properties) {
        Map<String, Object> props = properties != null ? new HashMap<>(properties) : new HashMap<>();
        log.info("{} event={} userId={} sessionId={} gameId={} props={}",
                TELEMETRY_MARKER, eventName, userId, sessionId, gameId, props);

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        Game game = gameId != null ? gameRepository.findById(gameId).orElse(null) : null;
        String json = toJson(props);

        AnalyticsEvent row = AnalyticsEvent.builder()
                .user(user)
                .game(game)
                .eventName(eventName)
                .propertiesJson(json)
                .sessionId(sessionId)
                .build();
        analyticsEventRepository.save(row);
    }

    private String toJson(Map<String, Object> props) {
        try {
            return objectMapper.writeValueAsString(props);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
