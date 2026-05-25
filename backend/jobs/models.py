from django.conf import settings
from django.db import models


class Job(models.Model):
    STATUS_CHOICES = [
        ("wishlist", "Wishlist"),
        ("applied", "Applied"),
        ("phone_screen", "Phone Screen"),
        ("interview", "Interview"),
        ("offer", "Offer"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
        ("accepted", "Accepted"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="jobs"
    )
    company = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)
    remote = models.BooleanField(default=False)
    url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="wishlist")
    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    date_applied = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} at {self.company}"


class Interview(models.Model):
    TYPE_CHOICES = [
        ("phone", "Phone Screen"),
        ("technical", "Technical"),
        ("behavioral", "Behavioral"),
        ("onsite", "On-site"),
        ("panel", "Panel"),
        ("other", "Other"),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="interviews")
    interview_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    scheduled_at = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.get_interview_type_display()} — {self.job}"


class Contact(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=200)
    title = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    linkedin = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.job.company})"
