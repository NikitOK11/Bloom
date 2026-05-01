from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.db.models import F, Prefetch, Q
from django.http import Http404, HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST
from django.views.generic import DetailView, FormView, ListView, TemplateView

from apps.events.models import Event, EventEdition, EventLevelCode, EventParticipationMode, EventTypeCode
from apps.teams.models import JoinRequest, JoinRequestStatus, Team, TeamMembership, TeamMembershipRole
from apps.web.forms import JoinRequestForm, TeamCreateForm


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


TEAM_CAPABLE_PARTICIPATION_MODES = {
    EventParticipationMode.TEAM,
    EventParticipationMode.HYBRID,
}


def _code_label(value: str) -> str:
    return value.replace("_", " ").title()


def _event_type_code_choices():
    return [
        (EventTypeCode.OLYMPIAD, _("Олимпиада")),
        (EventTypeCode.HACKATHON, _("Хакатон")),
        (EventTypeCode.CASE_CHAMPIONSHIP, _("Кейс-чемпионат")),
    ]


def _event_level_code_choices():
    return [
        (EventLevelCode.INTERNATIONAL, _("Международный")),
        (EventLevelCode.VSOSH, _("ВсОШ")),
        (EventLevelCode.LEVEL_1, _("Уровень 1")),
        (EventLevelCode.LEVEL_2, _("Уровень 2")),
        (EventLevelCode.LEVEL_3, _("Уровень 3")),
    ]


def _participation_mode_choices():
    return [
        (EventParticipationMode.INDIVIDUAL, _("Индивидуально")),
        (EventParticipationMode.TEAM, _("Командно")),
        (EventParticipationMode.HYBRID, _("Индивидуально или командно")),
    ]


class PartialTemplateMixin:
    full_base_template = "web/base.html"
    partial_base_template = "web/_partial_base.html"

    def is_partial_request(self) -> bool:
        return (
            self.request.headers.get("X-Partial-Request") == "true"
            or self.request.headers.get("X-Requested-With") == "fetch"
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["base_template"] = (
            self.partial_base_template if self.is_partial_request() else self.full_base_template
        )
        return context


class HomeView(PartialTemplateMixin, TemplateView):
    template_name = "web/home.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["featured_events"] = (
            Event.objects.filter(is_active=True)
            .select_related("event_type", "level")
            .prefetch_related("profiles")
            .order_by(
                F("registration_deadline").asc(nulls_last=True),
                "-created_at",
                "-id",
            )[:4]
        )
        return context


class EventListView(PartialTemplateMixin, ListView):
    model = Event
    context_object_name = "events"
    template_name = "web/event_list.html"

    def get_queryset(self):
        queryset = (
            Event.objects.filter(is_active=True)
            .select_related("event_type", "level")
            .prefetch_related("profiles")
        )

        profile_code = self.request.GET.get("profile_code", "").strip()
        if profile_code:
            queryset = queryset.filter(profile_code=profile_code)

        event_type_code = self.request.GET.get("event_type_code", "").strip()
        if event_type_code in EventTypeCode.values:
            queryset = queryset.filter(event_type_code=event_type_code)

        level_code = self.request.GET.get("level_code", "").strip()
        if level_code in EventLevelCode.values:
            queryset = queryset.filter(level_code=level_code)

        participation_mode = self.request.GET.get("participation_mode", "").strip()
        if participation_mode in EventParticipationMode.values:
            queryset = queryset.filter(participation_mode=participation_mode)

        search_query = self.request.GET.get("q", "").strip()
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) | Q(organizer__icontains=search_query)
            )

        return queryset.order_by(
            F("registration_deadline").asc(nulls_last=True),
            "-created_at",
            "-id",
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        profile_codes = (
            Event.objects.filter(is_active=True)
            .exclude(profile_code__isnull=True)
            .exclude(profile_code="")
            .order_by("profile_code")
            .values_list("profile_code", flat=True)
            .distinct()
        )
        context.update(
            {
                "profile_code_choices": [
                    (profile_code, _code_label(profile_code)) for profile_code in profile_codes
                ],
                "event_type_code_choices": _event_type_code_choices(),
                "level_code_choices": _event_level_code_choices(),
                "participation_mode_choices": _participation_mode_choices(),
                "selected_filters": {
                    "profile_code": self.request.GET.get("profile_code", "").strip(),
                    "event_type_code": self.request.GET.get("event_type_code", "").strip(),
                    "level_code": self.request.GET.get("level_code", "").strip(),
                    "participation_mode": self.request.GET.get("participation_mode", "").strip(),
                    "q": self.request.GET.get("q", "").strip(),
                },
            }
        )
        return context


class OlympiadListView(PartialTemplateMixin, ListView):
    model = Event
    context_object_name = "olympiad_cards"
    template_name = "web/olympiad_list.html"

    card_images = [
        "web/img/olympiads/card-1.jpg",
        "web/img/olympiads/card-2.jpg",
        "web/img/olympiads/card-3.jpg",
        "web/img/olympiads/card-4.jpg",
    ]

    def get_queryset(self):
        return (
            Event.objects.filter(is_active=True)
            .filter(Q(event_type_code=EventTypeCode.OLYMPIAD) | Q(event_type__slug="olympiad"))
            .select_related("event_type", "level")
            .prefetch_related(
                "profiles",
                Prefetch(
                    "editions",
                    queryset=EventEdition.objects.order_by("-start_date", "-id"),
                ),
            )
            .order_by(
                F("registration_deadline").asc(nulls_last=True),
                "-created_at",
                "-id",
            )
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        cards = []
        for index, event in enumerate(context["olympiad_cards"]):
            latest_edition = next(iter(event.editions.all()), None)
            display_year = ""
            if latest_edition and latest_edition.start_date:
                display_year = latest_edition.start_date.year
            elif event.registration_deadline:
                display_year = event.registration_deadline.year

            cards.append(
                {
                    "event": event,
                    "display_name": event.name or event.title,
                    "display_year": display_year,
                    "image_path": self.card_images[index % len(self.card_images)],
                }
            )

        context["olympiad_cards"] = cards
        return context


class EventDetailView(PartialTemplateMixin, DetailView):
    model = Event
    context_object_name = "event"
    template_name = "web/event_detail.html"

    def get_queryset(self):
        return (
            Event.objects.select_related("event_type", "level")
            .prefetch_related("profiles", "teams", "editions__stages")
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        show_teams_block = self.object.participation_mode in TEAM_CAPABLE_PARTICIPATION_MODES
        context["show_teams_block"] = show_teams_block
        context["event_teams"] = (
            self.object.teams.select_related("owner").order_by("name", "id")
            if show_teams_block
            else []
        )
        context["event_editions"] = self.object.editions.prefetch_related("stages").order_by(
            "-start_date",
            "-id",
        )
        return context


class EventTeamCreateView(LoginRequiredMixin, FormView):
    form_class = TeamCreateForm
    template_name = "web/team_create.html"

    def dispatch(self, request, *args, **kwargs):
        self.event = get_object_or_404(Event, pk=self.kwargs["pk"])
        if self.event.participation_mode not in TEAM_CAPABLE_PARTICIPATION_MODES:
            raise Http404(_("Команды недоступны для этого события."))
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["event"] = self.event
        return context

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["event"] = self.event
        kwargs["owner"] = self.request.user
        return kwargs

    def form_valid(self, form):
        team = form.save(commit=False)
        team.event = self.event
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

        messages.success(self.request, _("Команда создана."))
        return redirect("web:team-detail", pk=team.pk)


class TeamDetailView(PartialTemplateMixin, DetailView):
    model = Team
    context_object_name = "team"
    template_name = "web/team_detail.html"

    def get_queryset(self):
        return Team.objects.select_related("event", "owner")

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
    team = get_object_or_404(Team.objects.select_related("event"), pk=pk)
    form = JoinRequestForm(request.POST)
    if not form.is_valid():
        messages.error(request, _("Не удалось отправить заявку. Проверьте форму."))
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

    messages.success(request, _("Заявка отправлена."))
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
        messages.error(request, _("Управлять заявками может только капитан."))
        return redirect("web:team-detail", pk=team.pk)

    if join_request.status != JoinRequestStatus.PENDING:
        messages.warning(request, _("Одобрить можно только заявку в ожидании."))
        return redirect("web:team-detail", pk=team.pk)

    with transaction.atomic():
        TeamMembership.objects.get_or_create(
            team=team,
            user=join_request.user,
            defaults={"role": TeamMembershipRole.MEMBER},
        )
        join_request.approve()
        join_request.save(update_fields=["status"])

    messages.success(request, _("Заявка одобрена."))
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
        messages.error(request, _("Управлять заявками может только капитан."))
        return redirect("web:team-detail", pk=team.pk)

    if join_request.status != JoinRequestStatus.PENDING:
        messages.warning(request, _("Отклонить можно только заявку в ожидании."))
        return redirect("web:team-detail", pk=team.pk)

    join_request.reject()
    join_request.save(update_fields=["status"])
    messages.success(request, _("Заявка отклонена."))
    return redirect("web:team-detail", pk=team.pk)
