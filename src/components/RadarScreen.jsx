import React from 'react';
import { Target } from 'lucide-react';

export default function RadarScreen({ arrowAngle, distanceToNext, totalDistance, accuracy }) {
  const getProximityColor = () => {
    if (distanceToNext <= 15) return 'text-emerald-400 border-emerald-400/80 shadow-[0_0_20px_#10b981]';
    if (distanceToNext < 40) return 'text-amber-400 border-amber-400/60 shadow-[0_0_15px_#f59e0b]';
    return 'text-cyan-400 border-cyan-500/40 shadow-[0_0_15px_#06b6d4]';
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full aspect-square max-w-[320px] mx-auto">
      {/* Внешний радарный круг */}
      <div className={`relative w-full h-full rounded-full border-2 ${getProximityColor()} bg-zinc-900/70 flex items-center justify-center overflow-hidden transition-colors duration-500`}>
        {/* Концентрические кольца */}
        <div className="absolute w-3/4 h-3/4 rounded-full border border-dashed border-emerald-500/20" />
        <div className="absolute w-1/2 h-1/2 rounded-full border border-emerald-500/30" />
        <div className="absolute w-1/4 h-1/4 rounded-full border border-emerald-500/40" />

        {/* Сетка координат */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-emerald-500/20" />
          <div className="absolute h-full w-[1px] bg-emerald-500/20" />
        </div>

        {/* Вращающийся сканирующий луч */}
        <div className="absolute inset-0 rounded-full animate-[spin_3.5s_linear_infinite] origin-center pointer-events-none bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.25)_360deg)]" />

        {/* Стрелка пеленга на следующую точку (+100м) */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${arrowAngle}deg)` }}
        >
          <div className="flex flex-col items-center -translate-y-28">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[28px] border-b-emerald-400 drop-shadow-[0_0_12px_#10b981]" />
            <div className="w-1.5 h-6 bg-emerald-400/80 rounded-full" />
          </div>
        </div>

        {/* Центральная точка игрока */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399] animate-ping opacity-75 absolute" />
          <div className="w-3.5 h-3.5 bg-emerald-300 rounded-full z-10 border-2 border-zinc-950" />
        </div>
      </div>

      {/* Метка дистанции по центру внизу */}
      <div className="absolute -bottom-4 bg-zinc-900/90 border border-zinc-700 px-4 py-1 rounded-full text-xs text-zinc-300 flex items-center gap-1 shadow-lg">
        <Target size={12} className="text-emerald-400" />
        <span>До рубежа: <b className="text-emerald-400">{distanceToNext} м</b></span>
      </div>
    </div>
  );
}
