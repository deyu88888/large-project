import { describe, it, expect, vi } from 'vitest';
import { SocietyPreviewModalProps, PreviewSectionProps } from '../previewModal';
import { SocietyData } from '../society';

describe('SocietyPreviewModalProps', () => {
  it('should create valid SocietyPreviewModalProps object', () => {
    // Arrange
    const mockSocietyData: SocietyData = {
      name: 'Test Society',
      description: 'This is a test society',
      // Add other required properties based on your SocietyData interface
    };

    // Act
    const props: SocietyPreviewModalProps = {
      open: true,
      onClose: vi.fn(),
      formData: mockSocietyData,
    };

    // Assert
    expect(props.open).toBe(true);
    expect(props.onClose).toBeInstanceOf(Function);
    expect(props.formData).toEqual(mockSocietyData);
  });

  it('should call onClose when triggered', () => {
    // Arrange
    const onCloseMock = vi.fn();
    const props: SocietyPreviewModalProps = {
      open: true,
      onClose: onCloseMock,
      formData: {} as SocietyData,
    };

    // Act
    props.onClose();

    // Assert
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

describe('PreviewSectionProps', () => {
  it('should create valid PreviewSectionProps object', () => {
    // Arrange & Act
    const props: PreviewSectionProps = {
      title: 'Test Title',
      content: 'Test Content', // Using string instead of JSX
    };

    // Assert
    expect(props.title).toBe('Test Title');
    expect(props.content).toBeDefined();
  });
});
