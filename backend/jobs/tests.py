from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import Job

User = get_user_model()


class JobTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com", username="user", password="pass"
        )
        self.other = User.objects.create_user(
            email="other@example.com", username="other", password="pass"
        )
        self.client.force_authenticate(user=self.user)

    def _create_job(self, **kwargs):
        defaults = {"company": "Acme", "title": "Engineer", "status": "applied"}
        defaults.update(kwargs)
        return Job.objects.create(user=self.user, **defaults)

    def test_create_job(self):
        data = {"company": "Acme", "title": "Software Engineer", "status": "applied"}
        response = self.client.post(reverse("job-list"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Job.objects.filter(user=self.user).count(), 1)

    def test_list_only_own_jobs(self):
        self._create_job()
        Job.objects.create(user=self.other, company="Other Co", title="Dev", status="applied")
        response = self.client.get(reverse("job-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_retrieve_job(self):
        job = self._create_job()
        response = self.client.get(reverse("job-detail", args=[job.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["company"], "Acme")

    def test_cannot_access_other_users_job(self):
        other_job = Job.objects.create(
            user=self.other, company="Other", title="Dev", status="applied"
        )
        response = self.client.get(reverse("job-detail", args=[other_job.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_job_status(self):
        job = self._create_job()
        response = self.client.patch(reverse("job-detail", args=[job.id]), {"status": "interview"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.status, "interview")

    def test_delete_job(self):
        job = self._create_job()
        response = self.client.delete(reverse("job-detail", args=[job.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Job.objects.filter(id=job.id).exists())

    def test_filter_by_status(self):
        self._create_job(status="applied")
        self._create_job(status="rejected")
        response = self.client.get(reverse("job-list"), {"status": "applied"})
        self.assertEqual(len(response.data["results"]), 1)

    def test_search_by_company(self):
        self._create_job(company="Google")
        self._create_job(company="Meta")
        response = self.client.get(reverse("job-list"), {"search": "Google"})
        self.assertEqual(len(response.data["results"]), 1)
