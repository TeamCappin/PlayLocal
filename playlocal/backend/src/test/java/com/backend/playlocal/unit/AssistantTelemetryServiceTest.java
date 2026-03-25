package com.backend.playlocal.unit;

import com.backend.playlocal.model.entity.AnalyticsEvent;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.repository.AnalyticsEventRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.service.AssistantTelemetryService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssistantTelemetryServiceTest {

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GameRepository gameRepository;
    @Mock
    private ObjectMapper objectMapper;

    private AssistantTelemetryService service;

    @BeforeEach
    void setUp() {
        service = new AssistantTelemetryService(
                analyticsEventRepository, userRepository, gameRepository, objectMapper);
    }

    @Test
    @DisplayName("recordEvent resolves user/game and saves analytics row with JSON props")
    void recordEvent_SavesAnalyticsRow() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID gameId = UUID.randomUUID();
        User user = User.builder().userId(userId).email("a@b.com").build();
        Game game = Game.builder().gameId(gameId).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(gameRepository.findById(gameId)).thenReturn(Optional.of(game));
        when(objectMapper.writeValueAsString(Map.of("context", "discover"))).thenReturn("{\"context\":\"discover\"}");
        when(analyticsEventRepository.save(any(AnalyticsEvent.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.recordEvent(
                AssistantTelemetryService.ASSISTANT_MESSAGE_SENT,
                userId,
                "session-1",
                gameId,
                Map.of("context", "discover"));

        ArgumentCaptor<AnalyticsEvent> captor = ArgumentCaptor.forClass(AnalyticsEvent.class);
        verify(analyticsEventRepository).save(captor.capture());
        AnalyticsEvent saved = captor.getValue();

        assertThat(saved.getEventName()).isEqualTo(AssistantTelemetryService.ASSISTANT_MESSAGE_SENT);
        assertThat(saved.getSessionId()).isEqualTo("session-1");
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getGame()).isEqualTo(game);
        assertThat(saved.getPropertiesJson()).isEqualTo("{\"context\":\"discover\"}");
    }

    @Test
    @DisplayName("recordEvent handles null references and JSON failure gracefully")
    void recordEvent_NullsAndJsonFailure_Fallbacks() throws Exception {
        when(objectMapper.writeValueAsString(Map.of())).thenThrow(new JsonProcessingException("bad json") {
        });
        when(analyticsEventRepository.save(any(AnalyticsEvent.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.recordEvent("assistant_custom_event", null, "session-x", null, null);

        ArgumentCaptor<AnalyticsEvent> captor = ArgumentCaptor.forClass(AnalyticsEvent.class);
        verify(analyticsEventRepository).save(captor.capture());
        AnalyticsEvent saved = captor.getValue();

        assertThat(saved.getUser()).isNull();
        assertThat(saved.getGame()).isNull();
        assertThat(saved.getPropertiesJson()).isEqualTo("{}");
        assertThat(saved.getEventName()).isEqualTo("assistant_custom_event");
    }
}
