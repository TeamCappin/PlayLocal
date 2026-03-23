import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssistantChatPanel } from '@/components/assistant/AssistantChatPanel';

const mockUseAuth = jest.fn();
const mockChat = jest.fn();
const mockTelemetry = jest.fn();
const mockSessionId = jest.fn(() => 'sess-1');

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/lib/assistantSession', () => ({
  getOrCreateAssistantSessionId: () => mockSessionId(),
  sessionStartedTelemetryKey: (sessionId: string) =>
    `playlocal_assistant_sess_started_${sessionId}`,
}));

jest.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number;
    data?: unknown;
    constructor(status: number, message: string, data?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  return {
    aiApi: {
      chat: (...args: unknown[]) => mockChat(...args),
      telemetry: (...args: unknown[]) => mockTelemetry(...args),
    },
    ApiError,
  };
});

describe('AssistantChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockChat.mockResolvedValue({
      message: { role: 'assistant', content: 'Hello from assistant' },
    });
    mockTelemetry.mockResolvedValue(undefined);
    sessionStorage.clear();
  });

  it('shows sign-in CTA when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );

    expect(screen.getByText(/Sign in to chat with the assistant/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign in/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('sends user prompt and renders assistant reply', async () => {
    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );

    fireEvent.change(screen.getByLabelText(/Message to assistant/i), {
      target: { value: 'How do I join?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => expect(mockChat).toHaveBeenCalled());
    expect(screen.getByText('How do I join?')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('Hello from assistant')).toBeInTheDocument()
    );
  });

  it('shows retry UI after timeout-style ApiError', async () => {
    const { ApiError } = jest.requireMock('@/lib/api');
    mockChat.mockRejectedValue(new ApiError(408, 'Request timed out'));

    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );

    fireEvent.change(screen.getByLabelText(/Message to assistant/i), {
      target: { value: 'retry me' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() =>
      expect(screen.getByText(/Request timed out/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(mockTelemetry).toHaveBeenCalled();
  });
});
