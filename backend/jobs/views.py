from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Job, Interview, Contact
from .serializers import JobSerializer, JobListSerializer, InterviewSerializer, ContactSerializer


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
            "upcoming_interviews": InterviewSerializer(upcoming_interviews, many=True).data,
            "approaching_deadlines": JobListSerializer(approaching_deadlines, many=True).data,
            "recent_jobs": JobListSerializer(recent_jobs, many=True).data,
        })
