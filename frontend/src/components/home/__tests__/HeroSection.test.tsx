import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import HeroSection from '../HeroSection';


vi.mock('react-material-ui-carousel', () => ({
  default: ({ children }) => <div data-testid="carousel">{children}</div>,
}));


vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    grey: {
      100: '#e0e0e0',
      200: '#c2c2c2',
    },
    greenAccent: {
      400: '#4caf50',
    },
  }),
}));

const renderWithTheme = (ui, { mode = 'light' } = {}) => {
  const theme = createTheme({
    palette: {
      mode,
      secondary: {
        main: '#f5f5f5',  
        light: '#f5f5f5',
        dark: '#212121',
      },
      greenAccent: {
        main: '#4caf50',
        dark: '#388e3c',
      },
    },
  });

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('HeroSection', () => {
  it('renders with title and subtitle', () => {
    renderWithTheme(
      <HeroSection 
        title="Test Title" 
        subtitle="Test Subtitle" 
      />
    );
    
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test Subtitle')).toBeDefined();
  });

  it('renders without carousel by default', () => {
    renderWithTheme(
      <HeroSection 
        title="Test Title" 
        subtitle="Test Subtitle" 
      />
    );
    
    
    expect(screen.queryByTestId('carousel')).toBeNull();
  });

  it('renders with carousel when showCarousel is true', () => {
    renderWithTheme(
      <HeroSection 
        showCarousel={true}
        title="Test Title" 
        subtitle="Test Subtitle" 
      />
    );
    
    
    expect(screen.getByTestId('carousel')).toBeDefined();
    
    
    expect(screen.getByText('Welcome to Infinite Loop Innovators')).toBeDefined();
    expect(screen.getByText('Discover societies, events, and latest news all in one place')).toBeDefined();
    
    
    expect(screen.getByText('Featured Content 1')).toBeDefined();
  });

  it('renders breadcrumbs when provided', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Current Page' },
    ];
    
    renderWithTheme(
      <HeroSection 
        title="Test Title" 
        subtitle="Test Subtitle"
        breadcrumbs={breadcrumbs}
      />
    );
    
    
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Category')).toBeDefined();
    expect(screen.getByText('Current Page')).toBeDefined();
    
    
    const homeLink = screen.getByText('Home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    
    const categoryLink = screen.getByText('Category');
    expect(categoryLink.closest('a')).toHaveAttribute('href', '/category');
    
    
    const currentPage = screen.getByText('Current Page');
    expect(currentPage.closest('a')).toBeNull();
  });

  it('renders in dark mode', () => {
    renderWithTheme(
      <HeroSection 
        title="Test Title" 
        subtitle="Test Subtitle" 
      />,
      { mode: 'dark' }
    );
    
    
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test Subtitle')).toBeDefined();
  });

  it('renders with responsive typography', () => {
    renderWithTheme(
      <HeroSection 
        title="Test Title" 
        subtitle="Test Subtitle" 
      />
    );
    
    const titleElement = screen.getByText('Test Title');
    expect(titleElement.tagName).toBe('H1');
    
    const subtitleElement = screen.getByText('Test Subtitle');
    expect(subtitleElement.tagName).toBe('H6');
  });
});