import { Link } from '@/i18n/navigation'
import { Sparkles } from 'lucide-react'

interface AIAnalysisProps {
  analysis: {
    riskLevel: string
    diversification: string
    longTermPotential: string
    confidenceScore: number
  }
}

export default function PrimeAIAnalysisCard({ analysis }: AIAnalysisProps) {
  const metrics = [
    { label: 'Risk Level', value: analysis.riskLevel },
    { label: 'Diversification', value: analysis.diversification },
    { label: 'Long-term Potential', value: analysis.longTermPotential },
  ]

  return (
    <div className="h-full rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">PrimeAI Portfolio Analysis</h2>
          <p className="text-[11px] text-violet-600">Powered by AI · Updated today</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-violet-100 bg-white/70 px-3 py-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg">
          <Sparkles className="h-5 w-5 text-violet-600" />
        </div>
        <p className="text-[12px] leading-relaxed text-slate-600">
          Your portfolio shows strong diversification with moderate risk exposure. Consider
          increasing allocation to growth assets.
        </p>
      </div>

      <div className="mb-4 space-y-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">{m.label}</span>
            <span className="font-semibold text-slate-800">{m.value}</span>
          </div>
        ))}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Confidence Score</span>
            <span className="font-semibold text-violet-600">{analysis.confidenceScore}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{ width: `${analysis.confidenceScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Link
          href="/primeai"
          className="block w-full rounded-lg bg-[#0052ff] py-2.5 text-center text-[13px] font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Analyze Portfolio
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/reports"
            className="rounded-lg border border-slate-200 bg-white py-2 text-center text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Generate Report
          </Link>
          <Link
            href="/primeai"
            className="rounded-lg border border-slate-200 bg-white py-2 text-center text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Talk to PrimeAI
          </Link>
        </div>
      </div>
    </div>
  )
}
