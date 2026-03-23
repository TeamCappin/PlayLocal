import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUsePathname = jest.fn(() => '/discover');
const mockInferAssistantRoute = jest.fn(() => ({ context: 'discover' as const }));

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('@/lib/inferAssistantRoute', () => ({
  inferAssistantRoute: (...args: unknown[]) => mockInferAssistantRoute(...args),
}));

jest.mock('@/components/assistant/AssistantChatPanel', () => ({
  AssistantChatPanel: ({
    open,
    context,
    gameId,
  }: {
    open: boolean;
    context: string;
    gameId?: string;
  }) => (
    <div data-testid="assistant-panel">
      {open ? `open:${context}:${gameId ?? ''}` : 'closed'}
    </div>
  ),
}));

import { AssistantProvider, useAssistant } from '@/context/AssistantContext';

function Consumer() {
  const { openAssistant, closeAssistant } = useAssistant();
  return (
    <>
      <button onClick={() => openAssistant('game', 'g-1')}>open-game</button>
      <button onClick={closeAssistant}>close</button>
    </>
  );
}

describe('AssistantContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/discover');
    mockInferAssistantRoute.mockReturnValue({ context: 'discover' });
  });

  it('opens and closes panel through context actions', () => {
    render(
      <AssistantProvider>
        <Consumer />
      </AssistantProvider>
    );

    expect(screen.getByTestId('assistant-panel')).toHaveTextContent('closed');

    fireEvent.click(screen.getByText('open-game'));
    expect(screen.getByTestId('assistant-panel')).toHaveTextContent('open:game:g-1');

    fireEvent.click(screen.getByText('close'));
    expect(screen.getByTestId('assistant-panel')).toHaveTextContent('closed');
  });

  it('fab click infers context from pathname', () => {
    mockUsePathname.mockReturnValue('/games/xyz');
    mockInferAssistantRoute.mockReturnValue({ context: 'game', gameId: 'xyz' });

    render(
      <AssistantProvider>
        <div>child</div>
      </AssistantProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /open help assistant/i }));

    expect(mockInferAssistantRoute).toHaveBeenCalledWith('/games/xyz');
    expect(screen.getByTestId('assistant-panel')).toHaveTextContent('open:game:xyz');
  });

  it('does not render floating button on landing route', () => {
    mockUsePathname.mockReturnValue('/');
    render(
      <AssistantProvider>
        <div>home</div>
      </AssistantProvider>
    );
    expect(
      screen.queryByRole('button', { name: /open help assistant/i })
    ).not.toBeInTheDocument();
  });

  it('throws when useAssistant is called outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const BadConsumer = () => {
      useAssistant();
      return null;
    };
    expect(() => render(<BadConsumer />)).toThrow(
      'useAssistant must be used within AssistantProvider'
    );
    spy.mockRestore();
  });
});
