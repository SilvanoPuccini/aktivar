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


class SitemapView(APIView):
    """Dynamic sitemap.xml for SEO with published activities."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        from activities.models import Activity
        from django.http import HttpResponse

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        activities = Activity.objects.filter(status='published').order_by('-created_at')[:500]

        xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

        # Home page
        xml += f'  <url><loc>{frontend_url}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n'

        # Activity pages
        for activity in activities:
            xml += f'  <url>'
            xml += f'<loc>{frontend_url}/activity/{activity.id}</loc>'
            xml += f'<lastmod>{activity.updated_at.strftime("%Y-%m-%d")}</lastmod>'
            xml += f'<changefreq>weekly</changefreq>'
            xml += f'<priority>0.8</priority>'
            xml += f'</url>\n'

        xml += '</urlset>'

        return HttpResponse(xml, content_type='application/xml')


class OpenGraphActivityView(APIView):
    """Return Open Graph meta tags for an activity (for social sharing / SEO crawlers)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, activity_id, *args, **kwargs):
        from activities.models import Activity

        try:
            activity = Activity.objects.select_related('organizer', 'category').get(
                id=activity_id, status='published'
            )
        except Activity.DoesNotExist:
            return Response({'detail': 'Activity not found.'}, status=404)

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return Response({
            'og:title': activity.title,
            'og:description': activity.description[:200],
            'og:image': activity.cover_image,
            'og:url': f'{frontend_url}/activity/{activity.id}',
            'og:type': 'website',
            'og:site_name': 'Aktivar',
            'activity:organizer': activity.organizer.full_name,
            'activity:category': activity.category.name,
            'activity:date': activity.start_datetime.isoformat(),
            'activity:location': activity.location_name,
            'activity:spots_remaining': activity.spots_remaining,
            'activity:confirmed_count': activity.confirmed_count,
        })


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
