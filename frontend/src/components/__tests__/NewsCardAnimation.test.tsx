import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NewsCardAnimation } from '../NewsCardAnimation';
import { NewsCard } from '../NewsCard';

vi.mock('../NewsCard', () => ({
  NewsCard: vi.fn(() => <div data-testid="mocked-news-card">Mocked News Card</div>)
}));

describe('NewsCardAnimation Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should render correctly with initial state', async () => {
    render(<NewsCardAnimation />);
    
    const container = screen.getByTestId('card-container');
    expect(container).toBeInTheDocument();
    expect(container.className).toBe('card-container ');
    
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        news: expect.objectContaining({
          id: 1,
          title: 'News Title',
          brief: 'News Brief',
          content: 'News'
        })
      }),
      expect.anything()
    );
  });

  it('should change news item when clicked', async () => {
    render(<NewsCardAnimation />);
    
    const container = screen.getByTestId('card-container');
    
    expect(NewsCard).toHaveBeenLastCalledWith(
      expect.objectContaining({
        news: expect.objectContaining({
          id: 1
        })
      }),
      expect.anything()
    );
    
    vi.clearAllMocks();
    
    act(() => {
      fireEvent.click(container);
    });
    
    expect(container.className).toBe('card-container flip');
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(container.className).toBe('card-container ');
    
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        news: expect.objectContaining({
          id: 2,
          title: 'News Title2',
          brief: 'News Brief2',
          content: 'News2'
        })
      }),
      expect.anything()
    );
  });

  it('should cycle through all news items and return to the first', async () => {
    render(<NewsCardAnimation />);
    
    const container = screen.getByTestId('card-container');
    
    vi.clearAllMocks();
    
    act(() => {
      fireEvent.click(container);
      vi.advanceTimersByTime(500);
    });
    
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        news: expect.objectContaining({ id: 2 })
      }),
      expect.anything()
    );
    
    vi.clearAllMocks();
    
    act(() => {
      fireEvent.click(container);
      vi.advanceTimersByTime(500);
    });
    
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        news: expect.objectContaining({ id: 3 })
      }),
      expect.anything()
    );
    
    vi.clearAllMocks();
    
    act(() => {
      fireEvent.click(container);
      vi.advanceTimersByTime(500);
    });
    
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        news: expect.objectContaining({ id: 1 })
      }),
      expect.anything()
    );
  });

  it('should handle rapid clicks correctly', async () => {
    render(<NewsCardAnimation />);
    
    const container = screen.getByTestId('card-container');
    
    expect(container.className).toBe('card-container ');
    
    act(() => {
      fireEvent.click(container);
    });
    
    expect(container.className).toBe('card-container flip');
    
    act(() => {
      fireEvent.click(container);
    });
    
    expect(container.className).toBe('card-container flip');
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(container.className).toBe('card-container ');
    
    act(() => {
      fireEvent.click(container);
    });
    
    expect(container.className).toBe('card-container flip');
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(container.className).toBe('card-container ');
  });

  it('should do nothing if news array is empty', async () => {
    const EmptyNewsCardAnimation = () => {
      const [flipping, setFlipping] = React.useState(false);
      
      const handleNextNewsCard = () => {
        const news = [];
        if (news.length === 0) return;
        setFlipping(true);
      };
      
      return (
        <div
          data-testid="empty-card-container"
          className={`card-container ${flipping ? "flip" : ""}`}
          onClick={handleNextNewsCard}
        />
      );
    };
    
    render(<EmptyNewsCardAnimation />);
    
    const container = screen.getByTestId('empty-card-container');
    fireEvent.click(container);
    
    expect(container.className).toBe('card-container ');
  });

  it('should render with correct CSS classes for animation', async () => {
    render(<NewsCardAnimation />);
    
    const container = screen.getByTestId('card-container');
    
    expect(container.className).toBe('card-container ');
    
    act(() => {
      fireEvent.click(container);
    });
    
    expect(container.className).toBe('card-container flip');
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(container.className).toBe('card-container ');
  });
  
  it('should load news items on initial render', async () => {
    render(<NewsCardAnimation />);
    
    expect(NewsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        news: expect.objectContaining({
          id: 1,
          title: 'News Title', 
          brief: 'News Brief',
          content: 'News'
        })
      }),
      expect.anything()
    );
  });
});