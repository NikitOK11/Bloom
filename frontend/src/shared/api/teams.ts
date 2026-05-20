import { apiClient } from "./client";

export type TeamUser = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
};

export type TeamEvent = {
    id: number;
    name: string | null;
    title: string;
    participation_mode: string | null;
};

export type TeamListItem = {
    id: number;
    name: string;
    description: string;
    is_open: boolean;
    created_at: string;
    owner: TeamUser;
    event: TeamEvent;
    member_count: number;
};

export type TeamMembership = {
    id: number;
    user: TeamUser;
    role: string;
    joined_at: string;
};

export type TeamDetail = TeamListItem & {
    memberships: TeamMembership[];
    is_member: boolean;
    is_captain: boolean;
    has_join_request: boolean;
    can_join: boolean;
};

export type TeamCreatePayload = {
    event_id: number;
    name: string;
    description: string;
    is_open: boolean;
};

export type JoinRequestPayload = {
    message: string;
};

export type JoinRequestResponse = {
    id: number;
    message: string;
    status: string;
    created_at: string;
};

export const teamsApi = {
    list: () => apiClient.get<TeamListItem[]>("/teams/"),
    getById: (teamId: string | number) => apiClient.get<TeamDetail>(`/teams/${teamId}/`),
    create: (payload: TeamCreatePayload) => apiClient.post<TeamListItem>("/teams/", payload),
    createJoinRequest: (teamId: string | number, payload: JoinRequestPayload) =>
        apiClient.post<JoinRequestResponse>(`/teams/${teamId}/join-requests/`, payload),
};
