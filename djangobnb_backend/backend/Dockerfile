FROM python:3.11-slim

WORKDIR /usr/src/djangobnb_backend

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

RUN echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian bookworm main contrib non-free" > /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian bookworm-updates main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bookworm-security main contrib non-free" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y netcat-traditional libpq-dev gcc

RUN pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
COPY ./requirements.txt .
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY ./entrypoint.sh .
RUN sed -i 's/\r//' entrypoint.sh
RUN chmod +x entrypoint.sh

COPY . .

ENTRYPOINT ["./entrypoint.sh"]