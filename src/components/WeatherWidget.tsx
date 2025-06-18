import { useEffect, useState } from 'react';

interface WeatherData {
  name: string;
  main: { temp: number };
  weather: { icon: string; description: string }[];
}

interface WeatherWidgetProps {
  city?: string;
}

const API_KEY = '942c1a83a2948447b2ba4e057708b506';

export default function WeatherWidget({ city = 'Paris' }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Erreur lors de la récupération de la météo');
        return res.json();
      })
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Impossible de charger la météo');
        setLoading(false);
      });
  }, [city]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 animate-pulse">
        <span className="w-6 h-6 bg-gray-200 rounded-full" />
        <span>Météo...</span>
      </div>
    );
  }
  if (error || !weather) {
    return <div className="text-red-500 text-sm">Météo indisponible</div>;
  }
  return (
    <div className="flex items-center gap-2 bg-white/70 rounded-full px-3 py-1 shadow text-sm">
      <img
        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
        alt={weather.weather[0].description}
        className="w-7 h-7"
      />
      <span className="font-semibold">{Math.round(weather.main.temp)}°C</span>
      <span className="text-gray-700">{weather.name}</span>
      <span className="capitalize text-gray-500">{weather.weather[0].description}</span>
    </div>
  );
} 