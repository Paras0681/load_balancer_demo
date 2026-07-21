FROM python:3.13-slim
WORKDIR /api
 
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
 
COPY . .
 
# gunicorn instead of runserver: runserver is single-threaded/dev-only and
# not meant for the concurrent-instance load testing this project is built to show.
CMD ["gunicorn", "load_balancer_demo.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]