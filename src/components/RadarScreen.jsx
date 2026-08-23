// src/components/RadarScreen.jsx
import React from 'react';
import { Target, Compass } from 'lucide-react';

export default function RadarScreen({ arrowAngle, distanceToNext, totalDistance, accuracy }) {
  const getProximityStatus = () => {
    if (distanceToNext <= 15) return { color: 'border-emerald-400 shadow-[0_0_25px_#10b981]', text: 'text-emerald-400', label: 'ТОЧКА ВПЕРЕДИ!' };
    if (distanceToNext < 40) return { color: 'border-amber-400 shadow-[0_0_20px_#f59e0b]', text: 'text-amber-400', label: 'ПРИБЛИЖЕНИЕ' };
    return { color: 'border-cyan-500/50 shadow-[0_0_15px_#06b6d4]', text: 'text-cyan-400', label: 'ПОИСК СИГНАЛА' };
  };

  const status = getProximityStatus();

  return (
    <div className="flex flex-col items-center justify-center w-full my-auto select-none">
      <div className="text-center mb-3">
        <span className={`text-xs font-bold tracking-widest uppercase ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Адаптивный круг радара */}
      <div className={`relative w-[min(68vw,260px)] aspect-square rounded-full border-2 ${status.color} bg-zinc-900/80 flex items-center justify-center overflow-hidden transition-all duration-500`}>
        {/* Концентрические кольца */}
        <div className="absolute w-3/4 h-3/4 rounded-full border border-dashed border-emerald-500/20" />
        <div className="absolute w-1/2 h-1/2 rounded-full border border-emerald-500/30" />
        <div className="absolute w-1/4 h-1/4 rounded-full border border-emerald-500/40" />

        {/* Сетка координат */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-emerald-500/20" />
          <div className="absolute h-full w-[1px] bg-emerald-500/20" />
        </div>

        {/* Сканирующий луч */}
        <div className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite] origin-center pointer-events-none bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.3)_360deg)]" />

        {/* Стрелка пеленга к следующей точке (+50м) */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${arrowAngle}deg)` }}
        >
          <div className="flex flex-col items-center -translate-y-20 sm:-translate-y-24">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[24px] border-b-emerald-400 drop-shadow-[0_0_10px_#10b981]" />
            <div className="w-1 h-5 bg-emerald-400/70 rounded-full" />
          </div>
        </div>

        {/* Центр игрока */}
        <div className="w-3 h-3 bg-emerald-400 rounded-full z-10 shadow-[0_0_10px_#34d399]" />
      </div>

      {/* Показатели под радаром */}
      <div className="mt-4 text-center">
        <div className="text-3xl font-black text-emerald-400 tracking-tight">
          {distanceToNext} <span className="text-xs text-zinc-500 font-normal">МЕТРОВ</span>
        </div>
        <div className="text-[10px] text-zinc-500 mt-1">
          До финиша: <b className="text-zinc-300">{totalDistance} м</b> {accuracy ? `(GPS ±${accuracy}м)` : ''}
        </div>
      </div>
    </div>
  );
        }
