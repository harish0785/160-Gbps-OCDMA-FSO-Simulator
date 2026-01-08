
import React from 'react';

const EducationalContent: React.FC = () => {
  const concepts = [
    {
      title: "OCDMA Technology",
      description: "Optical Code Division Multiple Access allows multiple users to share the same fiber or free-space channel simultaneously. Each user is assigned a unique Prime Velocity (PV) code to ensure zero multi-user interference (MUI).",
      icon: "🧬"
    },
    {
      title: "LG Beams (OAM)",
      description: "Laguerre-Gaussian beams carry Orbital Angular Momentum. By using different modes (L values), we create orthogonal spatial channels, effectively multiplying the system's capacity without increasing bandwidth.",
      icon: "🌀"
    },
    {
      title: "Free Space Optics",
      description: "FSO uses light to transmit data through the atmosphere. It offers high security, no spectrum licensing, and massive data rates, but is vulnerable to atmospheric conditions like fog and rain.",
      icon: "📡"
    },
    {
      title: "Weather Challenges",
      description: "Atmospheric attenuation is the primary hurdle for FSO. Fog contains water droplets of size comparable to optical wavelengths, causing Mie scattering that significantly degrades signal quality.",
      icon: "⛈️"
    }
  ];

  return (
    <div className="bg-slate-900 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Research Concepts</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Understanding the fundamentals of high-capacity optical wireless communication.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {concepts.map((concept, idx) => (
            <div key={idx} className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{concept.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-blue-400">{concept.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{concept.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 p-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-3xl border border-blue-500/20">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-4">160-Gbps Achievement</h3>
              <p className="text-slate-200 leading-relaxed mb-6">
                The research successfully demonstrates a 160 Gbps aggregate data rate (16 Users × 10 Gbps) by multiplexing 4 Laguerre-Gaussian (LG) beams. This spatial division multiplexing combined with OCDMA spectral coding provides a robust architecture for next-generation 6G backhaul.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-full text-xs font-bold text-blue-300">PV Encoding</div>
                <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs font-bold text-purple-300">Spatial Multiplexing</div>
                <div className="px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-full text-xs font-bold text-green-300">FSO Backhaul</div>
              </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-1/3">
              <img src="https://picsum.photos/seed/optics/600/400" alt="Optical Lab" className="rounded-xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalContent;
