'use client';

import { BarChart3, Leaf, Droplets, AlertCircle } from 'lucide-react';

interface MetricsGridProps {
  totalArea: number;
  fieldCount: number;
  avgMoisture: number;
  criticalAlerts: number;
}

export function MetricsGrid({
  totalArea,
  fieldCount,
  avgMoisture,
  criticalAlerts,
}: MetricsGridProps) {
  const metrics = [
    {
      label: 'Total Area',
      value: `${totalArea.toFixed(1)} ha`,
      icon: Leaf,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Active Fields',
      value: fieldCount,
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Avg Moisture',
      value: `${avgMoisture}%`,
      icon: Droplets,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      label: 'Critical Alerts',
      value: criticalAlerts,
      icon: AlertCircle,
      color: 'from-red-500 to-pink-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={`bg-gradient-to-br ${metric.color} rounded-lg shadow-sm p-6 text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 font-medium">{metric.label}</p>
                <p className="text-3xl font-bold mt-2">{metric.value}</p>
              </div>
              <Icon size={32} className="opacity-60" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
