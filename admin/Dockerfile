FROM python:3.11-slim

WORKDIR /app/admin

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY admin/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY admin/ .
COPY frontend/src/shared/data /app/frontend/src/shared/data

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "60", "wsgi:app"]
