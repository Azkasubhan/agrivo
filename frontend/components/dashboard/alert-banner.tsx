'use client';

import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface AlertBannerProps {
  count: number;
}

export function AlertBanner({ count }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertCircle className="text-red-600" size={20} />
        <div>
          <p className="font-semibold text-red-900">Critical Alerts</p>
          <p className="text-sm text-red-700">
            You have {count} critical recommendation{count !== 1 ? 's' : ''} that need attention.
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-red-600 hover:text-red-800 transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  );
}
