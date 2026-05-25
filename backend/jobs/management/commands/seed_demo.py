from datetime import date, datetime, timedelta, timezone as dt_timezone
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from jobs.models import Job, Interview, Contact

User = get_user_model()

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demopass123"
DEMO_USERNAME = "demo"


class Command(BaseCommand):
    help = "Create or refresh a demo user with realistic sample job applications."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            email=DEMO_EMAIL,
            defaults={"username": DEMO_USERNAME, "first_name": "Demo", "last_name": "User"},
        )
        user.set_password(DEMO_PASSWORD)
        user.save()

        # Wipe any existing demo data so reruns produce a clean slate
        Job.objects.filter(user=user).delete()

        today = timezone.now().date()
        jobs_data = [
            {
                "company": "Acme Robotics",
                "title": "Junior Backend Engineer",
                "location": "Berlin, DE",
                "remote": True,
                "url": "https://example.com/acme/jobs/1",
                "status": "interview",
                "salary_min": 50000,
                "salary_max": 65000,
                "notes": "Referral from Anna. Stack is Django + Postgres.",
                "cv_version": "Resume v3 — backend focus",
                "cover_letter_version": "Cover letter v2",
                "date_applied": today - timedelta(days=12),
                "deadline": today + timedelta(days=3),
                "interviews": [
                    {"interview_type": "phone", "days_offset": -8, "completed": True,
                     "notes": "Recruiter screen — went well."},
                    {"interview_type": "technical", "days_offset": 2, "completed": False,
                     "location": "Zoom", "notes": "DRF + SQL exercises. Review prefetch_related."},
                ],
                "contacts": [
                    {"name": "Anna Müller", "title": "Senior Engineer",
                     "email": "anna@acme.example.com",
                     "linkedin": "https://www.linkedin.com/in/anna-mueller",
                     "notes": "Internal referral."},
                ],
            },
            {
                "company": "Linear",
                "title": "Software Engineer (New Grad)",
                "location": "Remote",
                "remote": True,
                "url": "https://linear.app/careers/new-grad",
                "status": "applied",
                "salary_min": 75000,
                "salary_max": 95000,
                "notes": "Applied through their site. Highlighted React + TS portfolio.",
                "cv_version": "Resume v3",
                "date_applied": today - timedelta(days=5),
                "interviews": [],
                "contacts": [],
            },
            {
                "company": "Vercel",
                "title": "Frontend Engineer",
                "location": "Remote",
                "remote": True,
                "url": "https://vercel.com/careers",
                "status": "phone_screen",
                "salary_min": 80000,
                "salary_max": 110000,
                "notes": "Recruiter reached out via LinkedIn.",
                "cv_version": "Resume v3 — frontend focus",
                "date_applied": today - timedelta(days=9),
                "deadline": today + timedelta(days=10),
                "interviews": [
                    {"interview_type": "phone", "days_offset": 1, "completed": False,
                     "location": "Google Meet",
                     "notes": "30 min recruiter call to discuss role + comp."},
                ],
                "contacts": [
                    {"name": "Sam Patel", "title": "Recruiter",
                     "email": "sam@vercel.example.com"},
                ],
            },
            {
                "company": "Notion",
                "title": "Software Engineer",
                "location": "London, UK",
                "remote": False,
                "url": "https://notion.so/careers",
                "status": "offer",
                "salary_min": 90000,
                "salary_max": 120000,
                "notes": "Offer received. Considering counter.",
                "cv_version": "Resume v2",
                "date_applied": today - timedelta(days=40),
                "interviews": [
                    {"interview_type": "phone", "days_offset": -32, "completed": True},
                    {"interview_type": "technical", "days_offset": -20, "completed": True,
                     "notes": "Algorithms + system design. Felt good."},
                    {"interview_type": "onsite", "days_offset": -8, "completed": True,
                     "notes": "Met the team. Strong fit."},
                ],
                "contacts": [
                    {"name": "Jordan Lee", "title": "Hiring Manager",
                     "email": "jordan@notion.example.com"},
                ],
            },
            {
                "company": "Stripe",
                "title": "Software Engineer Intern",
                "location": "Dublin, IE",
                "remote": False,
                "url": "https://stripe.com/jobs",
                "status": "rejected",
                "salary_min": 45000,
                "salary_max": 55000,
                "notes": "Rejected after technical. They moved on with another candidate.",
                "cv_version": "Resume v2",
                "date_applied": today - timedelta(days=60),
                "interviews": [
                    {"interview_type": "phone", "days_offset": -55, "completed": True},
                    {"interview_type": "technical", "days_offset": -45, "completed": True},
                ],
                "contacts": [],
            },
            {
                "company": "Figma",
                "title": "Product Engineer",
                "location": "Remote",
                "remote": True,
                "url": "https://figma.com/careers",
                "status": "wishlist",
                "notes": "Want to apply once they reopen the new grad role.",
                "date_applied": None,
                "interviews": [],
                "contacts": [],
            },
            {
                "company": "Old Co",
                "title": "Web Developer",
                "location": "Manchester, UK",
                "remote": False,
                "status": "withdrawn",
                "notes": "Withdrew — wasn't a culture fit.",
                "date_applied": today - timedelta(days=90),
                "archived": True,
                "interviews": [],
                "contacts": [],
            },
        ]

        created_count = 0
        for j in jobs_data:
            interviews = j.pop("interviews", [])
            contacts = j.pop("contacts", [])
            job = Job.objects.create(user=user, **j)
            created_count += 1

            for iv in interviews:
                offset = iv.pop("days_offset")
                scheduled = datetime.combine(
                    today + timedelta(days=offset),
                    datetime.min.time().replace(hour=14),
                    tzinfo=dt_timezone.utc,
                )
                Interview.objects.create(job=job, scheduled_at=scheduled, **iv)

            for c in contacts:
                Contact.objects.create(job=job, **c)

        self.stdout.write(self.style.SUCCESS(
            f"Demo user '{DEMO_EMAIL}' refreshed with {created_count} jobs."
        ))
        self.stdout.write(f"  email: {DEMO_EMAIL}")
        self.stdout.write(f"  password: {DEMO_PASSWORD}")
