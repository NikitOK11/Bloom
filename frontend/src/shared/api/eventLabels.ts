export type FilterOption = {
    value: string;
    label: string;
};

const PROFILE_LABELS: Record<string, string> = {
    math: "Математика",
    technology: "Труд",
    ecology: "Экология",
    artificial_intelligence: "Искусственный интеллект",
    olymp_prog: "Олимпиадное программирование",
    robotics: "Робототехника",
    infosec: "Информационная безопасность",
    english: "Английский язык",
    chinese: "Китайский язык",
    german: "Немецкий язык",
    spanish: "Испанский язык",
    italian: "Итальянский язык",
    french: "Французский язык",
    history: "История",
    literature: "Литература",
    russian_language: "Русский язык",
    economics: "Экономика",
    social_studies: "Обществознание",
    law: "Право",
    financial_literacy: "Финансовая грамотность",
    design: "Дизайн",
    journalism: "Журналистика",
    engineering_sciences: "Инженерные науки",
    business_fundamentals: "Основы бизнеса",
    international_relations: "Международные отношения",
    data_analysis: "Анализ данных",
    physics: "Физика",
    geography: "География",
    biology: "Биология",
    chemistry: "Химия",
    art_history: "История искусств",
    cultural_studies: "Культурология",
    oriental_studies: "Востоковедение",
    philology: "Филология",
    eastern_languages: "Восточные языки",
    philosophy: "Философия",
    psychology: "Психология",
    prom_prog: "Промышленное программирование",
};

const LEVEL_LABELS: Record<string, string> = {
    level_1: "1 уровень",
    level_2: "2 уровень",
    level_3: "3 уровень",
    international: "Международная",
    vsosh: "ВсОШ",
};

const PARTICIPATION_MODE_LABELS: Record<string, string> = {
    individual: "Индивидуальный",
    team: "Командный",
    hybrid: "Индивидуальный + командный",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
    olympiad: "Олимпиада",
    hackathon: "Хакатон",
    case_championship: "Кейс-чемпионат",
};

function createFallbackLabel(value: string) {
    return value
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function getProfileLabel(value?: string | null) {
    if (!value) {
        return "Не указан";
    }

    return PROFILE_LABELS[value] ?? createFallbackLabel(value);
}

export function getLevelLabel(value?: string | null) {
    if (!value) {
        return "Не указан";
    }

    return LEVEL_LABELS[value] ?? createFallbackLabel(value);
}

export function getParticipationModeLabel(value?: string | null) {
    if (!value) {
        return "Не указан";
    }

    return PARTICIPATION_MODE_LABELS[value] ?? createFallbackLabel(value);
}

export function getEventTypeLabel(value?: string | null) {
    if (!value) {
        return "Событие";
    }

    return EVENT_TYPE_LABELS[value] ?? createFallbackLabel(value);
}

export function buildFilterOptions(
    values: Array<string | null | undefined>,
    getLabel: (value: string) => string,
) {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
        .map((value) => ({
            value,
            label: getLabel(value),
        }))
        .sort((left, right) => left.label.localeCompare(right.label, "ru"));
}
