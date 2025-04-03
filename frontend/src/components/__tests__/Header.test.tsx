import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../Header'; 

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        mode: 'light'
      }
    })
  };
});

vi.mock('../theme/theme', () => ({
  tokens: () => ({
    grey: {
      100: '#mock-grey-100'
    },
    blueAccent: {
      400: '#mock-blue-400'
    }
  })
}));

describe('Header Component', () => {
  const mockProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle'
  };

  it('renders the component with correct props', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('applies correct styling based on theme', () => {
    const { container } = render(<Header {...mockProps} />);
    const boxElement = container.firstChild;
    expect(boxElement).toHaveStyle('margin-bottom: 30px');
    const titleElement = screen.getByText('Test Title');
    const subtitleElement = screen.getByText('Test Subtitle');
    expect(titleElement.tagName).toBe('H2');
    expect(titleElement).toHaveStyle('font-weight: 700');
    expect(titleElement).toHaveStyle('margin: 0 0 5px 0');
    expect(subtitleElement.tagName).toBe('H5');
  });

  it('renders with different props', () => {
    const differentProps = {
      title: 'Another Title',
      subtitle: 'Another Subtitle'
    };
    render(<Header {...differentProps} />);
    expect(screen.getByText('Another Title')).toBeInTheDocument();
    expect(screen.getByText('Another Subtitle')).toBeInTheDocument();
  });

  it('handles missing subtitle', () => {
    const incompleteProps = {
      title: 'Title Only',
      subtitle: ''
    };
    render(<Header {...incompleteProps} />);
    expect(screen.getByText('Title Only')).toBeInTheDocument();
    const typography = screen.getAllByRole('heading');
    expect(typography[1].textContent).toBe('');
  });
});
