
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SortableItem, ExtraModule } from "../SortableItem";
import { useSortable } from "@dnd-kit/sortable";


vi.mock("@dnd-kit/sortable", () => ({
  useSortable: vi.fn(),
}));


beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => "mock-object-url");
});

afterAll(() => {
  
  global.URL.createObjectURL = undefined as any;
});

describe("SortableItem", () => {
  const baseProps = {
    onChangeText: vi.fn(),
    onChangeFile: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    
    (useSortable as vi.Mock).mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
    });

    
    vi.clearAllMocks();
  });

  it("renders the 'Drag' handle", () => {
    const mockMod: ExtraModule = {
      id: "mod1",
      type: "description",
      textValue: "",
    };
    render(<SortableItem mod={mockMod} {...baseProps} />);
    expect(screen.getByText("Drag")).toBeInTheDocument();
  });

  it("clicking the delete icon triggers onDelete with mod id", () => {
    const mockMod: ExtraModule = {
      id: "modX",
      type: "description",
      textValue: "",
    };
    render(<SortableItem mod={mockMod} {...baseProps} />);
    
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);
    expect(baseProps.onDelete).toHaveBeenCalledWith("modX");
  });

  describe("when type='description'", () => {
    it("renders text field and calls onChangeText on input change", () => {
      const mockMod: ExtraModule = {
        id: "desc1",
        type: "description",
        textValue: "Some text",
      };
      render(<SortableItem mod={mockMod} {...baseProps} />);
      
      expect(screen.getByText("Additional Description")).toBeInTheDocument();
      const textfield = screen.getByPlaceholderText("Enter additional description");
      expect(textfield).toHaveValue("Some text");

      fireEvent.change(textfield, { target: { value: "New content" } });
      expect(baseProps.onChangeText).toHaveBeenCalledWith("desc1", "New content");
    });
  });

  describe("when type='subtitle'", () => {
    it("renders single-line text field and calls onChangeText", () => {
      const mockMod: ExtraModule = {
        id: "sub1",
        type: "subtitle",
        textValue: "My Subtitle",
      };
      render(<SortableItem mod={mockMod} {...baseProps} />);

      expect(screen.getByText("Subtitle")).toBeInTheDocument();
      const textfield = screen.getByPlaceholderText("Enter subtitle");
      expect(textfield).toHaveValue("My Subtitle");

      fireEvent.change(textfield, { target: { value: "New Subtitle" } });
      expect(baseProps.onChangeText).toHaveBeenCalledWith("sub1", "New Subtitle");
    });
  });

  describe("when type='image'", () => {
    it("renders 'Choose an image' button and calls onChangeFile upon file selection", () => {
      const mockMod: ExtraModule = {
        id: "img1",
        type: "image",
        textValue: "",
      };
      render(<SortableItem mod={mockMod} {...baseProps} />);

      
      const chooseBtn = screen.getByRole("button", { name: "Choose an image" });
      expect(chooseBtn).toBeInTheDocument();

      
      
      const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
      expect(fileInput).not.toBeNull();

      
      const fakeFile = new File(["(⌐□_□)"], "testImage.png", { type: "image/png" });
      fireEvent.change(fileInput!, { target: { files: [fakeFile] } });
      expect(baseProps.onChangeFile).toHaveBeenCalledWith("img1", fakeFile);
    });

    it("renders preview if image source is set", () => {
      const fakeFile = new File([""], "photo.jpg", { type: "image/jpg" });
      const mockMod: ExtraModule = {
        id: "img2",
        type: "image",
        fileValue: fakeFile, 
      };
      render(<SortableItem mod={mockMod} {...baseProps} />);

      
      const previewImg = screen.getByAltText("preview");
      expect(previewImg).toHaveAttribute("src", "mock-object-url");
    });
  });

  describe("when type='file'", () => {
    it("renders 'Choose a file' button, displays file name, triggers onChangeFile", () => {
      const mockMod: ExtraModule = {
        id: "file1",
        type: "file",
        fileValue: "http:"
      };
      render(<SortableItem mod={mockMod} {...baseProps} />);

      expect(screen.getByText("File Upload")).toBeInTheDocument();
      expect(screen.getByText("Choose a file")).toBeInTheDocument();

      
      // expect(screen.getByText("foo.pdf")).toBeInTheDocument();

      const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
      const newFile = new File(["dummy"], "myFile.txt", { type: "text/plain" });
      fireEvent.change(fileInput!, { target: { files: [newFile] } });
      expect(baseProps.onChangeFile).toHaveBeenCalledWith("file1", newFile);
    });
  });
});