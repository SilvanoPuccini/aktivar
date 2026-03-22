"""
Management command to load demo data for AKTIVAR.
Creates demo users, categories, activities, vehicles, trips, and transport data.
Usage: python manage.py load_demo_data
"""

from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Load demo data for AKTIVAR (users, activities, transport)'

    def handle(self, *args, **options):
        self.stdout.write('Loading demo data for AKTIVAR...')
        self._create_users()
        self._create_categories()
        self._create_activities()
        self._create_vehicles_and_trips()
        self.stdout.write(self.style.SUCCESS('Demo data loaded successfully!'))

    def _create_users(self):
        from users.models import CustomUser, UserProfile

        users_data = [
            {
                'email': 'catalina.reyes@gmail.com',
                'full_name': 'Catalina Reyes',
                'avatar': 'https://api.dicebear.com/7.x/adventurer/svg?seed=Catalina',
                'bio': 'Amante del trekking y la naturaleza.',
                'phone': '+56912345678',
                'role': 'organizer',
                'is_verified_email': True,
                'is_verified_phone': True,
            },
            {
                'email': 'matias.gonzalez@gmail.com',
                'full_name': 'Matías González',
                'avatar': 'https://api.dicebear.com/7.x/adventurer/svg?seed=Matias',
                'bio': 'Ciclista urbano y de montaña.',
                'phone': '+56987654321',
                'role': 'driver',
                'is_verified_email': True,
                'is_verified_phone': True,
            },
            {
                'email': 'valentina.silva@gmail.com',
                'full_name': 'Valentina Silva',
                'avatar': 'https://api.dicebear.com/7.x/adventurer/svg?seed=Valentina',
                'bio': 'Fotógrafa de naturaleza y viajera.',
                'phone': '+56911223344',
                'role': 'user',
                'is_verified_email': True,
                'is_verified_phone': False,
            },
            {
                'email': 'santiago.herrera@gmail.com',
                'full_name': 'Santiago Herrera',
                'avatar': 'https://api.dicebear.com/7.x/adventurer/svg?seed=Santiago',
                'bio': 'Surfista de corazón y kayakista.',
                'phone': '+56955667788',
                'role': 'organizer',
                'is_verified_email': True,
                'is_verified_phone': True,
            },
            {
                'email': 'camila.lopez@gmail.com',
                'full_name': 'Camila López',
                'avatar': 'https://api.dicebear.com/7.x/adventurer/svg?seed=Camila',
                'bio': 'Porteña aventurera.',
                'phone': '+5491134567890',
                'role': 'user',
                'is_verified_email': True,
                'is_verified_phone': True,
            },
            {
                'email': 'andres.martinez@gmail.com',
                'full_name': 'Andrés Martínez',
                'avatar': 'https://api.dicebear.com/7.x/adventurer/svg?seed=Andres',
                'bio': 'Runner y montañista.',
                'phone': '+56933445566',
                'role': 'driver',
                'is_verified_email': True,
                'is_verified_phone': True,
            },
        ]

        profiles_data = [
            {'location_name': 'Santiago, Chile', 'total_activities': 87, 'total_km': Decimal('1420')},
            {'location_name': 'Valparaíso, Chile', 'total_activities': 62, 'total_km': Decimal('3200')},
            {'location_name': 'Santiago, Chile', 'total_activities': 34, 'total_km': Decimal('780')},
            {'location_name': 'Pichilemu, Chile', 'total_activities': 45, 'total_km': Decimal('620')},
            {'location_name': 'Buenos Aires, Argentina', 'total_activities': 28, 'total_km': Decimal('540')},
            {'location_name': 'Santiago, Chile', 'total_activities': 53, 'total_km': Decimal('2100')},
        ]

        for i, data in enumerate(users_data):
            user, created = CustomUser.objects.get_or_create(
                email=data['email'],
                defaults={**data, 'password': 'pbkdf2_sha256$600000$dummy$hash='},
            )
            if created:
                user.set_password('demo1234')
                user.save()
                # Update auto-created profile
                profile = user.profile
                for key, val in profiles_data[i].items():
                    setattr(profile, key, val)
                profile.save()
                self.stdout.write(f'  Created user: {user.full_name}')
            else:
                self.stdout.write(f'  User already exists: {user.full_name}')

        # Create superuser
        if not CustomUser.objects.filter(email='admin@aktivar.app').exists():
            CustomUser.objects.create_superuser(
                email='admin@aktivar.app',
                password='admin1234',
                full_name='Admin AKTIVAR',
            )
            self.stdout.write('  Created superuser: admin@aktivar.app / admin1234')

    def _create_categories(self):
        from activities.models import Category

        categories = [
            {'name': 'Trekking', 'slug': 'trekking', 'icon': 'mountain', 'color': '#7BDA96', 'is_outdoor': True, 'order': 1},
            {'name': 'Festival', 'slug': 'festival', 'icon': 'music', 'color': '#FFC56C', 'is_outdoor': True, 'order': 2},
            {'name': 'Ciclismo', 'slug': 'ciclismo', 'icon': 'bike', 'color': '#5B9CF6', 'is_outdoor': True, 'order': 3},
            {'name': 'Kayak', 'slug': 'kayak', 'icon': 'waves', 'color': '#4ECDC4', 'is_outdoor': True, 'order': 4},
            {'name': 'Cine', 'slug': 'cine', 'icon': 'film', 'color': '#FFB4AB', 'is_outdoor': False, 'order': 5},
            {'name': 'Viaje', 'slug': 'viaje', 'icon': 'plane', 'color': '#D6C4AC', 'is_outdoor': True, 'order': 6},
            {'name': 'Social', 'slug': 'social', 'icon': 'users', 'color': '#E1E3DA', 'is_outdoor': False, 'order': 7},
            {'name': 'Deporte', 'slug': 'deporte', 'icon': 'trophy', 'color': '#F0A500', 'is_outdoor': True, 'order': 8},
            {'name': 'Camping', 'slug': 'camping', 'icon': 'tent', 'color': '#7BDA96', 'is_outdoor': True, 'order': 9},
            {'name': 'Surf', 'slug': 'surf', 'icon': 'waves', 'color': '#5B9CF6', 'is_outdoor': True, 'order': 10},
        ]

        for data in categories:
            cat, created = Category.objects.get_or_create(
                slug=data['slug'], defaults=data
            )
            action = 'Created' if created else 'Exists'
            self.stdout.write(f'  {action} category: {cat.name}')

    def _create_activities(self):
        from activities.models import Activity, Category
        from users.models import CustomUser

        organizer = CustomUser.objects.filter(role='organizer').first()
        if not organizer:
            self.stdout.write(self.style.WARNING('No organizer found, skipping activities'))
            return

        now = timezone.now()

        activities_data = [
            {
                'title': 'Trekking Cerro Manquehue',
                'description': 'Subida al cerro Manquehue con vista panorámica de Santiago. Dificultad moderada, 3 horas de caminata.',
                'category_slug': 'trekking',
                'cover_image': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop',
                'location_name': 'Cerro Manquehue, Lo Barnechea',
                'latitude': Decimal('-33.3889000'),
                'longitude': Decimal('-70.5765000'),
                'start_datetime': now + timedelta(days=6, hours=6),
                'end_datetime': now + timedelta(days=6, hours=12),
                'capacity': 20,
                'price': Decimal('0'),
                'difficulty': 'moderate',
            },
            {
                'title': 'Festival de Jazz en el Parque',
                'description': 'Tarde de jazz en vivo con bandas locales. Trae tu manta y comida para compartir.',
                'category_slug': 'festival',
                'cover_image': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop',
                'location_name': 'Parque Bicentenario, Vitacura',
                'latitude': Decimal('-33.3978000'),
                'longitude': Decimal('-70.5962000'),
                'start_datetime': now + timedelta(days=10, hours=16),
                'end_datetime': now + timedelta(days=10, hours=22),
                'capacity': 50,
                'price': Decimal('5000'),
                'difficulty': 'easy',
            },
            {
                'title': 'Ruta ciclista costera Viña-Concón',
                'description': 'Recorrido de 25km por la costa. Nivel intermedio. Traer casco y agua.',
                'category_slug': 'ciclismo',
                'cover_image': 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&h=400&fit=crop',
                'location_name': 'Playa Reñaca, Viña del Mar',
                'latitude': Decimal('-33.0244000'),
                'longitude': Decimal('-71.5565000'),
                'start_datetime': now + timedelta(days=8, hours=8),
                'end_datetime': now + timedelta(days=8, hours=13),
                'capacity': 15,
                'price': Decimal('0'),
                'difficulty': 'moderate',
            },
            {
                'title': 'Kayak en Río Maipo',
                'description': 'Bajada en kayak por el río Maipo. Equipamiento incluido. Solo nadadores.',
                'category_slug': 'kayak',
                'cover_image': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
                'location_name': 'Río Maipo, San José de Maipo',
                'latitude': Decimal('-33.6388000'),
                'longitude': Decimal('-70.3500000'),
                'start_datetime': now + timedelta(days=14, hours=9),
                'end_datetime': now + timedelta(days=14, hours=15),
                'capacity': 10,
                'price': Decimal('25000'),
                'difficulty': 'hard',
            },
            {
                'title': 'Noche de Cine Indie',
                'description': 'Ciclo de cortometrajes chilenos independientes con conversatorio.',
                'category_slug': 'cine',
                'cover_image': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
                'location_name': 'Centro Cultural GAM, Santiago',
                'latitude': Decimal('-33.4406000'),
                'longitude': Decimal('-70.6544000'),
                'start_datetime': now + timedelta(days=4, hours=19),
                'end_datetime': now + timedelta(days=4, hours=22),
                'capacity': 30,
                'price': Decimal('3000'),
                'difficulty': 'easy',
            },
            {
                'title': 'Camping en Valle de la Luna',
                'description': '2 días en el desierto más seco del mundo. Noche de estrellas incluida.',
                'category_slug': 'camping',
                'cover_image': 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=600&h=400&fit=crop',
                'location_name': 'Valle de la Luna, San Pedro de Atacama',
                'latitude': Decimal('-22.9108000'),
                'longitude': Decimal('-68.2500000'),
                'start_datetime': now + timedelta(days=20, hours=10),
                'end_datetime': now + timedelta(days=21, hours=16),
                'capacity': 12,
                'price': Decimal('45000'),
                'difficulty': 'moderate',
            },
            {
                'title': 'Fútbol 7 - Pichanga Semanal',
                'description': 'Pichanga de fútbol 7 todos los sábados. Todos los niveles bienvenidos.',
                'category_slug': 'deporte',
                'cover_image': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
                'location_name': 'Canchas del Parque O\'Higgins, Santiago',
                'latitude': Decimal('-33.4650000'),
                'longitude': Decimal('-70.6610000'),
                'start_datetime': now + timedelta(days=3, hours=10),
                'end_datetime': now + timedelta(days=3, hours=12),
                'capacity': 14,
                'price': Decimal('2000'),
                'difficulty': 'easy',
            },
            {
                'title': 'Surf para Principiantes en Pichilemu',
                'description': 'Clase de surf con instructor certificado. Tabla y traje incluidos.',
                'category_slug': 'surf',
                'cover_image': 'https://images.unsplash.com/photo-1502680390548-bdbac40b0395?w=600&h=400&fit=crop',
                'location_name': 'Playa Punta de Lobos, Pichilemu',
                'latitude': Decimal('-34.4190000'),
                'longitude': Decimal('-72.0250000'),
                'start_datetime': now + timedelta(days=12, hours=8),
                'end_datetime': now + timedelta(days=12, hours=12),
                'capacity': 8,
                'price': Decimal('30000'),
                'difficulty': 'easy',
            },
        ]

        organizers = list(CustomUser.objects.filter(role='organizer'))

        for i, data in enumerate(activities_data):
            cat = Category.objects.filter(slug=data.pop('category_slug')).first()
            if not cat:
                continue
            activity, created = Activity.objects.get_or_create(
                title=data['title'],
                defaults={
                    **data,
                    'category': cat,
                    'organizer': organizers[i % len(organizers)],
                    'status': 'published',
                },
            )
            action = 'Created' if created else 'Exists'
            self.stdout.write(f'  {action} activity: {activity.title}')

    def _create_vehicles_and_trips(self):
        from transport.models import Vehicle, Trip, TripStop
        from users.models import CustomUser

        driver = CustomUser.objects.filter(role='driver').first()
        if not driver:
            self.stdout.write(self.style.WARNING('No driver found, skipping transport'))
            return

        vehicle, created = Vehicle.objects.get_or_create(
            plate='GGXK-42',
            defaults={
                'owner': driver,
                'brand': 'Toyota',
                'model_name': 'HiAce',
                'color': 'Blanco',
                'capacity': 8,
                'year': 2022,
            },
        )
        if created:
            self.stdout.write(f'  Created vehicle: {vehicle.brand} {vehicle.model_name}')

        now = timezone.now()
        trip, created = Trip.objects.get_or_create(
            driver=driver,
            vehicle=vehicle,
            departure_time=now + timedelta(days=6, hours=6),
            defaults={
                'origin_name': 'Metro Tobalaba, Santiago',
                'origin_latitude': Decimal('-33.4195000'),
                'origin_longitude': Decimal('-70.6005000'),
                'destination_name': 'Cerro Manquehue, Lo Barnechea',
                'destination_latitude': Decimal('-33.3889000'),
                'destination_longitude': Decimal('-70.5765000'),
                'price_per_passenger': Decimal('3500'),
                'available_seats': 8,
                'status': 'planned',
                'notes': 'Salimos puntuales. Traigan mochilas livianas.',
            },
        )
        if created:
            base_time = now + timedelta(days=6, hours=6)
            stops = [
                {'name': 'Metro Tobalaba', 'latitude': Decimal('-33.4195000'), 'longitude': Decimal('-70.6005000'), 'order': 1, 'estimated_time': base_time},
                {'name': 'Metro Los Dominicos', 'latitude': Decimal('-33.4088000'), 'longitude': Decimal('-70.5243000'), 'order': 2, 'estimated_time': base_time + timedelta(minutes=15)},
                {'name': 'Cerro Manquehue', 'latitude': Decimal('-33.3889000'), 'longitude': Decimal('-70.5765000'), 'order': 3, 'estimated_time': base_time + timedelta(minutes=45)},
            ]
            for s in stops:
                TripStop.objects.create(trip=trip, **s)
            self.stdout.write(f'  Created trip: {trip.origin_name} → {trip.destination_name}')
        else:
            self.stdout.write('  Trip already exists')
