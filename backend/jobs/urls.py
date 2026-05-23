from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, InterviewViewSet, ContactViewSet

router = DefaultRouter()
router.register("jobs", JobViewSet, basename="job")
router.register("interviews", InterviewViewSet, basename="interview")
router.register("contacts", ContactViewSet, basename="contact")

urlpatterns = [
    path("", include(router.urls)),
]
