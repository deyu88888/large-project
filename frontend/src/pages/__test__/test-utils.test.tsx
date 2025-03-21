import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../utils/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock components for testing
const HomePage = () => <div data-testid="home-page">Home Page</div>;
const AboutPage = () => <div data-testid="about-page">About Page</div>;

const TestComponent = () => {
  return (
    <div>
      <nav>
        <Link to="/" data-testid="home-link">Home</Link>
        <Link to="/about" data-testid="about-link">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  );
};

describe('renderWithRouter', () => {
  it('should render a component with router context', () => {
    renderWithRouter(<TestComponent />);
    
    // Check that the component renders with default route (/)
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('about-page')).not.toBeInTheDocument();
    
    // Check that navigation links are rendered
    expect(screen.getByTestId('home-link')).toBeInTheDocument();
    expect(screen.getByTestId('about-link')).toBeInTheDocument();
  });
  
  it('should properly handle navigation', () => {
    // Setup
    renderWithRouter(<TestComponent />);
    
    // Initial state check - we should be on the home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    
    // Click on the about link
    fireEvent.click(screen.getByTestId('about-link'));
    
    // We should now be on the about page
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    
    // Go back to home
    fireEvent.click(screen.getByTestId('home-link'));
    
    // We should be back on the home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('about-page')).not.toBeInTheDocument();
  });
  
  it('should maintain router context for nested components', () => {
    // A component that uses router context
    const NestedRouterConsumer = () => {
      return <div data-testid="nested-component">Nested Component</div>;
    };
    
    // Wrap it in our utility
    renderWithRouter(
      <div>
        <TestComponent />
        <NestedRouterConsumer />
      </div>
    );
    
    // Both components should render properly
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('nested-component')).toBeInTheDocument();
  });
});