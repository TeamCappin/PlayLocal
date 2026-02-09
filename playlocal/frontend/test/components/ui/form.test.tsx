import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useForm } from "react-hook-form";

import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "@/components/ui/form";

jest.mock("@/components/ui/utils", () => ({
  cn: (...classes: Array<string | undefined | null | false>) =>
    classes.filter(Boolean).join(" "),
}));

jest.mock("@/components/ui/label", () => ({
  Label: (props: any) => <label {...props} />,
}));

type Values = { username: string };

function TestForm({ withMessageChildren = false }: { withMessageChildren?: boolean }) {
  const methods = useForm<Values>({
    defaultValues: { username: "" },
    mode: "onSubmit",
  });

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(() => {})}>
        <FormField
          name="username"
          control={methods.control}
          rules={{ required: "Required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>

              <FormControl>
                <input data-testid="username-input" {...field} />
              </FormControl>

              <FormDescription>Pick a unique name</FormDescription>

              {withMessageChildren ? (
                <FormMessage>Helper text</FormMessage>
              ) : (
                <FormMessage />
              )}
            </FormItem>
          )}
        />

        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

function getIdBaseFromFormItemId(formItemId: string) {
  return formItemId.replace(/-form-item$/, "");
}

describe("form primitives", () => {
  test("wires label/control/description ids correctly when there is no error", () => {
    render(<TestForm />);

    const input = screen.getByTestId("username-input");
    const label = screen.getByText("Username");
    const desc = screen.getByText("Pick a unique name");

    // Slot should apply id to the input
    expect(input).toHaveAttribute("id");
    const formItemId = input.getAttribute("id")!;
    const base = getIdBaseFromFormItemId(formItemId);

    // Label htmlFor should point at the formItemId
    expect(label).toHaveAttribute("for", formItemId);

    // Description id should be derived from the same base id
    expect(desc).toHaveAttribute("id", `${base}-form-item-description`);

    // No error initially:
    // aria-invalid is set to !!error, which may render "false" or be absent depending on Slot behavior
    expect(input.getAttribute("aria-invalid")).not.toBe("true");

    // aria-describedby should include only description id when no error
    expect(input).toHaveAttribute("aria-describedby", `${base}-form-item-description`);

    // FormMessage renders null when empty (no error + no children)
    expect(
      document.querySelector('[data-slot="form-message"]'),
    ).not.toBeInTheDocument();

    // FormLabel exposes error state via data-error (false)
    // (If your Label impl ever omits false attributes, switch to: expect(label.getAttribute("data-error")).not.toBe("true"))
    expect(label).toHaveAttribute("data-error", "false");
  });

  test("on submit, required rule shows error, updates aria-describedby and aria-invalid, and shows message", async () => {
    render(<TestForm />);

    const input = screen.getByTestId("username-input");
    const label = screen.getByText("Username");
    const submit = screen.getByRole("button", { name: /submit/i });

    const formItemId = input.getAttribute("id")!;
    const base = getIdBaseFromFormItemId(formItemId);

    fireEvent.click(submit);

    // Error message appears
    await waitFor(() => {
      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    // aria-invalid becomes true
    expect(input).toHaveAttribute("aria-invalid", "true");

    // aria-describedby includes BOTH description + message ids
    expect(input).toHaveAttribute(
      "aria-describedby",
      `${base}-form-item-description ${base}-form-item-message`,
    );

    // label reflects error state
    expect(label).toHaveAttribute("data-error", "true");

    // message element uses the derived id
    const msg = screen.getByText("Required");
    expect(msg).toHaveAttribute("id", `${base}-form-item-message`);
  });

  test("FormMessage renders children text when no error exists", () => {
    render(<TestForm withMessageChildren />);

    expect(screen.getByText("Helper text")).toBeInTheDocument();
  });

  
});
