from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, InterviewViewSet, ContactViewSet, DashboardView, JobCsvExportView

router = DefaultRouter()
router.register("jobs", JobViewSet, basename="job")
router.register("interviews", InterviewViewSet, basename="interview")
router.register("contacts", ContactViewSet, basename="contact")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("jobs/export/", JobCsvExportView.as_view(), name="jobs-export"),
    path("", include(router.urls)),
]
