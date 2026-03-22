import math

import django_filters
from django.db.models import Count, F, Q

from .models import Activity


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
        Simple Haversine-like distance filter.
        Only applies when all three params (lat, lng, radius_km) are present.
        We process once on the first param encountered and skip on the rest.
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

        # Approximate degree offsets for bounding box
        lat_offset = radius_km / 111.0
        lng_offset = radius_km / (
            111.0 * max(math.cos(math.radians(lat)), 0.001)
        )

        queryset = queryset.filter(
            latitude__gte=lat - lat_offset,
            latitude__lte=lat + lat_offset,
            longitude__gte=lng - lng_offset,
            longitude__lte=lng + lng_offset,
        )

        return queryset
