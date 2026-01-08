
import React from 'react';
import { SimulationStats } from '../types';
import EyeDiagram from './EyeDiagram';

interface HUDProps {
  stats: SimulationStats;
}

const HUD: React.FC<HUDProps> = ({ stats }) => {
  const statusColors = {
    EXCELLENT: 'text-green-400',
    GOOD: 'text-yellow-400',
    POOR: 'text-red-400'
  };

  const statusBg = {
    EXCELLENT: 'bg-green-500/10 border-green-500/20',
    GOOD: 'bg-yellow-500/10 border-yellow-500/20',
    POOR: 'bg-red-500/10 border-red-500/20'
  };

  // Calculate percentage of active capacity for the bar display
  const capacityPercent = (stats.currentGbps / 160) * 100;

  return (
    <div className="lg:w-80 bg-slate-900/90 backdrop-blur-xl p-6 border-l border-slate-800 flex flex-col gap-6 z-20 overflow-y-auto">
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Real-time Analytics</h3>
        
        <div className={`p-4 rounded-xl border ${statusBg[stats.status]} transition-all duration-500`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-400">SIGNAL QUALITY</span>
            <span className={`text-xs font-black ${statusColors[stats.status]}`}>{stats.status}</span>
          </div>
          <p className="text-xl font-mono font-bold">Q: {stats.qFactor.toFixed(2)}</p>
        </div>

        <div className="space-y-5">
          <MetricItem 
            label="SNR" 
            value={`${stats.snr.toFixed(1)} dB`} 
            percent={Math.min(100, (stats.snr / 50) * 100)} 
            color="bg-blue-500" 
          />
          <MetricItem 
            label="BER" 
            value={stats.ber < 1e-24 ? " < 10⁻²⁴" : `10^${Math.log10(stats.ber).toFixed(1)}`} 
            percent={Math.max(5, (1 - Math.log10(stats.ber) / -15) * 100)} 
            color="bg-purple-500" 
          />
          <MetricItem 
            label="Rx Power" 
            value={`${stats.powerReceived.toFixed(1)} dBm`} 
            percent={Math.max(10, (stats.powerReceived + 60) / 80 * 100)} 
            color="bg-green-500" 
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Signal Monitoring</h3>
        <EyeDiagram snr={stats.snr} ber={stats.ber} />
        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500">
           <span>Sampling: 10 Gbps</span>
           <span>Jitter: 0.12 UI</span>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
           <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Achievable Capacity</p>
           <p className="text-lg font-bold text-blue-400">{stats.currentGbps.toFixed(1)} Gbps</p>
           <div className="flex gap-1 mt-2">
             {[...Array(16)].map((_, i) => {
               const isActive = (i + 1) * 10 <= stats.currentGbps;
               const isPartial = i * 10 < stats.currentGbps && !isActive;
               return (
                 <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                   isActive ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 
                   isPartial ? 'bg-blue-800' : 'bg-slate-800'
                 }`}></div>
               );
             })}
           </div>
           <p className="text-[9px] text-slate-600 mt-2">Rate throttled by atmospheric BER.</p>
        </div>
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ label: string, value: string, percent: number, color: string }> = ({ label, value, percent, color }) => (
  <div>
    <div className="flex justify-between items-end mb-1.5">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">{label}</span>
      <span className="text-sm font-mono font-bold text-slate-200">{value}</span>
    </div>
    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
      <div 
        className={`${color} h-full transition-all duration-700 ease-out`}
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  </div>
);

export default HUD;
