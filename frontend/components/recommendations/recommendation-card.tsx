'use client';

import { Recommendation } from '@/lib/mock-data';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: AlertCircle,
          color: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: Info,
          color: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircle2,
          color: 'text-green-600',
          badge: 'bg-green-100 text-green-800',
        };
    }
  };

  const styles = getUrgencyStyles(recommendation.urgency);
  const Icon = styles.icon;

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-6`}>
      <div className="flex items-start gap-4">
        <Icon className={styles.color} size={24} />

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-foreground text-lg">{recommendation.title}</h4>
            <span className={`${styles.badge} px-3 py-1 rounded-full text-xs font-semibold capitalize`}>
              {recommendation.urgency}
            </span>
          </div>

          <p className="text-foreground/80 mb-4">{recommendation.description}</p>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recommendation.metrics.map((metric, index) => (
              <div key={index} className="bg-white/60 rounded px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">{metric}</p>
              </div>
            ))}
          </div>

          {/* Category Badge */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Category: <span className="font-semibold capitalize">{recommendation.category}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Generated {formatDate(recommendation.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-current border-opacity-10">
        <button className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
          Take Action →
        </button>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
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
  return 'just now';
}
