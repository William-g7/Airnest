FROM python:3.11-slim

WORKDIR /usr/src/djangobnb_backend

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

RUN apt-get update \
    && apt-get install -y netcat-traditional \
    && apt-get install -y libpq-dev gcc

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./entrypoint.sh .
RUN sed -i 's/\r//' entrypoint.sh
RUN chmod +x entrypoint.sh

COPY . .

ENTRYPOINT ["./entrypoint.sh"]