'use client';

import { WeatherData } from '@/lib/mock-data';
import { Cloud, CloudRain, Sun, CloudDrizzle, Wind, Droplets } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherData[];
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  const today = weather[0];

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun size={32} className="text-yellow-500" />;
      case 'cloudy':
        return <Cloud size={32} className="text-gray-400" />;
      case 'rainy':
        return <CloudRain size={32} className="text-blue-500" />;
      case 'partly-cloudy':
        return <CloudDrizzle size={32} className="text-gray-500" />;
      default:
        return <Sun size={32} className="text-yellow-500" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-accent to-blue-400 rounded-lg shadow-sm p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Weather Forecast</h3>

      {/* Current Weather */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">Today</p>
            <p className="text-3xl font-bold">{today.temperature}°C</p>
          </div>
          <div>{getWeatherIcon(today.condition)}</div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-3 text-sm bg-white/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Droplets size={16} />
            <span>Humidity: {today.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={16} />
            <span>Wind: {today.windSpeed} km/h</span>
          </div>
          <div className="col-span-2">
            <p>Precipitation: {today.precipitation}mm</p>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div>
        <p className="text-sm font-semibold mb-3 opacity-90">7-Day Outlook</p>
        <div className="space-y-2">
          {weather.map((day, index) => (
            <div key={index} className="flex items-center justify-between text-sm bg-white/10 px-3 py-2 rounded">
              <div className="flex items-center gap-2">
                {getWeatherIcon(day.condition)}
                <span className="font-medium capitalize">{day.condition.replace('-', ' ')}</span>
              </div>
              <span>{day.temperature}°C</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
