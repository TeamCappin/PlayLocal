import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId("input");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveClass("custom-class");
  });

  it("handles type prop", () => {
    render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("type", "email");
  });

  it("handles placeholder", () => {
    render(<Input placeholder="Enter text" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("placeholder", "Enter text");
  });

  it("handles value and onChange", () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} data-testid="input" />);
    fireEvent.change(screen.getByTestId("input"), { target: { value: "test" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("handles disabled state", () => {
    render(<Input disabled data-testid="input" />);
    expect(screen.getByTestId("input")).toBeDisabled();
  });
});
