// components/ui/chart.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  ChartContainer,
  ChartStyle,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui/chart';

// --------------------
// Mocks
// --------------------
jest.mock('@/components/ui/utils', () => ({
  cn: (...classes: Array<string | undefined | null | false>) =>
    classes.filter(Boolean).join(' '),
}));

jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    Tooltip: function TooltipMock() {
      return <div data-testid="recharts-tooltip" />;
    },
    Legend: function LegendMock() {
      return <div data-testid="recharts-legend" />;
    },
  };
});

function renderWithChart(config: any, ui: React.ReactNode, props?: any) {
  return render(
    <ChartContainer config={config} {...props}>
      {ui}
    </ChartContainer>
  );
}

describe('ChartContainer', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders wrapper div with data attributes, forwards props, and renders children inside ResponsiveContainer', () => {
    const config = { foo: { label: 'Foo', color: '#f00' } };

    renderWithChart(config, <div data-testid="child">child</div>, {
      id: 'my-id',
      className: 'extra',
      'aria-label': 'chart region',
    });

    const wrapper = screen.getByLabelText('chart region');
    expect(wrapper).toHaveAttribute('data-slot', 'chart');
    expect(wrapper).toHaveAttribute('data-chart', 'chart-my-id');
    expect(wrapper).toHaveClass('extra');

    // children go inside mocked ResponsiveContainer
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render ChartStyle if config has no color/theme entries', () => {
    const config = {
      foo: { label: 'Foo' }, // no color/theme
      bar: { label: 'Bar' }, // no color/theme
    };

    const { container } = renderWithChart(config, <div />);
    // ChartStyle returns null => no <style> tag rendered
    expect(container.querySelector('style')).not.toBeInTheDocument();
  });
});

describe('ChartStyle', () => {
  it('renders null if no config entries include theme or color', () => {
    const { container } = render(
      <ChartStyle id="chart-test" config={{ a: { label: 'A' } }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('generates CSS variables for light and dark themes', () => {
    const config = {
      apples: { label: 'Apples', color: '#ff0000' },
      bananas: {
        label: 'Bananas',
        theme: { light: '#00ff00', dark: '#0000ff' },
      },
      // ignored, no color/theme
      plain: { label: 'Plain' },
    };

    const { container } = render(
      <ChartStyle id="chart-test" config={config} />
    );
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();

    const css = style?.innerHTML ?? '';
    // light selector
    expect(css).toContain('[data-chart=chart-test]');
    // dark selector prefix
    expect(css).toContain('.dark [data-chart=chart-test]');

    // variables
    expect(css).toContain('--color-apples: #ff0000;');
    expect(css).toContain('--color-bananas: #00ff00;'); // light
    expect(css).toContain('--color-bananas: #0000ff;'); // dark
  });
});

describe('ChartLegendContent', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws if used outside <ChartContainer /> (useChart guard)', () => {
    const renderOutside = () =>
      render(
        <ChartLegendContent
          payload={[{ value: 'foo', dataKey: 'foo', color: '#123' }]}
        />
      );

    expect(renderOutside).toThrow(
      'useChart must be used within a <ChartContainer />'
    );
  });

  it('renders icon when provided in config (and hideIcon=false)', () => {
    const IconFoo = () => <svg data-testid="icon-foo" />;
    const config = {
      foo: { label: 'Foo Label', icon: IconFoo, color: '#f00' },
    };

    renderWithChart(
      config,
      <ChartLegendContent
        payload={[{ value: 'foo', dataKey: 'foo', color: '#123' }]}
      />
    );

    expect(screen.getByTestId('icon-foo')).toBeInTheDocument();
    expect(screen.getByText('Foo Label')).toBeInTheDocument();
  });

  it('renders colored square when icon is hidden', () => {
    const IconFoo = () => <svg data-testid="icon-foo" />;
    const config = {
      foo: { label: 'Foo Label', icon: IconFoo, color: '#f00' },
    };

    const { container } = renderWithChart(
      config,
      <ChartLegendContent
        hideIcon
        payload={[{ value: 'foo', dataKey: 'foo', color: 'rgb(1, 2, 3)' }]}
      />
    );

    expect(screen.queryByTestId('icon-foo')).not.toBeInTheDocument();
    expect(screen.getByText('Foo Label')).toBeInTheDocument();

    const swatch = container.querySelector('div[style]');
    expect(swatch).toBeInTheDocument();
    expect(swatch).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
  });
});

describe('ChartTooltipContent', () => {
  const originalToLocaleString = Number.prototype.toLocaleString;

  beforeEach(() => {
    // make value formatting deterministic regardless of test runner locale
    Number.prototype.toLocaleString = function () {
       
      const n = this as any;
      if (Number(n) === 1234) return '1,234';
      return originalToLocaleString.call(this);
    };
  });

  afterEach(() => {
    Number.prototype.toLocaleString = originalToLocaleString;
    jest.restoreAllMocks();
  });

  it('renders top label from config when label prop is string and labelKey is not set', () => {
    const config = {
      foo: { label: 'Foo Pretty', color: '#f00' },
      other: { label: 'Other', color: '#0f0' },
    };

    renderWithChart(
      config,
      <ChartTooltipContent
        active
        label="foo"
        payload={[
          {
            dataKey: 'foo',
            name: 'foo',
            value: 1234,
            payload: { fill: '#aaa' },
            color: '#aaa',
          },
        ]}
      />
    );
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('uses labelFormatter when provided', () => {
    const config = { foo: { label: 'Foo Pretty', color: '#f00' } };

    renderWithChart(
      config,
      <ChartTooltipContent
        active
        label="foo"
        labelFormatter={(value: any) => <span>LF:{String(value)}</span>}
        payload={[
          {
            dataKey: 'foo',
            name: 'foo',
            value: 1234,
            payload: { fill: '#aaa' },
            color: '#aaa',
          },
        ]}
      />
    );

    expect(screen.getByText('LF:Foo Pretty')).toBeInTheDocument();
  });

  it('renders default indicator (dot) unless hideIndicator is true', () => {
    const config = { foo: { label: 'Foo Pretty', color: '#f00' } };

    const { container, rerender } = renderWithChart(
      config,
      <ChartTooltipContent
        active
        payload={[
          {
            dataKey: 'foo',
            name: 'foo',
            value: 1234,
            payload: { fill: '#abc' },
          },
        ]}
      />
    );

    // indicator div present (dot)
    // note: it uses inline CSS vars --color-bg/--color-border
    const indicator = container.querySelector('div[style]');
    expect(indicator).toBeInTheDocument();

    rerender(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active
          hideIndicator
          payload={[
            {
              dataKey: 'foo',
              name: 'foo',
              value: 1234,
              payload: { fill: '#abc' },
            },
          ]}
        />
      </ChartContainer>
    );

    // indicator should be gone
    const indicatorAfter = container.querySelector('div[style]');
    expect(indicatorAfter).not.toBeInTheDocument();
  });

  it('uses formatter output instead of default layout when formatter is provided', () => {
    const config = { foo: { label: 'Foo Pretty', color: '#f00' } };

    renderWithChart(
      config,
      <ChartTooltipContent
        active
        payload={[
          {
            dataKey: 'foo',
            name: 'foo',
            value: 1234,
            payload: { fill: '#abc' },
          },
        ]}
        formatter={() => <div>FORMATTED!</div>}
      />
    );

    expect(screen.getByText('FORMATTED!')).toBeInTheDocument();
    // default value formatting should not be necessary if formatter is used;
    // we at least ensure the formatted text exists.
  });
});
