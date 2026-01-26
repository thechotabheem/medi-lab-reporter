import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

const weatherCodeToDescription: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear', icon: '☀️' },
  1: { description: 'Mostly Clear', icon: '🌤️' },
  2: { description: 'Partly Cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Rime Fog', icon: '🌫️' },
  51: { description: 'Light Drizzle', icon: '🌧️' },
  53: { description: 'Drizzle', icon: '🌧️' },
  55: { description: 'Heavy Drizzle', icon: '🌧️' },
  61: { description: 'Light Rain', icon: '🌧️' },
  63: { description: 'Rain', icon: '🌧️' },
  65: { description: 'Heavy Rain', icon: '🌧️' },
  71: { description: 'Light Snow', icon: '🌨️' },
  73: { description: 'Snow', icon: '🌨️' },
  75: { description: 'Heavy Snow', icon: '🌨️' },
  77: { description: 'Snow Grains', icon: '🌨️' },
  80: { description: 'Light Showers', icon: '🌦️' },
  81: { description: 'Showers', icon: '🌦️' },
  82: { description: 'Heavy Showers', icon: '🌦️' },
  85: { description: 'Light Snow Showers', icon: '🌨️' },
  86: { description: 'Snow Showers', icon: '🌨️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with Hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with Heavy Hail', icon: '⛈️' },
};

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
        );
        
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        const weatherCode = data.current.weather_code;
        const weatherInfo = weatherCodeToDescription[weatherCode] || { description: 'Unknown', icon: '🌡️' };
        
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          description: weatherInfo.description,
          icon: weatherInfo.icon,
        });
        setLoading(false);
      } catch (err) {
        setError('Unable to fetch weather');
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback to a default location if geolocation is denied
          setError('Location access denied');
          setLoading(false);
        },
        { timeout: 10000 }
      );
    } else {
      setError('Geolocation not supported');
      setLoading(false);
    }
  }, []);

  return { weather, loading, error };
}
