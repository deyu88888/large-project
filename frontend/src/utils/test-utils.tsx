import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
// import '@testing-library/jest-dom';

export function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}