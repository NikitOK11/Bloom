from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.db.models import F, Q
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST
from django.views.generic import DetailView, FormView, ListView, TemplateView

from apps.events.models import Event, EventLevel, EventParticipationType, EventProfile, EventType
from apps.olympiads.models import Olympiad
from apps.teams.models import JoinRequest, JoinRequestStatus, Team, TeamMembership, TeamMembershipRole
from apps.web.forms import JoinRequestForm, TeamCreateForm


REFERENCE_ORDERING = ("sort_order", "name", "id")


def _user_display_name(user) -> str:
    display_name = f"{user.first_name} {user.last_name}".strip()
    return display_name or user.email


def _is_team_captain(user, team: Team) -> bool:
    if not user.is_authenticated:
        return False
    if team.owner_id == user.id:
        return True
    return TeamMembership.objects.filter(
        team=team,
        user=user,
        role=TeamMembershipRole.CAPTAIN,
    ).exists()


def can_view_team_contacts(viewer, team: Team) -> bool:
    if not viewer.is_authenticated:
        return False

    is_member = TeamMembership.objects.filter(team=team, user=viewer).exists()
    if is_member:
        return True

    has_join_request = JoinRequest.objects.filter(team=team, user=viewer).exists()
    if has_join_request:
        return True

    return _is_team_captain(viewer, team)


def _is_contacts_hidden(user) -> bool:
    try:
        profile = user.profile
    except (AttributeError, ObjectDoesNotExist):
        return False
    return getattr(profile, "contacts_visibility", None) == "HIDDEN"


def _extract_validation_messages(exc: ValidationError) -> list[str]:
    if hasattr(exc, "message_dict"):
        output: list[str] = []
        for errors in exc.message_dict.values():
            if isinstance(errors, list):
                output.extend(str(error) for error in errors)
            else:
                output.append(str(errors))
        return output
    return [str(error) for error in exc.messages]


def _add_validation_to_form(form, exc: ValidationError) -> None:
    if hasattr(exc, "message_dict"):
        for field, errors in exc.message_dict.items():
            target_field = field if field in form.fields else None
            if isinstance(errors, list):
                for error in errors:
                    form.add_error(target_field, error)
            else:
                form.add_error(target_field, errors)
        return

    for error in exc.messages:
        form.add_error(None, error)


class HomeView(TemplateView):
    template_name = "web/home.html"


class EventListView(ListView):
    model = Event
    context_object_name = "events"
    template_name = "web/event_list.html"

    def get_queryset(self):
        queryset = (
            Event.objects.filter(is_active=True)
            .select_related("event_type", "level")
            .prefetch_related("profiles")
        )

        profile_slug = self.request.GET.get("profile", "").strip()
        if profile_slug and EventProfile.objects.filter(slug=profile_slug, is_active=True).exists():
            queryset = queryset.filter(profiles__slug=profile_slug).distinct()

        event_type_slug = self.request.GET.get("event_type", "").strip()
        if event_type_slug and EventType.objects.filter(slug=event_type_slug, is_active=True).exists():
            queryset = queryset.filter(event_type__slug=event_type_slug)

        level_slug = self.request.GET.get("level", "").strip()
        if level_slug and EventLevel.objects.filter(slug=level_slug, is_active=True).exists():
            queryset = queryset.filter(level__slug=level_slug)

        participation_type = self.request.GET.get("participation_type", "").strip()
        if participation_type in EventParticipationType.values:
            queryset = queryset.filter(participation_type=participation_type)

        search_query = self.request.GET.get("q", "").strip()
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | Q(organizer__icontains=search_query)
            )

        return queryset.order_by(
            F("registration_deadline").asc(nulls_last=True),
            "-created_at",
            "-id",
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "profiles": EventProfile.objects.filter(is_active=True).order_by(*REFERENCE_ORDERING),
                "event_types": EventType.objects.filter(is_active=True).order_by(*REFERENCE_ORDERING),
                "levels": EventLevel.objects.filter(is_active=True).order_by(*REFERENCE_ORDERING),
                "participation_types": EventParticipationType.choices,
                "selected_filters": {
                    "profile": self.request.GET.get("profile", "").strip(),
                    "event_type": self.request.GET.get("event_type", "").strip(),
                    "level": self.request.GET.get("level", "").strip(),
                    "participation_type": self.request.GET.get("participation_type", "").strip(),
                    "q": self.request.GET.get("q", "").strip(),
                },
            }
        )
        return context


class EventDetailView(DetailView):
    model = Event
    context_object_name = "event"
    template_name = "web/event_detail.html"

    def get_queryset(self):
        return (
            Event.objects.select_related("event_type", "level")
            .prefetch_related("profiles", "teams")
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        show_teams_block = self.object.participation_type in {
            EventParticipationType.TEAM,
            EventParticipationType.BOTH,
        }
        context["show_teams_block"] = show_teams_block
        context["event_teams"] = self.object.teams.order_by("name", "id") if show_teams_block else []
        return context


class OlympiadListView(ListView):
    model = Olympiad
    context_object_name = "olympiads"
    template_name = "web/olympiad_list.html"

    def get_queryset(self):
        queryset = Olympiad.objects.all()
        if hasattr(Olympiad, "is_active"):
            queryset = queryset.filter(is_active=True)

        has_created_at = any(field.name == "created_at" for field in Olympiad._meta.fields)
        if has_created_at:
            return queryset.order_by("-created_at", "-id")
        return queryset.order_by("-id")


class OlympiadDetailView(DetailView):
    model = Olympiad
    context_object_name = "olympiad"
    template_name = "web/olympiad_detail.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["teams"] = Team.objects.filter(olympiad=self.object).select_related("owner").order_by("name")
        return context


class TeamCreateView(LoginRequiredMixin, FormView):
    form_class = TeamCreateForm
    template_name = "web/team_create.html"

    def dispatch(self, request, *args, **kwargs):
        self.olympiad = get_object_or_404(Olympiad, pk=self.kwargs["pk"])
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["olympiad"] = self.olympiad
        return context

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["olympiad"] = self.olympiad
        kwargs["owner"] = self.request.user
        return kwargs

    def form_valid(self, form):
        team = form.save(commit=False)
        team.olympiad = self.olympiad
        team.owner = self.request.user

        try:
            with transaction.atomic():
                team.full_clean()
                team.save()
                captain_membership = TeamMembership(
                    team=team,
                    user=self.request.user,
                    role=TeamMembershipRole.CAPTAIN,
                )
                captain_membership.full_clean()
                captain_membership.save()
        except ValidationError as exc:
            _add_validation_to_form(form, exc)
            return self.form_invalid(form)

        messages.success(self.request, "Team created successfully.")
        return redirect("web:team-detail", pk=team.pk)


class TeamDetailView(DetailView):
    model = Team
    context_object_name = "team"
    template_name = "web/team_detail.html"

    def get_queryset(self):
        return Team.objects.select_related("olympiad", "event", "owner")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        team = self.object
        viewer = self.request.user
        memberships = (
            TeamMembership.objects.filter(team=team)
            .select_related("user")
            .order_by("joined_at", "id")
        )

        is_member = False
        is_captain = False
        has_join_request = False
        if viewer.is_authenticated:
            viewer_membership = TeamMembership.objects.filter(team=team, user=viewer)
            is_member = viewer_membership.exists()
            is_captain = _is_team_captain(viewer, team)
            has_join_request = JoinRequest.objects.filter(team=team, user=viewer).exists()

        can_view_contacts = can_view_team_contacts(viewer, team)
        member_rows = []
        for membership in memberships:
            member_user = membership.user
            contact = None
            if can_view_contacts and not _is_contacts_hidden(member_user):
                contact = member_user.phone
            member_rows.append(
                {
                    "membership": membership,
                    "display_name": _user_display_name(member_user),
                    "email": member_user.email,
                    "contact": contact,
                }
            )

        pending_join_requests = []
        if is_captain:
            pending_join_requests = (
                JoinRequest.objects.filter(team=team, status=JoinRequestStatus.PENDING)
                .select_related("user")
                .order_by("created_at", "id")
            )

        context.update(
            {
                "member_rows": member_rows,
                "can_view_contacts": can_view_contacts,
                "is_member": is_member,
                "is_captain": is_captain,
                "has_join_request": has_join_request,
                "can_join": viewer.is_authenticated and team.is_open and not is_member and not has_join_request,
                "join_form": JoinRequestForm(),
                "pending_join_requests": pending_join_requests,
            }
        )
        return context


@login_required
@require_POST
def join_team_view(request: HttpRequest, pk: int) -> HttpResponse:
    team = get_object_or_404(Team.objects.select_related("olympiad"), pk=pk)
    form = JoinRequestForm(request.POST)
    if not form.is_valid():
        messages.error(request, "Could not submit join request. Please check the form.")
        return redirect("web:team-detail", pk=team.pk)

    join_request = JoinRequest(
        team=team,
        user=request.user,
        message=form.cleaned_data.get("message", ""),
    )

    try:
        join_request.full_clean()
        join_request.save()
    except ValidationError as exc:
        for error in _extract_validation_messages(exc):
            messages.error(request, error)
        return redirect("web:team-detail", pk=team.pk)

    messages.success(request, "Join request submitted.")
    return redirect("web:team-detail", pk=team.pk)


@login_required
@require_POST
def approve_join_request_view(request: HttpRequest, pk: int) -> HttpResponse:
    join_request = get_object_or_404(
        JoinRequest.objects.select_related("team", "user", "team__owner"),
        pk=pk,
    )
    team = join_request.team

    if not _is_team_captain(request.user, team):
        messages.error(request, "Only the captain can manage requests.")
        return redirect("web:team-detail", pk=team.pk)

    if join_request.status != JoinRequestStatus.PENDING:
        messages.warning(request, "Only pending requests can be approved.")
        return redirect("web:team-detail", pk=team.pk)

    with transaction.atomic():
        TeamMembership.objects.get_or_create(
            team=team,
            user=join_request.user,
            defaults={"role": TeamMembershipRole.MEMBER},
        )
        join_request.approve()
        join_request.save(update_fields=["status"])

    messages.success(request, "Join request approved.")
    return redirect("web:team-detail", pk=team.pk)


@login_required
@require_POST
def reject_join_request_view(request: HttpRequest, pk: int) -> HttpResponse:
    join_request = get_object_or_404(
        JoinRequest.objects.select_related("team", "team__owner"),
        pk=pk,
    )
    team = join_request.team

    if not _is_team_captain(request.user, team):
        messages.error(request, "Only the captain can manage requests.")
        return redirect("web:team-detail", pk=team.pk)

    if join_request.status != JoinRequestStatus.PENDING:
        messages.warning(request, "Only pending requests can be rejected.")
        return redirect("web:team-detail", pk=team.pk)

    join_request.reject()
    join_request.save(update_fields=["status"])
    messages.success(request, "Join request rejected.")
    return redirect("web:team-detail", pk=team.pk)
