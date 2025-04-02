import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, describe } from 'vitest';
import NotFound from '../404';

describe('404 Page', () => {
  test('should render 404 page', () => {
    render(
      <MemoryRouter initialEntries={['/random-nonexistent-route']}>
        <Routes>
          <Route path="*" element={<NotFound />} /> 
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Go Back Home/i)).toBeInTheDocument();      // tests if the text content is 'Go Back Home, doesn't check if this embedded in the link 
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
    // expect(screen.getByRole('link')).toHaveClass('bg-blue-500');    // 'not worth testing'
    expect(screen.getByRole('link')).toHaveTextContent('Go Back Home');   // tests if the text content is 'Go Back Home'
    // can test class name 
  });
});
