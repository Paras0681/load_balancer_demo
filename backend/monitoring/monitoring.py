from django.http import JsonResponse
from django.conf import settings
from django.db import connection
from prometheus_client import Counter

REQUEST_BY_SERVER = Counter(
    'requests_by_server_total',
    'Total requests handled, labeled by backend server',
    ['server_id']
)

def health_check(request):
    REQUEST_BY_SERVER.labels(server_id=settings.SERVER_ID).inc()
    try:
        connection.ensure_connection()
        db_status = 'ok'
    except Exception:
        db_status = 'unreachable'

    return JsonResponse({
        'status': 'healthy' if db_status == 'ok' else 'unhealthy',
        'server_id': settings.SERVER_ID,
        'db': db_status,
    })