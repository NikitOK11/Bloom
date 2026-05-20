import { apiClient } from "./client";

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
    eligible_groups: string;
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

export const eventsApi = {
    list: (params?: EventListParams) =>
        apiClient.get<EventListItem[]>(buildEventsQuery(params)),
    getById: (eventId: string | number) =>
        apiClient.get<EventDetail>(`/events/${eventId}/`),
};
