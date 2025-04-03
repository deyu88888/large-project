import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CustomDrawer, CustomDrawerHeader, CustomAppBar } from '../../../components/layout/CustomDrawer';

const theme = createTheme();

describe('CustomDrawer Components', () => {
  it('renders CustomDrawer in opened state', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <CustomDrawer open={true}>
          <div>Drawer Content</div>
        </CustomDrawer>
      </ThemeProvider>
    );
    
    expect(container).not.toBeNull();
  });

  it('renders CustomDrawer in closed state', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <CustomDrawer open={false}>
          <div>Drawer Content</div>
        </CustomDrawer>
      </ThemeProvider>
    );
    
    expect(container).not.toBeNull();
  });

  it('renders CustomDrawerHeader correctly', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <CustomDrawerHeader />
      </ThemeProvider>
    );
    
    const headerElement = container.firstChild;
    expect(headerElement).toBeInTheDocument();
    expect(headerElement).toHaveStyle('display: flex');
    expect(headerElement).toHaveStyle('align-items: center');
    expect(headerElement).toHaveStyle('justify-content: flex-end');
  });

  it('renders CustomAppBar in opened state', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <CustomAppBar open={true} />
      </ThemeProvider>
    );
    
    const appBarElement = container.firstChild;
    expect(appBarElement).toBeInTheDocument();
    expect(appBarElement).toHaveStyle(`margin-left: ${240}px`);
    expect(appBarElement).toHaveStyle(`width: calc(100% - ${240}px)`);
  });

  it('renders CustomAppBar in closed state', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <CustomAppBar open={false} />
      </ThemeProvider>
    );
    
    const appBarElement = container.firstChild;
    expect(appBarElement).toBeInTheDocument();
    expect(appBarElement).toHaveStyle('margin-left: 0');
    expect(appBarElement).toHaveStyle('width: 100%');
  });

  it('applies correct display names to components', () => {
    expect(CustomDrawerHeader.displayName).toBe('CustomDrawerHeader');
    expect(CustomAppBar.displayName).toBe('CustomAppBar');
    expect(CustomDrawer.displayName).toBe('CustomDrawer');
  });
});