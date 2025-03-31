import React, { useState, useEffect } from "react";
import { useParams, Params } from "react-router-dom";
import { apiClient } from "../../api";
import { PendingMember } from "../../types/president/member";
import {
  ApprovalPayload
} from "../../types/president/PendingMembers";

const PendingMembers: React.FC = () => {
  const { societyId } = useParams<Params>();
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const validateSocietyId = (): boolean => {
    if (!societyId) {
      console.error("societyId is missing from URL params");
      setError("Missing society ID parameter");
      setLoading(false);
      return false;
    }
    return true;
  };

  const processResponse = (data: PendingMember[]): void => {
    setPendingMembers(data);
  };

  const handleFetchError = (error: unknown): void => {
    console.error("Error fetching pending members:", error);
    setError("Failed to load pending members");
  };

  const finishLoading = (): void => {
    setLoading(false);
  };

  const fetchPendingMembers = async (): Promise<void> => {
    try {
      const response = await apiClient.get(`/api/society/${societyId}/pending-members/`);
      processResponse(response.data);
    } catch (error) {
      handleFetchError(error);
    } finally {
      finishLoading();
    }
  };

  const initializeComponent = (): void => {
    if (validateSocietyId()) {
      fetchPendingMembers();
    }
  };

  useEffect(() => {
    initializeComponent();
  }, [societyId]);

  const createApprovalPayload = (approved: boolean): ApprovalPayload => {
    return { approved };
  };

  const sendApprovalRequest = async (memberId: number, payload: ApprovalPayload): Promise<void> => {
    await apiClient.post(`/api/society/${societyId}/pending-members/${memberId}/`, payload);
  };

  const handleApprovalError = (error: unknown): void => {
    console.error("Error updating member status:", error);
  };

  const refreshMembersList = (): void => {
    fetchPendingMembers();
  };

  const handleApproval = async (memberId: number, approved: boolean): Promise<void> => {
    try {
      const payload = createApprovalPayload(approved);
      await sendApprovalRequest(memberId, payload);
      refreshMembersList();
    } catch (error) {
      handleApprovalError(error);
    }
  };

  const createErrorMessage = (): JSX.Element => {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  };

  const createLoadingMessage = (): JSX.Element => {
    return <p>Loading pending members...</p>;
  };

  const createEmptyStateMessage = (): JSX.Element => {
    return <p>No pending membership requests.</p>;
  };

  const createMemberInfo = (member: PendingMember): JSX.Element => {
    return (
      <div>
        <p className="font-medium">{member.first_name} {member.last_name}</p>
        <p className="text-sm text-gray-500">{member.username}</p>
      </div>
    );
  };

  const createAcceptButton = (memberId: number): JSX.Element => {
    return (
      <button
        className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600"
        onClick={() => handleApproval(memberId, true)}
      >
        Accept
      </button>
    );
  };

  const createRejectButton = (memberId: number): JSX.Element => {
    return (
      <button
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        onClick={() => handleApproval(memberId, false)}
      >
        Reject
      </button>
    );
  };

  const createActionButtons = (memberId: number): JSX.Element => {
    return (
      <div>
        {createAcceptButton(memberId)}
        {createRejectButton(memberId)}
      </div>
    );
  };

  const createMemberListItem = (member: PendingMember): JSX.Element => {
    return (
      <li key={member.id} className="p-4 bg-white shadow rounded flex justify-between">
        {createMemberInfo(member)}
        {createActionButtons(member.id)}
      </li>
    );
  };

  const createMembersList = (): JSX.Element => {
    return (
      <ul className="space-y-4">
        {pendingMembers.map(createMemberListItem)}
      </ul>
    );
  };

  const createPageContent = (): JSX.Element => {
    if (pendingMembers.length === 0) {
      return createEmptyStateMessage();
    }
    return createMembersList();
  };

  const createPageTitle = (): JSX.Element => {
    return <h1 className="text-3xl font-bold mb-6">Pending Members</h1>;
  };

  const createMainLayout = (): JSX.Element => {
    return (
      <div className="container mx-auto p-8">
        {createPageTitle()}
        {createPageContent()}
      </div>
    );
  };

  if (error) {
    return createErrorMessage();
  }

  if (loading) {
    return createLoadingMessage();
  }

  return createMainLayout();
};

export default PendingMembers;