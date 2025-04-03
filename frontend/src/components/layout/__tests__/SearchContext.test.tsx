import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useContext } from 'react';
import { SearchContext, SearchProvider } from '../SearchContext';

const TestComponent = () => {
  const { searchTerm, setSearchTerm } = useContext(SearchContext);
  
  return (
    <div>
      <div data-testid="search-term">{searchTerm}</div>
      <input 
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button data-testid="clear-button" onClick={() => setSearchTerm("")}>
        Clear
      </button>
    </div>
  );
};

describe('SearchContext', () => {
  it('provides default empty search term', () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    expect(screen.getByTestId('search-term').textContent).toBe('');
  });
  
  it('updates search term when setSearchTerm is called', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    const input = screen.getByTestId('search-input');
    await user.type(input, 'test search');
    
    expect(screen.getByTestId('search-term').textContent).toBe('test search');
  });
  
  it('clears search term when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    const input = screen.getByTestId('search-input');
    await user.type(input, 'test search');
    
    expect(screen.getByTestId('search-term').textContent).toBe('test search');
    
    const clearButton = screen.getByTestId('clear-button');
    await user.click(clearButton);
    
    expect(screen.getByTestId('search-term').textContent).toBe('');
  });
  
  it('shares state between multiple components', async () => {
    const user = userEvent.setup();
    
    const SecondComponent = () => {
      const { searchTerm } = useContext(SearchContext);
      return <div data-testid="second-component">{searchTerm}</div>;
    };
    
    render(
      <SearchProvider>
        <TestComponent />
        <SecondComponent />
      </SearchProvider>
    );
    
    const input = screen.getByTestId('search-input');
    await user.type(input, 'shared data');
    
    expect(screen.getByTestId('search-term').textContent).toBe('shared data');
    expect(screen.getByTestId('second-component').textContent).toBe('shared data');
  });
});