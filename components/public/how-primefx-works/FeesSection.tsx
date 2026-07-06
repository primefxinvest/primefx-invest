import { FEE_ROWS, NO_FEE_ITEMS } from '@/lib/how-primefx-works/content'
import { CheckList, InfoCard, SectionHeader, SectionShell } from './shared'

export function HowPrimefxFeesSection() {
  return (
    <SectionShell id="fees" variant="muted">
      <SectionHeader
        eyebrow="Pricing"
        title="Fees"
        subtitle="PrimeFx uses transparent pricing. No hidden fees, no management charges, no trading commissions."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <tbody>
              {FEE_ROWS.map((row, index) => (
                <tr
                  key={row.label}
                  className={index < FEE_ROWS.length - 1 ? 'border-b border-gray-100' : ''}
                >
                  <td className="px-5 py-4 font-medium text-gray-700">{row.label}</td>
                  <td className="px-5 py-4 text-right font-bold text-gray-900">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
            <p className="text-xs text-gray-500">
              PrimeFx uses transparent pricing — what you see is what you pay.
            </p>
          </div>
        </InfoCard>

        <InfoCard>
          <h3 className="text-lg font-bold text-gray-900">What you won&apos;t pay</h3>
          <p className="mt-2 text-sm text-gray-600">
            We believe in institutional-grade transparency. These common industry fees do not apply
            on PrimeFx Invest.
          </p>
          <div className="mt-5">
            <CheckList items={NO_FEE_ITEMS} />
          </div>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
