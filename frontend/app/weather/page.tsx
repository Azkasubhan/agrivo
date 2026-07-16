import { MainLayout } from '@/components/layout/main-layout';
import { WeatherContent } from '@/components/weather/weather-content';
import { mockWeather } from '@/lib/mock-data';

export default function WeatherPage() {
  return (
    <MainLayout>
      <WeatherContent weather={mockWeather} />
    </MainLayout>
  );
}

