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

export const mockFields: Field[] = [
  {
    id: 'field-1',
    name: 'North Rice Field',
    crop: 'Rice',
    area: 15.5,
    location: 'North Section',
    soilType: 'Loam',
    lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    moisture: 68,
    ph: 6.8,
    temperature: 18.5,
    nitrogen: 45,
    phosphorus: 18,
    potassium: 150,
    imageUrl: '/rice-field-editorial.png',
  },
  {
    id: 'field-2',
    name: 'South Rice Field',
    crop: 'Rice',
    area: 22.3,
    location: 'South Section',
    soilType: 'Clay Loam',
    lastWatered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    moisture: 72,
    ph: 7.1,
    temperature: 20.2,
    nitrogen: 52,
    phosphorus: 22,
    potassium: 160,
    imageUrl: '/rice-field-editorial.png',
  },
  {
    id: 'field-3',
    name: 'East Rice Field',
    crop: 'Rice',
    area: 18.7,
    location: 'East Section',
    soilType: 'Sandy Loam',
    lastWatered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    moisture: 55,
    ph: 6.5,
    temperature: 19.8,
    nitrogen: 38,
    phosphorus: 15,
    potassium: 140,
    imageUrl: '/rice-field-editorial.png',
  },
];

export const mockWeather: WeatherData[] = [
  {
    date: new Date(),
    temperature: 22,
    humidity: 65,
    precipitation: 0,
    windSpeed: 12,
    condition: 'sunny',
  },
  {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    temperature: 24,
    humidity: 60,
    precipitation: 0,
    windSpeed: 10,
    condition: 'sunny',
  },
  {
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    temperature: 19,
    humidity: 75,
    precipitation: 15,
    windSpeed: 18,
    condition: 'rainy',
  },
  {
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    temperature: 18,
    humidity: 78,
    precipitation: 25,
    windSpeed: 20,
    condition: 'rainy',
  },
  {
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    temperature: 21,
    humidity: 68,
    precipitation: 5,
    windSpeed: 14,
    condition: 'partly-cloudy',
  },
  {
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    temperature: 23,
    humidity: 62,
    precipitation: 0,
    windSpeed: 11,
    condition: 'sunny',
  },
  {
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    temperature: 25,
    humidity: 58,
    precipitation: 0,
    windSpeed: 9,
    condition: 'sunny',
  },
];

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    fieldId: 'field-1',
    title: 'Increase Irrigation',
    description: 'Soil moisture is at 68%. Recommended to increase watering to 75% for optimal rice growth.',
    urgency: 'medium',
    category: 'irrigation',
    metrics: ['Soil Moisture: 68%', 'Target: 75%'],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'rec-2',
    fieldId: 'field-2',
    title: 'Apply Nitrogen Fertilizer',
    description: 'Nitrogen levels are adequate but trending down. Apply 50kg/hectare in next 2 weeks.',
    urgency: 'low',
    category: 'fertilization',
    metrics: ['Current N: 52 ppm', 'Recommended: 60 ppm'],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: 'rec-3',
    fieldId: 'field-3',
    title: 'Critical: Irrigation Needed',
    description: 'Soil moisture in East Rice field is critically low at 55%. Irrigate immediately to prevent crop stress.',
    urgency: 'high',
    category: 'irrigation',
    metrics: ['Current: 55%', 'Critical Level: <60%'],
    createdAt: new Date(),
  },
];

export const mockYieldData: YieldData[] = [
  { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), yield: 7200, expected: 7500 },
  { date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), yield: 7350, expected: 7550 },
  { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), yield: 7400, expected: 7600 },
  { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), yield: 7550, expected: 7700 },
  { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), yield: 7680, expected: 7800 },
  { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), yield: 7750, expected: 7850 },
  { date: new Date(), yield: 7820, expected: 7900 },
];

export const mockWaterUsageData = [
  { week: 'Week 1', usage: 2400, target: 2200 },
  { week: 'Week 2', usage: 2210, target: 2200 },
  { week: 'Week 3', usage: 2290, target: 2200 },
  { week: 'Week 4', usage: 2000, target: 2200 },
  { week: 'Week 5', usage: 2181, target: 2200 },
  { week: 'Week 6', usage: 2500, target: 2200 },
  { week: 'Week 7', usage: 2100, target: 2200 },
];

export const mockSoilNutrients = [
  { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), nitrogen: 42, phosphorus: 16, potassium: 135 },
  { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), nitrogen: 44, phosphorus: 17, potassium: 142 },
  { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), nitrogen: 46, phosphorus: 18, potassium: 148 },
  { date: new Date(), nitrogen: 48, phosphorus: 19, potassium: 152 },
];

export function getFieldById(id: string): Field | undefined {
  return mockFields.find((f) => f.id === id);
}

export function getRecommendationsByField(fieldId: string): Recommendation[] {
  return mockRecommendations.filter((r) => r.fieldId === fieldId);
}
