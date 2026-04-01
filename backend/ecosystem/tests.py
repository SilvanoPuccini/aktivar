from django.test import override_settings
from rest_framework.test import APITestCase

from users.models import CustomUser
from .models import Community, JournalStory, MarketplaceListing, UserRankProfile

LOCMEM_CACHE = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}


@override_settings(CACHES=LOCMEM_CACHE)
class EcosystemApiTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='eco@test.com', password='pass12345', full_name='Eco User')
        Community.objects.create(name='Mountain Circle', category='mountain', description='desc', member_count=10, is_featured=True)
        JournalStory.objects.create(title='Granite Giants', summary='summary', author_name='Mateo', is_featured=True)
        MarketplaceListing.objects.create(title='Tent', category='camping', condition='excellent', price=120)
        UserRankProfile.objects.create(user=self.user, title='Explorer', level=4)

    def test_public_lists(self):
        response = self.client.get('/api/v1/ecosystem/communities/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        response = self.client.get('/api/v1/ecosystem/journal/featured/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Granite Giants')

    def test_authenticated_rank(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/v1/ecosystem/rank/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Explorer')
