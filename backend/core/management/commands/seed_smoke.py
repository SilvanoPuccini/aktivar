from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from activities.models import Activity, ActivityParticipant, Category
from chat.models import Message
from ecosystem.models import (
    Community,
    JournalStory,
    MarketplaceListing,
    RankBadge,
    RankChallenge,
    SafetyChecklist,
    SafetyLogEntry,
    SafetyStatus,
    UserBadge,
    UserRankProfile,
)
from notifications.models import Notification
from transport.models import EmergencyContact, Trip, TripPassenger, TripStop, Vehicle
from users.models import CustomUser, DriverProfile


class Command(BaseCommand):
    help = "Seed minimal reusable smoke-test/demo data for local frontend/backend validation"

    def handle(self, *args, **options):
        now = timezone.now()

        organizer, _ = CustomUser.objects.get_or_create(
            email='demo@aktivar.app',
            defaults={
                'full_name': 'Demo Organizer',
                'role': 'organizer',
                'is_verified_email': True,
                'avatar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
                'bio': 'Outdoor host',
            },
        )
        organizer.set_password('aktivar123')
        organizer.is_verified_email = True
        organizer.role = 'organizer'
        organizer.avatar = organizer.avatar or 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop'
        organizer.save()
        organizer.profile.location_name = 'Bariloche, Argentina'
        organizer.profile.bio_extended = 'Organizo trekkings, hikes al atardecer y expediciones sociales.'
        organizer.profile.total_activities = 8
        organizer.profile.total_km = 126
        organizer.profile.total_people_met = 72
        organizer.profile.avg_rating = 4.9
        organizer.profile.badges = [{'id': 'host', 'name': 'Top Host'}]
        organizer.profile.save()

        explorer, _ = CustomUser.objects.get_or_create(
            email='explorer@aktivar.app',
            defaults={
                'full_name': 'Demo Explorer',
                'role': 'user',
                'is_verified_email': True,
                'avatar': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
            },
        )
        explorer.set_password('aktivar123')
        explorer.is_verified_email = True
        explorer.avatar = explorer.avatar or 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop'
        explorer.save()
        explorer.profile.location_name = 'Villa La Angostura, Argentina'
        explorer.profile.save()

        driver, _ = CustomUser.objects.get_or_create(
            email='driver@aktivar.app',
            defaults={
                'full_name': 'Demo Driver',
                'role': 'driver',
                'is_verified_email': True,
                'avatar': 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=400&auto=format&fit=crop',
            },
        )
        driver.set_password('aktivar123')
        driver.is_verified_email = True
        driver.role = 'driver'
        driver.avatar = driver.avatar or 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=400&auto=format&fit=crop'
        driver.save()
        driver.profile.location_name = 'Bariloche, Argentina'
        driver.profile.save()
        DriverProfile.objects.get_or_create(
            user=driver,
            defaults={
                'license_number': 'DRV-12345',
                'license_expiry': now.date() + timedelta(days=365),
                'is_verified_driver': True,
                'driver_rating': 4.8,
                'total_trips': 23,
            },
        )

        trekking, _ = Category.objects.get_or_create(
            slug='trekking',
            defaults={'name': 'Trekking', 'icon': 'mountain', 'color': '#7BDA96', 'is_outdoor': True, 'order': 1},
        )
        surf, _ = Category.objects.get_or_create(
            slug='surf',
            defaults={'name': 'Surf', 'icon': 'waves', 'color': '#5B9CF6', 'is_outdoor': True, 'order': 2},
        )

        activity, created = Activity.objects.get_or_create(
            title='Volcano Sunset Hike',
            organizer=organizer,
            defaults={
                'description': 'Una salida editorial para probar feed, detalle, chat, pago y onboarding visual con backend real.',
                'category': trekking,
                'cover_image': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
                'location_name': 'Volcán Osorno',
                'latitude': -41.1012000,
                'longitude': -72.4912000,
                'meeting_point': 'Base del sendero principal',
                'start_datetime': now + timedelta(days=2),
                'end_datetime': now + timedelta(days=2, hours=5),
                'capacity': 12,
                'price': 18000,
                'is_free': False,
                'status': 'published',
                'difficulty': 'moderate',
                'distance_km': 14.5,
                'what_to_bring': 'Agua, snack, rompeviento, linterna frontal',
            },
        )
        if not created:
            activity.category = trekking
            if activity.status == 'draft':
                activity.publish()
            activity.save()

        ActivityParticipant.objects.get_or_create(activity=activity, user=organizer, defaults={'status': 'confirmed'})
        ActivityParticipant.objects.get_or_create(activity=activity, user=explorer, defaults={'status': 'confirmed'})

        Message.objects.get_or_create(activity=activity, author=organizer, content='Bienvenidos al grupo. Revisen equipo y horario.', defaults={'message_type': 'text'})
        Message.objects.get_or_create(activity=activity, author=explorer, content='Voy en auto desde Bariloche, ¿alguien se suma?', defaults={'message_type': 'text'})

        vehicle, _ = Vehicle.objects.get_or_create(
            owner=driver,
            plate='AKT-123',
            defaults={
                'brand': 'Subaru',
                'model_name': 'Forester',
                'color': 'Verde bosque',
                'capacity': 4,
                'photo': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop',
                'year': 2022,
            },
        )

        trip, _ = Trip.objects.get_or_create(
            driver=driver,
            vehicle=vehicle,
            activity=activity,
            origin_name='Bariloche Centro',
            destination_name='Volcán Osorno',
            defaults={
                'origin_latitude': -41.1335000,
                'origin_longitude': -71.3103000,
                'destination_latitude': -41.1012000,
                'destination_longitude': -72.4912000,
                'departure_time': now + timedelta(days=2, hours=-1),
                'estimated_arrival': now + timedelta(days=2, hours=1),
                'price_per_passenger': 6500,
                'available_seats': 3,
                'status': 'planned',
                'notes': 'Salimos puntual, llevar capa impermeable.',
            },
        )
        TripStop.objects.get_or_create(trip=trip, order=1, defaults={'name': 'Terminal de buses', 'latitude': -41.134, 'longitude': -71.308, 'estimated_time': now + timedelta(days=2, hours=-1)})
        TripStop.objects.get_or_create(trip=trip, order=2, defaults={'name': 'Mirador lago', 'latitude': -41.12, 'longitude': -71.8, 'estimated_time': now + timedelta(days=2)})
        TripPassenger.objects.get_or_create(trip=trip, user=explorer, defaults={'status': 'confirmed', 'paid': False})

        Notification.objects.get_or_create(
            user=organizer,
            notification_type='new_message',
            title='Nuevo mensaje en Volcano Sunset Hike',
            body='Demo Explorer escribió en el chat del grupo.',
            defaults={'data': {'activity_id': activity.id, 'actor': {'id': explorer.id, 'full_name': explorer.full_name, 'avatar': explorer.avatar}}},
        )
        Notification.objects.get_or_create(
            user=organizer,
            notification_type='activity_joined',
            title='Nuevo participante',
            body='Demo Explorer se unió a Volcano Sunset Hike.',
            defaults={'data': {'activity_id': activity.id, 'actor': {'id': explorer.id, 'full_name': explorer.full_name, 'avatar': explorer.avatar}}},
        )

        communities = [
            {
                'name': 'Andinistas de Chile',
                'category': 'mountain',
                'description': 'Colectivo de altura para expediciones, aclimatación y planificación colaborativa en la cordillera andina.',
                'tagline': 'Community of the week',
                'cover_image': 'https://images.unsplash.com/photo-1517821099601-3f20c76fa5b0?q=80&w=1200&auto=format&fit=crop',
                'location_name': 'Santiago, Chile',
                'member_count': 12400,
                'activity_label': 'High',
                'cadence_label': 'Weekly',
                'is_featured': True,
                'display_order': 1,
            },
            {
                'name': 'Surfistas del Pacífico',
                'category': 'water',
                'description': 'Cazando swells fríos desde Vancouver hasta Tierra del Fuego.',
                'cover_image': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
                'member_count': 8300,
                'activity_label': 'High • Daily',
                'cadence_label': 'Daily',
                'display_order': 2,
            },
            {
                'name': 'Forest Trackers',
                'category': 'survival',
                'description': 'Prevención, ciencia y movimiento en ecosistemas boscosos.',
                'cover_image': 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
                'member_count': 1800,
                'activity_label': 'Weekly',
                'cadence_label': 'Weekly',
                'display_order': 3,
            },
        ]
        for payload in communities:
            Community.objects.update_or_create(slug=payload['name'].lower().replace(' ', '-'), defaults=payload)

        stories = [
            {
                'title': 'Chasing the Granite Giants',
                'summary': 'Torres del Paine, viento duro y una travesía que redefine el ritmo del grupo.',
                'body': 'Relato largo del equipo enfrentando altura, viento y navegación.',
                'author_name': 'Mateo Vazquez',
                'category_label': 'Featured expedition',
                'region_label': 'Patagonia',
                'cover_image': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
                'featured_quote': 'We found ourselves standing where the map ended.',
                'distance_km': 124.8,
                'elevation_m': 4200,
                'read_time_minutes': 12,
                'is_featured': True,
                'is_trending': True,
            },
            {
                'title': 'Lost in the Deep Green Silence',
                'summary': 'Un tramo por el Amazonas que exige escuchar el terreno más que dominarlo.',
                'body': 'Crónica de río, clima y lectura fina del entorno.',
                'author_name': 'Sofia Rincon',
                'category_label': 'Amazonas story',
                'region_label': 'Amazonas',
                'cover_image': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop',
                'distance_km': 88.5,
                'elevation_m': 900,
                'read_time_minutes': 10,
                'is_trending': True,
            },
            {
                'title': 'Where the Sky Touches the Earth',
                'summary': 'Atacama como canvas nocturno para una expedición fotográfica.',
                'body': 'Diez noches documentando el cielo más limpio del continente.',
                'author_name': 'Carlos Mendez',
                'category_label': 'Night photography',
                'region_label': 'Atacama',
                'cover_image': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
                'distance_km': 42.0,
                'elevation_m': 2400,
                'read_time_minutes': 8,
                'is_trending': True,
            },
        ]
        for payload in stories:
            JournalStory.objects.update_or_create(slug=payload['title'].lower().replace(' ', '-'), defaults=payload)

        listings = [
            {
                'title': 'North Face Alpine 3 Tent',
                'category': 'camping',
                'subcategory': 'Tents',
                'condition': 'excellent',
                'price': 450,
                'rating': 4.9,
                'location_name': 'Boulder, CO',
                'cover_image': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200&auto=format&fit=crop',
                'is_featured': True,
                'seller': organizer,
            },
            {
                'title': 'Black Diamond Carabiner Set',
                'category': 'climbing',
                'subcategory': 'Hardware',
                'condition': 'new',
                'price': 120,
                'rating': 4.8,
                'location_name': 'Chamonix, FR',
                'cover_image': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=1200&auto=format&fit=crop',
                'seller': driver,
            },
            {
                'title': 'GoPro Hero 12 Black + Acc.',
                'category': 'tech',
                'subcategory': 'Action camera',
                'condition': 'excellent',
                'price': 325,
                'rating': 4.3,
                'location_name': 'Seattle, WA',
                'cover_image': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop',
                'seller': explorer,
            },
        ]
        for payload in listings:
            MarketplaceListing.objects.update_or_create(slug=payload['title'].lower().replace(' ', '-'), defaults=payload)

        rank_profile, _ = UserRankProfile.objects.get_or_create(
            user=organizer,
            defaults={
                'title': 'Senior Expeditionary',
                'level': 42,
                'current_xp': 7240,
                'next_level_xp': 10000,
                'total_distance_km': 1284,
                'peak_elevation_m': 4120,
                'group_saves': 14,
                'next_unlock': 'Elite Trailmaster',
            },
        )
        rank_profile.title = 'Senior Expeditionary'
        rank_profile.level = 42
        rank_profile.current_xp = 7240
        rank_profile.next_level_xp = 10000
        rank_profile.total_distance_km = 1284
        rank_profile.peak_elevation_m = 4120
        rank_profile.group_saves = 14
        rank_profile.next_unlock = 'Elite Trailmaster'
        rank_profile.save()

        badge_defs = [
            ('Summit King', 'award', 'Conquered 5 peaks over 3000m', False),
            ('Pathfinder', 'compass', 'Discovered 20 undocumented trails', False),
            ('Safety First', 'shield', 'Zero incidents across 50 group hikes', False),
            ('Lead Sherpa', 'users', 'Guided 100 newcomers safely', False),
            ('Ghost Walker', 'moon', 'Complete a midnight winter trail', True),
            ('Eco Guardian', 'leaf', 'Logged 50 clean-up activities', False),
        ]
        for index, (name, icon, description, locked) in enumerate(badge_defs, start=1):
            badge, _ = RankBadge.objects.update_or_create(
                name=name,
                defaults={'icon': icon, 'description': description, 'display_order': index},
            )
            UserBadge.objects.update_or_create(
                rank_profile=rank_profile,
                badge=badge,
                defaults={'is_locked': locked, 'earned_at': None if locked else now},
            )

        challenges = [
            ('Midnight Ascent', 'Climb 500m of elevation between 10PM and 4AM.', 45, 100, '+500 XP'),
            ('First Responder', 'Complete the Advanced First Aid certification module.', 15, 100, '+1200 XP'),
            ('Winter Solstice', 'Hike 20km during the week of the winter solstice.', 82, 100, 'Rare icon'),
        ]
        for index, (title, description, progress, target, reward) in enumerate(challenges, start=1):
            RankChallenge.objects.update_or_create(
                rank_profile=rank_profile,
                title=title,
                defaults={'description': description, 'progress': progress, 'target': target, 'reward_label': reward, 'display_order': index},
            )

        SafetyStatus.objects.update_or_create(
            user=organizer,
            defaults={
                'expedition_protocol': 'Expedition Protocol',
                'current_location': 'Eiger North Face',
                'temperature_c': -4,
                'wind_kmh': 48,
                'visibility_m': 800,
                'risk_level': 'high',
                'storm_warning': 'Heavy snowfall expected within 45 minutes. Seek shelter immediately.',
                'system_status': 'All systems green',
                'last_sync_at': now,
            },
        )
        SafetyChecklist.objects.update_or_create(
            user=organizer,
            defaults={'gear_progress': 8, 'gear_target': 10, 'route_status': 'completed', 'health_status': 'incomplete', 'permits_count': 2},
        )
        EmergencyContact.objects.update_or_create(
            user=organizer,
            defaults={'contact_name': 'Elena Rossi', 'contact_phone': '+54 9 11 5555 0101', 'relationship': 'Primary ice contact'},
        )
        for severity, message in [
            ('warning', 'Weather satellite data updated. Wind speeds increasing in Sector 7-G.'),
            ('info', 'Route checkpoint synced. GPS lock confirmed.'),
            ('critical', 'Safety perimeter breach warning dismissed by user.'),
        ]:
            SafetyLogEntry.objects.get_or_create(user=organizer, severity=severity, message=message)

        self.stdout.write(self.style.SUCCESS('Smoke seed ready: demo@aktivar.app / aktivar123'))
