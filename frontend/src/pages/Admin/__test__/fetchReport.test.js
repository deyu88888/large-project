import { vi } from 'vitest';
import { fetchReports, fetchReportDetails, fetchReportThread, submitReply, fetchMyReports, fetchMyReportsWithReplies, fetchReportsWithReplies, fetchReportReplies } from '../fetchReports'; // Update the path to your actual file
import { apiClient } from '../../../api';
// Mock the API client module
vi.mock('../../../api', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn()
    },
    apiPaths: {
        USER: {
            REPORT: '/api/reports'
        }
    }
}));
describe('Report API Functions', () => {
    // Sample mock data
    const mockReports = [
        { id: 1, title: 'Report 1', status: 'open' },
        { id: 2, title: 'Report 2', status: 'closed' }
    ];
    const mockReportDetails = {
        id: 1,
        title: 'Report 1',
        description: 'Detailed description',
        created_at: '2024-03-15'
    };
    const mockReportThread = [
        { id: 1, content: 'Initial report', created_at: '2024-03-15' },
        { id: 2, content: 'Admin response', created_at: '2024-03-16' }
    ];
    const mockReplyData = {
        report: 1,
        content: 'This is a reply',
        parent_reply: null
    };
    const mockReplyResponse = {
        id: 3,
        report: 1,
        content: 'This is a reply',
        parent_reply: null,
        created_at: '2024-03-17'
    };
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
    });
    describe('fetchReports', () => {
        it('fetches reports successfully', async () => {
            // Mock successful API response
            apiClient.get.mockResolvedValue({ data: mockReports });
            const result = await fetchReports();
            expect(apiClient.get).toHaveBeenCalledWith('/api/reports');
            expect(result).toEqual(mockReports);
        });
        it('handles error when fetching reports fails', async () => {
            // Mock API error
            const mockError = new Error('Network error');
            apiClient.get.mockRejectedValue(mockError);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(fetchReports()).rejects.toThrow('Network error');
            expect(apiClient.get).toHaveBeenCalledWith('/api/reports');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching reports:', mockError);
            consoleErrorSpy.mockRestore();
        });
    });
    describe('fetchReportDetails', () => {
        it('fetches report details successfully', async () => {
            // Mock successful API response
            apiClient.get.mockResolvedValue({ data: mockReportDetails });
            const result = await fetchReportDetails('1');
            expect(apiClient.get).toHaveBeenCalledWith('/api/report-to-admin/1');
            expect(result).toEqual(mockReportDetails);
        });
        it('handles error when fetching report details fails', async () => {
            // Mock API error
            const mockError = new Error('Not found');
            apiClient.get.mockRejectedValue(mockError);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(fetchReportDetails('999')).rejects.toThrow('Not found');
            expect(apiClient.get).toHaveBeenCalledWith('/api/report-to-admin/999');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching report details:', mockError);
            consoleErrorSpy.mockRestore();
        });
    });
    describe('fetchReportThread', () => {
        it('fetches report thread successfully', async () => {
            // Mock successful API response
            apiClient.get.mockResolvedValue({ data: mockReportThread });
            const result = await fetchReportThread('1');
            expect(apiClient.get).toHaveBeenCalledWith('/api/report-thread/1');
            expect(result).toEqual(mockReportThread);
        });
        it('handles error when fetching report thread fails', async () => {
            // Mock API error
            const mockError = new Error('Thread not found');
            apiClient.get.mockRejectedValue(mockError);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(fetchReportThread('999')).rejects.toThrow('Thread not found');
            expect(apiClient.get).toHaveBeenCalledWith('/api/report-thread/999');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching report thread:', mockError);
            consoleErrorSpy.mockRestore();
        });
    });
    describe('submitReply', () => {
        it('submits reply successfully', async () => {
            // Mock successful API response
            apiClient.post.mockResolvedValue({ data: mockReplyResponse });
            const result = await submitReply(mockReplyData);
            expect(apiClient.post).toHaveBeenCalledWith('/api/report-replies', mockReplyData);
            expect(result).toEqual(mockReplyResponse);
        });
        it('handles error when submitting reply fails', async () => {
            // Mock API error
            const mockError = new Error('Validation error');
            apiClient.post.mockRejectedValue(mockError);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(submitReply(mockReplyData)).rejects.toThrow('Validation error');
            expect(apiClient.post).toHaveBeenCalledWith('/api/report-replies', mockReplyData);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting reply:', mockError);
            consoleErrorSpy.mockRestore();
        });
    });
    describe('fetchMyReports', () => {
        it('fetches my reports successfully', async () => {
            // Mock successful API response
            apiClient.get.mockResolvedValue({ data: mockReports });
            const result = await fetchMyReports();
            expect(apiClient.get).toHaveBeenCalledWith('/api/my-reports');
            expect(result).toEqual(mockReports);
        });
        it('handles error when fetching my reports fails', async () => {
            // Mock API error
            const mockError = new Error('Unauthorized');
            apiClient.get.mockRejectedValue(mockError);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(fetchMyReports()).rejects.toThrow('Unauthorized');
            expect(apiClient.get).toHaveBeenCalledWith('/api/my-reports');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching my reports:', mockError);
            consoleErrorSpy.mockRestore();
        });
    });
    describe('fetchMyReportsWithReplies', () => {
        it('fetches my reports with replies successfully', async () => {
            const mockReportsWithReplies = [
                { ...mockReports[0], replies: [{ id: 1, content: 'Reply 1' }] }
            ];
            // Mock successful API response
            apiClient.get.mockResolvedValue({ data: mockReportsWithReplies });
            const result = await fetchMyReportsWithReplies();
            expect(apiClient.get).toHaveBeenCalledWith('/api/my-reports-with-replies');
            expect(result).toEqual(mockReportsWithReplies);
        });
        it('handles error when fetching my reports with replies fails', async () => {
            // Mock API error
            const mockError = new Error('Server error');
            apiClient.get.mockRejectedValue(mockError);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(fetchMyReportsWithReplies()).rejects.toThrow('Server error');
            expect(apiClient.get).toHaveBeenCalledWith('/api/my-reports-with-replies');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching my reports with replies:', mockError);
            consoleErrorSpy.mockRestore();
        });
    });
    describe('fetchReportsWithReplies', () => {
        it('fetches reports with replies successfully', async () => {
            const mockReportsWithReplies = [
                { ...mockReports[0], replies: [{ id: 1, content: 'Reply 1' }] }
            ];
            // Mock successful API response
            apiClient.get.mockResolvedValue({ data: mockReportsWithReplies });
            const result = await fetchReportsWithReplies();
            expect(apiClient.get).toHaveBeenCalledWith('/api/reports-with-replies');
            expect(result).toEqual(mockReportsWithReplies);
        });
        it('handles error when fetching reports with replies fails', async () => {
            // Mock API error
            const mockError = new Error('Server error');
            apiClient.get.mockRejectedValue(mockError);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(fetchReportsWithReplies()).rejects.toThrow('Server error');
            expect(apiClient.get).toHaveBeenCalledWith('/api/reports-with-replies');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching reports with replies:', mockError);
            consoleErrorSpy.mockRestore();
        });
    });
    describe('fetchReportReplies', () => {
        it('fetches report replies successfully', async () => {
            const mockReplies = [
                { id: 1, content: 'Reply 1', report_id: 1 },
                { id: 2, content: 'Reply 2', report_id: 1 }
            ];
            // Mock successful API response
            apiClient.get.mockResolvedValue({ data: mockReplies });
            const result = await fetchReportReplies();
            expect(apiClient.get).toHaveBeenCalledWith('/api/reports-replied');
            expect(result).toEqual(mockReplies);
        });
        it('handles error when fetching report replies fails', async () => {
            // Mock API error
            const mockError = new Error('Server error');
            apiClient.get.mockRejectedValue(mockError);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await expect(fetchReportReplies()).rejects.toThrow('Server error');
            expect(apiClient.get).toHaveBeenCalledWith('/api/reports-replied');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching report replies:', mockError);
            consoleErrorSpy.mockRestore();
        });
    });
});
