export interface Field {
  id: string;
  name: string;
  crop: string;
  area: number; // hectares
  location: string;
  soilType: string;
  lastWatered: Date;
  moisture: number; // percentage
  ph: number;
  temperature: number; // celsius
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  imageUrl: string;
}

export interface WeatherData {
  date: Date;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'partly-cloudy';
}

export interface Recommendation {
  id: string;
  fieldId: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  category: 'irrigation' | 'fertilization' | 'pest-control' | 'harvest';
  metrics: string[];
  createdAt: Date;
}

export interface YieldData {
  date: Date;
  yield: number; // kg/hectare
  expected: number;
}
