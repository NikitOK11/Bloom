from datetime import date

from django.contrib import admin
from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.events.admin import EventAdmin
from apps.events.models import (
    Event,
    EventEdition,
    EventEditionStage,
    EventLevel,
    EventLevelCode,
    EventParticipationMode,
    EventParticipationType,
    EventProfile,
    EventType,
)
from apps.teams.models import Team, TeamMembership, TeamMembershipRole


class EventCatalogTests(TestCase):
    def setUp(self):
        self.event_type, _ = EventType.objects.get_or_create(
            slug="olympiad",
            defaults={"name": "olympiad"},
        )
        self.level = EventLevel.objects.create(name="Level 1", slug="level-1")
        self.profile = EventProfile.objects.create(name="Math", slug="math")

    def create_event(self, title: str, **kwargs) -> Event:
        event_type = kwargs.pop("event_type", self.event_type)
        level = kwargs.pop("level", self.level)
        participation_type = kwargs.pop("participation_type", None)
        if "participation_mode" in kwargs:
            participation_mode = kwargs.pop("participation_mode")
        elif participation_type == EventParticipationType.TEAM:
            participation_mode = EventParticipationMode.TEAM
        elif participation_type == EventParticipationType.BOTH:
            participation_mode = EventParticipationMode.HYBRID
        else:
            participation_mode = EventParticipationMode.INDIVIDUAL

        if participation_type is None:
            participation_type = {
                EventParticipationMode.INDIVIDUAL: EventParticipationType.INDIVIDUAL,
                EventParticipationMode.TEAM: EventParticipationType.TEAM,
                EventParticipationMode.HYBRID: EventParticipationType.BOTH,
            }[participation_mode]

        event = Event.objects.create(
            title=title,
            name=kwargs.pop("name", title),
            short_description=kwargs.pop("short_description", "Short event description."),
            description=kwargs.pop("description", "Full event description."),
            official_url=kwargs.pop("official_url", "https://example.com/event"),
            organizer=kwargs.pop("organizer", "Event Organizer"),
            event_type=event_type,
            event_type_code=kwargs.pop("event_type_code", event_type.slug.replace("-", "_")),
            profile_code=kwargs.pop("profile_code", self.profile.slug),
            level=level,
            level_code=kwargs.pop("level_code", level.slug.replace("-", "_") if level else None),
            participation_type=participation_type,
            participation_mode=participation_mode,
            registration_deadline=kwargs.pop("registration_deadline", date(2026, 5, 1)),
            **kwargs,
        )
        event.profiles.add(self.profile)
        return event

    def filter_markup(self, response, filter_name: str) -> str:
        html = response.content.decode(response.charset or "utf-8")
        marker = f'data-filter-name="{filter_name}"'
        start = html.index(marker)
        next_field = html.find('data-filter-name="', start + len(marker))
        actions = html.find('class="olympiad-filter-actions"', start)
        end_candidates = [index for index in (next_field, actions) if index != -1]
        end = min(end_candidates) if end_candidates else len(html)
        return html[start:end]

    def applied_filters_markup(self, response) -> str:
        html = response.content.decode(response.charset or "utf-8")
        marker = "data-applied-filters"
        start = html.index(marker)
        card_grid = html.find('class="olympiad-card-grid"', start)
        empty_state = html.find('class="olympiad-empty"', start)
        end_candidates = [index for index in (card_grid, empty_state) if index != -1]
        end = min(end_candidates) if end_candidates else len(html)
        return html[start:end]

    def test_event_list_shows_only_active_events(self):
        self.create_event("Visible Event")
        self.create_event("Hidden Event", is_active=False)

        response = self.client.get(reverse("web:event-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Visible Event")
        self.assertNotContains(response, "Hidden Event")

    def test_home_or_primary_navigation_points_to_events(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, reverse("web:olympiad-list"))
        self.assertContains(response, "Найти олимпиаду по душе")
        self.assertContains(response, "Участвовать в олимпиадах")

    def test_home_renders_russian_by_default(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "От Олимпиадника Олимпиадникам")
        self.assertContains(response, "Найти олимпиаду по душе")
        self.assertContains(response, "Участвовать в олимпиадах")
        self.assertContains(response, "Изучить преференции олимпиад")

    def test_home_does_not_link_to_admin(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "/admin/")
        self.assertNotContains(response, "Админка")

    def test_home_uses_cache_busted_stylesheet(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'href="/static/web/styles.css?v=olympiad-applied-filters-20260501"')

    def test_home_partial_request_returns_content_without_base_layout(self):
        response = self.client.get(reverse("web:home"), HTTP_X_PARTIAL_REQUEST="true")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "От Олимпиадника Олимпиадникам")
        self.assertNotContains(response, "<!doctype html>")
        self.assertNotContains(response, 'class="site-header"', html=False)

    def test_event_catalog_partial_request_returns_content_without_base_layout(self):
        response = self.client.get(reverse("web:event-list"), HTTP_X_PARTIAL_REQUEST="true")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Каталог олимпиад")
        self.assertNotContains(response, "<!doctype html>")
        self.assertNotContains(response, "<header")

    def test_olympiad_list_renders_successfully(self):
        response = self.client.get(reverse("web:olympiad-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Олимпиады")
        self.assertContains(response, "Участвовать в олимпиадах")
        self.assertContains(response, "Профиль")
        self.assertContains(response, "Уровень олимпиады")
        self.assertContains(response, "Формат участия")
        self.assertContains(response, "Наши контакты")

    def test_olympiad_list_shows_active_olympiad_events(self):
        self.create_event("Высшая Проба")

        response = self.client.get(reverse("web:olympiad-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Высшая Проба")
        self.assertContains(response, "2026")

    def test_olympiad_list_hides_non_olympiad_events(self):
        hackathon_type = EventType.objects.create(name="Hackathon", slug="hackathon")
        self.create_event("Высшая Проба")
        self.create_event(
            "Hackathon Event",
            event_type=hackathon_type,
            event_type_code="hackathon",
        )

        response = self.client.get(reverse("web:olympiad-list"))

        self.assertContains(response, "Высшая Проба")
        self.assertNotContains(response, "Hackathon Event")

    def test_olympiad_list_filters_by_profile_level_and_participation(self):
        self.create_event(
            "Target Olympiad",
            profile_code="physics",
            level_code=EventLevelCode.LEVEL_1,
            participation_mode=EventParticipationMode.TEAM,
        )
        self.create_event(
            "Other Olympiad",
            profile_code="math",
            level_code=EventLevelCode.LEVEL_2,
            participation_mode=EventParticipationMode.INDIVIDUAL,
        )

        response = self.client.get(
            reverse("web:olympiad-list"),
            {
                "profile": "physics",
                "level": EventLevelCode.LEVEL_1,
                "participation_mode": EventParticipationMode.TEAM,
            },
        )

        self.assertContains(response, "Target Olympiad")
        self.assertNotContains(response, "Other Olympiad")

    def test_olympiad_list_filters_by_level(self):
        self.create_event("Level One Olympiad", level_code=EventLevelCode.LEVEL_1)
        self.create_event("Level Two Olympiad", level_code=EventLevelCode.LEVEL_2)

        response = self.client.get(reverse("web:olympiad-list"), {"level": EventLevelCode.LEVEL_2})

        self.assertContains(response, "Level Two Olympiad")
        self.assertNotContains(response, "Level One Olympiad")

    def test_olympiad_list_filters_by_participation_mode(self):
        self.create_event("Team Olympiad", participation_mode=EventParticipationMode.TEAM)
        self.create_event(
            "Individual Olympiad",
            participation_mode=EventParticipationMode.INDIVIDUAL,
        )

        response = self.client.get(
            reverse("web:olympiad-list"),
            {"participation_mode": EventParticipationMode.TEAM},
        )

        self.assertContains(response, "Team Olympiad")
        self.assertNotContains(response, "Individual Olympiad")

    def test_olympiad_list_filter_groups_do_not_mix_level_and_participation_values(self):
        response = self.client.get(reverse("web:olympiad-list"))

        level_markup = self.filter_markup(response, "level")
        participation_markup = self.filter_markup(response, "participation_mode")

        self.assertIn("Международная", level_markup)
        self.assertIn("ВсОШ", level_markup)
        self.assertIn("1 уровень", level_markup)
        self.assertNotIn("Индивидуальный", level_markup)
        self.assertNotIn("Командный", level_markup)
        self.assertNotIn("Индивидуальный + командный", level_markup)

        self.assertIn("Индивидуальный", participation_markup)
        self.assertIn("Командный", participation_markup)
        self.assertIn("Индивидуальный + командный", participation_markup)
        self.assertNotIn("Международная", participation_markup)
        self.assertNotIn("ВсОШ", participation_markup)
        self.assertNotIn("1 уровень", participation_markup)

    def test_olympiad_list_supports_legacy_filter_params(self):
        self.create_event(
            "Legacy Param Olympiad",
            profile_code="biology",
            level_code=EventLevelCode.LEVEL_3,
        )
        self.create_event(
            "Different Olympiad",
            profile_code="math",
            level_code=EventLevelCode.LEVEL_1,
        )

        response = self.client.get(
            reverse("web:olympiad-list"),
            {"profile_code": "biology", "level_code": EventLevelCode.LEVEL_3},
        )

        self.assertContains(response, "Legacy Param Olympiad")
        self.assertNotContains(response, "Different Olympiad")

    def test_olympiad_list_without_filters_hides_applied_filter_chips(self):
        response = self.client.get(reverse("web:olympiad-list"))

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Применённые фильтры")
        self.assertNotContains(response, "data-applied-filter-chip", html=False)
        self.assertNotContains(response, "Сбросить всё")

    def test_olympiad_list_shows_readable_level_chip(self):
        response = self.client.get(reverse("web:olympiad-list"), {"level": EventLevelCode.LEVEL_1})
        applied_markup = self.applied_filters_markup(response)

        self.assertEqual(response.status_code, 200)
        self.assertIn("Применённые фильтры", applied_markup)
        self.assertIn("Уровень:", applied_markup)
        self.assertIn("1 уровень", applied_markup)
        self.assertNotIn("level_1", applied_markup)
        self.assertNotContains(response, "Сбросить всё")

    def test_olympiad_level_chip_remove_url_preserves_other_filters(self):
        self.create_event(
            "Filtered Olympiad",
            profile_code="math",
            level_code=EventLevelCode.LEVEL_1,
            participation_mode=EventParticipationMode.TEAM,
        )

        response = self.client.get(
            reverse("web:olympiad-list"),
            {
                "profile": "math",
                "level": EventLevelCode.LEVEL_1,
                "participation_mode": EventParticipationMode.TEAM,
                "q": "draft",
            },
        )

        self.assertContains(
            response,
            'data-applied-filter-chip="level"',
            html=False,
        )
        self.assertContains(
            response,
            'href="/olympiads/?profile=math&amp;participation_mode=team&amp;q=draft"',
            html=False,
        )
        self.assertNotContains(
            response,
            'href="/olympiads/?profile=math&amp;level=level_1&amp;participation_mode=team&amp;q=draft"',
            html=False,
        )

    def test_olympiad_list_renders_each_active_filter_as_separate_chip(self):
        self.create_event(
            "Filtered Olympiad",
            profile_code="math",
            level_code=EventLevelCode.LEVEL_2,
            participation_mode=EventParticipationMode.HYBRID,
        )

        response = self.client.get(
            reverse("web:olympiad-list"),
            {
                "profile": "math",
                "level": EventLevelCode.LEVEL_2,
                "participation_mode": EventParticipationMode.HYBRID,
            },
        )

        applied_markup = self.applied_filters_markup(response)
        self.assertContains(response, 'data-applied-filter-chip="profile"', html=False)
        self.assertContains(response, 'data-applied-filter-chip="level"', html=False)
        self.assertContains(response, 'data-applied-filter-chip="participation_mode"', html=False)
        self.assertIn("Профиль:", applied_markup)
        self.assertIn("Уровень:", applied_markup)
        self.assertIn("Формат:", applied_markup)
        self.assertIn("2 уровень", applied_markup)
        self.assertIn("Индивидуальный + командный", applied_markup)

    def test_olympiad_list_clear_all_shows_for_multiple_filters(self):
        response = self.client.get(
            reverse("web:olympiad-list"),
            {
                "level": EventLevelCode.LEVEL_1,
                "participation_mode": EventParticipationMode.TEAM,
            },
        )

        self.assertContains(response, "Сбросить всё")
        self.assertContains(response, 'class="olympiad-applied-clear" href="/olympiads/"', html=False)

    def test_event_catalog_navigation_links_to_olympiads(self):
        response = self.client.get(reverse("web:event-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, reverse("web:olympiad-list"))
        self.assertContains(response, "Участвовать в олимпиадах")

    def test_language_switch_route_keeps_home_rendering(self):
        response = self.client.post(
            reverse("set_language"),
            {"language": "en", "next": reverse("web:home")},
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "От Олимпиадника Олимпиадникам")

    def test_event_navigation_is_active_on_event_catalog(self):
        response = self.client.get(reverse("web:event-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'class="nav-link nav-link-primary" href="/events/"', html=False)
        self.assertNotContains(response, 'class="nav-link nav-link-primary" href="/"', html=False)

    def test_event_catalog_filters_by_participation_mode(self):
        self.create_event("Individual Event", participation_mode=EventParticipationMode.INDIVIDUAL)
        self.create_event("Team Event", participation_mode=EventParticipationMode.TEAM)

        response = self.client.get(
            reverse("web:event-list"),
            {"participation_mode": EventParticipationMode.TEAM},
        )

        self.assertContains(response, "Team Event")
        self.assertNotContains(response, "Individual Event")

    def test_event_catalog_filters_by_profile_code(self):
        self.create_event("Math Event")
        self.create_event("Science Event", profile_code="science")

        response = self.client.get(reverse("web:event-list"), {"profile_code": "science"})

        self.assertContains(response, "Science Event")
        self.assertNotContains(response, "Math Event")

    def test_event_catalog_filters_by_event_type_code(self):
        self.create_event("Default Event")
        self.create_event(
            "Hackathon Event",
            event_type_code="hackathon",
        )

        response = self.client.get(
            reverse("web:event-list"),
            {"event_type_code": "hackathon"},
        )

        self.assertContains(response, "Hackathon Event")
        self.assertNotContains(response, "Default Event")

    def test_event_catalog_filters_by_level_code(self):
        self.create_event("Default Event")
        self.create_event("International Event", level_code="international")

        response = self.client.get(reverse("web:event-list"), {"level_code": "international"})

        self.assertContains(response, "International Event")
        self.assertNotContains(response, "Default Event")

    def test_event_detail_renders_successfully(self):
        event = self.create_event(
            "Team Case Championship",
            participation_mode=EventParticipationMode.HYBRID,
            preferences="Looking for product-minded participants.",
        )

        response = self.client.get(reverse("web:event-detail", kwargs={"pk": event.pk}))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Team Case Championship")
        self.assertContains(response, "Event Organizer")
        self.assertContains(response, "Math")
        self.assertContains(response, "Командная поддержка для событий будет развиваться дальше.")

    def test_event_detail_partial_request_returns_content_without_base_layout(self):
        event = self.create_event("Partial Event")

        response = self.client.get(
            reverse("web:event-detail", kwargs={"pk": event.pk}),
            HTTP_X_PARTIAL_REQUEST="true",
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Partial Event")
        self.assertNotContains(response, "<!doctype html>")
        self.assertNotContains(response, "<header")

    def test_event_detail_uses_name_not_title_as_primary_display(self):
        event = self.create_event("Legacy Event Title", name="Canonical Event Name")

        response = self.client.get(reverse("web:event-detail", kwargs={"pk": event.pk}))

        self.assertContains(response, "Canonical Event Name")
        self.assertNotContains(response, "<h1>Legacy Event Title</h1>", html=True)

    def test_event_detail_exposes_official_url(self):
        event = self.create_event("URL Event", official_url="https://example.com/canonical")

        response = self.client.get(reverse("web:event-detail", kwargs={"pk": event.pk}))

        self.assertContains(response, "https://example.com/canonical")

    def test_event_detail_shows_editions_and_stages(self):
        event = self.create_event("Edition Event")
        edition = EventEdition.objects.create(
            event=event,
            edition_label="2026",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            total_stages=1,
        )
        EventEditionStage.objects.create(
            edition=edition,
            stage_number=1,
            stage_name="Registration",
        )

        response = self.client.get(reverse("web:event-detail", kwargs={"pk": event.pk}))

        self.assertContains(response, "2026")
        self.assertContains(response, "Registration")

    def test_event_detail_shows_teams_only_for_team_or_both_participation(self):
        owner = User.objects.create_user(email="team-owner@example.com", password="password123")
        team_event = self.create_event("Team Event", participation_mode=EventParticipationMode.TEAM)
        individual_event = self.create_event(
            "Individual Event",
            participation_mode=EventParticipationMode.INDIVIDUAL,
        )
        Team.objects.create(
            event=team_event,
            owner=owner,
            name="Event Linked Team",
            is_open=True,
        )

        team_response = self.client.get(reverse("web:event-detail", kwargs={"pk": team_event.pk}))
        individual_response = self.client.get(
            reverse("web:event-detail", kwargs={"pk": individual_event.pk})
        )

        self.assertContains(team_response, "Командное участие")
        self.assertContains(team_response, "Event Linked Team")
        self.assertContains(team_response, "Открыта")
        self.assertNotContains(individual_response, "Командное участие")
        self.assertNotContains(individual_response, "Event Linked Team")
        self.assertNotContains(individual_response, "К этому событию пока нет привязанных команд.")

    def test_event_based_team_flow_still_works_after_olympiad_removal(self):
        event = self.create_event("Standalone Team Event", participation_mode=EventParticipationMode.TEAM)
        user = User.objects.create_user(email="standalone-captain@example.com", password="password123")
        self.client.force_login(user)

        create_response = self.client.post(
            reverse("web:event-team-create", kwargs={"pk": event.pk}),
            data={
                "name": "Standalone Event Team",
                "description": "No legacy parent required.",
                "is_open": "on",
            },
        )

        team = Team.objects.get(name="Standalone Event Team")
        self.assertEqual(team.event_id, event.id)
        self.assertTrue(
            TeamMembership.objects.filter(
                team=team,
                user=user,
                role=TeamMembershipRole.CAPTAIN,
            ).exists()
        )
        self.assertRedirects(create_response, reverse("web:team-detail", kwargs={"pk": team.pk}))

        detail_response = self.client.get(reverse("web:team-detail", kwargs={"pk": team.pk}))
        self.assertContains(detail_response, "Standalone Team Event")
        self.assertContains(detail_response, reverse("web:event-detail", kwargs={"pk": event.pk}))

    def test_event_team_create_for_individual_event_is_not_allowed(self):
        event = self.create_event(
            "Individual Event",
            participation_mode=EventParticipationMode.INDIVIDUAL,
        )
        user = User.objects.create_user(email="user@example.com", password="password123")
        self.client.force_login(user)

        response = self.client.get(reverse("web:event-team-create", kwargs={"pk": event.pk}))

        self.assertEqual(response.status_code, 404)

    def test_project_has_no_olympiad_dependency_in_primary_flow(self):
        event = self.create_event("Primary Team Event", participation_mode=EventParticipationMode.TEAM)
        owner = User.objects.create_user(email="owner@example.com", password="password123")
        team = Team.objects.create(
            event=event,
            owner=owner,
            name="Linked Team",
            description="A concise team description.",
            is_open=True,
        )

        event_response = self.client.get(reverse("web:event-detail", kwargs={"pk": event.pk}))
        team_response = self.client.get(reverse("web:team-detail", kwargs={"pk": team.pk}))

        self.assertContains(event_response, reverse("web:team-detail", kwargs={"pk": team.pk}))
        self.assertContains(event_response, "Linked Team")
        self.assertContains(team_response, reverse("web:event-detail", kwargs={"pk": event.pk}))
        self.assertContains(team_response, "Primary Team Event")

    def test_admin_registrations_still_load(self):
        self.assertIsInstance(admin.site._registry[Event], EventAdmin)
