'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface YieldData {
  date: string;
  yield: number;
  expected: number;
}

interface YieldChartProps {
  data: YieldData[];
}

export function YieldChart({ data }: YieldChartProps) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Yield Projection</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="date" stroke="#6B7280" />
          <YAxis stroke="#6B7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="yield"
            stroke="#10B981"
            fill="#D1FAE5"
            strokeWidth={2}
            name="Actual Yield"
          />
          <Area
            type="monotone"
            dataKey="expected"
            stroke="#4DAEE8"
            fill="#DBEAFE"
            strokeWidth={2}
            name="Expected Yield"
            opacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
