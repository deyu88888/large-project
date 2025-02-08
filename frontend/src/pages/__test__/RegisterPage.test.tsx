import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, describe } from 'vitest';
import RegisterPage from '../register';

describe('registration page', () => {
  test('should render registration page', () => {
    render(
      <MemoryRouter initialEntries={['/random-nonexistent-route']}>
        <Routes>
          <Route path="*" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Register as a Student/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
  });
});
