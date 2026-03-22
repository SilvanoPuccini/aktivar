import logging
import uuid

from django.conf import settings
from django.db import connection
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
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


class ImageUploadView(APIView):
    """Upload an image to Cloudinary (or local storage in dev)."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'detail': 'No file provided.'},
                status=400,
            )

        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            return Response(
                {'detail': 'File type not allowed. Use JPEG, PNG, WebP, or GIF.'},
                status=400,
            )

        # Max 10MB
        if file.size > 10 * 1024 * 1024:
            return Response(
                {'detail': 'File too large. Max 10MB.'},
                status=400,
            )

        try:
            # Try Cloudinary upload
            import cloudinary.uploader
            result = cloudinary.uploader.upload(
                file,
                folder='aktivar',
                public_id=f'{uuid.uuid4().hex}',
                overwrite=True,
                resource_type='image',
            )
            return Response({'url': result['secure_url']})
        except Exception:
            # Fallback: save to Django's default storage
            from django.core.files.storage import default_storage
            ext = file.name.split('.')[-1] if '.' in file.name else 'jpg'
            filename = f'uploads/{uuid.uuid4().hex}.{ext}'
            path = default_storage.save(filename, file)
            url = request.build_absolute_uri(f'/media/{path}')
            return Response({'url': url})
