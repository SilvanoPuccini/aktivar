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
            {'name': 'Running', 'slug': 'running', 'icon': 'zap', 'color': '#FF9800', 'is_outdoor': True, 'order': 1},
            {'name': 'Senderismo', 'slug': 'senderismo', 'icon': 'mountain', 'color': '#4CAF50', 'is_outdoor': True, 'order': 2},
            {'name': 'Escalada', 'slug': 'escalada', 'icon': 'trending-up', 'color': '#FF5722', 'is_outdoor': True, 'order': 3},
            {'name': 'Ciclismo', 'slug': 'ciclismo', 'icon': 'bike', 'color': '#2196F3', 'is_outdoor': True, 'order': 4},
            {'name': 'Trail Running', 'slug': 'trail-running', 'icon': 'zap', 'color': '#FF9800', 'is_outdoor': True, 'order': 5},
            {'name': 'Kayak', 'slug': 'kayak', 'icon': 'waves', 'color': '#00BCD4', 'is_outdoor': True, 'order': 6},
            {'name': 'Camping', 'slug': 'camping', 'icon': 'tent', 'color': '#795548', 'is_outdoor': True, 'order': 7},
            {'name': 'Surf', 'slug': 'surf', 'icon': 'waves', 'color': '#009688', 'is_outdoor': True, 'order': 8},
            {'name': 'Yoga Outdoor', 'slug': 'yoga-outdoor', 'icon': 'heart', 'color': '#E91E63', 'is_outdoor': True, 'order': 9},
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
            ('Bariloche, Argentina', -41.1335, -71.3103),
            ('San Martín de los Andes, Argentina', -40.1567, -71.3527),
            ('El Bolsón, Argentina', -42.0667, -71.6167),
            ('Villarrica, Chile', -39.2833, -72.2167),
            ('Pucón, Chile', -39.2667, -71.9667),
            ('Junín de los Andes, Argentina', -39.9500, -71.0667),
            ('Esquel, Argentina', -42.9167, -71.3167),
            ('Villa La Angostura, Argentina', -40.7614, -71.6469),
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
                'title': 'Running en Circuito Chico',
                'description': 'Recorrido de running por el famoso Circuito Chico de Bariloche. 12km bordeando lagos y bosques de coihues con vistas al Nahuel Huapi. Apto para todos los niveles.',
                'category': 'running',
                'organizer': 'demo@aktivar.app',
                'location_name': 'Circuito Chico, Bariloche, Argentina',
                'lat': -41.1335, 'lng': -71.3103,
                'difficulty': 'easy',
                'capacity': 20,
                'price': 0,
                'cover_image': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
                'distance_km': 12.0,
            },
            {
                'title': 'Senderismo Refugio Frey',
                'description': 'Trekking al Refugio Frey con vistas a la Laguna Toncek y las agujas de granito del Cerro Catedral. 24km ida y vuelta con 800m de desnivel.',
                'category': 'senderismo',
                'organizer': 'demo@aktivar.app',
                'location_name': 'Refugio Frey, Bariloche, Argentina',
                'lat': -41.1500, 'lng': -71.4400,
                'difficulty': 'moderate',
                'capacity': 15,
                'price': 5000,
                'cover_image': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
                'distance_km': 24.0,
            },
            {
                'title': 'MTB Ruta de los Siete Lagos',
                'description': 'Ruta de mountain bike por la icónica Ruta de los Siete Lagos. 40km de paisajes patagónicos con lagos cristalinos, bosques de lengas y montañas nevadas.',
                'category': 'ciclismo',
                'organizer': 'demo@aktivar.app',
                'location_name': 'Ruta de los Siete Lagos, San Martín de los Andes, Argentina',
                'lat': -40.1567, 'lng': -71.3527,
                'difficulty': 'moderate',
                'capacity': 15,
                'price': 8000,
                'cover_image': 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=800',
                'distance_km': 40.0,
            },
            {
                'title': 'Kayak en Lago Puelo',
                'description': 'Travesía en kayak por las aguas turquesas del Lago Puelo en el Parque Nacional. Incluye equipo completo y guía. Perfecto para disfrutar la naturaleza patagónica.',
                'category': 'kayak',
                'organizer': 'demo@aktivar.app',
                'location_name': 'Lago Puelo, El Bolsón, Argentina',
                'lat': -42.0667, 'lng': -71.6167,
                'difficulty': 'easy',
                'capacity': 12,
                'price': 15000,
                'cover_image': 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=800',
                'distance_km': 8.0,
            },
            {
                'title': 'Trail Running Volcán Villarrica',
                'description': 'Trail running por las laderas del Volcán Villarrica. 16km con terreno volcánico y vistas al lago. Nivel exigente con 1200m de desnivel positivo.',
                'category': 'trail-running',
                'organizer': 'lucia@aktivar.app',
                'location_name': 'Volcán Villarrica, Chile',
                'lat': -39.4208, 'lng': -71.9397,
                'difficulty': 'hard',
                'capacity': 20,
                'price': 0,
                'cover_image': 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
                'distance_km': 16.0,
            },
            {
                'title': 'Escalada en Piedra Parada',
                'description': 'Jornada de escalada deportiva en Piedra Parada, la formación rocosa más impresionante de la Patagonia. 200m de pared vertical. Se requiere nivel avanzado.',
                'category': 'escalada',
                'organizer': 'lucia@aktivar.app',
                'location_name': 'Piedra Parada, Chubut, Argentina',
                'lat': -42.6500, 'lng': -70.0833,
                'difficulty': 'hard',
                'capacity': 10,
                'price': 12000,
                'cover_image': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800',
                'distance_km': 3.0,
            },
            {
                'title': 'Camping Lago Huechulafquen',
                'description': 'Camping a orillas del Lago Huechulafquen con vista al Volcán Lanín. Incluye lugar de fogón y acceso al lago. Ideal para desconectar en plena Patagonia.',
                'category': 'camping',
                'organizer': 'camila@aktivar.app',
                'location_name': 'Lago Huechulafquen, Junín de los Andes, Argentina',
                'lat': -39.7833, 'lng': -71.3667,
                'difficulty': 'easy',
                'capacity': 12,
                'price': 6000,
                'cover_image': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
                'distance_km': 0,
            },
            {
                'title': 'Trekking Volcán Lanín',
                'description': 'Ascenso al Volcán Lanín, uno de los trekkings más desafiantes de la Patagonia. 18km con 1500m de desnivel. Se requiere experiencia en alta montaña.',
                'category': 'senderismo',
                'organizer': 'lucia@aktivar.app',
                'location_name': 'Volcán Lanín, Pucón/Junín border',
                'lat': -39.6353, 'lng': -71.5036,
                'difficulty': 'hard',
                'capacity': 8,
                'price': 18000,
                'cover_image': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
                'distance_km': 18.0,
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

        trip_activity = activities[0]  # Running en Circuito Chico
        trip, _ = Trip.objects.get_or_create(
            driver=driver,
            activity=trip_activity,
            defaults={
                'vehicle': vehicle,
                'origin_name': 'Centro Cívico, Bariloche',
                'origin_latitude': Decimal('-41.1335'),
                'origin_longitude': Decimal('-71.3103'),
                'destination_name': trip_activity.location_name if hasattr(trip_activity, 'location_name') else 'Circuito Chico, Bariloche',
                'destination_latitude': Decimal('-41.0580'),
                'destination_longitude': Decimal('-71.4500'),
                'departure_time': trip_activity.start_datetime - timedelta(hours=1),
                'available_seats': 3,
                'price_per_passenger': Decimal('3000'),
                'status': 'planned',
                'notes': 'Salimos desde el Centro Cívico de Bariloche. Traer buena onda!',
            },
        )
        # Add a stop
        TripStop.objects.get_or_create(
            trip=trip,
            defaults={
                'name': 'Centro Cívico, Bariloche',
                'latitude': Decimal('-41.1335'),
                'longitude': Decimal('-71.3103'),
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
