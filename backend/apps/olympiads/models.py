from django.db import models

from apps.common.models import TimeStampedModel


class OlympiadSeason(models.TextChoices):
    SEASON_2025_2026 = "2025/2026", "2025/2026"
    SEASON_2026_2027 = "2026/2027", "2026/2027"
    SEASON_2027_2028 = "2027/2028", "2027/2028"
    SEASON_2028_2029 = "2028/2029", "2028/2029"
    SEASON_2029_2030 = "2029/2030", "2029/2030"
    SEASON_2030_2031 = "2030/2031", "2030/2031"
    SEASON_2031_2032 = "2031/2032", "2031/2032"
    SEASON_2032_2033 = "2032/2033", "2032/2033"
    SEASON_2033_2034 = "2033/2034", "2033/2034"
    SEASON_2034_2035 = "2034/2035", "2034/2035"
    SEASON_2035_2036 = "2035/2036", "2035/2036"


class Olympiad(TimeStampedModel):
    title = models.CharField(max_length=255)
    season = models.CharField(max_length=9, choices=OlympiadSeason.choices)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        if self.season:
            return f"{self.title} ({self.season})"
        return self.title
