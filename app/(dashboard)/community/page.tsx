'use client'

import { Heart, MessageCircle, Share2, Users, TrendingUp, Search } from 'lucide-react'

export default function CommunityPage() {
  const discussions = [
    {
      id: '1',
      author: 'Sarah Miller',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      title: 'Best S&P 500 Index Funds for Beginners',
      content: 'Looking for recommendations on the best S&P 500 index funds for a beginner investor...',
      category: 'Investing',
      likes: 245,
      comments: 28,
      timestamp: '2 hours ago',
      liked: false,
    },
    {
      id: '2',
      author: 'Michael Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
      title: 'Discussing Recent Market Trends',
      content: 'With the recent Fed decisions, how are you adjusting your portfolios? ...',
      category: 'Market Analysis',
      likes: 512,
      comments: 87,
      timestamp: '4 hours ago',
      liked: true,
    },
    {
      id: '3',
      author: 'Emma Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
      title: 'Dividend Strategy Discussion',
      content: 'Building a passive income portfolio with dividend stocks. Share your experience...',
      category: 'Strategies',
      likes: 189,
      comments: 42,
      timestamp: '6 hours ago',
      liked: false,
    },
  ]

  const topCommunityMembers = [
    { id: '1', name: 'Alex Zhang', posts: 234, engagement: 95, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
    { id: '2', name: 'Jessica Brown', posts: 198, engagement: 88, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica' },
    { id: '3', name: 'David Kumar', posts: 156, engagement: 82, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david' },
    { id: '4', name: 'Lisa Garcia', posts: 142, engagement: 79, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community</h1>
          <p className="mt-1 text-muted-foreground">Connect with other investors and share insights.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
          <MessageCircle className="h-4 w-4" />
          New Discussion
        </button>
      </div>

      {/* Search and Filter */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search discussions..."
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <select className="rounded-lg border border-border bg-background px-4 py-2">
            <option>All Categories</option>
            <option>Investing</option>
            <option>Market Analysis</option>
            <option>Strategies</option>
            <option>Support</option>
          </select>
        </div>
      </div>

      {/* Discussion Posts */}
      <div className="space-y-4">
        {discussions.map((post) => (
          <div key={post.id} className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <img src={post.avatar} alt={post.author} className="h-10 w-10 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{post.author}</p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{post.title}</h3>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-foreground">
                    {post.category}
                  </span>
                </div>
                <p className="mt-3 text-muted-foreground text-sm">{post.content}</p>
                <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                  <button className={`flex items-center gap-2 transition-colors ${post.liked ? 'text-red-500' : 'hover:text-red-500'}`}>
                    <Heart className={`h-4 w-4 ${post.liked ? 'fill-red-500' : ''}`} />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-2 hover:text-primary transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <span className="ml-auto">{post.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Community Members */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Top Community Members</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {topCommunityMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full" />
                <div>
                  <p className="font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.posts} posts</p>
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
    </div>
  )
}
