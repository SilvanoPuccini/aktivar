import logging

from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Check database and Redis connectivity."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        health = {
            'status': 'healthy',
            'database': self._check_database(),
            'redis': self._check_redis(),
        }

        if not health['database']['ok'] or not health['redis']['ok']:
            health['status'] = 'unhealthy'

        status_code = 200 if health['status'] == 'healthy' else 503
        return Response(health, status=status_code)

    def _check_database(self):
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            return {'ok': True}
        except Exception as e:
            logger.error('Database health check failed: %s', str(e))
            return {'ok': False, 'error': str(e)}

    def _check_redis(self):
        try:
            from django.core.cache import cache
            cache.set('health_check', 'ok', timeout=5)
            value = cache.get('health_check')
            if value == 'ok':
                return {'ok': True}
            return {'ok': False, 'error': 'Cache read/write failed'}
        except Exception as e:
            logger.error('Redis health check failed: %s', str(e))
            return {'ok': False, 'error': str(e)}


health_check = HealthCheckView.as_view()
