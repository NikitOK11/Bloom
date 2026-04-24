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
        "case_championship": _("Кейс-чемпионат"),
        "case-championship": _("Кейс-чемпионат"),
    }
    return labels.get(value, _humanize_code(value) if value else _("Не указано"))


@register.filter
def event_level_label(value):
    labels = {
        "international": _("Международный"),
        "vsosh": _("ВсОШ"),
        "level_1": _("Уровень 1"),
        "level-1": _("Уровень 1"),
        "level_2": _("Уровень 2"),
        "level-2": _("Уровень 2"),
        "level_3": _("Уровень 3"),
        "level-3": _("Уровень 3"),
    }
    return labels.get(value, _humanize_code(value) if value else _("Не указано"))


@register.filter
def participation_mode_label(value):
    labels = {
        "individual": _("Индивидуально"),
        "team": _("Командно"),
        "hybrid": _("Индивидуально или командно"),
    }
    return labels.get(value, _humanize_code(value) if value else _("Не указано"))


@register.filter
def profile_label(value):
    return _humanize_code(value) if value else _("Не указано")
