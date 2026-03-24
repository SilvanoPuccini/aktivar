"""
Seed demo data for Aktivar — creates sample users, categories, activities,
reviews, trips, and vehicles for hackathon demo / judges evaluation.

Usage:
    python manage.py seed_demo
    python manage.py seed_demo --skip-if-exists
    python manage.py seed_demo --flush   # WARNING: deletes all data first
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Seed the database with demo data for Aktivar'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-if-exists',
            action='store_true',
            help='Skip seeding if data already exists',
        )
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete all existing data before seeding',
        )

    def handle(self, *args, **options):
        from activities.models import Activity, ActivityParticipant, Category
        from reviews.models import Review
        from transport.models import Trip, TripStop, Vehicle
        from users.models import CustomUser

        if options['skip_if_exists'] and CustomUser.objects.filter(email='demo@aktivar.app').exists():
            self.stdout.write(self.style.WARNING('Demo data already exists. Skipping.'))
            return

        if options['flush']:
            self.stdout.write('Flushing existing data...')
            Review.objects.all().delete()
            ActivityParticipant.objects.all().delete()
            Activity.objects.all().delete()
            Category.objects.all().delete()
            Trip.objects.all().delete()
            Vehicle.objects.all().delete()
            CustomUser.objects.filter(is_superuser=False).delete()

        self.stdout.write('Seeding demo data...')

        # ── Categories ─────────────────────────────────────────────
        categories_data = [
            {'name': 'Senderismo', 'slug': 'senderismo', 'icon': 'mountain', 'color': '#4CAF50', 'is_outdoor': True, 'order': 1},
            {'name': 'Escalada', 'slug': 'escalada', 'icon': 'trending-up', 'color': '#FF5722', 'is_outdoor': True, 'order': 2},
            {'name': 'Ciclismo', 'slug': 'ciclismo', 'icon': 'bike', 'color': '#2196F3', 'is_outdoor': True, 'order': 3},
            {'name': 'Kayak', 'slug': 'kayak', 'icon': 'waves', 'color': '#00BCD4', 'is_outdoor': True, 'order': 4},
            {'name': 'Trail Running', 'slug': 'trail-running', 'icon': 'zap', 'color': '#FF9800', 'is_outdoor': True, 'order': 5},
            {'name': 'Camping', 'slug': 'camping', 'icon': 'tent', 'color': '#795548', 'is_outdoor': True, 'order': 6},
            {'name': 'Surf', 'slug': 'surf', 'icon': 'waves', 'color': '#009688', 'is_outdoor': True, 'order': 7},
            {'name': 'Yoga Outdoor', 'slug': 'yoga-outdoor', 'icon': 'heart', 'color': '#E91E63', 'is_outdoor': True, 'order': 8},
        ]
        categories = {}
        for cat_data in categories_data:
            cat, _ = Category.objects.get_or_create(slug=cat_data['slug'], defaults=cat_data)
            categories[cat.slug] = cat

        self.stdout.write(f'  Created {len(categories)} categories')

        # ── Users ──────────────────────────────────────────────────
        users_data = [
            {'email': 'demo@aktivar.app', 'full_name': 'María García', 'role': 'organizer', 'bio': 'Amante de la montaña 🏔️ Organizadora de actividades outdoor en Santiago'},
            {'email': 'carlos@aktivar.app', 'full_name': 'Carlos Rodríguez', 'role': 'user', 'bio': 'Trail runner y fotógrafo de naturaleza'},
            {'email': 'lucia@aktivar.app', 'full_name': 'Lucía Fernández', 'role': 'organizer', 'bio': 'Guía de escalada certificada. +10 años de experiencia'},
            {'email': 'andres@aktivar.app', 'full_name': 'Andrés Morales', 'role': 'driver', 'bio': 'Conductor verificado. Llevo gente a la aventura 🚗'},
            {'email': 'valentina@aktivar.app', 'full_name': 'Valentina López', 'role': 'user', 'bio': 'Ciclista de montaña. Siempre buscando nuevas rutas'},
            {'email': 'pedro@aktivar.app', 'full_name': 'Pedro Sánchez', 'role': 'user', 'bio': 'Kayakista y surfista. El agua es mi segundo hogar'},
            {'email': 'camila@aktivar.app', 'full_name': 'Camila Torres', 'role': 'organizer', 'bio': 'Instructora de yoga al aire libre. Bienestar + naturaleza'},
            {'email': 'diego@aktivar.app', 'full_name': 'Diego Herrera', 'role': 'user', 'bio': 'Campista experimentado. Mochilero por Sudamérica'},
        ]
        users = {}
        for u_data in users_data:
            user, created = CustomUser.objects.get_or_create(
                email=u_data['email'],
                defaults={
                    'full_name': u_data['full_name'],
                    'role': u_data['role'],
                    'bio': u_data['bio'],
                    'is_verified_email': True,
                    'avatar': f'https://api.dicebear.com/7.x/adventurer/svg?seed={u_data["email"]}',
                },
            )
            if created:
                user.set_password('aktivar2024')
                user.save()
            users[u_data['email']] = user

        self.stdout.write(f'  Created {len(users)} users (password: aktivar2024)')

        # ── Update profiles ────────────────────────────────────────
        locations = [
            ('Santiago, Chile', -33.4489, -70.6693),
            ('Medellín, Colombia', 6.2442, -75.5812),
            ('Buenos Aires, Argentina', -34.6037, -58.3816),
            ('Lima, Perú', -12.0464, -77.0428),
            ('São Paulo, Brasil', -23.5505, -46.6333),
            ('Bogotá, Colombia', 4.7110, -74.0721),
            ('Quito, Ecuador', -0.1807, -78.4678),
            ('Valparaíso, Chile', -33.0472, -71.6127),
        ]
        for i, (email, user) in enumerate(users.items()):
            loc_name, lat, lng = locations[i % len(locations)]
            profile = user.profile
            profile.location_name = loc_name
            profile.latitude = Decimal(str(lat))
            profile.longitude = Decimal(str(lng))
            profile.total_activities = random.randint(5, 50)
            profile.total_km = Decimal(str(random.randint(50, 500)))
            profile.total_people_met = random.randint(10, 100)
            profile.save()

        # ── Activities ─────────────────────────────────────────────
        now = timezone.now()
        activities_data = [
            {
                'title': 'Senderismo Cerro San Cristóbal',
                'description': 'Recorrido por el cerro más icónico de Santiago. Ruta de 8km con vistas panorámicas de toda la ciudad y la cordillera. Apto para todos los niveles.',
                'category': 'senderismo',
                'organizer': 'demo@aktivar.app',
                'location_name': 'Cerro San Cristóbal, Santiago',
                'lat': -33.4260, 'lng': -70.6330,
                'difficulty': 'easy',
                'capacity': 20,
                'price': 0,
                'cover_image': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
                'distance_km': 8.0,
            },
            {
                'title': 'Escalada en Roca — Los Andes',
                'description': 'Jornada de escalada deportiva en las mejores rutas de Los Andes. Incluye equipo y guía certificado. Se requiere nivel intermedio mínimo.',
                'category': 'escalada',
                'organizer': 'lucia@aktivar.app',
                'location_name': 'Cajón del Maipo, Chile',
                'lat': -33.6000, 'lng': -70.2000,
                'difficulty': 'hard',
                'capacity': 10,
                'price': 35000,
                'cover_image': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800',
                'distance_km': 2.0,
            },
            {
                'title': 'Ruta MTB Cerros de Medellín',
                'description': 'Ruta de mountain bike por los cerros orientales. 30km de adrenalina pura con descensos técnicos y vistas increíbles del Valle de Aburrá.',
                'category': 'ciclismo',
                'organizer': 'demo@aktivar.app',
                'location_name': 'Cerro El Volador, Medellín',
                'lat': 6.2686, 'lng': -75.5906,
                'difficulty': 'moderate',
                'capacity': 15,
                'price': 25000,
                'cover_image': 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=800',
                'distance_km': 30.0,
            },
            {
                'title': 'Kayak en el Lago Rapel',
                'description': 'Travesía en kayak por el hermoso Lago Rapel. Incluye equipo completo y guía. Perfecto para desconectar y disfrutar la naturaleza.',
                'category': 'kayak',
                'organizer': 'demo@aktivar.app',
                'location_name': 'Lago Rapel, Chile',
                'lat': -34.1667, 'lng': -71.4167,
                'difficulty': 'easy',
                'capacity': 12,
                'price': 40000,
                'cover_image': 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=800',
                'distance_km': 10.0,
            },
            {
                'title': 'Trail Running Quebrada de Macul',
                'description': 'Carrera por senderos en la precordillera. 15km con 800m de desnivel positivo. Llevar agua y protección solar.',
                'category': 'trail-running',
                'organizer': 'lucia@aktivar.app',
                'location_name': 'Quebrada de Macul, Santiago',
                'lat': -33.4910, 'lng': -70.5370,
                'difficulty': 'hard',
                'capacity': 25,
                'price': 0,
                'cover_image': 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
                'distance_km': 15.0,
            },
            {
                'title': 'Camping Parque Nacional Torres del Paine',
                'description': '3 días de camping en uno de los parques más espectaculares de Sudamérica. Incluye traslado desde Puerto Natales.',
                'category': 'camping',
                'organizer': 'camila@aktivar.app',
                'location_name': 'Torres del Paine, Chile',
                'lat': -50.9423, 'lng': -73.4068,
                'difficulty': 'moderate',
                'capacity': 8,
                'price': 120000,
                'cover_image': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
                'distance_km': 40.0,
            },
            {
                'title': 'Yoga al Amanecer — Playa Reñaca',
                'description': 'Sesión de yoga Vinyasa frente al mar al amanecer. Todos los niveles bienvenidos. Llevar mat propio o alquilar uno.',
                'category': 'yoga-outdoor',
                'organizer': 'camila@aktivar.app',
                'location_name': 'Playa Reñaca, Viña del Mar',
                'lat': -32.9836, 'lng': -71.5531,
                'difficulty': 'easy',
                'capacity': 30,
                'price': 8000,
                'cover_image': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
                'distance_km': 0,
            },
            {
                'title': 'Surf Session — Punta de Lobos',
                'description': 'Sesión de surf guiada en una de las mejores olas de Chile. Todos los niveles. Incluye tabla y wetsuit.',
                'category': 'surf',
                'organizer': 'lucia@aktivar.app',
                'location_name': 'Punta de Lobos, Pichilemu',
                'lat': -34.4333, 'lng': -72.0333,
                'difficulty': 'moderate',
                'capacity': 10,
                'price': 30000,
                'cover_image': 'https://images.unsplash.com/photo-1502680390548-bdbac40551e5?w=800',
                'distance_km': 0,
            },
        ]

        activities = []
        for i, a_data in enumerate(activities_data):
            start = now + timedelta(days=random.randint(3, 21), hours=random.choice([7, 8, 9, 14, 15]))
            act, _ = Activity.objects.get_or_create(
                title=a_data['title'],
                defaults={
                    'description': a_data['description'],
                    'category': categories[a_data['category']],
                    'organizer': users[a_data['organizer']],
                    'location_name': a_data['location_name'],
                    'latitude': Decimal(str(a_data['lat'])),
                    'longitude': Decimal(str(a_data['lng'])),
                    'meeting_point': a_data['location_name'],
                    'start_datetime': start,
                    'end_datetime': start + timedelta(hours=random.choice([3, 4, 5, 8])),
                    'capacity': a_data['capacity'],
                    'price': Decimal(str(a_data['price'])),
                    'is_free': a_data['price'] == 0,
                    'status': 'published',
                    'difficulty': a_data['difficulty'],
                    'cover_image': a_data['cover_image'],
                    'distance_km': Decimal(str(a_data['distance_km'])),
                    'what_to_bring': 'Agua, protección solar, snacks, ropa cómoda',
                },
            )
            activities.append(act)

        self.stdout.write(f'  Created {len(activities)} activities')

        # ── Participants ───────────────────────────────────────────
        participant_users = [u for email, u in users.items() if u.role == 'user']
        for act in activities:
            num_participants = random.randint(2, min(5, act.capacity))
            chosen = random.sample(participant_users, min(num_participants, len(participant_users)))
            for user in chosen:
                if user != act.organizer:
                    ActivityParticipant.objects.get_or_create(
                        activity=act, user=user,
                        defaults={'status': 'confirmed'},
                    )

        self.stdout.write('  Added random participants to activities')

        # ── Reviews ────────────────────────────────────────────────
        organizers = [u for u in users.values() if u.role == 'organizer']
        for org in organizers:
            for reviewer in random.sample(participant_users, min(3, len(participant_users))):
                org_activities = Activity.objects.filter(organizer=org)
                if org_activities.exists():
                    Review.objects.get_or_create(
                        reviewer=reviewer,
                        reviewee=org,
                        activity=org_activities.first(),
                        defaults={
                            'rating': random.randint(4, 5),
                            'comment': random.choice([
                                '¡Excelente experiencia! Muy bien organizado.',
                                'Increíble actividad, repetiría sin dudarlo.',
                                'Buen organizador, todo puntual y seguro.',
                                'La pasé genial, super recomendado.',
                                'Muy profesional y buena onda.',
                            ]),
                        },
                    )

        self.stdout.write('  Created reviews for organizers')

        # ── Vehicle + Trip ─────────────────────────────────────────
        driver = users['andres@aktivar.app']
        vehicle, _ = Vehicle.objects.get_or_create(
            owner=driver,
            defaults={
                'brand': 'Toyota',
                'model_name': 'Hilux',
                'year': 2022,
                'color': 'Blanco',
                'plate': 'AB-1234',
                'capacity': 4,
            },
        )

        trip_activity = activities[0]  # Senderismo
        trip, _ = Trip.objects.get_or_create(
            driver=driver,
            activity=trip_activity,
            defaults={
                'vehicle': vehicle,
                'origin_name': 'Metro Tobalaba, Santiago',
                'origin_latitude': Decimal('-33.4207'),
                'origin_longitude': Decimal('-70.6005'),
                'destination_name': trip_activity.location_name if hasattr(trip_activity, 'location_name') else 'Cajón del Maipo',
                'destination_latitude': Decimal('-33.5960'),
                'destination_longitude': Decimal('-70.0780'),
                'departure_time': trip_activity.start_datetime - timedelta(hours=1),
                'available_seats': 3,
                'price_per_passenger': Decimal('5000'),
                'status': 'planned',
                'notes': 'Salimos desde Metro Tobalaba. Traer buena onda 🤙',
            },
        )
        # Add a stop
        TripStop.objects.get_or_create(
            trip=trip,
            defaults={
                'name': 'Metro Tobalaba',
                'latitude': Decimal('-33.4207'),
                'longitude': Decimal('-70.6005'),
                'order': 1,
            },
        )

        self.stdout.write('  Created demo vehicle and trip')

        # ── Summary ────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Demo data seeded successfully!\n'
            f'   Users: {len(users)} (login: any email / password: aktivar2024)\n'
            f'   Categories: {len(categories)}\n'
            f'   Activities: {len(activities)}\n'
            f'   Vehicle + Trip: 1\n'
            f'\n   Demo login: demo@aktivar.app / aktivar2024'
        ))
