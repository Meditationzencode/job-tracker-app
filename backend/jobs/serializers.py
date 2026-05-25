from rest_framework import serializers
from .models import Job, Interview, Contact


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ("id", "name", "title", "email", "phone", "linkedin", "notes", "created_at")
        read_only_fields = ("id", "created_at")


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = (
            "id", "job", "interview_type", "scheduled_at",
            "location", "notes", "completed", "created_at",
        )
        read_only_fields = ("id", "created_at")


class JobSerializer(serializers.ModelSerializer):
    interviews = InterviewSerializer(many=True, read_only=True)
    contacts = ContactSerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = (
            "id", "company", "title", "location", "remote", "url",
            "description", "status", "salary_min", "salary_max",
            "notes", "cv_version", "cover_letter_version",
            "date_applied", "deadline", "archived",
            "interviews", "contacts",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class JobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — excludes nested relations."""

    class Meta:
        model = Job
        fields = (
            "id", "company", "title", "location", "remote",
            "status", "date_applied", "deadline", "archived", "created_at",
        )
        read_only_fields = ("id", "created_at")
