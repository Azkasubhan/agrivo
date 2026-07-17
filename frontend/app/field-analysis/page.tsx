'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { FieldAnalysisContent } from '@/components/field-analysis/field-analysis-content';
import { apiClient } from '@/lib/api-client';
import { Field } from '@/lib/mock-data';

export default function FieldAnalysisPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFields() {
    try {
      const res = await apiClient<{ data: { items: any[] } | any[] }>('/fields');
      const rawFields = (res.data as any).items || res.data;
      
      const mappedFields = rawFields.map((f: any) => ({
        id: f.id,
        name: f.name,
        area: parseFloat(f.field_area_ha || 0),
        location: f.latitude && f.longitude ? `${parseFloat(f.latitude).toFixed(4)}, ${parseFloat(f.longitude).toFixed(4)}` : 'Klaten, Central Java',
        crop: 'Rice',
        moisture: 65, // stable baseline
        ph: 6.5,
        temperature: 28.0,
        nitrogen: 45,
        phosphorus: 18,
        potassium: 150,
        soilType: f.soil_type || 'CLAY',
        lastWatered: new Date(),
      }));
      
      setFields(mappedFields);
    } catch (err) {
      console.error('Failed to load fields', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFields();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#14532D', fontWeight: 600 }}>
          Loading field analysis...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <FieldAnalysisContent fields={fields} onFieldAdded={loadFields} />
    </MainLayout>
  );
}
