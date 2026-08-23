// src/components/CacheBanner.jsx
import React from 'react';
import { Wifi, CheckCircle2, DownloadCloud } from 'lucide-react';

export default function CacheBanner({ cacheInfo }) {
  if (!cacheInfo) return null;
  const { percent, loaded, total, speedText, isDone } = cacheInfo;

  if (isDone) {
    return (
      <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-2.5 backdrop-blur-md flex items-center justify-between text-[11px] text-emerald-300 shadow-lg animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
          <span>Оффлайн-карта (3 км) сохранена в память</span>
        </div>
        <span className="text-[10px] text-emerald-400/80 font-bold">100%</span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-amber-500/40 rounded-2xl p-3 backdrop-blur-md shadow-2xl space-y-2 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
          <DownloadCloud size={15} className="animate-bounce text-amber-400" />
          <span>КЭШИРОВАНИЕ КАРТЫ: {percent}%</span>
        </div>
        <div className="text-[10px] text-amber-200/90 font-mono">
          {speedText} {total ? `(${loaded}/${total})` : ''}
        </div>
      </div>

      {/* Шкала загрузки */}
      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-amber-400 h-full transition-all duration-200 shadow-[0_0_8px_#f59e0b]"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Предупреждение */}
      <div className="flex items-center gap-1.5 text-[10px] text-amber-200/80">
        <Wifi size={12} className="text-amber-400 flex-shrink-0 animate-pulse" />
        <span>Пожалуйста, не отключай интернет / Wi-Fi во время загрузки</span>
      </div>
    </div>
  );
}
