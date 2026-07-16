'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { mockWeather, mockRecommendations } from '@/lib/mock-data';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { apiClient } from '@/lib/api-client';
import { Field } from '@/lib/mock-data'; // reuse the interface for now

export default function Dashboard() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFields() {
      try {
        const res = await apiClient<{ data: { items: any[] } | any[] }>('/fields');
        // Backend returns paginated response (data.items) or list
        const rawFields = (res.data as any).items || res.data;
        
        // Map backend fields to the frontend structure temporarily
        const mappedFields = rawFields.map((f: any) => ({
          id: f.id,
          name: f.name,
          area: f.area_ha || 0,
          location: f.location_name || 'Your Farm',
          crop: 'Rice',
          moisture: f.latest_moisture || Math.floor(Math.random() * 30 + 50), // Fallback if backend lacks sensor data
          ph: f.latest_ph || 6.5,
          temperature: f.latest_temperature || 28,
          nitrogen: f.latest_nitrogen || 'Adequate',
        }));
        
        setFields(mappedFields);
      } catch (err) {
        console.error('Failed to load fields', err);
      } finally {
        setLoading(false);
      }
    }
    loadFields();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#14532D', fontWeight: 600 }}>Loading dashboard...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DashboardContent
        fields={fields}
        weather={mockWeather}
        recommendations={mockRecommendations}
      />
    </MainLayout>
  );
}
