import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fonction utilitaire pour générer des couleurs aléatoires
export function getRandomColor(): string {
  const colors = [
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#8B5A2B', // Brown
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#6366F1', // Indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Fonction utilitaire pour formater les dates
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Fonction utilitaire pour calculer l'âge
export function calculateAge(birthDate: Date | string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Fonction utilitaire pour valider les emails
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Fonction utilitaire pour générer des IDs uniques
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Fonction utilitaire pour débouncer les fonctions
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Fonction utilitaire pour formater les nombres
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

// Fonction utilitaire pour obtenir la météo actuelle d'une ville (OpenWeatherMap)
export async function getWeather(city: string = 'Paris') {
  const API_KEY = '942c1a83a2948447b2ba4e057708b506';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur lors de la récupération de la météo');
  const data = await res.json();
  return {
    name: data.name,
    temp: Math.round(data.main.temp),
    temp_min: Math.round(data.main.temp_min),
    temp_max: Math.round(data.main.temp_max),
    description: data.weather[0].description
  };
}

// Prévisions détaillées de la journée (matin, après-midi, soir, min, max, description dominante)
export async function getDailyForecast(city = 'Paris') {
  const API_KEY = '942c1a83a2948447b2ba4e057708b506';
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur lors de la récupération des prévisions');
  const data = await res.json();
  const now = new Date();
  const today = now.getDate();
  // Filtrer les prévisions du jour
  const todayForecasts = data.list.filter((f: any) => {
    const date = new Date(f.dt_txt);
    return date.getDate() === today;
  });
  if (todayForecasts.length === 0) throw new Error('Pas de prévisions pour aujourd\'hui');
  // Températures min/max
  const temp_min = Math.min(...todayForecasts.map((f: any) => f.main.temp_min));
  const temp_max = Math.max(...todayForecasts.map((f: any) => f.main.temp_max));
  // Matin = 6h-11h, Après-midi = 12h-17h, Soir = 18h-23h
  const getPeriodTemp = (start: number, end: number) => {
    const period = todayForecasts.filter((f: any) => {
      const hour = new Date(f.dt_txt).getHours();
      return hour >= start && hour <= end;
    });
    if (period.length === 0) return null;
    // Moyenne
    return Math.round(period.reduce((sum: number, f: any) => sum + f.main.temp, 0) / period.length);
  };
  const morning = getPeriodTemp(6, 11);
  const afternoon = getPeriodTemp(12, 17);
  const evening = getPeriodTemp(18, 23);
  // Description dominante
  const descs = todayForecasts.map((f: any) => f.weather[0].description);
  const descDominante = descs.sort((a: string, b: string) => descs.filter((v: string) => v === a).length - descs.filter((v: string) => v === b).length).pop();
  return {
    temp_min: Math.round(temp_min),
    temp_max: Math.round(temp_max),
    morning,
    afternoon,
    evening,
    description: descDominante
  };
}
