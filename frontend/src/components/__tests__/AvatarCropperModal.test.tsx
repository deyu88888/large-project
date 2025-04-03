import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AvatarCropperModal from '../AvatarCropperModal';

vi.mock('react-easy-crop', () => ({
  default: ({ onCropChange, onZoomChange, onCropComplete }) => {
    return (
      <div data-testid="mock-cropper">
        <button 
          data-testid="crop-change-btn" 
          onClick={() => onCropChange({ x: 10, y: 20 })}
        >
          Change Crop
        </button>
        <button 
          data-testid="zoom-change-btn" 
          onClick={() => onZoomChange(1.5)}
        >
          Change Zoom
        </button>
        <button 
          data-testid="crop-complete-btn" 
          onClick={() => onCropComplete({ width: 100, height: 100 }, { x: 10, y: 20, width: 300, height: 300 })}
        >
          Complete Crop
        </button>
      </div>
    );
  }
}));

describe('AvatarCropperModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockImageSrc = 'data:image/jpeg;base64,/9j/sample';
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      blob: vi.fn().mockResolvedValue(new Blob(['mock-image-data'], { type: 'image/jpeg' }))
    });
  });
  
  it('renders correctly when open', () => {
    render(
      <AvatarCropperModal
        open={true}
        imageSrc={mockImageSrc}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    expect(screen.getByText('Crop your avatar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-cropper')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });
  
  it('calls onClose when Cancel button is clicked', () => {
    render(
      <AvatarCropperModal
        open={true}
        imageSrc={mockImageSrc}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('updates crop state when crop changes', () => {
    render(
      <AvatarCropperModal
        open={true}
        imageSrc={mockImageSrc}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.click(screen.getByTestId('crop-change-btn'));
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    return waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });
  
  it('updates zoom state when zoom changes', () => {
    render(
      <AvatarCropperModal
        open={true}
        imageSrc={mockImageSrc}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.click(screen.getByTestId('zoom-change-btn'));
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    return waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });
  
  it('sets croppedAreaPixels when crop is completed', () => {
    render(
      <AvatarCropperModal
        open={true}
        imageSrc={mockImageSrc}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.click(screen.getByTestId('crop-complete-btn'));
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    return waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.any(File),
        { x: 10, y: 20, width: 300, height: 300 }
      );
    });
  });
  
  it('calls onConfirm with file and crop data when Confirm button is clicked', async () => {
    render(
      <AvatarCropperModal
        open={true}
        imageSrc={mockImageSrc}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    
    fireEvent.click(screen.getByTestId('crop-complete-btn'));
    fireEvent.click(screen.getByText('Confirm'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(mockImageSrc);
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'avatar.jpg',
          type: 'image/jpeg'
        }),
        { x: 10, y: 20, width: 300, height: 300 }
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});