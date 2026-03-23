import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    jest.useRealTimers();
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

  it('renders nothing when closed', () => {
    const { container } = render(
      <AssistantChatPanel
        open={false}
        onClose={jest.fn()}
        context="discover"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );
    expect(screen.getByText(/Preparing chat/i)).toBeInTheDocument();
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

  it('sends when hitting Enter (without Shift)', async () => {
    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );

    const input = screen.getByLabelText(/Message to assistant/i);
    fireEvent.change(input, { target: { value: 'Enter submit' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => expect(mockChat).toHaveBeenCalled());
    expect(screen.getByText('Enter submit')).toBeInTheDocument();
  });

  it('clicking suggestion button sends predefined prompt', async () => {
    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /How do I join a game\?/i }));
    await waitFor(() => expect(mockChat).toHaveBeenCalled());
    expect(screen.getByText(/How do I join a game\?/i)).toBeInTheDocument();
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

  it('retry button resends pending history', async () => {
    const { ApiError } = jest.requireMock('@/lib/api');
    mockChat
      .mockRejectedValueOnce(new ApiError(408, 'Request timed out'))
      .mockResolvedValueOnce({
        message: { role: 'assistant', content: 'Recovered' },
      });

    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );

    fireEvent.change(screen.getByLabelText(/Message to assistant/i), {
      target: { value: 'retry this' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));
    await waitFor(() => screen.getByRole('button', { name: /Retry/i }));
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => expect(screen.getByText('Recovered')).toBeInTheDocument());
    expect(mockChat).toHaveBeenCalledTimes(2);
  });

  it('records session telemetry once and skips when already flagged', async () => {
    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );
    await waitFor(() => expect(mockTelemetry).toHaveBeenCalledTimes(1));

    const key = 'playlocal_assistant_sess_started_sess-1';
    expect(sessionStorage.getItem(key)).toBe('1');

    // Render again with same session: should not record again
    render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );
    await waitFor(() => expect(mockTelemetry).toHaveBeenCalledTimes(1));
  });

  it('closes with Escape and backdrop click', async () => {
    const onClose = jest.fn();
    const rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });
    render(
      <AssistantChatPanel
        open={true}
        onClose={onClose}
        context="discover"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    const backdrop = screen
      .getByRole('dialog')
      .querySelector('[role="presentation"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);
    rafSpy.mockRestore();
  });

  it('unmounts after close animation timeout', () => {
    jest.useFakeTimers();
    const { rerender, queryByRole } = render(
      <AssistantChatPanel
        open={true}
        onClose={jest.fn()}
        context="discover"
      />
    );
    expect(queryByRole('dialog')).toBeInTheDocument();

    rerender(
      <AssistantChatPanel
        open={false}
        onClose={jest.fn()}
        context="discover"
      />
    );
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });
});
