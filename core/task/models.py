from django.db import models
from django.contrib.auth.models import User


class Task(models.Model):

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")  # <- was required before

    # User Info
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_user', null=True, blank=True)

    # Timestamps
    created_at_date = models.DateField(auto_now_add=True, blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)  # <- removed auto_now_add so users can set it
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', db_index=True)

    STATUS_CHOICES = [
        ('to-do', 'To-Do'),
        ('in-progress', 'In-Progress'),
        ('done', 'Done'),
    ]
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='to-do', db_index=True)

    def __str__(self):
        return f"Task for {self.title}"