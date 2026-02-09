import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";

describe("Select", () => {
  it("renders select root and trigger", () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "select-trigger");
  });

  it("renders trigger with default size", () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger" size="default">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-size", "default");
  });

  it("renders trigger with sm size", () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger" size="sm">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-size", "sm");
  });

  it("opens content and selects item", () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent data-testid="content">
          <SelectItem value="one" data-testid="item-one">One</SelectItem>
          <SelectItem value="two">Two</SelectItem>
        </SelectContent>
      </Select>
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "select-content");
    const itemOne = screen.getByTestId("item-one");
    expect(itemOne).toHaveAttribute("data-slot", "select-item");
    fireEvent.click(itemOne);
    expect(screen.getByText("One")).toBeInTheDocument();
  });

  it("renders select with group and label", () => {
    render(
      <Select open>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent data-testid="content">
          <SelectGroup data-testid="group">
            <SelectLabel data-testid="label">Group 1</SelectLabel>
            <SelectItem value="a">A</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "select-group");
    expect(screen.getByTestId("label")).toHaveAttribute("data-slot", "select-label");
    expect(screen.getByTestId("label")).toHaveTextContent("Group 1");
  });

  it("renders select content with popper position", () => {
    render(
      <Select open>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent data-testid="content" position="popper">
          <SelectItem value="x">X</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "select-content");
  });
});
