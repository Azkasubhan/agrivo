'use client';

import { Field, Recommendation } from '@/lib/mock-data';
import { useState } from 'react';
import { Zap, Loader } from 'lucide-react';

interface RecommendationGeneratorProps {
  field?: Field;
  onGenerating: (isGenerating: boolean) => void;
  onNewRecommendation: (rec: Recommendation) => void;
}

export function RecommendationGenerator({
  field,
  onGenerating,
  onNewRecommendation,
}: RecommendationGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRecommendation = async () => {
    if (!field) return;

    setLoading(true);
    setError(null);
    onGenerating(true);

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldId: field.id,
          fieldName: field.name,
          crop: field.crop,
          moisture: field.moisture,
          temperature: field.temperature,
          ph: field.ph,
          nitrogen: field.nitrogen,
          phosphorus: field.phosphorus,
          potassium: field.potassium,
          soilType: field.soilType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendation');
      }

      const data = await response.json();
      onNewRecommendation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error generating recommendation:', err);
    } finally {
      setLoading(false);
      onGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-sm p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap size={20} />
            AI Recommendation Engine
          </h3>
          <p className="text-sm opacity-90 mt-1">
            Generate AI-powered recommendations for {field?.name || 'your field'}
          </p>
        </div>
        <button
          onClick={handleGenerateRecommendation}
          disabled={loading || !field}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            loading || !field
              ? 'bg-white/20 text-white/60 cursor-not-allowed'
              : 'bg-white text-primary hover:shadow-lg active:scale-95'
          }`}
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap size={18} />
              Generate Now
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100/20 border border-red-300/40 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
