// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchWalkingRoute, START_COORDS, TARGET_COORDS } from './utils/routing';
import { getDistance, getBearing } from './utils/geo';
import { prefetchAreaTiles } from './utils/tileCache';
import { sounds } from './utils/audio';
import MapView from './components/MapView';
import MiniRadar from './components/MiniRadar';
import RadarScreen from './components/RadarScreen';
import SuccessModal from './components/SuccessModal';
import { Radio, Map as MapIcon, Volume2, Footprints, RotateCcw, Play, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  SEGMENT_IDX: 'nastya_quest_seg_idx_v2',
  IS_FINISHED: 'nastya_quest_finished_v2',
};

export default function App() {
  const [routeSegments, setRouteSegments] = useState([]);
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.SEGMENT_IDX) || '0', 10);
  });
  const [isFinished, setIsFinished] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_FINISHED) === 'true';
  });

  const [userLocation, setUserLocation] = useState(START_COORDS);
  const [heading, setHeading] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [distanceToNext, setDistanceToNext] = useState(50);
  const [totalDistance, setTotalDistance] = useState(0);
  
  // Изначально режим 'map' (безрамочная карта + мини-радар). Кнопка переключает в 'radar' (большой радар)
  const [viewMode, setViewMode] = useState('map'); 
  const [debugMode, setDebugMode] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [cacheStatus, setCacheStatus] = useState(null);

  // 1. Инициализация Service Worker и предзагрузка 3 км тайлов
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    }
    // Кэшируем 3 км вокруг центра маршрута
    prefetchAreaTiles(54.169, 37.571, (progress) => {
      if (progress < 100) {
        setCacheStatus(`Кэш карты: ${progress}%`);
      } else {
        setCacheStatus('Оффлайн-карта готова');
        setTimeout(() => setCacheStatus(null), 3000);
      }
    });
  }, []);

  // 2. Загрузка маршрута с нарезкой по 50 метров
  useEffect(() => {
    fetchWalkingRoute().then(({ segments }) => {
      setRouteSegments(segments);
    });
  }, []);

  // 3. Сохранение прогресса в LocalStorage при обновлениях
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEGMENT_IDX, currentSegmentIdx.toString());
  }, [currentSegmentIdx]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_FINISHED, isFinished.toString());
  }, [isFinished]);

  const enableSensors = useCallback(() => {
    sounds.init();
    setAudioStarted(true);

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state !== 'granted') console.warn('Compass permission denied');
        })
        .catch(console.error);
    }
  }, []);

  // 4. GPS геолокация
  useEffect(() => {
    if (debugMode || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [debugMode]);

  // 5. Компас смартфона
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

  // 6. Логика преодоления 50м рубежей
  useEffect(() => {
    if (!routeSegments.length || isFinished) return;

    const currentTarget = routeSegments[currentSegmentIdx]?.targetPoint || TARGET_COORDS;
    const distToSegmentTarget = getDistance(userLocation[0], userLocation[1], currentTarget[0], currentTarget[1]);
    const distToFinal = getDistance(userLocation[0], userLocation[1], TARGET_COORDS[0], TARGET_COORDS[1]);

    setDistanceToNext(distToSegmentTarget);
    setTotalDistance(distToFinal);

    sounds.playRadarPing(distToSegmentTarget);

    // Достижение финиша (радиус 15м)
    if (distToFinal <= 15) {
      setIsFinished(true);
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      return;
    }

    // Прохождение очередного 50-метрового участка
    if (distToSegmentTarget <= 15 && currentSegmentIdx < routeSegments.length - 1) {
      setCurrentSegmentIdx((prev) => prev + 1);
      sounds.playSegmentUnlock();
    }
  }, [userLocation, routeSegments, currentSegmentIdx, isFinished]);

  const currentSegmentTarget = routeSegments[currentSegmentIdx]?.targetPoint || TARGET_COORDS;
  const bearingToNext = getBearing(userLocation[0], userLocation[1], currentSegmentTarget[0], currentSegmentTarget[1]);
  const arrowAngle = (bearingToNext - heading + 360) % 360;

  // Симулятор для проверки с ПК
  const simulateStep = () => {
    if (!routeSegments[currentSegmentIdx]) return;
    const nextPt = routeSegments[currentSegmentIdx].targetPoint;
    setUserLocation(nextPt);
  };

  const handleResetQuest = () => {
    if (confirm('Сбросить прогресс квеста к началу?')) {
      setCurrentSegmentIdx(0);
      setIsFinished(false);
      setUserLocation(START_COORDS);
      localStorage.removeItem(STORAGE_KEYS.SEGMENT_IDX);
      localStorage.removeItem(STORAGE_KEYS.IS_FINISHED);
    }
  };

  const totalSteps = routeSegments.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentSegmentIdx + 1) / totalSteps) * 100));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-mono select-none">
      {/* 1. БЕЗРАМОЧНЫЙ ФОН: Карта во весь экран */}
      <MapView
        userLocation={userLocation}
        visibleSegments={routeSegments.slice(0, currentSegmentIdx + 1)}
        currentSegmentTarget={currentSegmentTarget}
      />

      {/* 2. ПОЛНОЭКРАННЫЙ БОЛЬШОЙ РАДАР (если нажат режим 'radar') */}
      {viewMode === 'radar' && (
        <div className="absolute inset-0 z-20 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between p-6 animate-in fade-in duration-200">
          <div className="pt-2 text-center">
            <h2 className="text-emerald-400 text-sm font-black tracking-widest uppercase">Тактический Радар</h2>
            <p className="text-[10px] text-zinc-500">Поиск сигнала в радиусе 50м</p>
          </div>

          <RadarScreen
            arrowAngle={arrowAngle}
            distanceToNext={distanceToNext}
            totalDistance={totalDistance}
            accuracy={gpsAccuracy}
          />

          <button
            onClick={() => setViewMode('map')}
            className="w-full py-3 bg-zinc-900 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg"
          >
            <MapIcon size={16} /> ВЕРНУТЬСЯ К КАРТЕ
          </button>
        </div>
      )}

      {/* 3. ВЕРХНИЙ ХУД ПОВЕРХ КАРТЫ */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-zinc-900/85 backdrop-blur-md border border-zinc-800/90 p-3 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-emerald-400 tracking-wider">НАСТЯ_GPS</div>
            <div className="text-[10px] text-zinc-400">
              {cacheStatus || (gpsAccuracy ? `Точность ±${gpsAccuracy}м` : 'Поиск спутников...')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!audioStarted && (
            <button
              onClick={enableSensors}
              className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl active:scale-95"
              title="Включить звук"
            >
              <Volume2 size={16} />
            </button>
          )}

          {/* КНОПКА: Отключает карту и переводит в режим Большого Радара */}
          <button
            onClick={() => {
              if (!audioStarted) enableSensors();
              setViewMode(viewMode === 'map' ? 'radar' : 'map');
            }}
            className="px-3 py-2 bg-zinc-800/90 border border-zinc-700 text-emerald-400 rounded-xl active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow"
          >
            <Radio size={16} className="text-emerald-400 animate-pulse" />
            <span>РАДАР</span>
          </button>
        </div>
      </div>

      {/* 4. НИЖНИЙ ХУД ПОВЕРХ КАРТЫ (Мини-радар + Телеметрия + Шаг 50м) */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 p-4 rounded-3xl shadow-2xl space-y-3">
        <div className="flex items-center gap-4">
          {/* Мини-радар: клик по нему также открывает большой радар */}
          <MiniRadar
            arrowAngle={arrowAngle}
            distanceToNext={distanceToNext}
            onClick={() => {
              if (!audioStarted) enableSensors();
              setViewMode('radar');
            }}
          />

          <div className="flex-1">
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Footprints size={12} className="text-emerald-400" /> СЛЕДУЮЩИЙ РУБЕЖ (+50М)
            </span>
            <div className="text-2xl font-black text-emerald-400">{distanceToNext} м</div>
            <div className="text-[11px] text-zinc-400 flex justify-between mt-0.5">
              <span>До финиша: <b className="text-zinc-200">{totalDistance} м</b></span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Шкала прогресса */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_8px_#10b981]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Панель отладки и сброса */}
        <div className="pt-2 border-t border-zinc-800/70 flex justify-between items-center text-[10px] text-zinc-500">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500"
            />
            Отладка
          </label>

          <div className="flex gap-2">
            {debugMode && (
              <button
                onClick={simulateStep}
                className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40 flex items-center gap-1 active:scale-95"
              >
                <Play size={10} /> +50м шаг
              </button>
            )}
            <button
              onClick={handleResetQuest}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg flex items-center gap-1 active:scale-95"
              title="Сбросить к началу"
            >
              <RotateCcw size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Экран победы */}
      {isFinished && <SuccessModal onReset={handleResetQuest} />}
    </div>
  );
        }
            
