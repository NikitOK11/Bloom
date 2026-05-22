import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from "react";
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
type OpenPanel = FilterParam | "search" | null;

type FilterDropdownProps = {
    dropdownKey: FilterParam;
    isOpen: boolean;
    label: string;
    summary: string;
    options: FilterOption[];
    selectedValues: string[];
    onToggle: () => void;
    onValueToggle: (value: string) => void;
};

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

function ChevronIcon({ className, isOpen }: { className?: string; isOpen: boolean }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d={isOpen ? "M7 14 12 9 17 14" : "M7 10 12 15 17 10"}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
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

function buildSelectedSummary(selectedValues: string[], options: FilterOption[], emptyLabel: string) {
    if (selectedValues.length === 0) {
        return emptyLabel;
    }

    const labels = options
        .filter((option) => selectedValues.includes(option.value))
        .map((option) => option.label);

    if (labels.length === 1) {
        return labels[0];
    }

    return `${labels[0]} +${labels.length - 1}`;
}

function FilterDropdown({
    dropdownKey,
    isOpen,
    label,
    summary,
    options,
    selectedValues,
    onToggle,
    onValueToggle,
}: FilterDropdownProps) {
    return (
        <div className="filter-dropdown">
            <button
                className={isOpen ? "filter-trigger filter-trigger-open" : "filter-trigger"}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${dropdownKey}-panel`}
                onClick={onToggle}
            >
                <span className="filter-trigger-copy">
                    <span className="filter-trigger-label">{label}</span>
                    <span className="filter-trigger-value">{summary}</span>
                </span>
                <ChevronIcon className="filter-chevron" isOpen={isOpen} />
            </button>

            {isOpen && (
                <div className="filter-popover" id={`${dropdownKey}-panel`}>
                    <div className="filter-option-list">
                        {options.map((option) => {
                            const checked = selectedValues.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    className={
                                        checked
                                            ? "filter-option filter-option-active"
                                            : "filter-option"
                                    }
                                    type="button"
                                    onClick={() => onValueToggle(option.value)}
                                >
                                    <span className="filter-option-checkbox" aria-hidden="true">
                                        {checked && <span className="filter-option-checkbox-mark" />}
                                    </span>
                                    <span>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export function EventsPage() {
    const [events, setEvents] = useState<EventListItem[]>([]);
    const [state, setState] = useState<LoadState>("loading");
    const [searchParams, setSearchParams] = useSearchParams();
    const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
    const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
    const toolbarRef = useRef<HTMLDivElement | null>(null);

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
    }, [searchParams]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!toolbarRef.current?.contains(event.target as Node)) {
                setOpenPanel(null);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenPanel(null);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

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

    const profileSummary = buildSelectedSummary(
        selectedProfiles,
        profileOptions,
        "Все профили",
    );
    const levelSummary = buildSelectedSummary(selectedLevels, levelOptions, "Все уровни");
    const participationSummary = buildSelectedSummary(
        selectedParticipationModes,
        participationOptions,
        "Все форматы",
    );

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
        setOpenPanel(null);
    };

    const filterItems: Array<{
        key: FilterParam;
        label: string;
        summary: string;
        options: FilterOption[];
        selectedValues: string[];
    }> = [
        {
            key: "profile",
            label: "Профиль участия",
            summary: profileSummary,
            options: profileOptions,
            selectedValues: selectedProfiles,
        },
        {
            key: "level",
            label: "Уровень олимпиады",
            summary: levelSummary,
            options: levelOptions,
            selectedValues: selectedLevels,
        },
        {
            key: "participation_mode",
            label: "Формат участия",
            summary: participationSummary,
            options: participationOptions,
            selectedValues: selectedParticipationModes,
        },
    ];

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
                            карточками, раскрывающимися фильтрами и быстрым переходом к деталям.
                        </p>
                    </div>
                    <span className="badge">Найдено: {filteredEvents.length}</span>
                </div>

                <div className="events-toolbar" ref={toolbarRef}>
                    <section className="events-filter-row" aria-label="Фильтры по событиям">
                        {filterItems.map((item) => (
                            <FilterDropdown
                                key={item.key}
                                dropdownKey={item.key}
                                isOpen={openPanel === item.key}
                                label={item.label}
                                summary={item.summary}
                                options={item.options}
                                selectedValues={item.selectedValues}
                                onToggle={() =>
                                    setOpenPanel((current) =>
                                        current === item.key ? null : item.key,
                                    )
                                }
                                onValueToggle={(value) =>
                                    toggleFilterValue(
                                        searchParams,
                                        setSearchParams,
                                        item.key,
                                        value,
                                        item.selectedValues,
                                    )
                                }
                            />
                        ))}

                        <div className="events-search-shell">
                            <button
                                className={
                                    openPanel === "search"
                                        ? "search-toggle search-toggle-open"
                                        : "search-toggle"
                                }
                                type="button"
                                aria-label="Открыть поиск по событиям"
                                onClick={() =>
                                    setOpenPanel((current) =>
                                        current === "search" ? null : "search",
                                    )
                                }
                            >
                                <SearchIcon className="search-icon" />
                                <span className="search-toggle-label">
                                    {searchQuery ? `Поиск: ${searchQuery}` : "Поиск"}
                                </span>
                                <ChevronIcon
                                    className="filter-chevron"
                                    isOpen={openPanel === "search"}
                                />
                            </button>

                            {openPanel === "search" && (
                                <div className="search-popover">
                                    <form className="search-form" onSubmit={handleSearchSubmit}>
                                        <input
                                            className="search-input"
                                            type="search"
                                            name="q"
                                            value={searchValue}
                                            onChange={(event) => setSearchValue(event.target.value)}
                                            placeholder="Поиск по событиям"
                                        />
                                        <button className="button search-submit" type="submit">
                                            Найти
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </section>

                    {hasActiveFilters && (
                        <div className="events-toolbar-actions">
                            <button className="search-reset" type="button" onClick={handleResetFilters}>
                                Сбросить всё
                            </button>
                        </div>
                    )}
                </div>

                {state === "loading" && <p>Загружаем события...</p>}
                {state === "error" && (
                    <p>Не удалось загрузить события. Проверьте доступность API и попробуйте ещё раз.</p>
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
