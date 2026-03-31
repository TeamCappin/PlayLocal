import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssistantMarkdown, parseInline } from '@/components/assistant/AssistantMarkdown';

/** Real blank line — JSX `"a\n\nb"` can compile to literal backslashes in some pipelines. */
const NL2 = '\n\n';

describe('AssistantMarkdown', () => {
  it('renders h3 for ### headings and splits following block', () => {
    render(<AssistantMarkdown text={['### Hello', 'body'].join(NL2)} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Hello');
    expect(screen.getByRole('paragraph')).toHaveTextContent('body');
  });

  it('renders heading with inline bold', () => {
    render(<AssistantMarkdown text="### **Bold** title" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Bold title');
    expect(heading.querySelector('strong')).toHaveTextContent('Bold');
  });

  it('renders unordered list items', () => {
    render(
      <AssistantMarkdown text={'- First\n- Second item'} />,
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(list.querySelectorAll('li')).toHaveLength(2);
  });

  it('handles list lines with leading whitespace before dash', () => {
    render(<AssistantMarkdown text={'  - Indented item'} />);
    expect(screen.getByText('Indented item')).toBeInTheDocument();
  });

  it('renders paragraph for plain text and joins multiline with space', () => {
    render(<AssistantMarkdown text={'Line one\nLine two'} />);
    expect(
      screen.getByText((content, el) => el?.tagName === 'P' && content.includes('Line one Line two')),
    ).toBeInTheDocument();
  });

  it('splits blocks on blank line', () => {
    render(<AssistantMarkdown text={['First block', 'Second block'].join(NL2)} />);
    expect(screen.getByText('First block')).toBeInTheDocument();
    expect(screen.getByText('Second block')).toBeInTheDocument();
    expect(document.querySelectorAll('p')).toHaveLength(2);
  });

  it('ignores empty block chunks', () => {
    const { container } = render(
      <AssistantMarkdown text={['Only', '', '', 'visible'].join(NL2)} />,
    );
    expect(container.textContent).toContain('Only');
    expect(container.textContent).toContain('visible');
  });

  it('skips blocks that are only whitespace after split', () => {
    const { container } = render(<AssistantMarkdown text={NL2} />);
    expect(container.querySelector('.assistant-markdown')?.childNodes.length).toBe(0);
  });

  it('parseInline returns null for empty string', () => {
    expect(parseInline('')).toBeNull();
  });

  it('renders inline bold', () => {
    render(<AssistantMarkdown text="Use **bold** here" />);
    const strong = screen.getByText('bold', { selector: 'strong' });
    expect(strong).toBeInTheDocument();
  });

  it('renders inline code', () => {
    render(<AssistantMarkdown text="Run `npm test` now" />);
    expect(screen.getByText('npm test', { selector: 'code' })).toBeInTheDocument();
  });

  it('treats lone bracket as plain text (advances past [)', () => {
    render(<AssistantMarkdown text="[ not a valid link" />);
    expect(screen.getByText('[ not a valid link', { exact: true })).toBeInTheDocument();
  });

  it('renders markdown links with security attrs', () => {
    render(<AssistantMarkdown text="See [Help](https://example.com/help) today." />);
    const link = screen.getByRole('link', { name: 'Help' });
    expect(link).toHaveAttribute('href', 'https://example.com/help');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('combines multiple inline segments in one line', () => {
    render(<AssistantMarkdown text="**A** and `B` and [C](https://c.test)" />);
    expect(screen.getByText('A', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('B', { selector: 'code' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'C' })).toHaveAttribute('href', 'https://c.test');
  });

  it('treats unclosed bold as plain text (no infinite loop)', () => {
    render(<AssistantMarkdown text="**no end" />);
    expect(screen.getByText('**no end', { exact: false })).toBeInTheDocument();
  });

  it('treats unclosed backtick as plain text', () => {
    render(<AssistantMarkdown text="`open code" />);
    expect(screen.getByText('`open code', { exact: false })).toBeInTheDocument();
  });
});
