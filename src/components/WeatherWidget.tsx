import { useEffect, useState } from 'react';

interface WeatherData {
  name: string;
  main: { temp: number; feels_like: number; humidity: number };
  weather: { icon: string; description: string }[];
  wind: { speed: number };
}

interface ForecastData {
  city: { name: string };
  list: Array<{
    dt_txt: string;
    main: { temp: number; feels_like: number; humidity: number };
    weather: { icon: string; description: string }[];
    wind: { speed: number };
  }>;
}

interface WeatherWidgetProps {
  city?: string;
  mode?: 'full';
}

const API_KEY = '942c1a83a2948447b2ba4e057708b506';

export default function WeatherWidget({ city = 'Paris', mode }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (mode === 'full') {
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`
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
    } else {
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
    }
  }, [city, mode]);

  const getWeatherGradient = (icon: string) => {
    const iconCode = icon.substring(0, 2);
    switch (iconCode) {
      case '01': return 'from-yellow-400 via-orange-400 to-red-400'; // clear sky
      case '02': case '03': case '04': return 'from-gray-300 via-gray-400 to-gray-500'; // clouds
      case '09': case '10': return 'from-blue-400 via-blue-500 to-blue-600'; // rain
      case '11': return 'from-purple-400 via-purple-500 to-indigo-600'; // thunderstorm
      case '13': return 'from-blue-100 via-blue-200 to-blue-300'; // snow
      case '50': return 'from-gray-200 via-gray-300 to-gray-400'; // mist
      default: return 'from-blue-400 via-cyan-400 to-teal-400';
    }
  };

  const getTimeIcon = (isToday: boolean) => {
    return isToday ? '☀️' : '🌅';
  };

  if (loading) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 ${mode === 'full' ? 'rounded-2xl p-6' : 'rounded-full px-4 py-2'} shadow-lg`}>
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full"></div>
          <span className="text-slate-600 font-medium">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-red-100 ${mode === 'full' ? 'rounded-2xl p-6' : 'rounded-full px-4 py-2'} shadow-lg border border-red-200`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">⚠</span>
          </div>
          <div>
            <p className="text-red-700 font-medium text-sm">Météo indisponible</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'full' && weather.list) {
    // Mode complet avec prévisions
    const now = new Date();
    const todayForecast = weather.list.find((f: any) => {
      const date = new Date(f.dt_txt);
      return date.getDate() === now.getDate();
    }) || weather.list[0];
    
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowForecast = weather.list.find((f: any) => {
      const date = new Date(f.dt_txt);
      return date.getDate() === tomorrow.getDate() && (date.getHours() === 12 || date.getHours() === 15);
    }) || weather.list.find((f: any) => {
      const date = new Date(f.dt_txt);
      return date.getDate() === tomorrow.getDate();
    });

    const todayGradient = getWeatherGradient(todayForecast.weather[0].icon);

    return (
      <div className={`relative overflow-hidden bg-gradient-to-br ${todayGradient} rounded-2xl p-6 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-10 h-10 bg-white rounded-full animate-pulse delay-1000"></div>
        </div>
        
        {/* Main content */}
        <div className="relative z-10 space-y-4">
          {/* Today's weather */}
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-xl font-bold">{weather.city?.name || city}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{getTimeIcon(true)}</span>
                <p className="text-white/80 text-sm">Aujourd'hui</p>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <img
                src={`https://openweathermap.org/img/wn/${todayForecast.weather[0].icon}@2x.png`}
                alt={todayForecast.weather[0].description}
                className="w-12 h-12 drop-shadow-lg animate-bounce"
              />
            </div>
          </div>

          {/* Temperature and description */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-white">
              {Math.round(todayForecast.main.temp)}°C
            </span>
            <span className="text-white/80 capitalize text-lg">
              {todayForecast.weather[0].description}
            </span>
          </div>

          {/* Tomorrow's preview */}
          {tomorrowForecast && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getTimeIcon(false)}</span>
                  <div>
                    <p className="text-white font-medium">Demain</p>
                    <p className="text-white/70 text-sm capitalize">
                      {tomorrowForecast.weather[0].description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={`https://openweathermap.org/img/wn/${tomorrowForecast.weather[0].icon}@2x.png`}
                    alt={tomorrowForecast.weather[0].description}
                    className="w-10 h-10 drop-shadow-lg"
                  />
                  <span className="text-2xl font-bold text-white">
                    {Math.round(tomorrowForecast.main.temp)}°C
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Additional details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-white text-lg">💧</span>
                <div>
                  <p className="text-white/70 text-xs">Humidité</p>
                  <p className="text-white font-semibold">{todayForecast.main.humidity}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-white text-lg">💨</span>
                <div>
                  <p className="text-white/70 text-xs">Vent</p>
                  <p className="text-white font-semibold">{Math.round(todayForecast.wind.speed * 3.6)} km/h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      </div>
    );
  }

  // Mode simple (météo actuelle)
  const gradient = getWeatherGradient(weather.weather[0].icon);
  
  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${gradient} rounded-full px-4 py-2 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
      {/* Background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1 right-2 w-6 h-6 bg-white rounded-full animate-pulse"></div>
        <div className="absolute bottom-1 left-2 w-4 h-4 bg-white rounded-full animate-pulse delay-500"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <img
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt={weather.weather[0].description}
            className="w-8 h-8 drop-shadow-lg"
          />
        </div>
        
        <div className="flex items-center gap-2 text-white">
          <span className="text-lg font-bold">{Math.round(weather.main.temp)}°C</span>
          <div className="w-px h-4 bg-white/40"></div>
          <span className="font-medium">{weather.name}</span>
          <div className="w-px h-4 bg-white/40"></div>
          <span className="capitalize text-sm text-white/90">{weather.weather[0].description}</span>
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
    </div>
  );
}