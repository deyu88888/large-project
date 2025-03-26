import { jsx as _jsx } from "react/jsx-runtime";
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// import '@testing-library/jest-dom';
export function renderWithRouter(ui) {
    return render(_jsx(MemoryRouter, { children: ui }));
}
