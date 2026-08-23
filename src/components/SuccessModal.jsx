import React from 'react';
import { Sparkles, Key, Check } from 'lucide-react';

export default function SuccessModal({ onReset }) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-6 select-none font-mono">
      <div className="bg-zinc-900 border border-emerald-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-emerald-400 w-8 h-8 animate-bounce" />
        </div>

        <h2 className="text-xl font-black text-emerald-400 tracking-wider mb-2">
          ЦЕЛЬ ОБНАРУЖЕНА!
        </h2>

        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          Ты преодолела весь маршрут. Оглянись вокруг — твоя награда или следующая подсказка спрятана именно здесь.
        </p>

        <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl mb-6 text-left">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
            <Key size={14} /> СТАТУС СЕКТОРА
          </div>
          <p className="text-[11px] text-zinc-500">
            Координаты: 54.170268, 37.567547<br />
            Погрешность радара: &lt; 5м
          </p>
        </div>

        <button
          onClick={onReset}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Check size={16} /> ПРИНЯТЬ СИГНАЛ
        </button>
      </div>
    </div>
  );
}
