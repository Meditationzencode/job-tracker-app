from django.contrib import admin
from .models import Job, Interview, Contact


class InterviewInline(admin.TabularInline):
    model = Interview
    extra = 0


class ContactInline(admin.TabularInline):
    model = Contact
    extra = 0


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "status", "user", "date_applied", "created_at")
    list_filter = ("status", "remote")
    search_fields = ("title", "company", "user__email")
    inlines = [InterviewInline, ContactInline]


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ("job", "interview_type", "scheduled_at", "completed")
    list_filter = ("interview_type", "completed")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "title", "job")
    search_fields = ("name", "job__company")
