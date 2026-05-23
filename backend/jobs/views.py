from rest_framework import viewsets, permissions, filters
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
    filterset_fields = ["status", "remote"]
    search_fields = ["company", "title", "location"]
    ordering_fields = ["created_at", "date_applied", "deadline", "company"]

    def get_queryset(self):
        return Job.objects.filter(user=self.request.user).prefetch_related(
            "interviews", "contacts"
        )

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
