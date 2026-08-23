import React, { useState, useEffect, useRef } from 'react';
import { fetchWalkingRoute, START_COORDS, TARGET_COORDS } from './utils/routing';
import { getDistance, getBearing } from './utils/geo';
import { sounds } from './utils/audio';
import MapView from './components/MapView';
import { Compass, Map, Navigation, Play, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [routeSegments, setRouteSegments] = useState([]);
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0);
  const [userLocation, setUserLocation] = useState(START_COORDS);
  const [heading, setHeading] = useState(0);
  const [distanceToNextCheck, setDistanceToNextCheck] = useState(100);
  const [totalDistanceToTarget, setTotalDistanceToTarget] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [viewMode, setViewMode] = useState('radar'); // 'radar' | 'map'
  const [debugMode, setDebugMode] = useState(false);

  // Инициализация маршрута
  useEffect(() => {
    fetchWalkingRoute().then(({ segments }) => {
      setRouteSegments(segments);
    });
  }, []);

  // Геолокация смартфона
  useEffect(() => {
    if (debugMode || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [debugMode]);

  // Отслеживание компаса
  useEffect(() => {
    const handleOrientation = (e) => {
      let compass = 0;
      if (e.webkitCompassHeading) compass = e.webkitCompassHeading;
      else if (e.alpha !== null) compass = 360 - e.alpha;
      setHeading(compass);
    };
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  // Логика проверки приближения к рубежу 100м
  useEffect(() => {
    if (!routeSegments.length || isFinished) return;

    const currentTarget = routeSegments[currentSegmentIdx]?.targetPoint || TARGET_COORDS;
    const distToTarget = getDistance(userLocation[0], userLocation[1], currentTarget[0], currentTarget[1]);
    const totalDist = getDistance(userLocation[0], userLocation[1], TARGET_COORDS[0], TARGET_COORDS[1]);

    setDistanceToNextCheck(distToTarget);
    setTotalDistanceToTarget(totalDist);

    // Достижение финальной точки
    if (totalDist <= 15) {
      setIsFinished(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      return;
    }

    // Если подошла к концу текущего 100-метрового отрезка (радиус 15м) — открываем следующий отрезок!
    if (distToTarget <= 15 && currentSegmentIdx < routeSegments.length - 1) {
      setCurrentSegmentIdx((prev) => prev + 1);
      sounds.playSegmentUnlock();
    }
  }, [userLocation, routeSegments, currentSegmentIdx, isFinished]);

  const currentSegmentTarget = routeSegments[currentSegmentIdx]?.targetPoint || TARGET_COORDS;
  const bearingToNext = getBearing(userLocation[0], userLocation[1], currentSegmentTarget[0], currentSegmentTarget[1]);
  const arrowAngle = (bearingToNext - heading + 360) % 360;

  // Симулятор шага (для тестирования дома с ПК)
  const simulateStep = () => {
    if (!routeSegments[currentSegmentIdx]) return;
    const target = routeSegments[currentSegmentIdx].targetPoint;
    setUserLocation(target);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 p-4 max-w-md mx-auto justify-between font-mono">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-sm font-bold text-emerald-400 tracking-wider">СЕКТОР: НАСТЯ_GPS</h1>
          <p className="text-[10px] text-zinc-500">
            ОТРЕЗОК: {currentSegmentIdx + 1} / {routeSegments.length || 1} (ШАГ 100М)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { sounds.init(); setViewMode(viewMode === 'radar' ? 'map' : 'radar'); }}
            className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-emerald-400 text-xs flex items-center gap-1"
          >
            {viewMode === 'radar' ? <Map size={16} /> : <Compass size={16} />}
          </button>
        </div>
      </div>

      {/* Main Display: Radar or Map */}
      <div className="my-auto flex flex-col items-center justify-center relative w-full aspect-square max-h-[360px]">
        {viewMode === 'radar' ? (
          <div className="relative w-72 h-72 rounded-full border border-emerald-500/20 bg-zinc-900/60 flex items-center justify-center overflow-hidden">
            <div className="absolute w-52 h-52 rounded-full border border-dashed border-emerald-500/20" />
            <div className="absolute w-32 h-32 rounded-full border border-emerald-500/30" />
            
            {/* Сканирующий луч */}
            <div className="absolute inset-0 animate-[spin_3s_linear_infinite] origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.3)_360deg)]" />

            {/* Стрелка направления на текущий чекпоинт (+100м) */}
            <div
              className="absolute flex flex-col items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${arrowAngle}deg)` }}
            >
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[24px] border-b-emerald-400 drop-shadow-[0_0_10px_#34d399] -translate-y-24" />
            </div>

            <div className="w-3 h-3 bg-emerald-400 rounded-full z-10 shadow-[0_0_12px_#34d399]" />
          </div>
        ) : (
          <MapView
            userLocation={userLocation}
            visibleSegments={routeSegments.slice(0, currentSegmentIdx + 1)}
            currentSegmentTarget={currentSegmentTarget}
          />
        )}
      </div>

      {/* Bottom Info & Stats */}
      <div className="space-y-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
        {isFinished ? (
          <div className="text-center py-2 text-emerald-400 font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={24} /> ЦЕЛЬ ДОСТИГНУТА! СМОТРИ ПО СТОРОНАМ
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] text-zinc-500 block">ДО СЛЕДУЮЩЕГО СЕКТОРА</span>
                <span className="text-2xl font-black text-emerald-400">{distanceToNextCheck} м</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">ДО ФИНИША</span>
                <span className="text-sm font-bold text-zinc-300">{totalDistanceToTarget} м</span>
              </div>
            </div>

            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{
                  width: `${((currentSegmentIdx + 1) / (routeSegments.length || 1)) * 100}%`,
                }}
              />
            </div>
          </>
        )}

        {/* Debug кнопка для проверки без выхода на улицу */}
        <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-[10px] text-zinc-500">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
            />
            Режим отладки (ПК)
          </label>
          {debugMode && (
            <button
              onClick={simulateStep}
              className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/40 flex items-center gap-1"
            >
              <Play size={10} /> +100м шаг
            </button>
          )}
        </div>
      </div>
    </div>
  );
      }
                                  
