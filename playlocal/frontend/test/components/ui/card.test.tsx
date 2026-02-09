import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";

describe("Card", () => {
  it("renders card", () => {
    render(<Card data-testid="card">Card content</Card>);
    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-slot", "card");
  });

  it("applies custom className", () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
  });

  it("renders CardHeader, CardTitle, CardDescription", () => {
    render(
      <Card>
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Title</CardTitle>
          <CardDescription data-testid="desc">Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "card-header");
    expect(screen.getByTestId("title")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByTestId("desc")).toHaveAttribute("data-slot", "card-description");
  });

  it("renders CardContent and CardFooter", () => {
    render(
      <Card>
        <CardContent data-testid="content">Content</CardContent>
        <CardFooter data-testid="footer">Footer</CardFooter>
      </Card>
    );
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "card-footer");
  });

  it("renders CardAction", () => {
    render(
      <Card>
        <CardAction data-testid="action">Action</CardAction>
      </Card>
    );
    expect(screen.getByTestId("action")).toHaveAttribute("data-slot", "card-action");
  });
});
