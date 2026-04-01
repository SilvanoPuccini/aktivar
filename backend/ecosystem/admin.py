from django.contrib import admin

from .models import Community, JournalStory, MarketplaceListing, RankBadge, RankChallenge, SafetyChecklist, SafetyLogEntry, SafetyStatus, UserBadge, UserRankProfile

admin.site.register(Community)
admin.site.register(JournalStory)
admin.site.register(MarketplaceListing)
admin.site.register(UserRankProfile)
admin.site.register(RankBadge)
admin.site.register(UserBadge)
admin.site.register(RankChallenge)
admin.site.register(SafetyStatus)
admin.site.register(SafetyChecklist)
admin.site.register(SafetyLogEntry)
