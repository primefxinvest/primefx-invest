'use client'

import { useMemo, useState } from 'react'
import { Heart, MessageCircle, Share2, Users, TrendingUp, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { AsyncState } from '@/components/shared/data-state'
import { TableSkeleton } from '@/components/shared/skeletons'
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
  const { data: topMembers = [] } = useAsyncData(() => fetchCommunityTopMembers(), [])

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('description')}</p>
        </div>
        <Button type="button" size="sm" className="w-full shrink-0 sm:w-auto">
          <MessageCircle />
          {t('newDiscussion')}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <CustomSelect
            value={category}
            onValueChange={setCategory}
            options={categoryOptions}
            placeholder={t('categoryAll')}
            className="w-full md:w-auto md:min-w-[11rem]"
          />
        </div>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!filteredPosts.length}
        emptyTitle={t('emptyTitle')}
        emptyDescription={t('emptyDescription')}
        skeleton={<TableSkeleton rows={3} cols={1} showHeader={false} />}
      >
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <img src={post.avatar} alt={post.author} className="h-10 w-10 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">{post.author}</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{post.title}</h3>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-foreground">
                      {post.category}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{post.content}</p>
                  <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                    <button type="button" className="flex items-center gap-2 transition-colors hover:text-red-500">
                      <Heart className="h-4 w-4" />
                      {post.likes}
                    </button>
                    <button type="button" className="flex items-center gap-2 transition-colors hover:text-primary">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </button>
                    <button type="button" className="flex items-center gap-2 transition-colors hover:text-primary">
                      <Share2 className="h-4 w-4" />
                      {t('share')}
                    </button>
                    <span className="ml-auto">{post.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsyncState>

      {topMembers.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t('topMembers')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {topMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{t('posts', { count: member.posts })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{member.engagement}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
