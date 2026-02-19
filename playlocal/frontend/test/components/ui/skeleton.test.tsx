import React from "react";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders with default className", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
  });

  it("applies custom className", () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("custom-class");
  });

  it("passes through additional props", () => {
    render(<Skeleton aria-label="Loading" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-label", "Loading");
  });
});
