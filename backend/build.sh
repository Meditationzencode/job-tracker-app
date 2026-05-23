#!/usr/bin/env bash
set -o errexit

pip install -r backend/requirements.txt -r backend/requirements-prod.txt
cd backend
python manage.py collectstatic --no-input
python manage.py migrate
