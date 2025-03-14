import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SocietyPreviewModal from '../SocietyPreviewModal';

describe('SocietyPreviewModal Component', () => {
  const mockSocietyData = {
    name: 'Tech Society',
    category: 'Technology',
    social_media_links: {
      facebook: 'https://facebook.com/techsociety',
      twitter: 'https://twitter.com/techsociety',
    },
    membership_requirements: 'Open to all students interested in technology',
    upcoming_projects_or_plans: 'Hackathon in March, Workshop series in April',
    tags: ['Technology', 'Programming', 'Innovation'],
    icon: 'https://example.com/icon.png',
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders all society details correctly with icon', () => {
    render(
      <SocietyPreviewModal
        open={true}
        onClose={mockOnClose}
        formData={mockSocietyData}
      />
    );
    expect(screen.getByText('Society Preview')).toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Tech Society')).toBeInTheDocument();
    expect(screen.getByText('Category:')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Membership Requirements:')).toBeInTheDocument();
    expect(
      screen.getByText('Open to all students interested in technology')
    ).toBeInTheDocument();
    expect(screen.getByText('Upcoming Projects or Plans:')).toBeInTheDocument();
    expect(
      screen.getByText('Hackathon in March, Workshop series in April')
    ).toBeInTheDocument();
    expect(screen.getByText('Tags:')).toBeInTheDocument();
    expect(
      screen.getByText('Technology, Programming, Innovation')
    ).toBeInTheDocument();
    expect(screen.getByText('Social Media Links:')).toBeInTheDocument();
    expect(
      screen.getByText('facebook: https://facebook.com/techsociety')
    ).toBeInTheDocument();
    expect(
      screen.getByText('twitter: https://twitter.com/techsociety')
    ).toBeInTheDocument();
    expect(screen.getByText('Icon:')).toBeInTheDocument();
    const icon = screen.getByAltText('Society icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', 'https://example.com/icon.png');
    expect(screen.getByText('Close Preview')).toBeInTheDocument();
  });

  it('renders without icon when icon is not a string', () => {
    const dataWithoutIcon = {
      ...mockSocietyData,
      icon: new File([''], 'icon.png'),
    };
    render(
      <SocietyPreviewModal
        open={true}
        onClose={mockOnClose}
        formData={dataWithoutIcon}
      />
    );
    expect(screen.queryByText('Icon:')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Society icon')).not.toBeInTheDocument();
  });

  it('renders without icon when icon is null', () => {
    const dataWithoutIcon = {
      ...mockSocietyData,
      icon: null,
    };
    render(
      <SocietyPreviewModal
        open={true}
        onClose={mockOnClose}
        formData={dataWithoutIcon}
      />
    );
    expect(screen.queryByText('Icon:')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Society icon')).not.toBeInTheDocument();
  });

  it('calls onClose when Close Preview button is clicked', () => {
    render(
      <SocietyPreviewModal
        open={true}
        onClose={mockOnClose}
        formData={mockSocietyData}
      />
    );
    fireEvent.click(screen.getByText('Close Preview'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders correctly with empty social media links', () => {
    const dataWithEmptySocialMedia = {
      ...mockSocietyData,
      social_media_links: {},
    };
    render(
      <SocietyPreviewModal
        open={true}
        onClose={mockOnClose}
        formData={dataWithEmptySocialMedia}
      />
    );
    expect(screen.getByText('Social Media Links:')).toBeInTheDocument();
    expect(screen.queryByText(/facebook:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/twitter:/)).not.toBeInTheDocument();
  });

  it('renders correctly with empty tags', () => {
    const dataWithEmptyTags = {
      ...mockSocietyData,
      tags: [],
    };
    render(
      <SocietyPreviewModal
        open={true}
        onClose={mockOnClose}
        formData={dataWithEmptyTags}
      />
    );
    expect(screen.getByText('Tags:')).toBeInTheDocument();
    const tagsElement = screen.getByText('Tags:').nextSibling;
    expect(tagsElement?.textContent).toBe('');
  });
});
