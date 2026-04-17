from django import forms

from apps.teams.models import Team


class TeamCreateForm(forms.ModelForm):
    def __init__(self, *args, olympiad=None, owner=None, **kwargs):
        super().__init__(*args, **kwargs)
        if olympiad is not None:
            self.instance.olympiad = olympiad
        if owner is not None:
            self.instance.owner = owner

    class Meta:
        model = Team
        fields = ("name", "description", "is_open")


class JoinRequestForm(forms.Form):
    message = forms.CharField(
        required=False,
        widget=forms.Textarea(
            attrs={
                "rows": 3,
            }
        ),
    )
