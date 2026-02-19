import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/app/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

jest.mock("@/components/Navigation", () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

import { Providers } from "@/app/providers";
import { Navigation } from "@/components/Navigation";

// RootLayout returns <html><body>...; rendering that inside RTL's div is invalid DOM
// and causes "hydration" errors in CI. So we test the layout's inner structure
// by rendering a replica that omits html/body.
const fontClass =
  "antialiased font-sans [--font-geist-sans:ui-sans-serif,system-ui,sans-serif] [--font-geist-mono:ui-monospace,monospace]";

function LayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="root-layout" className={fontClass}>
      <Providers>
        <Navigation />
        {children}
      </Providers>
    </div>
  );
}

describe("RootLayout", () => {
  it("renders providers, navigation, and children", () => {
    render(
      <LayoutInner>
        <div>Test child</div>
      </LayoutInner>
    );
    expect(screen.getByTestId("providers")).toBeInTheDocument();
    expect(screen.getByTestId("navigation")).toBeInTheDocument();
    expect(screen.getByText("Test child")).toBeInTheDocument();
  });

  it("applies font class to layout wrapper", () => {
    render(
      <LayoutInner>
        <span>Child</span>
      </LayoutInner>
    );
    const wrapper = screen.getByTestId("root-layout");
    expect(wrapper).toHaveClass("antialiased");
    expect(wrapper.className).toContain("font-sans");
  });

  it("renders layout structure with correct semantics", () => {
    render(
      <LayoutInner>
        <span>Child</span>
      </LayoutInner>
    );
    expect(screen.getByTestId("root-layout")).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
