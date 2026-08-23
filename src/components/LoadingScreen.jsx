// src/components/LoadingScreen.jsx
import React from 'react';
import { Wifi, DownloadCloud, ShieldAlert } from 'lucide-react';

export default function LoadingScreen({ progress }) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-between p-6 select-none font-mono text-zinc-100">
      <div className="w-full flex justify-center pt-8">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs tracking-wider">
          <DownloadCloud size={14} className="animate-bounce" />
          <span>СИНХРОНИЗАЦИЯ СЕКТОРА</span>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        {/* Радарная анимация спиннера */}
        <div className="relative w-28 h-28 rounded-full border border-emerald-500/30 bg-zinc-900/80 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full animate-[spin_2s_linear_infinite] origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.4)_360deg)]" />
          <div className="text-2xl font-black text-emerald-400">{progress}%</div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-bold tracking-widest text-zinc-200">
            ЗАГРУЗКА ОФФЛАЙН-КАРТЫ (3 КМ)
          </h2>
          <p className="text-xs text-zinc-500">
            Сохраняем данные в память смартфона, чтобы квест работал без интернета.
          </p>
        </div>

        {/* Прогресс-бар */}
        <div className="w-full bg-zinc-900 border border-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_#10b981]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Предупреждение о Wi-Fi */}
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-left flex items-start gap-3">
          <Wifi className="text-amber-400 w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="text-[11px] text-amber-200/90 leading-tight">
            <span className="font-bold text-amber-300 block mb-0.5">ВАЖНО:</span>
            Не отключай Wi-Fi и браузер, пока идёт загрузка.
          </div>
        </div>
      </div>

      <div className="text-[10px] text-zinc-600 pb-4">
        СЕКТОР: ТУЛА // КАРТА МАРОДЁРОВ
      </div>
    </div>
  );
}
