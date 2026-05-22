import { ApiError, apiClient } from "./client";

export type EventListItem = {
    id: number;
    name: string;
    title: string;
    event_type_code: string;
    profile_code: string;
    level_code: string;
    participation_mode: string;
    is_active: boolean;
    short_description: string;
    official_url: string;
    organizer: string;
    registration_deadline: string | null;
    eligible_groups: string[];
};

export type EventEditionSummary = {
    id: number;
    edition_label: string;
    start_date: string | null;
    end_date: string | null;
    total_stages: number | null;
    status: string;
    registration_start_date: string | null;
    registration_end_date: string | null;
};

export type EventDetail = EventListItem & {
    description: string;
    editions: EventEditionSummary[];
};

type EventListParams = {
    eventType?: string;
    isActive?: boolean;
};

type EventListResponse =
    | EventListItem[]
    | {
          results?: EventListItem[];
      };

function buildEventsQuery(params: EventListParams = {}) {
    const searchParams = new URLSearchParams();

    if (params.eventType) {
        searchParams.set("event_type", params.eventType);
    }

    if (typeof params.isActive === "boolean") {
        searchParams.set("is_active", String(params.isActive));
    }

    const query = searchParams.toString();
    return query ? `/events/?${query}` : "/events/";
}

function normalizeEventListResponse(data: EventListResponse) {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === "object" && Array.isArray(data.results)) {
        return data.results;
    }

    throw new ApiError("Unexpected events response format.", 200, data as Record<string, unknown>);
}

export const eventsApi = {
    async list(params?: EventListParams) {
        const data = await apiClient.get<EventListResponse>(buildEventsQuery(params));
        return normalizeEventListResponse(data);
    },
    getById: (eventId: string | number) =>
        apiClient.get<EventDetail>(`/events/${eventId}/`),
};
