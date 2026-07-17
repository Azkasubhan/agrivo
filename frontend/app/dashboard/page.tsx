'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { apiClient } from '@/lib/api-client';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [weather, setWeather] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [profileRes, fieldsRes] = await Promise.all([
          apiClient<{ data: any }>('/users/me'),
          apiClient<{ data: any }>('/fields'),
        ]);

        setProfile(profileRes.data);
        const rawFields = fieldsRes.data.items || fieldsRes.data;

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
        if (rawFields.length > 0) {
          setSelectedFieldId(rawFields[0].id);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadFieldSpecificData() {
      if (!selectedFieldId) return;

      // Load weather and recommendations independently — one failure won't block the other
      try {
        const weatherRes = await apiClient<{ data: any }>(`/fields/${selectedFieldId}/weather`);
        setWeather(weatherRes.data);
      } catch (err) {
        console.error('Failed to load weather data', err);
      }

      try {
        const recsRes = await apiClient<{ data: any }>(`/fields/${selectedFieldId}/recommendations`);
        setRecommendations(recsRes.data.items || recsRes.data || []);
      } catch (err) {
        console.error('Failed to load recommendations data', err);
      }
    }
    loadFieldSpecificData();
  }, [selectedFieldId]);

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
        selectedFieldId={selectedFieldId}
        onFieldSelect={setSelectedFieldId}
        weather={weather}
        recommendations={recommendations}
        profile={profile}
      />
    </MainLayout>
  );
}
