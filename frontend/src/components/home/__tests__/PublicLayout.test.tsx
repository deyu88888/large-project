import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import PublicLayout from '../PublicLayout';


vi.mock('../DashboardNavbar', () => ({
  DashboardNavbar: () => <div data-testid="mock-navbar">Navbar</div>
}));

vi.mock('../DashboardFooter', () => ({
  DashboardFooter: () => <div data-testid="mock-footer">Footer</div>
}));

vi.mock('../HeroSection', () => ({
  __esModule: true,
  default: ({ title, subtitle, breadcrumbs, showCarousel }) => (
    <div data-testid="mock-hero">
      <div data-testid="hero-title">{title}</div>
      <div data-testid="hero-subtitle">{subtitle}</div>
      <div data-testid="hero-carousel">{String(showCarousel)}</div>
      <div data-testid="hero-breadcrumbs">
        {breadcrumbs?.map((b, i) => (
          <span key={i} data-href={b.href}>{b.label}</span>
        ))}
      </div>
    </div>
  )
}));

vi.mock('../../layout/SearchContext', () => ({
  SearchProvider: ({ children }) => <div data-testid="mock-search-provider">{children}</div>
}));

const renderWithRouter = (ui, { route = '/' } = {}) => {
  const theme = createTheme();
  
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('PublicLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children, navbar and footer', () => {
    renderWithRouter(
      <PublicLayout>
        <div data-testid="child-content">Child Content</div>
      </PublicLayout>
    );
    
    expect(screen.getByTestId('mock-navbar')).toBeDefined();
    expect(screen.getByTestId('mock-footer')).toBeDefined();
    expect(screen.getByTestId('child-content')).toBeDefined();
    expect(screen.getByText('Child Content')).toBeDefined();
  });

  it('renders hero section on the home page with correct props', () => {
    renderWithRouter(
      <PublicLayout>
        <div>Content</div>
      </PublicLayout>,
      { route: '/' }
    );
    
    expect(screen.getByTestId('mock-hero')).toBeDefined();
    expect(screen.getByTestId('hero-title').textContent).toBe('Welcome to Infinite Loop Innovators');
    expect(screen.getByTestId('hero-subtitle').textContent).toBe('Discover societies, events, and latest news all in one place');
    expect(screen.getByTestId('hero-carousel').textContent).toBe('true');
    
    const breadcrumbs = screen.getByTestId('hero-breadcrumbs');
    expect(breadcrumbs.textContent).toBe('Home');
  });

  it('renders hero section on search page with correct props', () => {
    renderWithRouter(
      <PublicLayout>
        <div>Content</div>
      </PublicLayout>,
      { route: '/search' }
    );
    
    expect(screen.getByTestId('mock-hero')).toBeDefined();
    expect(screen.getByTestId('hero-title').textContent).toBe('Discover');
    expect(screen.getByTestId('hero-subtitle').textContent).toBe('Find the perfect community for you!');
    expect(screen.getByTestId('hero-carousel').textContent).toBe('false');
    
    const breadcrumbs = screen.getByTestId('hero-breadcrumbs');
    expect(breadcrumbs.innerHTML).toContain('Home');
    expect(breadcrumbs.innerHTML).toContain('Discover');
    
    
    const homeSpan = Array.from(breadcrumbs.querySelectorAll('span')).find(span => 
      span.textContent === 'Home'
    );
    expect(homeSpan?.getAttribute('data-href')).toBe('/');
    
    const discoverSpan = Array.from(breadcrumbs.querySelectorAll('span')).find(span => 
      span.textContent === 'Discover'
    );
    expect(discoverSpan?.getAttribute('data-href')).toBeNull();
  });

  it('renders hero section on all-societies page with correct props', () => {
    renderWithRouter(
      <PublicLayout>
        <div>Content</div>
      </PublicLayout>,
      { route: '/all-societies' }
    );
    
    expect(screen.getByTestId('mock-hero')).toBeDefined();
    expect(screen.getByTestId('hero-title').textContent).toBe('Explore Campus Societies');
    expect(screen.getByTestId('hero-subtitle').textContent).toBe('Find the perfect community for you');
  });

  it('renders hero section on all-events page with correct props', () => {
    renderWithRouter(
      <PublicLayout>
        <div>Content</div>
      </PublicLayout>,
      { route: '/all-events' }
    );
    
    expect(screen.getByTestId('mock-hero')).toBeDefined();
    expect(screen.getByTestId('hero-title').textContent).toBe('Explore Campus Events');
    expect(screen.getByTestId('hero-subtitle').textContent).toBe('Find the perfect event for you');
  });

  it('does not render hero section on login page', () => {
    renderWithRouter(
      <PublicLayout>
        <div>Content</div>
      </PublicLayout>,
      { route: '/login' }
    );
    
    expect(screen.queryByTestId('mock-hero')).toBeNull();
  });

  it('does not render hero section on register page', () => {
    renderWithRouter(
      <PublicLayout>
        <div>Content</div>
      </PublicLayout>,
      { route: '/register' }
    );
    
    expect(screen.queryByTestId('mock-hero')).toBeNull();
  });

  it('renders default hero content for unknown routes', () => {
    renderWithRouter(
      <PublicLayout>
        <div>Content</div>
      </PublicLayout>,
      { route: '/unknown-route' }
    );
    
    expect(screen.getByTestId('mock-hero')).toBeDefined();
    expect(screen.getByTestId('hero-title').textContent).toBe('Discover');
    expect(screen.getByTestId('hero-subtitle').textContent).toBe('Explore our platform.');
    
    
    const breadcrumbs = screen.getByTestId('hero-breadcrumbs');
    expect(breadcrumbs.textContent).toContain('Home');
    expect(breadcrumbs.textContent).toContain('unknown-route');
    
    const homeSpan = Array.from(breadcrumbs.querySelectorAll('span')).find(span => 
      span.textContent === 'Home'
    );
    expect(homeSpan?.getAttribute('data-href')).toBe('/');
  });
});