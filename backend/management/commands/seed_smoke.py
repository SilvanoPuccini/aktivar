from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from activities.models import Activity, ActivityParticipant, Category
from chat.models import Message
from notifications.models import Notification
from transport.models import Trip, TripPassenger, TripStop, Vehicle
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
            activity.status = 'published'
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

        self.stdout.write(self.style.SUCCESS('Smoke seed ready: demo@aktivar.app / aktivar123'))
