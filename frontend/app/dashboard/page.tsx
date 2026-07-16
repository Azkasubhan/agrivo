'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { apiClient } from '@/lib/api-client';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch profile and fields
        const [profileRes, fieldsRes] = await Promise.all([
          apiClient<{ data: any }>('/users/me'),
          apiClient<{ data: any }>('/fields'),
        ]);

        setProfile(profileRes.data);
        const rawFields = fieldsRes.data.items || fieldsRes.data;

        // Map backend fields to the frontend structure
        const mappedFields = rawFields.map((f: any) => ({
          id: f.id,
          name: f.name,
          area: parseFloat(f.field_area_ha || 0),
          location: `${f.latitude}, ${f.longitude}`,
          crop: 'Rice',
          moisture: 72, // Default/fallback soil moisture
          ph: parseFloat(f.soil_type === 'CLAY' ? '6.5' : '6.8'),
          temperature: 28,
          nitrogen: 'Adequate',
        }));

        setFields(mappedFields);

        // 2. Fetch weather and recommendations if field exists
        if (rawFields.length > 0) {
          const firstFieldId = rawFields[0].id;
          const [weatherRes, recsRes] = await Promise.all([
            apiClient<{ data: any }>(`/fields/${firstFieldId}/weather`),
            apiClient<{ data: any }>(`/fields/${firstFieldId}/recommendations`),
          ]);

          setWeather(weatherRes.data);
          
          const recsData = recsRes.data.items || recsRes.data;
          setRecommendations(recsData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#14532D', fontWeight: 600 }}>
          Loading dashboard...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DashboardContent
        fields={fields}
        weather={weather}
        recommendations={recommendations}
        profile={profile}
      />
    </MainLayout>
  );
}
