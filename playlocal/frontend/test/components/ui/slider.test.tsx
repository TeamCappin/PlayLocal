import React from "react";
import { render, screen } from "@testing-library/react";
import { Slider } from "@/components/ui/slider";

describe("Slider", () => {
  it("renders slider", () => {
    render(<Slider data-testid="slider" />);
    const slider = screen.getByTestId("slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("data-slot", "slider");
  });

  it("applies custom className", () => {
    render(<Slider className="custom-class" data-testid="slider" />);
    expect(screen.getByTestId("slider")).toHaveClass("custom-class");
  });

  it("handles defaultValue", () => {
    const { rerender } = render(<Slider defaultValue={[25, 75]} data-testid="slider" />);
    expect(screen.getByTestId("slider")).toBeInTheDocument();
    rerender(<Slider value={[30, 70]} data-testid="slider" />);
    expect(screen.getByTestId("slider")).toBeInTheDocument();
  });

  it("renders track and range", () => {
    render(<Slider data-testid="slider" />);
    const slider = screen.getByTestId("slider");
    expect(slider.querySelector('[data-slot="slider-track"]')).toBeInTheDocument();
    expect(slider.querySelector('[data-slot="slider-range"]')).toBeInTheDocument();
  });

  it("renders thumbs based on value length", () => {
    render(<Slider value={[25, 50, 75]} data-testid="slider" />);
    const slider = screen.getByTestId("slider");
    const thumbs = slider.querySelectorAll('[data-slot="slider-thumb"]');
    expect(thumbs).toHaveLength(3);
  });

  it("renders single thumb for single value", () => {
    render(<Slider value={[50]} data-testid="slider" />);
    const slider = screen.getByTestId("slider");
    expect(slider.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(1);
  });
});
