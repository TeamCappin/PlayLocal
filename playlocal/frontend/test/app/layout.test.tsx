import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

jest.mock("@/app/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

jest.mock("@/components/Navigation", () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

describe("RootLayout", () => {
  it("renders providers, navigation, and children", () => {
    render(
      <RootLayout>
        <div>Test child</div>
      </RootLayout>
    );
    expect(screen.getByTestId("providers")).toBeInTheDocument();
    expect(screen.getByTestId("navigation")).toBeInTheDocument();
    expect(screen.getByText("Test child")).toBeInTheDocument();
  });

  it("applies font class to body", () => {
    render(
      <RootLayout>
        <span>Child</span>
      </RootLayout>
    );
    const body = document.querySelector("body");
    expect(body).toHaveClass("antialiased");
    expect(body?.className).toContain("font-sans");
  });

  it("renders html with lang en", () => {
    render(
      <RootLayout>
        <span>Child</span>
      </RootLayout>
    );
    const html = document.querySelector("html");
    expect(html).toHaveAttribute("lang", "en");
  });
});
