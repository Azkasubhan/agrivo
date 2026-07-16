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

interface NutrientData {
  date: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

interface NutrientChartProps {
  data: NutrientData[];
}

export function NutrientChart({ data }: NutrientChartProps) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Soil Nutrients</h3>
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
            dataKey="nitrogen"
            stroke="#1B7B4B"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Nitrogen (N)"
          />
          <Line
            type="monotone"
            dataKey="phosphorus"
            stroke="#D4A574"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Phosphorus (P)"
          />
          <Line
            type="monotone"
            dataKey="potassium"
            stroke="#4DAEE8"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Potassium (K)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
