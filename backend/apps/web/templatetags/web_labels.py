from django import template
from django.utils.translation import gettext as _

register = template.Library()


def _humanize_code(value: str) -> str:
    return str(value).replace("_", " ").replace("-", " ").title()


@register.filter
def event_type_label(value):
    labels = {
        "olympiad": _("Олимпиада"),
        "hackathon": _("Хакатон"),
        "case_championship": _("Кейс-Чемпионат"),
        "case-championship": _("Кейс-Чемпионат"),
        "competition": _("Конкурс"),
    }
    return labels.get(value, _humanize_code(value) if value else _("Не указано"))


@register.filter
def event_level_label(value):
    labels = {
        "international": _("Международная"),
        "vsosh": _("ВСОШ"),
        "level_1": _("1 уровень"),
        "level-1": _("1 уровень"),
        "level_2": _("2 уровень"),
        "level-2": _("2 уровень"),
        "level_3": _("3 уровень"),
        "level-3": _("3 уровень"),
    }
    return labels.get(value, _humanize_code(value) if value else _("Не указано"))


@register.filter
def participation_mode_label(value):
    labels = {
        "individual": _("Индивидуальный"),
        "team": _("Командный"),
        "hybrid": _("Индивидуальный + Командный"),
    }
    return labels.get(value, _humanize_code(value) if value else _("Не указано"))


@register.filter
def profile_label(value):
    labels = {
        "math": _("Математика"),
        "technology": _("Технология"),
        "ecology": _("Экология"),
        "financial_literacy": _("Финансовая Грамотность"),
        "design": _("Дизайн"),
        "engineering_sciences": _("Инженерные Науки"),
        "business_fundamentals": _("Основы Бизнеса"),
        "international_relations": _("Международные Отношения"),
        "data_analysis": _("Анализ Данных"),
        "physics": _("Физика"),
        "geography": _("География"),
        "biology": _("Биология"),
        "chemistry": _("Химия"),
        "astronomy": _("Астрономия"),
        "artificial_intelligence": _("Искусственный Интеллект"),
        "olymp_prog": _("Ол. Прога"),
        "prom_prog": _("Пром. Прога"),
        "infosec": _("Инфобез"),
        "robotics": _("Робототехника"),
        "english": _("Английский Язык"),
        "spanish": _("Испанский Язык"),
        "french": _("Французский Язык"),
        "german": _("Немецкий Язык"),
        "italian": _("Итальянский Язык"),
        "chinese": _("Китайский Язык"),
        "history": _("История"),
        "art_history": _("История Искусств"),
        "cultural_studies": _("Культурология"),
        "oriental_studies": _("Востоковедение"),
        "russian_language": _("Русский Язык"),
        "philology": _("Филология"),
        "eastern_languages": _("Восточные Языки"),
        "social_studies": _("Обществознание"),
        "economics": _("Экономика"),
        "philosophy": _("Философия"),
        "psychology": _("Психология"),
        "law": _("Право"),
        "journalism": _("Журналистика"),
    }
    return labels.get(value, _humanize_code(value) if value else _("Не указано"))
