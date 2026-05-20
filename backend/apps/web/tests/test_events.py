from datetime import date

from django.contrib import admin
from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.events.admin import EventAdmin
from apps.events.models import (
    EligibleGroup,
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
from apps.web.views import (
    _event_level_code_choices,
    _event_profile_code_choices,
    _event_type_code_choices,
    _participation_mode_choices,
)


class EventCatalogTests(TestCase):
    def setUp(self):
        self.event_type, _ = EventType.objects.get_or_create(
            slug="olympiad",
            defaults={"name": "olympiad"},
        )
        self.level, _ = EventLevel.objects.get_or_create(
            slug="level-1",
            defaults={"name": "Level 1"},
        )
        if self.level.name != "Level 1":
            self.level.name = "Level 1"
            self.level.save(update_fields=["name"])

        self.profile, _ = EventProfile.objects.get_or_create(
            slug="math",
            defaults={"name": "Math"},
        )
        if self.profile.name != "Math":
            self.profile.name = "Math"
            self.profile.save(update_fields=["name"])

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

    def test_event_list_shows_only_active_events(self):
        self.create_event("Visible Event")
        self.create_event("Hidden Event", is_active=False)

        response = self.client.get(reverse("web:event-list"), {"profile_code": "math"})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Visible Event")
        self.assertNotContains(response, "Hidden Event")

    def test_home_or_primary_navigation_points_to_events(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, f'{reverse("web:event-list")}?event_type_code=olympiad')
        self.assertNotContains(response, 'href="/olympiads/"', html=False)
        self.assertContains(response, "Найти олимпиаду по душе")
        self.assertContains(response, "Участвовать в олимпиадах")

    def test_home_renders_russian_by_default(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "От Олимпиадника Олимпиадникам")
        self.assertContains(response, "Найти олимпиаду по душе")
        self.assertContains(response, "Изучить преференции олимпиад")

    def test_home_does_not_link_to_admin(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "/admin/")
        self.assertNotContains(response, "Админка")

    def test_home_uses_cache_busted_assets(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'href="/static/web/styles.css?v=olympiad-overview-groups-20260520"')
        self.assertContains(response, 'src="/static/web/js/app.js?v=events-humanities-groups-20260517"', html=False)

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

    def test_olympiad_route_redirects_to_event_catalog(self):
        response = self.client.get(reverse("web:olympiad-list"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response["Location"],
            f'{reverse("web:event-list")}?event_type_code=olympiad',
        )

    def test_olympiad_route_maps_legacy_filters_to_event_catalog(self):
        response = self.client.get(
            reverse("web:olympiad-list"),
            {
                "profile": "physics",
                "level": EventLevelCode.LEVEL_1,
                "participation_mode": EventParticipationMode.TEAM,
                "q": "проба",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response["Location"],
            (
                f'{reverse("web:event-list")}'
                "?participation_mode=team&q=%D0%BF%D1%80%D0%BE%D0%B1%D0%B0"
                "&profile_code=physics&level_code=level_1&event_type_code=olympiad"
            ),
        )

    def test_olympiad_route_drops_eligible_group_params(self):
        response = self.client.get(
            reverse("web:olympiad-list"),
            {
                "eligible_group": [EligibleGroup.GRADE_5, EligibleGroup.STUDENT],
                "q": "мат",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response["Location"],
            f'{reverse("web:event-list")}?q=%D0%BC%D0%B0%D1%82&event_type_code=olympiad',
        )

    def test_event_catalog_navigation_links_to_olympiads(self):
        response = self.client.get(reverse("web:event-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, f'{reverse("web:event-list")}?event_type_code=olympiad')
        self.assertContains(response, "Участвовать в олимпиадах")

    def test_event_catalog_uses_custom_filter_controls(self):
        response = self.client.get(reverse("web:event-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "data-enhanced-filter-form", html=False)
        self.assertContains(response, "data-filter-drawer-shell", html=False)
        self.assertContains(response, "data-filter-compact-toggle", html=False)
        self.assertContains(response, 'id="catalog-search-input"', html=False)
        self.assertContains(response, "data-search-toggle", html=False)
        self.assertContains(response, 'class="filter-search-icon"', count=1, html=False)

    def test_event_catalog_renders_search_mode_when_query_present(self):
        response = self.client.get(reverse("web:event-list"), {"q": "мат"})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'class="filter-panel catalog-filter-panel is-search-active"', html=False)
        self.assertContains(response, 'value="мат"', html=False)

    def test_event_catalog_filters_by_search_query(self):
        self.create_event("Высшая проба")
        self.create_event("Турнир Ломоносова")

        response = self.client.get(reverse("web:event-list"), {"q": "проба"})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Высшая проба")
        self.assertNotContains(response, "Турнир Ломоносова")
        self.assertContains(response, 'value="проба"', html=False)
        self.assertNotContains(response, 'data-applied-filter-chip="q"', html=False)

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

    def test_event_catalog_filters_by_multiple_participation_modes(self):
        self.create_event("Individual Event", participation_mode=EventParticipationMode.INDIVIDUAL)
        self.create_event("Team Event", participation_mode=EventParticipationMode.TEAM)
        self.create_event("Hybrid Event", participation_mode=EventParticipationMode.HYBRID)

        response = self.client.get(
            reverse("web:event-list"),
            [
                ("participation_mode", EventParticipationMode.INDIVIDUAL),
                ("participation_mode", EventParticipationMode.TEAM),
            ],
        )

        self.assertContains(response, "Individual Event")
        self.assertContains(response, "Team Event")
        self.assertNotContains(response, "Hybrid Event")

    def test_event_catalog_filters_by_profile_code(self):
        self.create_event("Math Event", profile_code="math")
        self.create_event("Design Event", profile_code="design")

        response = self.client.get(reverse("web:event-list"), {"profile_code": "design"})

        self.assertContains(response, "Design Event")
        self.assertNotContains(response, "Math Event")

    def test_event_catalog_renders_natural_science_profile_group(self):
        response = self.client.get(reverse("web:event-list"))

        self.assertContains(response, "Естественные Науки")
        self.assertContains(response, "physics")
        self.assertContains(response, "geography")
        self.assertContains(response, "biology")
        self.assertContains(response, "chemistry")
        self.assertContains(response, "astronomy")
        self.assertContains(response, "artificial_intelligence")
        self.assertContains(response, "olymp_prog")
        self.assertContains(response, "prom_prog")
        self.assertContains(response, "infosec")
        self.assertContains(response, "robotics")
        self.assertContains(response, "english")
        self.assertContains(response, "spanish")
        self.assertContains(response, "french")
        self.assertContains(response, "german")
        self.assertContains(response, "italian")
        self.assertContains(response, "chinese")
        self.assertContains(response, "history")
        self.assertContains(response, "art_history")
        self.assertContains(response, "cultural_studies")
        self.assertContains(response, "oriental_studies")
        self.assertContains(response, "russian_language")
        self.assertContains(response, "philology")
        self.assertContains(response, "eastern_languages")
        self.assertContains(response, "social_studies")
        self.assertContains(response, "economics")
        self.assertContains(response, "philosophy")
        self.assertContains(response, "psychology")
        self.assertContains(response, "law")

    def test_event_catalog_makes_entire_card_clickable(self):
        event = self.create_event("Clickable Event")

        response = self.client.get(reverse("web:event-list"), {"profile_code": "math"})

        self.assertContains(response, 'class="event-card-overlay-link"', html=False)
        self.assertContains(
            response,
            f'href="{reverse("web:event-detail", kwargs={"pk": event.pk})}?back=/events/%3Fprofile_code%3Dmath"',
            html=False,
        )

    def test_event_catalog_without_filters_shows_vsosh_overview(self):
        self.create_event("Visible Event")

        response = self.client.get(reverse("web:event-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "ВСОШ")
        self.assertContains(response, "Высшая Проба")
        self.assertContains(response, "Изумруд")
        self.assertContains(response, 'catalog_group=vsosh', html=False)
        self.assertContains(response, 'catalog_group=high-probe', html=False)
        self.assertContains(response, 'catalog_group=izumrud', html=False)
        self.assertNotContains(response, "Visible Event")

    def test_event_catalog_group_page_shows_profile_links(self):
        self.create_event("DANO", profile_code="data_analysis")

        response = self.client.get(reverse("web:event-list"), {"catalog_group": "high-probe"})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Высшая Проба")
        self.assertContains(response, "DANO")
        self.assertContains(response, 'class="vsosh-overview-link"', html=False)

    def test_high_probe_catalog_group_includes_events_by_organizer(self):
        self.create_event("Право", organizer="Высшая Проба", profile_code="law")

        response = self.client.get(reverse("web:event-list"), {"catalog_group": "high-probe"})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Право")

    def test_izumrud_catalog_group_page_shows_profile_links(self):
        self.create_event("Изумруд. Информатика", organizer="Изумруд", profile_code="olymp_prog")

        response = self.client.get(reverse("web:event-list"), {"catalog_group": "izumrud"})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Изумруд")
        self.assertContains(response, "Ол. Прога")
        self.assertContains(response, 'class="vsosh-overview-link"', html=False)

    def test_event_detail_back_link_preserves_event_filters(self):
        event = self.create_event("Filtered Event")

        response = self.client.get(
            reverse("web:event-detail", kwargs={"pk": event.pk}),
            {"back": "/events/?profile_code=math&level_code=vsosh"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            'href="/events/?profile_code=math&amp;level_code=vsosh"',
            html=False,
        )

    def test_event_catalog_filters_by_multiple_profile_codes(self):
        self.create_event("Math Event", profile_code="math")
        self.create_event("Design Event", profile_code="design")
        self.create_event("Journalism Event", profile_code="journalism")
        self.create_event("Physics Event", profile_code="physics")

        response = self.client.get(
            reverse("web:event-list"),
            [("profile_code", "math"), ("profile_code", "design")],
        )

        self.assertContains(response, "Math Event")
        self.assertContains(response, "Design Event")
        self.assertNotContains(response, "Journalism Event")
        self.assertNotContains(response, "Physics Event")

    def test_event_catalog_filters_by_event_type_code(self):
        self.create_event("Default Event")
        self.create_event("Hackathon Event", event_type_code="hackathon")

        response = self.client.get(reverse("web:event-list"), {"event_type_code": "hackathon"})

        self.assertContains(response, "Hackathon Event")
        self.assertNotContains(response, "Default Event")

    def test_event_catalog_filters_by_multiple_event_type_codes(self):
        self.create_event("Olympiad Event", event_type_code="olympiad")
        self.create_event("Hackathon Event", event_type_code="hackathon")
        self.create_event("Competition Event", event_type_code="competition")

        response = self.client.get(
            reverse("web:event-list"),
            [("event_type_code", "olympiad"), ("event_type_code", "hackathon")],
        )

        self.assertContains(response, "Olympiad Event")
        self.assertContains(response, "Hackathon Event")
        self.assertNotContains(response, "Competition Event")

    def test_event_catalog_filters_by_competition_event_type_code(self):
        self.create_event("Default Event")
        self.create_event("Competition Event", event_type_code="competition")

        response = self.client.get(reverse("web:event-list"), {"event_type_code": "competition"})

        self.assertContains(response, "Competition Event")
        self.assertNotContains(response, "Default Event")

    def test_event_catalog_filters_by_level_code(self):
        self.create_event("Default Event")
        self.create_event("International Event", level_code="international")

        response = self.client.get(reverse("web:event-list"), {"level_code": "international"})

        self.assertContains(response, "International Event")
        self.assertNotContains(response, "Default Event")

    def test_event_catalog_filters_by_multiple_level_codes(self):
        self.create_event("International Event", level_code="international")
        self.create_event("Level 1 Event", level_code="level_1")
        self.create_event("VSOSH Event", level_code="vsosh")

        response = self.client.get(
            reverse("web:event-list"),
            [("level_code", "international"), ("level_code", "level_1")],
        )

        self.assertContains(response, "International Event")
        self.assertContains(response, "Level 1 Event")
        self.assertNotContains(response, "VSOSH Event")

    def test_event_catalog_applied_filter_chips_preserve_other_filters(self):
        response = self.client.get(
            reverse("web:event-list"),
            {
                "event_type_code": "olympiad",
                "level_code": EventLevelCode.LEVEL_1,
                "participation_mode": EventParticipationMode.TEAM,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'data-applied-filter-chip="event_type_code"', html=False)
        self.assertContains(response, 'data-applied-filter-chip="level_code"', html=False)
        self.assertContains(response, dict(_event_type_code_choices())["olympiad"])
        self.assertContains(response, dict(_event_level_code_choices())[EventLevelCode.LEVEL_1])
        self.assertContains(response, dict(_participation_mode_choices())[EventParticipationMode.TEAM])
        self.assertContains(
            response,
            'href="/events/?level_code=level_1&amp;participation_mode=team"',
            html=False,
        )

    def test_event_catalog_renders_requested_filter_options(self):
        response = self.client.get(reverse("web:event-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["level_code_choices"], _event_level_code_choices())
        self.assertEqual(
            response.context["participation_mode_choices"],
            _participation_mode_choices(),
        )
        self.assertEqual(response.context["event_type_code_choices"], _event_type_code_choices())
        self.assertEqual(response.context["profile_code_choices"], _event_profile_code_choices())

    def test_event_model_accepts_multiple_eligible_groups(self):
        event = self.create_event(
            "Audience Event",
            eligible_groups=[EligibleGroup.GRADE_5, EligibleGroup.STUDENT],
        )

        event.refresh_from_db()

        self.assertEqual(event.eligible_groups, [EligibleGroup.GRADE_5, EligibleGroup.STUDENT])

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
        self.assertContains(response, "Математика")
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
