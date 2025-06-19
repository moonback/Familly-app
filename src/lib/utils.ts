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
  const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_OPENWEATHER_KEY');
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=fr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur lors de la récupération de la météo');
  const data = await res.json();
  return {
    name: data.name,
    temp: Math.round(data.main.temp),
    description: data.weather[0].description
  };
}
