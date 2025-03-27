import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SocietyPreviewModal from '../SocietyPreviewModal';
import { SocietyPreviewModalProps } from '../../../types/president/societyPreviewModal';

describe('SocietyPreviewModal Component', () => {
  const mockOnClose = vi.fn();
  
  const mockFormData = {
    name: 'Test Society',
    category: 'Academic',
    membership_requirements: 'Open to all students',
    upcoming_projects_or_plans: 'Annual conference in Spring',
    tags: ['academic', 'research', 'community'],
    social_media_links: {
      Twitter: 'https:
      Instagram: 'https:
    },
    icon: 'data:image/png;base64,fakeImageData'
  };

  const renderComponent = (props: Partial<SocietyPreviewModalProps> = {}) => {
    const defaultProps: SocietyPreviewModalProps = {
      open: true,
      onClose: mockOnClose,
      formData: mockFormData,
      ...props
    };

    return render(<SocietyPreviewModal {...defaultProps} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog with correct title when open', () => {
    renderComponent();
    expect(screen.getByText('Society Preview')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderComponent({ open: false });
    expect(screen.queryByText('Society Preview')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Close Preview'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays society name correctly', () => {
    renderComponent();
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Test Society')).toBeInTheDocument();
  });

  it('displays society category correctly', () => {
    renderComponent();
    expect(screen.getByText('Category:')).toBeInTheDocument();
    expect(screen.getByText('Academic')).toBeInTheDocument();
  });

  it('displays membership requirements correctly', () => {
    renderComponent();
    expect(screen.getByText('Membership Requirements:')).toBeInTheDocument();
    expect(screen.getByText('Open to all students')).toBeInTheDocument();
  });

  it('displays upcoming projects correctly', () => {
    renderComponent();
    expect(screen.getByText('Upcoming Projects or Plans:')).toBeInTheDocument();
    expect(screen.getByText('Annual conference in Spring')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    renderComponent();
    expect(screen.getByText('Tags:')).toBeInTheDocument();
    expect(screen.getByText('academic, research, community')).toBeInTheDocument();
  });

  it('displays social media links correctly', () => {
    renderComponent();
    expect(screen.getByText('Social Media Links:')).toBeInTheDocument();
    expect(screen.getByText('Twitter: https:
    expect(screen.getByText('Instagram: https:
  });

  it('displays icon when available', () => {
    renderComponent();
    expect(screen.getByText('Icon:')).toBeInTheDocument();
    const icon = screen.getByAltText('Society icon');
    expect(icon).toBeInTheDocument();
    expect(icon.getAttribute('src')).toBe('data:image/png;base64,fakeImageData');
  });

  it('does not display icon section when icon is not available', () => {
    renderComponent({
      formData: {
        ...mockFormData,
        icon: undefined
      }
    });
    expect(screen.queryByText('Icon:')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Society icon')).not.toBeInTheDocument();
  });

  it('does not display icon section when icon is not a string', () => {
    renderComponent({
      formData: {
        ...mockFormData,
        icon: {} as any 
      }
    });
    expect(screen.queryByText('Icon:')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Society icon')).not.toBeInTheDocument();
  });

  it('handles empty social media links', () => {
    renderComponent({
      formData: {
        ...mockFormData,
        social_media_links: {}
      }
    });
    expect(screen.getByText('Social Media Links:')).toBeInTheDocument();
    expect(screen.queryByText(/Twitter:/)).not.toBeInTheDocument();
  });

  it('handles empty tags array', () => {
    renderComponent({
      formData: {
        ...mockFormData,
        tags: []
      }
    });
    expect(screen.getByText('Tags:')).toBeInTheDocument();
    
    
    const tagsSection = screen.getByText('Tags:').closest('.MuiBox-root');
    expect(tagsSection).toBeInTheDocument();
    const emptyParagraph = tagsSection?.querySelector('p.MuiTypography-body1');
    expect(emptyParagraph).toBeInTheDocument();
    expect(emptyParagraph?.textContent).toBe('');
  });
});