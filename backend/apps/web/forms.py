from django import forms

from apps.teams.models import Team


class TeamCreateForm(forms.ModelForm):
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

