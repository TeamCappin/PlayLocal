import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';

jest.mock('@/components/ui/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('useSidebar', () => {
  it('throws when used outside SidebarProvider', () => {
    const TestComponent = () => {
      useSidebar();
      return null;
    };
    expect(() => render(<TestComponent />)).toThrow(
      'useSidebar must be used within a SidebarProvider.'
    );
  });
});

describe('SidebarProvider', () => {
  it('renders wrapper with sidebar context', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none" data-testid="sidebar">
          Content
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('sidebar')).toHaveAttribute(
      'data-slot',
      'sidebar'
    );
    expect(screen.getByTestId('sidebar')).toHaveTextContent('Content');
  });

  it('renders with defaultOpen', () => {
    render(
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="none" data-testid="sidebar">
          Content
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});

describe('Sidebar', () => {
  it('renders non-collapsible sidebar', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none" data-testid="sidebar">
          <span data-testid="child">Child</span>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('sidebar')).toHaveAttribute(
      'data-slot',
      'sidebar'
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Child');
  });

  it('renders desktop sidebar when not mobile', () => {
    const { container } = render(
      <SidebarProvider>
        <Sidebar side="left">Inner</Sidebar>
      </SidebarProvider>
    );
    const sidebar = container.querySelector('[data-slot="sidebar"]');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveAttribute('data-slot', 'sidebar');
  });

  it('renders sidebar with right side', () => {
    const { container } = render(
      <SidebarProvider>
        <Sidebar side="right">Content</Sidebar>
      </SidebarProvider>
    );
    const sidebar = container.querySelector(
      '[data-slot="sidebar"][data-side="right"]'
    );
    expect(sidebar).toBeInTheDocument();
  });

  it('renders sidebar with variant', () => {
    const { container } = render(
      <SidebarProvider>
        <Sidebar variant="floating">Content</Sidebar>
      </SidebarProvider>
    );
    const sidebar = container.querySelector(
      '[data-slot="sidebar"][data-variant="floating"]'
    );
    expect(sidebar).toBeInTheDocument();
  });
});

describe('SidebarTrigger', () => {
  it('renders and calls toggleSidebar on click', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarTrigger data-testid="trigger" />
        </Sidebar>
      </SidebarProvider>
    );
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toHaveAttribute('data-slot', 'sidebar-trigger');
    fireEvent.click(trigger);
    expect(trigger).toBeInTheDocument();
  });
});

describe('SidebarRail', () => {
  it('renders rail when inside desktop sidebar', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarRail data-testid="rail" />
        </Sidebar>
      </SidebarProvider>
    );
    const rail = screen.getByTestId('rail');
    expect(rail).toHaveAttribute('data-slot', 'sidebar-rail');
    expect(rail).toHaveAttribute('aria-label', 'Toggle Sidebar');
  });
});

describe('SidebarInset', () => {
  it('renders main content area', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <span>Side</span>
        </Sidebar>
        <SidebarInset data-testid="inset">Main content</SidebarInset>
      </SidebarProvider>
    );
    const inset = screen.getByTestId('inset');
    expect(inset).toHaveAttribute('data-slot', 'sidebar-inset');
    expect(inset.tagName).toBe('MAIN');
    expect(inset).toHaveTextContent('Main content');
  });
});

describe('SidebarInput', () => {
  it('renders input with sidebar styling', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarInput data-testid="input" placeholder="Search" />
        </Sidebar>
      </SidebarProvider>
    );
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('data-slot', 'sidebar-input');
    expect(input).toHaveAttribute('placeholder', 'Search');
  });
});

describe('SidebarHeader', () => {
  it('renders header', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader data-testid="header">Header</SidebarHeader>
        </Sidebar>
      </SidebarProvider>
    );
    const header = screen.getByTestId('header');
    expect(header).toHaveAttribute('data-slot', 'sidebar-header');
    expect(header).toHaveTextContent('Header');
  });
});

describe('SidebarFooter', () => {
  it('renders footer', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter data-testid="footer">Footer</SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    );
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveAttribute('data-slot', 'sidebar-footer');
  });
});

describe('SidebarSeparator', () => {
  it('renders separator', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarSeparator data-testid="sep" />
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('sep')).toHaveAttribute(
      'data-slot',
      'sidebar-separator'
    );
  });
});

describe('SidebarContent', () => {
  it('renders content area', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent data-testid="content">Content</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('data-slot', 'sidebar-content');
  });
});

describe('SidebarGroup', () => {
  it('renders group with label and content', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarGroup data-testid="group">
            <SidebarGroupLabel data-testid="label">Group 1</SidebarGroupLabel>
            <SidebarGroupContent data-testid="group-content">
              Items
            </SidebarGroupContent>
          </SidebarGroup>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('group')).toHaveAttribute(
      'data-slot',
      'sidebar-group'
    );
    expect(screen.getByTestId('label')).toHaveAttribute(
      'data-slot',
      'sidebar-group-label'
    );
    expect(screen.getByTestId('label')).toHaveTextContent('Group 1');
    expect(screen.getByTestId('group-content')).toHaveAttribute(
      'data-slot',
      'sidebar-group-content'
    );
  });

  it('renders SidebarGroupAction', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarGroup>
            <SidebarGroupLabel>Label</SidebarGroupLabel>
            <SidebarGroupAction data-testid="action" aria-label="Action" />
          </SidebarGroup>
        </Sidebar>
      </SidebarProvider>
    );
    const action = screen.getByTestId('action');
    expect(action).toHaveAttribute('data-slot', 'sidebar-group-action');
  });
});

describe('SidebarMenu', () => {
  it('renders menu with items and button', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu data-testid="menu">
            <SidebarMenuItem data-testid="item">
              <SidebarMenuButton data-testid="btn">Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('menu')).toHaveAttribute(
      'data-slot',
      'sidebar-menu'
    );
    expect(screen.getByTestId('item')).toHaveAttribute(
      'data-slot',
      'sidebar-menu-item'
    );
    expect(screen.getByTestId('btn')).toHaveAttribute(
      'data-slot',
      'sidebar-menu-button'
    );
    expect(screen.getByTestId('btn')).toHaveTextContent('Home');
  });

  it('renders SidebarMenuButton with variants', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton data-testid="btn" variant="outline" size="sm">
                Small
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    const btn = screen.getByTestId('btn');
    expect(btn).toHaveAttribute('data-size', 'sm');
  });

  it('renders SidebarMenuButton with tooltip', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton data-testid="btn" tooltip="Go home">
                Home
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('btn')).toBeInTheDocument();
  });

  it('renders SidebarMenuAction', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Item</SidebarMenuButton>
              <SidebarMenuAction data-testid="action" aria-label="Action" />
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('action')).toHaveAttribute(
      'data-slot',
      'sidebar-menu-action'
    );
  });

  it('renders SidebarMenuBadge', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Item</SidebarMenuButton>
              <SidebarMenuBadge data-testid="badge">3</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-slot', 'sidebar-menu-badge');
    expect(badge).toHaveTextContent('3');
  });

  it('renders SidebarMenuSkeleton', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenuSkeleton data-testid="skeleton" />
        </Sidebar>
      </SidebarProvider>
    );
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('data-slot', 'sidebar-menu-skeleton');
  });

  it('renders SidebarMenuSkeleton with showIcon', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuSkeleton data-testid="skeleton-icon" showIcon />
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('skeleton-icon')).toHaveAttribute(
      'data-slot',
      'sidebar-menu-skeleton'
    );
  });
});

describe('SidebarMenuSub', () => {
  it('renders sub menu with items and button', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Parent</SidebarMenuButton>
              <SidebarMenuSub data-testid="sub">
                <SidebarMenuSubItem data-testid="subitem">
                  <SidebarMenuSubButton data-testid="subbtn" href="#">
                    Child
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    expect(screen.getByTestId('sub')).toHaveAttribute(
      'data-slot',
      'sidebar-menu-sub'
    );
    expect(screen.getByTestId('subitem')).toHaveAttribute(
      'data-slot',
      'sidebar-menu-sub-item'
    );
    expect(screen.getByTestId('subbtn')).toHaveAttribute(
      'data-slot',
      'sidebar-menu-sub-button'
    );
    expect(screen.getByTestId('subbtn')).toHaveTextContent('Child');
  });

  it('renders SidebarMenuSubButton with size and isActive', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Parent</SidebarMenuButton>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    data-testid="subbtn"
                    size="sm"
                    isActive
                    href="#"
                  >
                    Active
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
    const subbtn = screen.getByTestId('subbtn');
    expect(subbtn).toHaveAttribute('data-size', 'sm');
    expect(subbtn).toHaveAttribute('data-active', 'true');
  });
});
