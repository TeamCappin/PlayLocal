from django.db import models

class ProjectStatus(models.IntegerChoices):
    PLANNED = 0, 'Planned'
    IN_PROGRESS = 1, 'In Progress'
    COMPLETED = 2, 'Completed'
    CANCELLED = 3, 'Cancelled'