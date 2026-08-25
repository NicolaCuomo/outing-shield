import { NextRequest, NextResponse } from 'next/server';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    precipitation: number;
    rain: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    precipitation: number[];
    time: string[];
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude e longitudine sono richieste' },
      { status: 400 }
    );
  }

  try {
    // Fetch dati meteo da Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation&timezone=auto`;
    
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error('Errore nella chiamata API Open-Meteo');
    }

    const data: OpenMeteoResponse = await response.json();

    // Estrai dati correnti
    const temperature = Math.round(data.current.temperature_2m);
    const precipitation = data.current.precipitation || 0;
    const rainProbability = calculateRainProbability(data.hourly.precipitation);
    const windSpeed = Math.round(data.current.wind_speed_10m);
    const isRaining = precipitation > 0 || data.current.rain > 0;

    // Calcola livello di allerta basato sulle soglie
    const alertLevel = calculateAlertLevel(precipitation, rainProbability, data.current.weather_code);

    return NextResponse.json({
      temperature,
      precipitation,
      rainProbability,
      windSpeed,
      isRaining,
      alertLevel,
    });
  } catch (error) {
    console.error('Errore nel recupero dati meteo:', error);
    return NextResponse.json(
      { error: 'Impossibile recuperare i dati meteo' },
      { status: 500 }
    );
  }
}

/**
 * Calcola la probabilità di pioggia nelle prossime ore
 * basata sui dati hourly di precipitazione
 */
function calculateRainProbability(hourlyPrecipitation: number[]): number {
  // Analizza le prossime 6 ore
  const nextHours = hourlyPrecipitation.slice(0, 6);
  
  if (nextHours.length === 0) return 0;
  
  const rainyHours = nextHours.filter(p => p > 0).length;
  const probability = Math.round((rainyHours / nextHours.length) * 100);
  
  return Math.min(probability, 100);
}

/**
 * Calcola il livello di allerta basato su:
 * - Precipitazioni attuali (mm)
 * - Probabilità di pioggia (%)
 * - Weather code di Open-Meteo
 * 
 * Soglie:
 * - HIGH: pioggia > 2mm OPPURE probabilità > 70% OPPURE weather_code >= 61
 * - MEDIUM: pioggia > 0.5mm OPPURE probabilità > 40% OPPURE weather_code >= 51
 * - LOW: altrimenti
 */
function calculateAlertLevel(
  precipitation: number,
  rainProbability: number,
  weatherCode: number
): 'low' | 'medium' | 'high' {
  // Weather codes Open-Meteo:
  // 51-55: drizzle, 61-65: rain, 80-82: rain showers, 95-99: thunderstorm
  
  const isHeavyRain = precipitation > 2;
  const isLightRain = precipitation > 0.5;
  const isHighProbability = rainProbability > 70;
  const isMediumProbability = rainProbability > 40;
  const hasThunderstorm = weatherCode >= 95;
  const hasRain = weatherCode >= 61 && weatherCode <= 82;
  const hasDrizzle = weatherCode >= 51 && weatherCode <= 55;

  // Livello HIGH
  if (isHeavyRain || isHighProbability || hasThunderstorm || hasRain) {
    return 'high';
  }

  // Livello MEDIUM
  if (isLightRain || isMediumProbability || hasDrizzle) {
    return 'medium';
  }

  // Livello LOW
  return 'low';
}
