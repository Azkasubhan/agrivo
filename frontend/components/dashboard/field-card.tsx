'use client';

import { Field } from '@/lib/mock-data';
import { Droplets, Thermometer, MapPin } from 'lucide-react';
import Link from 'next/link';

interface FieldCardProps {
  field: Field;
}

export function FieldCard({ field }: FieldCardProps) {
  const getMoistureColor = (moisture: number) => {
    if (moisture < 50) return 'text-red-600 bg-red-100';
    if (moisture < 65) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <Link href={`/field-analysis?field=${field.id}`}>
      <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow p-5 h-full cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {field.name}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {field.location}
            </p>
          </div>
          <div className="px-3 py-1 bg-primary/10 rounded-full">
            <span className="text-xs font-semibold text-primary">{field.crop}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3 mb-4">
          {/* Moisture */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets size={16} className={getMoistureColor(field.moisture)} />
              <span className="text-sm text-muted-foreground">Soil Moisture</span>
            </div>
            <span className={`text-sm font-semibold ${getMoistureColor(field.moisture)}`}>
              {field.moisture}%
            </span>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-accent" />
              <span className="text-sm text-muted-foreground">Temperature</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{field.temperature}°C</span>
          </div>

          {/* Soil Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Soil Type</span>
            <span className="text-sm font-semibold text-foreground">{field.soilType}</span>
          </div>

          {/* Area */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Area</span>
            <span className="text-sm font-semibold text-foreground">{field.area} ha</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-3">
          <div
            className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
            style={{ width: `${field.moisture}%` }}
          />
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          Last watered {formatTime(field.lastWatered)}
        </p>
      </div>
    </Link>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  return 'recently';
}
