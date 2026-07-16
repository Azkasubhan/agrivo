'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SoilMoistureData {
  date: string;
  moisture: number;
  target: number;
}

interface SoilMoistureChartProps {
  data: SoilMoistureData[];
}

export function SoilMoistureChart({ data }: SoilMoistureChartProps) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Soil Moisture Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="moisture"
            stroke="#1B7B4B"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Current Moisture"
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#4DAEE8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            name="Target"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
