'use client'

import { HelpCircle, Search, Plus, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function SupportPage() {
  const tickets = [
    {
      id: 'TKT-001',
      subject: 'Unable to withdraw funds',
      description: 'I haven\'t been able to withdraw my funds for 3 days',
      status: 'open',
      priority: 'high',
      created: '2024-06-24',
      updated: '2024-06-25',
    },
    {
      id: 'TKT-002',
      subject: 'Portfolio not updating correctly',
      description: 'My portfolio value seems stuck on an old price',
      status: 'in-progress',
      priority: 'medium',
      created: '2024-06-20',
      updated: '2024-06-24',
    },
    {
      id: 'TKT-003',
      subject: 'Academy course access issue',
      description: 'Cannot access premium course material',
      status: 'resolved',
      priority: 'medium',
      created: '2024-06-15',
      updated: '2024-06-22',
    },
    {
      id: 'TKT-004',
      subject: 'Question about tax reporting',
      description: 'How do I export my tax information?',
      status: 'resolved',
      priority: 'low',
      created: '2024-06-10',
      updated: '2024-06-18',
    },
  ]

  const faqItems = [
    {
      question: 'How do I start investing?',
      answer: 'To start investing, first complete the KYC verification process, fund your account, and then browse available securities to purchase.',
    },
    {
      question: 'What are the minimum investment amounts?',
      answer: 'The minimum investment amount is $100 per transaction. However, you can start with our fractional shares feature.',
    },
    {
      question: 'How long does KYC verification take?',
      answer: 'KYC verification typically takes 24-48 hours. Most users are verified within this timeframe.',
    },
    {
      question: 'What fees does PrimeAI charge?',
      answer: 'We charge a 0.1% commission on each trade and have no account maintenance fees.',
    },
    {
      question: 'How do I withdraw my funds?',
      answer: 'You can withdraw funds anytime through your wallet using NOWPayments crypto or your PrimeFx Card.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use bank-level encryption and comply with all financial regulations to ensure your data is secure.',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700'
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500'
      case 'medium':
        return 'border-l-4 border-l-yellow-500'
      case 'low':
        return 'border-l-4 border-l-green-500'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Center</h1>
          <p className="mt-1 text-muted-foreground">Get help with your account or submit a support ticket.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Open Tickets</p>
          <p className="mt-2 text-3xl font-bold text-red-500">1</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-blue-500">1</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg Response Time</p>
          <p className="mt-2 text-3xl font-bold text-foreground">2h</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button className="px-4 py-3 font-semibold text-primary border-b-2 border-b-primary">Support Tickets</button>
        <button className="px-4 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
      </div>

      {/* Support Tickets */}
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className={`rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(ticket.priority)}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{ticket.id}</p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{ticket.subject}</h3>
                  </div>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{ticket.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {ticket.created}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    Updated {ticket.updated}
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors flex-shrink-0">
                <MessageCircle className="h-4 w-4" />
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="hidden rounded-lg border border-border bg-card p-6 shadow-sm" id="faq">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <details key={idx} className="group border-b border-border pb-4 last:border-b-0">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground hover:text-primary transition-colors">
                {item.question}
                <span className="transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Contact Options */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Contact Support</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-4 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-primary mb-2" />
            <p className="font-semibold text-foreground">Live Chat</p>
            <p className="mt-2 text-sm text-muted-foreground">Available 24/7 for quick support</p>
            <button className="mt-3 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
              Start Chat
            </button>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-primary mb-2" />
            <p className="font-semibold text-foreground">Email Support</p>
            <p className="mt-2 text-sm text-muted-foreground">support@primeai.com</p>
            <button className="mt-3 rounded-lg border border-border px-4 py-2 font-semibold hover:bg-secondary transition-colors">
              Send Email
            </button>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <Clock className="mx-auto h-8 w-8 text-primary mb-2" />
            <p className="font-semibold text-foreground">Support Hours</p>
            <p className="mt-2 text-sm text-muted-foreground">Mon-Fri: 9 AM - 6 PM UTC</p>
            <button className="mt-3 rounded-lg border border-border px-4 py-2 font-semibold hover:bg-secondary transition-colors">
              Schedule Call
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
