// src/components/MiniRadar.jsx
import React from 'react';
import { Navigation } from 'lucide-react';

export default function MiniRadar({ arrowAngle, distanceToNext, onClick }) {
  const isClose = distanceToNext <= 15;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="relative w-20 h-20 rounded-full bg-zinc-950/90 border-2 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform flex-shrink-0 overflow-hidden"
    >
      {/* Сетка мини-радара */}
      <div className="absolute w-14 h-14 rounded-full border border-dashed border-emerald-500/30" />
      <div className="absolute w-8 h-8 rounded-full border border-emerald-500/40" />

      {/* Сканирующий луч */}
      <div className="absolute inset-0 animate-[spin_2.5s_linear_infinite] origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.35)_360deg)]" />

      {/* Стрелка компаса */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
        style={{ transform: `rotate(${arrowAngle}deg)` }}
      >
        <div className="flex flex-col items-center -translate-y-6">
          <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] ${isClose ? 'border-b-emerald-400 animate-bounce' : 'border-b-emerald-400'} drop-shadow-[0_0_8px_#34d399]`} />
        </div>
      </div>

      {/* Центральный маячок */}
      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full z-10 shadow-[0_0_8px_#10b981]" />
    </div>
  );
}
