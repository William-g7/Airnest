#! /bin/bash
set -e

python manage.py migrate --noinput

exec daphne -b 0.0.0.0 -p ${PORT:-8000} airnest_backend.asgi:application