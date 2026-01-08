
import React, { useState, useMemo } from 'react';
import SimulationScene from './components/SimulationScene';
import HUD from './components/HUD';
import EducationalContent from './components/EducationalContent';
import { WeatherType, SimulationStats } from './types';
import { WEATHER_CONFIGS, TX_POWER_DBM, NOISE_FLOOR_DBM } from './constants';

// Math helpers
function erfc(x: number): number {
  // Approximation for erfc(x)
  const t = 1.0 / (1.0 + 0.5 * Math.abs(x));
  const ans = t * Math.exp(-x * x - 1.26551223 +
    t * (1.00002368 +
    t * (0.37409196 +
    t * (0.09678418 +
    t * (-0.18628806 +
    t * (0.27886807 +
    t * (-1.13520398 +
    t * (1.48851587 +
    t * (-0.82215223 +
    t * 0.17087277)))))))));
  return x >= 0 ? ans : 2.0 - ans;
}

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherType>(WeatherType.CLEAR);
  const [distance, setDistance] = useState<number>(1.5); // km
  const [hoveredUser, setHoveredUser] = useState<number | null>(null);

  const stats = useMemo<SimulationStats>(() => {
    const config = WEATHER_CONFIGS[weather];
    
    // Attenuation calculation
    const weatherAtten = config.attenuation * distance;
    // Geometric loss: simplified square law distance loss
    const geoLoss = 10 * Math.log10(Math.max(1, distance * distance * 2));
    
    const totalAttenuation = weatherAtten + geoLoss;
    const powerReceived = TX_POWER_DBM - totalAttenuation;
    
    // SNR and BER
    const snrDb = Math.max(0, powerReceived - NOISE_FLOOR_DBM);
    const snrLinear = Math.pow(10, snrDb / 10);
    
    // Q-factor approximation: Q = sqrt(SNR) for OOK systems
    const qFactor = Math.sqrt(snrLinear);
    
    // BER Calculation: 0.5 * erfc(Q / sqrt(2))
    const ber = 0.5 * erfc(qFactor / Math.sqrt(2));
    
    let status: 'EXCELLENT' | 'GOOD' | 'POOR' = 'POOR';
    if (ber < 1e-12) status = 'EXCELLENT';
    else if (ber < 1e-9) status = 'GOOD';

    // Dynamic Gbps calculation: Drop capacity as BER increases
    // 160 Gbps is peak. We simulate throughput drop between BER 10^-12 and 10^-3
    const logBer = Math.log10(Math.max(1e-25, ber));
    const fecLimit = -3; // 10^-3 is a common limit for hard-decision FEC
    const errorFreeLimit = -12; // 10^-12
    
    let multiplier = 1.0;
    if (logBer > errorFreeLimit) {
      multiplier = Math.max(0, (logBer - fecLimit) / (errorFreeLimit - fecLimit));
    }
    const currentGbps = 160 * multiplier;

    return {
      distance,
      attenuation: totalAttenuation,
      powerReceived: powerReceived,
      snr: snrDb,
      ber: Math.max(1e-25, ber),
      qFactor: qFactor,
      currentGbps: currentGbps,
      status: status
    };
  }, [weather, distance]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white selection:bg-blue-500 selection:text-white">
      <header className="p-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {stats.currentGbps.toFixed(1)} Gbps OCDMA-FSO Analyzer
            </h1>
            <p className="text-slate-400 text-sm font-medium">Research Grade LG-Mode Adaptive Rate Simulation</p>
          </div>
          <div className="hidden md:flex gap-6 items-center">
             <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Link Status</p>
                <p className={`text-xs font-black ${stats.status === 'EXCELLENT' ? 'text-green-400' : stats.status === 'GOOD' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {stats.status}
                </p>
             </div>
             <div className="w-px h-8 bg-slate-800"></div>
             <span className="text-xs font-bold text-blue-400 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full animate-pulse">SYSTEM LIVE</span>
          </div>
        </div>
      </header>

      <main className="relative flex-grow flex flex-col lg:flex-row h-[70vh] md:h-[700px] overflow-hidden border-b border-slate-800">
        {/* Left Control Panel */}
        <div className="lg:w-80 bg-slate-800/50 backdrop-blur-lg p-6 flex flex-col gap-8 z-20 border-r border-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Atmosphere Settings</label>
            <select 
              value={weather}
              onChange={(e) => setWeather(e.target.value as WeatherType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-slate-900/80 mb-4"
            >
              {Object.entries(WEATHER_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 leading-relaxed italic border-l-2 border-slate-700 pl-3">
              {WEATHER_CONFIGS[weather].description}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Link Distance</label>
              <span className="text-blue-400 font-bold text-sm">{distance.toFixed(1)} km</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="15" 
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between mt-2 text-[10px] text-slate-500">
              <span>0.1km</span>
              <span>15km</span>
            </div>
          </div>

          <div className="mt-auto p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
             <h4 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-tight">System Consts</h4>
             <ul className="text-[11px] space-y-1 text-slate-400">
               <li className="flex justify-between"><span>Tx Power:</span> <span className="text-slate-200">20 dBm</span></li>
               <li className="flex justify-between"><span>Max Bitrate:</span> <span className="text-slate-200">160 Gbps</span></li>
               <li className="flex justify-between"><span>Adaptive Rate:</span> <span className="text-blue-400 font-bold">Enabled</span></li>
             </ul>
             <p className="text-[9px] text-slate-500 mt-2 italic leading-tight">* Note: Achievable Gbps decreases significantly in harsh weather due to atmospheric scattering.</p>
          </div>
        </div>

        {/* 3D Scene View */}
        <div className="flex-grow relative bg-black">
          <SimulationScene weather={weather} distance={distance} hoveredUser={hoveredUser} onHoverUser={setHoveredUser} />
          
          {hoveredUser !== null && (
            <div className="absolute top-10 right-10 p-4 bg-slate-900/95 backdrop-blur border border-blue-500/50 rounded-xl shadow-2xl z-30 pointer-events-none min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]`}></div>
                <h3 className="text-blue-400 font-bold text-sm">USER CHANNEL #{hoveredUser + 1}</h3>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <p className="flex justify-between"><span className="text-slate-500">Mode:</span> OAM L={Math.floor(hoveredUser / 4)}</p>
                <p className="flex justify-between"><span className="text-slate-500">Code:</span> PV-Prime Velocity</p>
                <p className="flex justify-between"><span className="text-slate-500">Base Rate:</span> 10 Gbps</p>
                <p className="flex justify-between font-bold">
                  <span className="text-slate-500">Eff. Rate:</span> 
                  <span className="text-blue-400">{(stats.currentGbps / 16).toFixed(2)} Gbps</span>
                </p>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-6 flex gap-4 pointer-events-none">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur rounded-lg border border-slate-700/50">
               <div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
               <span className="text-[10px] font-bold uppercase tracking-wider">Tx HUB</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur rounded-lg border border-slate-700/50">
               <div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>
               <span className="text-[10px] font-bold uppercase tracking-wider">Rx TARGET</span>
             </div>
          </div>
        </div>

        {/* Right HUD */}
        <HUD stats={stats} />
      </main>

      <EducationalContent />

      <footer className="p-8 bg-slate-950 border-t border-slate-900 text-center text-slate-500 text-xs">
        &copy; 2024 Optical Engineering Simulation | Research Edition | Capacity fluctuates with weather conditions.
      </footer>
    </div>
  );
};

export default App;
