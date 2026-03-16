import { render, screen, fireEvent } from '@testing-library/react';
import { MetricTooltip } from '../../../components/stats/MetricTooltip';

describe('MetricTooltip', () => {
  it('renders the tooltip trigger closed by default', () => {
    render(<MetricTooltip label="Win Rate information" content="This is how Win Rate is calculated." />);
    
    const trigger = screen.getByTestId('metric-tooltip-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('metric-tooltip-content')).not.toBeInTheDocument();
    
    // Check formatting of the title text
    expect(screen.getByText('How is Win Rate calculated?')).toBeInTheDocument();
  });

  it('toggles the open state and displays the content when clicked', () => {
    render(<MetricTooltip label="Win Rate information" content="This is how Win Rate is calculated." />);
    
    const trigger = screen.getByTestId('metric-tooltip-trigger');
    
    // Open
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const content = screen.getByTestId('metric-tooltip-content');
    expect(content).toBeInTheDocument();
    expect(screen.getByText('This is how Win Rate is calculated.')).toBeInTheDocument();
    
    // Close
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('metric-tooltip-content')).not.toBeInTheDocument();
  });
});
