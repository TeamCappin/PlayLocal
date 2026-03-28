import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RateUserModal } from '../../components/RateUserModal';
import { usePlayerRatings } from '@/hooks/usePlayerRatings';

jest.mock('@/hooks/usePlayerRatings', () => ({
  usePlayerRatings: jest.fn()
}));

describe('RateUserModal', () => {
  const mockCreateRating = jest.fn();
  const defaultProps = {
    gameId: 'game-1',
    targetUserId: 'user-2',
    targetUserName: 'John Doe',
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePlayerRatings as jest.Mock).mockReturnValue({
      createRating: mockCreateRating,
      isLoading: false
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<RateUserModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content when isOpen is true', () => {
    render(<RateUserModal {...defaultProps} />);
    expect(screen.getByText('Rate John Doe')).toBeInTheDocument();
    expect(screen.getByText(/How was your experience playing with John Doe\?/i)).toBeInTheDocument();
  });

  it('allows selecting a rating and submitting', async () => {
    mockCreateRating.mockResolvedValueOnce({});
    render(<RateUserModal {...defaultProps} />);
    
    // Find stars (they are buttons)
    const stars = screen.getAllByRole('button').filter(b => !b.classList.contains('text-gray-400') && !b.textContent?.includes('Submit'));
    
    // Should have 5 stars
    expect(stars).toHaveLength(5);
    
    // Click 4th star
    fireEvent.click(stars[3]);
    
    const submitBtn = screen.getByRole('button', { name: /Submit Rating/i });
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(mockCreateRating).toHaveBeenCalledWith({
        gameId: 'game-1',
        rateeId: 'user-2',
        rating: 4
      });
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(4);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('handles hover state of stars', () => {
    render(<RateUserModal {...defaultProps} />);
    const stars = screen.getAllByRole('button').filter(b => !b.classList.contains('text-gray-400') && !b.textContent?.includes('Submit'));
    
    // Hover on 3rd star
    fireEvent.mouseEnter(stars[2]);
    // The hover state should make stars fill yellow, we can't easily check computed style, but we cover the event
    fireEvent.mouseLeave(stars[2]);
  });

  it('handles error on submit gracefully', async () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateRating.mockRejectedValueOnce(new Error('Network error'));
    
    render(<RateUserModal {...defaultProps} />);
    const stars = screen.getAllByRole('button').filter(b => !b.classList.contains('text-gray-400') && !b.textContent?.includes('Submit'));
    fireEvent.click(stars[4]); // 5 stars
    
    const submitBtn = screen.getByRole('button', { name: /Submit Rating/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(mockCreateRating).toHaveBeenCalled();
      expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });
});