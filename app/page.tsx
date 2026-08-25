'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  precipitation: number;
  rainProbability: number;
  windSpeed: number;
  isRaining: boolean;
  alertLevel: 'low' | 'medium' | 'high';
}

interface Location {
  lat: number;
  lon: number;
  name: string;
}

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error('Errore nel recupero dati meteo');
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError('Impossibile recuperare i dati meteo. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata dal browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: 'Posizione attuale',
        };
        setLocation(loc);
        getWeather(loc.lat, loc.lon);
      },
      () => {
        setError('Permesso di geolocalizzazione negato');
      }
    );
  };

  useEffect(() => {
    handleGeolocate();
  }, []);

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 border-red-400 bg-red-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      default: return 'text-green-400 border-green-400 bg-green-400/10';
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Outing Shield
          </h1>
          <p className="text-gray-400 text-sm">AI Nowcasting & Outing Alerts</p>
        </header>

        {/* Location Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGeolocate}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium 
                       hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-50 
                       disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
          >
            {loading ? 'Caricamento...' : location ? 'Aggiorna Posizione' : 'Trova la mia posizione'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 border border-red-400/50 bg-red-400/10 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Weather Data */}
        {weather && !loading && (
          <div className="space-y-6">
            {/* Main Alert */}
            <div className={`p-6 border-2 rounded-xl ${getAlertColor(weather.alertLevel)}`}>
              <div className="text-center space-y-2">
                <p className="text-sm uppercase tracking-wider opacity-80">Stato Meteo</p>
                <p className="text-3xl font-bold">
                  {weather.alertLevel === 'high' ? '⚠️ ATTENZIONE' : 
                   weather.alertLevel === 'medium' ? '⚡ PRECAUZIONE' : '✅ SICURO'}
                </p>
                <p className="text-sm opacity-70">
                  {weather.alertLevel === 'high' ? 'Sconsigliato uscire senza ombrello' : 
                   weather.alertLevel === 'medium' ? 'Possibili rovesci, porta un k-way' : 
                   'Condizioni ottimali per uscire'}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Temperatura</p>
                <p className="text-2xl font-bold text-cyan-400">{weather.temperature}°C</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Pioggia</p>
                <p className="text-2xl font-bold text-blue-400">{weather.precipitation} mm</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Probabilità</p>
                <p className="text-2xl font-bold text-purple-400">{weather.rainProbability}%</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Vento</p>
                <p className="text-2xl font-bold text-emerald-400">{weather.windSpeed} km/h</p>
              </div>
            </div>

            {/* Location Info */}
            {location && (
              <div className="text-center text-gray-500 text-xs">
                <p>📍 {location.name}</p>
                <p>{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && !weather && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Recupero dati meteo...</p>
          </div>
        )}
      </div>
    </main>
  );
}
