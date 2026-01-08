
export enum WeatherType {
  CLEAR = 'CLEAR',
  HAZE = 'HAZE',
  RAIN = 'RAIN',
  FOG = 'FOG'
}

export interface WeatherConfig {
  label: string;
  attenuation: number; // dB/km
  description: string;
  particleColor: string;
  intensity: number;
}

export interface SimulationStats {
  distance: number;
  attenuation: number;
  snr: number;
  ber: number;
  qFactor: number;
  powerReceived: number;
  currentGbps: number;
  status: 'EXCELLENT' | 'GOOD' | 'POOR';
}
