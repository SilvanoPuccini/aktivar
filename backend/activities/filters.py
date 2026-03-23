import math

import django_filters
from django.db.models import Count, F, Q

from .models import Activity

# Check if PostGIS/GIS is available
try:
    from django.contrib.gis.db.models.functions import Distance
    from django.contrib.gis.geos import Point
    from django.contrib.gis.measure import D

    HAS_GIS = True
except ImportError:
    HAS_GIS = False


class ActivityFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__slug')
    category_id = django_filters.NumberFilter(field_name='category__id')
    is_free = django_filters.BooleanFilter()
    status = django_filters.CharFilter(field_name='status')
    date_from = django_filters.DateTimeFilter(
        field_name='start_datetime', lookup_expr='gte'
    )
    date_to = django_filters.DateTimeFilter(
        field_name='start_datetime', lookup_expr='lte'
    )
    difficulty = django_filters.CharFilter()
    search = django_filters.CharFilter(method='filter_search')
    has_spots = django_filters.BooleanFilter(method='filter_has_spots')
    lat = django_filters.NumberFilter(method='filter_by_distance')
    lng = django_filters.NumberFilter(method='filter_by_distance')
    radius_km = django_filters.NumberFilter(method='filter_by_distance')

    class Meta:
        model = Activity
        fields = [
            'category',
            'category_id',
            'is_free',
            'status',
            'date_from',
            'date_to',
            'difficulty',
            'search',
            'has_spots',
            'lat',
            'lng',
            'radius_km',
        ]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )

    def filter_has_spots(self, queryset, name, value):
        qs = queryset.annotate(
            confirmed_participants=Count(
                'participants',
                filter=Q(participants__status='confirmed'),
            )
        )
        if value:
            return qs.filter(confirmed_participants__lt=F('capacity'))
        return qs.filter(confirmed_participants__gte=F('capacity'))

    def filter_by_distance(self, queryset, name, value):
        """
        Geospatial distance filter.

        When PostGIS is available, uses dwithin() with Distance objects for
        precise geodetic calculations. Falls back to Haversine bounding box.
        Only applies when all three params (lat, lng, radius_km) are present.
        """
        params = self.data
        lat = params.get('lat')
        lng = params.get('lng')
        radius_km = params.get('radius_km')

        if not all([lat, lng, radius_km]):
            return queryset

        # Avoid filtering multiple times (once per param)
        if name != 'lat':
            return queryset

        lat = float(lat)
        lng = float(lng)
        radius_km = float(radius_km)

        if HAS_GIS:
            return self._filter_postgis(queryset, lat, lng, radius_km)
        return self._filter_bounding_box(queryset, lat, lng, radius_km)

    @staticmethod
    def _filter_postgis(queryset, lat, lng, radius_km):
        """PostGIS dwithin() with Distance objects — precise geodetic filter."""
        user_point = Point(lng, lat, srid=4326)

        # Build a Point expression from lat/lng DecimalFields
        from django.contrib.gis.db.models.functions import Distance
        from django.db.models import Value
        from django.contrib.gis.geos import Point as GEOSPoint

        # Annotate each activity with computed distance
        queryset = queryset.extra(
            select={
                'distance_m': (
                    "ST_Distance("
                    "ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography,"
                    "ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography"
                    ")"
                ),
            },
            select_params=[lng, lat],
        ).extra(
            where=[
                "ST_DWithin("
                "ST_SetSRID(ST_MakePoint(longitude::float, latitude::float), 4326)::geography,"
                "ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,"
                "%s"
                ")"
            ],
            params=[lng, lat, radius_km * 1000],  # meters
        )

        return queryset

    @staticmethod
    def _filter_bounding_box(queryset, lat, lng, radius_km):
        """Haversine bounding box fallback for non-PostGIS databases."""
        lat_offset = radius_km / 111.0
        lng_offset = radius_km / (
            111.0 * max(math.cos(math.radians(lat)), 0.001)
        )

        return queryset.filter(
            latitude__gte=lat - lat_offset,
            latitude__lte=lat + lat_offset,
            longitude__gte=lng - lng_offset,
            longitude__lte=lng + lng_offset,
        )
