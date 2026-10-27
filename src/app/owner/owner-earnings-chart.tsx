'use client'

import dynamic from 'next/dynamic'

type Datum = { label: string; earnings: number; bookings: number }

const LoadingChart = () => (
  <div className="h-64 rounded-lg border border-dashed bg-muted/40" />
)

const OwnerEarningsChartClient = dynamic(
  async () => {
    const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } =
      await import('recharts')

    return function OwnerEarningsChartInner({ data }: { data: Datum[] }) {
      return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => [`ETB ${v.toLocaleString()}`, 'Earnings']}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Bar dataKey="earnings" name="Earnings" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    }
  },
  { ssr: false, loading: () => <LoadingChart /> },
)

export function OwnerEarningsChart({ data }: { data: Datum[] }) {
  return <OwnerEarningsChartClient data={data} />
}
