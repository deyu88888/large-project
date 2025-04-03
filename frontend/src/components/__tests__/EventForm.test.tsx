import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Snackbar: vi.fn(({ open, message }) => open ? <div>{message}</div> : null),
    Menu: vi.fn(({ open, children }) => open ? <div>{children}</div> : null),
  };
});

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    DndContext: vi.fn(({ children }) => <div>{children}</div>),
  };
});

vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable');
  return {
    ...actual,
    SortableContext: vi.fn(({ children }) => <div>{children}</div>),
  };
});

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mocked-object-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true,
  configurable: true
});

import { EventForm } from '../EventForm';

vi.mock('../SortableItem', () => ({
  SortableItem: vi.fn(({ mod, onDelete }) => (
    <div data-testid="sortable-item">
      {mod.type}
      <button onClick={() => onDelete(mod.id)}>Delete</button>
    </div>
  ))
}));

vi.mock('../EventPreview', () => ({
  EventPreview: vi.fn(({ open, onClose }) => (
    open ? <div data-testid="event-preview">Event Preview</div> : null
  ))
}));

describe('EventForm Component', () => {
  const mockOnSubmit = vi.fn(async () => {});
  const defaultProps = {
    onSubmit: mockOnSubmit,
    submitButtonText: 'Submit Event',
  };

  const fillBasicEventDetails = (container) => {
    const titleInput = container.querySelector('input[type="text"]');
    const dateInput = container.querySelector('input[type="date"]');
    const startTimeInput = container.querySelector('input[type="time"]');
    const durationInput = container.querySelectorAll('input[type="text"]')[1];
    const locationInput = container.querySelectorAll('input[type="text"]')[2];
    const maxCapacityInput = container.querySelector('input[type="number"]');
    const descriptionInput = container.querySelector('textarea');
    const adminReasonInput = container.querySelectorAll('textarea')[1];

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(dateInput, { target: { value: '2024-12-31' } });
    fireEvent.change(startTimeInput, { target: { value: '18:00' } });
    fireEvent.change(durationInput, { target: { value: '02:00:00' } });
    fireEvent.change(locationInput, { target: { value: 'Test Location' } });
    fireEvent.change(maxCapacityInput, { target: { value: '50' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.change(adminReasonInput, { target: { value: 'Test Admin Reason' } });
  };

  it('renders the form with default props', () => {
    render(<EventForm {...defaultProps} />);
    expect(screen.getByText('Create a New Event')).toBeInTheDocument();
    expect(screen.getByText('Submit Event')).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const { container } = render(<EventForm {...defaultProps} />);
    const fileInput = container.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    fireEvent.change(fileInput);
    fillBasicEventDetails(container);
    const form = container.querySelector('form');
    fireEvent.submit(form);
  });

  it('prevents submission of past events', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const { container } = render(<EventForm {...defaultProps} />);
    const dateInput = container.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: pastDate } });
    fillBasicEventDetails(container);
    const form = container.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('You cannot submit a past event')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('allows adding extra modules', () => {
    render(<EventForm {...defaultProps} />);
    const addExtraModuleButton = screen.getByText('Add Extra Module');
    fireEvent.click(addExtraModuleButton);
    const subtitleMenuItem = screen.getByText('Subtitle');
    fireEvent.click(subtitleMenuItem);
    const sortableItems = screen.getAllByTestId('sortable-item');
    expect(sortableItems.length).toBe(1);
    expect(sortableItems[0]).toHaveTextContent('subtitle');
  });

  it('allows deleting extra modules', () => {
    render(<EventForm {...defaultProps} />);
    const addExtraModuleButton = screen.getByText('Add Extra Module');
    fireEvent.click(addExtraModuleButton);
    const subtitleMenuItem = screen.getByText('Subtitle');
    fireEvent.click(subtitleMenuItem);
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    const sortableItems = screen.queryAllByTestId('sortable-item');
    expect(sortableItems.length).toBe(0);
  });

  it('opens event preview', async () => {
    const { container } = render(<EventForm {...defaultProps} />);
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    fireEvent.change(fileInput);
    fillBasicEventDetails(container);
    const previewButton = screen.getByText('Preview Event');
    fireEvent.click(previewButton);
    const preview = screen.getByTestId('event-preview');
    expect(preview).toBeInTheDocument();
  });

  it('renders in edit mode when initial data is provided', () => {
    const initialData = {
      title: 'Existing Event',
      date: '2024-12-31',
      startTime: '18:00',
      duration: '02:00:00',
      location: 'Existing Location',
      maxCapacity: 100,
      mainDescription: 'Existing Description',
      coverImageUrl: 'http://example.com/image.jpg',
    };
    render(<EventForm {...defaultProps} initialData={initialData} isEditMode={true} />);
    expect(screen.getByText('Edit Event')).toBeInTheDocument();
    const titleInput = screen.getByDisplayValue('Existing Event');
    expect(titleInput).toBeInTheDocument();
  });
});