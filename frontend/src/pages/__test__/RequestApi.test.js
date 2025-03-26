import { vi } from 'vitest';
import { updateRequestStatus } from '../../api/requestApi';
import { apiClient } from '../../api';
// Mock the API module
vi.mock('../../api', () => ({
    apiClient: {
        put: vi.fn()
    }
}));
describe('updateRequestStatus Function', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
    });
    it('should call apiClient.put with correct parameters for approval', async () => {
        // Setup
        const requestId = 123;
        const status = 'Approved';
        const apiPath = '/api/requests';
        // Mock successful API response
        vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } });
        // Execute
        await updateRequestStatus(requestId, status, apiPath);
        // Verify
        expect(apiClient.put).toHaveBeenCalledTimes(1);
        expect(apiClient.put).toHaveBeenCalledWith('/api/requests/123', { status: 'Approved' });
    });
    it('should call apiClient.put with correct parameters for rejection', async () => {
        // Setup
        const requestId = 456;
        const status = 'Rejected';
        const apiPath = '/api/applications';
        // Mock successful API response
        vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } });
        // Execute
        await updateRequestStatus(requestId, status, apiPath);
        // Verify
        expect(apiClient.put).toHaveBeenCalledTimes(1);
        expect(apiClient.put).toHaveBeenCalledWith('/api/applications/456', { status: 'Rejected' });
    });
    it('should throw an error when API call fails', async () => {
        // Setup
        const requestId = 789;
        const status = 'Approved';
        const apiPath = '/api/requests';
        const error = new Error('Network error');
        // Mock API error
        vi.mocked(apiClient.put).mockRejectedValue(error);
        // Spy on console.error
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        // Execute and verify
        await expect(updateRequestStatus(requestId, status, apiPath)).rejects.toThrow(error);
        // Verify console.error was called with the expected message
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating request 789 to Approved:', error);
        // Restore console.error
        consoleErrorSpy.mockRestore();
    });
    it('should handle different API paths correctly', async () => {
        // Test with a different API path
        const requestId = 555;
        const status = 'Approved';
        const apiPath = '/api/custom-endpoint';
        // Mock successful API response
        vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } });
        // Execute
        await updateRequestStatus(requestId, status, apiPath);
        // Verify
        expect(apiClient.put).toHaveBeenCalledWith('/api/custom-endpoint/555', { status: 'Approved' });
    });
});
