import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

describe("Tabs", () => {
  it("renders tabs", () => {
    render(
      <Tabs data-testid="tabs">
        <TabsList data-testid="list">
          <TabsTrigger value="tab1" data-testid="trigger1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="content1">Content 1</TabsContent>
        <TabsContent value="tab2" data-testid="content2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-slot", "tabs");
    expect(screen.getByTestId("list")).toHaveAttribute("data-slot", "tabs-list");
    expect(screen.getByTestId("trigger1")).toHaveAttribute("data-slot", "tabs-trigger");
    expect(screen.getByTestId("trigger2")).toHaveAttribute("data-slot", "tabs-trigger");
  });

  it("switches content when trigger is clicked", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="content1">Content 1</TabsContent>
        <TabsContent value="tab2" data-testid="content2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.getByTestId("content1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Tab 2" }));
    expect(screen.getByTestId("content2")).toBeInTheDocument();
  });
});
