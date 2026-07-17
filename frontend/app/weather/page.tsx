'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { WeatherContent } from '@/components/weather/weather-content';
import { apiClient } from '@/lib/api-client';
import { WeatherData } from '@/lib/mock-data';
import { CustomSelect } from '@/components/ui/custom-select';

export default function WeatherPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [isEstimated, setIsEstimated] = useState(false);
  const [loadingFields, setLoadingFields] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load fields owned by user
  useEffect(() => {
    async function loadFields() {
      try {
        const res = await apiClient<{ data: { items: any[] } | any[] }>('/fields');
        const items = (res.data as any).items || res.data;
        setFields(items);
        if (items.length > 0) {
          setSelectedFieldId(items[0].id);
        }
      } catch (err) {
        console.error('Failed to load fields', err);
        setError('Failed to load field data.');
      } finally {
        setLoadingFields(false);
      }
    }
    loadFields();
  }, []);

  // Fetch weather when selected field changes
  useEffect(() => {
    if (!selectedFieldId) return;

    async function fetchWeather() {
      setLoadingWeather(true);
      setError(null);
      try {
        const res = await apiClient<{ data: any }>(`/fields/${selectedFieldId}/weather`);
        const data = res.data;
        setIsEstimated(data.is_estimated);

        // Use forecast array directly — index 0 is already today from Open-Meteo
        const mapped: WeatherData[] = data.forecast.map((f: any) => ({
          date: new Date(f.date),
          temperature: Math.round(f.temperature_mean ?? data.temperature_c),
          humidity: Math.round(f.relative_humidity_mean ?? data.humidity_percent),
          precipitation: parseFloat(f.precipitation_sum ?? data.precipitation_mm),
          windSpeed: parseFloat(f.wind_speed_max ?? data.wind_speed_kmh),
          condition: f.weather_condition ?? data.weather_condition,
        }));

        setWeatherData(mapped);
      } catch (err) {
        console.error('Failed to fetch weather', err);
        setError('Failed to retrieve weather data from Open-Meteo.');
      } finally {
        setLoadingWeather(false);
      }
    }

    fetchWeather();
  }, [selectedFieldId]);

  if (loadingFields) {
    return (
      <MainLayout>
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#14532D', fontWeight: 600 }}>
          Loading fields...
        </div>
      </MainLayout>
    );
  }

  if (fields.length === 0) {
    return (
      <MainLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#787878' }}>
          <h3>No fields registered yet</h3>
          <p>Please create a new field in the Field Analysis menu first.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#a09589' }}>
          Select Field:
        </span>
        <div style={{ width: '260px' }}>
          <CustomSelect
            value={selectedFieldId}
            onChange={setSelectedFieldId}
            options={fields.map((f) => ({
              value: f.id,
              label: `${f.name} (${f.field_area_ha} ha)`,
            }))}
          />
        </div>
      </div>

      {loadingWeather ? (
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#14532D', fontWeight: 600 }}>
          Fetching Open-Meteo weather data...
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', background: '#fdf2f0', color: '#C0392B', borderRadius: '16px', border: '1px solid #e8b4b0' }}>
          {error}
        </div>
      ) : weatherData.length > 0 ? (
        <>
          {isEstimated && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', color: '#b45309', fontSize: '0.85rem', fontWeight: 500 }}>
              ⚠️ Using regional fallback data because the Open-Meteo weather service connection is interrupted.
            </div>
          )}
          <WeatherContent weather={weatherData} />
        </>
      ) : null}
    </MainLayout>
  );
}
