
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SocietyPreview } from "../SocietyPreview";
import SocietyDetailLayout from "../SocietyDetailLayout";


vi.mock("../SocietyDetailLayout", () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-society-detail">Detail Layout</div>),
}));

describe("SocietyPreview", () => {
  const mockSociety = { id: 1, name: "TestSociety" };

  it("renders the society preview dialog when open", () => {
    render(
      <SocietyPreview
        open={true}
        onClose={vi.fn()}
        society={mockSociety}
        loading={false}
        joined={0}
        onJoinSociety={vi.fn()}
      />
    );

    
    expect(screen.getByText("Society Preview")).toBeInTheDocument();
    
    expect(screen.getByTestId("mock-society-detail")).toBeInTheDocument();
  });

  it("does not render anything when open=false", () => {
    render(
      <SocietyPreview
        open={false}
        onClose={vi.fn()}
        society={mockSociety}
        loading={false}
        joined={0}
        onJoinSociety={vi.fn()}
      />
    );

    expect(screen.queryByText("Society Preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-society-detail")).not.toBeInTheDocument();
  });

  it("calls onClose when the close icon is clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <SocietyPreview
        open={true}
        onClose={onCloseMock}
        society={mockSociety}
        loading={false}
        joined={0}
        onJoinSociety={vi.fn()}
      />
    );

    
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("forwards props to SocietyDetailLayout", () => {
    const onJoinMock = vi.fn();
    render(
      <SocietyPreview
        open={true}
        onClose={vi.fn()}
        society={mockSociety}
        loading={true}
        joined={1}
        onJoinSociety={onJoinMock}
      />
    );

    
    const detailCalls = (SocietyDetailLayout as unknown as vi.Mock).mock.calls;
    expect(detailCalls.length).toBeGreaterThan(0);

    
    const lastCallProps = detailCalls[detailCalls.length - 1][0];
    const { society, loading, joined, onJoinSociety } = lastCallProps;

    expect(society).toEqual(mockSociety);
    expect(loading).toBe(true);
    expect(joined).toBe(1);
    expect(onJoinSociety).toBe(onJoinMock);
  });
});