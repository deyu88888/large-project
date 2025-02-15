import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, describe, beforeEach, vi, afterEach } from 'vitest';
import PendingSocietyRequest from '../PendingSocietyRequest';
// import { fetchPendingSocieties } from '../fetchPendingSocieties';
import { useFetchPendingSocieties, Society } from '../../../hooks/useFetchPendingSocieties';

const mockSocieties: Society[] = [
    {
        id: 1,
        name: "Society 1",
        societyMembers: [1, 2, 3],
        roles: {},
        leader: 1,
        category: "Category 1",
        socialMediaLinks: {},
        timetable: "Timetable 1",
        membershipRequirements: "Membership Requirements 1",
        upcomingProjectsOrPlans: "Upcoming Projects 1",
    },
    {
        id: 2,
        name: "Society 2",
        societyMembers: [4, 5, 6],
        roles: {},
        leader: 4,
        category: "Category 2",
        socialMediaLinks: {},
        timetable: "Timetable 2",
        membershipRequirements: "Membership Requirements 2",
        upcomingProjectsOrPlans: "Upcoming Projects 2",
    },
];

vi.mock('../../../hooks/useFetchPendingSocieties', () => ({
    useFetchPendingSocieties: vi.fn(),   
}));

describe('Pending Society Request Page', () => {
    let screenTest: any;

    beforeEach(() => {
        screenTest = render(
            <MemoryRouter>
                <PendingSocietyRequest />
            </MemoryRouter>
        );
        vi.mocked(useFetchPendingSocieties).mockReturnValue(mockSocieties);
    });
    afterEach(() => {
        vi.clearAllMocks();
      });
    test.skip('should render pending society request page', () => {
        screenTest.debug(undefined, 10000000);
        expect(screenTest.getByText(/Pending Society Requests/i)).toBeInTheDocument();
        expect(screenTest.getByText(/ID/i)).toBeInTheDocument();
        expect(screenTest.getByText(/Name/i)).toBeInTheDocument();
        const membersElements = screenTest.getAllByText(/Members/i);
        expect(membersElements.length).toBe(2);
        expect(screenTest.getByText(/Leader/i)).toBeInTheDocument();
        expect(screenTest.getByText(/Category/i)).toBeInTheDocument();
        expect(screenTest.getByText(/Timetable/i)).toBeInTheDocument();
        expect(screenTest.getByText(/Membership Requirements/i)).toBeInTheDocument();
        expect(screenTest.getByText(/Upcoming Projects/i)).toBeInTheDocument();
        expect(screenTest.getByText(/Actions/i)).toBeInTheDocument();

    });

    // test to check if the buttons are rendered
    test.skip('should render accept and reject buttons', () => {

        const { queryByText } = screenTest;
        expect(queryByText('ACCEPT')).toBeTruthy();

    });

    test.skip('should render the table with mock data', async () => {   // failing

        vi.mocked(useFetchPendingSocieties).mockReturnValue(await Promise.resolve(mockSocieties));
        const rootNode = document.body;

        screenTest.debug(rootNode, 10000000);
        await waitFor(() => {
            expect(screenTest.getByText(/Membership Requirements 2/i)).toBeInTheDocument();
          });
    

    });
    test('should render the table with mock data', async () => {
        vi.mocked(useFetchPendingSocieties).mockReturnValue(await Promise.resolve(mockSocieties));
        
        // Trigger a re-render to wait for data
        render(<PendingSocietyRequest />, { wrapper: MemoryRouter });
        const rootNode = document.body;

        screenTest.debug(rootNode, 10000000);
      
        // Wait for table content to appear
        const membershipCell = await screen.findByText(/Membership Requirements 2/i);
        expect(membershipCell).toBeInTheDocument();
      });
      
});