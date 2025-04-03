import { vi } from 'vitest';
import { updateRequestStatus } from '../../../api/requestApi';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    put: vi.fn()
  }
}));

describe('updateRequestStatus Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call apiClient.put with correct parameters for approval', async () => {
    const requestId = 123;
    const status = 'Approved';
    const apiPath = '/api/requests';
    const expectedUrl = `${apiPath}/${requestId}`;

    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } });

    await updateRequestStatus(requestId, status, apiPath);

    expect(apiClient.put).toHaveBeenCalledTimes(1);
    expect(apiClient.put).toHaveBeenCalledWith(expectedUrl, { approved: true });
  });

  it('should call apiClient.put with correct parameters for rejection', async () => {
    const requestId = 456;
    const status = 'Rejected';
    const apiPath = '/api/applications';
    const expectedUrl = `${apiPath}/${requestId}`;

    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } });

    await updateRequestStatus(requestId, status, apiPath);

    expect(apiClient.put).toHaveBeenCalledTimes(1);
    expect(apiClient.put).toHaveBeenCalledWith(expectedUrl, { 
      approved: false,
      rejection_reason: "Request rejected" 
    });
  });

  it('should call apiClient.put with custom rejection reason when provided', async () => {
    const requestId = 456;
    const status = 'Rejected';
    const apiPath = '/api/applications';
    const expectedUrl = `${apiPath}/${requestId}`;
    const customReason = 'Custom rejection reason';

    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } });

    await updateRequestStatus(requestId, status, apiPath, customReason);

    expect(apiClient.put).toHaveBeenCalledTimes(1);
    expect(apiClient.put).toHaveBeenCalledWith(expectedUrl, { 
      approved: false,
      rejection_reason: customReason 
    });
  });

  it('should throw an error and log correctly when API call fails', async () => {
    const requestId = 789;
    const status = 'Approved';
    const apiPath = '/api/requests';
    const expectedUrl = `${apiPath}/${requestId}`;
    const error = new Error('Network error');

    vi.mocked(apiClient.put).mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(updateRequestStatus(requestId, status, apiPath)).rejects.toThrow(error);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Error updating request ${requestId} at ${expectedUrl} to ${status}:`,
      error
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle different API paths correctly', async () => {
    const requestId = 555;
    const status = 'Approved';
    const apiPath = '/api/custom-endpoint';
    const expectedUrl = `${apiPath}/${requestId}`;

    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } });

    await updateRequestStatus(requestId, status, apiPath);

    expect(apiClient.put).toHaveBeenCalledTimes(1);
    expect(apiClient.put).toHaveBeenCalledWith(expectedUrl, { approved: true });
  });
});