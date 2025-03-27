import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocietyPreviewData, SocietyPreviewModalProps, PreviewSectionProps } from '../societyPreviewModal';

describe('Society Preview Interfaces', () => {
  let mockSocietyData: SocietyPreviewData;
  let mockModalProps: SocietyPreviewModalProps;
  
  beforeEach(() => {
    // Setup mock data for testing
    mockSocietyData = {
      name: 'Coding Club',
      category: 'Technology',
      social_media_links: {
        instagram: 'https://instagram.com/codingclub',
        twitter: 'https://twitter.com/codingclub'
      },
      membership_requirements: 'Open to all students interested in coding',
      upcoming_projects_or_plans: 'Hackathon in Spring 2025',
      tags: ['coding', 'technology', 'programming'],
      icon: null
    };
    
    mockModalProps = {
      open: true,
      onClose: vi.fn(),
      formData: mockSocietyData
    };
  });
  
  it('should create valid SocietyPreviewData', () => {
    expect(mockSocietyData).toBeDefined();
    expect(mockSocietyData.name).toBe('Coding Club');
    expect(mockSocietyData.category).toBe('Technology');
    expect(mockSocietyData.tags).toHaveLength(3);
    expect(mockSocietyData.social_media_links).toHaveProperty('instagram');
    expect(mockSocietyData.social_media_links).toHaveProperty('twitter');
  });
  
  it('should create valid SocietyPreviewModalProps', () => {
    expect(mockModalProps).toBeDefined();
    expect(mockModalProps.open).toBe(true);
    expect(mockModalProps.onClose).toBeDefined();
    expect(typeof mockModalProps.onClose).toBe('function');
    expect(mockModalProps.formData).toEqual(mockSocietyData);
  });
  
  it('should test onClose function is callable', () => {
    mockModalProps.onClose();
    expect(mockModalProps.onClose).toHaveBeenCalledTimes(1);
  });
  
  it('should validate PreviewSectionProps', () => {
    const previewSection: PreviewSectionProps = {
      title: 'Test Section',
      content: 'This is test content'
    };
    
    expect(previewSection).toBeDefined();
    expect(previewSection.title).toBe('Test Section');
    expect(previewSection.content).toBe('This is test content');
  });
  
  it('should handle optional icon property', () => {
    // Test with string
    mockSocietyData.icon = 'icon-path.png';
    expect(mockSocietyData.icon).toBe('icon-path.png');
    
    // Test with null
    mockSocietyData.icon = null;
    expect(mockSocietyData.icon).toBeNull();
    
    // Test with File object
    const mockFile = new File([''], 'filename.png', { type: 'image/png' });
    mockSocietyData.icon = mockFile;
    expect(mockSocietyData.icon).toBeInstanceOf(File);
  });
  
  it('should validate social media links', () => {
    // Test adding a new social media link
    mockSocietyData.social_media_links.facebook = 'https://facebook.com/codingclub';
    
    expect(Object.keys(mockSocietyData.social_media_links)).toHaveLength(3);
    expect(mockSocietyData.social_media_links.facebook).toBe('https://facebook.com/codingclub');
    
    // Test removing a social media link
    const { twitter, ...restLinks } = mockSocietyData.social_media_links;
    mockSocietyData.social_media_links = restLinks;
    
    expect(Object.keys(mockSocietyData.social_media_links)).toHaveLength(2);
    expect(mockSocietyData.social_media_links).not.toHaveProperty('twitter');
  });
});