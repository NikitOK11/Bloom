from django import forms

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


class JoinRequestForm(forms.Form):
    message = forms.CharField(
        required=False,
        widget=forms.Textarea(
            attrs={
                "rows": 3,
            }
        ),
    )
