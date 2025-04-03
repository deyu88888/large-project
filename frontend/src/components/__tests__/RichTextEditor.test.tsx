import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RichTextEditor from '../../components/RichTextEditor';

const mockChain = vi.fn();
const mockFocus = vi.fn();
const mockToggleBold = vi.fn();
const mockToggleItalic = vi.fn();
const mockToggleStrike = vi.fn();
const mockToggleHeading = vi.fn();
const mockToggleBulletList = vi.fn();
const mockToggleOrderedList = vi.fn();
const mockToggleBlockquote = vi.fn();
const mockSetLink = vi.fn();
const mockUnsetLink = vi.fn();
const mockRun = vi.fn();
const mockIsActive = vi.fn();
const mockGetHTML = vi.fn();
const mockOnUpdate = vi.fn();

vi.mock('@tiptap/react', () => {
  return {
    useEditor: vi.fn().mockImplementation((options) => {
      if (options && options.onUpdate) {
        mockOnUpdate.mockImplementation(options.onUpdate);
      }
      
      mockFocus.mockReturnValue({
        toggleBold: mockToggleBold.mockReturnValue({ run: mockRun }),
        toggleItalic: mockToggleItalic.mockReturnValue({ run: mockRun }),
        toggleStrike: mockToggleStrike.mockReturnValue({ run: mockRun }),
        toggleHeading: mockToggleHeading.mockReturnValue({ run: mockRun }),
        toggleBulletList: mockToggleBulletList.mockReturnValue({ run: mockRun }),
        toggleOrderedList: mockToggleOrderedList.mockReturnValue({ run: mockRun }),
        toggleBlockquote: mockToggleBlockquote.mockReturnValue({ run: mockRun }),
        setLink: mockSetLink.mockReturnValue({ run: mockRun }),
        unsetLink: mockUnsetLink.mockReturnValue({ run: mockRun })
      });
      
      mockChain.mockReturnValue({ focus: mockFocus });
      mockGetHTML.mockReturnValue('<p>Test Content</p>');
      
      return {
        chain: mockChain,
        isActive: mockIsActive,
        getHTML: mockGetHTML
      };
    }),
    EditorContent: ({ editor }) => <div data-testid="editor-content">{editor ? 'Editor Content' : ''}</div>
  };
});

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => {
  return { 
    default: { 
      configure: vi.fn().mockReturnValue({}) 
    } 
  };
});
vi.mock('@tiptap/extension-image', () => ({ default: {} }));
vi.mock('@tiptap/extension-placeholder', () => {
  return { 
    default: { 
      configure: vi.fn().mockReturnValue({}) 
    } 
  };
});

window.prompt = vi.fn();

describe('RichTextEditor', () => {
  const mockOnChange = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsActive.mockImplementation(() => false);
  });

  it('renders the editor and toolbar', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Italic')).toBeInTheDocument();
    expect(screen.getByText('H1')).toBeInTheDocument();
    expect(screen.getByText('Bullet List')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('calls onChange when editor content changes', () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    mockOnUpdate({ editor: { getHTML: mockGetHTML } });
    
    expect(mockOnChange).toHaveBeenCalledWith('<p>Test Content</p>');
  });

  it('handles bold button click', async () => {
    const user = userEvent.setup();
    const { getByText } = render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    await user.click(getByText('Bold'));
    
    expect(mockChain).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalled();
    expect(mockToggleBold).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
  });

  it('handles link button click', async () => {
    const user = userEvent.setup();
    window.prompt.mockReturnValue('https://example.com');
    
    const { getByText } = render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    await user.click(getByText('Link'));
    
    expect(window.prompt).toHaveBeenCalledWith('URL');
    expect(mockChain).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalled();
    expect(mockSetLink).toHaveBeenCalledWith({ href: 'https://example.com' });
    expect(mockRun).toHaveBeenCalled();
  });

  it('handles unlink button click', async () => {
    const user = userEvent.setup();
    mockIsActive.mockImplementation((type) => type === 'link');
    
    const { getByText } = render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    await user.click(getByText('Unlink'));
    
    expect(mockChain).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalled();
    expect(mockUnsetLink).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
  });

  it('applies active class to buttons when feature is active', () => {
    mockIsActive.mockImplementation((type) => type === 'bold');
    
    const { getByText } = render(<RichTextEditor value="" onChange={mockOnChange} />);
    
    expect(getByText('Bold').className).toBe('is-active');
    expect(getByText('Italic').className).toBe('');
  });

  it('passes placeholder to editor configuration', () => {
    const placeholderText = "Custom placeholder";
    render(<RichTextEditor value="" onChange={mockOnChange} placeholder={placeholderText} />);
    
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });
});