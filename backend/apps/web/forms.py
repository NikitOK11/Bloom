from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm
from django.utils.translation import gettext_lazy as _

from apps.teams.models import Team


class SignUpForm(UserCreationForm):
    email = forms.EmailField(
        label=_("Email"),
        widget=forms.EmailInput(
            attrs={
                "autocomplete": "email",
            }
        ),
    )

    class Meta(UserCreationForm.Meta):
        model = get_user_model()
        fields = ("email",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["password1"].label = _("Пароль")
        self.fields["password2"].label = _("Подтверждение пароля")
        self.fields["password1"].help_text = _("Минимум 8 символов. Не используйте слишком простой пароль.")
        self.fields["password2"].help_text = _("Введите тот же пароль ещё раз.")

    def clean_email(self):
        email = self.cleaned_data["email"]
        User = get_user_model()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError(_("Пользователь с таким email уже существует."))
        return email


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
