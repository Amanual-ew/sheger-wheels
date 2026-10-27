'use client'

import dynamic from 'next/dynamic'
import { statusLabel } from '@/lib/format'

type Datum = { status: string; count: number }

const COLORS: Record<string, string> = {
  requested: 'var(--chart-2)',
  confirmed: 'var(--chart-1)',
  in_progress: 'var(--chart-5)',
  completed: 'var(--chart-3)',
  reviewed: 'var(--chart-3)',
  declined: 'var(--chart-4)',
  cancelled: 'var(--chart-4)',
  disputed: 'var(--chart-4)',
  resolved: 'var(--chart-1)',
}

const LoadingChart = () => (
  <div className="h-64 rounded-lg border border-dashed bg-muted/40" />
)

const AdminChartsClient = dynamic(
  async () => {
    const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } =
      await import('recharts')

    return function AdminChartsInner({ data }: { data: Datum[] }) {
      return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} tickFormatter={(v) => statusLabel(v)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => [v, 'Bookings']}
                labelFormatter={(l: string) => statusLabel(l)}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Bar dataKey="count" name="Bookings" radius={[6, 6, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.status} fill={COLORS[d.status] ?? 'var(--chart-1)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    }
  },
  { ssr: false, loading: () => <LoadingChart /> },
)

export function AdminCharts({ data }: { data: Datum[] }) {
  return <AdminChartsClient data={data} />
}
