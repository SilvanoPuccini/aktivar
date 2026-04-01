import type { JournalStory } from '@/types/ecosystem'

type MaybeStory = JournalStory | null | undefined

export function isUsableJournalStory(story: MaybeStory): story is JournalStory {
  return Boolean(story?.id && story.title?.trim() && story.slug?.trim())
}

export function mergeJournalStories(...collections: Array<MaybeStory[] | undefined>): JournalStory[] {
  const deduped = new Map<string, JournalStory>()

  collections.flat().forEach((story) => {
    if (!isUsableJournalStory(story)) return
    const key = story.slug.trim().toLowerCase()
    if (!deduped.has(key)) deduped.set(key, story)
  })

  return Array.from(deduped.values())
}

export function buildJournalStoryHref(story: MaybeStory): string | null {
  if (!story?.slug?.trim()) return null
  return `/journal/${story.slug}`
}
