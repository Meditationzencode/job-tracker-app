import csv
from datetime import timedelta
from django.http import StreamingHttpResponse
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Job, Interview, Contact
from .serializers import JobSerializer, JobListSerializer, InterviewSerializer, ContactSerializer


class _Echo:
    """Pseudo file-like object used by csv.writer to stream rows."""

    def write(self, value):
        return value


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        owner = obj.user if hasattr(obj, "user") else obj.job.user
        return owner == request.user


class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "remote", "archived"]
    search_fields = ["company", "title", "location"]
    ordering_fields = ["created_at", "date_applied", "deadline", "company", "status"]

    def get_queryset(self):
        qs = Job.objects.filter(user=self.request.user).prefetch_related(
            "interviews", "contacts"
        )
        # Hide archived jobs unless explicitly requested
        if self.request.query_params.get("archived") not in ("true", "1"):
            qs = qs.filter(archived=False)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return JobListSerializer
        return JobSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Interview.objects.filter(job__user=self.request.user)

    def perform_create(self, serializer):
        job = serializer.validated_data["job"]
        if job.user != self.request.user:
            raise permissions.PermissionDenied
        serializer.save()


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Contact.objects.filter(job__user=self.request.user)

    def perform_create(self, serializer):
        job = serializer.validated_data["job"]
        if job.user != self.request.user:
            raise permissions.PermissionDenied
        serializer.save()


class JobCsvExportView(APIView):
    """Stream the authenticated user's jobs as a CSV download."""

    permission_classes = [permissions.IsAuthenticated]

    HEADERS = [
        "company", "title", "location", "remote", "status",
        "salary_min", "salary_max", "date_applied", "deadline",
        "cv_version", "cover_letter_version",
        "url", "archived", "notes", "created_at",
    ]

    def get(self, request):
        jobs = Job.objects.filter(user=request.user).order_by("-created_at")

        def row_iter():
            writer = csv.writer(_Echo())
            yield writer.writerow(self.HEADERS)
            for job in jobs:
                yield writer.writerow([
                    job.company,
                    job.title,
                    job.location,
                    "yes" if job.remote else "no",
                    job.get_status_display(),
                    job.salary_min if job.salary_min is not None else "",
                    job.salary_max if job.salary_max is not None else "",
                    job.date_applied.isoformat() if job.date_applied else "",
                    job.deadline.isoformat() if job.deadline else "",
                    job.cv_version,
                    job.cover_letter_version,
                    job.url,
                    "yes" if job.archived else "no",
                    job.notes.replace("\n", " ") if job.notes else "",
                    job.created_at.isoformat(),
                ])

        filename = f"job-tracker-export-{timezone.now().date().isoformat()}.csv"
        response = StreamingHttpResponse(row_iter(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class DashboardView(APIView):
    """Aggregate counts + lookahead lists for the dashboard."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        soon = now + timedelta(days=14)

        jobs = Job.objects.filter(user=user, archived=False)
        status_counts = dict(
            jobs.values_list("status").annotate(c=Count("id"))
        )

        # Weekly application counts for the last 8 weeks
        weeks = []
        today = now.date()
        for i in range(7, -1, -1):
            week_end = today - timedelta(days=i * 7)
            week_start = week_end - timedelta(days=6)
            count = jobs.filter(
                date_applied__gte=week_start, date_applied__lte=week_end
            ).count()
            weeks.append({"week_start": week_start.isoformat(), "count": count})

        upcoming_interviews = (
            Interview.objects.filter(job__user=user, completed=False, scheduled_at__gte=now)
            .order_by("scheduled_at")[:5]
        )
        approaching_deadlines = (
            jobs.filter(deadline__gte=now.date(), deadline__lte=soon.date())
            .exclude(status__in=["rejected", "withdrawn", "accepted"])
            .order_by("deadline")[:5]
        )
        recent_jobs = jobs.order_by("-created_at")[:5]

        return Response({
            "totals": {
                "total": jobs.count(),
                "active": jobs.filter(
                    ~Q(status__in=["rejected", "withdrawn", "accepted"])
                ).count(),
            },
            "status_counts": status_counts,
            "weekly_applications": weeks,
            "upcoming_interviews": InterviewSerializer(upcoming_interviews, many=True).data,
            "approaching_deadlines": JobListSerializer(approaching_deadlines, many=True).data,
            "recent_jobs": JobListSerializer(recent_jobs, many=True).data,
        })
