from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterTests(APITestCase):
    url = reverse("register")

    def test_register_success(self):
        data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="test@example.com").exists())

    def test_register_password_mismatch(self):
        data = {
            "email": "test2@example.com",
            "username": "testuser2",
            "password": "StrongPass123!",
            "password_confirm": "WrongPass456!",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        User.objects.create_user(email="dupe@example.com", username="dupe", password="pass")
        data = {
            "email": "dupe@example.com",
            "username": "dupe2",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MeViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="me@example.com", username="meuser", password="StrongPass123!"
        )
        self.client.force_authenticate(user=self.user)

    def test_get_me(self):
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "me@example.com")
