import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DashboardFooter } from '../DashboardFooter';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';


const originalOpen = window.open;
const originalLocation = window.location;

beforeAll(() => {
  delete window.open;
  delete window.location;
  window.open = vi.fn();
  window.location = { href: '' };
});

afterAll(() => {
  window.open = originalOpen;
  window.location = originalLocation;
});

const renderWithTheme = (component) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('DashboardFooter', () => {
  it('renders the company name', () => {
    renderWithTheme(<DashboardFooter />);
    expect(screen.getByText('Infinite Loop Innovators')).toBeDefined();
  });

  it('renders the company description', () => {
    renderWithTheme(<DashboardFooter />);
    expect(screen.getByText('Driving innovation through collaborative solutions and cutting-edge technology.')).toBeDefined();
  });

  it('renders the Quick Links section with all links', () => {
    renderWithTheme(<DashboardFooter />);
    
    expect(screen.getByText('Quick Links')).toBeDefined();
    
    const quickLinks = ['Home', 'Discover', 'Societies', 'Events', 'Contact'];
    quickLinks.forEach(link => {
      expect(screen.getByText(link)).toBeDefined();
    });
  });
  
  it('renders the Resources section with all links', () => {
    renderWithTheme(<DashboardFooter />);
    
    expect(screen.getByText('Resources')).toBeDefined();
    
    const resourceLinks = ['FAQ', 'Support', 'Privacy Policy', 'Terms of Service'];
    resourceLinks.forEach(link => {
      expect(screen.getByText(link)).toBeDefined();
    });
  });

  it('renders the Contact Us section with address and contact info', () => {
    renderWithTheme(<DashboardFooter />);
    
    expect(screen.getByText('Contact Us')).toBeDefined();
    expect(screen.getByText(/King's College London/)).toBeDefined();
    expect(screen.getByText('infiniteloop@gmail.com')).toBeDefined();
    expect(screen.getByText('+44 746 667 1117')).toBeDefined();
  });

  it('renders the copyright section with current year', () => {
    const currentYear = new Date().getFullYear();
    renderWithTheme(<DashboardFooter />);
    
    expect(screen.getByText(`© ${currentYear} Infinite Loop Innovators. All rights reserved.`)).toBeDefined();
  });

  it('calls window.location.href when email icon is clicked', () => {
    renderWithTheme(<DashboardFooter />);
    
    const emailButton = screen.getByLabelText('Email');
    fireEvent.click(emailButton);
    
    expect(window.location.href).toBe('mailto:infiniteloop@gmail.com');
  });

  it('calls window.open when LinkedIn icon is clicked', () => {
    renderWithTheme(<DashboardFooter />);
    
    const linkedInButton = screen.getByLabelText('LinkedIn');
    fireEvent.click(linkedInButton);
    
    expect(window.open).toHaveBeenCalledWith(
      'https://uk.linkedin.com',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('calls window.open when GitHub icon is clicked', () => {
    renderWithTheme(<DashboardFooter />);
    
    const githubButton = screen.getByLabelText('GitHub');
    fireEvent.click(githubButton);
    
    expect(window.open).toHaveBeenCalledWith(
      'https://github.com/deyu88888/large-project',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('renders the correct email link in the contact section', () => {
    renderWithTheme(<DashboardFooter />);
    
    const emailLink = screen.getByText('infiniteloop@gmail.com');
    expect(emailLink.getAttribute('href')).toBe('mailto:infiniteloop@gmail.com');
  });

  it('renders the correct phone link in the contact section', () => {
    renderWithTheme(<DashboardFooter />);
    
    const phoneLink = screen.getByText('+44 746 667 1117');
    expect(phoneLink.getAttribute('href')).toBe('tel:+44-20-7836-5454');
  });
});