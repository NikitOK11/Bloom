from rest_framework import serializers

from apps.events.models import (
    Event,
    EventEdition,
    EventEditionAdmissionBenefit,
    EventEditionStage,
    University,
    UniversityProgram,
)


class UniversityProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversityProgram
        fields = ("id", "name", "level", "code")


class UniversitySerializer(serializers.ModelSerializer):
    programs = UniversityProgramSerializer(many=True, read_only=True)

    class Meta:
        model = University
        fields = ("id", "name", "short_name", "city", "website_url", "programs")


class EventEditionAdmissionBenefitSerializer(serializers.ModelSerializer):
    university = UniversitySerializer(read_only=True)
    programs = UniversityProgramSerializer(many=True, read_only=True)

    class Meta:
        model = EventEditionAdmissionBenefit
        fields = (
            "id",
            "university",
            "benefit_type",
            "winner_benefit",
            "prizewinner_benefit",
            "source_url",
            "note",
            "programs",
        )


class EventEditionStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventEditionStage
        fields = (
            "id",
            "stage_number",
            "stage_name",
            "start_date",
            "end_date",
            "status",
            "format",
            "description",
        )


class EventEditionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventEdition
        fields = (
            "id",
            "edition_label",
            "start_date",
            "end_date",
            "total_stages",
            "status",
            "registration_start_date",
            "registration_end_date",
        )


class EventEditionDetailSerializer(serializers.ModelSerializer):
    stages = EventEditionStageSerializer(many=True, read_only=True)
    admission_benefits = EventEditionAdmissionBenefitSerializer(many=True, read_only=True)
    current_stage = EventEditionStageSerializer(read_only=True)

    class Meta:
        model = EventEdition
        fields = (
            "id",
            "event",
            "edition_label",
            "start_date",
            "end_date",
            "total_stages",
            "current_stage",
            "status",
            "registration_start_date",
            "registration_end_date",
            "stages",
            "admission_benefits",
        )


class EventListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "id",
            "name",
            "title",
            "event_type_code",
            "profile_code",
            "level_code",
            "participation_mode",
            "is_active",
            "short_description",
            "official_url",
            "organizer",
            "registration_deadline",
            "eligible_groups",
        )


class EventDetailSerializer(serializers.ModelSerializer):
    editions = EventEditionListSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = (
            "id",
            "name",
            "title",
            "event_type_code",
            "profile_code",
            "level_code",
            "participation_mode",
            "is_active",
            "short_description",
            "description",
            "official_url",
            "organizer",
            "registration_deadline",
            "eligible_groups",
            "editions",
        )
