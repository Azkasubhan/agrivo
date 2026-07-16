'use client';

import { Field } from '@/lib/mock-data';
import { Droplets, Thermometer, FlaskConical, Map } from 'lucide-react';

interface FieldMetricsProps {
  field: Field;
}

export function FieldMetrics({ field }: FieldMetricsProps) {
  const metrics = [
    {
      label: 'Soil Moisture',
      value: `${field.moisture}%`,
      icon: Droplets,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Temperature',
      value: `${field.temperature}°C`,
      icon: Thermometer,
      color: 'from-red-500 to-orange-600',
    },
    {
      label: 'Soil pH',
      value: field.ph.toFixed(1),
      icon: FlaskConical,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Area',
      value: `${field.area} ha`,
      icon: Map,
      color: 'from-green-500 to-emerald-600',
    },
  ];

  const nutrients = [
    { label: 'Nitrogen (N)', value: `${field.nitrogen} ppm` },
    { label: 'Phosphorus (P)', value: `${field.phosphorus} ppm` },
    { label: 'Potassium (K)', value: `${field.potassium} ppm` },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-sm p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">{field.name}</h3>
        <p className="text-sm opacity-90">
          {field.crop} on {field.soilType} • {field.location}
        </p>
      </div>

      {/* Key Metrics */}
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

      {/* Nutrients Details */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Soil Nutrients</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nutrients.map((nutrient) => (
            <div key={nutrient.label} className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground font-medium">{nutrient.label}</p>
              <p className="text-2xl font-bold text-foreground mt-2">{nutrient.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
