// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchWalkingRoute, START_COORDS, TARGET_COORDS } from './utils/routing';
import { getDistance, getBearing, getMinDistanceToRoute } from './utils/geo';
import { prefetchAreaTiles } from './utils/tileCache';
import { sounds } from './utils/audio';
import MapView from './components/MapView';
import MiniRadar from './components/MiniRadar';
import RadarScreen from './components/RadarScreen';
import LoadingScreen from './components/LoadingScreen';
import OffRouteAlert from './components/OffRouteAlert';
import SuccessModal from './components/SuccessModal';
import { Radio, Map as MapIcon, Volume2, Footprints, RotateCcw, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  SEGMENT_IDX: 'nastya_quest_seg_idx_v3',
  IS_FINISHED: 'nastya_quest_finished_v3',
  CACHE_DONE: 'nastya_quest_cache_ready_v3',
};

export default function App() {
  const [fullRouteCoords, setFullRouteCoords] = useState([]);
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
  const [deviationDistance, setDeviationDistance] = useState(0);

  // Режим просмотра: 'map' (карта + мини-радар) или 'radar' (полноэкранный радар)
  const [viewMode, setViewMode] = useState('map');
  const [debugMode, setDebugMode] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  // Состояние загрузки карты (0 - 100%)
  const [cacheProgress, setCacheProgress] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CACHE_DONE) === 'true' ? 100 : 0;
  });

  // 1. Предзагрузка оффлайн-тайлов (3 км)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    }

    if (cacheProgress < 100) {
      prefetchAreaTiles(54.169, 37.571, (progress) => {
        setCacheProgress(progress);
        if (progress >= 100) {
          localStorage.setItem(STORAGE_KEYS.CACHE_DONE, 'true');
        }
      });
    }
  }, [cacheProgress]);

  // 2. Инициализация пешеходного маршрута (шаг 50 метров)
  useEffect(() => {
    fetchWalkingRoute().then(({ fullPath, segments }) => {
      setFullRouteCoords(fullPath);
      setRouteSegments(segments);
    });
  }, []);

  // 3. Сохранение прогресса квеста
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
          if (state !== 'granted') console.warn('Компас отклонен');
        })
        .catch(console.error);
    }
  }, []);

  // 4. GPS трекинг
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

  // 5. Компас
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

  // 6. Проверка расстояния, 50м рубежей и отклонения $\ge$ 200м
  useEffect(() => {
    if (!routeSegments.length || isFinished) return;

    const currentTarget = routeSegments[currentSegmentIdx]?.targetPoint || TARGET_COORDS;
    const distToSegmentTarget = getDistance(userLocation[0], userLocation[1], currentTarget[0], currentTarget[1]);
    const distToFinal = getDistance(userLocation[0], userLocation[1], TARGET_COORDS[0], TARGET_COORDS[1]);

    setDistanceToNext(distToSegmentTarget);
    setTotalDistance(distToFinal);

    // Проверка отклонения от маршрута
    if (fullRouteCoords.length > 0) {
      const devDist = getMinDistanceToRoute(userLocation, fullRouteCoords);
      setDeviationDistance(devDist);
    }

    sounds.playRadarPing(distToSegmentTarget);

    // Финиш
    if (distToFinal <= 15) {
      setIsFinished(true);
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      return;
    }

    // Открытие следующего 50м отрезка
    if (distToSegmentTarget <= 15 && currentSegmentIdx < routeSegments.length - 1) {
      setCurrentSegmentIdx((prev) => prev + 1);
      sounds.playSegmentUnlock();
    }
  }, [userLocation, routeSegments, currentSegmentIdx, isFinished, fullRouteCoords]);

  const currentSegmentTarget = routeSegments[currentSegmentIdx]?.targetPoint || TARGET_COORDS;
  const bearingToNext = getBearing(userLocation[0], userLocation[1], currentSegmentTarget[0], currentSegmentTarget[1]);
  const arrowAngle = (bearingToNext - heading + 360) % 360;

  // Симулятор для тестирования с ПК
  const simulateStep = () => {
    if (!routeSegments[currentSegmentIdx]) return;
    const nextPt = routeSegments[currentSegmentIdx].targetPoint;
    setUserLocation(nextPt);
  };

  const handleResetQuest = () => {
    if (confirm('Сбросить прогресс квеста?')) {
      setCurrentSegmentIdx(0);
      setIsFinished(false);
      setUserLocation(START_COORDS);
      localStorage.removeItem(STORAGE_KEYS.SEGMENT_IDX);
      localStorage.removeItem(STORAGE_KEYS.IS_FINISHED);
    }
  };

  const totalSteps = routeSegments.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentSegmentIdx + 1) / totalSteps) * 100));

  // Показываем экран загрузки при первом кэшировании
  if (cacheProgress < 100) {
    return <LoadingScreen progress={cacheProgress} />;
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-zinc-950 font-mono select-none flex flex-col justify-between">
      {/* 1. КАРТА НА ВЕСЬ ЭКРАН (работает в фоне) */}
      <MapView
        userLocation={userLocation}
        visibleSegments={routeSegments.slice(0, currentSegmentIdx + 1)}
        currentSegmentTarget={currentSegmentTarget}
      />

      {/* 2. ПОЛНОЭКРАННЫЙ РАДАР (с быстрой кнопкой возврата) */}
      {viewMode === 'radar' && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-lg flex flex-col justify-between p-4 pb-6 animate-in fade-in duration-200">
          {/* Верхняя панель радара */}
          <div className="flex justify-between items-center bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl">
            <div>
              <h2 className="text-xs font-bold text-emerald-400 tracking-widest">ТАКТИЧЕСКИЙ РАДАР</h2>
              <p className="text-[10px] text-zinc-400">Шаг наведения: 50 метров</p>
            </div>
            <button
              onClick={() => setViewMode('map')}
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95"
            >
              <MapIcon size={14} /> КАРТА
            </button>
          </div>

          {/* Сам радар по центру */}
          <RadarScreen
            arrowAngle={arrowAngle}
            distanceToNext={distanceToNext}
            totalDistance={totalDistance}
            accuracy={gpsAccuracy}
          />

          {/* Нижняя кнопка возврата */}
          <button
            onClick={() => setViewMode('map')}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all"
          >
            <MapIcon size={16} /> ВЕРНУТЬСЯ К КАРТЕ
          </button>
        </div>
      )}

      {/* 3. ВЕРХНИЙ ХУД НАД КАРТОЙ */}
      <div className="relative z-30 m-4 flex justify-between items-center bg-zinc-900/85 backdrop-blur-md border border-zinc-800/90 p-3 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-emerald-400 tracking-wider">СЕКТОР: НАСТЯ</div>
            <div className="text-[10px] text-zinc-400">
              {gpsAccuracy ? `GPS: ±${gpsAccuracy}м` : 'Калибровка спутников...'}
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

          {/* Кнопка переключения на большой радар */}
          <button
            onClick={() => {
              if (!audioStarted) enableSensors();
              setViewMode('radar');
            }}
            className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow"
          >
            <Radio size={16} className="text-emerald-400 animate-pulse" />
            <span>РАДАР</span>
          </button>
        </div>
      </div>

      {/* 4. ПРЕДУПРЕЖДЕНИЕ ОБ ОТКЛОНЕНИИ (>= 200м) */}
      {deviationDistance >= 200 && (
        <OffRouteAlert deviationDistance={deviationDistance} />
      )}

      {/* 5. НИЖНИЙ ХУД (Мини-радар + Индикаторы 50м) */}
      <div className="relative z-30 m-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 p-3.5 sm:p-4 rounded-3xl shadow-2xl space-y-2.5">
        <div className="flex items-center gap-3.5">
          {/* Мини-радар (клик открывает большой радар) */}
          <MiniRadar
            arrowAngle={arrowAngle}
            distanceToNext={distanceToNext}
            onClick={() => {
              if (!audioStarted) enableSensors();
              setViewMode('radar');
            }}
          />

          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
              <Footprints size={12} className="text-emerald-400 flex-shrink-0" /> СЛЕДУЮЩИЙ РУБЕЖ (+50М)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 leading-tight">
              {distanceToNext} м
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 flex justify-between mt-0.5">
              <span>До финиша: <b className="text-zinc-200">{totalDistance} м</b></span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Прогресс-бар рубежей */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_8px_#10b981]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Панель симулятора */}
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
                className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40 flex items-center gap-1 active:scale-95 font-bold"
              >
                <Play size={10} /> +50м шаг
              </button>
            )}
            <button
              onClick={handleResetQuest}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg flex items-center gap-1 active:scale-95"
              title="Сбросить к началу"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Экран победы */}
      {isFinished && <SuccessModal onReset={handleResetQuest} />}
    </div>
  );
      }
