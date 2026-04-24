from django import forms
from django.utils.translation import gettext_lazy as _

from apps.teams.models import Team


class TeamCreateForm(forms.ModelForm):
    def __init__(self, *args, event=None, owner=None, **kwargs):
        super().__init__(*args, **kwargs)
        if event is not None:
            self.instance.event = event
        if owner is not None:
            self.instance.owner = owner

    class Meta:
        model = Team
        fields = ("name", "description", "is_open")
        labels = {
            "name": _("Название команды"),
            "description": _("Описание"),
            "is_open": _("Команда открыта для заявок"),
        }
        help_texts = {
            "description": _("Коротко расскажите, кого ищете и как планируете участвовать."),
        }


class JoinRequestForm(forms.Form):
    message = forms.CharField(
        label=_("Сообщение капитану"),
        required=False,
        help_text=_("Можно коротко рассказать о себе и роли в команде."),
        widget=forms.Textarea(
            attrs={
                "rows": 3,
            }
        ),
    )
