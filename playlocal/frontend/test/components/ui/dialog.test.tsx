import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

describe("Dialog", () => {
  it("renders trigger and opens dialog on click", () => {
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">Open</DialogTrigger>
        <DialogContent data-testid="content">
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          Content
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "dialog-trigger");
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders dialog when open prop is true", () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content">
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          Content
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "dialog-content");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
