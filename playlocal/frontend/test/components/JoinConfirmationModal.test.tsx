import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JoinConfirmationModal } from '@/components/JoinConfirmationModal';

describe('JoinConfirmationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const restrictedTags = [
    { tagId: '1', name: 'women', isRestricted: true },
    { tagId: '2', name: 'men', isRestricted: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <JoinConfirmationModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={[]}
        isJoining={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={restrictedTags}
        isJoining={false}
      />
    );
    expect(screen.getByText('Confirm Game Requirements')).toBeInTheDocument();
  });

  it('should display age requirements when provided', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={[]}
        minAge={18}
        maxAge={35}
        isJoining={false}
      />
    );
    expect(
      screen.getByText(/between 18 and 35 years old/i)
    ).toBeInTheDocument();
  });

  it('should display minimum age only when maxAge not provided', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={[]}
        minAge={21}
        isJoining={false}
      />
    );
    expect(screen.getByText(/at least 21 years old/i)).toBeInTheDocument();
  });

  it('should display maximum age only when minAge not provided', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={[]}
        maxAge={40}
        isJoining={false}
      />
    );
    expect(screen.getByText(/under 40 years old/i)).toBeInTheDocument();
  });

  it('should display restricted tags with checkboxes', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={restrictedTags}
        isJoining={false}
      />
    );
    expect(screen.getByText('women')).toBeInTheDocument();
    expect(screen.getByText('men')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('should disable confirm button when tags not confirmed', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={restrictedTags}
        isJoining={false}
      />
    );
    const confirmButton = screen.getByText('Confirm & Join');
    expect(confirmButton).toBeDisabled();
  });

  it('should enable confirm button when all tags confirmed', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={restrictedTags}
        isJoining={false}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const confirmButton = screen.getByText('Confirm & Join');
    expect(confirmButton).not.toBeDisabled();
  });

  it('should call onConfirm with confirmed tag IDs when confirmed', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={restrictedTags}
        isJoining={false}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const confirmButton = screen.getByText('Confirm & Join');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(['1', '2']);
  });

  it('should call onClose when cancel button clicked', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={[]}
        isJoining={false}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when X button clicked', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={[]}
        isJoining={false}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find((btn) => btn.querySelector('svg'));
    if (xButton) {
      fireEvent.click(xButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should disable buttons when isJoining is true', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={restrictedTags}
        isJoining={true}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const confirmButton = screen.getByText('Joining...');
    const cancelButton = screen.getByText('Cancel');

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should show "Joining..." text when isJoining is true', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={[]}
        isJoining={true}
      />
    );

    expect(screen.getByText('Joining...')).toBeInTheDocument();
  });

  it('should allow unchecking tags', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={restrictedTags}
        isJoining={false}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');

    // Check both
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    let confirmButton = screen.getByText('Confirm & Join');
    expect(confirmButton).not.toBeDisabled();

    // Uncheck one
    fireEvent.click(checkboxes[0]);

    confirmButton = screen.getByText('Confirm & Join');
    expect(confirmButton).toBeDisabled();
  });

  it('should display community-specific game warning', () => {
    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={restrictedTags}
        isJoining={false}
      />
    );

    expect(screen.getByText('Community-Specific Game')).toBeInTheDocument();
    expect(
      screen.getByText(/meet the requirements before joining/i)
    ).toBeInTheDocument();
  });

  it('should capitalize and format tag names', () => {
    const formattedTags = [
      { tagId: '1', name: 'deaf-friendly', isRestricted: true },
    ];

    render(
      <JoinConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        restrictedTags={formattedTags}
        isJoining={false}
      />
    );

    expect(screen.getByText(/Deaf friendly/i)).toBeInTheDocument();
  });
});
