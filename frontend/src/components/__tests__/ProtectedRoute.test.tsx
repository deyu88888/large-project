import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('ProtectedRoute', () => {
  it('renders children when user is logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: true });
    
    const { getByText } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    
    expect(getByText('Protected Content')).toBeInTheDocument();
  });
  
  it('redirects to login when user is not logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: false });
    
    const { queryByText } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          } />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(queryByText('Protected Content')).not.toBeInTheDocument();
    expect(queryByText('Login Page')).toBeInTheDocument();
  });
  
  it('redirects to custom path when specified', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: false });
    
    const { queryByText } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <ProtectedRoute redirectPath="/custom-login">
              <div>Protected Content</div>
            </ProtectedRoute>
          } />
          <Route path="/custom-login" element={<div>Custom Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(queryByText('Protected Content')).not.toBeInTheDocument();
    expect(queryByText('Custom Login Page')).toBeInTheDocument();
  });
});