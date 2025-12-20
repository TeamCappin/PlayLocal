from django.db import models
from .enums.project_status import ProjectStatus

class Project(models.Model):
    address = models.CharField(max_length=255)
    district = models.CharField(max_length=100)
    type = models.CharField(max_length=100)
    decisionStatus = models.CharField(max_length=100)
    projectStatus = models.IntegerField(
        choices=ProjectStatus.choices,
        default=ProjectStatus.PLANNED
    )
    architect = models.CharField(max_length=255, null=True, blank=True)
    units = models.CharField(max_length=50, null=True, blank=True)
    floors = models.CharField(max_length=50, null=True, blank=True)
    buildingCategories = models.JSONField(default=list)
    buildingTypes = models.JSONField(default=list)
    lastUpdate = models.DateField()
    media = models.URLField(null=True, blank=True)

    def __str__(self):
        return self.address
