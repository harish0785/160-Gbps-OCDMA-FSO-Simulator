
import React, { useRef, useEffect } from 'react';

interface EyeDiagramProps {
  snr: number;
  ber: number;
}

const EyeDiagram: React.FC<EyeDiagramProps> = ({ snr, ber }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const width = canvas.width;
    const height = canvas.height;
    
    // Normalize noise based on SNR (0-40dB range)
    const noiseLevel = Math.max(0.01, 1 - (snr / 40)) * (height / 4);

    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Eye Pattern
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      const samples = 12;
      for (let s = 0; s < samples; s++) {
        // Higher BER = Dimmer/fuzzier lines
        const alpha = Math.max(0.1, 1 - Math.log10(ber + 1e-20) / -12);
        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.4})`;

        ctx.beginPath();
        // Path from 0 to 1
        ctx.moveTo(0, height * 0.75 + (Math.random() - 0.5) * noiseLevel);
        ctx.bezierCurveTo(
          width / 2, height * 0.75,
          width / 2, height * 0.25,
          width, height * 0.25 + (Math.random() - 0.5) * noiseLevel
        );
        ctx.stroke();

        ctx.beginPath();
        // Path from 1 to 0
        ctx.moveTo(0, height * 0.25 + (Math.random() - 0.5) * noiseLevel);
        ctx.bezierCurveTo(
          width / 2, height * 0.25,
          width / 2, height * 0.75,
          width, height * 0.75 + (Math.random() - 0.5) * noiseLevel
        );
        ctx.stroke();

        // Horizontal lines (0 and 1 levels)
        ctx.beginPath();
        ctx.moveTo(0, height * 0.25 + (Math.random() - 0.5) * noiseLevel);
        ctx.lineTo(width, height * 0.25 + (Math.random() - 0.5) * noiseLevel);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, height * 0.75 + (Math.random() - 0.5) * noiseLevel);
        ctx.lineTo(width, height * 0.75 + (Math.random() - 0.5) * noiseLevel);
        ctx.stroke();
      }

      // Draw crosshair/info
      ctx.font = '10px Inter';
      ctx.fillStyle = '#64748b';
      ctx.fillText('EYE DIAGRAM', 10, 20);

      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [snr, ber]);

  return (
    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner">
      <canvas ref={canvasRef} width={240} height={140} className="w-full h-auto" />
    </div>
  );
};

export default EyeDiagram;
