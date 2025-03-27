import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TextFieldComponent from "../TextFieldComponent";

describe("TextFieldComponent", () => {
  it("renders the label and value, and calls handlers on events", () => {
    const mockBlur = vi.fn();
    const mockChange = vi.fn();

    render(
      <TextFieldComponent
        label="Test Label"
        name="testField"
        value="Hello"
        handleBlur={mockBlur}
        handleChange={mockChange}
        error={false}
      />
    );

    
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();

    
    const input = screen.getByRole("textbox", { name: /test label/i });
    expect(input).toHaveValue("Hello");

    
    fireEvent.change(input, { target: { value: "New Value" } });
    expect(mockChange).toHaveBeenCalledTimes(1);

    
    fireEvent.blur(input);
    expect(mockBlur).toHaveBeenCalledTimes(1);
  });

  it("displays helper text and shows error state if `error` is true", () => {
    render(
      <TextFieldComponent
        label="Email"
        name="email"
        value=""
        handleBlur={vi.fn()}
        handleChange={vi.fn()}
        error={true}
        helperText="Invalid email"
      />
    );

    const input = screen.getByRole("textbox", { name: /email/i });
    expect(input).toBeInvalid(); 

    
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(
      <TextFieldComponent
        label="Disabled Field"
        name="disabledField"
        value="Can't edit this"
        handleBlur={vi.fn()}
        handleChange={vi.fn()}
        error={false}
        disabled
      />
    );

    const input = screen.getByRole("textbox", { name: /disabled field/i });
    expect(input).toBeDisabled();
  });
});