import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, describe } from 'vitest';
import SocietyList from '../SocietyList';

describe('Society List Page', () => {
    test('should render society list page', () => {
        render(
        <MemoryRouter initialEntries={['/admin/society-list']}>
            <Routes>
            <Route path="/admin/society-list" element={<SocietyList />} /> 
            </Routes>
        </MemoryRouter>
        );
    
        expect(screen.getByText(/Society List/i)).toBeInTheDocument();
        expect(screen.getByText(/Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Members/i)).toBeInTheDocument();
        expect(screen.getByText(/president/i)).toBeInTheDocument();
    });
    });