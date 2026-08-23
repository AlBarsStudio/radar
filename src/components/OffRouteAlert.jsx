// src/components/OffRouteAlert.jsx
import React from 'react';
import { AlertTriangle, CornerUpLeft } from 'lucide-react';

export default function OffRouteAlert({ deviationDistance }) {
  return (
    <div className="absolute top-20 left-4 right-4 z-40 bg-rose-950/90 border-2 border-rose-500/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(244,63,94,0.4)] backdrop-blur-md animate-bounce">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
          <AlertTriangle size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-black text-rose-400 tracking-wider flex items-center gap-1.5">
            СИЛЬНОЕ ОТКЛОНЕНИЕ ОТ МАРШРУТА
          </h3>
          <p className="text-[11px] text-rose-200/80 mt-1 leading-snug">
            Ты ушла на <b className="text-white font-bold">{deviationDistance} м</b> в сторону от тропы. Развернись и вернись на зеленый сектор.
          </p>
        </div>
      </div>
    </div>
  );
}
