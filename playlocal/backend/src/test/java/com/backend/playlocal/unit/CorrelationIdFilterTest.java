package com.backend.playlocal.unit;

import com.backend.playlocal.security.CorrelationIdFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for CorrelationIdFilter.
 */
@ExtendWith(MockitoExtension.class)
class CorrelationIdFilterTest {

    private CorrelationIdFilter filter;

    @Mock
    private FilterChain filterChain;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        filter = new CorrelationIdFilter();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        MDC.clear();
    }

    // Acceptance test 1: request without X-Correlation-ID header

    @Test
    @DisplayName("US-11.5: Should generate a correlation ID when no header is present")
    void doFilter_NoHeader_GeneratesCorrelationId() throws ServletException, IOException {
        String[] capturedId = new String[1];
        doAnswer(inv -> {
            capturedId[0] = MDC.get(CorrelationIdFilter.MDC_KEY);
            return null;
        }).when(filterChain).doFilter(any(), any());

        filter.doFilter(request, response, filterChain);

        assertThat(capturedId[0])
                .as("Correlation ID must be set in MDC during request processing")
                .isNotNull()
                .isNotBlank();
    }

    @Test
    @DisplayName("US-11.5: Generated correlation ID should be a valid UUID")
    void doFilter_NoHeader_GeneratedIdIsUuid() throws ServletException, IOException {
        String[] capturedId = new String[1];
        doAnswer(inv -> {
            capturedId[0] = MDC.get(CorrelationIdFilter.MDC_KEY);
            return null;
        }).when(filterChain).doFilter(any(), any());

        filter.doFilter(request, response, filterChain);

        assertThat(capturedId[0])
                .as("Auto-generated correlation ID must be a UUID (8-4-4-4-12 hex chars)")
                .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
    }

    @Test
    @DisplayName("US-11.5: Generated correlation ID is echoed in X-Correlation-ID response header")
    void doFilter_NoHeader_EchosGeneratedIdInResponse() throws ServletException, IOException {
        String[] capturedId = new String[1];
        doAnswer(inv -> {
            capturedId[0] = MDC.get(CorrelationIdFilter.MDC_KEY);
            return null;
        }).when(filterChain).doFilter(any(), any());

        filter.doFilter(request, response, filterChain);

        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER))
                .as("Response header must carry the same ID that was placed in MDC")
                .isEqualTo(capturedId[0]);
    }

    // Acceptance test 2: request with existing X-Correlation-ID header

    @Test
    @DisplayName("US-11.5: Should reuse correlation ID from incoming X-Correlation-ID header")
    void doFilter_WithHeader_ReusesProvidedId() throws ServletException, IOException {
        String existingId = "trace-abc-123";
        request.addHeader(CorrelationIdFilter.CORRELATION_ID_HEADER, existingId);

        String[] capturedId = new String[1];
        doAnswer(inv -> {
            capturedId[0] = MDC.get(CorrelationIdFilter.MDC_KEY);
            return null;
        }).when(filterChain).doFilter(any(), any());

        filter.doFilter(request, response, filterChain);

        assertThat(capturedId[0])
                .as("Provided correlation ID must be present in MDC")
                .isEqualTo(existingId);
        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER))
                .as("Provided correlation ID must be echoed in response header")
                .isEqualTo(existingId);
    }

    // MDC lifecycle
    
    @Test
    @DisplayName("US-11.5: MDC correlation ID should be cleared after request completes")
    void doFilter_ClearsMdcAfterRequest() throws ServletException, IOException {
        filter.doFilter(request, response, filterChain);

        assertThat(MDC.get(CorrelationIdFilter.MDC_KEY))
                .as("MDC must be cleaned up after the request to avoid leakage between threads")
                .isNull();
    }

    @Test
    @DisplayName("US-11.5: MDC should be cleared even when filter chain throws an exception")
    void doFilter_ClearsMdcOnException() throws ServletException, IOException {
        doAnswer(inv -> {
            throw new RuntimeException("downstream failure");
        }).when(filterChain).doFilter(any(), any());

        try {
            filter.doFilter(request, response, filterChain);
        } catch (RuntimeException ignored) {
            // expected
        }

        assertThat(MDC.get(CorrelationIdFilter.MDC_KEY))
                .as("MDC must be cleared even on exception to prevent ID leakage")
                .isNull();
    }
    
    // Filter chain continuity

    @Test
    @DisplayName("US-11.5: Filter should always continue the filter chain")
    void doFilter_AlwaysContinuesFilterChain() throws ServletException, IOException {
        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("US-11.5: Two different requests should receive different generated IDs")
    void doFilter_TwoRequests_ReceiveDifferentIds() throws ServletException, IOException {
        String[] id1 = new String[1];
        String[] id2 = new String[1];

        doAnswer(inv -> { id1[0] = MDC.get(CorrelationIdFilter.MDC_KEY); return null; })
                .when(filterChain).doFilter(any(), any());
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), filterChain);

        doAnswer(inv -> { id2[0] = MDC.get(CorrelationIdFilter.MDC_KEY); return null; })
                .when(filterChain).doFilter(any(), any());
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), filterChain);

        assertThat(id1[0]).isNotEqualTo(id2[0]);
    }
}
