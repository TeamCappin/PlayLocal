import { render, waitFor } from '@testing-library/react';
import GameDiscovery from '../GameDiscovery';

// Other necessary imports...

test('restores map view mode from sessionStorage on mount', async () => {
  // Mock sessionStorage
  const sessionStorageMock = jest.spyOn(window.sessionStorage.__proto__, 'getItem');
  sessionStorageMock.mockReturnValueOnce('expectedValue');

  const { getByText } = render(<GameDiscovery />);

  await waitFor(() => {
    // Assert that the component behaves as expected after setState
    expect(getByText(/expected text/)).toBeInTheDocument();
  });

  sessionStorageMock.mockRestore();
});
