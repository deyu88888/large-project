import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import BarChart from "../BarChart";

let originalOffsetWidth: any;
let originalOffsetHeight: any;
let originalGetBoundingClientRect: any;

beforeAll(() => {
  
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (global as any).ResizeObserver = MockResizeObserver;

  
  
  originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 600,
      height: 400,
      top: 0,
      left: 0,
      right: 600,
      bottom: 400,
      x: 0,
      y: 0,
      
      toJSON: () => {}
    };
  };

  
  originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 400,
  });
});

afterAll(() => {
  
  HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  if (originalOffsetWidth) {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  }
  if (originalOffsetHeight) {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
  }
});


function ChartContainer({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="chart-wrapper" style={{ width: 600, height: 400 }}>
      {children}
    </div>
  );
}

describe("BarChart", () => {
  const testData = [
    { country: "SocA", members: 10 },
    { country: "SocB", members: 20 },
  ];

  it("renders axis labels by default (isDashboard=false)", async () => {
    render(
      <ChartContainer>
        <BarChart data={testData} isDashboard={false} />
      </ChartContainer>
    );

    
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    
    await waitFor(() => {
      const xAxisLabel = screen.queryAllByText((content) =>
        content.includes("Society Name")
      );
      expect(xAxisLabel.length).toBeGreaterThan(0);

      const yAxisLabel = screen.queryAllByText((content) =>
        content.includes("Number of Members")
      );
      expect(yAxisLabel.length).toBeGreaterThan(0);
    });
  });

  it("omits axis labels when isDashboard=true", async () => {
    render(
      <ChartContainer>
        <BarChart data={testData} isDashboard />
      </ChartContainer>
    );

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      const xAxisLabel = screen.queryAllByText((content) =>
        content.includes("Society Name")
      );
      expect(xAxisLabel.length).toBe(0);

      const yAxisLabel = screen.queryAllByText((content) =>
        content.includes("Number of Members")
      );
      expect(yAxisLabel.length).toBe(0);
    });
  });
});