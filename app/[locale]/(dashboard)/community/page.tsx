'use client'

import { useMemo, useState } from 'react'
import { Heart, MessageCircle, Share2, Users, TrendingUp, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { AsyncState, EmptyState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { TableSkeleton } from '@/components/shared/skeletons'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchCommunityPosts, fetchCommunityTopMembers } from '@/lib/data/queries'

export default function CommunityPage() {
  const t = useTranslations('community')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const { data: posts = [], loading, error, reload } = useAsyncData(
    () => fetchCommunityPosts(),
    []
  )
  const { data: topMembers = [], loading: membersLoading } = useAsyncData(
    () => fetchCommunityTopMembers(),
    []
  )

  const categoryOptions = [
    { value: 'all', label: t('categoryAll') },
    { value: 'investing', label: t('categoryInvesting') },
    { value: 'market', label: t('categoryMarket') },
    { value: 'strategies', label: t('categoryStrategies') },
    { value: 'support', label: t('categorySupport') },
  ]

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesCategory =
        category === 'all' ||
        post.category.toLowerCase().includes(category) ||
        post.category.toLowerCase() === category
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [posts, category, search])

  const isTrulyEmpty = posts.length === 0
  const noFilterMatches = !isTrulyEmpty && filteredPosts.length === 0

  return (
    <div className={pageStackClass}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button type="button" size="sm" className="w-full shrink-0 sm:w-auto" disabled>
          <MessageCircle />
          {t('newDiscussion')} (Coming Soon)
        </Button>
      </header>

      <section aria-label="Search and filter" className={sectionStackClass}>
        <SectionHeading>Browse discussions</SectionHeading>
        <div className={cardSurfaceClass}>
          <div className="flex flex-col gap-3 md:flex-row">
            <label htmlFor="community-search" className="sr-only">
              {t('searchPlaceholder')}
            </label>
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                id="community-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <CustomSelect
              value={category}
              onValueChange={setCategory}
              options={categoryOptions}
              placeholder={t('categoryAll')}
              ariaLabel={t('categoryAll')}
              className="w-full md:w-auto md:min-w-[11rem]"
            />
          </div>
        </div>
      </section>

      <section aria-label="Community posts" className="space-y-3">
        <SectionHeading>Recent posts</SectionHeading>
        <AsyncState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={isTrulyEmpty}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
          skeleton={<TableSkeleton rows={3} cols={1} showHeader={false} />}
        >
          {noFilterMatches ? (
            <EmptyState
              title={t('emptyTitle')}
              description={t('emptyDescription')}
              compact
              className="rounded-xl border border-border bg-card shadow-sm"
            />
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={post.avatar}
                      alt={post.author}
                      className="h-10 w-10 shrink-0 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-muted-foreground">{post.author}</p>
                          <h3 className="mt-1 text-base font-semibold leading-snug text-foreground sm:text-lg">
                            {post.title}
                          </h3>
                        </div>
                        <span className="w-fit shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                          {post.category}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{post.content}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
                        <span className="sr-only">{post.likes} likes, coming soon</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground/60" aria-hidden="true">
                          <Heart className="h-4 w-4" />
                          {post.likes}
                        </span>
                        <span className="sr-only">{post.comments} comments, coming soon</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground/60" aria-hidden="true">
                          <MessageCircle className="h-4 w-4" />
                          {post.comments}
                        </span>
                        <span className="sr-only">{t('share')}, coming soon</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground/60" aria-hidden="true">
                          <Share2 className="h-4 w-4" />
                          {t('share')}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">{post.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </AsyncState>
      </section>

      {(topMembers.length > 0 || membersLoading) && (
        <section aria-label="Top members" className="space-y-3">
          <SectionHeading>{t('topMembers')}</SectionHeading>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">{t('topMembers')}</h2>
            </div>
            {membersLoading ? (
              <TableSkeleton rows={2} cols={1} showHeader={false} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="h-10 w-10 shrink-0 rounded-full"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('posts', { count: member.posts })}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold tabular-nums text-primary">
                        {member.engagement}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
