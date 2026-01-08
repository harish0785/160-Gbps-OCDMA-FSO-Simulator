
import { WeatherType, WeatherConfig } from './types';

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  [WeatherType.CLEAR]: {
    label: 'Clear Sky',
    attenuation: 0.43,
    description: 'Optimal conditions with minimal scattering.',
    particleColor: '#ffffff',
    intensity: 0.1
  },
  [WeatherType.HAZE]: {
    label: 'Haze',
    attenuation: 2.37,
    description: 'Moderate scattering due to dust and aerosols.',
    particleColor: '#94a3b8',
    intensity: 0.4
  },
  [WeatherType.RAIN]: {
    label: 'Heavy Rain',
    attenuation: 19.2,
    description: 'High attenuation caused by droplet absorption and scattering.',
    particleColor: '#60a5fa',
    intensity: 0.7
  },
  [WeatherType.FOG]: {
    label: 'Thick Fog',
    attenuation: 25.5,
    description: 'Severe signal degradation due to dense water vapor.',
    particleColor: '#f1f5f9',
    intensity: 1.0
  }
};

export const BEAM_COLORS = [
  '#ef4444', // Red (L=0)
  '#3b82f6', // Blue (L=1)
  '#22c55e', // Green (L=2)
  '#a855f7'  // Purple (L=3)
];

export const USERS_PER_BEAM = 4;
export const TOTAL_BEAMS = 4;
export const TX_POWER_DBM = 20; // 20 dBm source power
export const NOISE_FLOOR_DBM = -50; // Simplified noise floor
export const BEAM_DIVERGENCE_MRAD = 2.0; // 2 mrad divergence
