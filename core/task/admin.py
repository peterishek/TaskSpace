from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "created_at", "user", "status")
    # search_fields = ("title",)
    list_filter = ("status", "priority", "created_at")
    ordering = ("-created_at",)
    list_per_page = 20
    date_hierarchy = "created_at"