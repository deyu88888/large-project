import { describe, expect, test, vi } from "vitest";
import { fetchPendingSocieties } from "../fetchPendingSocieties";


const mockSocieties = [
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

vi.mock('../fetchPendingSocieties', () => ({
    fetchPendingSocieties: () => Promise.resolve(mockSocieties)
}));

describe('fetchPendingSocieties', () => {
    test('should fetch pending societies',async () => {
        const response = await fetchPendingSocieties();
        expect(response).toEqual(mockSocieties);
    });
});