import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"


interface StatsChartProps {
  data: any[]
  currency?: boolean
  mode?: 'agent' | 'admin'
}

export default function StatsChart({ data, currency = false, mode = 'agent' }: StatsChartProps) {
  // Fallback if no data
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
        Belum ada data statistik.
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {/* Agent Colors */}
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>

            {/* Admin Colors */}
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => currency ? `Rp ${value.toLocaleString()}` : `${value}`}
            width={currency ? 80 : 30}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: any) => currency ? `Rp ${Number(value).toLocaleString()}` : `${value}`}
          />

          {/* Conditional Rendering based on Mode */}
          {mode === 'agent' && (
            <>
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
              <Area type="monotone" dataKey="sales" name="Sales" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
            </>
          )}

          {mode === 'admin' && (
            <>
              <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="withdrawal" name="Withdrawal" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorWithdrawal)" />
              <Area type="monotone" dataKey="net" name="Net Profit" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
            </>
          )}

        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
