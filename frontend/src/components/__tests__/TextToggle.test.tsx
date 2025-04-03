import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextToggle } from '../../components/TextToggle';

describe('TextToggle', () => {
  const defaultProps = {
    sortOption: 'time' as const,
    setSortOption: vi.fn(),
    commentsPerPage: 25,
    setCommentsPerPage: vi.fn(),
    setPage: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<TextToggle {...defaultProps} />);
    
    expect(screen.getByText('time')).toBeInTheDocument();
    expect(screen.getByText('popularity')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('per page')).toBeInTheDocument();
  });

  it('highlights the active sort option', () => {
    const { rerender } = render(<TextToggle {...defaultProps} sortOption="time" />);
    
    expect(screen.getByText('time')).toHaveStyle('color: #000');
    expect(screen.getByText('time')).toHaveStyle('font-weight: bold');
    expect(screen.getByText('popularity')).toHaveStyle('color: #999');
    expect(screen.getByText('popularity')).toHaveStyle('font-weight: normal');
    
    rerender(<TextToggle {...defaultProps} sortOption="popularity" />);
    
    expect(screen.getByText('time')).toHaveStyle('color: #999');
    expect(screen.getByText('time')).toHaveStyle('font-weight: normal');
    expect(screen.getByText('popularity')).toHaveStyle('color: #000');
    expect(screen.getByText('popularity')).toHaveStyle('font-weight: bold');
  });

  it('highlights the active comments per page option', () => {
    const { rerender } = render(<TextToggle {...defaultProps} commentsPerPage={10} />);
    
    expect(screen.getByText('10')).toHaveStyle('color: #000');
    expect(screen.getByText('10')).toHaveStyle('font-weight: bold');
    expect(screen.getByText('25')).toHaveStyle('color: #999');
    
    rerender(<TextToggle {...defaultProps} commentsPerPage={25} />);
    
    expect(screen.getByText('10')).toHaveStyle('color: #999');
    expect(screen.getByText('10')).toHaveStyle('font-weight: normal');
    expect(screen.getByText('25')).toHaveStyle('color: #000');
    expect(screen.getByText('25')).toHaveStyle('font-weight: bold');
  });

  it('calls setSortOption when clicking on sort options', () => {
    render(<TextToggle {...defaultProps} />);
    
    fireEvent.click(screen.getByText('popularity'));
    expect(defaultProps.setSortOption).toHaveBeenCalledWith('popularity');
    
    fireEvent.click(screen.getByText('time'));
    expect(defaultProps.setSortOption).toHaveBeenCalledWith('time');
  });

  it('calls setCommentsPerPage and setPage when clicking on comments per page options', () => {
    render(<TextToggle {...defaultProps} />);
    
    fireEvent.click(screen.getByText('10'));
    expect(defaultProps.setCommentsPerPage).toHaveBeenCalledWith(10);
    expect(defaultProps.setPage).toHaveBeenCalledWith(1);
    
    fireEvent.click(screen.getByText('50'));
    expect(defaultProps.setCommentsPerPage).toHaveBeenCalledWith(50);
    expect(defaultProps.setPage).toHaveBeenCalledWith(1);
    
    fireEvent.click(screen.getByText('100'));
    expect(defaultProps.setCommentsPerPage).toHaveBeenCalledWith(100);
    expect(defaultProps.setPage).toHaveBeenCalledWith(1);
  });

  it('renders all comments per page options with separators', () => {
    render(<TextToggle {...defaultProps} />);
    
    const separators = screen.getAllByText('|');
    expect(separators).toHaveLength(4); 
    
    const timeElement = screen.getByText('time');
    const popularityElement = screen.getByText('popularity');
    expect(separators[0].compareDocumentPosition(timeElement)).toBeTruthy();
    expect(separators[0].compareDocumentPosition(popularityElement)).toBeTruthy();
    
    const pageOptions = [10, 25, 50, 100].map(num => screen.getByText(num.toString()));
    pageOptions.forEach((option, index) => {
      if (index < pageOptions.length - 1) {
        expect(separators[index + 1].compareDocumentPosition(option)).toBeTruthy();
        expect(separators[index + 1].compareDocumentPosition(pageOptions[index + 1])).toBeTruthy();
      }
    });
  });
});