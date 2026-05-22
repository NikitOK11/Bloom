import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
    buildFilterOptions,
    getEventTypeLabel,
    getLevelLabel,
    getParticipationModeLabel,
    getProfileLabel,
    type FilterOption,
} from "../../shared/api/eventLabels";
import { eventsApi, type EventListItem } from "../../shared/api/events";
import { PageLayout } from "../../shared/ui/PageLayout";

type LoadState = "loading" | "success" | "error";
type FilterParam = "profile" | "level" | "participation_mode";

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <circle
                cx="11"
                cy="11"
                r="5.7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M16 16 19 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function sanitizeSelectedValues(
    searchParams: URLSearchParams,
    key: FilterParam,
    options: FilterOption[],
) {
    const validValues = new Set(options.map((option) => option.value));
    return searchParams.getAll(key).filter((value) => validValues.has(value));
}

function toggleFilterValue(
    searchParams: URLSearchParams,
    setSearchParams: ReturnType<typeof useSearchParams>[1],
    key: FilterParam,
    value: string,
    selectedValues: string[],
) {
    const nextParams = new URLSearchParams(searchParams);
    const nextValues = selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];

    nextParams.delete(key);
    nextValues.forEach((item) => nextParams.append(key, item));
    setSearchParams(nextParams);
}

function matchesSearch(event: EventListItem, query: string) {
    if (!query) {
        return true;
    }

    const normalizedQuery = query.toLowerCase();
    const searchSource = [
        event.name,
        event.title,
        event.organizer,
        event.short_description,
        getProfileLabel(event.profile_code),
        getEventTypeLabel(event.event_type_code),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return searchSource.includes(normalizedQuery);
}

export function EventsPage() {
    const [events, setEvents] = useState<EventListItem[]>([]);
    const [state, setState] = useState<LoadState>("loading");
    const [searchParams, setSearchParams] = useSearchParams();
    const [isSearchExpanded, setIsSearchExpanded] = useState(Boolean(searchParams.get("q")));
    const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

    useEffect(() => {
        let isMounted = true;

        const loadEvents = async () => {
            setState("loading");
            try {
                const data = await eventsApi.list({ isActive: true });
                if (!isMounted) {
                    return;
                }
                setEvents(data);
                setState("success");
            } catch {
                if (!isMounted) {
                    return;
                }
                setState("error");
            }
        };

        void loadEvents();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const currentQuery = searchParams.get("q") ?? "";
        setSearchValue(currentQuery);
        if (currentQuery) {
            setIsSearchExpanded(true);
        }
    }, [searchParams]);

    const profileOptions = useMemo(
        () => buildFilterOptions(events.map((event) => event.profile_code), getProfileLabel),
        [events],
    );
    const levelOptions = useMemo(
        () => buildFilterOptions(events.map((event) => event.level_code), getLevelLabel),
        [events],
    );
    const participationOptions = useMemo(
        () =>
            buildFilterOptions(
                events.map((event) => event.participation_mode),
                getParticipationModeLabel,
            ),
        [events],
    );

    const selectedProfiles = useMemo(
        () => sanitizeSelectedValues(searchParams, "profile", profileOptions),
        [searchParams, profileOptions],
    );
    const selectedLevels = useMemo(
        () => sanitizeSelectedValues(searchParams, "level", levelOptions),
        [searchParams, levelOptions],
    );
    const selectedParticipationModes = useMemo(
        () => sanitizeSelectedValues(searchParams, "participation_mode", participationOptions),
        [searchParams, participationOptions],
    );

    const searchQuery = (searchParams.get("q") ?? "").trim();

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const matchesProfile =
                selectedProfiles.length === 0 ||
                (event.profile_code ? selectedProfiles.includes(event.profile_code) : false);
            const matchesLevel =
                selectedLevels.length === 0 ||
                (event.level_code ? selectedLevels.includes(event.level_code) : false);
            const matchesParticipationMode =
                selectedParticipationModes.length === 0 ||
                (event.participation_mode
                    ? selectedParticipationModes.includes(event.participation_mode)
                    : false);

            return (
                matchesProfile &&
                matchesLevel &&
                matchesParticipationMode &&
                matchesSearch(event, searchQuery)
            );
        });
    }, [events, searchQuery, selectedLevels, selectedParticipationModes, selectedProfiles]);

    const hasActiveFilters =
        selectedProfiles.length > 0 ||
        selectedLevels.length > 0 ||
        selectedParticipationModes.length > 0 ||
        Boolean(searchQuery);

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextParams = new URLSearchParams(searchParams);
        const normalizedValue = searchValue.trim();

        if (normalizedValue) {
            nextParams.set("q", normalizedValue);
        } else {
            nextParams.delete("q");
        }

        setSearchParams(nextParams);
    };

    const handleResetFilters = () => {
        setSearchValue("");
        setSearchParams(new URLSearchParams());
        setIsSearchExpanded(false);
    };

    return (
        <PageLayout
            title="События"
            description="В каталоге собраны реальные активные события с удобным поиском и фильтрами по профилю, уровню олимпиады и формату участия."
        >
            <section className="card">
                <div className="card-header">
                    <div>
                        <h2>Активные события</h2>
                        <p className="muted">
                            Здесь собраны олимпиады, хакатоны и кейс-чемпионаты с едиными
                            карточками, лаконичными фильтрами и быстрым переходом к деталям.
                        </p>
                    </div>
                    <span className="badge">Найдено: {filteredEvents.length}</span>
                </div>

                <div className="events-toolbar">
                    <section className="events-filters" aria-label="Фильтры по событиям">
                        <div className="filter-group">
                            <p className="filter-label">Профиль участия</p>
                            <div className="filter-chips">
                                {profileOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={
                                            selectedProfiles.includes(option.value)
                                                ? "filter-chip filter-chip-active"
                                                : "filter-chip"
                                        }
                                        type="button"
                                        onClick={() =>
                                            toggleFilterValue(
                                                searchParams,
                                                setSearchParams,
                                                "profile",
                                                option.value,
                                                selectedProfiles,
                                            )
                                        }
                                    >
                                        <span className="filter-check" aria-hidden="true" />
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <p className="filter-label">Уровень олимпиады</p>
                            <div className="filter-chips">
                                {levelOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={
                                            selectedLevels.includes(option.value)
                                                ? "filter-chip filter-chip-active"
                                                : "filter-chip"
                                        }
                                        type="button"
                                        onClick={() =>
                                            toggleFilterValue(
                                                searchParams,
                                                setSearchParams,
                                                "level",
                                                option.value,
                                                selectedLevels,
                                            )
                                        }
                                    >
                                        <span className="filter-check" aria-hidden="true" />
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <p className="filter-label">Формат участия</p>
                            <div className="filter-chips">
                                {participationOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={
                                            selectedParticipationModes.includes(option.value)
                                                ? "filter-chip filter-chip-active"
                                                : "filter-chip"
                                        }
                                        type="button"
                                        onClick={() =>
                                            toggleFilterValue(
                                                searchParams,
                                                setSearchParams,
                                                "participation_mode",
                                                option.value,
                                                selectedParticipationModes,
                                            )
                                        }
                                    >
                                        <span className="filter-check" aria-hidden="true" />
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div
                        className={
                            isSearchExpanded ? "events-search events-search-open" : "events-search"
                        }
                    >
                        <button
                            className="search-toggle"
                            type="button"
                            aria-label="Открыть поиск по событиям"
                            onClick={() => setIsSearchExpanded((current) => !current)}
                        >
                            <SearchIcon className="search-icon" />
                        </button>

                        {isSearchExpanded && (
                            <form className="search-form" onSubmit={handleSearchSubmit}>
                                <input
                                    className="search-input"
                                    type="search"
                                    name="q"
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    placeholder="Поиск по событиям"
                                />
                            </form>
                        )}

                        {hasActiveFilters && (
                            <button className="search-reset" type="button" onClick={handleResetFilters}>
                                Сбросить
                            </button>
                        )}
                    </div>
                </div>

                {state === "loading" && <p>Загружаем события...</p>}
                {state === "error" && (
                    <p>
                        Не удалось загрузить события. Проверьте доступность API и попробуйте ещё
                        раз.
                    </p>
                )}
                {state === "success" && filteredEvents.length === 0 && (
                    <p>По выбранным параметрам пока ничего не найдено.</p>
                )}

                {state === "success" && filteredEvents.length > 0 && (
                    <div className="event-list">
                        {filteredEvents.map((event) => (
                            <article key={event.id} className="event-card">
                                <div className="event-card-header">
                                    <div>
                                        <p className="event-meta">
                                            {event.organizer || "Организатор не указан"}
                                        </p>
                                        <h3>{event.name || event.title}</h3>
                                    </div>
                                    <span className="event-type">
                                        {getEventTypeLabel(event.event_type_code)}
                                    </span>
                                </div>
                                <p className="muted">
                                    {event.short_description || "Краткое описание пока не добавлено."}
                                </p>
                                <dl className="event-facts">
                                    <div>
                                        <dt>Профиль</dt>
                                        <dd>{getProfileLabel(event.profile_code)}</dd>
                                    </div>
                                    <div>
                                        <dt>Формат участия</dt>
                                        <dd>{getParticipationModeLabel(event.participation_mode)}</dd>
                                    </div>
                                    <div>
                                        <dt>Уровень олимпиады</dt>
                                        <dd>{getLevelLabel(event.level_code)}</dd>
                                    </div>
                                </dl>
                                <div className="action-row">
                                    <Link className="button" to={`/events/${event.id}`}>
                                        Открыть событие
                                    </Link>
                                    {event.official_url && (
                                        <a
                                            className="button button-secondary"
                                            href={event.official_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Официальный сайт
                                        </a>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </PageLayout>
    );
}
